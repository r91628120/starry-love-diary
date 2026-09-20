import type { LikeOrHabitReflection, LoveBoatAssessment, LoveBrainAssessment, ClearRecord } from '../data/clearTypes'
import type { PersistenceRuntime } from '../data/persistence'
import { SCHEMA_VERSION } from '../data/storage/IndexedDbStorageAdapter'
import type { StoreName } from '../data/storage/StorageAdapter'
import { MESSAGE_TO_YOU_TYPES, type AppSettings, type DiaryEntry, type HeartPhrase, type ImportantDate, type MemoryMoment, type MessageToYouEntry, type MoodKey, type MoodRecord, type Profile, type RememberedYouCard, type ScoreAward, type Star } from '../data/types'
import { STARLOVE_EXPORT_FORMAT, STARLOVE_EXPORT_VERSION, type AppDataExport } from './exportAppData'

export type AppDataImportRuntime = Pick<PersistenceRuntime, 'adapter' | 'photos' | 'profiles' | 'moods' | 'diaries' | 'settings' | 'stars' | 'scores' | 'heartPhrases' | 'importantDates' | 'memoryMoments' | 'messageToYou' | 'rememberedYou' | 'clearRecords' | 'loveBoatAssessments' | 'loveBrainAssessments' | 'likeOrHabitReflections'>

export const MAX_APP_DATA_IMPORT_BYTES = 10 * 1024 * 1024

export type AppDataImportErrorCode = 'file_too_large' | 'file_read_failed' | 'invalid_json' | 'invalid_format' | 'unsupported_export_version' | 'newer_schema' | 'invalid_data'
export class AppDataImportError extends Error {
  constructor(readonly code: AppDataImportErrorCode) { super(code) }
}

type ImportableData = AppDataExport['data']
type ImportedSettings = ImportableData['settings']
type MergeAction<T> = { add: T[]; update: T[]; skip: T[] }
export interface AppDataImportPlan {
  data: ImportableData
  profiles: MergeAction<Profile>
  moods: MergeAction<MoodRecord>
  diaries: MergeAction<DiaryEntry>
  clearRecords: MergeAction<ClearRecord>
  loveBoatAssessments: MergeAction<LoveBoatAssessment>
  loveBrainAssessments: MergeAction<LoveBrainAssessment>
  likeOrHabitReflections: MergeAction<LikeOrHabitReflection>
  stars: MergeAction<Star>
  scoreAwards: MergeAction<ScoreAward>
  heartPhrases: MergeAction<HeartPhrase>
  importantDates: MergeAction<ImportantDate>
  memoryMoments: MergeAction<MemoryMoment>
  messageToYou: MergeAction<MessageToYouEntry>
  rememberedYouCards: MergeAction<RememberedYouCard>
  settings: MergeAction<ImportedSettings>
}
export interface ImportSummary { added: number; updated: number; skipped: number; categories: number }

const moodKeys: MoodKey[] = ['flutter', 'happy', 'peaceful', 'miss', 'uneasy', 'sad', 'rumination']
const awardTypes = ['daily_open', 'diary_created', 'mood_selected', 'clear_completed', 'quote_shared']
const starTypes = ['mood', 'clear_mind']
const importantDateTypes = ['first_chat', 'first_meeting', 'first_date', 'confession', 'dating', 'birthday', 'anniversary', 'trip', 'custom']
const localDatePattern = /^\d{4}-\d{2}-\d{2}$/u

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AppDataImportError('invalid_data')
  return value as Record<string, unknown>
}
function text(value: unknown) { if (typeof value !== 'string') throw new AppDataImportError('invalid_data'); return value }
function optionalText(value: unknown) { if (value === undefined || value === null) return undefined; return text(value) }
function boolean(value: unknown) { if (typeof value !== 'boolean') throw new AppDataImportError('invalid_data'); return value }
function number(value: unknown) { if (typeof value !== 'number' || !Number.isFinite(value)) throw new AppDataImportError('invalid_data'); return value }
function timestamp(value: unknown) { const result = text(value); if (Number.isNaN(Date.parse(result))) throw new AppDataImportError('invalid_data'); return result }
function localDate(value: unknown) { const result = text(value); if (!localDatePattern.test(result) || Number.isNaN(Date.parse(`${result}T00:00:00Z`))) throw new AppDataImportError('invalid_data'); return result }
function enumValue<T extends string>(value: unknown, values: readonly T[]) { const result = text(value); if (!values.includes(result as T)) throw new AppDataImportError('invalid_data'); return result as T }
function array(value: unknown) { if (!Array.isArray(value)) throw new AppDataImportError('invalid_data'); return value }
function base(record: Record<string, unknown>) { return { id: text(record.id), createdAt: timestamp(record.createdAt), updatedAt: timestamp(record.updatedAt) } }
function datedBase(record: Record<string, unknown>) { return { ...base(record), localDate: localDate(record.localDate), timezone: text(record.timezone) } }

