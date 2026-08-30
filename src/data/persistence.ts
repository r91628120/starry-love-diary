import type { Locale } from '../i18n/messages'
import { toLocalDate } from '../services/localDateService'
import { LocalDiaryRepository, LocalHeartPhraseRepository, LocalImportantDateRepository, LocalMemoryMomentRepository, LocalMessageToYouRepository, LocalMoodRepository, LocalProfileRepository, LocalRememberedYouRepository, LocalScoreRepository, LocalSettingsRepository, LocalStarRepository } from './repositories/repositories'
import { LocalClearRecordRepository, LocalLikeOrHabitReflectionRepository, LocalLoveBoatAssessmentRepository, LocalLoveBrainAssessmentRepository } from './repositories/clearRepositories'
import { IndexedDbStorageAdapter } from './storage/IndexedDbStorageAdapter'
import type { StorageAdapter } from './storage/StorageAdapter'
import type { AppSettings, DiaryEntry, HeartPhrase, ImportantDate, MemoryMoment, MessageToYou, MoodRecord, Profile, RememberedYouCard, Star } from './types'

export interface PersistenceRuntime {
  adapter: StorageAdapter
  profiles: LocalProfileRepository
  moods: LocalMoodRepository
  diaries: LocalDiaryRepository
  settings: LocalSettingsRepository
  stars: LocalStarRepository
  scores: LocalScoreRepository
  heartPhrases: LocalHeartPhraseRepository
  importantDates: LocalImportantDateRepository
  memoryMoments: LocalMemoryMomentRepository
  messageToYou: LocalMessageToYouRepository
  rememberedYou: LocalRememberedYouRepository
  clearRecords: LocalClearRecordRepository
  loveBoatAssessments: LocalLoveBoatAssessmentRepository
  loveBrainAssessments: LocalLoveBrainAssessmentRepository
  likeOrHabitReflections: LocalLikeOrHabitReflectionRepository
  initial: {
    userProfile: Profile
    partnerProfile: Profile
    settings: AppSettings
    currentLocalDate: string
    todayMood?: MoodRecord
    todayDiary?: DiaryEntry
    starHeartTotal: number
    stars: Star[]
    heartPhrases: HeartPhrase[]
    importantDates: ImportantDate[]
    memoryMoments: MemoryMoment[]
    messageToYou?: MessageToYou
    rememberedYouCards: RememberedYouCard[]
    diaryCount: number
  }
}

export async function initializePersistence(options: { adapter?: StorageAdapter; defaultLocale: Locale; localDate?: string }): Promise<PersistenceRuntime> {
  const adapter = options.adapter ?? new IndexedDbStorageAdapter()
  await adapter.open()
  const profiles = new LocalProfileRepository(adapter)
  const scores = new LocalScoreRepository(adapter)
  const moods = new LocalMoodRepository(adapter, scores)
  const diaries = new LocalDiaryRepository(adapter, scores)
  const settings = new LocalSettingsRepository(adapter)
  const stars = new LocalStarRepository(adapter)
  const heartPhrases = new LocalHeartPhraseRepository(adapter)
  const importantDates = new LocalImportantDateRepository(adapter)
  const memoryMoments = new LocalMemoryMomentRepository(adapter)
  const messageToYou = new LocalMessageToYouRepository(adapter)
  const rememberedYou = new LocalRememberedYouRepository(adapter)
  const clearRecords = new LocalClearRecordRepository(adapter, scores)
  const loveBoatAssessments = new LocalLoveBoatAssessmentRepository(adapter)
  const loveBrainAssessments = new LocalLoveBrainAssessmentRepository(adapter)
  const likeOrHabitReflections = new LocalLikeOrHabitReflectionRepository(adapter)
  const localDate = options.localDate ?? toLocalDate()
  const profileDefaults = await profiles.ensureDefaults()
  const appSettings = await settings.ensureDefault(options.defaultLocale, localDate)
  await scores.award('daily_open', { localDate })
  const [todayMood, todayDiary, starHeartTotal, persistedStars, persistedHeartPhrases, persistedImportantDates, persistedMemoryMoments, persistedMessage, persistedRememberedYou, persistedDiaries] = await Promise.all([moods.getMoodByLocalDate(localDate), diaries.getDiaryByLocalDate(localDate), scores.getTotal(), stars.getStars(), heartPhrases.getTopHeartPhrases(3), importantDates.getImportantDates(), memoryMoments.getMemoryMoments(), messageToYou.getMessage(), rememberedYou.getRememberedYouCards(), diaries.getDiaries()])
  return { adapter, profiles, moods, diaries, settings, stars, scores, heartPhrases, importantDates, memoryMoments, messageToYou, rememberedYou, clearRecords, loveBoatAssessments, loveBrainAssessments, likeOrHabitReflections, initial: { userProfile: profileDefaults.user, partnerProfile: profileDefaults.partner, settings: appSettings, currentLocalDate: localDate, todayMood, todayDiary, starHeartTotal, stars: persistedStars, heartPhrases: persistedHeartPhrases, importantDates: persistedImportantDates, memoryMoments: persistedMemoryMoments, messageToYou: persistedMessage, rememberedYouCards: persistedRememberedYou, diaryCount: persistedDiaries.length } }
}
