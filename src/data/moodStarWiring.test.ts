import { describe, expect, it } from 'vitest'
import { initializePersistence } from './persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from './storage/MemoryStorageAdapter'
import type { MoodKey, MoodRecord, ScoreAward, Star } from './types'

const timestamp = '2026-09-01T10:00:00.000Z'
const timezone = 'Asia/Taipei'

function moodRecord(localDate: string, mood: MoodKey): MoodRecord {
  return { id: localDate, localDate, mood, timezone, createdAt: timestamp, updatedAt: timestamp }
}

async function open(backing = createMemoryStorageBacking(), localDate = '2026-09-01') {
  return initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate })
}

function moodStars(stars: Star[]) { return stars.filter((star) => star.type === 'mood') }

describe('Mood Star wiring and legacy reconciliation', () => {
  it('creates one mood star with the first mood and keeps the +2 award idempotent', async () => {
    const runtime = await open()
    await runtime.moods.setMood('miss', '2026-09-01')
    await runtime.moods.setMood('miss', '2026-09-01')

    const stars = moodStars(await runtime.stars.getStars())
    const awards = (await runtime.scores.getAwards()).filter((award) => award.awardType === 'mood_selected')
    expect(stars).toEqual([expect.objectContaining({ type: 'mood', sourceType: 'mood', sourceId: '2026-09-01', localDate: '2026-09-01', mood: 'miss' })])
    expect(awards).toHaveLength(1)
    expect(awards[0].points).toBe(2)
  })

  it('updates the same day star on mood replacement without another award, and creates an independent next-day star', async () => {
    const runtime = await open()
    await runtime.moods.setMood('miss', '2026-09-01')
    await runtime.moods.setMood('happy', '2026-09-01')
    await runtime.moods.setMood('peaceful', '2026-09-02')

    const stars = moodStars(await runtime.stars.getStars()).sort((left, right) => left.localDate.localeCompare(right.localDate))
    expect(stars).toHaveLength(2)
    expect(stars[0]).toMatchObject({ sourceId: '2026-09-01', mood: 'happy', content: 'happy' })
    expect(stars[1]).toMatchObject({ sourceId: '2026-09-02', mood: 'peaceful', content: 'peaceful' })
    expect((await runtime.scores.getAwards()).filter((award) => award.awardType === 'mood_selected')).toHaveLength(2)
  })

  it('backfills every unique legacy MoodRecord without touching scoreAwards or clear stars, and is safe after reopen', async () => {
    const backing = createMemoryStorageBacking()
    const adapter = new MemoryStorageAdapter(backing)
    await adapter.open()
    for (let day = 1; day <= 6; day += 1) await adapter.put('moods', moodRecord(`2026-08-0${day}`, 'happy'))
    const clear: Star = { id: 'clear-star', type: 'clear_mind', sourceType: 'clear_record', sourceId: 'clear-1', content: 'clear_record', localDate: '2026-08-01', timezone, createdAt: timestamp, updatedAt: timestamp }
    const award: ScoreAward = { id: 'legacy-award', awardType: 'diary_created', points: 7, localDate: '2026-08-01', timezone, createdAt: timestamp, updatedAt: timestamp }
    await adapter.put('stars', clear)
    await adapter.put('scoreAwards', award)
    adapter.close()

    const first = await open(backing)
    const scoreAfterBackfill = await first.scores.getTotal()
    expect(moodStars(await first.stars.getStars())).toHaveLength(6)
    expect((await first.stars.getStars()).filter((star) => star.type === 'clear_mind')).toEqual([clear])
    expect(scoreAfterBackfill).toBe(8) // Existing +7 and startup daily_open +1 only.
    first.adapter.close()

    const reopened = await open(backing)
    const allStars = await reopened.stars.getStars()
    expect(moodStars(allStars)).toHaveLength(6)
    expect(allStars.filter((star) => star.type === 'clear_mind')).toHaveLength(1)
    expect(await reopened.scores.getTotal()).toBe(scoreAfterBackfill)
  })

  it('does not duplicate an already-linked legacy mood star and keeps type queries separate', async () => {
    const backing = createMemoryStorageBacking()
    const adapter = new MemoryStorageAdapter(backing)
    await adapter.open()
    const record = moodRecord('2026-08-01', 'sad')
    const existing: Star = { id: 'existing-mood-star', type: 'mood', sourceType: 'mood', sourceId: record.localDate, content: 'sad', mood: 'sad', localDate: record.localDate, timezone, createdAt: timestamp, updatedAt: timestamp }
    await adapter.put('moods', record)
    await adapter.put('stars', existing)
    adapter.close()

    const runtime = await open(backing)
    expect(await runtime.stars.getStarsByType('mood')).toHaveLength(1)
    expect(await runtime.stars.getStarsByType('clear_mind')).toHaveLength(0)
    await runtime.stars.reconcileMoodStars(await runtime.moods.getMoods())
    expect(await runtime.stars.getStarsByType('mood')).toHaveLength(1)
  })
})
