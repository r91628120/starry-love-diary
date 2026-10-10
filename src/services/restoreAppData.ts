import type { PersistenceRuntime } from '../data/persistence'
import type { StoreName } from '../data/storage/StorageAdapter'
import type { AppSettings, HeartTalkHistoryTombstone } from '../data/types'
import { parseAppDataFile, parseAppDataFileText } from './importAppData'
import type { AppDataExport } from './exportAppData'

export const RESTORE_REPLACE_STORES = ['profiles', 'moods', 'diaries', 'stars', 'scoreAwards', 'heartPhrases', 'importantDates', 'memoryMoments', 'messageToYou', 'rememberedYouCards', 'clearRecords', 'clearFreeTalkRecords', 'loveBoatAssessments', 'loveBrainAssessments', 'likeOrHabitReflections', 'completedHeartTalks', 'heartTalkTerminalHistory', 'heartTalkHistoryTombstones'] as const
export const RESTORE_CLEAR_STORES = ['diaryDrafts', 'starDropPresentations', 'heartTalkSyncState'] as const
export type RestorePlan = { data: AppDataExport; replace: Partial<Record<StoreName, unknown[]>> }

function assertUnique(records: Array<{ id: string }>, name: string) {
  const ids = new Set<string>()
  for (const record of records) { if (ids.has(record.id)) throw new Error(`Duplicate id in ${name}`); ids.add(record.id) }
}

export function buildRestorePlan(data: AppDataExport): RestorePlan {
  const profiles = data.data.profiles
  if (profiles.length !== 2 || new Set(profiles.map((profile) => profile.kind)).size !== 2 || !profiles.some((profile) => profile.kind === 'user') || !profiles.some((profile) => profile.kind === 'partner')) throw new Error('Restore requires user and partner profiles')
  const replace: RestorePlan['replace'] = {
    profiles, moods: data.data.moods, diaries: data.data.diaries, stars: data.data.stars, scoreAwards: data.data.scoreAwards,
    heartPhrases: data.data.heartPhrases, importantDates: data.data.importantDates, memoryMoments: data.data.memoryMoments,
    messageToYou: data.data.messageToYouEntries, rememberedYouCards: data.data.rememberedYouCards,
    clearRecords: data.data.clearRecords.organizeFeelings, clearFreeTalkRecords: data.data.clearRecords.freeTalkRecords, loveBoatAssessments: data.data.clearRecords.loveBoatAssessments,
    loveBrainAssessments: data.data.clearRecords.loveBrainAssessments, likeOrHabitReflections: data.data.clearRecords.likeOrHabitReflections, completedHeartTalks: data.data.completedHeartTalks ?? [], ...(data.data.heartTalkTerminalHistory === undefined ? {} : { heartTalkTerminalHistory: data.data.heartTalkTerminalHistory }), ...(data.data.heartTalkHistoryTombstones === undefined ? {} : { heartTalkHistoryTombstones: data.data.heartTalkHistoryTombstones }),
  }
  for (const store of RESTORE_REPLACE_STORES) assertUnique((replace[store] ?? []) as Array<{ id: string }>, store)
  return { data, replace }
}

export function normalizeRestoreText(content: string) { return buildRestorePlan(parseAppDataFileText(content)) }
export async function normalizeRestoreFile(file: File) { return buildRestorePlan(await parseAppDataFile(file)) }

export async function restoreAppData(runtime: Pick<PersistenceRuntime, 'adapter'>, plan: RestorePlan) {
  const settings = await runtime.adapter.get<AppSettings>('settings', 'settings')
  const currentTombstones = await runtime.adapter.getAll<HeartTalkHistoryTombstone>('heartTalkHistoryTombstones')
  const importedTombstones = plan.replace.heartTalkHistoryTombstones as HeartTalkHistoryTombstone[] | undefined
  const tombstones = importedTombstones ? [...new Map([...currentTombstones, ...importedTombstones].map((record) => [record.id, record])).values()] : undefined
  const allBefore = tombstones?.find((record) => record.kind === 'all-before')
  const explicitlyDeleted = new Set((tombstones ?? []).filter((record) => record.kind === 'invitation').map((record) => `${record.pairId}:${record.invitationId}`))
  const terminalHistory = (plan.replace.heartTalkTerminalHistory as Array<{ pairId: string; invitationId: string; terminalAt: string }> | undefined)?.filter((record) => !explicitlyDeleted.has(`${record.pairId}:${record.invitationId}`) && (!allBefore || record.terminalAt > allBefore.clearedAt))
  const liveCloudIds = new Set((terminalHistory ?? []).map((record) => `${record.pairId}:${record.invitationId}`))
  const completedHeartTalks = (plan.replace.completedHeartTalks as Array<{ sourcePairId?: string; sourceInvitationId?: string }>).filter((record) => !record.sourcePairId || !record.sourceInvitationId || liveCloudIds.has(`${record.sourcePairId}:${record.sourceInvitationId}`))
  const replace = { ...plan.replace, completedHeartTalks, ...(terminalHistory ? { heartTalkTerminalHistory: terminalHistory } : {}), ...(tombstones ? { heartTalkHistoryTombstones: tombstones } : {}), settings: [settings ?? plan.data.data.settings] }
  await runtime.adapter.restoreStoresAtomically(replace, RESTORE_CLEAR_STORES)
}
