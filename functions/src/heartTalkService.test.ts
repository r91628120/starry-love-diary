import { describe, expect, it } from 'vitest'
import { Timestamp } from 'firebase-admin/firestore'
import { createHeartTalkService, type HeartTalkCreateInput } from './heartTalkService.js'
import type { VerifiedCaller } from './pairInviteService.js'

type Data = Record<string, unknown>

function memoryFirestore(initial: Record<string, Data> = {}) {
  const documents = new Map(Object.entries(initial))
  const ref = (path: string) => ({ path, get: async () => snapshot(path) })
  const snapshot = (path: string) => ({ exists: documents.has(path), data: () => documents.get(path) })
  const firestore = {
    collection: (name: string) => ({ doc: (id: string) => ref(`${name}/${id}`), where: () => ({ limit: () => ({ queryPath: name }) }) }),
    doc: (path: string) => ref(path),
    runTransaction: async <T>(work: (transaction: { get: (reference: { path?: string, queryPath?: string }) => Promise<unknown>; create: (reference: { path: string }, value: Data) => void; update: (reference: { path: string }, value: Data) => void }) => Promise<T>) => {
      const writes: { path: string, value: Data, create?: boolean }[] = []
      const transaction = {
        get: async (reference: { path?: string, queryPath?: string }) => reference.queryPath ? { docs: [...documents.entries()].filter(([path]) => path.startsWith(`${reference.queryPath}/`) && path.split('/').length === 4).map(([path]) => ({ id: path.split('/').at(-1) as string, ref: ref(path), data: () => documents.get(path) })) } : snapshot(reference.path as string),
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
const official: HeartTalkCreateInput = { topicType: 'official', officialTopicId: 'Q001', scheduledLocalDate: '2026-10-06', startTime: '20:00', endTime: '20:30' }
const custom: HeartTalkCreateInput = { topicType: 'custom', customTopicText: '今天最想被理解的是什麼？', scheduledLocalDate: '2026-10-06', startTime: '20:00', endTime: '20:30' }
const invitationPath = 'pairs/pair-alice-bob/heartTalkInvitations/invite-001'

function pairedStore() { return memoryFirestore({ 'users/alice': { currentPairId: 'pair-alice-bob' }, 'users/bob': { currentPairId: 'pair-alice-bob' }, 'pairs/pair-alice-bob': { memberUids: ['alice', 'bob'], status: 'active' } }) }
function service(store: ReturnType<typeof pairedStore>, at = Timestamp.fromMillis(1_700_000_000_000)) { return createHeartTalkService({ firestore: store.firestore, now: () => at, randomId: () => 'invite-001' }) }
async function expectCode(work: () => Promise<unknown>, code: string) { await expect(work()).rejects.toMatchObject({ applicationCode: code }) }

describe('trusted Heart Talk lifecycle', () => {
  it('creates a Pair-scoped pending invitation with derived recipient and server expiry', async () => {
    const store = pairedStore(); const result = await service(store).createHeartTalkInvitation({ ...durable('alice'), recipientUid: 'mallory' } as VerifiedCaller, official)
    const record = store.read(invitationPath)
    expect(result).toEqual({ invitationId: 'invite-001', status: 'pending' })
    expect(record).toMatchObject({ createdByUid: 'alice', recipientUid: 'bob', topicType: 'official', officialTopicId: 'Q001', status: 'pending' })
    expect((record?.expiresAt as Timestamp).toMillis()).toBe(1_700_086_400_000)
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
      if (operation === 'expire') await expectCode(() => service(store, Timestamp.fromMillis(start.toMillis() + 86_400_000)).respondToHeartTalkInvitation(durable('bob'), 'invite-001', 'accept'), 'heart-talk-transition-not-allowed')
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
    const expired = service(store, Timestamp.fromMillis(start.toMillis() + 86_400_000))
    await expect(expired.getHeartTalkState(durable('alice'))).resolves.toEqual({ invitations: [] })
    expect(store.read(invitationPath)).toMatchObject({ status: 'expired' })
  })
})
