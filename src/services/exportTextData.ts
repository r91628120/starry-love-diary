import type { PersistenceRuntime } from '../data/persistence'
import type { ClearRecord, LikeOrHabitReflection, LoveBoatAssessment, LoveBrainAssessment } from '../data/clearTypes'
import type { ImportantDate, MoodKey, Star } from '../data/types'
import type { Locale, TranslationKey } from '../i18n/messages'

type ExportRepositories = Pick<PersistenceRuntime, 'profiles' | 'moods' | 'diaries' | 'scores' | 'stars' | 'heartPhrases' | 'importantDates' | 'memoryMoments' | 'messageToYou' | 'rememberedYou' | 'clearRecords' | 'loveBoatAssessments' | 'loveBrainAssessments' | 'likeOrHabitReflections'>
type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string

export interface TextExportOptions {
  repositories: ExportRepositories
  locale: Locale
  localDate: string
  t: Translate
}

export interface TextExportResult { filename: string; content: string }

const divider = '================================'

const importantDateTypeKeys = {
  first_chat: 'our.importantDates.type.firstChat', first_meeting: 'our.importantDates.type.firstMeeting', first_date: 'our.importantDates.type.firstDate', confession: 'our.importantDates.type.confession', dating: 'our.importantDates.type.dating', birthday: 'our.importantDates.type.birthday', anniversary: 'our.importantDates.type.anniversary', trip: 'our.importantDates.type.trip', custom: 'our.importantDates.type.custom',
} as const satisfies Record<ImportantDate['type'], TranslationKey>

const clearToolKeys = {
  clear_record: 'clear.tools.organize.title', love_boat_code: 'clear.tools.boatGuide.title', love_brain_assessment: 'clear.tools.loveBrain.title', like_or_habit: 'clear.tools.likeOrHabit.title',
} as const satisfies Record<string, TranslationKey>
const messageTypeKeys = { miss_you:'messageV1.type.miss_you',thank_you:'messageV1.type.thank_you',sorry:'messageV1.type.sorry',dont_be_mad:'messageV1.type.dont_be_mad',tell_you:'messageV1.type.tell_you',invite_out:'messageV1.type.invite_out',free_message:'messageV1.type.free_message' } as const satisfies Record<string,TranslationKey>

function formatLocalDate(value: string, locale: Locale) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)))
}

