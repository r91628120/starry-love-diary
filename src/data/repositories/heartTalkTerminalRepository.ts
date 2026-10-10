import type { CompletedHeartTalk, HeartTalkHistoryTombstone, HeartTalkSyncState, HeartTalkTerminalHistory, HeartTalkTerminalStatus } from '../types'
import type { StorageAdapter } from '../storage/StorageAdapter'

const INVITATION_ID = /^[A-Za-z0-9_-]{8,128}$/u
const PAIR_ID = /^[A-Za-z0-9_-]{8,128}$/u
const DATE = /^\d{4}-\d{2}-\d{2}$/u
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/u
const TERMINAL_STATUSES = new Set<HeartTalkTerminalStatus>(['completed', 'declined', 'cancelled', 'expired'])

export type RemoteHeartTalkTerminal = Omit<HeartTalkTerminalHistory, 'id' | 'createdAt' | 'updatedAt'>
export type RemoteHeartTalkTerminalPage = { items: RemoteHeartTalkTerminal[]; nextCursor?: string; snapshotAt: string }

function now() { return new Date().toISOString() }
function identity(pairId: string, invitationId: string) { return `heart-talk:${pairId}:${invitationId}` }
function validTimestamp(value: string) { return Number.isFinite(Date.parse(value)) }
function validPairId(value: string) { return PAIR_ID.test(value) }
function validInvitationId(value: string) { return INVITATION_ID.test(value) }
function validTerminal(item: RemoteHeartTalkTerminal) {
  return validPairId(item.pairId) && validInvitationId(item.invitationId) && TERMINAL_STATUSES.has(item.status) && validTimestamp(item.terminalAt) && DATE.test(item.scheduledLocalDate) && TIME.test(item.startTime) && TIME.test(item.endTime) && (item.topicType === 'official' ? typeof item.officialTopicId === 'string' && /^Q\d{3}$/u.test(item.officialTopicId) : item.topicType === 'custom' && item.officialTopicId === undefined) && (item.completionReason === undefined || typeof item.completionReason === 'string')
}
function authoritativeClear(tombstone: HeartTalkHistoryTombstone) {
  return tombstone.kind === 'all-before' && tombstone.authority === 'server-snapshot' && validTimestamp((tombstone as Extract<HeartTalkHistoryTombstone, { kind: 'all-before' }>).snapshotAt)
}
function awaitingServerAnchor(tombstone: HeartTalkHistoryTombstone | Record<string, unknown>) {
  return tombstone.kind === 'pending-clear' || (tombstone.kind === 'all-before' && !authoritativeClear(tombstone as HeartTalkHistoryTombstone))
}
function hidden(item: RemoteHeartTalkTerminal, tombstones: HeartTalkHistoryTombstone[]) {
  return tombstones.some((tombstone) => tombstone.kind === 'invitation' && tombstone.pairId === item.pairId && tombstone.invitationId === item.invitationId)
    || tombstones.some(awaitingServerAnchor)
    || tombstones.some((tombstone) => authoritativeClear(tombstone) && item.terminalAt <= (tombstone as Extract<HeartTalkHistoryTombstone, { kind: 'all-before' }>).snapshotAt)
}
function completedRecord(item: RemoteHeartTalkTerminal, timestamp: string): CompletedHeartTalk {
  const shared = { id: identity(item.pairId, item.invitationId), sourcePairId: item.pairId, sourceInvitationId: item.invitationId, localDate: item.scheduledLocalDate, startTime: item.startTime, endTime: item.endTime, createdAt: timestamp, updatedAt: timestamp }
  return item.topicType === 'official' ? { ...shared, topicType: 'official', questionId: item.officialTopicId! } : { ...shared, topicType: 'custom' }
}

/**
 * Serializes multi-store mutations through one IndexedDB transaction. The local
 * stores remain private per device; this repository never deletes cloud data.
 */
export class LocalHeartTalkTerminalRepository {
  private queue: Promise<void> = Promise.resolve()
  constructor(private readonly storage: StorageAdapter) {}

  private async exclusive<T>(work: () => Promise<T>) {
    const previous = this.queue
    let release!: () => void
    this.queue = new Promise<void>((resolve) => { release = resolve })
    await previous
    try { return await work() } finally { release() }
  }

  async listTerminalHistory() { return (await this.storage.getAll<HeartTalkTerminalHistory>('heartTalkTerminalHistory')).sort((left, right) => right.terminalAt.localeCompare(left.terminalAt) || right.id.localeCompare(left.id)) }
  async listTombstones() { return this.storage.getAll<HeartTalkHistoryTombstone>('heartTalkHistoryTombstones') }
  getSyncState(pairId: string) { return this.storage.get<HeartTalkSyncState>('heartTalkSyncState', pairId) }

