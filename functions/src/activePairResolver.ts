import type { DocumentReference, DocumentSnapshot, Firestore } from 'firebase-admin/firestore'
import { PairInviteError, type VerifiedCaller } from './pairInviteService.js'

export type ActivePairContext = {
  pairId: string
  callerUid: string
  partnerUid: string
  pairRef: DocumentReference
  pairData: Record<string, unknown>
}

export type ActivePairResolverDependencies = {
  firestore: Firestore
  readDocument?: (reference: DocumentReference) => Promise<DocumentSnapshot>
}

function requireDurableCaller(caller: VerifiedCaller) {
  if (!caller || !caller.uid.trim()) throw new PairInviteError('unauthenticated')
  if (caller.signInProvider === 'anonymous') throw new PairInviteError('durable-identity-required')
  return caller
}

function pairMembers(value: unknown): [string, string] | undefined {
  return Array.isArray(value) && value.length === 2 && value.every((uid) => typeof uid === 'string' && uid.trim().length > 0) && value[0] !== value[1]
    ? [value[0], value[1]]
    : undefined
}

/**
 * Trusted-only Pair authority for future paired-feature callables. The caller
 * cannot supply a Pair or partner; both are derived from backend-owned docs.
 */
export async function resolveActivePairForCaller(caller: VerifiedCaller, dependencies: ActivePairResolverDependencies): Promise<ActivePairContext> {
  const verifiedCaller = requireDurableCaller(caller)
  const readDocument = dependencies.readDocument ?? ((reference: DocumentReference) => reference.get())
  const callerRef = dependencies.firestore.collection('users').doc(verifiedCaller.uid)
  const callerRecord = await readDocument(callerRef)
  const pairId = callerRecord.data()?.currentPairId
  if (!callerRecord.exists || typeof pairId !== 'string' || !pairId.trim()) throw new PairInviteError('no-active-pair')

  const pairRef = dependencies.firestore.collection('pairs').doc(pairId)
  const pair = await readDocument(pairRef)
  if (!pair.exists) throw new PairInviteError('pair-not-found')
  const pairData = pair.data() ?? {}
  if (pairData.status !== 'active') throw new PairInviteError('no-active-pair')
  const members = pairMembers(pairData.memberUids)
  if (!members) throw new PairInviteError('no-active-pair')
  if (!members.includes(verifiedCaller.uid)) throw new PairInviteError('not-pair-member')
  const partnerUid = members[0] === verifiedCaller.uid ? members[1] : members[0]
  if (partnerUid === verifiedCaller.uid) throw new PairInviteError('no-active-pair')

  return { pairId, callerUid: verifiedCaller.uid, partnerUid, pairRef, pairData }
}
