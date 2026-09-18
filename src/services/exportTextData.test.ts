import { afterEach, describe, expect, it, vi } from 'vitest'
import { Directory } from '@capacitor/filesystem'
import { createTextExport, downloadTextExport, exportTextData } from './exportTextData'
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

  it('writes the existing Unicode text export to a native Cache file and shares only its URI', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
    const unicodeNickname = '繁體中文日本語한국어⭐'
    const unicodeDiary = 'Español Français ❤️'
    await runtime.profiles.updateProfile('user', { nickname: unicodeNickname })
    await runtime.diaries.createDiary({ localDate: '2026-09-11', title: 'Unicode', content: unicodeDiary })
    const writeFile = vi.fn().mockResolvedValue({ uri: 'file:///tmp/starry-love-diary-export-2026-09-11.txt' })
    const deleteFile = vi.fn().mockResolvedValue(undefined)
    const share = vi.fn().mockResolvedValue(undefined)
    const download = vi.fn()

    const result = await exportTextData(
      { repositories: runtime, locale: 'zh-TW', localDate: '2026-09-11', t: translator('zh-TW') },
      { nativePlatform: { getPlatform: () => 'ios' }, nativeShare: { canShare: vi.fn().mockResolvedValue({ value: true }), share }, nativeFilesystem: { writeFile, deleteFile }, download },
    )

    expect(result.delivery).toBe('share-sheet-opened')
    expect(result.content).toContain(unicodeNickname)
    expect(result.content).toContain(unicodeDiary)
    expect(writeFile).toHaveBeenCalledWith(expect.objectContaining({ path: result.filename, directory: Directory.Cache, data: expect.any(String) }))
    const base64 = writeFile.mock.calls[0][0].data as string
    const bytes = Uint8Array.from(globalThis.atob(base64), (character) => character.charCodeAt(0))
    expect(new TextDecoder().decode(bytes)).toBe(result.content)
    expect(share).toHaveBeenCalledWith({ files: ['file:///tmp/starry-love-diary-export-2026-09-11.txt'] })
    expect(deleteFile).toHaveBeenCalledWith({ path: result.filename, directory: Directory.Cache })
    expect(download).not.toHaveBeenCalled()
  })

  it('preserves the browser download path without touching native plugins', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-11' })
    const download = vi.fn()
    const writeFile = vi.fn()
    const share = vi.fn()

    const result = await exportTextData(
      { repositories: runtime, locale: 'en', localDate: '2026-09-11', t: translator('en') },
      { nativePlatform: { getPlatform: () => 'web' }, nativeShare: { canShare: vi.fn(), share }, nativeFilesystem: { writeFile, deleteFile: vi.fn() }, download },
    )

    expect(result.delivery).toBe('downloaded')
    expect(download).toHaveBeenCalledWith(expect.objectContaining({ filename: 'starry-love-diary-export-2026-09-11.txt' }))
    expect(writeFile).not.toHaveBeenCalled()
    expect(share).not.toHaveBeenCalled()
  })

  it('treats native share cancellation as neutral without a browser fallback', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-11' })
    const deleteFile = vi.fn().mockResolvedValue(undefined)
    const download = vi.fn()
    const result = await exportTextData(
      { repositories: runtime, locale: 'en', localDate: '2026-09-11', t: translator('en') },
      { nativePlatform: { getPlatform: () => 'ios' }, nativeShare: { canShare: vi.fn().mockResolvedValue({ value: true }), share: vi.fn().mockRejectedValue(new Error('Share canceled')) }, nativeFilesystem: { writeFile: vi.fn().mockResolvedValue({ uri: 'file:///tmp/export.txt' }), deleteFile }, download },
    )

    expect(result.delivery).toBe('cancelled')
    expect(download).not.toHaveBeenCalled()
    expect(deleteFile).toHaveBeenCalledWith({ path: result.filename, directory: Directory.Cache })
  })
})
