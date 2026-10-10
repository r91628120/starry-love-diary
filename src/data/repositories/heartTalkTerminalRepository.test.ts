import { describe, expect, it, vi } from 'vitest'
import { MemoryStorageAdapter } from '../storage/MemoryStorageAdapter'
import { LocalHeartTalkTerminalRepository, type RemoteHeartTalkTerminalPage } from './heartTalkTerminalRepository'

const item = (pairId = 'pair-alice-bob', invitationId = 'invite-001', status: 'completed' | 'declined' | 'cancelled' | 'expired' = 'completed') => ({ pairId, invitationId, status, terminalAt: '2026-10-10T12:00:00.000Z', scheduledLocalDate: '2026-10-10', startTime: '20:00', endTime: '20:30', topicType: 'official' as const, officialTopicId: 'Q001' })
const page = (items = [item()], snapshotAt = '2026-10-10T12:01:00.000Z'): RemoteHeartTalkTerminalPage => ({ items, snapshotAt, nextCursor: 'opaque-cursor' })

describe('local Heart Talk terminal history', () => {
  it('is idempotent per Pair and invitation, while distinct Pairs stay distinct', async () => {
    const storage = new MemoryStorageAdapter(); const repository = new LocalHeartTalkTerminalRepository(storage)
    const old = { ...item(), terminalAt: '2026-10-09T12:00:00.000Z' }
    await repository.applyRemotePage(page([old]))
    await repository.applyRemotePage(page([old]))
    await repository.applyRemotePage(page([item('pair-carol-dan')]))
    expect((await storage.getAll('completedHeartTalks')).length).toBe(2)
    expect((await repository.listTerminalHistory()).map((record) => record.pairId).sort()).toEqual(['pair-alice-bob', 'pair-carol-dan'])
  })

  it('keeps declined, cancelled, and expired terminal metadata out of the completed count', async () => {
    const storage = new MemoryStorageAdapter(); const repository = new LocalHeartTalkTerminalRepository(storage)
    await repository.applyRemotePage(page([item('pair-alice-bob', 'invite-002', 'declined'), item('pair-alice-bob', 'invite-003', 'cancelled'), item('pair-alice-bob', 'invite-004', 'expired')]))
    expect(await storage.getAll('completedHeartTalks')).toEqual([])
    expect(await repository.listTerminalHistory()).toHaveLength(3)
  })

  it('creates an invitation tombstone on one-record deletion so a retry cannot revive it', async () => {
    const storage = new MemoryStorageAdapter(); const repository = new LocalHeartTalkTerminalRepository(storage)
    await repository.applyRemotePage(page())
    const completed = await storage.getAll<{ id: string }>('completedHeartTalks')
    await repository.deleteCompletedHistory(completed[0].id)
    await repository.applyRemotePage(page())
    expect(await storage.getAll('completedHeartTalks')).toEqual([])
    expect(await repository.listTerminalHistory()).toEqual([])
    expect(await repository.listTombstones()).toHaveLength(1)
  })

  it('allows a new terminal record after an offline clear even when the phone clock is two days ahead', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-12T12:00:00.000Z'))
    const storage = new MemoryStorageAdapter(); const repository = new LocalHeartTalkTerminalRepository(storage)
    const old = { ...item(), terminalAt: '2026-10-09T12:00:00.000Z' }
    await repository.applyRemotePage(page([old]))
    await repository.clearAllHistory()
    // A device clock two days ahead or behind cannot affect this anchor.
    await repository.applyRemotePage(page([old], '2026-10-10T12:01:00.000Z'))
    expect(await storage.getAll('completedHeartTalks')).toEqual([])
    expect(await repository.listTerminalHistory()).toEqual([])
    const newer = { ...item('pair-alice-bob', 'invite-002'), terminalAt: '2026-10-10T12:02:00.000Z' }
    await repository.applyRemotePage(page([newer], '2026-10-10T12:03:00.000Z'))
    expect(await storage.getAll('completedHeartTalks')).toHaveLength(1)
    vi.useRealTimers()
  })

  it('does not revive cleared data when the phone clock is two days behind', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-08T12:00:00.000Z'))
    const storage = new MemoryStorageAdapter(); const repository = new LocalHeartTalkTerminalRepository(storage)
    const old = { ...item(), terminalAt: '2026-10-09T12:00:00.000Z' }
    await repository.applyRemotePage(page([old]))
    await repository.clearAllHistory()
    await repository.applyRemotePage(page([old], '2026-10-10T12:01:00.000Z'))
    expect(await storage.getAll('completedHeartTalks')).toEqual([])
    vi.useRealTimers()
  })

  it('keeps pair-less Build 42 history without guessing its Pair or double-counting a matching cloud invitation', async () => {
    const storage = new MemoryStorageAdapter(); const repository = new LocalHeartTalkTerminalRepository(storage)
    await storage.put('completedHeartTalks', { id: 'legacy', sourceInvitationId: 'invite-001', topicType: 'official', questionId: 'Q001', localDate: '2026-10-10', startTime: '20:00', endTime: '20:30', createdAt: '2026-10-10T00:00:00.000Z', updatedAt: '2026-10-10T00:00:00.000Z' })
    await repository.applyRemotePage(page())
    const completed = await storage.getAll<{ id: string; sourcePairId?: string }>('completedHeartTalks')
    expect(completed).toHaveLength(1)
    expect(completed[0]).toMatchObject({ id: 'legacy' })
    expect(completed[0].sourcePairId).toBeUndefined()
    expect(await repository.listTerminalHistory()).toHaveLength(1)
  })
})
