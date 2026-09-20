import { act, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PersistenceProvider } from './PersistenceContext'
import { usePersistence, type PersistenceContextValue } from './PersistenceStateContext'
import { initializePersistence } from './persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from './storage/MemoryStorageAdapter'
import { buildRestorePlan } from '../services/restoreAppData'
import type { AppDataExport } from '../services/exportAppData'

const stamp = '2026-09-01T00:00:00.000Z'
function dayOne(): AppDataExport {
  return { format: 'starry-love-diary-data', exportVersion: 1, app: { name: 'Starry Love Diary', schemaVersion: 7 }, exportedAt: stamp, exportedLocalDate: '2026-09-01', data: {
    profiles: [{ id: 'user', kind: 'user', nickname: 'Day 1 user', createdAt: stamp, updatedAt: stamp }, { id: 'partner', kind: 'partner', nickname: 'Day 1 partner', createdAt: stamp, updatedAt: stamp }],
    moods: [{ id: '2026-09-01', localDate: '2026-09-01', mood: 'happy', timezone: 'UTC', createdAt: stamp, updatedAt: stamp }],
    diaries: [{ id: 'day1-diary', localDate: '2026-09-01', content: 'Day 1 diary', savedAsStar: false, timezone: 'UTC', createdAt: stamp, updatedAt: stamp }],
    clearRecords: { organizeFeelings: [], loveBoatAssessments: [], loveBrainAssessments: [], likeOrHabitReflections: [] },
    stars: [{ id: 'day1-star', type: 'mood', content: 'Day 1 star', mood: 'happy', localDate: '2026-09-01', timezone: 'UTC', createdAt: stamp, updatedAt: stamp }],
    scoreAwards: [{ id: 'day1-award', awardType: 'diary_created', points: 7, localDate: '2026-09-01', timezone: 'UTC', createdAt: stamp, updatedAt: stamp }],
    heartPhrases: [{ id: 'day1-heart', content: 'Day 1 heart', order: 1, acceptedAt: stamp, createdAt: stamp, updatedAt: stamp }],
    importantDates: [{ id: 'day1-date', type: 'custom', title: 'Day 1 date', date: '2026-09-02', createdAt: stamp, updatedAt: stamp }],
    memoryMoments: [{ id: 'day1-moment', content: 'Day 1 moment', localDate: '2026-09-01', order: 1, createdAt: stamp, updatedAt: stamp }],
    messageToYou: null, messageToYouEntries: [{ id: 'day1-message', type: 'free_message', content: 'Day 1 message', localDate: '2026-09-01', timezone: 'UTC', createdAt: stamp, updatedAt: stamp }],
    rememberedYouCards: [{ id: 'day1-card', title: 'Day 1 card', content: 'remembered', localDate: '2026-09-01', isFavorite: false, createdAt: stamp, updatedAt: stamp }],
    settings: { id: 'settings', locale: 'en', dailyLoveQuoteActivationDate: '2026-09-01', loveQuoteReminderEnabled: false, importantDateReminderEnabled: false, reminderTime: '09:00', schemaVersion: 7, createdAt: stamp, updatedAt: stamp },
  } }
}

describe('PersistenceContext Restore rehydration', () => {
  it('rehydrates restored canonical state while retaining this device settings and clearing temporary state', async () => {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-01' })
    await first.profiles.updateProfile('user', { nickname: 'Day 3 user' })
    await first.settings.updateSettings({ locale: 'zh-TW', onboardingCompleted: true, reminderTime: '21:30', loveQuoteReminderEnabled: true })
    await first.diaryDrafts.saveDraft('2026-09-01', 'Day 3 draft')
    await first.adapter.put('starDropPresentations', { id: 'day3-presentation', starId: 'day3-star', state: 'pending', queuedAt: stamp })
    first.adapter.close()
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-01' })
    let state: PersistenceContextValue | null = null
    function Probe() { state = usePersistence(); return null }
    render(<PersistenceProvider runtime={runtime}><Probe /></PersistenceProvider>)
    await act(async () => { await state!.restoreAppData(buildRestorePlan(dayOne())) })
    await waitFor(() => expect(state!.userProfile.nickname).toBe('Day 1 user'))
    expect(state!.partnerProfile.nickname).toBe('Day 1 partner'); expect(state!.todayMood?.mood).toBe('happy'); expect(state!.todayDiary?.content).toBe('Day 1 diary')
    expect(state!.starHeartTotal).toBe(7); expect(state!.stars).toEqual([expect.objectContaining({ id: 'day1-star' })]); expect(state!.heartPhrases).toEqual([expect.objectContaining({ id: 'day1-heart' })])
    expect(state!.importantDates).toEqual([expect.objectContaining({ id: 'day1-date' })]); expect(state!.memoryMoments).toEqual([expect.objectContaining({ id: 'day1-moment' })]); expect(state!.messageToYouEntries).toEqual([expect.objectContaining({ id: 'day1-message' })]); expect(state!.rememberedYouCards).toEqual([expect.objectContaining({ id: 'day1-card' })]); expect(state!.diaryCount).toBe(1)
    expect(state!.settings).toMatchObject({ locale: 'zh-TW', onboardingCompleted: true, reminderTime: '21:30', loveQuoteReminderEnabled: true })
    expect(await runtime.adapter.getAll('diaryDrafts')).toEqual([]); expect(await runtime.adapter.getAll('starDropPresentations')).toEqual([])
  })
})
