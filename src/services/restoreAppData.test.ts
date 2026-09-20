import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { IndexedDbStorageAdapter } from '../data/storage/IndexedDbStorageAdapter'
import { MemoryStorageAdapter } from '../data/storage/MemoryStorageAdapter'
import { buildRestorePlan, normalizeRestoreText, RESTORE_REPLACE_STORES, restoreAppData } from './restoreAppData'
import type { AppDataExport } from './exportAppData'

const stamp = '2026-09-01T00:00:00.000Z'
function backup(overrides: Partial<AppDataExport['data']> = {}, schemaVersion = 7): AppDataExport {
  return { format: 'starry-love-diary-data', exportVersion: 1, app: { name: 'Starry Love Diary', schemaVersion }, exportedAt: stamp, exportedLocalDate: '2026-09-01', data: {
    profiles: [{ id: 'user', kind: 'user', nickname: 'Day 1', createdAt: stamp, updatedAt: stamp }, { id: 'partner', kind: 'partner', nickname: 'Partner', createdAt: stamp, updatedAt: stamp }], moods: [], diaries: [], clearRecords: { organizeFeelings: [], loveBoatAssessments: [], loveBrainAssessments: [], likeOrHabitReflections: [] }, stars: [], scoreAwards: [], heartPhrases: [], importantDates: [], memoryMoments: [], messageToYou: null, messageToYouEntries: [], rememberedYouCards: [], settings: { id: 'settings', locale: 'en', dailyLoveQuoteActivationDate: '2026-09-01', loveQuoteReminderEnabled: true, importantDateReminderEnabled: true, reminderTime: '20:00', schemaVersion, createdAt: stamp, updatedAt: stamp }, ...overrides,
  } }
}

