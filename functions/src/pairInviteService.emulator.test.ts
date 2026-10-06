// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { deleteApp, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { PAIR_INVITE_LIFETIME_MS, PairInviteError, createPairInviteService, type PairInviteApplicationError } from './pairInviteService.js'

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
process.env.GCLOUD_PROJECT = 'demo-starry-love-diary'

const projectId = 'demo-starry-love-diary'
const app = getApps().find((candidate) => candidate.name === 'pair-invite-backend-test') ?? initializeApp({ projectId }, 'pair-invite-backend-test')
const firestore = getFirestore(app)
const durable = (uid: string) => ({ uid, signInProvider: 'apple.com' })
const anonymous = { uid: 'anonymous-user', signInProvider: 'anonymous' }

async function clearCollection(name: string) {
  const snapshot = await firestore.collection(name).get()
  await Promise.all(snapshot.docs.map((item) => item.ref.delete()))
}

async function expectApplicationError(work: () => Promise<unknown>, expected: PairInviteApplicationError) {
  await expect(work()).rejects.toMatchObject({ applicationCode: expected } satisfies Partial<PairInviteError>)
}

function serviceAt(time: number) { return createPairInviteService({ firestore, now: () => Timestamp.fromMillis(time) }) }

beforeAll(async () => { await Promise.all(['users', 'pairs', 'pairInvites'].map(clearCollection)) })
afterEach(async () => { await Promise.all(['users', 'pairs', 'pairInvites'].map(clearCollection)) })
afterAll(async () => { await deleteApp(getApp('pair-invite-backend-test')) })

