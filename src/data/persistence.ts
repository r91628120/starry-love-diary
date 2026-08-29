import type { Locale } from '../i18n/messages'
import { toLocalDate } from '../services/localDateService'
import { LocalDiaryRepository, LocalHeartPhraseRepository, LocalMoodRepository, LocalProfileRepository, LocalScoreRepository, LocalSettingsRepository, LocalStarRepository } from './repositories/repositories'
import { IndexedDbStorageAdapter } from './storage/IndexedDbStorageAdapter'
import type { StorageAdapter } from './storage/StorageAdapter'
import type { AppSettings, DiaryEntry, HeartPhrase, MoodRecord, Profile, Star } from './types'

export interface PersistenceRuntime {
  adapter: StorageAdapter
  profiles: LocalProfileRepository
  moods: LocalMoodRepository
  diaries: LocalDiaryRepository
  settings: LocalSettingsRepository
  stars: LocalStarRepository
  scores: LocalScoreRepository
  heartPhrases: LocalHeartPhraseRepository
  initial: {
    userProfile: Profile
    partnerProfile: Profile
    settings: AppSettings
    todayMood?: MoodRecord
    todayDiary?: DiaryEntry
    starHeartTotal: number
    stars: Star[]
    heartPhrases: HeartPhrase[]
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
  const profileDefaults = await profiles.ensureDefaults()
  const appSettings = await settings.ensureDefault(options.defaultLocale)
  const localDate = options.localDate ?? toLocalDate()
  await scores.award('daily_open', { localDate })
  const [todayMood, todayDiary, starHeartTotal, persistedStars, persistedHeartPhrases] = await Promise.all([moods.getMoodByLocalDate(localDate), diaries.getDiaryByLocalDate(localDate), scores.getTotal(), stars.getStars(), heartPhrases.getTopHeartPhrases(3)])
  return { adapter, profiles, moods, diaries, settings, stars, scores, heartPhrases, initial: { userProfile: profileDefaults.user, partnerProfile: profileDefaults.partner, settings: appSettings, todayMood, todayDiary, starHeartTotal, stars: persistedStars, heartPhrases: persistedHeartPhrases } }
}