describe('atomic Restore engine', () => {
  it('replaces older local records, removes local-only records, adds backup records, and clears temporary stores', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    await adapter.put('profiles', { id: 'user', kind: 'user', nickname: 'newer', createdAt: stamp, updatedAt: '2026-09-03T00:00:00.000Z' })
    await adapter.put('profiles', { id: 'partner', kind: 'partner', nickname: 'p', createdAt: stamp, updatedAt: stamp })
    await adapter.put('diaries', { id: 'local-only', localDate: '2026-09-03', content: 'remove', createdAt: stamp, updatedAt: stamp })
    await adapter.put('diaryDrafts', { id: 'draft', localDate: '2026-09-03', content: 'discard', updatedAt: stamp })
    await adapter.put('starDropPresentations', { id: 'drop', starId: 'x', state: 'pending', queuedAt: stamp })
    const plan = buildRestorePlan(backup({ profiles: [{ id: 'user', kind: 'user', nickname: 'older backup', createdAt: stamp, updatedAt: stamp }, { id: 'partner', kind: 'partner', nickname: 'p', createdAt: stamp, updatedAt: stamp }], diaries: [{ id: 'backup-only', localDate: '2026-09-01', content: 'restore', savedAsStar: false, timezone: 'UTC', createdAt: stamp, updatedAt: stamp }] }))
    await restoreAppData({ adapter }, plan)
    expect((await adapter.get<{ nickname: string }>('profiles', 'user'))?.nickname).toBe('older backup')
    expect(await adapter.get('diaries', 'local-only')).toBeUndefined(); expect(await adapter.get('diaries', 'backup-only')).toBeDefined()
    expect(await adapter.getAll('diaryDrafts')).toEqual([]); expect(await adapter.getAll('starDropPresentations')).toEqual([])
  })

  it('rolls back every included store on a real IndexedDB request failure', async () => {
    const adapter = new IndexedDbStorageAdapter(`restore-test-${crypto.randomUUID()}`); await adapter.open()
    const originals = Object.fromEntries(RESTORE_REPLACE_STORES.map((store) => [store, { id: `day3-${store}`, store, value: 'original' }]))
    for (const store of RESTORE_REPLACE_STORES) await adapter.put(store, originals[store])
    const draft = { id: 'day3-draft', localDate: '2026-09-03', content: 'draft', updatedAt: stamp }
    const presentation = { id: 'day3-presentation', starId: 'day3-star', state: 'pending', queuedAt: stamp }
    await adapter.put('diaryDrafts', draft); await adapter.put('starDropPresentations', presentation)
    const replacement = Object.fromEntries(RESTORE_REPLACE_STORES.map((store) => [store, [{ id: `day1-${store}`, store, value: 'replacement' }]])) as Partial<Record<keyof typeof originals, unknown[]>>
    replacement.moods?.push({ value: 'deterministic IndexedDB request failure' })
    await expect(adapter.restoreStoresAtomically(replacement, ['diaryDrafts', 'starDropPresentations'])).rejects.toBeTruthy()
    for (const store of RESTORE_REPLACE_STORES) expect(await adapter.getAll(store)).toEqual([originals[store]])
    expect(await adapter.getAll('diaryDrafts')).toEqual([draft]); expect(await adapter.getAll('starDropPresentations')).toEqual([presentation])
    adapter.close()
  })

  it('rejects incomplete, malformed, duplicate, and incoherent restore snapshots before writes', () => {
    const valid = backup()
    const missingCollection = JSON.parse(JSON.stringify(valid)); delete missingCollection.data.diaries
    expect(() => normalizeRestoreText(JSON.stringify(missingCollection))).toThrow()
    const malformed = JSON.parse(JSON.stringify(valid)); malformed.data.diaries = [{ id: 'bad' }]
    expect(() => normalizeRestoreText(JSON.stringify(malformed))).toThrow()
    expect(() => buildRestorePlan(backup({ diaries: [{ id: 'same', localDate: '2026-09-01', content: 'one', savedAsStar: false, timezone: 'UTC', createdAt: stamp, updatedAt: stamp }, { id: 'same', localDate: '2026-09-01', content: 'two', savedAsStar: false, timezone: 'UTC', createdAt: stamp, updatedAt: stamp }] }))).toThrow(/Duplicate/)
    expect(() => buildRestorePlan(backup({ profiles: [valid.data.profiles[0]] }))).toThrow(/user and partner/)
  })

  it('never starts atomic storage for every invalid Restore fixture', async () => {
    let calls = 0
    const adapter = { restoreStoresAtomically: async () => { calls += 1 } }
    const valid = backup()
    const cases: unknown[] = []
    const missingCollection = JSON.parse(JSON.stringify(valid)); delete missingCollection.data.diaries; cases.push(missingCollection)
    const malformed = JSON.parse(JSON.stringify(valid)); malformed.data.diaries = [{ id: 'bad' }]; cases.push(malformed)
    cases.push(backup({ profiles: [valid.data.profiles[0]] }))
    cases.push(backup({ profiles: [valid.data.profiles[1]] }))
    cases.push(backup({ diaries: [{ id: 'same', localDate: '2026-09-01', content: 'one', savedAsStar: false, timezone: 'UTC', createdAt: stamp, updatedAt: stamp }, { id: 'same', localDate: '2026-09-01', content: 'two', savedAsStar: false, timezone: 'UTC', createdAt: stamp, updatedAt: stamp }] }))
    for (const fixture of cases) {
      expect(() => normalizeRestoreText(JSON.stringify(fixture))).toThrow()
    }
    expect(calls).toBe(0)
    void adapter
  })

  it('treats an explicit empty diary collection as authoritative', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    await adapter.put('diaries', { id: 'day3', localDate: '2026-09-03', content: 'remove', savedAsStar: false, timezone: 'UTC', createdAt: stamp, updatedAt: stamp })
    await restoreAppData({ adapter }, buildRestorePlan(backup({ diaries: [] })))
    expect(await adapter.getAll('diaries')).toEqual([])
  })

  it('restores Mood Stars, Clarity Stars, and score awards as an authoritative snapshot', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    await adapter.put('stars', { id: 'day3-mood', type: 'mood', content: 'remove', localDate: '2026-09-03', timezone: 'UTC', createdAt: stamp, updatedAt: stamp })
    await adapter.put('stars', { id: 'day3-clarity', type: 'clear_mind', content: 'remove', localDate: '2026-09-03', timezone: 'UTC', createdAt: stamp, updatedAt: stamp })
    await adapter.put('scoreAwards', { id: 'day3-award', awardType: 'daily_open', points: 1, localDate: '2026-09-03', timezone: 'UTC', createdAt: stamp, updatedAt: stamp })
    const moodStar = { id: 'day1-mood', type: 'mood' as const, content: 'mood', mood: 'happy' as const, localDate: '2026-09-01', timezone: 'UTC', createdAt: stamp, updatedAt: stamp }
    const clarityStar = { id: 'day1-clarity', type: 'clear_mind' as const, content: 'clarity', localDate: '2026-09-01', timezone: 'UTC', createdAt: stamp, updatedAt: stamp }
    const award = { id: 'day1-award', awardType: 'diary_created' as const, points: 7, localDate: '2026-09-01', timezone: 'UTC', createdAt: stamp, updatedAt: stamp }
    await restoreAppData({ adapter }, buildRestorePlan(backup({ stars: [moodStar, clarityStar], scoreAwards: [award] })))
    expect(await adapter.getAll('stars')).toEqual([moodStar, clarityStar]); expect(await adapter.getAll('scoreAwards')).toEqual([award])
    expect((await adapter.getAll<{ points: number }>('scoreAwards')).reduce((total, item) => total + item.points, 0)).toBe(7)
  })

  it('removes local photo references while preserving photo stores and accepts Build 6 data', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    await adapter.put('photoAssets', { id: 'local-photo', localUri: 'file://local' })
    await adapter.put('profiles', { id: 'user', kind: 'user', nickname: 'with photo', photoAssetId: 'local-photo', createdAt: stamp, updatedAt: stamp })
    await adapter.put('profiles', { id: 'partner', kind: 'partner', nickname: 'partner', createdAt: stamp, updatedAt: stamp })
    const plan = buildRestorePlan(backup({ memoryMoments: [{ id: 'moment', content: 'restored', localDate: '2026-09-01', order: 1, createdAt: stamp, updatedAt: stamp }] }, 6))
    await restoreAppData({ adapter }, plan)
    expect(await adapter.getAll('photoAssets')).toEqual([{ id: 'local-photo', localUri: 'file://local' }])
    expect(await adapter.get<{ photoAssetId?: string }>('profiles', 'user')).toEqual(expect.not.objectContaining({ photoAssetId: expect.anything() }))
    expect(await adapter.get<{ photoAssetId?: string }>('memoryMoments', 'moment')).toEqual(expect.not.objectContaining({ photoAssetId: expect.anything() }))
  })
})
