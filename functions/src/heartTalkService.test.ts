import { describe, expect, it } from 'vitest'
import { FieldPath, Timestamp } from 'firebase-admin/firestore'
import { createHeartTalkService, type HeartTalkCreateInput } from './heartTalkService.js'
import type { VerifiedCaller } from './pairInviteService.js'

type Data = Record<string, unknown>

function memoryFirestore(initial: Record<string, Data> = {}) {
  const documents = new Map(Object.entries(initial))
  const ref = (path: string) => ({ path, get: async () => snapshot(path) })
  const snapshot = (path: string) => ({ exists: documents.has(path), data: () => documents.get(path) })
  type Query = { queryPath: string; filters: Array<{ field: string; operator: string; value: unknown }>; orders: Array<{ field: string; direction: 'asc' | 'desc' }>; after?: [Timestamp, string]; limitSize?: number; where: (field: string, operator: string, value: unknown) => Query; orderBy: (field: string | FieldPath, direction: 'asc' | 'desc') => Query; startAfter: (terminalAt: Timestamp, invitationId: string) => Query; limit: (size: number) => Query; get: () => Promise<{ docs: Array<{ id: string; ref: ReturnType<typeof ref>; data: () => Data | undefined }> }> }
  const timestampValue = (value: unknown) => value instanceof Timestamp ? value.toMillis() : Number.NaN
  const query = (queryPath: string): Query => {
    const value: Query = {
      queryPath, filters: [], orders: [],
      where: (field, operator, filterValue) => { value.filters.push({ field, operator, value: filterValue }); return value },
      orderBy: (field, direction) => { value.orders.push({ field: field instanceof FieldPath ? '__name__' : field, direction }); return value },
      startAfter: (terminalAt, invitationId) => { value.after = [terminalAt, invitationId]; return value },
      limit: (size) => { value.limitSize = size; return value },
      get: async () => ({ docs: queryDocuments(value) }),
    }
    return value
  }
  const queryDocuments = (value: Query) => {
    const documentsInCollection = [...documents.entries()].filter(([path]) => path.startsWith(`${value.queryPath}/`) && path.split('/').length === value.queryPath.split('/').length + 1)
    const matches = (data: Data, filter: Query['filters'][number]) => {
      const actual = data[filter.field]
      if (filter.operator === 'in') return Array.isArray(filter.value) && filter.value.includes(actual)
      const actualTimestamp = timestampValue(actual); const filterTimestamp = timestampValue(filter.value)
      if (filter.operator === '>=') return actualTimestamp >= filterTimestamp
      if (filter.operator === '<=') return actualTimestamp <= filterTimestamp
      return false
    }
    const rows = documentsInCollection.filter(([, data]) => value.filters.every((filter) => matches(data, filter)))
      .map(([path, data]) => ({ id: path.split('/').at(-1) as string, ref: ref(path), data: () => data }))
    rows.sort((left, right) => {
      for (const order of value.orders) {
        const leftValue = order.field === '__name__' ? left.id : left.data()[order.field]
        const rightValue = order.field === '__name__' ? right.id : right.data()[order.field]
        const compared = leftValue instanceof Timestamp && rightValue instanceof Timestamp ? leftValue.toMillis() - rightValue.toMillis() : String(leftValue).localeCompare(String(rightValue))
        if (compared) return order.direction === 'desc' ? -compared : compared
      }
      return 0
    })
    const afterIndex = value.after ? rows.findIndex((row) => (row.data().terminalAt as Timestamp).toMillis() === value.after![0].toMillis() && row.id === value.after![1]) : -1
    const paged = afterIndex >= 0 ? rows.slice(afterIndex + 1) : rows
    return value.limitSize === undefined ? paged : paged.slice(0, value.limitSize)
  }
  const firestore = {
    collection: (name: string) => ({ doc: (id: string) => ref(`${name}/${id}`), where: (field: string, operator: string, value: unknown) => query(name).where(field, operator, value) }),
    doc: (path: string) => ref(path),
    runTransaction: async <T>(work: (transaction: { get: (reference: { path?: string, queryPath?: string }) => Promise<unknown>; create: (reference: { path: string }, value: Data) => void; update: (reference: { path: string }, value: Data) => void }) => Promise<T>) => {
      const writes: { path: string, value: Data, create?: boolean }[] = []
      const transaction = {
        get: async (reference: { path?: string, queryPath?: string, get?: () => Promise<unknown> }) => reference.queryPath ? reference.get!() : snapshot(reference.path as string),
        create: (reference: { path: string }, value: Data) => writes.push({ path: reference.path, value, create: true }),
        update: (reference: { path: string }, value: Data) => writes.push({ path: reference.path, value }),
      }
      const result = await work(transaction)
      writes.forEach(({ path, value, create }) => { if (create && documents.has(path)) throw new Error('already-exists'); documents.set(path, { ...(documents.get(path) ?? {}), ...value }) })
      return result
    },
  }
  return { firestore: firestore as never, read: (path: string) => documents.get(path) }
}

