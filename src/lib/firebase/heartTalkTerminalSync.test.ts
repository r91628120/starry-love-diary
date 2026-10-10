import { describe, expect, it, vi } from 'vitest'
import { MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { LocalHeartTalkTerminalRepository } from '../../data/repositories/heartTalkTerminalRepository'
import { syncHeartTalkTerminalHistory } from './heartTalkTerminalSync'
import { HEART_TALK_TERMINAL_SYNC_ENABLED } from './heartTalkTerminalSyncFeature'

describe('Heart Talk terminal sync deployment gate', () => {
  it('is disabled by default and never calls the source-only callable', async () => {
    const fetchPage = vi.fn()
    const result = await syncHeartTalkTerminalHistory(new LocalHeartTalkTerminalRepository(new MemoryStorageAdapter()), fetchPage)
    expect(HEART_TALK_TERMINAL_SYNC_ENABLED).toBe(false)
    expect(result).toEqual({ status: 'disabled' })
    expect(fetchPage).not.toHaveBeenCalled()
  })
})