function formatTimestamp(value: string, locale: Locale) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function sortAsc<T extends { localDate: string; createdAt: string; id: string }>(entries: T[]) {
  return [...entries].sort((a, b) => a.localDate.localeCompare(b.localDate) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
}

function section(t: Translate, title: TranslationKey, lines: string[]) {
  return [`【${t(title)}】`, ...(lines.length ? lines : [t('export.empty')]), '']
}

function record(t: Translate, index: number, lines: Array<[TranslationKey, string | undefined]>) {
  return [`${index}.`, ...lines.flatMap(([label, value]) => value ? [`${t(label)}：${value}`] : []), '']
}

function moodName(t: Translate, mood: MoodKey) { return t(`today.mood.${mood}` as TranslationKey) }

function clearResult(t: Translate, record: LoveBoatAssessment | LoveBrainAssessment | LikeOrHabitReflection, source: keyof typeof clearToolKeys) {
  if (source === 'love_boat_code') {
    const boat = record as LoveBoatAssessment
    return boat.crossResultKey ? t(`clear.boat.result.${boat.crossResultKey}` as TranslationKey) : t('clear.boat.level.response_insufficient_observation')
  }
  if (source === 'love_brain_assessment') {
    const brain = record as LoveBrainAssessment
    if (brain.isLowOverall) return t('clear.brain.low')
    if (brain.primaryPattern) return t(`clear.brain.pattern.${brain.primaryPattern}` as TranslationKey)
    return t('clear.brain.tie')
  }
  const reflection = record as LikeOrHabitReflection
  return t(`clear.like.result.${reflection.resultVariantKey ?? 'unclear.v1'}.title` as TranslationKey)
}

function clearSummary(t: Translate, record: ClearRecord) {
  const values = [record.facts, record.interpretation, record.unknown, record.nextActionText].filter((value): value is string => Boolean(value))
  return values.length ? values.join('\n') : t('export.clear.completed')
}

function starContent(t: Translate, star: Star) {
  if (star.mood) return moodName(t, star.mood)
  if (star.sourceType && star.sourceType in clearToolKeys) return t(clearToolKeys[star.sourceType as keyof typeof clearToolKeys])
  return star.content
}

export async function createTextExport(options: TextExportOptions): Promise<TextExportResult> {
  const { repositories, locale, localDate, t } = options
  const [user, partner, scoreTotal, dates, diaries, moods, stars, phrases, messagesToYou, remembered, moments, clearRecords, boats, brains, reflections] = await Promise.all([
    repositories.profiles.getProfile('user'), repositories.profiles.getProfile('partner'), repositories.scores.getTotal(), repositories.importantDates.getImportantDates(), repositories.diaries.getDiaries(), repositories.moods.getMoods(), repositories.stars.getStars(), repositories.heartPhrases.getHeartPhrases(), repositories.messageToYou.getEntries(), repositories.rememberedYou.getRememberedYouCards(), repositories.memoryMoments.getMemoryMoments(), repositories.clearRecords.list(), repositories.loveBoatAssessments.list(), repositories.loveBrainAssessments.list(), repositories.likeOrHabitReflections.list(),
  ])

  const lines = [divider, t('export.title'), t('export.subtitle'), t('export.date', { date: formatLocalDate(localDate, locale) }), divider, '']
  lines.push(...section(t, 'export.profile', [
    `${t('export.me')}：${user?.nickname ?? t('export.empty')}`,
    `${t('export.partner')}：${partner?.nickname ?? t('export.empty')}`,
    ...(user?.birthday ? [`${t('export.birthday')}：${formatLocalDate(user.birthday, locale)}`] : []),
    ...(partner?.birthday ? [`${t('export.birthday')}：${formatLocalDate(partner.birthday, locale)}`] : []),
  ]))
  lines.push(...section(t, 'export.score', [t('export.scoreTotal', { total: scoreTotal })]))
  lines.push(...section(t, 'export.dates', [...dates].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).flatMap((date, index) => record(t, index + 1, [
    ['export.label.title', date.title], ['export.label.type', t(importantDateTypeKeys[date.type])], ['export.label.date', formatLocalDate(date.date, locale)], ['export.label.description', date.description],
  ]))))
  lines.push(...section(t, 'export.diaries', sortAsc(diaries).flatMap((diary, index) => record(t, index + 1, [
    ['export.label.date', formatLocalDate(diary.localDate, locale)], ['export.label.title', diary.title], ['export.label.mood', diary.mood ? moodName(t, diary.mood) : undefined], ['export.label.content', diary.content],
  ]))))
  lines.push(...section(t, 'export.moods', sortAsc(moods).map((mood) => `${formatLocalDate(mood.localDate, locale)}｜${moodName(t, mood.mood)}`)))

  const clearItems = [
    ...clearRecords.map((record) => ({ record, source: 'clear_record' as const, result: clearSummary(t, record) })),
    ...boats.map((record) => ({ record, source: 'love_boat_code' as const, result: clearResult(t, record, 'love_boat_code') })),
    ...brains.map((record) => ({ record, source: 'love_brain_assessment' as const, result: clearResult(t, record, 'love_brain_assessment') })),
    ...reflections.map((record) => ({ record, source: 'like_or_habit' as const, result: clearResult(t, record, 'like_or_habit') })),
  ].sort((a, b) => a.record.localDate.localeCompare(b.record.localDate) || a.record.createdAt.localeCompare(b.record.createdAt) || a.record.id.localeCompare(b.record.id))
  lines.push(...section(t, 'export.clear', clearItems.flatMap(({ record: clear, source, result }, index) => record(t, index + 1, [
    ['export.label.date', formatLocalDate(clear.localDate, locale)], ['export.label.tool', t(clearToolKeys[source])], ['export.label.result', result],
  ]))))

  const formatStars = (entries: Star[]) => sortAsc(entries).flatMap((star, index) => record(t, index + 1, [
    ['export.label.date', formatLocalDate(star.localDate, locale)], ['export.label.type', star.type === 'mood' ? t('starBottle.type.mood') : t('starBottle.type.clear')], ['export.label.title', star.title], ['export.label.content', starContent(t, star)],
  ]))
  lines.push(`【${t('export.stars')}】`, `【${t('export.moodStars')}】`, ...(formatStars(stars.filter((star) => star.type === 'mood')).length ? formatStars(stars.filter((star) => star.type === 'mood')) : [t('export.empty')]), '', `【${t('export.clearStars')}】`, ...(formatStars(stars.filter((star) => star.type === 'clear_mind')).length ? formatStars(stars.filter((star) => star.type === 'clear_mind')) : [t('export.empty')]), '')
  lines.push(...section(t, 'export.heartPhrases', [...phrases].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).flatMap((phrase, index) => record(t, index + 1, [
    ['export.label.content', phrase.content], ['export.label.acceptedAt', formatTimestamp(phrase.acceptedAt, locale)],
  ]))))
  lines.push(...section(t, 'export.message', sortAsc(messagesToYou).flatMap((message,index)=>record(t,index+1,[['export.label.date',formatLocalDate(message.localDate,locale)],['export.label.type',t(messageTypeKeys[message.type])],['export.label.content',message.content]]))))
  lines.push(...section(t, 'export.remembered', sortAsc(remembered).flatMap((card, index) => record(t, index + 1, [
    ['export.label.date', formatLocalDate(card.localDate, locale)], ['export.label.title', card.title], ['export.label.content', card.content], ['export.label.favorite', t(card.isFavorite ? 'export.favorite.yes' : 'export.favorite.no')],
  ]))))
  lines.push(...section(t, 'export.moments', [...moments].sort((a, b) => a.localDate.localeCompare(b.localDate) || a.order - b.order || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).flatMap((moment, index) => record(t, index + 1, [
    ['export.label.date', formatLocalDate(moment.localDate, locale)], ['export.label.title', moment.title], ['export.label.content', moment.content],
  ]))))
  lines.push(divider, t('export.footer'), t('export.photoExcluded'), divider)
  return { filename: `starry-love-diary-export-${localDate}.txt`, content: lines.join('\n') }
}

export function downloadTextExport(result: TextExportResult) {
  const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = result.filename
  anchor.style.display = 'none'
  document.body.append(anchor)
  try { anchor.click() } finally {
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  }
}

export async function exportTextData(options: TextExportOptions) {
  const result = await createTextExport(options)
  downloadTextExport(result)
  return result
}
