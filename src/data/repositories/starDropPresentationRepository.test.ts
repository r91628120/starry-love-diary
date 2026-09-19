import { describe, expect, it } from 'vitest'
import { MemoryStorageAdapter, createMemoryStorageBacking } from '../storage/MemoryStorageAdapter'
import type { Star } from '../types'
import { LocalStarDropPresentationRepository } from './starDropPresentationRepository'
import { initializePersistence } from '../persistence'

function star(id: string, type: Star['type'] = 'mood'): Star {
  return { id, type, content: type, localDate: '2026-09-19', timezone: 'Asia/Taipei', createdAt: `2026-09-19T00:00:0${id.length}.000Z`, updatedAt: '2026-09-19T00:00:00.000Z' }
}

describe('Star Drop presentation state', () => {
  it('persists a newly earned star until the bottle can claim it', async () => {
    const backing = createMemoryStorageBacking()
    const firstAdapter = new MemoryStorageAdapter(backing); await firstAdapter.open()
    const first = new LocalStarDropPresentationRepository(firstAdapter)
    const mood = star('mood-star')
    await first.queue(mood)
    firstAdapter.close()

    const reopenedAdapter = new MemoryStorageAdapter(backing); await reopenedAdapter.open()
    const reopened = new LocalStarDropPresentationRepository(reopenedAdapter)
    expect(await reopened.claimRepresentative([mood])).toEqual(mood)
    expect(await reopened.claimRepresentative([mood])).toBeUndefined()
  })

  it('shows one representative for multiple pending stars and never changes the real star list', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const repository = new LocalStarDropPresentationRepository(adapter)
    const first = star('first', 'mood')
    const latest = star('latest', 'clear_mind')
    await repository.queue(first)
    await repository.queue(latest)

    expect(await repository.claimRepresentative([first, latest])).toEqual(latest)
    expect(await repository.claimRepresentative([first, latest])).toBeUndefined()
    expect(await adapter.getAll<Star>('stars')).toEqual([])
  })

  it('drops obsolete pending references when their canonical stars are gone', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const repository = new LocalStarDropPresentationRepository(adapter)
    await repository.queue(star('deleted'))
    expect(await repository.claimRepresentative([])).toBeUndefined()
    expect(await adapter.getAll('starDropPresentations')).toEqual([])
  })

  it('queues only a newly created mood star and retains it through a runtime reopen', async () => {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-19' })
    await first.moods.setMood('happy', '2026-09-19')
    await first.moods.setMood('peaceful', '2026-09-19')
    const [mood] = await first.stars.getStarsByType('mood')
    first.adapter.close()

    const reopened = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-19' })
    expect(await reopened.starDropPresentations.claimRepresentative(await reopened.stars.getStars())).toMatchObject({ id: mood.id, mood: 'peaceful' })
    expect((await reopened.stars.getStarsByType('mood'))).toHaveLength(1)
  })
})
