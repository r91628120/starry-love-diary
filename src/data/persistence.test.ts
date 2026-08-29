import { describe, expect, it } from 'vitest'
import { initializePersistence } from './persistence'
import { HeartPhraseLimitError, LocalDiaryRepository, LocalHeartPhraseRepository, LocalMoodRepository, LocalScoreRepository, LocalSettingsRepository, LocalStarRepository } from './repositories/repositories'
import { filterStarsByRange } from '../features/star-bottle/filterStars'
import { advanceHeartPhraseRitual } from '../features/today/heartPhraseRitual'
import { createMemoryStorageBacking, MemoryStorageAdapter } from './storage/MemoryStorageAdapter'

describe('Local persistence repositories', () => {
  it('awards daily open once per local day and survives reopen', async () => {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-08-29' })
    expect(first.initial.starHeartTotal).toBe(1)
    first.adapter.close()
    const sameDay = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-08-29' })
    expect(sameDay.initial.starHeartTotal).toBe(1)
    sameDay.adapter.close()
    const nextDay = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-08-30' })
    expect(nextDay.initial.starHeartTotal).toBe(2)
  })

  it('awards diary create once while update and delete do not change earned score', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const scores = new LocalScoreRepository(adapter)
    const diaries = new LocalDiaryRepository(adapter, scores)
    const entry = await diaries.createDiary({ localDate: '2026-08-29', content: '日記' })
    expect(await scores.getTotal()).toBe(7)
    await diaries.updateDiary(entry.id, { content: '修改' })
    await diaries.deleteDiary(entry.id)
    expect(await scores.getTotal()).toBe(7)
  })

  it('awards mood and quote share only once per day', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const scores = new LocalScoreRepository(adapter)
    const moods = new LocalMoodRepository(adapter, scores)
    await moods.setMood('happy', '2026-08-29')
    await moods.setMood('sad', '2026-08-29')
    await scores.award('quote_shared', { localDate: '2026-08-29' })
    await scores.award('quote_shared', { localDate: '2026-08-29' })
    expect(await scores.getTotal()).toBe(12)
  })

  it('validates, edits, deletes, limits and reopens heart phrases', async () => {
    const backing = createMemoryStorageBacking()
    const adapter = new MemoryStorageAdapter(backing); await adapter.open()
    const phrases = new LocalHeartPhraseRepository(adapter)
    await expect(phrases.acceptHeartPhrase('字'.repeat(31))).rejects.toThrow(/30/)
    const created = await phrases.acceptHeartPhrase('第一句')
    await phrases.updateHeartPhrase(created.id, '修改後')
    adapter.close()
    const reopenedAdapter = new MemoryStorageAdapter(backing); await reopenedAdapter.open()
    const reopened = new LocalHeartPhraseRepository(reopenedAdapter)
    expect((await reopened.getHeartPhrases())[0].content).toBe('修改後')
    await reopened.deleteHeartPhrase(created.id)
    expect(await reopened.getHeartPhrases()).toEqual([])
    for (let index = 0; index < 20; index += 1) await reopened.acceptHeartPhrase(`句子 ${index}`)
    await expect(reopened.acceptHeartPhrase('超過上限')).rejects.toBeInstanceOf(HeartPhraseLimitError)
  })

  it('keeps the first six heart presses informal and accepts on the seventh', () => {
    let presses = 0
    for (let index = 0; index < 6; index += 1) {
      const result = advanceHeartPhraseRitual(presses)
      expect(result.accepted).toBe(false)
      presses = result.nextPresses
    }
    expect(advanceHeartPhraseRitual(presses)).toEqual({ accepted: true, nextPresses: 0 })
  })

  it('filters real stars by today, month, year and all without mock seeds', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const repository = new LocalStarRepository(adapter)
    expect(await repository.getStars()).toEqual([])
    await repository.createStar({ type: 'mood', content: '今日', localDate: '2026-08-29' })
    await repository.createStar({ type: 'clear_mind', content: '本月', localDate: '2026-08-01' })
    await repository.createStar({ type: 'mood', content: '本年', localDate: '2026-07-01' })
    const stars = await repository.getStars()
    expect(filterStarsByRange(stars, 'today', '2026-08-29')).toHaveLength(1)
    expect(filterStarsByRange(stars, 'month', '2026-08-29')).toHaveLength(2)
    expect(filterStarsByRange(stars, 'year', '2026-08-29')).toHaveLength(3)
    expect(filterStarsByRange(stars, 'all', '2026-08-29')).toHaveLength(3)
  })
  it('seeds default profiles and preserves profile changes after reopening storage', async () => {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW' })
    expect(first.initial.userProfile.nickname).toBe('星星')
    expect(first.initial.partnerProfile.nickname).toBe('星星')
    await first.profiles.updateProfile('user', { nickname: '小星' })
    first.adapter.close()

    const reopened = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'en' })
    expect(reopened.initial.userProfile.nickname).toBe('小星')
    expect(reopened.initial.partnerProfile.nickname).toBe('星星')
  })

  it('creates one mood per local date, updates the same day, and separates different days', async () => {
    const adapter = new MemoryStorageAdapter()
    await adapter.open()
    const moods = new LocalMoodRepository(adapter)
    const first = await moods.setMood('happy', '2026-08-29')
    const updated = await moods.setMood('peaceful', '2026-08-29')
    await moods.setMood('miss', '2026-08-30')
    expect(updated.id).toBe(first.id)
    expect(updated.createdAt).toBe(first.createdAt)
    expect((await moods.getMoodByLocalDate('2026-08-29'))?.mood).toBe('peaceful')
    expect(await adapter.getAll('moods')).toHaveLength(2)
  })

  it('supports diary create, read, update, delete and rejects content over 1000 characters', async () => {
    const adapter = new MemoryStorageAdapter()
    await adapter.open()
    const diaries = new LocalDiaryRepository(adapter)
    const created = await diaries.createDiary({ localDate: '2026-08-29', content: '第一篇日記' })
    expect((await diaries.getDiary(created.id))?.content).toBe('第一篇日記')
    expect((await diaries.getDiaryByLocalDate('2026-08-29'))?.id).toBe(created.id)
    const updated = await diaries.updateDiary(created.id, { content: '更新後的日記' })
    expect(updated.content).toBe('更新後的日記')
    await expect(diaries.createDiary({ content: '字'.repeat(1001) })).rejects.toThrow(/1000/)
    await diaries.deleteDiary(created.id)
    expect(await diaries.getDiary(created.id)).toBeUndefined()
  })

  it('persists locale, reminder toggles and reminder time', async () => {
    const backing = createMemoryStorageBacking()
    const firstAdapter = new MemoryStorageAdapter(backing)
    await firstAdapter.open()
    const first = new LocalSettingsRepository(firstAdapter)
    await first.ensureDefault('zh-TW')
    await first.updateSettings({ locale: 'fr', loveQuoteReminderEnabled: false, importantDateReminderEnabled: false, reminderTime: '07:45' })
    firstAdapter.close()
    const reopenedAdapter = new MemoryStorageAdapter(backing)
    await reopenedAdapter.open()
    const reopened = new LocalSettingsRepository(reopenedAdapter)
    expect(await reopened.getSettings()).toMatchObject({ locale: 'fr', loveQuoteReminderEnabled: false, importantDateReminderEnabled: false, reminderTime: '07:45' })
  })

  it('creates, queries and deletes stars without seeding mock statistics', async () => {
    const adapter = new MemoryStorageAdapter()
    await adapter.open()
    const stars = new LocalStarRepository(adapter)
    expect(await stars.getStars()).toEqual([])
    const mood = await stars.createStar({ type: 'mood', content: '今天很安心', localDate: '2026-08-29' })
    await stars.createStar({ type: 'clear_mind', content: '先把未知留在未知', localDate: '2026-08-30' })
    expect(await stars.getStars()).toHaveLength(2)
    expect(await stars.getStarsByType('mood')).toEqual([mood])
    expect(await stars.getStarsByLocalDate('2026-08-30')).toHaveLength(1)
    await stars.deleteStar(mood.id)
    expect(await stars.getStarsByType('mood')).toEqual([])
  })
})
