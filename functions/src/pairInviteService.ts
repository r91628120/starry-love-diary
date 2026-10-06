import { randomBytes } from 'node:crypto'
import { Timestamp, type DocumentReference, type DocumentSnapshot, type Firestore, type Transaction } from 'firebase-admin/firestore'

export const PAIR_SCHEMA_VERSION = 1
export const PAIR_INVITE_LIFETIME_MS = 24 * 60 * 60 * 1000
export type PairInviteApplicationError = 'unauthenticated' | 'durable-identity-required' | 'already-paired' | 'invite-not-found' | 'invite-expired' | 'invite-unavailable' | 'self-pair-not-allowed' | 'no-active-pair' | 'pair-not-found' | 'not-pair-member'
export type VerifiedCaller = { uid: string; signInProvider?: string | null } | null
export type PairInviteDependencies = { firestore: Firestore; now?: () => Timestamp; randomId?: () => string }

export class PairInviteError extends Error {
  constructor(public readonly applicationCode: PairInviteApplicationError) { super(applicationCode) }
}

function callerOrThrow(caller: VerifiedCaller) {
  if (!caller || !caller.uid.trim()) throw new PairInviteError('unauthenticated')
  if (caller.signInProvider === 'anonymous') throw new PairInviteError('durable-identity-required')
  return caller
}

