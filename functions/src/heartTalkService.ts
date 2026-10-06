import { randomBytes } from 'node:crypto'
import { Timestamp, type Firestore, type Transaction } from 'firebase-admin/firestore'
import { resolveActivePairForCaller } from './activePairResolver.js'
import { PairInviteError, type VerifiedCaller } from './pairInviteService.js'

const HEART_TALK_PENDING_LIFETIME_MS = 24 * 60 * 60 * 1000
const OFFICIAL_TOPIC_ID = /^Q(?:00[1-9]|0[1-9][0-9]|1[01][0-9]|120)$/u
const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/u
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/u
const INVITATION_ID = /^[A-Za-z0-9_-]{8,128}$/u
const CUSTOM_TOPIC_MAX_LENGTH = 1_000

export type HeartTalkApplicationError = 'invalid-heart-talk-input' | 'heart-talk-not-found' | 'heart-talk-transition-not-allowed' | 'heart-talk-recipient-required'
export class HeartTalkError extends Error {
  constructor(public readonly applicationCode: HeartTalkApplicationError) { super(applicationCode) }
}

export type HeartTalkCreateInput = {
  topicType: 'official' | 'custom'
  officialTopicId?: string
  customTopicText?: string
  scheduledLocalDate: string
  startTime: string
  endTime: string
}
export type HeartTalkResponseAction = 'accept' | 'decline'
export type HeartTalkDependencies = { firestore: Firestore; now?: () => Timestamp; randomId?: () => string }

