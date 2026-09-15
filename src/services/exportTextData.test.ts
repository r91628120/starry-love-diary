import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTextExport, downloadTextExport } from './exportTextData'
import { initializePersistence } from '../data/persistence'
import { MemoryStorageAdapter } from '../data/storage/MemoryStorageAdapter'
import { messages, supportedLocales, type Locale, type TranslationKey } from '../i18n/messages'
import type { ClearRecord, LoveBoatAssessment } from '../data/clearTypes'

function translator(locale: Locale) {
  return (key: TranslationKey, values: Record<string, string | number> = {}) => Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), messages[locale][key])
}

async function populatedRuntime() {
  const adapter = new MemoryStorageAdapter()
  const runtime = await initializePersistence({ adapter, defaultLocale: 'zh-TW', localDate: '2026-09-11' })
  await runtime.profiles.updateProfile('user', { nickname: '小星', birthday: '2000-01-02', photoAssetId: 'photo-should-not-export' })
  await runtime.profiles.updateProfile('partner', { nickname: '阿月', photoAssetId: 'photo-should-not-export' })
  await runtime.importantDates.createImportantDate({ type: 'first_meeting', title: '第一次見面', date: '2026-03-23', description: '在書店相遇', reminderEnabled: true })
  await runtime.diaries.createDiary({ localDate: '2026-09-02', title: '較早日記', content: '第一篇內容', mood: 'happy' })
  await runtime.diaries.createDiary({ localDate: '2026-09-10', title: '今天很想你', content: '第二篇內容', mood: 'miss' })
  await runtime.moods.setMood('miss', '2026-09-10')
  await runtime.stars.createStar({ type: 'clear_mind', sourceType: 'love_boat_code', sourceId: 'clear-source', title: '整理', content: 'love_boat_code', localDate: '2026-09-09' })
  await runtime.heartPhrases.acceptHeartPhrase('第一句心話')
  await runtime.heartPhrases.acceptHeartPhrase('第二句心話')
  await runtime.messageToYou.saveMessage('想對你說的內容')
  await runtime.rememberedYou.createRememberedYouCard({ title: '你喜歡咖啡', content: '記得你的習慣', localDate: '2026-09-08', isFavorite: true })
  await adapter.put('memoryMoments', { id: 'moment-export', title: '散步', content: '一起散步的午後', localDate: '2026-09-07', order: 0, photoAssetId: 'moment-photo-hidden', createdAt: '2026-09-07T01:00:00.000Z', updatedAt: '2026-09-07T01:00:00.000Z' })
  const clear: ClearRecord = { id: 'clear-export', triggerType: 'missing_them', facts: '他今天沒有回覆', emotions: ['missing'], emotionIntensity: 2, nextActionType: 'take_a_walk', localDate: '2026-09-06', timezone: 'Asia/Taipei', createdAt: '2026-09-06T01:00:00.000Z', updatedAt: '2026-09-06T01:00:00.000Z', completedAt: '2026-09-06T01:00:00.000Z' }
  const boat: LoveBoatAssessment = { id: 'boat-export', status: 'completed', currentSection: 'result', currentQuestionIndex: 21, aAnswers: {}, bAnswers: {}, aScore: 0, aLevel: 'investment_low', bAnsweredItems: 0, bEarnedScore: 0, bMaxPossibleScore: 0, bLevel: 'response_insufficient_observation', localDate: '2026-09-05', timezone: 'Asia/Taipei', createdAt: '2026-09-05T01:00:00.000Z', updatedAt: '2026-09-05T01:00:00.000Z', completedAt: '2026-09-05T01:00:00.000Z' }
  await adapter.put('clearRecords', clear)
  await adapter.put('loveBoatAssessments', boat)
  await adapter.put('loveBrainAssessments', { id: 'brain-draft', status: 'draft', answers: {}, currentQuestionIndex: 0, localDate: '2026-09-04', timezone: 'Asia/Taipei', createdAt: '2026-09-04T01:00:00.000Z', updatedAt: '2026-09-04T01:00:00.000Z' })
  return runtime
}

describe('text data export', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

  it.each(supportedLocales)('creates a localized readable export for %s', async (locale) => {
    const runtime = await populatedRuntime()
    const result = await createTextExport({ repositories: runtime, locale, localDate: '2026-09-11', t: translator(locale) })
    expect(result.filename).toBe('starry-love-diary-export-2026-09-11.txt')
    expect(result.content).toContain(messages[locale]['export.title'])
    expect(result.content).toContain(messages[locale]['export.photoExcluded'])
    expect(result.content).toContain(messages[locale]['today.mood.miss'])
    expect(result.content).toContain(messages[locale]['clear.tools.organize.title'])
    expect(result.content).toContain(messages[locale]['clear.tools.boatGuide.title'])
    expect(result.content).not.toContain('photoAssetId')
    expect(result.content).not.toContain('photo-should-not-export')
    expect(result.content).not.toContain('moment-photo-hidden')
    expect(result.content).not.toContain('blob:')
    expect(result.content).not.toContain('base64')
    expect(result.content).not.toContain('reminderEnabled')
    expect(result.content).not.toContain('schemaVersion')
    expect(result.content).not.toContain('scoreAwards')
    expect(result.content).not.toContain('awardType')
    expect(result.content).not.toContain('brain-draft')
    expect(result.content.indexOf('較早日記')).toBeLessThan(result.content.indexOf('今天很想你'))
  })

  it('keeps empty sections readable and downloads a UTF-8 plain-text Blob without leaving an anchor or URL', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-11' })
    const result = await createTextExport({ repositories: runtime, locale: 'en', localDate: '2026-09-11', t: translator('en') })
    expect(result.content).toContain(messages.en['export.empty'])
    const createObjectURL = vi.fn((blob: Blob) => { void blob; return 'blob:export' })
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    downloadTextExport(result)
    expect(createObjectURL).toHaveBeenCalledWith(expect.objectContaining({ type: 'text/plain;charset=utf-8' }))
    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.size).toBeGreaterThan(0)
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export')
    expect(document.querySelector('a[download]')).toBeNull()
  })
})
