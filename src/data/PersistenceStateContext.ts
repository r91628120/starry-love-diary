import { createContext, useContext } from 'react'
import type { PersistenceRuntime } from './persistence'
import type { AppSettings, DiaryEntry, HeartPhrase, MoodKey, MoodRecord, Profile, ProfileKind, Star } from './types'

export interface PersistenceContextValue {
  userProfile: Profile
  partnerProfile: Profile
  settings: AppSettings
  todayMood?: MoodRecord
  todayDiary?: DiaryEntry
  starHeartTotal: number
  stars: Star[]
  heartPhrases: HeartPhrase[]
  updateProfile(kind: ProfileKind, changes: Partial<Pick<Profile, 'nickname' | 'birthday' | 'photoAssetId'>>): Promise<Profile>
  setTodayMood(mood: MoodKey): Promise<MoodRecord>
  saveTodayDiary(content: string): Promise<DiaryEntry>
  deleteTodayDiary(): Promise<void>
  shareDailyQuote(): Promise<boolean>
  acceptHeartPhrase(content: string): Promise<HeartPhrase>
  updateHeartPhrase(id: string, content: string): Promise<HeartPhrase>
  deleteHeartPhrase(id: string): Promise<void>
  updateSettings(changes: Partial<Pick<AppSettings, 'locale' | 'loveQuoteReminderEnabled' | 'importantDateReminderEnabled' | 'reminderTime'>>): Promise<AppSettings>
  repositories: Pick<PersistenceRuntime, 'profiles' | 'moods' | 'diaries' | 'settings' | 'stars' | 'scores' | 'heartPhrases'>
}

export const PersistenceStateContext = createContext<PersistenceContextValue | null>(null)
export function usePersistence() { return useContext(PersistenceStateContext) }
