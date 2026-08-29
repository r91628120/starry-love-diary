import type { Locale } from '../../i18n/messages'
import { getDeviceTimezone, toLocalDate } from '../../services/localDateService'
import type { StorageAdapter } from '../storage/StorageAdapter'
import type { AppSettings, AwardType, DiaryEntry, HeartPhrase, ImportantDate, ImportantDateType, MemoryMoment, MessageToYou, MoodKey, MoodRecord, Profile, ProfileKind, RememberedYouCard, ScoreAward, Star, StarType } from '../types'

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
      if (existing.schemaVersion !== 4) {
        const migrated = { ...existing, schemaVersion: 4, updatedAt: now() }
        await this.storage.put('settings', migrated)
        return migrated
      }
      return existing
    }
    const timestamp = now()
    const settings: AppSettings = { id: 'settings', locale, loveQuoteReminderEnabled: true, importantDateReminderEnabled: true, reminderTime: '20:00', schemaVersion: 4, createdAt: timestamp, updatedAt: timestamp }
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

export class OurDataValidationError extends Error {
  constructor(message: string, readonly code: string) {
    super(message)
    this.name = 'OurDataValidationError'
  }
}

function requiredText(value: string, field: string) {
  const normalized = value.trim()
  if (!normalized) throw new OurDataValidationError(`${field} is required`, `${field.toLowerCase()}_required`)
  return normalized
}

function optionalText(value?: string) {
  const normalized = value?.trim()
  return normalized || undefined
}

function validateLocalDate(value: string, field = 'Date') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new OurDataValidationError(`${field} must use YYYY-MM-DD`, 'invalid_date')
  return value
}

export interface ImportantDateRepository {
  createImportantDate(input: { type: ImportantDateType; title: string; date: string; description?: string; reminderEnabled?: boolean }): Promise<ImportantDate>
  getImportantDate(id: string): Promise<ImportantDate | undefined>
  getImportantDates(): Promise<ImportantDate[]>
  updateImportantDate(id: string, changes: Partial<Pick<ImportantDate, 'type' | 'title' | 'date' | 'description' | 'reminderEnabled'>>): Promise<ImportantDate>
  deleteImportantDate(id: string): Promise<void>
}

export class LocalImportantDateRepository implements ImportantDateRepository {
  constructor(private readonly storage: StorageAdapter) {}
  async createImportantDate(input: { type: ImportantDateType; title: string; date: string; description?: string; reminderEnabled?: boolean }) {
    const timestamp = now()
    const importantDate: ImportantDate = { id: id('important-date'), type: input.type, title: requiredText(input.title, 'Title'), date: validateLocalDate(input.date), description: optionalText(input.description), reminderEnabled: input.reminderEnabled, createdAt: timestamp, updatedAt: timestamp }
    await this.storage.put('importantDates', importantDate)
    return importantDate
  }
  getImportantDate(importantDateId: string) { return this.storage.get<ImportantDate>('importantDates', importantDateId) }
  async getImportantDates() { return (await this.storage.getAll<ImportantDate>('importantDates')).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)) }
  async updateImportantDate(importantDateId: string, changes: Partial<Pick<ImportantDate, 'type' | 'title' | 'date' | 'description' | 'reminderEnabled'>>) {
    const existing = await this.getImportantDate(importantDateId)
    if (!existing) throw new Error('Important date not found')
    const updated: ImportantDate = { ...existing, ...changes, title: changes.title === undefined ? existing.title : requiredText(changes.title, 'Title'), date: changes.date === undefined ? existing.date : validateLocalDate(changes.date), description: changes.description === undefined ? existing.description : optionalText(changes.description), updatedAt: now() }
    await this.storage.put('importantDates', updated)
    return updated
  }
  deleteImportantDate(importantDateId: string) { return this.storage.delete('importantDates', importantDateId) }
}

export interface MemoryMomentRepository {
  createMemoryMoment(input: { title?: string; content: string; localDate?: string; photoAssetId?: string | null; order?: number }): Promise<MemoryMoment>
  getMemoryMoment(id: string): Promise<MemoryMoment | undefined>
  getMemoryMoments(): Promise<MemoryMoment[]>
  getRecentMemoryMoments(limit?: number): Promise<MemoryMoment[]>
  updateMemoryMoment(id: string, changes: Partial<Pick<MemoryMoment, 'title' | 'content' | 'localDate' | 'photoAssetId' | 'order'>>): Promise<MemoryMoment>
  deleteMemoryMoment(id: string): Promise<void>
}

