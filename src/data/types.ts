import type { Locale } from '../i18n/messages'

export type ProfileKind = 'user' | 'partner'
export type MoodKey = 'flutter' | 'happy' | 'peaceful' | 'miss' | 'uneasy' | 'sad' | 'rumination'
export type StarType = 'mood' | 'clear_mind'
export type AwardType = 'daily_open' | 'diary_created' | 'mood_selected' | 'clear_completed' | 'quote_shared'

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

export interface AppSettings {
  id: 'settings'
  locale: Locale
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
