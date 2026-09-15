import type { Locale } from '../i18n/messages'
import { toLocalDate } from '../services/localDateService'
import { LocalDiaryRepository, LocalHeartPhraseRepository, LocalImportantDateRepository, LocalMemoryMomentRepository, LocalMessageToYouRepository, LocalMoodRepository, LocalProfileRepository, LocalRememberedYouRepository, LocalScoreRepository, LocalSettingsRepository, LocalStarRepository } from './repositories/repositories'
import { LocalClearRecordRepository, LocalLikeOrHabitReflectionRepository, LocalLoveBoatAssessmentRepository, LocalLoveBrainAssessmentRepository } from './repositories/clearRepositories'
import { IndexedDbStorageAdapter } from './storage/IndexedDbStorageAdapter'
import type { StorageAdapter } from './storage/StorageAdapter'
import type { AppSettings, DiaryEntry, HeartPhrase, HeartRevealProject, ImportantDate, MemoryMoment, MessageToYou, MessageToYouEntry, MoodRecord, Profile, RememberedYouCard, Star } from './types'
import { IndexedDbPhotoContentStore } from './photo/PhotoContentStore'
import { LocalPhotoRepository } from './photo/PhotoRepository'
import { LocalMemoryWallLayoutRepository } from './photo/MemoryWallLayoutRepository'
import { LocalProfilePhotoPlacementRepository } from './photo/ProfilePhotoPlacementRepository'
import { LocalHeartRevealPhotoRepository } from './photo/HeartRevealPhotoRepository'
import { LocalMemoryMomentPhotoPlacementRepository } from './photo/MemoryMomentPhotoPlacementRepository'
import { BrowserPhotoCompressionService } from '../services/photoCompressionService'

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
  photos: LocalPhotoRepository
  memoryWallLayouts: LocalMemoryWallLayoutRepository
  profilePhotoPlacements: LocalProfilePhotoPlacementRepository
  heartRevealPhotos: LocalHeartRevealPhotoRepository
  memoryMomentPhotoPlacements: LocalMemoryMomentPhotoPlacementRepository
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
    heartPhraseCount: number
    activeHeartRevealProject?: HeartRevealProject
    importantDates: ImportantDate[]
    memoryMoments: MemoryMoment[]
    messageToYou?: MessageToYou
    messageToYouEntries: MessageToYouEntry[]
    rememberedYouCards: RememberedYouCard[]
    diaryCount: number
  }
}

export async function initializePersistence(options: { adapter?: StorageAdapter; defaultLocale: Locale; localDate?: string }): Promise<PersistenceRuntime> {
  const adapter = options.adapter ?? new IndexedDbStorageAdapter()
  await adapter.open()
  const profiles = new LocalProfileRepository(adapter)
  const scores = new LocalScoreRepository(adapter)
  const stars = new LocalStarRepository(adapter)
  const moods = new LocalMoodRepository(adapter, scores, stars)
  const diaries = new LocalDiaryRepository(adapter, scores)
  const settings = new LocalSettingsRepository(adapter)
  const heartPhrases = new LocalHeartPhraseRepository(adapter)
  const importantDates = new LocalImportantDateRepository(adapter)
  const memoryMoments = new LocalMemoryMomentRepository(adapter)
  const messageToYou = new LocalMessageToYouRepository(adapter)
  const rememberedYou = new LocalRememberedYouRepository(adapter)
  const clearRecords = new LocalClearRecordRepository(adapter, scores)
  const loveBoatAssessments = new LocalLoveBoatAssessmentRepository(adapter)
  const loveBrainAssessments = new LocalLoveBrainAssessmentRepository(adapter)
  const likeOrHabitReflections = new LocalLikeOrHabitReflectionRepository(adapter)
  const photos = new LocalPhotoRepository(adapter, new IndexedDbPhotoContentStore(adapter), new BrowserPhotoCompressionService())
  const memoryWallLayouts = new LocalMemoryWallLayoutRepository(adapter, photos)
  const profilePhotoPlacements = new LocalProfilePhotoPlacementRepository(adapter)
  const heartRevealPhotos = new LocalHeartRevealPhotoRepository(adapter, photos)
  const memoryMomentPhotoPlacements = new LocalMemoryMomentPhotoPlacementRepository(adapter)
  const localDate = options.localDate ?? toLocalDate()
  const profileDefaults = await profiles.ensureDefaults()
  const appSettings = await settings.ensureDefault(options.defaultLocale, localDate)
  await scores.award('daily_open', { localDate })
  // Legacy MoodRecords predate mood Star wiring. Reconcile by stable
  // sourceType/sourceId identity; failure must not prevent the app from opening.
  await stars.reconcileMoodStars(await moods.getMoods()).catch(() => undefined)
  const messageToYouEntries = await messageToYou.reconcileLegacy()
  const [todayMood, todayDiary, starHeartTotal, persistedStars, allPersistedHeartPhrases, persistedImportantDates, persistedMemoryMoments, persistedMessage, persistedRememberedYou, persistedDiaries] = await Promise.all([moods.getMoodByLocalDate(localDate), diaries.getDiaryByLocalDate(localDate), scores.getTotal(), stars.getStars(), heartPhrases.getHeartPhrases(), importantDates.getImportantDates(), memoryMoments.getMemoryMoments(), messageToYou.getMessage(), rememberedYou.getRememberedYouCards(), diaries.getDiaries()])
  // V2 writes optional metadata into the existing v5 record. Existing users
  // with seven phrases keep their ready state rather than being reset.
  const activeHeartRevealProject = await heartRevealPhotos.getCycleState(allPersistedHeartPhrases)
  return { adapter, profiles, moods, diaries, settings, stars, scores, heartPhrases, importantDates, memoryMoments, messageToYou, rememberedYou, clearRecords, loveBoatAssessments, loveBrainAssessments, likeOrHabitReflections, photos, memoryWallLayouts, profilePhotoPlacements, heartRevealPhotos, memoryMomentPhotoPlacements, initial: { userProfile: profileDefaults.user, partnerProfile: profileDefaults.partner, settings: appSettings, currentLocalDate: localDate, todayMood, todayDiary, starHeartTotal, stars: persistedStars, heartPhrases: allPersistedHeartPhrases, heartPhraseCount: allPersistedHeartPhrases.length, activeHeartRevealProject, importantDates: persistedImportantDates, memoryMoments: persistedMemoryMoments, messageToYou: persistedMessage, messageToYouEntries, rememberedYouCards: persistedRememberedYou, diaryCount: persistedDiaries.length } }
}
