import type { Locale } from '../../i18n/messages'
import { getDeviceTimezone, toLocalDate } from '../../services/localDateService'
import type { StorageAdapter } from '../storage/StorageAdapter'
import type { AppSettings, AwardType, DiaryEntry, HeartPhrase, MoodKey, MoodRecord, Profile, ProfileKind, ScoreAward, Star, StarType } from '../types'

const DEFAULT_NICKNAME = '星星'

function now() { return new Date().toISOString() }
function id(prefix: string) { return `${prefix}-${crypto.randomUUID()}` }

const AWARD_POINTS: Record<AwardType, number> = { daily_open: 1, diary_created: 7, mood_selected: 2, clear_completed: 5, quote_shared: 10 }

export interface AwardWriter {
  award(awardType: AwardType, options?: { localDate?: string; sourceId?: string }): Promise<{ award: ScoreAward; awarded: boolean }>
}

export interface ProfileRepository {
  getProfile(kind: ProfileKind): Promise<Profile | undefined>
  ensureDefaults(): Promise<{ user: Profile; partner: Profile }>
  updateProfile(kind: ProfileKind, changes: Partial<Pick<Profile, 'nickname' | 'birthday' | 'photoAssetId'>>): Promise<Profile>
}

export class LocalProfileRepository implements ProfileRepository {
  constructor(private readonly storage: StorageAdapter) {}
  getProfile(kind: ProfileKind) { return this.storage.get<Profile>('profiles', kind) }
  async ensureDefaults() {
    const user = (await this.getProfile('user')) ?? await this.createDefault('user')
    const partner = (await this.getProfile('partner')) ?? await this.createDefault('partner')
    return { user, partner }
  }
  async updateProfile(kind: ProfileKind, changes: Partial<Pick<Profile, 'nickname' | 'birthday' | 'photoAssetId'>>) {
    const existing = (await this.getProfile(kind)) ?? await this.createDefault(kind)
    const nickname = (changes.nickname ?? existing.nickname).trim()
    if (!nickname) throw new Error('Nickname is required')
    if ([...nickname].length > 20) throw new Error('Nickname must not exceed 20 characters')
    const updated: Profile = { ...existing, ...changes, nickname, updatedAt: now() }
    await this.storage.put('profiles', updated)
    return updated
  }
  private async createDefault(kind: ProfileKind) {
    const timestamp = now()
    const profile: Profile = { id: kind, kind, nickname: DEFAULT_NICKNAME, createdAt: timestamp, updatedAt: timestamp }
    await this.storage.put('profiles', profile)
    return profile
  }
}

export interface MoodRepository {
  getMoodByLocalDate(localDate: string): Promise<MoodRecord | undefined>
  setMood(mood: MoodKey, localDate?: string): Promise<MoodRecord>
}

export class LocalMoodRepository implements MoodRepository {
  constructor(private readonly storage: StorageAdapter, private readonly awards?: AwardWriter) {}
  getMoodByLocalDate(localDate: string) { return this.storage.get<MoodRecord>('moods', localDate) }
  async setMood(mood: MoodKey, localDate = toLocalDate()) {
    const existing = await this.getMoodByLocalDate(localDate)
    const timestamp = now()
    const record: MoodRecord = existing
      ? { ...existing, mood, updatedAt: timestamp }
      : { id: localDate, localDate, mood, timezone: getDeviceTimezone(), createdAt: timestamp, updatedAt: timestamp }
    await this.storage.put('moods', record)
    await this.awards?.award('mood_selected', { localDate })
    return record
  }
}

export interface DiaryRepository {
  createDiary(input: { localDate?: string; title?: string; content: string; mood?: MoodKey }): Promise<DiaryEntry>
  getDiary(id: string): Promise<DiaryEntry | undefined>
  getDiaryByLocalDate(localDate: string): Promise<DiaryEntry | undefined>
  getDiaries(): Promise<DiaryEntry[]>
  updateDiary(id: string, changes: Partial<Pick<DiaryEntry, 'title' | 'content' | 'mood' | 'savedAsStar'>>): Promise<DiaryEntry>
  deleteDiary(id: string): Promise<void>
}

