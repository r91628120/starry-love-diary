import { describe, expect, it, vi } from 'vitest'
import { initializePersistence } from '../data/persistence'
import { MemoryStorageAdapter } from '../data/storage/MemoryStorageAdapter'
import { LEGACY_V4_STORE_NAMES } from '../data/storage/StorageAdapter'
import { STARLOVE_EXPORT_FORMAT, STARLOVE_EXPORT_VERSION, buildAppDataExport, createAppDataExport, downloadAppDataExport, serializeAppDataExport } from './exportAppData'

async function createFixture() {
  const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
  const timestamp = '2026-09-11T10:00:00.000Z'
  await runtime.adapter.put('profiles', { id: 'user', kind: 'user', nickname: '我', birthday: '1999-04-02', photoAssetId: 'photo-user', createdAt: timestamp, updatedAt: timestamp })
  await runtime.adapter.put('profiles', { id: 'partner', kind: 'partner', nickname: '你', photoAssetId: 'photo-partner', createdAt: timestamp, updatedAt: timestamp })
  await runtime.adapter.put('moods', { id: 'mood-b', localDate: '2026-09-10', mood: 'happy', timezone: 'Asia/Taipei', createdAt: '2026-09-10T11:00:00.000Z', updatedAt: timestamp })
  await runtime.adapter.put('moods', { id: 'mood-a', localDate: '2026-09-09', mood: 'sad', timezone: 'Asia/Taipei', createdAt: '2026-09-09T11:00:00.000Z', updatedAt: timestamp })
  await runtime.adapter.put('diaries', { id: 'diary-photo', localDate: '2026-09-10', title: '日記標題', content: '保留文字', mood: 'happy', linkedClearMindId: 'clear-record-a', savedAsStar: false, timezone: 'Asia/Taipei', createdAt: timestamp, updatedAt: timestamp })
  await runtime.adapter.put('stars', { id: 'star-b', type: 'mood', sourceId: 'mood-b', sourceType: 'mood', content: 'happy', mood: 'happy', localDate: '2026-09-10', timezone: 'Asia/Taipei', createdAt: timestamp, updatedAt: timestamp })
  await runtime.adapter.put('scoreAwards', { id: 'award-b', awardType: 'mood_selected', points: 2, localDate: '2026-09-10', sourceId: 'mood-b', timezone: 'Asia/Taipei', createdAt: timestamp, updatedAt: timestamp })
  await runtime.adapter.put('heartPhrases', { id: 'heart-later', content: '第二句', order: 2, acceptedAt: timestamp, createdAt: timestamp, updatedAt: timestamp })
  await runtime.adapter.put('heartPhrases', { id: 'heart-first', content: '第一句', order: 1, acceptedAt: timestamp, createdAt: timestamp, updatedAt: timestamp })
  await runtime.adapter.put('importantDates', { id: 'date-b', type: 'custom', title: '晚一點', date: '2026-10-01', reminderEnabled: true, createdAt: timestamp, updatedAt: timestamp })
  await runtime.adapter.put('importantDates', { id: 'date-a', type: 'birthday', title: '早一點', date: '2026-09-12', reminderEnabled: false, createdAt: timestamp, updatedAt: timestamp })
  await runtime.adapter.put('memoryMoments', { id: 'moment-photo', title: '時刻', content: '回憶', localDate: '2026-09-10', photoAssetId: 'photo-moment', order: 1, createdAt: timestamp, updatedAt: timestamp })
  await runtime.adapter.put('messageToYou', { id: 'message-to-you', content: '想說的話', createdAt: timestamp, updatedAt: timestamp })
  await runtime.adapter.put('rememberedYouCards', { id: 'remembered-a', title: '記得', content: '內容', localDate: '2026-09-09', isFavorite: true, createdAt: timestamp, updatedAt: timestamp })
  await runtime.adapter.put('loveBoatAssessments', { id: 'boat-draft', status: 'draft', currentSection: 'A', currentQuestionIndex: 1, aAnswers: { a01: 1 }, bAnswers: {}, localDate: '2026-09-11', timezone: 'Asia/Taipei', createdAt: timestamp, updatedAt: timestamp })
  await runtime.adapter.put('loveBrainAssessments', { id: 'brain-completed', status: 'completed', answers: {}, currentQuestionIndex: 24, localDate: '2026-09-10', timezone: 'Asia/Taipei', createdAt: timestamp, updatedAt: timestamp, completedAt: timestamp })
  await runtime.adapter.put('likeOrHabitReflections', { id: 'like-draft', status: 'draft', currentSection: 'habit', answers: {}, localDate: '2026-09-11', timezone: 'Asia/Taipei', createdAt: timestamp, updatedAt: timestamp })
  await runtime.settings.updateSettings({ locale: 'fr', loveQuoteReminderEnabled: false, importantDateReminderEnabled: true, reminderTime: '20:45' })
  return runtime
}