function validateProfile(value: unknown): Profile {
  const record = object(value); const kind = enumValue(record.kind, ['user', 'partner'] as const)
  return { ...base(record), id: kind, kind, nickname: text(record.nickname), birthday: optionalText(record.birthday) }
}
function validateMood(value: unknown): MoodRecord { const record = object(value); return { ...datedBase(record), mood: enumValue(record.mood, moodKeys) } }
function validateDiary(value: unknown): DiaryEntry { const record = object(value); const mood = record.mood === undefined ? undefined : enumValue(record.mood, moodKeys); return { ...datedBase(record), title: optionalText(record.title), content: text(record.content), mood, linkedClearMindId: optionalText(record.linkedClearMindId), savedAsStar: boolean(record.savedAsStar) } }
function validateStar(value: unknown): Star { const record = object(value); const mood = record.mood === undefined ? undefined : enumValue(record.mood, moodKeys); return { ...datedBase(record), type: enumValue(record.type, starTypes) as Star['type'], sourceId: optionalText(record.sourceId), title: optionalText(record.title), content: text(record.content), mood, sourceType: optionalText(record.sourceType) } }
function validateAward(value: unknown): ScoreAward { const record = object(value); return { ...datedBase(record), awardType: enumValue(record.awardType, awardTypes) as ScoreAward['awardType'], points: number(record.points), sourceId: optionalText(record.sourceId) } }
function validateHeartPhrase(value: unknown): HeartPhrase { const record = object(value); return { ...base(record), content: text(record.content), order: number(record.order), acceptedAt: timestamp(record.acceptedAt) } }
function validateImportantDate(value: unknown): ImportantDate { const record = object(value); return { ...base(record), type: enumValue(record.type, importantDateTypes) as ImportantDate['type'], title: text(record.title), date: localDate(record.date), description: optionalText(record.description), reminderEnabled: record.reminderEnabled === undefined ? undefined : boolean(record.reminderEnabled) } }
function validateMoment(value: unknown): MemoryMoment { const record = object(value); if (record.timezone !== undefined) text(record.timezone); return { ...base(record), localDate: localDate(record.localDate), title: optionalText(record.title), content: text(record.content), order: number(record.order) } }
function validateMessageEntry(value: unknown): MessageToYouEntry { const record=object(value); const createdAt=timestamp(record.createdAt); return {...base(record),localDate:record.localDate === undefined ? createdAt.slice(0, 10) : localDate(record.localDate),timezone:record.timezone === undefined ? 'UTC' : text(record.timezone),type:enumValue(record.type,MESSAGE_TO_YOU_TYPES),content:text(record.content)} }
function validateRemembered(value: unknown): RememberedYouCard { const record = object(value); if (record.timezone !== undefined) text(record.timezone); return { ...base(record), localDate: localDate(record.localDate), title: text(record.title), content: text(record.content), isFavorite: boolean(record.isFavorite) } }
function objectMap(value: unknown) { return value === undefined ? undefined : object(value) }
function stringArray(value: unknown) { return value === undefined ? undefined : array(value).map(text) }
function validateClear(value: unknown): ClearRecord {
  const record = object(value)
  return { ...datedBase(record), triggerType: optionalText(record.triggerType) as ClearRecord['triggerType'], triggerText: optionalText(record.triggerText), facts: optionalText(record.facts), interpretation: optionalText(record.interpretation), unknown: optionalText(record.unknown), emotions: array(record.emotions).map(text) as ClearRecord['emotions'], emotionIntensity: number(record.emotionIntensity) as ClearRecord['emotionIntensity'], bodySensations: stringArray(record.bodySensations) as ClearRecord['bodySensations'], observations: objectMap(record.observations) as ClearRecord['observations'], needs: stringArray(record.needs) as ClearRecord['needs'], nextActionType: optionalText(record.nextActionType) as ClearRecord['nextActionType'], nextActionText: optionalText(record.nextActionText), clearMindStarId: optionalText(record.clearMindStarId), completedAt: timestamp(record.completedAt) }
}
function validateAssessment<T extends LoveBoatAssessment | LoveBrainAssessment | LikeOrHabitReflection>(value: unknown): T {
  const record = object(value); const status = enumValue(record.status, ['draft', 'completed'] as const)
  const common = { ...datedBase(record), status, clearMindStarId: optionalText(record.clearMindStarId), completedAt: record.completedAt === undefined ? undefined : timestamp(record.completedAt) }
  if ('aAnswers' in record) return { ...common, currentSection: enumValue(record.currentSection, ['A', 'B', 'result'] as const), currentQuestionIndex: number(record.currentQuestionIndex), aAnswers: object(record.aAnswers), bAnswers: object(record.bAnswers), aScore: record.aScore === undefined ? undefined : number(record.aScore), aLevel: optionalText(record.aLevel), bAnsweredItems: record.bAnsweredItems === undefined ? undefined : number(record.bAnsweredItems), bEarnedScore: record.bEarnedScore === undefined ? undefined : number(record.bEarnedScore), bMaxPossibleScore: record.bMaxPossibleScore === undefined ? undefined : number(record.bMaxPossibleScore), bResponseRatio: record.bResponseRatio === undefined ? undefined : number(record.bResponseRatio), bLevel: optionalText(record.bLevel), crossResultKey: optionalText(record.crossResultKey), resultVariantIndex: record.resultVariantIndex === undefined ? undefined : number(record.resultVariantIndex) } as T
  if ('currentQuestionIndex' in record) return { ...common, answers: object(record.answers), currentQuestionIndex: number(record.currentQuestionIndex), scores: record.scores === undefined ? undefined : object(record.scores), primaryPattern: optionalText(record.primaryPattern), primaryPatterns: record.primaryPatterns === undefined ? undefined : stringArray(record.primaryPatterns), secondaryPattern: optionalText(record.secondaryPattern), isLowOverall: record.isLowOverall === undefined ? undefined : boolean(record.isLowOverall), resultVariantIndex: record.resultVariantIndex === undefined ? undefined : number(record.resultVariantIndex), resultVariantKey: optionalText(record.resultVariantKey) } as T
  return { ...common, currentSection: text(record.currentSection), answers: object(record.answers), realPersonNote: optionalText(record.realPersonNote), habitNote: optionalText(record.habitNote), activeResultModules: record.activeResultModules === undefined ? undefined : stringArray(record.activeResultModules), resultCombinationKey: optionalText(record.resultCombinationKey), resultVariantKey: optionalText(record.resultVariantKey) } as unknown as T
}
function validateSettings(value: unknown): ImportedSettings { const record = object(value); return { id: text(record.id) as 'settings', locale: enumValue(record.locale, ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const), dailyLoveQuoteActivationDate: localDate(record.dailyLoveQuoteActivationDate), loveQuoteReminderEnabled: boolean(record.loveQuoteReminderEnabled), importantDateReminderEnabled: boolean(record.importantDateReminderEnabled), reminderTime: text(record.reminderTime), schemaVersion: number(record.schemaVersion), createdAt: timestamp(record.createdAt), updatedAt: timestamp(record.updatedAt) } }