export class LocalDiaryRepository implements DiaryRepository {
  constructor(private readonly storage: StorageAdapter, private readonly awards?: AwardWriter) {}
  async createDiary(input: { localDate?: string; title?: string; content: string; mood?: MoodKey }) {
    validateDiaryContent(input.content)
    const timestamp = now()
    const entry: DiaryEntry = { id: id('diary'), localDate: input.localDate ?? toLocalDate(), title: input.title, content: input.content, mood: input.mood, savedAsStar: false, timezone: getDeviceTimezone(), createdAt: timestamp, updatedAt: timestamp }
    await this.storage.put('diaries', entry)
    await this.awards?.award('diary_created', { localDate: entry.localDate, sourceId: entry.id })
    return entry
  }
  getDiary(id: string) { return this.storage.get<DiaryEntry>('diaries', id) }
  async getDiaryByLocalDate(localDate: string) { return (await this.getDiaries()).find((entry) => entry.localDate === localDate) }
  async getDiaries() { return (await this.storage.getAll<DiaryEntry>('diaries')).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }
  async updateDiary(id: string, changes: Partial<Pick<DiaryEntry, 'title' | 'content' | 'mood' | 'savedAsStar'>>) {
    const existing = await this.getDiary(id)
    if (!existing) throw new Error('Diary entry not found')
    if (changes.content !== undefined) validateDiaryContent(changes.content)
    const updated: DiaryEntry = { ...existing, ...changes, updatedAt: now() }
    await this.storage.put('diaries', updated)
    return updated
  }
  deleteDiary(id: string) { return this.storage.delete('diaries', id) }
}

function validateDiaryContent(content: string) {
  if ([...content].length > 1000) throw new Error('Diary content must not exceed 1000 characters')
}

export interface SettingsRepository {
  ensureDefault(locale: Locale): Promise<AppSettings>
  getSettings(): Promise<AppSettings | undefined>
  updateSettings(changes: Partial<Pick<AppSettings, 'locale' | 'loveQuoteReminderEnabled' | 'importantDateReminderEnabled' | 'reminderTime'>>): Promise<AppSettings>
}

export class LocalSettingsRepository implements SettingsRepository {
  constructor(private readonly storage: StorageAdapter) {}
  getSettings() { return this.storage.get<AppSettings>('settings', 'settings') }
  async ensureDefault(locale: Locale) {
    const existing = await this.getSettings()
    if (existing) {
      if (existing.schemaVersion !== 2) {
        const migrated = { ...existing, schemaVersion: 2, updatedAt: now() }
        await this.storage.put('settings', migrated)
        return migrated
      }
      return existing
    }
    const timestamp = now()
    const settings: AppSettings = { id: 'settings', locale, loveQuoteReminderEnabled: true, importantDateReminderEnabled: true, reminderTime: '20:00', schemaVersion: 2, createdAt: timestamp, updatedAt: timestamp }
    await this.storage.put('settings', settings)
    return settings
  }
  async updateSettings(changes: Partial<Pick<AppSettings, 'locale' | 'loveQuoteReminderEnabled' | 'importantDateReminderEnabled' | 'reminderTime'>>) {
    const existing = await this.getSettings()
    if (!existing) throw new Error('Settings have not been initialized')
    if (changes.reminderTime !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(changes.reminderTime)) throw new Error('Reminder time must use HH:mm')
    const updated: AppSettings = { ...existing, ...changes, updatedAt: now() }
    await this.storage.put('settings', updated)
    return updated
  }
}

export interface StarRepository {
  createStar(input: Omit<Star, 'id' | 'createdAt' | 'updatedAt' | 'timezone' | 'localDate'> & { localDate?: string }): Promise<Star>
  getStars(): Promise<Star[]>
  getStarsByType(type: StarType): Promise<Star[]>
  getStarsByLocalDate(localDate: string): Promise<Star[]>
  deleteStar(id: string): Promise<void>
}

export class LocalStarRepository implements StarRepository {
  constructor(private readonly storage: StorageAdapter) {}
  async createStar(input: Omit<Star, 'id' | 'createdAt' | 'updatedAt' | 'timezone' | 'localDate'> & { localDate?: string }) {
    const timestamp = now()
    const star: Star = { ...input, id: id('star'), localDate: input.localDate ?? toLocalDate(), timezone: getDeviceTimezone(), createdAt: timestamp, updatedAt: timestamp }
    await this.storage.put('stars', star)
    return star
  }
  async getStars() { return (await this.storage.getAll<Star>('stars')).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }
  async getStarsByType(type: StarType) { return (await this.getStars()).filter((star) => star.type === type) }
  async getStarsByLocalDate(localDate: string) { return (await this.getStars()).filter((star) => star.localDate === localDate) }
  deleteStar(id: string) { return this.storage.delete('stars', id) }
}

