import type { ClearRecord, LikeOrHabitReflection, LoveBoatAssessment, LoveBrainAssessment } from '../data/clearTypes'
import type { PersistenceRuntime } from '../data/persistence'
import { SCHEMA_VERSION } from '../data/storage/IndexedDbStorageAdapter'
import type { AppSettings, DiaryEntry, HeartPhrase, ImportantDate, MemoryMoment, MessageToYouEntry, MoodRecord, Profile, RememberedYouCard, ScoreAward, Star } from '../data/types'

type ExportRepositories = Pick<PersistenceRuntime, 'profiles' | 'moods' | 'diaries' | 'settings' | 'stars' | 'scores' | 'heartPhrases' | 'importantDates' | 'memoryMoments' | 'messageToYou' | 'rememberedYou' | 'clearRecords' | 'loveBoatAssessments' | 'loveBrainAssessments' | 'likeOrHabitReflections'>

export const STARLOVE_EXPORT_FORMAT = 'starry-love-diary-data'
export const STARLOVE_EXPORT_VERSION = 1

export interface AppDataExport {
  format: typeof STARLOVE_EXPORT_FORMAT
  exportVersion: typeof STARLOVE_EXPORT_VERSION
  app: { name: 'Starry Love Diary'; schemaVersion: number }
  exportedAt: string
  exportedLocalDate: string
  data: {
    profiles: Array<Omit<Profile, 'photoAssetId'>>
    moods: MoodRecord[]
    diaries: DiaryEntry[]
    clearRecords: {
      organizeFeelings: ClearRecord[]
      loveBoatAssessments: LoveBoatAssessment[]
      loveBrainAssessments: LoveBrainAssessment[]
      likeOrHabitReflections: LikeOrHabitReflection[]
    }
    stars: Star[]
    scoreAwards: ScoreAward[]
    heartPhrases: HeartPhrase[]
    importantDates: ImportantDate[]
    memoryMoments: Array<Omit<MemoryMoment, 'photoAssetId'>>
    messageToYou: { id: 'message-to-you'; content: string; createdAt: string; updatedAt: string } | null
    messageToYouEntries: MessageToYouEntry[]
    rememberedYouCards: RememberedYouCard[]
    settings: Pick<AppSettings, 'id' | 'locale' | 'dailyLoveQuoteActivationDate' | 'loveQuoteReminderEnabled' | 'importantDateReminderEnabled' | 'reminderTime' | 'schemaVersion' | 'createdAt' | 'updatedAt'>
  }
}

export interface AppDataExportOptions {
  repositories: ExportRepositories
  localDate: string
  exportedAt?: string
}

export interface AppDataExportResult {
  filename: string
  content: string
  data: AppDataExport
}

function compareStrings(left: string, right: string) { return left < right ? -1 : left > right ? 1 : 0 }
function sortByLocalDate<T extends { localDate: string; createdAt: string; id: string }>(records: T[]) {
  return [...records].sort((a, b) => compareStrings(a.localDate, b.localDate) || compareStrings(a.createdAt, b.createdAt) || compareStrings(a.id, b.id))
}
function withoutProfilePhoto({ photoAssetId, ...profile }: Profile): Omit<Profile, 'photoAssetId'> { void photoAssetId; return profile }
function withoutMomentPhoto({ photoAssetId, ...moment }: MemoryMoment): Omit<MemoryMoment, 'photoAssetId'> { void photoAssetId; return moment }