/** Runtime validation and whitelist mapping for the Export App Data V1 contract. */
export function validateAppDataExport(value: unknown): AppDataExport {
  const root = object(value)
  if (root.format !== STARLOVE_EXPORT_FORMAT) throw new AppDataImportError('invalid_format')
  if (root.exportVersion !== STARLOVE_EXPORT_VERSION) throw new AppDataImportError('unsupported_export_version')
  const app = object(root.app)
  if (number(app.schemaVersion) > SCHEMA_VERSION) throw new AppDataImportError('newer_schema')
  const data = object(root.data)
  const clear = object(data.clearRecords)
  const message = data.messageToYou === undefined || data.messageToYou === null ? undefined : (() => { const record = object(data.messageToYou); const createdAt=timestamp(record.createdAt); const date=new Date(createdAt); return { id: text(record.id), type:'free_message' as const, content:text(record.content), localDate: date.toISOString().slice(0,10), timezone:'UTC', createdAt, updatedAt:timestamp(record.updatedAt) } })()
  const messageEntries = data.messageToYouEntries === undefined ? [] : array(data.messageToYouEntries).map(validateMessageEntry)
  const mergedMessages = [...new Map([...(message?[message]:[]),...messageEntries].map(entry=>[entry.id,entry])).values()]
  return {
    format: STARLOVE_EXPORT_FORMAT,
    exportVersion: STARLOVE_EXPORT_VERSION,
    app: { name: 'Starry Love Diary', schemaVersion: number(app.schemaVersion) },
    exportedAt: timestamp(root.exportedAt),
    exportedLocalDate: localDate(root.exportedLocalDate),
    data: {
      profiles: array(data.profiles).map(validateProfile), moods: array(data.moods).map(validateMood), diaries: array(data.diaries).map(validateDiary),
      clearRecords: { organizeFeelings: array(clear.organizeFeelings).map(validateClear), loveBoatAssessments: array(clear.loveBoatAssessments).map(validateAssessment<LoveBoatAssessment>), loveBrainAssessments: array(clear.loveBrainAssessments).map(validateAssessment<LoveBrainAssessment>), likeOrHabitReflections: array(clear.likeOrHabitReflections).map(validateAssessment<LikeOrHabitReflection>) },
      stars: array(data.stars).map(validateStar), scoreAwards: array(data.scoreAwards).map(validateAward), heartPhrases: array(data.heartPhrases).map(validateHeartPhrase), importantDates: array(data.importantDates).map(validateImportantDate), memoryMoments: array(data.memoryMoments).map(validateMoment), messageToYou: message ? {id:'message-to-you',content:message.content,createdAt:message.createdAt,updatedAt:message.updatedAt} : null, messageToYouEntries: mergedMessages, rememberedYouCards: array(data.rememberedYouCards).map(validateRemembered), settings: validateSettings(data.settings),
    },
  }
}