export interface ScoreRepository extends AwardWriter {
  getAwards(): Promise<ScoreAward[]>
  getTotal(): Promise<number>
  hasAward(awardType: AwardType, options?: { localDate?: string; sourceId?: string }): Promise<boolean>
}

export class LocalScoreRepository implements ScoreRepository {
  constructor(private readonly storage: StorageAdapter) {}
  private awardId(awardType: AwardType, localDate: string, sourceId?: string) {
    return `${localDate}:${awardType}:${sourceId ?? 'daily'}`
  }
  async award(awardType: AwardType, options: { localDate?: string; sourceId?: string } = {}) {
    const localDate = options.localDate ?? toLocalDate()
    const awardId = this.awardId(awardType, localDate, options.sourceId)
    const existing = await this.storage.get<ScoreAward>('scoreAwards', awardId)
    if (existing) return { award: existing, awarded: false }
    const timestamp = now()
    const award: ScoreAward = { id: awardId, awardType, points: AWARD_POINTS[awardType], localDate, sourceId: options.sourceId, timezone: getDeviceTimezone(), createdAt: timestamp, updatedAt: timestamp }
    await this.storage.put('scoreAwards', award)
    return { award, awarded: true }
  }
  async getAwards() { return (await this.storage.getAll<ScoreAward>('scoreAwards')).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }
  async getTotal() { return (await this.getAwards()).reduce((total, award) => total + award.points, 0) }
  async hasAward(awardType: AwardType, options: { localDate?: string; sourceId?: string } = {}) {
    return Boolean(await this.storage.get<ScoreAward>('scoreAwards', this.awardId(awardType, options.localDate ?? toLocalDate(), options.sourceId)))
  }
}

export class HeartPhraseLimitError extends Error {}

export interface HeartPhraseRepository {
  getHeartPhrases(): Promise<HeartPhrase[]>
  getTopHeartPhrases(limit?: number): Promise<HeartPhrase[]>
  acceptHeartPhrase(content: string): Promise<HeartPhrase>
  updateHeartPhrase(id: string, content: string): Promise<HeartPhrase>
  deleteHeartPhrase(id: string): Promise<void>
}

function validateHeartPhrase(content: string) {
  const normalized = content.trim()
  if (!normalized) throw new Error('Heart phrase is required')
  if ([...normalized].length > 30) throw new Error('Heart phrase must not exceed 30 characters')
  return normalized
}

export class LocalHeartPhraseRepository implements HeartPhraseRepository {
  constructor(private readonly storage: StorageAdapter) {}
  async getHeartPhrases() { return (await this.storage.getAll<HeartPhrase>('heartPhrases')).sort((a, b) => a.order - b.order || b.acceptedAt.localeCompare(a.acceptedAt)) }
  async getTopHeartPhrases(limit = 3) { return (await this.getHeartPhrases()).slice(0, limit) }
  async acceptHeartPhrase(content: string) {
    const normalized = validateHeartPhrase(content)
    const phrases = await this.getHeartPhrases()
    if (phrases.length >= 20) throw new HeartPhraseLimitError('Heart phrase limit reached')
    const timestamp = now()
    const phrase: HeartPhrase = { id: id('heart-phrase'), content: normalized, order: phrases.length, acceptedAt: timestamp, createdAt: timestamp, updatedAt: timestamp }
    await this.storage.put('heartPhrases', phrase)
    return phrase
  }
  async updateHeartPhrase(phraseId: string, content: string) {
    const existing = await this.storage.get<HeartPhrase>('heartPhrases', phraseId)
    if (!existing) throw new Error('Heart phrase not found')
    const updated = { ...existing, content: validateHeartPhrase(content), updatedAt: now() }
    await this.storage.put('heartPhrases', updated)
    return updated
  }
  deleteHeartPhrase(phraseId: string) { return this.storage.delete('heartPhrases', phraseId) }
}
