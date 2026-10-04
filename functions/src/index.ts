import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { PairInviteError, createPairInviteService, type VerifiedCaller } from './pairInviteService.js'

initializeApp()
const service = createPairInviteService({ firestore: getFirestore() })

function callerFromRequest(request: { auth?: { uid: string; token: Record<string, unknown> } | null }): VerifiedCaller {
  const firebase = request.auth?.token.firebase
  const signInProvider = firebase && typeof firebase === 'object' && 'sign_in_provider' in firebase && typeof firebase.sign_in_provider === 'string' ? firebase.sign_in_provider : null
  return request.auth ? { uid: request.auth.uid, signInProvider } : null
}

function callableError(error: unknown): never {
  if (error instanceof PairInviteError) {
    const code = error.applicationCode === 'unauthenticated' ? 'unauthenticated' : 'failed-precondition'
    throw new HttpsError(code, error.applicationCode)
  }
  throw new HttpsError('internal', 'pair-operation-failed')
}

export const createPairInvite = onCall(async (request) => {
  try { return await service.createPairInvite(callerFromRequest(request)) } catch (error) { return callableError(error) }
})

export const claimPairInvite = onCall(async (request) => {
  try { return await service.claimPairInvite(callerFromRequest(request), typeof request.data?.inviteId === 'string' ? request.data.inviteId : '') } catch (error) { return callableError(error) }
})