function hasActivePair(data: Record<string, unknown> | undefined) { return typeof data?.currentPairId === 'string' && data.currentPairId.length > 0 }
function opaqueId() { return randomBytes(32).toString('base64url') }
function timestampMillis(value: unknown) { return value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function' ? value.toMillis() : undefined }
function pairMembers(value: unknown): [string, string] | undefined { return Array.isArray(value) && value.length === 2 && value.every((uid) => typeof uid === 'string' && uid.length > 0) && value[0] !== value[1] ? [value[0], value[1]] : undefined }

function ensureUnpaired(transaction: Transaction, ref: DocumentReference, snapshot: DocumentSnapshot, uid: string, now: Timestamp) {
  if (hasActivePair(snapshot.data())) throw new PairInviteError('already-paired')
  if (!snapshot.exists) transaction.set(ref, { uid, currentPairId: null, createdAt: now, updatedAt: now, schemaVersion: PAIR_SCHEMA_VERSION })
}

export function createPairInviteService(dependencies: PairInviteDependencies) {
  const now = dependencies.now ?? (() => Timestamp.now())
  const randomId = dependencies.randomId ?? opaqueId

  return {
    async createPairInvite(caller: VerifiedCaller) {
      const inviter = callerOrThrow(caller)
      const createdAt = now()
      const expiresAt = Timestamp.fromMillis(createdAt.toMillis() + PAIR_INVITE_LIFETIME_MS)
      const inviteId = randomId()
      await dependencies.firestore.runTransaction(async (transaction) => {
        const userRef = dependencies.firestore.collection('users').doc(inviter.uid)
        const user = await transaction.get(userRef)
        ensureUnpaired(transaction, userRef, user, inviter.uid, createdAt)
        transaction.create(dependencies.firestore.collection('pairInvites').doc(inviteId), {
          inviterUid: inviter.uid, status: 'pending', createdAt, expiresAt,
          claimedByUid: null, claimedAt: null, pairId: null, schemaVersion: PAIR_SCHEMA_VERSION,
        })
      })
      return { inviteId, expiresAt: expiresAt.toDate().toISOString() }
    },

    async claimPairInvite(caller: VerifiedCaller, inviteId: string) {
      const claimant = callerOrThrow(caller)
      if (!inviteId || typeof inviteId !== 'string') throw new PairInviteError('invite-not-found')
      return dependencies.firestore.runTransaction(async (transaction) => {
        const claimedAt = now()
        const inviteRef = dependencies.firestore.collection('pairInvites').doc(inviteId)
        const invite = await transaction.get(inviteRef)
        if (!invite.exists) throw new PairInviteError('invite-not-found')
        const data = invite.data() ?? {}
        if (data.status !== 'pending') throw new PairInviteError('invite-unavailable')
        const inviterUid = typeof data.inviterUid === 'string' ? data.inviterUid : ''
        const expiresAt = timestampMillis(data.expiresAt)
        if (!inviterUid) throw new PairInviteError('invite-unavailable')
        if (expiresAt === undefined || claimedAt.toMillis() >= expiresAt) throw new PairInviteError('invite-expired')
        if (claimant.uid === inviterUid) throw new PairInviteError('self-pair-not-allowed')
        const inviterRef = dependencies.firestore.collection('users').doc(inviterUid)
        const claimantRef = dependencies.firestore.collection('users').doc(claimant.uid)
        const [inviter, claimantRecord] = await Promise.all([transaction.get(inviterRef), transaction.get(claimantRef)])
        ensureUnpaired(transaction, inviterRef, inviter, inviterUid, claimedAt)
        ensureUnpaired(transaction, claimantRef, claimantRecord, claimant.uid, claimedAt)
        const pairId = randomId()
        transaction.create(dependencies.firestore.collection('pairs').doc(pairId), {
          memberUids: [inviterUid, claimant.uid], status: 'active', createdAt: claimedAt, endedAt: null, schemaVersion: PAIR_SCHEMA_VERSION,
        })
        transaction.set(inviterRef, { currentPairId: pairId, updatedAt: claimedAt }, { merge: true })
        transaction.set(claimantRef, { currentPairId: pairId, updatedAt: claimedAt }, { merge: true })
        transaction.update(inviteRef, { status: 'claimed', claimedByUid: claimant.uid, claimedAt, pairId })
        return { pairId, status: 'active' as const }
      })
    },

    async endPair(caller: VerifiedCaller) {
      const member = callerOrThrow(caller)
      return dependencies.firestore.runTransaction(async (transaction) => {
        const endedAt = now()
        const callerRef = dependencies.firestore.collection('users').doc(member.uid)
        const callerRecord = await transaction.get(callerRef)
        const pairId = callerRecord.data()?.currentPairId
        if (typeof pairId !== 'string' || !pairId) return { status: 'unpaired' as const }
        const pairRef = dependencies.firestore.collection('pairs').doc(pairId)
        const pair = await transaction.get(pairRef)
        if (!pair.exists) throw new PairInviteError('pair-not-found')
        const members = pairMembers(pair.data()?.memberUids)
        if (!members?.includes(member.uid)) throw new PairInviteError('not-pair-member')
        const pendingInvites = await transaction.get(dependencies.firestore.collection('pairInvites').where('inviterUid', 'in', members))
        if (pair.data()?.status !== 'active' && pair.data()?.status !== 'ended') throw new PairInviteError('no-active-pair')
        const memberRefs = members.map((uid) => dependencies.firestore.collection('users').doc(uid))
        if (pair.data()?.status === 'active') transaction.update(pairRef, { status: 'ended', endedAt })
        memberRefs.forEach((ref) => transaction.set(ref, { currentPairId: null, updatedAt: endedAt }, { merge: true }))
        pendingInvites.docs.filter((invite) => invite.data().status === 'pending').forEach((invite) => transaction.update(invite.ref, { status: 'cancelled', cancelledAt: endedAt }))
        return { status: 'unpaired' as const }
      })
    },
    async resolvePairInvite(caller: VerifiedCaller, inviteId: string) {
      const claimant = callerOrThrow(caller)
      if (!inviteId || typeof inviteId !== 'string') throw new PairInviteError('invite-not-found')
      const invite = await dependencies.firestore.collection('pairInvites').doc(inviteId).get()
      if (!invite.exists) throw new PairInviteError('invite-not-found')
      const data = invite.data() ?? {}
      if (data.status !== 'pending') throw new PairInviteError('invite-unavailable')
      const expiresAt = timestampMillis(data.expiresAt)
      if (expiresAt === undefined || now().toMillis() >= expiresAt) throw new PairInviteError('invite-expired')
      if (data.inviterUid === claimant.uid) throw new PairInviteError('self-pair-not-allowed')
      return { valid: true as const, expiresAt: new Date(expiresAt).toISOString() }
    },
  }
}
