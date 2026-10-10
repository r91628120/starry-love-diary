import type { LocalHeartTalkTerminalRepository, RemoteHeartTalkTerminalPage } from '../../data/repositories/heartTalkTerminalRepository'
import { getHeartTalkTerminalHistory, type HeartTalkTerminalHistoryPage } from './heartTalkClient'
import { HEART_TALK_TERMINAL_SYNC_ENABLED } from './heartTalkTerminalSyncFeature'

function page(value: HeartTalkTerminalHistoryPage): RemoteHeartTalkTerminalPage { return value }

/** No UI calls this while the deployment gate remains disabled. */
export async function syncHeartTalkTerminalHistory(repository: LocalHeartTalkTerminalRepository, fetchPage = getHeartTalkTerminalHistory) {
  if (!HEART_TALK_TERMINAL_SYNC_ENABLED) return { status: 'disabled' as const }
  let cursor: string | undefined
  do {
    const response = await fetchPage({ cursor, pageSize: 25 })
    await repository.applyRemotePage(page(response))
    cursor = response.nextCursor
  } while (cursor)
  return { status: 'synced' as const }
}
