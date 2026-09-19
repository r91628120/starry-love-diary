import { createContext, useContext } from 'react'
import type { PersistenceRuntime } from './persistence'
import type { AppDataImportPlan, ImportSummary } from '../services/importAppData'
import type { AppSettings, DiaryEntry, HeartPhrase, HeartRevealProject, HeartRevealTextPlacement, ImportantDate, ImportantDateType, MemoryMoment, MessageToYou, MessageToYouEntry, MessageToYouType, MoodKey, MoodRecord, PhotoPlacement, Profile, ProfileKind, RememberedYouCard, Star } from './types'

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
  heartPhraseCount: number
  activeHeartRevealProject?: HeartRevealProject
  importantDates: ImportantDate[]
  memoryMoments: MemoryMoment[]
  messageToYou?: MessageToYou
  messageToYouEntries: MessageToYouEntry[]
  rememberedYouCards: RememberedYouCard[]
  diaryCount: number
  updateProfile(kind: ProfileKind, changes: Partial<Pick<Profile, 'nickname' | 'birthday' | 'photoAssetId'>>): Promise<Profile>
  replaceProfilePhoto(kind: ProfileKind, file: File): Promise<Profile>
  removeProfilePhoto(kind: ProfileKind): Promise<Profile>
  setTodayMood(mood: MoodKey): Promise<MoodRecord>
  saveTodayDiary(content: string, diaryId?: string): Promise<DiaryEntry>
  deleteTodayDiary(diaryId?: string): Promise<void>
  shareDailyQuote(): Promise<boolean>
  acceptHeartPhrase(content: string): Promise<HeartPhrase>
  updateHeartPhrase(id: string, content: string): Promise<HeartPhrase>
  deleteHeartPhrase(id: string): Promise<void>
  replaceHeartRevealPhoto(file: File): Promise<HeartRevealProject>
  saveHeartRevealPlacement(placement: Partial<PhotoPlacement>): Promise<HeartRevealProject>
  saveHeartRevealTextPlacement(placement: HeartRevealTextPlacement): Promise<HeartRevealProject>
  removeHeartRevealPhoto(): Promise<void>
  completeHeartRevealCycle(): Promise<HeartRevealProject>
  createImportantDate(input: { type: ImportantDateType; title: string; date: string; description?: string; reminderEnabled?: boolean }): Promise<ImportantDate>
  updateImportantDate(id: string, changes: Partial<Pick<ImportantDate, 'type' | 'title' | 'date' | 'description' | 'reminderEnabled'>>): Promise<ImportantDate>
  deleteImportantDate(id: string): Promise<void>
  createMemoryMoment(input: { title?: string; content: string; localDate?: string; photoAssetId?: string | null }): Promise<MemoryMoment>
  updateMemoryMoment(id: string, changes: Partial<Pick<MemoryMoment, 'title' | 'content' | 'localDate' | 'photoAssetId' | 'order'>>): Promise<MemoryMoment>
  replaceMemoryMomentPhoto(id: string, file: File): Promise<MemoryMoment>
  removeMemoryMomentPhoto(id: string): Promise<MemoryMoment>
  saveMemoryMomentPhotoPlacement(id: string, placement: Partial<PhotoPlacement>): Promise<PhotoPlacement>
  deleteMemoryMoment(id: string): Promise<void>
  saveMessageToYou(content: string): Promise<MessageToYou>
  clearMessageToYou(): Promise<void>
  createMessageToYouEntry(input: { type: MessageToYouType; content: string }): Promise<MessageToYouEntry>
  updateMessageToYouEntry(id: string, changes: Partial<Pick<MessageToYouEntry, 'type' | 'content'>>): Promise<MessageToYouEntry>
  deleteMessageToYouEntry(id: string): Promise<void>
  createRememberedYouCard(input: { title: string; content: string }): Promise<RememberedYouCard>
  updateRememberedYouCard(id: string, changes: Partial<Pick<RememberedYouCard, 'title' | 'content'>>): Promise<RememberedYouCard>
  deleteRememberedYouCard(id: string): Promise<void>
  toggleRememberedYouFavorite(id: string): Promise<RememberedYouCard>
  updateSettings(changes: Partial<Pick<AppSettings, 'locale' | 'onboardingCompleted' | 'dailyLoveQuoteActivationDate' | 'loveQuoteReminderEnabled' | 'importantDateReminderEnabled' | 'reminderTime'>>): Promise<AppSettings>
  clearCurrentRelationshipData(): Promise<void>
  refreshScoreAndStars(): Promise<void>
  applyAppDataImport(plan: AppDataImportPlan): Promise<ImportSummary>
  repositories: Pick<PersistenceRuntime, 'adapter' | 'profiles' | 'moods' | 'diaries' | 'settings' | 'stars' | 'starDropPresentations' | 'diaryDrafts' | 'scores' | 'heartPhrases' | 'importantDates' | 'memoryMoments' | 'messageToYou' | 'rememberedYou' | 'clearRecords' | 'loveBoatAssessments' | 'loveBrainAssessments' | 'likeOrHabitReflections' | 'photos' | 'memoryWallLayouts' | 'profilePhotoPlacements' | 'heartRevealPhotos' | 'memoryMomentPhotoPlacements'>
}

export const PersistenceStateContext = createContext<PersistenceContextValue | null>(null)
export function usePersistence() { return useContext(PersistenceStateContext) }
