import { isFirebaseRuntimeConfigured } from './firebaseEnvironment'

export type PairErrorCode = 'unauthenticated' | 'durable-identity-required' | 'already-paired' | 'invite-not-found' | 'invite-expired' | 'invite-unavailable' | 'self-pair-not-allowed' | 'unexpected'
export type PairState = { pairId: string; memberUids: string[]; status: 'active' } | null

function errorCode(error: unknown): PairErrorCode {
  const code = typeof error === 'object' && error && 'message' in error && typeof error.message === 'string' ? error.message : ''
  return ['unauthenticated','durable-identity-required','already-paired','invite-not-found','invite-expired','invite-unavailable','self-pair-not-allowed'].includes(code) ? code as PairErrorCode : 'unexpected'
}

async function services() {
  if (!isFirebaseRuntimeConfigured()) throw new Error('unauthenticated')
  const [{ firebaseAuth }, { firebaseFirestore }, functions] = await Promise.all([import('./firebaseAuth'), import('./firebaseFirestore'), import('firebase/functions')])
  return { firebaseAuth, firebaseFirestore, ...functions }
}

export async function loadPairState(): Promise<PairState> {
  const { firebaseAuth, firebaseFirestore } = await services()
  const firestore = await import('firebase/firestore')
  const uid = firebaseAuth.currentUser?.uid
  if (!uid) return null
  const user = await firestore.getDoc(firestore.doc(firebaseFirestore, 'users', uid))
  const pairId = user.data()?.currentPairId
  if (typeof pairId !== 'string' || !pairId) return null
  const pair = await firestore.getDoc(firestore.doc(firebaseFirestore, 'pairs', pairId))
  const data = pair.data()
  return data?.status === 'active' && Array.isArray(data.memberUids) ? { pairId, memberUids: data.memberUids, status: 'active' } : null
}

async function call<T>(name: string, data?: object): Promise<T> {
  try { const { httpsCallable, getFunctions } = await services(); return (await httpsCallable(getFunctions(), name)(data)).data as T } catch (error) { throw new Error(errorCode(error)) }
}
export const createPairInvite = () => call<{ inviteId: string; expiresAt: string }>('createPairInvite')
export const resolvePairInvite = (inviteId: string) => call<{ valid: true; expiresAt: string }>('resolvePairInvite', { inviteId })
export const claimPairInvite = (inviteId: string) => call<{ pairId: string; status: 'active' }>('claimPairInvite', { inviteId })
