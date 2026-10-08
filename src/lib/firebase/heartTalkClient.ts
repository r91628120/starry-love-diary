import { isFirebaseRuntimeConfigured } from './firebaseEnvironment'

export type HeartTalkInvitation = { invitationId: string; viewerRole: 'sender' | 'recipient'; topicType: 'official' | 'custom'; officialTopicId?: string; customTopicText?: string; scheduledLocalDate: string; startTime: string; endTime: string; status: 'pending' | 'accepted' }
export type HeartTalkCreateInput = { topicType: 'official' | 'custom'; officialTopicId?: string; customTopicText?: string; scheduledLocalDate: string; startTime: string; endTime: string }
export type HeartTalkErrorCode = 'unauthenticated' | 'durable-identity-required' | 'no-active-pair' | 'invalid-heart-talk-input' | 'network-unavailable' | 'service-unavailable'

export function heartTalkErrorCode(error: unknown): HeartTalkErrorCode {
  const message = typeof error === 'object' && error && 'message' in error && typeof error.message === 'string' ? error.message : ''
  if (['unauthenticated', 'durable-identity-required', 'no-active-pair', 'invalid-heart-talk-input'].includes(message)) return message as HeartTalkErrorCode
  const firebaseCode = typeof error === 'object' && error && 'code' in error && typeof error.code === 'string' ? error.code.replace(/^functions\//u, '') : ''
  if (['unavailable', 'deadline-exceeded', 'network-request-failed'].includes(firebaseCode)) return 'network-unavailable'
  return 'service-unavailable'
}
async function call<T>(name: string, data?: object): Promise<T> {
  if (!isFirebaseRuntimeConfigured()) throw new Error('unauthenticated')
  try { const [{ firebaseApp }, functions] = await Promise.all([import('./firebaseApp'), import('firebase/functions')]); return (await functions.httpsCallable(functions.getFunctions(firebaseApp, 'asia-east1'), name)(data)).data as T } catch (error) { throw new Error(heartTalkErrorCode(error)) }
}
export const getHeartTalkState = () => call<{ invitations: HeartTalkInvitation[] }>('getHeartTalkState')
export const createHeartTalkInvitation = (input: HeartTalkCreateInput) => call<{ invitationId: string; status: 'pending' }>('createHeartTalkInvitation', input)
export const respondToHeartTalkInvitation = (invitationId: string, action: 'accept' | 'decline') => call<{ status: 'accepted' | 'declined' }>('respondToHeartTalkInvitation', { invitationId, action })
export const cancelHeartTalkInvitation = (invitationId: string) => call<{ status: 'cancelled' }>('cancelHeartTalkInvitation', { invitationId })
export const completeHeartTalkInvitation = (invitationId: string) => call<{ status: 'completed' }>('completeHeartTalkInvitation', { invitationId })
