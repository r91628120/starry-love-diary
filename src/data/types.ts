import type { Locale } from '../i18n/messages'

export type ProfileKind = 'user' | 'partner'
export type MoodKey = 'flutter' | 'happy' | 'peaceful' | 'miss' | 'uneasy' | 'sad' | 'rumination'
export type StarType = 'mood' | 'clear_mind'
export type AwardType = 'daily_open' | 'diary_created' | 'mood_selected' | 'clear_completed' | 'quote_shared'
export type ImportantDateType = 'first_chat' | 'first_meeting' | 'first_date' | 'confession' | 'dating' | 'birthday' | 'anniversary' | 'trip' | 'custom'
export type PhotoCategory = 'profile' | 'partner' | 'diary' | 'gallery' | 'moment' | 'important_date' | 'heart_reveal'
export type PhotoStorageKind = 'indexeddb_blob' | 'native_file'

export interface PhotoPlacement {
  positionX: number
  positionY: number
  zoom: number
}

export type HeartRevealTextPlacement = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

export interface PhotoAsset {
  id: string
  category: PhotoCategory
  storageKind: PhotoStorageKind
  localUri: string
  thumbnailUri?: string
  mimeType: string
  width: number
  height: number
  fileSizeBytes: number
  thumbnailMimeType?: string
  thumbnailWidth?: number
  thumbnailHeight?: number
  thumbnailFileSizeBytes?: number
  sourceCreatedAt?: string
  createdAt: string
  updatedAt: string
}

export interface PhotoAssetBlobRecord {
  id: string
  master: Blob
  thumbnail: Blob
}

export interface DiaryPhoto {
  id: string
  diaryEntryId: string
  photoAssetId: string
  sortOrder: number
  placement?: PhotoPlacement
  createdAt: string
  updatedAt: string
}

export interface PhotoLayoutSlot {
  id: string
  photoAssetId: string
  placement: PhotoPlacement
}

export interface PhotoLayout {
  id: string
  layoutType: string
  photoCount: number
  slots: PhotoLayoutSlot[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface HeartRevealProject {
  id: string
  /** The currently selected reveal photo. A cycle may deliberately have none. */
  photoAssetId?: string
  photoPlacement?: PhotoPlacement
  /** A user-owned overlay preference; photo pan/zoom remains independent. */
  textPlacement?: HeartRevealTextPlacement
  status: 'active' | 'completed' | 'archived'
  progressCount: number
  /**
   * V2 keeps the current cycle boundary as phrase ids rather than deriving it
   * from the archive count. This makes historical edits/deletes harmless.
   */
  cyclePhraseIds?: string[]
  /** Legacy phrases that existed after the inferred current cycle boundary. */
  legacyOverflowPhraseIds?: string[]
  cycleNumber?: number
  cycleStatus?: 'active' | 'ready'
  lastCompletedAt?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface HeartRevealLine {
  id: string
  projectId: string
  lineIndex: number
  content: string
  localDate: string
  heartPressCount: number
  isConfirmed: boolean
  createdAt: string
  updatedAt: string
}

export interface HeartRevealCard {
  id: string
  projectId: string
  selectedLineId: string
  templateType: 'top' | 'bottom' | 'left_bottom' | 'right_bottom'
  textSize: 'small' | 'medium' | 'large'
  textAlign: 'left' | 'center'
  textColor: 'dark' | 'white'
  createdAt: string
  updatedAt: string
}

export interface Profile {
  id: ProfileKind
  kind: ProfileKind
  nickname: string
  birthday?: string
  photoAssetId?: string
  createdAt: string
  updatedAt: string
}

export interface MoodRecord {
  id: string
  localDate: string
  mood: MoodKey
  timezone: string
  createdAt: string
  updatedAt: string
}

export interface DiaryEntry {
  id: string
  localDate: string
  title?: string
  content: string
  mood?: MoodKey
  linkedClearMindId?: string
  savedAsStar: boolean
  timezone: string
  createdAt: string
  updatedAt: string
}

export interface DiaryDraft {
  id: string
  localDate: string
  content: string
  updatedAt: string
}

export interface AppSettings {
  id: 'settings'
  locale: Locale
  dailyLoveQuoteActivationDate: string
  onboardingCompleted: boolean
  loveQuoteReminderEnabled: boolean
  importantDateReminderEnabled: boolean
  reminderTime: string
  schemaVersion: number
  createdAt: string
  updatedAt: string
}

export interface Star {
  id: string
  type: StarType
  sourceId?: string
  title?: string
  content: string
  mood?: MoodKey
  sourceType?: string
  localDate: string
  timezone: string
  createdAt: string
  updatedAt: string
}

export interface ScoreAward {
  id: string
  awardType: AwardType
  points: number
  localDate: string
  sourceId?: string
  timezone: string
  createdAt: string
  updatedAt: string
}

export interface HeartPhrase {
  id: string
  content: string
  order: number
  acceptedAt: string
  createdAt: string
  updatedAt: string
}

export interface ImportantDate {
  id: string
  type: ImportantDateType
  title: string
  date: string
  description?: string
  reminderEnabled?: boolean
  createdAt: string
  updatedAt: string
}

export interface MemoryMoment {
  id: string
  title?: string
  content: string
  localDate: string
  photoAssetId?: string | null
  order: number
  createdAt: string
  updatedAt: string
}

export const MESSAGE_TO_YOU_TYPES = ['miss_you', 'thank_you', 'sorry', 'dont_be_mad', 'tell_you', 'invite_out', 'free_message'] as const
export type MessageToYouType = (typeof MESSAGE_TO_YOU_TYPES)[number]

export interface MessageToYou {
  id: 'message-to-you'
  content: string
  createdAt: string
  updatedAt: string
}

export interface MessageToYouEntry {
  id: string
  type: MessageToYouType
  content: string
  localDate: string
  timezone: string
  createdAt: string
  updatedAt: string
}

export interface RememberedYouCard {
  id: string
  title: string
  content: string
  localDate: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}
