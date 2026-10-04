import { randomBytes } from 'node:crypto'
import { Timestamp, type DocumentReference, type DocumentSnapshot, type Firestore, type Transaction } from 'firebase-admin/firestore'

export const PAIR_SCHEMA_VERSION = 1
export const PAIR_INVITE_LIFETIME_MS = 24 * 60 * 60 * 1000
export type PairInviteApplicationError = 'unauthenticated' | 'durable-identity-required' | 'already-paired' | 'invite-not-found' | 'invite-expired' | 'invite-unavailable' | 'self-pair-not-allowed'
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
  }
}
