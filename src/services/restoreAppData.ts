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

function validTimestamp(value: unknown): value is string { return typeof value === 'string' && Number.isFinite(Date.parse(value)) }
function isAuthoritativeClear(value: HeartTalkHistoryTombstone) {
  return value.kind === 'all-before' && value.authority === 'server-snapshot' && validTimestamp(value.snapshotAt)
}
function isPendingClear(value: HeartTalkHistoryTombstone | Record<string, unknown>) {
  return value.kind === 'pending-clear' || (value.kind === 'all-before' && !isAuthoritativeClear(value as HeartTalkHistoryTombstone))
}
function mergeTombstones(current: HeartTalkHistoryTombstone[], imported: HeartTalkHistoryTombstone[] | undefined) {
  if (!imported) return current
  const invitations = new Map<string, HeartTalkHistoryTombstone>()
  for (const record of [...current, ...imported]) {
    if (record.kind !== 'invitation') continue
    const prior = invitations.get(record.id)
    if (!prior || Date.parse(record.deletedAt) > Date.parse((prior as Extract<HeartTalkHistoryTombstone, { kind: 'invitation' }>).deletedAt)) invitations.set(record.id, record)
  }
  const clears = [...current, ...imported]
  if (clears.some((record) => isPendingClear(record as HeartTalkHistoryTombstone | Record<string, unknown>))) {
    const pending: HeartTalkHistoryTombstone = { id: 'heart-talk:pending-clear', kind: 'pending-clear', createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() }
    return [...invitations.values(), pending]
  }
  const anchors = clears.filter(isAuthoritativeClear)
  const newest = anchors.sort((left, right) => Date.parse((right as Extract<HeartTalkHistoryTombstone, { kind: 'all-before' }>).snapshotAt) - Date.parse((left as Extract<HeartTalkHistoryTombstone, { kind: 'all-before' }>).snapshotAt))[0]
  return newest ? [...invitations.values(), newest] : [...invitations.values()]
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
  const tombstones = mergeTombstones(currentTombstones, importedTombstones)
  const pendingClear = tombstones.some((record) => isPendingClear(record as HeartTalkHistoryTombstone | Record<string, unknown>))
  const allBefore = tombstones.find(isAuthoritativeClear)
  const explicitlyDeleted = new Set((tombstones ?? []).filter((record) => record.kind === 'invitation').map((record) => `${record.pairId}:${record.invitationId}`))
  const terminalHistory = (plan.replace.heartTalkTerminalHistory as Array<{ pairId: string; invitationId: string; terminalAt: string }> | undefined)?.filter((record) => !pendingClear && !explicitlyDeleted.has(`${record.pairId}:${record.invitationId}`) && (!allBefore || record.terminalAt > (allBefore as Extract<HeartTalkHistoryTombstone, { kind: 'all-before' }>).snapshotAt))
  const liveCloudIds = new Set((terminalHistory ?? []).map((record) => `${record.pairId}:${record.invitationId}`))
  const completedHeartTalks = (plan.replace.completedHeartTalks as Array<{ sourcePairId?: string; sourceInvitationId?: string }>).filter((record) => !record.sourcePairId || !record.sourceInvitationId || liveCloudIds.has(`${record.sourcePairId}:${record.sourceInvitationId}`))
  const replace = { ...plan.replace, completedHeartTalks, ...(terminalHistory ? { heartTalkTerminalHistory: terminalHistory } : {}), heartTalkHistoryTombstones: tombstones, settings: [settings ?? plan.data.data.settings] }
  await runtime.adapter.restoreStoresAtomically(replace, RESTORE_CLEAR_STORES)
}