export class LocalMemoryMomentRepository implements MemoryMomentRepository {
  constructor(private readonly storage: StorageAdapter) {}
  async createMemoryMoment(input: { title?: string; content: string; localDate?: string; photoAssetId?: string | null; order?: number }) {
    const moments = await this.getMemoryMoments()
    if (moments.length >= 20) throw new OurDataValidationError('Memory moment limit of 20 reached', 'memory_moment_limit')
    const timestamp = now()
    const moment: MemoryMoment = { id: id('memory-moment'), title: optionalText(input.title), content: requiredText(input.content, 'Content'), localDate: validateLocalDate(input.localDate ?? toLocalDate(), 'Local date'), photoAssetId: input.photoAssetId ? optionalText(input.photoAssetId) : null, order: input.order ?? moments.length, createdAt: timestamp, updatedAt: timestamp }
    await this.storage.put('memoryMoments', moment)
    return moment
  }
  getMemoryMoment(momentId: string) { return this.storage.get<MemoryMoment>('memoryMoments', momentId) }
  async getMemoryMoments() { return (await this.storage.getAll<MemoryMoment>('memoryMoments')).sort((a, b) => b.localDate.localeCompare(a.localDate) || a.order - b.order || b.createdAt.localeCompare(a.createdAt)) }
  async getRecentMemoryMoments(limit = 3) { return (await this.getMemoryMoments()).slice(0, limit) }
  async updateMemoryMoment(momentId: string, changes: Partial<Pick<MemoryMoment, 'title' | 'content' | 'localDate' | 'photoAssetId' | 'order'>>) {
    const existing = await this.getMemoryMoment(momentId)
    if (!existing) throw new Error('Memory moment not found')
    const updated: MemoryMoment = { ...existing, ...changes, title: changes.title === undefined ? existing.title : optionalText(changes.title), content: changes.content === undefined ? existing.content : requiredText(changes.content, 'Content'), localDate: changes.localDate === undefined ? existing.localDate : validateLocalDate(changes.localDate, 'Local date'), photoAssetId: changes.photoAssetId === undefined ? existing.photoAssetId : changes.photoAssetId ? optionalText(changes.photoAssetId) : null, updatedAt: now() }
    await this.storage.put('memoryMoments', updated)
    return updated
  }
  deleteMemoryMoment(momentId: string) { return this.storage.delete('memoryMoments', momentId) }
}

export interface MessageToYouRepository {
  getMessage(): Promise<MessageToYou | undefined>
  saveMessage(content: string): Promise<MessageToYou>
  clearMessage(): Promise<void>
}

export class LocalMessageToYouRepository implements MessageToYouRepository {
  constructor(private readonly storage: StorageAdapter) {}
  getMessage() { return this.storage.get<MessageToYou>('messageToYou', 'message-to-you') }
  async saveMessage(content: string) {
    const normalized = requiredText(content, 'Message')
    if ([...normalized].length > 300) throw new OurDataValidationError('Message to you must not exceed 300 characters', 'message_too_long')
    const existing = await this.getMessage()
    const timestamp = now()
    const message: MessageToYou = existing ? { ...existing, content: normalized, updatedAt: timestamp } : { id: 'message-to-you', content: normalized, createdAt: timestamp, updatedAt: timestamp }
    await this.storage.put('messageToYou', message)
    return message
  }
  clearMessage() { return this.storage.delete('messageToYou', 'message-to-you') }
}

export interface RememberedYouRepository {
  createRememberedYouCard(input: { title: string; content: string; localDate?: string; isFavorite?: boolean }): Promise<RememberedYouCard>
  getRememberedYouCard(id: string): Promise<RememberedYouCard | undefined>
  getRememberedYouCards(options?: { search?: string; favoritesOnly?: boolean }): Promise<RememberedYouCard[]>
  updateRememberedYouCard(id: string, changes: Partial<Pick<RememberedYouCard, 'title' | 'content'>>): Promise<RememberedYouCard>
  deleteRememberedYouCard(id: string): Promise<void>
  toggleFavorite(id: string): Promise<RememberedYouCard>
}

function validateRememberedContent(content: string) {
  const normalized = requiredText(content, 'Content')
  if ([...normalized].length > 100) throw new OurDataValidationError('Remembered you content must not exceed 100 characters', 'remembered_you_too_long')
  return normalized
}

export class LocalRememberedYouRepository implements RememberedYouRepository {
  constructor(private readonly storage: StorageAdapter) {}
  async createRememberedYouCard(input: { title: string; content: string; localDate?: string; isFavorite?: boolean }) {
    const cards = await this.getRememberedYouCards()
    if (cards.length >= 50) throw new OurDataValidationError('Remembered you card limit of 50 reached', 'remembered_you_limit')
    const timestamp = now()
    const card: RememberedYouCard = { id: id('remembered-you'), title: requiredText(input.title, 'Title'), content: validateRememberedContent(input.content), localDate: validateLocalDate(input.localDate ?? toLocalDate(), 'Local date'), isFavorite: input.isFavorite ?? false, createdAt: timestamp, updatedAt: timestamp }
    await this.storage.put('rememberedYouCards', card)
    return card
  }
  getRememberedYouCard(cardId: string) { return this.storage.get<RememberedYouCard>('rememberedYouCards', cardId) }
  async getRememberedYouCards(options: { search?: string; favoritesOnly?: boolean } = {}) {
    const search = options.search?.trim().toLocaleLowerCase() ?? ''
    return (await this.storage.getAll<RememberedYouCard>('rememberedYouCards'))
      .filter((card) => (!options.favoritesOnly || card.isFavorite) && (!search || `${card.title} ${card.content}`.toLocaleLowerCase().includes(search)))
      .sort((a, b) => b.localDate.localeCompare(a.localDate) || b.createdAt.localeCompare(a.createdAt))
  }
  async updateRememberedYouCard(cardId: string, changes: Partial<Pick<RememberedYouCard, 'title' | 'content'>>) {
    const existing = await this.getRememberedYouCard(cardId)
    if (!existing) throw new Error('Remembered you card not found')
    const updated: RememberedYouCard = { ...existing, ...changes, title: changes.title === undefined ? existing.title : requiredText(changes.title, 'Title'), content: changes.content === undefined ? existing.content : validateRememberedContent(changes.content), updatedAt: now() }
    await this.storage.put('rememberedYouCards', updated)
    return updated
  }
  async toggleFavorite(cardId: string) {
    const existing = await this.getRememberedYouCard(cardId)
    if (!existing) throw new Error('Remembered you card not found')
    const updated = { ...existing, isFavorite: !existing.isFavorite, updatedAt: now() }
    await this.storage.put('rememberedYouCards', updated)
    return updated
  }
  deleteRememberedYouCard(cardId: string) { return this.storage.delete('rememberedYouCards', cardId) }
}
