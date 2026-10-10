import type { LocalHeartTalkTerminalRepository, RemoteHeartTalkTerminalPage } from '../../data/repositories/heartTalkTerminalRepository'
import { getHeartTalkTerminalHistory, type HeartTalkTerminalHistoryPage } from './heartTalkClient'
import { HEART_TALK_TERMINAL_SYNC_ENABLED } from './heartTalkTerminalSyncFeature'

function page(value: HeartTalkTerminalHistoryPage): RemoteHeartTalkTerminalPage { return value }
type ActivePair = { pairId: string; memberUids: string[]; status: 'active' }
type SyncResult = { status: 'disabled' | 'synced' | 'stale' | 'unavailable' | 'unpaired' }
const pairSyncs = new Map<string, Promise<SyncResult>>()

/** No UI calls this while the deployment gate remains disabled. */
export async function syncHeartTalkTerminalHistory(repository: LocalHeartTalkTerminalRepository, fetchPage = getHeartTalkTerminalHistory, expectedPairId?: string, isCurrentPair?: () => Promise<boolean>): Promise<SyncResult> {
  if (!HEART_TALK_TERMINAL_SYNC_ENABLED) return { status: 'disabled' as const }
  let cursor: string | undefined
  do {
    const response = await fetchPage({ cursor, pageSize: 25 })
    if ((expectedPairId && response.items.some((item) => item.pairId !== expectedPairId)) || (isCurrentPair && !(await isCurrentPair()))) return { status: 'stale' }
    await repository.applyRemotePage(page(response))
    cursor = response.nextCursor
  } while (cursor)
  return { status: 'synced' as const }
}

/**
 * Page-level entry point for a future authorized rollout. It waits for Firebase
 * Auth restoration and verifies the active Pair immediately before local writes.
 */
export async function syncHeartTalkTerminalHistoryForActivePair(repository: LocalHeartTalkTerminalRepository): Promise<SyncResult> {
  if (!HEART_TALK_TERMINAL_SYNC_ENABLED) return { status: 'disabled' }
  try {
    const [{ firebaseAuth }, durableIdentity, { loadPairState }] = await Promise.all([
      import('./firebaseAuth'), import('./durableIdentity'), import('./pairClient'),
    ])
    await firebaseAuth.authStateReady()
    const user = firebaseAuth.currentUser
    if (!user || !durableIdentity.getDurableIdentityState(user).hasAppleIdentity) return { status: 'unavailable' }
    const pair = await loadPairState() as ActivePair | null
    if (!pair) return { status: 'unpaired' }
    const inFlight = pairSyncs.get(pair.pairId)
    if (inFlight) return inFlight
    const task = syncHeartTalkTerminalHistory(repository, getHeartTalkTerminalHistory, pair.pairId, async () => (await loadPairState())?.pairId === pair.pairId)
      .finally(() => { if (pairSyncs.get(pair.pairId) === task) pairSyncs.delete(pair.pairId) })
    pairSyncs.set(pair.pairId, task)
    return task
  } catch {
    return { status: 'unavailable' }
  }
}