export function parseAppDataFileText(content: string) {
  if (!content.trim()) throw new AppDataImportError('invalid_json')
  try { return validateAppDataExport(JSON.parse(content)) } catch (error) {
    if (error instanceof AppDataImportError) throw error
    throw new AppDataImportError('invalid_json')
  }
}
export async function parseAppDataFile(file: File) {
  if (file.size > MAX_APP_DATA_IMPORT_BYTES) throw new AppDataImportError('file_too_large')
  try { return parseAppDataFileText(await file.text()) } catch (error) {
    if (error instanceof AppDataImportError) throw error
    throw new AppDataImportError('file_read_failed')
  }
}

function merge<T extends { id: string; updatedAt: string }>(incoming: T[], current: T[]): MergeAction<T> {
  const existing = new Map(current.map((record) => [record.id, record]))
  const seen = new Set<string>()
  const result: MergeAction<T> = { add: [], update: [], skip: [] }
  for (const record of incoming) {
    if (seen.has(record.id)) throw new AppDataImportError('invalid_data')
    seen.add(record.id)
    const prior = existing.get(record.id)
    if (!prior) result.add.push(record)
    else if (Date.parse(record.updatedAt) > Date.parse(prior.updatedAt)) result.update.push(record)
    else result.skip.push(record)
  }
  return result
}

async function current<T extends { id: string }>(runtime: AppDataImportRuntime, store: StoreName) { return runtime.adapter.getAll<T>(store) }
export async function buildImportPlan(runtime: AppDataImportRuntime, exportData: AppDataExport): Promise<AppDataImportPlan> {
  const data = exportData.data
  const [profiles, moods, diaries, clearRecords, boats, brains, reflections, stars, awards, phrases, dates, moments, messages, remembered, settings] = await Promise.all([
    current<Profile>(runtime, 'profiles'), current<MoodRecord>(runtime, 'moods'), current<DiaryEntry>(runtime, 'diaries'), current<ClearRecord>(runtime, 'clearRecords'), current<LoveBoatAssessment>(runtime, 'loveBoatAssessments'), current<LoveBrainAssessment>(runtime, 'loveBrainAssessments'), current<LikeOrHabitReflection>(runtime, 'likeOrHabitReflections'), current<Star>(runtime, 'stars'), current<ScoreAward>(runtime, 'scoreAwards'), current<HeartPhrase>(runtime, 'heartPhrases'), current<ImportantDate>(runtime, 'importantDates'), current<MemoryMoment>(runtime, 'memoryMoments'), current<MessageToYouEntry>(runtime, 'messageToYou'), current<RememberedYouCard>(runtime, 'rememberedYouCards'), current<AppSettings>(runtime, 'settings'),
  ])
  return { data, profiles: merge(data.profiles, profiles), moods: merge(data.moods, moods), diaries: merge(data.diaries, diaries), clearRecords: merge(data.clearRecords.organizeFeelings, clearRecords), loveBoatAssessments: merge(data.clearRecords.loveBoatAssessments, boats), loveBrainAssessments: merge(data.clearRecords.loveBrainAssessments, brains), likeOrHabitReflections: merge(data.clearRecords.likeOrHabitReflections, reflections), stars: merge(data.stars, stars), scoreAwards: merge(data.scoreAwards, awards), heartPhrases: merge(data.heartPhrases, phrases), importantDates: merge(data.importantDates, dates), memoryMoments: merge(data.memoryMoments, moments), messageToYou: merge(data.messageToYouEntries, messages), rememberedYouCards: merge(data.rememberedYouCards, remembered), settings: merge(data.settings ? [data.settings] : [], settings) }
}

