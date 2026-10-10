import { describe, expect, it, vi } from 'vitest'
import { MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { LocalHeartTalkTerminalRepository } from '../../data/repositories/heartTalkTerminalRepository'

vi.mock('./heartTalkTerminalSyncFeature', () => ({ HEART_TALK_TERMINAL_SYNC_ENABLED: true }))

import { syncHeartTalkTerminalHistory } from './heartTalkTerminalSync'

const response = { items: [{ pairId: 'pair-alice-bob', invitationId: 'invite-001', status: 'completed' as const, terminalAt: '2026-10-10T12:00:00.000Z', scheduledLocalDate: '2026-10-10', startTime: '20:00', endTime: '20:30', topicType: 'official' as const, officialTopicId: 'Q001' }], snapshotAt: '2026-10-10T12:01:00.000Z' }

describe('enabled Heart Talk terminal sync guard', () => {
  it('drops a stale Pair response before it reaches local history', async () => {
    const storage = new MemoryStorageAdapter(); const repository = new LocalHeartTalkTerminalRepository(storage)
    const result = await syncHeartTalkTerminalHistory(repository, vi.fn().mockResolvedValue(response), 'pair-carol-dan', async () => false)
    expect(result).toEqual({ status: 'stale' })
    expect(await storage.getAll('completedHeartTalks')).toEqual([])
  })
})