describe('App data export', () => {
  it('creates a deterministic, pretty JSON snapshot with all domain data and persisted Clear drafts', async () => {
    const runtime = await createFixture()
    const result = await createAppDataExport({ repositories: runtime, localDate: '2026-09-11', exportedAt: '2026-09-11T12:00:00.000Z' })
    const parsed = JSON.parse(result.content)
    expect(result.filename).toBe('starry-love-diary-data-2026-09-11.json')
    expect(result.content).toContain('\n  "format"')
    expect(parsed).toMatchObject({ format: STARLOVE_EXPORT_FORMAT, exportVersion: STARLOVE_EXPORT_VERSION, app: { name: 'Starry Love Diary', schemaVersion: 5 }, exportedAt: '2026-09-11T12:00:00.000Z', exportedLocalDate: '2026-09-11' })
    expect(parsed.data.profiles.map((profile: { kind: string }) => profile.kind)).toEqual(['partner', 'user'])
    expect(parsed.data.profiles).toContainEqual(expect.objectContaining({ id: 'user', nickname: '我', birthday: '1999-04-02' }))
    expect(parsed.data.moods.map((mood: { id: string }) => mood.id)).toEqual(['mood-a', 'mood-b'])
    expect(parsed.data.heartPhrases.map((phrase: { id: string }) => phrase.id)).toEqual(['heart-first', 'heart-later'])
    expect(parsed.data.importantDates.map((date: { id: string }) => date.id)).toEqual(['date-a', 'date-b'])
    expect(parsed.data.clearRecords.loveBoatAssessments).toEqual([expect.objectContaining({ id: 'boat-draft', status: 'draft' })])
    expect(parsed.data.clearRecords.loveBrainAssessments).toEqual([expect.objectContaining({ id: 'brain-completed', status: 'completed' })])
    expect(parsed.data.clearRecords.likeOrHabitReflections).toEqual([expect.objectContaining({ id: 'like-draft', status: 'draft' })])
    expect(parsed.data.scoreAwards).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'award-b', awardType: 'mood_selected', points: 2 })]))
    expect(parsed.data.diaries).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'diary-photo', title: '日記標題', content: '保留文字', linkedClearMindId: 'clear-record-a' })]))
    expect(parsed.data.stars).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'star-b', sourceId: 'mood-b', sourceType: 'mood', mood: 'happy' })]))
    expect(parsed.data.settings).toMatchObject({ locale: 'fr', loveQuoteReminderEnabled: false, importantDateReminderEnabled: true, reminderTime: '20:45' })
    expect(parsed.data.messageToYou).toMatchObject({ id: 'message-to-you', content: '想說的話' })
    expect(serializeAppDataExport(await buildAppDataExport({ repositories: runtime, localDate: '2026-09-11', exportedAt: '2026-09-11T12:00:00.000Z' }))).toBe(result.content)
  })

  it('refuses to emit a partial transfer file when required baseline records are unavailable', async () => {
    const runtime = await createFixture()
    await runtime.adapter.delete('settings', 'settings')
    await expect(createAppDataExport({ repositories: runtime, localDate: '2026-09-11' })).rejects.toThrow('snapshot is incomplete')
  })

  it('omits every photo reference and does not mutate persistence while exporting', async () => {
    const runtime = await createFixture()
    const before = Object.fromEntries(await Promise.all(LEGACY_V4_STORE_NAMES.map(async (store) => [store, await runtime.adapter.getAll(store)])))
    const { content } = await createAppDataExport({ repositories: runtime, localDate: '2026-09-11', exportedAt: '2026-09-11T12:00:00.000Z' })
    expect(content).not.toMatch(/photoAssetId|photo-user|photo-partner|photo-moment|blob:|data:image|base64/u)
    expect(Object.keys(JSON.parse(content).data)).not.toContain('photoAssets')
    const after = Object.fromEntries(await Promise.all(LEGACY_V4_STORE_NAMES.map(async (store) => [store, await runtime.adapter.getAll(store)])))
    expect(after).toEqual(before)
  })

  it('downloads UTF-8 pretty JSON with the expected filename and always cleans up after a click failure', async () => {
    const runtime = await createFixture()
    const result = await createAppDataExport({ repositories: runtime, localDate: '2026-09-11' })
    let downloadedFilename = ''
    let downloadedBlob: Blob | undefined
    const createObjectURL = vi.fn((blob: Blob) => { downloadedBlob = blob; return 'blob:app-data' })
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloadedFilename = this.download })
    downloadAppDataExport(result)
    expect(downloadedFilename).toBe('starry-love-diary-data-2026-09-11.json')
    expect(downloadedBlob?.type).toBe('application/json;charset=utf-8')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:app-data')
    click.mockImplementation(() => { throw new Error('download blocked') })
    expect(() => downloadAppDataExport(result)).toThrow('download blocked')
    expect(createObjectURL).toHaveBeenCalledTimes(2)
    expect(revokeObjectURL).toHaveBeenCalledTimes(2)
    click.mockRestore()
  })
})