function importedRecords<T>(action: MergeAction<T>) { return [...action.add, ...action.update] }
async function write<T extends { id: string }>(runtime: AppDataImportRuntime, store: StoreName, entries: T[]) { await Promise.all(entries.map((record) => runtime.adapter.put(store, record))) }
async function validLocalPhotoAssetId(runtime: AppDataImportRuntime, photoAssetId: string | null | undefined) {
  if (!photoAssetId) return undefined
  return await runtime.photos.getRenderableThumbnail(photoAssetId) ? photoAssetId : undefined
}
export async function applyImportPlan(runtime: AppDataImportRuntime, plan: AppDataImportPlan) {
  const currentProfiles = new Map((await current<Profile>(runtime, 'profiles')).map((record) => [record.id, record]))
  const currentMoments = new Map((await current<MemoryMoment>(runtime, 'memoryMoments')).map((record) => [record.id, record]))
  const currentSettings = await runtime.settings.getSettings()
  const profiles = await Promise.all(importedRecords(plan.profiles).map(async (record) => {
    const photoAssetId = await validLocalPhotoAssetId(runtime, currentProfiles.get(record.id)?.photoAssetId)
    return photoAssetId ? { ...record, photoAssetId } : record
  }))
  const moments = await Promise.all(importedRecords(plan.memoryMoments).map(async (record) => {
    const photoAssetId = await validLocalPhotoAssetId(runtime, currentMoments.get(record.id)?.photoAssetId)
    return photoAssetId ? { ...record, photoAssetId } : record
  }))
  const settings = importedRecords(plan.settings).map((record) => ({ ...record, schemaVersion: SCHEMA_VERSION, onboardingCompleted: currentSettings?.onboardingCompleted ?? true }))
  await Promise.all([
    write(runtime, 'profiles', profiles), write(runtime, 'moods', importedRecords(plan.moods)), write(runtime, 'diaries', importedRecords(plan.diaries)), write(runtime, 'clearRecords', importedRecords(plan.clearRecords)), write(runtime, 'loveBoatAssessments', importedRecords(plan.loveBoatAssessments)), write(runtime, 'loveBrainAssessments', importedRecords(plan.loveBrainAssessments)), write(runtime, 'likeOrHabitReflections', importedRecords(plan.likeOrHabitReflections)), write(runtime, 'stars', importedRecords(plan.stars)), write(runtime, 'scoreAwards', importedRecords(plan.scoreAwards)), write(runtime, 'heartPhrases', importedRecords(plan.heartPhrases)), write(runtime, 'importantDates', importedRecords(plan.importantDates)), write(runtime, 'memoryMoments', moments), write(runtime, 'messageToYou', importedRecords(plan.messageToYou)), write(runtime, 'rememberedYouCards', importedRecords(plan.rememberedYouCards)), write(runtime, 'settings', settings),
  ])
  return summarizeImportPlan(plan)
}

export function summarizeImportPlan(plan: AppDataImportPlan): ImportSummary {
  const actions = [plan.profiles, plan.moods, plan.diaries, plan.clearRecords, plan.loveBoatAssessments, plan.loveBrainAssessments, plan.likeOrHabitReflections, plan.stars, plan.scoreAwards, plan.heartPhrases, plan.importantDates, plan.memoryMoments, plan.messageToYou, plan.rememberedYouCards, plan.settings]
  return { added: actions.reduce((count, action) => count + action.add.length, 0), updated: actions.reduce((count, action) => count + action.update.length, 0), skipped: actions.reduce((count, action) => count + action.skip.length, 0), categories: actions.filter((action) => action.add.length + action.update.length + action.skip.length > 0).length }
}
