import { describe, expect, it, vi } from 'vitest'
import { initializePersistence } from '../data/persistence'
import { MemoryStorageAdapter } from '../data/storage/MemoryStorageAdapter'
import { PHOTO_V5_STORE_NAMES } from '../data/storage/StorageAdapter'
import { SCHEMA_VERSION } from '../data/storage/IndexedDbStorageAdapter'
import { buildClearCurrentRelationshipPlan, clearCurrentRelationshipData } from './clearCurrentRelationshipData'

const storyStores = ['moods', 'diaries', 'stars', 'scoreAwards', 'heartPhrases', 'importantDates', 'memoryMoments', 'messageToYou', 'rememberedYouCards', 'clearRecords', 'loveBoatAssessments', 'loveBrainAssessments', 'likeOrHabitReflections'] as const

describe('clear current relationship data', () => {
  it('preflights, clears story and photo stores, preserves app settings, and triggers no business action', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'fr', localDate: '2026-09-14' })
    await runtime.settings.updateSettings({ onboardingCompleted: true, loveQuoteReminderEnabled: false, importantDateReminderEnabled: false, reminderTime: '07:35' })
    for (const store of storyStores) await runtime.adapter.put(store, { id: `${store}-1`, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' })
    for (const store of PHOTO_V5_STORE_NAMES) await runtime.adapter.put(store, { id: `${store}-1` })
    const award = vi.spyOn(runtime.scores, 'award')
    const plan = await buildClearCurrentRelationshipPlan(runtime)
    expect(plan.total).toBeGreaterThan(0)

    const result = await clearCurrentRelationshipData(runtime)
    for (const store of storyStores) expect(await runtime.adapter.getAll(store)).toHaveLength(0)
    for (const store of PHOTO_V5_STORE_NAMES) expect(await runtime.adapter.getAll(store)).toHaveLength(0)
    expect(await runtime.profiles.getProfile('user')).toMatchObject({ id: 'user' })
    expect(await runtime.profiles.getProfile('user')).not.toHaveProperty('photoAssetId')
    expect(await runtime.profiles.getProfile('partner')).toMatchObject({ id: 'partner' })
    expect(await runtime.profiles.getProfile('partner')).not.toHaveProperty('photoAssetId')
    expect(result.settings).toMatchObject({ locale: 'fr', schemaVersion: SCHEMA_VERSION, onboardingCompleted: false, loveQuoteReminderEnabled: false, importantDateReminderEnabled: false, reminderTime: '07:35' })
    expect(await runtime.scores.getTotal()).toBe(0)
    expect(award).not.toHaveBeenCalled()
  })

  it('fails before writes when settings are unavailable', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-09-14' })
    await runtime.adapter.put('diaries', { id: 'keep-me' })
    await runtime.adapter.delete('settings', 'settings')
    await expect(clearCurrentRelationshipData(runtime)).rejects.toThrow('Settings are unavailable')
    expect(await runtime.adapter.get('diaries', 'keep-me')).toBeDefined()
  })
})