/** Builds a portable, JSON-only snapshot. Photos, blobs, asset ids, and layout metadata are deliberately excluded. */
export async function buildAppDataExport(options: AppDataExportOptions): Promise<AppDataExport> {
  const { repositories, localDate } = options
  const [user, partner, moods, diaries, settings, stars, scoreAwards, heartPhrases, importantDates, memoryMoments, messageToYou, messageToYouEntries, rememberedYouCards, organizeFeelings, loveBoatAssessments, loveBrainAssessments, likeOrHabitReflections] = await Promise.all([
    repositories.profiles.getProfile('user'),
    repositories.profiles.getProfile('partner'),
    repositories.moods.getMoods(),
    repositories.diaries.getDiaries(),
    repositories.settings.getSettings(),
    repositories.stars.getStars(),
    repositories.scores.getAwards(),
    repositories.heartPhrases.getHeartPhrases(),
    repositories.importantDates.getImportantDates(),
    repositories.memoryMoments.getMemoryMoments(),
    repositories.messageToYou.getMessage(),
    repositories.messageToYou.getEntries(),
    repositories.rememberedYou.getRememberedYouCards(),
    repositories.clearRecords.list(),
    repositories.loveBoatAssessments.listAll(),
    repositories.loveBrainAssessments.listAll(),
    repositories.likeOrHabitReflections.listAll(),
  ])

  if (!user || !partner || !settings) throw new Error('App data snapshot is incomplete')

  return {
    format: STARLOVE_EXPORT_FORMAT,
    exportVersion: STARLOVE_EXPORT_VERSION,
    app: { name: 'Starry Love Diary', schemaVersion: SCHEMA_VERSION },
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    exportedLocalDate: localDate,
    data: {
      profiles: [user, partner].map(withoutProfilePhoto).sort((a, b) => compareStrings(a.kind, b.kind) || compareStrings(a.id, b.id)),
      moods: sortByLocalDate(moods),
      diaries: sortByLocalDate(diaries),
      clearRecords: {
        organizeFeelings: sortByLocalDate(organizeFeelings),
        loveBoatAssessments: sortByLocalDate(loveBoatAssessments),
        loveBrainAssessments: sortByLocalDate(loveBrainAssessments),
        likeOrHabitReflections: sortByLocalDate(likeOrHabitReflections),
      },
      stars: sortByLocalDate(stars),
      scoreAwards: sortByLocalDate(scoreAwards),
      heartPhrases: [...heartPhrases].sort((a, b) => a.order - b.order || compareStrings(a.createdAt, b.createdAt) || compareStrings(a.id, b.id)),
      importantDates: [...importantDates].sort((a, b) => compareStrings(a.date, b.date) || compareStrings(a.createdAt, b.createdAt) || compareStrings(a.id, b.id)),
      memoryMoments: [...memoryMoments].map(withoutMomentPhoto).sort((a, b) => compareStrings(a.localDate, b.localDate) || a.order - b.order || compareStrings(a.createdAt, b.createdAt) || compareStrings(a.id, b.id)),
      messageToYou: messageToYou ? { id: messageToYou.id, content: messageToYou.content, createdAt: messageToYou.createdAt, updatedAt: messageToYou.updatedAt } : null,
      messageToYouEntries: sortByLocalDate(messageToYouEntries),
      rememberedYouCards: sortByLocalDate(rememberedYouCards),
      settings: {
        id: settings.id,
        locale: settings.locale,
        dailyLoveQuoteActivationDate: settings.dailyLoveQuoteActivationDate,
        loveQuoteReminderEnabled: settings.loveQuoteReminderEnabled,
        importantDateReminderEnabled: settings.importantDateReminderEnabled,
        reminderTime: settings.reminderTime,
        schemaVersion: settings.schemaVersion,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    },
  }
}

export function serializeAppDataExport(data: AppDataExport) {
  return JSON.stringify(data, null, 2)
}

export async function createAppDataExport(options: AppDataExportOptions): Promise<AppDataExportResult> {
  const data = await buildAppDataExport(options)
  return { filename: `starry-love-diary-data-${options.localDate}.json`, content: serializeAppDataExport(data), data }
}

export function downloadAppDataExport(result: AppDataExportResult) {
  const blob = new Blob([result.content], { type: 'application/json;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = result.filename
  anchor.style.display = 'none'
  try {
    document.body.append(anchor)
    anchor.click()
  } finally {
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  }
}

export async function exportAppData(options: AppDataExportOptions) {
  const result = await createAppDataExport(options)
  downloadAppDataExport(result)
  return result
}