describe('trusted Pair invite backend against Firestore Emulator', () => {
  it('rejects unauthenticated and anonymous invite creation', async () => {
    const service = serviceAt(1_700_000_000_000)
    await expectApplicationError(() => service.createPairInvite(null), 'unauthenticated')
    await expectApplicationError(() => service.createPairInvite(anonymous), 'durable-identity-required')
  })

  it('creates an opaque pending invite with server-authoritative timestamps', async () => {
    const now = 1_700_000_000_000
    const service = createPairInviteService({ firestore, now: () => Timestamp.fromMillis(now), randomId: () => 'opaque-server-generated-id' })
    await expect(service.createPairInvite(durable('alice'))).resolves.toEqual({ inviteId: 'opaque-server-generated-id', expiresAt: new Date(now + PAIR_INVITE_LIFETIME_MS).toISOString() })
    const invite = (await firestore.collection('pairInvites').doc('opaque-server-generated-id').get()).data()
    expect(invite).toMatchObject({ inviterUid: 'alice', status: 'pending', claimedByUid: null, claimedAt: null, pairId: null, schemaVersion: 1 })
    expect(invite?.createdAt.toMillis()).toBe(now)
    expect(invite?.expiresAt.toMillis()).toBe(now + PAIR_INVITE_LIFETIME_MS)
  })

  it('rejects invite creation for an already paired durable caller', async () => {
    await firestore.collection('users').doc('alice').set({ uid: 'alice', currentPairId: 'existing-pair' })
    await expectApplicationError(() => serviceAt(1_700_000_000_000).createPairInvite(durable('alice')), 'already-paired')
  })

  it('rejects unauthenticated and anonymous claims', async () => {
    const service = serviceAt(1_700_000_000_000)
    const { inviteId } = await service.createPairInvite(durable('alice'))
    await expectApplicationError(() => service.claimPairInvite(null, inviteId), 'unauthenticated')
    await expectApplicationError(() => service.claimPairInvite(anonymous, inviteId), 'durable-identity-required')
  })

  it('resolves only a valid durable recipient preview without inviter data', async () => {
    const now = 1_700_000_000_000
    const service = serviceAt(now)
    const { inviteId } = await service.createPairInvite(durable('alice'))
    await expectApplicationError(() => service.resolvePairInvite(null, inviteId), 'unauthenticated')
    await expectApplicationError(() => service.resolvePairInvite(anonymous, inviteId), 'durable-identity-required')
    await expectApplicationError(() => service.resolvePairInvite(durable('alice'), inviteId), 'self-pair-not-allowed')
    await expect(service.resolvePairInvite(durable('bob'), inviteId)).resolves.toEqual({ valid: true, expiresAt: new Date(now + PAIR_INVITE_LIFETIME_MS).toISOString() })
    expect((await firestore.collection('pairInvites').doc(inviteId).get()).data()).toMatchObject({ status: 'pending', pairId: null, claimedByUid: null })
    expect((await firestore.collection('pairs').get()).size).toBe(0)
    await expectApplicationError(() => service.resolvePairInvite(durable('bob'), 'missing'), 'invite-not-found')
    const unavailable = await service.createPairInvite(durable('carol'))
    await service.claimPairInvite(durable('dave'), unavailable.inviteId)
    await expectApplicationError(() => service.resolvePairInvite(durable('erin'), unavailable.inviteId), 'invite-unavailable')
    await expectApplicationError(() => serviceAt(now + PAIR_INVITE_LIFETIME_MS).resolvePairInvite(durable('bob'), inviteId), 'invite-expired')
  })

  it('atomically creates the Pair and both relationship references after a valid durable claim', async () => {
    const now = 1_700_000_000_000
    const ids = ['invite-opaque-id', 'pair-opaque-id']
    const service = createPairInviteService({ firestore, now: () => Timestamp.fromMillis(now), randomId: () => ids.shift() ?? 'unexpected-id' })
    await service.createPairInvite(durable('alice'))
    await expect(service.claimPairInvite(durable('bob'), 'invite-opaque-id')).resolves.toEqual({ pairId: 'pair-opaque-id', status: 'active' })
    expect((await firestore.collection('pairs').doc('pair-opaque-id').get()).data()).toMatchObject({ memberUids: ['alice', 'bob'], status: 'active', endedAt: null, schemaVersion: 1 })
    expect((await firestore.collection('users').doc('alice').get()).data()).toMatchObject({ uid: 'alice', currentPairId: 'pair-opaque-id' })
    expect((await firestore.collection('users').doc('bob').get()).data()).toMatchObject({ uid: 'bob', currentPairId: 'pair-opaque-id' })
    expect((await firestore.collection('pairInvites').doc('invite-opaque-id').get()).data()).toMatchObject({ status: 'claimed', claimedByUid: 'bob', pairId: 'pair-opaque-id' })
  })

  it('rejects self claims, expired/replayed invites, and already-paired members', async () => {
    const now = 1_700_000_000_000
    const service = serviceAt(now)
    const selfInvite = await service.createPairInvite(durable('alice'))
    await expectApplicationError(() => service.claimPairInvite(durable('alice'), selfInvite.inviteId), 'self-pair-not-allowed')
    const expired = await service.createPairInvite(durable('carol'))
    await expectApplicationError(() => serviceAt(now + PAIR_INVITE_LIFETIME_MS).claimPairInvite(durable('dave'), expired.inviteId), 'invite-expired')
    const replay = await service.createPairInvite(durable('erin'))
    await service.claimPairInvite(durable('frank'), replay.inviteId)
    await expectApplicationError(() => service.claimPairInvite(durable('grace'), replay.inviteId), 'invite-unavailable')
    const pairedClaimantInvite = await service.createPairInvite(durable('heidi'))
    await firestore.collection('users').doc('ivan').set({ uid: 'ivan', currentPairId: 'existing-pair' })
    await expectApplicationError(() => service.claimPairInvite(durable('ivan'), pairedClaimantInvite.inviteId), 'already-paired')
    const pairedInviterInvite = await service.createPairInvite(durable('judy'))
    await firestore.collection('users').doc('judy').set({ uid: 'judy', currentPairId: 'existing-pair' }, { merge: true })
    await expectApplicationError(() => service.claimPairInvite(durable('kate'), pairedInviterInvite.inviteId), 'already-paired')
  })

  it('allows only one concurrent claim and preserves one active Pair across competing invites', async () => {
    const service = serviceAt(1_700_000_000_000)
    const singleInvite = await service.createPairInvite(durable('alice'))
    const claims = await Promise.allSettled([service.claimPairInvite(durable('bob'), singleInvite.inviteId), service.claimPairInvite(durable('carol'), singleInvite.inviteId)])
    expect(claims.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    const successfulClaimant = claims[0].status === 'fulfilled' ? 'bob' : 'carol'
    const losingClaimant = successfulClaimant === 'bob' ? 'carol' : 'bob'
    const successfulResult = claims.find((result) => result.status === 'fulfilled')
    expect(successfulResult).toBeDefined()
    const pairId = successfulResult?.status === 'fulfilled' ? successfulResult.value.pairId : ''
    expect((await firestore.collection('pairs').get()).size).toBe(1)
    expect((await firestore.collection('pairs').doc(pairId).get()).data()).toMatchObject({ memberUids: ['alice', successfulClaimant], status: 'active' })
    expect((await firestore.collection('pairInvites').doc(singleInvite.inviteId).get()).data()).toMatchObject({ status: 'claimed', claimedByUid: successfulClaimant, pairId })
    expect((await firestore.collection('users').doc('alice').get()).data()?.currentPairId).toBe(pairId)
    expect((await firestore.collection('users').doc(successfulClaimant).get()).data()?.currentPairId).toBe(pairId)
    expect((await firestore.collection('users').doc(losingClaimant).get()).data()?.currentPairId).not.toBe(pairId)

    await Promise.all(['users', 'pairs', 'pairInvites'].map(clearCollection))
    const first = await service.createPairInvite(durable('alice'))
    const second = await service.createPairInvite(durable('alice'))
    const competingClaims = await Promise.allSettled([service.claimPairInvite(durable('bob'), first.inviteId), service.claimPairInvite(durable('carol'), second.inviteId)])
    expect(competingClaims.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect((await firestore.collection('pairs').get()).size).toBe(1)
    const competingResult = competingClaims.find((result) => result.status === 'fulfilled')
    expect(competingResult).toBeDefined()
    const competingPairId = competingResult?.status === 'fulfilled' ? competingResult.value.pairId : ''
    expect((await firestore.collection('users').doc('alice').get()).data()?.currentPairId).toBe(competingPairId)
    const inviteStates = await Promise.all([first.inviteId, second.inviteId].map(async (inviteId) => (await firestore.collection('pairInvites').doc(inviteId).get()).data()?.status))
    expect(inviteStates.sort()).toEqual(['claimed', 'pending'])
  }, 15_000)

  it('ends an active Pair atomically, preserves its history, and cancels either member pending invites', async () => {
    const now = 1_700_000_000_000
    const service = serviceAt(now)
    await firestore.collection('users').doc('alice').set({ uid: 'alice', currentPairId: 'pair-alice-bob' })
    await firestore.collection('users').doc('bob').set({ uid: 'bob', currentPairId: 'pair-alice-bob' })
    await firestore.collection('pairs').doc('pair-alice-bob').set({ memberUids: ['alice', 'bob'], status: 'active', createdAt: Timestamp.fromMillis(now), endedAt: null })
    await firestore.collection('pairInvites').doc('alice-pending').set({ inviterUid: 'alice', status: 'pending' })
    await firestore.collection('pairInvites').doc('bob-pending').set({ inviterUid: 'bob', status: 'pending' })
    await firestore.collection('pairInvites').doc('other-pending').set({ inviterUid: 'carol', status: 'pending' })
    await firestore.collection('users').doc('carol').set({ uid: 'carol', currentPairId: 'unrelated-pair' })

    await expect(service.endPair(durable('alice'))).resolves.toEqual({ status: 'unpaired' })
    const pair = await firestore.collection('pairs').doc('pair-alice-bob').get()
    expect(pair.exists).toBe(true)
    expect(pair.data()).toMatchObject({ memberUids: ['alice', 'bob'], status: 'ended' })
    expect(pair.data()?.endedAt.toMillis()).toBe(now)
    await expect(firestore.collection('users').doc('alice').get()).resolves.toMatchObject({ exists: true })
    expect((await firestore.collection('users').doc('alice').get()).data()?.currentPairId).toBeNull()
    expect((await firestore.collection('users').doc('bob').get()).data()?.currentPairId).toBeNull()
    expect((await firestore.collection('pairInvites').doc('alice-pending').get()).data()?.status).toBe('cancelled')
    expect((await firestore.collection('pairInvites').doc('bob-pending').get()).data()?.status).toBe('cancelled')
    expect((await firestore.collection('pairInvites').doc('other-pending').get()).data()?.status).toBe('pending')
    expect((await firestore.collection('users').doc('carol').get()).data()?.currentPairId).toBe('unrelated-pair')
    await expectApplicationError(() => service.claimPairInvite(durable('carol'), 'alice-pending'), 'invite-unavailable')
  })

  it('rejects anonymous and non-member callers, while repeat/recovery calls reconcile as unpaired', async () => {
    const service = serviceAt(1_700_000_000_000)
    await expectApplicationError(() => service.endPair(anonymous), 'durable-identity-required')
    await firestore.collection('users').doc('mallory').set({ uid: 'mallory', currentPairId: 'pair-alice-bob' })
    await firestore.collection('pairs').doc('pair-alice-bob').set({ memberUids: ['alice', 'bob'], status: 'active', endedAt: null })
    await expectApplicationError(() => service.endPair(durable('mallory')), 'not-pair-member')
    await firestore.collection('users').doc('alice').set({ uid: 'alice', currentPairId: 'pair-alice-bob' })
    await firestore.collection('users').doc('bob').set({ uid: 'bob', currentPairId: 'pair-alice-bob' })
    await expect(service.endPair(durable('alice'))).resolves.toEqual({ status: 'unpaired' })
    await expect(service.endPair(durable('alice'))).resolves.toEqual({ status: 'unpaired' })
  })
})
