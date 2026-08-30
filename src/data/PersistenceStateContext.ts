import { createContext, useContext } from 'react'
import type { PersistenceRuntime } from './persistence'
import type { AppSettings, DiaryEntry, HeartPhrase, ImportantDate, ImportantDateType, MemoryMoment, MessageToYou, MoodKey, MoodRecord, Profile, ProfileKind, RememberedYouCard, Star } from './types'

export interface PersistenceContextValue {
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
  updateProfile(kind: ProfileKind, changes: Partial<Pick<Profile, 'nickname' | 'birthday' | 'photoAssetId'>>): Promise<Profile>
  setTodayMood(mood: MoodKey): Promise<MoodRecord>
  saveTodayDiary(content: string): Promise<DiaryEntry>
  deleteTodayDiary(): Promise<void>
  shareDailyQuote(): Promise<boolean>
  acceptHeartPhrase(content: string): Promise<HeartPhrase>
  updateHeartPhrase(id: string, content: string): Promise<HeartPhrase>
  deleteHeartPhrase(id: string): Promise<void>
  createImportantDate(input: { type: ImportantDateType; title: string; date: string; description?: string; reminderEnabled?: boolean }): Promise<ImportantDate>
  updateImportantDate(id: string, changes: Partial<Pick<ImportantDate, 'type' | 'title' | 'date' | 'description' | 'reminderEnabled'>>): Promise<ImportantDate>
  deleteImportantDate(id: string): Promise<void>
  createMemoryMoment(input: { title?: string; content: string; localDate?: string }): Promise<MemoryMoment>
  updateMemoryMoment(id: string, changes: Partial<Pick<MemoryMoment, 'title' | 'content' | 'localDate' | 'order'>>): Promise<MemoryMoment>
  deleteMemoryMoment(id: string): Promise<void>
  saveMessageToYou(content: string): Promise<MessageToYou>
  clearMessageToYou(): Promise<void>
  createRememberedYouCard(input: { title: string; content: string }): Promise<RememberedYouCard>
  updateRememberedYouCard(id: string, changes: Partial<Pick<RememberedYouCard, 'title' | 'content'>>): Promise<RememberedYouCard>
  deleteRememberedYouCard(id: string): Promise<void>
  toggleRememberedYouFavorite(id: string): Promise<RememberedYouCard>
  updateSettings(changes: Partial<Pick<AppSettings, 'locale' | 'loveQuoteReminderEnabled' | 'importantDateReminderEnabled' | 'reminderTime'>>): Promise<AppSettings>
  refreshScoreAndStars(): Promise<void>
  repositories: Pick<PersistenceRuntime, 'profiles' | 'moods' | 'diaries' | 'settings' | 'stars' | 'scores' | 'heartPhrases' | 'importantDates' | 'memoryMoments' | 'messageToYou' | 'rememberedYou' | 'clearRecords' | 'loveBoatAssessments' | 'loveBrainAssessments' | 'likeOrHabitReflections'>
}

export const PersistenceStateContext = createContext<PersistenceContextValue | null>(null)
export function usePersistence() { return useContext(PersistenceStateContext) }
