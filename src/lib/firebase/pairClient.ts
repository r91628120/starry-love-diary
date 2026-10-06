import { isFirebaseRuntimeConfigured } from './firebaseEnvironment'
import { PairClaimDiagnostic } from './pairClaimDiagnostic'

export type PairErrorCode = 'unauthenticated' | 'durable-identity-required' | 'already-paired' | 'invite-not-found' | 'invite-expired' | 'invite-unavailable' | 'self-pair-not-allowed' | 'unexpected'
export type PairState = { pairId: string; memberUids: string[]; status: 'active' } | null

function errorCode(error: unknown): PairErrorCode {
  const code = typeof error === 'object' && error && 'message' in error && typeof error.message === 'string' ? error.message : ''
  return ['unauthenticated','durable-identity-required','already-paired','invite-not-found','invite-expired','invite-unavailable','self-pair-not-allowed'].includes(code) ? code as PairErrorCode : 'unexpected'
}

function firebaseErrorCode(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error && typeof error.code === 'string' ? error.code.replace(/^functions\//u, '') : undefined
  return code && /^[a-z-]{1,64}$/u.test(code) ? code : undefined
}

async function services() {
  if (!isFirebaseRuntimeConfigured()) throw new Error('unauthenticated')
  const [{ firebaseAuth }, { firebaseFirestore }, { firebaseApp }, functions] = await Promise.all([import('./firebaseAuth'), import('./firebaseFirestore'), import('./firebaseApp'), import('firebase/functions')])
  return { firebaseAuth, firebaseFirestore, firebaseApp, ...functions }
}

export async function loadPairState(diagnostic?: PairClaimDiagnostic): Promise<PairState> {
  diagnostic?.refreshStarted()
  const { firebaseAuth, firebaseFirestore } = await services()
  const firestore = await import('firebase/firestore')
  const uid = firebaseAuth.currentUser?.uid
  if (!uid) return null
  const user = await firestore.getDoc(firestore.doc(firebaseFirestore, 'users', uid)).catch((error: unknown) => { diagnostic?.userReadFailed(error); throw error })
  const pairId = user.data()?.currentPairId
  diagnostic?.userReadSucceeded(typeof pairId === 'string' && Boolean(pairId))
  if (typeof pairId !== 'string' || !pairId) return null
  const pair = await firestore.getDoc(firestore.doc(firebaseFirestore, 'pairs', pairId)).catch((error: unknown) => { diagnostic?.pairReadFailed(error); throw error })
  const data = pair.data()
  const memberUids = Array.isArray(data?.memberUids) ? data.memberUids : []
  diagnostic?.pairReadSucceeded({ exists: pair.exists(), status: typeof data?.status === 'string' ? data.status : 'missing', memberCount: memberUids.length, callerMember: memberUids.includes(uid) })
  return data?.status === 'active' && Array.isArray(data.memberUids) ? { pairId, memberUids: data.memberUids, status: 'active' } : null
}

async function call<T>(name: string, data?: object): Promise<T> {
  try { const { httpsCallable, getFunctions, firebaseApp } = await services(); return (await httpsCallable(getFunctions(firebaseApp, 'asia-east1'), name)(data)).data as T } catch (error) { const mapped = new Error(errorCode(error)) as Error & { firebaseCode?: string }; mapped.firebaseCode = firebaseErrorCode(error); throw mapped }
}
export const createPairInvite = () => call<{ inviteId: string; expiresAt: string }>('createPairInvite')
export const resolvePairInvite = (inviteId: string) => call<{ valid: true; expiresAt: string }>('resolvePairInvite', { inviteId })
export async function claimPairInvite(inviteId: string, diagnostic?: PairClaimDiagnostic) {
  diagnostic?.claimStarted()
  try {
    const result = await call<{ pairId: string; status: 'active' }>('claimPairInvite', { inviteId })
    diagnostic?.claimSucceeded(result)
    return result
  } catch (error) {
    diagnostic?.claimFailed(error)
    throw error
  }
}