const durable = (uid: string): VerifiedCaller => ({ uid, signInProvider: 'apple.com' })
const anonymous: VerifiedCaller = { uid: 'anonymous', signInProvider: 'anonymous' }
function schedule(scheduledLocalDate = '2026-10-06', startTime = '20:00', endTime = '20:30') { return { scheduledLocalDate, startTime, endTime, scheduledStartAt: `${scheduledLocalDate}T${startTime}:00.000Z`, scheduledEndAt: `${scheduledLocalDate}T${endTime}:00.000Z`, scheduledTimeZone: 'UTC' } }
const official: HeartTalkCreateInput = { topicType: 'official', officialTopicId: 'Q001', ...schedule() }
const custom: HeartTalkCreateInput = { topicType: 'custom', customTopicText: '今天最想被理解的是什麼？', ...schedule() }
const legacyOfficial: HeartTalkCreateInput = { topicType: 'official', officialTopicId: 'Q001', scheduledLocalDate: '2026-10-06', startTime: '20:00', endTime: '20:30' }
const legacyCustom: HeartTalkCreateInput = { topicType: 'custom', customTopicText: '今天最想被理解的是什麼？', scheduledLocalDate: '2026-10-06', startTime: '20:00', endTime: '20:30' }
const invitationPath = 'pairs/pair-alice-bob/heartTalkInvitations/invite-001'

function pairedStore() { return memoryFirestore({ 'users/alice': { currentPairId: 'pair-alice-bob' }, 'users/bob': { currentPairId: 'pair-alice-bob' }, 'pairs/pair-alice-bob': { memberUids: ['alice', 'bob'], status: 'active' } }) }
function service(store: ReturnType<typeof pairedStore>, at = Timestamp.fromMillis(1_700_000_000_000)) { return createHeartTalkService({ firestore: store.firestore, now: () => at, randomId: () => 'invite-001' }) }
async function expectCode(work: () => Promise<unknown>, code: string) { await expect(work()).rejects.toMatchObject({ applicationCode: code }) }
function terminalRecord(status: 'completed' | 'declined' | 'cancelled' | 'expired', terminalAt: Timestamp, overrides: Data = {}): Data {
  return { createdByUid: 'alice', recipientUid: 'bob', status, topicType: 'official', officialTopicId: 'Q001', scheduledLocalDate: '2026-10-20', startTime: '20:00', endTime: '20:30', terminalAt, terminalExpiresAt: Timestamp.fromMillis(terminalAt.toMillis() + 30 * 24 * 60 * 60 * 1000), ...overrides }
}
function historyStore(records: Record<string, Data>) { return memoryFirestore({ 'users/alice': { currentPairId: 'pair-alice-bob' }, 'users/bob': { currentPairId: 'pair-alice-bob' }, 'pairs/pair-alice-bob': { memberUids: ['alice', 'bob'], status: 'active' }, ...records }) }

