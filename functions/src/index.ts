import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { setGlobalOptions } from 'firebase-functions/v2'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { PairInviteError, createPairInviteService, type VerifiedCaller } from './pairInviteService.js'
import { HeartTalkError, createHeartTalkService, type HeartTalkCreateInput, type HeartTalkResponseAction, type HeartTalkTerminalHistoryInput } from './heartTalkService.js'

initializeApp()
setGlobalOptions({
  region: 'asia-east1',
  memory: '256MiB',
  timeoutSeconds: 60,
  concurrency: 80,
  ingressSettings: 'ALLOW_ALL',
  serviceAccount: '487213785255-compute@developer.gserviceaccount.com',
})
const service = createPairInviteService({ firestore: getFirestore() })
const heartTalk = createHeartTalkService({ firestore: getFirestore() })

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
  if (error instanceof HeartTalkError) throw new HttpsError('failed-precondition', error.applicationCode)
  throw new HttpsError('internal', 'pair-operation-failed')
}

function createInput(data: unknown): HeartTalkCreateInput {
  const value = data && typeof data === 'object' ? data as Record<string, unknown> : {}
  const scheduleField = (key: 'scheduledStartAt' | 'scheduledEndAt' | 'scheduledTimeZone') => key in value ? typeof value[key] === 'string' ? value[key] : null : undefined
  return { topicType: value.topicType as HeartTalkCreateInput['topicType'], officialTopicId: typeof value.officialTopicId === 'string' ? value.officialTopicId : undefined, customTopicText: typeof value.customTopicText === 'string' ? value.customTopicText : undefined, scheduledLocalDate: typeof value.scheduledLocalDate === 'string' ? value.scheduledLocalDate : '', startTime: typeof value.startTime === 'string' ? value.startTime : '', endTime: typeof value.endTime === 'string' ? value.endTime : '', scheduledStartAt: scheduleField('scheduledStartAt'), scheduledEndAt: scheduleField('scheduledEndAt'), scheduledTimeZone: scheduleField('scheduledTimeZone') }
}

export const createPairInvite = onCall({ region: 'asia-east1' }, async (request) => {
  try { return await service.createPairInvite(callerFromRequest(request)) } catch (error) { return callableError(error) }
})

export const claimPairInvite = onCall({ region: 'asia-east1' }, async (request) => {
  try { return await service.claimPairInvite(callerFromRequest(request), typeof request.data?.inviteId === 'string' ? request.data.inviteId : '') } catch (error) { return callableError(error) }
})

export const endPair = onCall({ region: 'asia-east1' }, async (request) => {
  try { return await service.endPair(callerFromRequest(request)) } catch (error) { return callableError(error) }
})

export const resolvePairInvite = onCall({ region: 'asia-east1' }, async (request) => {
  try { return await service.resolvePairInvite(callerFromRequest(request), typeof request.data?.inviteId === 'string' ? request.data.inviteId : '') } catch (error) { return callableError(error) }
})

export const createHeartTalkInvitation = onCall({ region: 'asia-east1', maxInstances: 20 }, async (request) => {
  try { return await heartTalk.createHeartTalkInvitation(callerFromRequest(request), createInput(request.data)) } catch (error) { return callableError(error) }
})

export const getHeartTalkState = onCall({ region: 'asia-east1', maxInstances: 20 }, async (request) => {
  try { return await heartTalk.getHeartTalkState(callerFromRequest(request)) } catch (error) { return callableError(error) }
})

function terminalHistoryInput(data: unknown): HeartTalkTerminalHistoryInput {
  const value = data && typeof data === 'object' ? data as Record<string, unknown> : {}
  return { cursor: value.cursor === undefined ? undefined : typeof value.cursor === 'string' ? value.cursor : '', pageSize: value.pageSize === undefined ? undefined : typeof value.pageSize === 'number' ? value.pageSize : 0 }
}

export const getHeartTalkTerminalHistory = onCall({ region: 'asia-east1' }, async (request) => {
  try { return await heartTalk.getHeartTalkTerminalHistory(callerFromRequest(request), terminalHistoryInput(request.data)) } catch (error) { return callableError(error) }
})

export const respondToHeartTalkInvitation = onCall({ region: 'asia-east1', maxInstances: 20 }, async (request) => {
  const data = request.data && typeof request.data === 'object' ? request.data as Record<string, unknown> : {}
  try { return await heartTalk.respondToHeartTalkInvitation(callerFromRequest(request), typeof data.invitationId === 'string' ? data.invitationId : '', data.action as HeartTalkResponseAction) } catch (error) { return callableError(error) }
})

export const cancelHeartTalkInvitation = onCall({ region: 'asia-east1', maxInstances: 20 }, async (request) => {
  const data = request.data && typeof request.data === 'object' ? request.data as Record<string, unknown> : {}
  try { return await heartTalk.cancelHeartTalkInvitation(callerFromRequest(request), typeof data.invitationId === 'string' ? data.invitationId : '') } catch (error) { return callableError(error) }
})

export const completeHeartTalkInvitation = onCall({ region: 'asia-east1', maxInstances: 20 }, async (request) => {
  const data = request.data && typeof request.data === 'object' ? request.data as Record<string, unknown> : {}
  try { return await heartTalk.completeHeartTalkInvitation(callerFromRequest(request), typeof data.invitationId === 'string' ? data.invitationId : '') } catch (error) { return callableError(error) }
})