function invalid() { throw new HeartTalkError('invalid-heart-talk-input') }
function opaqueId() { return randomBytes(32).toString('base64url') }
function invitationId(value: string) { if (!INVITATION_ID.test(value)) invalid(); return value }
function validLocalDate(value: string) {
  if (!LOCAL_DATE.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

function validateCreate(input: HeartTalkCreateInput) {
  if (!validLocalDate(input.scheduledLocalDate) || !TIME.test(input.startTime) || !TIME.test(input.endTime) || input.endTime <= input.startTime) invalid()
  if (input.topicType === 'official') {
    if (!input.officialTopicId || !OFFICIAL_TOPIC_ID.test(input.officialTopicId) || input.customTopicText !== undefined) invalid()
    return { topicType: 'official' as const, officialTopicId: input.officialTopicId }
  }
  if (input.topicType === 'custom') {
    const text = input.customTopicText?.trim()
    if (!text || text.length > CUSTOM_TOPIC_MAX_LENGTH || input.officialTopicId !== undefined) invalid()
    return { topicType: 'custom' as const, customTopicText: text }
  }
  invalid()
}

function invitationPath(pairId: string, id: string) { return `pairs/${pairId}/heartTalkInvitations/${id}` }
function redactCustom(data: Record<string, unknown>) { return data.topicType === 'custom' ? { customTopicText: null } : {} }

function validInvitationRoles(data: Record<string, unknown>, callerUid: string, partnerUid: string) {
  const sender = data.createdByUid
  const recipient = data.recipientUid
  if (typeof sender !== 'string' || typeof recipient !== 'string' || sender === recipient) throw new HeartTalkError('heart-talk-transition-not-allowed')
  if (![callerUid, partnerUid].includes(sender) || ![callerUid, partnerUid].includes(recipient)) throw new HeartTalkError('heart-talk-transition-not-allowed')
  return { sender, recipient }
}

function isExpired(data: Record<string, unknown>, now: Timestamp) {
  const expiresAt = data.expiresAt
  return expiresAt instanceof Timestamp && now.toMillis() >= expiresAt.toMillis()
}

export function createHeartTalkService(dependencies: HeartTalkDependencies) {
  const now = dependencies.now ?? (() => Timestamp.now())
  const randomId = dependencies.randomId ?? opaqueId
  const resolveInTransaction = (caller: VerifiedCaller, transaction: Transaction) => resolveActivePairForCaller(caller, { firestore: dependencies.firestore, readDocument: (reference) => transaction.get(reference) })

  return {
    async createHeartTalkInvitation(caller: VerifiedCaller, input: HeartTalkCreateInput) {
      const topic = validateCreate(input)
      const id = randomId()
      const result = await dependencies.firestore.runTransaction(async (transaction) => {
        const context = await resolveInTransaction(caller, transaction)
        const createdAt = now()
        const expiresAt = Timestamp.fromMillis(createdAt.toMillis() + HEART_TALK_PENDING_LIFETIME_MS)
        const invitationRef = dependencies.firestore.doc(invitationPath(context.pairId, id))
        transaction.create(invitationRef, { schemaVersion: 1, createdByUid: context.callerUid, recipientUid: context.partnerUid, ...topic, scheduledLocalDate: input.scheduledLocalDate, startTime: input.startTime, endTime: input.endTime, status: 'pending', createdAt, updatedAt: createdAt, expiresAt, acceptedAt: null, declinedAt: null, cancelledAt: null, completedAt: null, expiredAt: null, cancelReason: null })
        return { invitationId: id, status: 'pending' as const }
      })
      return result
    },

    async respondToHeartTalkInvitation(caller: VerifiedCaller, id: string, action: HeartTalkResponseAction) {
      if (action !== 'accept' && action !== 'decline') invalid()
      const result = await dependencies.firestore.runTransaction(async (transaction) => {
        const context = await resolveInTransaction(caller, transaction)
        const invitationRef = dependencies.firestore.doc(invitationPath(context.pairId, invitationId(id)))
        const invitation = await transaction.get(invitationRef)
        if (!invitation.exists) throw new HeartTalkError('heart-talk-not-found')
        const data = invitation.data() ?? {}
        const { recipient } = validInvitationRoles(data, context.callerUid, context.partnerUid)
        const updatedAt = now()
        if (data.status === 'pending' && isExpired(data, updatedAt)) {
          transaction.update(invitationRef, { status: 'expired', updatedAt, expiredAt: updatedAt, ...redactCustom(data) })
          return { status: 'expired' as const }
        }
        if (data.status !== 'pending') throw new HeartTalkError('heart-talk-transition-not-allowed')
        if (context.callerUid !== recipient) throw new HeartTalkError('heart-talk-recipient-required')
        if (action === 'accept') transaction.update(invitationRef, { status: 'accepted', updatedAt, acceptedAt: updatedAt })
        else transaction.update(invitationRef, { status: 'declined', updatedAt, declinedAt: updatedAt, ...redactCustom(data) })
        return { status: action === 'accept' ? 'accepted' as const : 'declined' as const }
      })
      if (result.status === 'expired') throw new HeartTalkError('heart-talk-transition-not-allowed')
      return result
    },

    async cancelHeartTalkInvitation(caller: VerifiedCaller, id: string) {
      const result = await dependencies.firestore.runTransaction(async (transaction) => {
        const context = await resolveInTransaction(caller, transaction)
        const invitationRef = dependencies.firestore.doc(invitationPath(context.pairId, invitationId(id)))
        const invitation = await transaction.get(invitationRef)
        if (!invitation.exists) throw new HeartTalkError('heart-talk-not-found')
        const data = invitation.data() ?? {}
        const { sender } = validInvitationRoles(data, context.callerUid, context.partnerUid)
        const updatedAt = now()
        if (data.status === 'pending' && isExpired(data, updatedAt)) {
          transaction.update(invitationRef, { status: 'expired', updatedAt, expiredAt: updatedAt, ...redactCustom(data) })
          return { status: 'expired' as const }
        }
        if (data.status === 'pending' && context.callerUid !== sender) throw new HeartTalkError('heart-talk-transition-not-allowed')
        if (data.status !== 'pending' && data.status !== 'accepted') throw new HeartTalkError('heart-talk-transition-not-allowed')
        transaction.update(invitationRef, { status: 'cancelled', updatedAt, cancelledAt: updatedAt, cancelReason: 'user-cancelled', ...redactCustom(data) })
        return { status: 'cancelled' as const }
      })
      if (result.status === 'expired') throw new HeartTalkError('heart-talk-transition-not-allowed')
      return result
    },

    async completeHeartTalkInvitation(caller: VerifiedCaller, id: string) {
      return dependencies.firestore.runTransaction(async (transaction) => {
        const context = await resolveInTransaction(caller, transaction)
        const invitationRef = dependencies.firestore.doc(invitationPath(context.pairId, invitationId(id)))
        const invitation = await transaction.get(invitationRef)
        if (!invitation.exists) throw new HeartTalkError('heart-talk-not-found')
        const data = invitation.data() ?? {}
        validInvitationRoles(data, context.callerUid, context.partnerUid)
        if (data.status !== 'accepted') throw new HeartTalkError('heart-talk-transition-not-allowed')
        const updatedAt = now()
        transaction.update(invitationRef, { status: 'completed', updatedAt, completedAt: updatedAt, ...redactCustom(data) })
        return { status: 'completed' as const }
      })
    },
  }
}