describe('trusted Heart Talk lifecycle', () => {
  it('creates a Pair-scoped pending invitation with derived recipient and a start-time deadline', async () => {
    const store = pairedStore(); const result = await service(store).createHeartTalkInvitation({ ...durable('alice'), recipientUid: 'mallory' } as VerifiedCaller, official)
    const record = store.read(invitationPath)
    expect(result).toEqual({ invitationId: 'invite-001', status: 'pending' })
    expect(record).toMatchObject({ createdByUid: 'alice', recipientUid: 'bob', topicType: 'official', officialTopicId: 'Q001', status: 'pending' })
    expect((record?.expiresAt as Timestamp).toMillis()).toBe(Date.parse(official.scheduledStartAt!))
    expect(record).not.toHaveProperty('terminalAt')
    expect(record).not.toHaveProperty('terminalExpiresAt')
  })

  it('keeps Build 38 official and custom payloads on the legacy 24-hour deadline', async () => {
    const start = Timestamp.fromMillis(1_700_000_000_000)
    const officialStore = pairedStore(); await service(officialStore, start).createHeartTalkInvitation(durable('alice'), legacyOfficial)
    expect(officialStore.read(invitationPath)).toMatchObject({ topicType: 'official' })
    expect(officialStore.read(invitationPath)).not.toHaveProperty('scheduledStartAt')
    expect((officialStore.read(invitationPath)?.expiresAt as Timestamp).toMillis()).toBe(start.toMillis() + 86_400_000)
    const customStore = pairedStore(); await service(customStore, start).createHeartTalkInvitation(durable('alice'), legacyCustom)
    expect(customStore.read(invitationPath)).toMatchObject({ topicType: 'custom' })
    expect(customStore.read(invitationPath)).not.toHaveProperty('scheduledStartAt')
    expect((customStore.read(invitationPath)?.expiresAt as Timestamp).toMillis()).toBe(start.toMillis() + 86_400_000)
  })

  it.each([
    ['anonymous', anonymous, official, 'durable-identity-required'],
    ['no active Pair', durable('alice'), official, 'no-active-pair'],
    ['Q000', durable('alice'), { ...official, officialTopicId: 'Q000' }, 'invalid-heart-talk-input'],
    ['Q121', durable('alice'), { ...official, officialTopicId: 'Q121' }, 'invalid-heart-talk-input'],
    ['malformed official topic', durable('alice'), { ...official, officialTopicId: 'Q1' }, 'invalid-heart-talk-input'],
    ['invalid schedule date', durable('alice'), { ...official, scheduledLocalDate: '2026-02-30' }, 'invalid-heart-talk-input'],
    ['blank custom topic', durable('alice'), { ...custom, customTopicText: ' ' }, 'invalid-heart-talk-input'],
    ['oversized custom topic', durable('alice'), { ...custom, customTopicText: 'x'.repeat(1_001) }, 'invalid-heart-talk-input'],
  ] as const)('rejects invalid create: %s', async (_label, caller, input, code) => {
    const store = _label === 'no active Pair' ? memoryFirestore({ 'users/alice': {} }) : pairedStore()
    await expectCode(() => service(store as ReturnType<typeof pairedStore>).createHeartTalkInvitation(caller, input), code)
  })

  it('accepts Q120 and valid custom input', async () => {
    const officialStore = pairedStore(); await expect(service(officialStore).createHeartTalkInvitation(durable('alice'), { ...official, officialTopicId: 'Q120' })).resolves.toMatchObject({ status: 'pending' })
    const customStore = pairedStore(); await expect(service(customStore).createHeartTalkInvitation(durable('alice'), custom)).resolves.toMatchObject({ status: 'pending' })
    expect(customStore.read(invitationPath)?.customTopicText).toBe(custom.customTopicText)
  })

  it('uses server time to reject past starts and end times that are not after the start for official and custom invitations', async () => {
    const now = Timestamp.fromDate(new Date('2026-10-06T12:00:00.000Z'))
    await expectCode(() => service(pairedStore(), now).createHeartTalkInvitation(durable('alice'), { ...official, ...schedule('2026-10-05') }), 'heart-talk-start-time-passed')
    await expectCode(() => service(pairedStore(), now).createHeartTalkInvitation(durable('alice'), { ...official, ...schedule('2026-10-06', '11:00', '11:30') }), 'heart-talk-start-time-passed')
    await expectCode(() => service(pairedStore(), now).createHeartTalkInvitation(durable('alice'), { ...official, ...schedule('2026-10-07', '20:00', '20:00') }), 'heart-talk-end-time-invalid')
    await expect(service(pairedStore(), now).createHeartTalkInvitation(durable('alice'), { ...official, ...schedule('2026-10-07') })).resolves.toMatchObject({ status: 'pending' })
    await expect(service(pairedStore(), now).createHeartTalkInvitation(durable('alice'), { ...custom, ...schedule('2026-10-07') })).resolves.toMatchObject({ status: 'pending' })
  })

  it('rejects partial, malformed, and otherwise invalid schedule payloads without falling back to legacy handling', async () => {
    const now = Timestamp.fromDate(new Date('2026-10-06T12:00:00.000Z'))
    await expectCode(() => service(pairedStore(), now).createHeartTalkInvitation(durable('alice'), { ...official, scheduledEndAt: undefined }), 'invalid-heart-talk-input')
    await expectCode(() => service(pairedStore(), now).createHeartTalkInvitation(durable('alice'), { ...official, scheduledTimeZone: null }), 'invalid-heart-talk-input')
    await expectCode(() => service(pairedStore(), now).createHeartTalkInvitation(durable('alice'), { ...official, scheduledStartAt: 'not-an-instant' }), 'invalid-heart-talk-input')
    await expectCode(() => service(pairedStore(), now).createHeartTalkInvitation(durable('alice'), { ...legacyOfficial, endTime: '19:00' }), 'invalid-heart-talk-input')
  })

  it('allows a pending invitation past 24 hours until its scheduled start, then rejects acceptance at the start', async () => {
    const createdAt = Timestamp.fromDate(new Date('2026-10-01T12:00:00.000Z'))
    const store = pairedStore(); await service(store, createdAt).createHeartTalkInvitation(durable('alice'), { ...official, ...schedule('2026-10-03', '20:00', '20:30') })
    await expect(service(store, Timestamp.fromDate(new Date('2026-10-02T13:00:00.000Z'))).respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'accept')).resolves.toEqual({ status: 'accepted' })
    const expiredStore = pairedStore(); await service(expiredStore, createdAt).createHeartTalkInvitation(durable('alice'), { ...official, ...schedule('2026-10-03', '20:00', '20:30') })
    await expectCode(() => service(expiredStore, Timestamp.fromDate(new Date('2026-10-03T20:00:00.000Z'))).respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'accept'), 'heart-talk-transition-not-allowed')
    expect(expiredStore.read(invitationPath)).toMatchObject({ status: 'expired' })
  })

  it('keeps legacy and new pending deadlines distinct', async () => {
    const createdAt = Timestamp.fromDate(new Date('2026-10-01T12:00:00.000Z'))
    const legacyStore = pairedStore(); await service(legacyStore, createdAt).createHeartTalkInvitation(durable('alice'), legacyOfficial)
    await expectCode(() => service(legacyStore, Timestamp.fromDate(new Date('2026-10-02T12:00:00.000Z'))).respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'accept'), 'heart-talk-transition-not-allowed')
    const modernStore = pairedStore(); await service(modernStore, createdAt).createHeartTalkInvitation(durable('alice'), { ...official, ...schedule('2026-10-03', '20:00', '20:30') })
    await expect(service(modernStore, Timestamp.fromDate(new Date('2026-10-02T13:00:00.000Z'))).respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'accept')).resolves.toEqual({ status: 'accepted' })
  })

  it('allows only the recipient to accept or decline a pending invitation', async () => {
    const store = pairedStore(); const api = service(store); await api.createHeartTalkInvitation(durable('alice'), official)
    await expectCode(() => api.respondToHeartTalkInvitation(durable('alice'), 'invite-001', 'accept'), 'heart-talk-recipient-required')
    await expect(api.respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'accept')).resolves.toEqual({ status: 'accepted' })
    await expectCode(() => api.respondToHeartTalkInvitation(durable('alice'), 'invite-001', 'decline'), 'heart-talk-transition-not-allowed')
  })

  it('redacts custom text on decline, pending cancellation, logical expiry, and completion', async () => {
    for (const operation of ['decline', 'cancel', 'expire', 'complete'] as const) {
      const store = pairedStore(); const start = Timestamp.fromMillis(1_700_000_000_000); const api = service(store, start)
      await api.createHeartTalkInvitation(durable('alice'), custom)
      if (operation === 'decline') await api.respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'decline')
      if (operation === 'cancel') await api.cancelHeartTalkInvitation(durable('alice'), 'invite-001')
      if (operation === 'expire') await expectCode(() => service(store, Timestamp.fromMillis(Date.parse(custom.scheduledStartAt!))).respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'accept'), 'heart-talk-transition-not-allowed')
      if (operation === 'complete') { await api.respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'accept'); expect(store.read(invitationPath)?.customTopicText).toBe(custom.customTopicText); await api.completeHeartTalkInvitation(durable('alice'), 'invite-001') }
      expect(store.read(invitationPath)?.customTopicText).toBeNull()
    }
  })

  it('allows sender pending cancellation and either member accepted cancellation or completion', async () => {
    const pendingStore = pairedStore(); const pendingApi = service(pendingStore); await pendingApi.createHeartTalkInvitation(durable('alice'), official)
    await expectCode(() => pendingApi.cancelHeartTalkInvitation(durable('bob'), 'invite-001'), 'heart-talk-transition-not-allowed')
    await expect(pendingApi.cancelHeartTalkInvitation(durable('alice'), 'invite-001')).resolves.toEqual({ status: 'cancelled' })
    const acceptedStore = pairedStore(); const acceptedApi = service(acceptedStore); await acceptedApi.createHeartTalkInvitation(durable('alice'), official); await acceptedApi.respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'accept')
    await expect(acceptedApi.cancelHeartTalkInvitation(durable('bob'), 'invite-001')).resolves.toEqual({ status: 'cancelled' })
    const completeStore = pairedStore(); const completeApi = service(completeStore); await completeApi.createHeartTalkInvitation(durable('alice'), official); await completeApi.respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'accept')
    await expect(completeApi.completeHeartTalkInvitation(durable('bob'), 'invite-001')).resolves.toEqual({ status: 'completed' })
  })

  it('rejects terminal replay, pending completion, wrong current Pair, and ended Pair', async () => {
    const store = pairedStore(); const api = service(store); await api.createHeartTalkInvitation(durable('alice'), official); await api.respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'decline')
    await expectCode(() => api.cancelHeartTalkInvitation(durable('alice'), 'invite-001'), 'heart-talk-transition-not-allowed')
    const pendingStore = pairedStore(); const pendingApi = service(pendingStore); await pendingApi.createHeartTalkInvitation(durable('alice'), official)
    await expectCode(() => pendingApi.completeHeartTalkInvitation(durable('alice'), 'invite-001'), 'heart-talk-transition-not-allowed')
    const endedStore = pairedStore(); const endedApi = service(endedStore); await endedApi.createHeartTalkInvitation(durable('alice'), official); ;(endedStore.read('pairs/pair-alice-bob') as Data).status = 'ended'
    await expectCode(() => endedApi.respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'accept'), 'no-active-pair')
    const newPairStore = memoryFirestore({ 'users/alice': { currentPairId: 'pair-alice-carol' }, 'users/carol': { currentPairId: 'pair-alice-carol' }, 'pairs/pair-alice-carol': { memberUids: ['alice', 'carol'], status: 'active' }, 'pairs/pair-alice-bob/heartTalkInvitations/invite-001': { ...store.read(invitationPath) } }); const newPairApi = service(newPairStore as ReturnType<typeof pairedStore>)
    await expectCode(() => newPairApi.respondToHeartTalkInvitation(durable('alice'), 'invite-001', 'accept'), 'heart-talk-not-found')
  })

  it('reads only bounded current-Pair active records and normalizes expired custom invitations', async () => {
    const store = pairedStore(); const start = Timestamp.fromMillis(1_700_000_000_000); const api = service(store, start)
    await api.createHeartTalkInvitation(durable('alice'), official)
    await expect(api.getHeartTalkState(durable('bob'))).resolves.toEqual({ invitations: [expect.objectContaining({ invitationId: 'invite-001', viewerRole: 'recipient', status: 'pending', officialTopicId: 'Q001' })] })
    const expired = service(store, Timestamp.fromMillis(Date.parse(official.scheduledStartAt!)))
    await expect(expired.getHeartTalkState(durable('alice'))).resolves.toEqual({ invitations: [] })
    expect(store.read(invitationPath)).toMatchObject({ status: 'expired' })
    expect(store.read(invitationPath)?.terminalAt).toBeInstanceOf(Timestamp)
    expect((store.read(invitationPath)?.terminalExpiresAt as Timestamp).toMillis()).toBe((store.read(invitationPath)?.terminalAt as Timestamp).toMillis() + 30 * 24 * 60 * 60 * 1000)
  })

  it('writes one authoritative terminal timestamp and 30-day retention deadline for every terminal transition without extending it on replay', async () => {
    for (const operation of ['decline', 'cancel', 'complete', 'expire'] as const) {
      const store = pairedStore(); const at = Timestamp.fromDate(new Date('2026-10-01T12:00:00.000Z')); const api = service(store, at)
      await api.createHeartTalkInvitation(durable('alice'), official)
      if (operation === 'decline') await api.respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'decline')
      if (operation === 'cancel') await api.cancelHeartTalkInvitation(durable('alice'), 'invite-001')
      if (operation === 'complete') { await api.respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'accept'); await api.completeHeartTalkInvitation(durable('alice'), 'invite-001') }
      if (operation === 'expire') await expectCode(() => service(store, Timestamp.fromMillis(Date.parse(official.scheduledStartAt!))).respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'accept'), 'heart-talk-transition-not-allowed')
      const record = store.read(invitationPath)
      const terminalAt = record?.terminalAt as Timestamp; const terminalExpiresAt = record?.terminalExpiresAt as Timestamp
      expect(terminalAt).toBeInstanceOf(Timestamp)
      expect(terminalExpiresAt.toMillis()).toBe(terminalAt.toMillis() + 30 * 24 * 60 * 60 * 1000)
      const originalExpiry = terminalExpiresAt.toMillis()
      await expectCode(() => api.cancelHeartTalkInvitation(durable('alice'), 'invite-001'), 'heart-talk-transition-not-allowed')
      expect((store.read(invitationPath)?.terminalExpiresAt as Timestamp).toMillis()).toBe(originalExpiry)
    }
  })

  it('returns the same recent terminal source to both active Pair members without custom prompt text', async () => {
    const at = Timestamp.fromDate(new Date('2026-10-31T12:00:00.000Z'))
    const customAt = Timestamp.fromDate(new Date('2026-10-30T12:00:00.000Z'))
    const store = historyStore({
      'pairs/pair-alice-bob/heartTalkInvitations/completed-001': terminalRecord('completed', at, { completionReason: 'manual' }),
      'pairs/pair-alice-bob/heartTalkInvitations/custom-001': terminalRecord('declined', customAt, { topicType: 'custom', customTopicText: '不得回傳的私人題目', officialTopicId: undefined }),
    })
    const api = service(store, at)
    const alice = await api.getHeartTalkTerminalHistory(durable('alice'))
    const bob = await api.getHeartTalkTerminalHistory(durable('bob'))
    expect(alice).toEqual(bob)
    expect(alice.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ invitationId: 'completed-001', pairId: 'pair-alice-bob', status: 'completed', completionReason: 'manual' }),
      expect.objectContaining({ invitationId: 'custom-001', topicType: 'custom', status: 'declined' }),
    ]))
    expect(JSON.stringify(alice)).not.toContain('不得回傳的私人題目')
  })

  it('rejects anonymous and unpaired terminal-history readers', async () => {
    const store = pairedStore(); const api = service(store)
    await expectCode(() => api.getHeartTalkTerminalHistory(anonymous), 'durable-identity-required')
    const unpaired = memoryFirestore({ 'users/mallory': {} })
    await expectCode(() => createHeartTalkService({ firestore: unpaired.firestore }).getHeartTalkTerminalHistory(durable('mallory')), 'no-active-pair')
  })

  it('excludes old, active, malformed, and legacy terminal records without mutating them', async () => {
    const at = Timestamp.fromDate(new Date('2026-10-31T12:00:00.000Z'))
    const old = Timestamp.fromMillis(at.toMillis() - 30 * 24 * 60 * 60 * 1000 - 1)
    const legacyPath = 'pairs/pair-alice-bob/heartTalkInvitations/legacy-001'
    const store = historyStore({
      'pairs/pair-alice-bob/heartTalkInvitations/recent-001': terminalRecord('cancelled', at),
      'pairs/pair-alice-bob/heartTalkInvitations/old-001': terminalRecord('completed', old),
      'pairs/pair-alice-bob/heartTalkInvitations/pending-001': { ...terminalRecord('completed', at), status: 'pending' },
      'pairs/pair-alice-bob/heartTalkInvitations/accepted-001': { ...terminalRecord('completed', at), status: 'accepted' },
      'pairs/pair-alice-bob/heartTalkInvitations/malformed-001': terminalRecord('completed', at, { terminalAt: 'not-a-timestamp' }),
      [legacyPath]: { createdByUid: 'alice', recipientUid: 'bob', status: 'completed', topicType: 'official', officialTopicId: 'Q001', scheduledLocalDate: '2026-10-20', startTime: '20:00', endTime: '20:30', completedAt: old },
    })
    const legacyBefore = { ...store.read(legacyPath) }
    const result = await service(store, at).getHeartTalkTerminalHistory(durable('alice'))
    expect(result.items.map((item) => item.invitationId)).toEqual(['recent-001'])
    expect(store.read(legacyPath)).toEqual(legacyBefore)
  })

  it('uses a stable snapshot cursor without duplicate or omitted rows while newer terminal records arrive', async () => {
    const at = Timestamp.fromDate(new Date('2026-10-31T12:00:00.000Z'))
    const stamp = (minutes: number) => Timestamp.fromMillis(at.toMillis() - minutes * 60_000)
    const store = historyStore({
      'pairs/pair-alice-bob/heartTalkInvitations/invite-001': terminalRecord('completed', stamp(1)),
      'pairs/pair-alice-bob/heartTalkInvitations/invite-002': terminalRecord('completed', stamp(2)),
      'pairs/pair-alice-bob/heartTalkInvitations/invite-003': terminalRecord('completed', stamp(3)),
      'pairs/pair-alice-bob/heartTalkInvitations/invite-004': terminalRecord('completed', stamp(4)),
      'pairs/pair-alice-bob/heartTalkInvitations/invite-new': terminalRecord('completed', Timestamp.fromMillis(at.toMillis() + 1)),
    })
    const api = service(store, at)
    const first = await api.getHeartTalkTerminalHistory(durable('alice'), { pageSize: 2 })
    const second = await api.getHeartTalkTerminalHistory(durable('alice'), { pageSize: 2, cursor: first.nextCursor })
    expect(first.nextCursor).toBeTruthy()
    expect(second.nextCursor).toBeUndefined()
    expect([...first.items, ...second.items].map((item) => item.invitationId)).toEqual(['invite-001', 'invite-002', 'invite-003', 'invite-004'])
    expect(new Set([...first.items, ...second.items].map((item) => item.invitationId)).size).toBe(4)
    const fresh = await service(store, Timestamp.fromMillis(at.toMillis() + 1)).getHeartTalkTerminalHistory(durable('alice'), { pageSize: 5 })
    expect(fresh.items.map((item) => item.invitationId)).toContain('invite-new')
  })
})
