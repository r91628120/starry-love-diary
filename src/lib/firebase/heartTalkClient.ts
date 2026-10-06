import { isFirebaseRuntimeConfigured } from './firebaseEnvironment'

export type HeartTalkInvitation = { invitationId: string; viewerRole: 'sender' | 'recipient'; topicType: 'official' | 'custom'; officialTopicId?: string; customTopicText?: string; scheduledLocalDate: string; startTime: string; endTime: string; status: 'pending' | 'accepted' }
export type HeartTalkCreateInput = { topicType: 'official' | 'custom'; officialTopicId?: string; customTopicText?: string; scheduledLocalDate: string; startTime: string; endTime: string }

function code(error: unknown) { const value = typeof error === 'object' && error && 'message' in error && typeof error.message === 'string' ? error.message : ''; return ['unauthenticated', 'durable-identity-required', 'no-active-pair', 'invalid-heart-talk-input', 'heart-talk-not-found', 'heart-talk-transition-not-allowed', 'heart-talk-recipient-required'].includes(value) ? value : 'unexpected' }
async function call<T>(name: string, data?: object): Promise<T> {
  if (!isFirebaseRuntimeConfigured()) throw new Error('unauthenticated')
  try { const [{ firebaseApp }, functions] = await Promise.all([import('./firebaseApp'), import('firebase/functions')]); return (await functions.httpsCallable(functions.getFunctions(firebaseApp, 'asia-east1'), name)(data)).data as T } catch (error) { throw new Error(code(error)) }
}
export const getHeartTalkState = () => call<{ invitations: HeartTalkInvitation[] }>('getHeartTalkState')
export const createHeartTalkInvitation = (input: HeartTalkCreateInput) => call<{ invitationId: string; status: 'pending' }>('createHeartTalkInvitation', input)
export const respondToHeartTalkInvitation = (invitationId: string, action: 'accept' | 'decline') => call<{ status: 'accepted' | 'declined' }>('respondToHeartTalkInvitation', { invitationId, action })
export const cancelHeartTalkInvitation = (invitationId: string) => call<{ status: 'cancelled' }>('cancelHeartTalkInvitation', { invitationId })
export const completeHeartTalkInvitation = (invitationId: string) => call<{ status: 'completed' }>('completeHeartTalkInvitation', { invitationId })