  async applyRemotePage(page: RemoteHeartTalkTerminalPage) {
    if (!validTimestamp(page.snapshotAt) || (page.nextCursor !== undefined && (typeof page.nextCursor !== 'string' || page.nextCursor.length > 1024)) || !page.items.every(validTerminal)) throw new Error('Invalid Heart Talk terminal page')
    const pairIds = new Set(page.items.map((item) => item.pairId))
    if (pairIds.size > 1) throw new Error('Mixed Pair Heart Talk terminal page')
    return this.exclusive(async () => {
      const [terminalHistory, tombstones, completed, syncStates] = await Promise.all([
        this.storage.getAll<HeartTalkTerminalHistory>('heartTalkTerminalHistory'), this.storage.getAll<HeartTalkHistoryTombstone>('heartTalkHistoryTombstones'), this.storage.getAll<CompletedHeartTalk>('completedHeartTalks'), this.storage.getAll<HeartTalkSyncState>('heartTalkSyncState'),
      ])
      const timestamp = now()
      const terminalById = new Map(terminalHistory.map((item) => [item.id, item]))
      const completedBySource = new Map(completed.filter((item) => item.sourcePairId && item.sourceInvitationId).map((item) => [`${item.sourcePairId}:${item.sourceInvitationId}`, item]))
      const legacyInvitationIds = new Set(completed.filter((item) => !item.sourcePairId && item.sourceInvitationId).map((item) => item.sourceInvitationId))
      const pendingClear = tombstones.some((item) => awaitingServerAnchor(item as HeartTalkHistoryTombstone | Record<string, unknown>))
      const nextTombstones = pendingClear
        ? [...tombstones.filter((item) => !awaitingServerAnchor(item as HeartTalkHistoryTombstone | Record<string, unknown>)), { id: 'heart-talk:all-before', kind: 'all-before' as const, authority: 'server-snapshot' as const, snapshotAt: page.snapshotAt, createdAt: timestamp, updatedAt: timestamp }]
        : tombstones
      for (const item of page.items) {
        if (hidden(item, nextTombstones)) continue
        const recordId = identity(item.pairId, item.invitationId)
        const existingTerminal = terminalById.get(recordId)
        const record: HeartTalkTerminalHistory = { ...item, id: recordId, createdAt: existingTerminal?.createdAt ?? timestamp, updatedAt: timestamp }
        terminalById.set(record.id, record)
        // Pair-less Build 42 records cannot be safely attributed. Retain them and
        // the remote metadata, but do not add a second counter record automatically.
        if (item.status === 'completed' && !existingTerminal && !completedBySource.has(`${item.pairId}:${item.invitationId}`) && !legacyInvitationIds.has(item.invitationId)) {
          const local = completedRecord(item, timestamp)
          completedBySource.set(`${item.pairId}:${item.invitationId}`, local)
        }
      }
      const pairId = page.items[0]?.pairId
      const nextStates = pairId ? [...syncStates.filter((state) => state.id !== pairId), { id: pairId, pairId, lastCursor: page.nextCursor, snapshotAt: page.snapshotAt, lastSuccessfulAt: timestamp, updatedAt: timestamp }] : syncStates
      await this.storage.restoreStoresAtomically({ heartTalkTerminalHistory: [...terminalById.values()], completedHeartTalks: [...completedBySource.values(), ...completed.filter((item) => !item.sourcePairId || !item.sourceInvitationId)], heartTalkHistoryTombstones: nextTombstones, heartTalkSyncState: nextStates }, [])
    })
  }

  async deleteCompletedHistory(recordId: string) {
    return this.exclusive(async () => {
      const [completed, terminalHistory, tombstones, syncStates] = await Promise.all([
        this.storage.getAll<CompletedHeartTalk>('completedHeartTalks'), this.storage.getAll<HeartTalkTerminalHistory>('heartTalkTerminalHistory'), this.storage.getAll<HeartTalkHistoryTombstone>('heartTalkHistoryTombstones'), this.storage.getAll<HeartTalkSyncState>('heartTalkSyncState'),
      ])
      const record = completed.find((item) => item.id === recordId)
      if (!record) return
      const deletedAt = now()
      const nextTombstones = record.sourcePairId && record.sourceInvitationId ? [...tombstones.filter((item) => item.id !== identity(record.sourcePairId!, record.sourceInvitationId!)), { id: identity(record.sourcePairId, record.sourceInvitationId), kind: 'invitation' as const, pairId: record.sourcePairId, invitationId: record.sourceInvitationId, deletedAt, createdAt: deletedAt, updatedAt: deletedAt }] : tombstones
      await this.storage.restoreStoresAtomically({ completedHeartTalks: completed.filter((item) => item.id !== recordId), heartTalkTerminalHistory: record.sourcePairId && record.sourceInvitationId ? terminalHistory.filter((item) => item.id !== identity(record.sourcePairId!, record.sourceInvitationId!)) : terminalHistory, heartTalkHistoryTombstones: nextTombstones, heartTalkSyncState: syncStates }, [])
    })
  }

  async clearAllHistory() {
    return this.exclusive(async () => {
      const tombstones = await this.storage.getAll<HeartTalkHistoryTombstone>('heartTalkHistoryTombstones')
      const timestamp = now()
      // Do not compare the device clock with server terminalAt. The first trusted
      // callable snapshot converts this into an authoritative all-before anchor.
      const pending: HeartTalkHistoryTombstone = { id: 'heart-talk:pending-clear', kind: 'pending-clear', createdAt: timestamp, updatedAt: timestamp }
      await this.storage.restoreStoresAtomically({ completedHeartTalks: [], heartTalkTerminalHistory: [], heartTalkHistoryTombstones: [...tombstones.filter((item) => item.kind === 'invitation'), pending], heartTalkSyncState: [] }, [])
    })
  }
}
