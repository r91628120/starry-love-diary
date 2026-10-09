import { randomBytes } from 'node:crypto'
import { FieldPath, Timestamp, type Firestore, type Transaction } from 'firebase-admin/firestore'
import { resolveActivePairForCaller } from './activePairResolver.js'
import { type VerifiedCaller } from './pairInviteService.js'

const HEART_TALK_PENDING_LIFETIME_MS = 24 * 60 * 60 * 1000
const HEART_TALK_TERMINAL_RETENTION_MS = 30 * 24 * 60 * 60 * 1000
const HEART_TALK_TERMINAL_HISTORY_DEFAULT_PAGE_SIZE = 25
const HEART_TALK_TERMINAL_HISTORY_MAX_PAGE_SIZE = 50
const OFFICIAL_TOPIC_ID = /^Q(?:00[1-9]|0[1-9][0-9]|1[01][0-9]|120)$/u
const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/u
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/u
const INVITATION_ID = /^[A-Za-z0-9_-]{8,128}$/u
const CUSTOM_TOPIC_MAX_LENGTH = 1_000

export type HeartTalkApplicationError = 'invalid-heart-talk-input' | 'heart-talk-start-time-passed' | 'heart-talk-end-time-invalid' | 'heart-talk-not-found' | 'heart-talk-transition-not-allowed' | 'heart-talk-recipient-required'
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
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
  scheduledTimeZone?: string | null
}
export type HeartTalkResponseAction = 'accept' | 'decline'
export type HeartTalkDependencies = { firestore: Firestore; now?: () => Timestamp; randomId?: () => string }
export type HeartTalkStateItem = { invitationId: string; viewerRole: 'sender' | 'recipient'; topicType: 'official' | 'custom'; officialTopicId?: string; customTopicText?: string; scheduledLocalDate: string; startTime: string; endTime: string; status: 'pending' | 'accepted' }
export type HeartTalkTerminalStatus = 'completed' | 'declined' | 'cancelled' | 'expired'
export type HeartTalkTerminalHistoryInput = { cursor?: string | null; pageSize?: number | null }
export type HeartTalkTerminalHistoryItem = { invitationId: string; pairId: string; status: HeartTalkTerminalStatus; terminalAt: string; scheduledLocalDate: string; startTime: string; endTime: string; topicType: 'official' | 'custom'; officialTopicId?: string; completionReason?: string }

type HeartTalkTerminalCursor = { terminalSeconds: number; terminalNanoseconds: number; invitationId: string; snapshotSeconds: number; snapshotNanoseconds: number }

function invalid(): never { throw new HeartTalkError('invalid-heart-talk-input') }
function opaqueId() { return randomBytes(32).toString('base64url') }
function invitationId(value: string) { if (!INVITATION_ID.test(value)) invalid(); return value }
function validLocalDate(value: string) {
  if (!LOCAL_DATE.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

function timestampFromIso(value: string) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.valueOf()) || date.toISOString() !== value) invalid()
  return Timestamp.fromMillis(date.valueOf())
}

function localDateTimeAt(timestamp: Timestamp, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(timestamp.toDate())
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value
    return `${value('year')}-${value('month')}-${value('day')}T${value('hour')}:${value('minute')}`
  } catch { invalid() }
}

function validateCreate(input: HeartTalkCreateInput, now: Timestamp) {
  if (!validLocalDate(input.scheduledLocalDate) || !TIME.test(input.startTime) || !TIME.test(input.endTime)) invalid()
  const scheduleValues = [input.scheduledStartAt, input.scheduledEndAt, input.scheduledTimeZone]
  const usesNewSchedule = scheduleValues.some((value) => value !== undefined)
  if (!usesNewSchedule && input.endTime <= input.startTime) invalid()
  if (usesNewSchedule && scheduleValues.some((value) => typeof value !== 'string')) invalid()
  const schedule = usesNewSchedule ? (() => {
    const [startAt, endAt, timeZone] = scheduleValues as [string, string, string]
    if (!timeZone || timeZone.length > 100) invalid()
    const scheduledStartAt = timestampFromIso(startAt)
    const scheduledEndAt = timestampFromIso(endAt)
    if (localDateTimeAt(scheduledStartAt, timeZone) !== `${input.scheduledLocalDate}T${input.startTime}` || localDateTimeAt(scheduledEndAt, timeZone) !== `${input.scheduledLocalDate}T${input.endTime}`) invalid()
    if (scheduledEndAt.toMillis() <= scheduledStartAt.toMillis()) throw new HeartTalkError('heart-talk-end-time-invalid')
    if (scheduledStartAt.toMillis() <= now.toMillis()) throw new HeartTalkError('heart-talk-start-time-passed')
    return { scheduledStartAt, scheduledEndAt, scheduledTimeZone: timeZone }
  })() : undefined
  if (input.topicType === 'official') {
    if (!input.officialTopicId || !OFFICIAL_TOPIC_ID.test(input.officialTopicId) || input.customTopicText !== undefined) invalid()
    return { topicType: 'official' as const, officialTopicId: input.officialTopicId, ...(schedule ?? {}) }
  }
  if (input.topicType === 'custom') {
    const text = input.customTopicText?.trim()
    if (!text || text.length > CUSTOM_TOPIC_MAX_LENGTH || input.officialTopicId !== undefined) invalid()
    return { topicType: 'custom' as const, customTopicText: text, ...(schedule ?? {}) }
  }
  invalid()
}

function invitationPath(pairId: string, id: string) { return `pairs/${pairId}/heartTalkInvitations/${id}` }
function redactCustom(data: Record<string, unknown>) { return data.topicType === 'custom' ? { customTopicText: null } : {} }
function terminalFields(terminalAt: Timestamp) { return { terminalAt, terminalExpiresAt: Timestamp.fromMillis(terminalAt.toMillis() + HEART_TALK_TERMINAL_RETENTION_MS) } }
function terminalTimestamp(value: unknown) { return value instanceof Timestamp ? value : undefined }
function timestampFromCursor(seconds: unknown, nanoseconds: unknown) {
  if (!Number.isSafeInteger(seconds) || !Number.isSafeInteger(nanoseconds) || (nanoseconds as number) < 0 || (nanoseconds as number) > 999_999_999) invalid()
  return new Timestamp(seconds as number, nanoseconds as number)
}
function encodeTerminalCursor(cursor: HeartTalkTerminalCursor) { return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url') }
function decodeTerminalCursor(value: string | null | undefined) {
  if (value === undefined || value === null) return undefined
  if (!value || value.length > 1_024) invalid()
  try {
    const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Record<string, unknown>
    if (typeof decoded.invitationId !== 'string' || !INVITATION_ID.test(decoded.invitationId)) invalid()
    const terminalAt = timestampFromCursor(decoded.terminalSeconds, decoded.terminalNanoseconds)
    const snapshotAt = timestampFromCursor(decoded.snapshotSeconds, decoded.snapshotNanoseconds)
    if (terminalAt.toMillis() > snapshotAt.toMillis()) invalid()
    return { invitationId: decoded.invitationId, terminalAt, snapshotAt }
  } catch (error) {
    if (error instanceof HeartTalkError) throw error
    invalid()
  }
}
function terminalHistoryPageSize(value: number | null | undefined) {
  if (value === undefined || value === null) return HEART_TALK_TERMINAL_HISTORY_DEFAULT_PAGE_SIZE
  if (!Number.isInteger(value) || value < 1 || value > HEART_TALK_TERMINAL_HISTORY_MAX_PAGE_SIZE) invalid()
  return value
}

function validInvitationRoles(data: Record<string, unknown>, callerUid: string, partnerUid: string) {
  const sender = data.createdByUid
  const recipient = data.recipientUid
  if (typeof sender !== 'string' || typeof recipient !== 'string' || sender === recipient) throw new HeartTalkError('heart-talk-transition-not-allowed')
  if (![callerUid, partnerUid].includes(sender) || ![callerUid, partnerUid].includes(recipient)) throw new HeartTalkError('heart-talk-transition-not-allowed')
  return { sender, recipient }
}

function isExpired(data: Record<string, unknown>, now: Timestamp) {
  const pendingDeadline = data.scheduledStartAt instanceof Timestamp ? data.scheduledStartAt : data.expiresAt
  return pendingDeadline instanceof Timestamp && now.toMillis() >= pendingDeadline.toMillis()
}

export function createHeartTalkService(dependencies: HeartTalkDependencies) {
  const now = dependencies.now ?? (() => Timestamp.now())
  const randomId = dependencies.randomId ?? opaqueId
  const resolveInTransaction = (caller: VerifiedCaller, transaction: Transaction) => resolveActivePairForCaller(caller, { firestore: dependencies.firestore, readDocument: (reference) => transaction.get(reference) })

  return {
    async getHeartTalkState(caller: VerifiedCaller) {
      return dependencies.firestore.runTransaction(async (transaction) => {
        const context = await resolveInTransaction(caller, transaction)
        // This deliberately remains a small active-state read rather than an inbox/history API.
        const query = dependencies.firestore.collection(`pairs/${context.pairId}/heartTalkInvitations`).where('status', 'in', ['pending', 'accepted']).limit(20)
        const snapshot = await transaction.get(query)
        const updatedAt = now()
        const invitations: HeartTalkStateItem[] = []
        snapshot.docs.forEach((document) => {
          const data = document.data() as Record<string, unknown>
          if (data.status === 'pending' && isExpired(data, updatedAt)) {
            transaction.update(document.ref, { status: 'expired', updatedAt, expiredAt: updatedAt, ...terminalFields(updatedAt), ...redactCustom(data) })
            return
          }
          try {
            const { sender } = validInvitationRoles(data, context.callerUid, context.partnerUid)
            const topicType = data.topicType
            const scheduleValid = typeof data.scheduledLocalDate === 'string' && typeof data.startTime === 'string' && typeof data.endTime === 'string'
            if ((topicType !== 'official' && topicType !== 'custom') || !scheduleValid || (data.status !== 'pending' && data.status !== 'accepted')) return
            if (topicType === 'official' && (typeof data.officialTopicId !== 'string' || !OFFICIAL_TOPIC_ID.test(data.officialTopicId))) return
            if (topicType === 'custom' && typeof data.customTopicText !== 'string') return
            invitations.push({ invitationId: document.id, viewerRole: context.callerUid === sender ? 'sender' : 'recipient', topicType, ...(topicType === 'official' ? { officialTopicId: data.officialTopicId as string } : { customTopicText: data.customTopicText as string }), scheduledLocalDate: data.scheduledLocalDate as string, startTime: data.startTime as string, endTime: data.endTime as string, status: data.status })
          } catch { /* malformed records are not UI data */ }
        })
        return { invitations }
      })
    },
    async getHeartTalkTerminalHistory(caller: VerifiedCaller, input: HeartTalkTerminalHistoryInput = {}) {
      const context = await resolveActivePairForCaller(caller, { firestore: dependencies.firestore })
      const pageSize = terminalHistoryPageSize(input.pageSize)
      const cursor = decodeTerminalCursor(input.cursor)
      const currentTime = now()
      const snapshotAt = cursor?.snapshotAt ?? currentTime
      if (snapshotAt.toMillis() > currentTime.toMillis()) invalid()
      const cutoff = Timestamp.fromMillis(snapshotAt.toMillis() - HEART_TALK_TERMINAL_RETENTION_MS)
      let query = dependencies.firestore.collection(`pairs/${context.pairId}/heartTalkInvitations`)
        .where('status', 'in', ['completed', 'declined', 'cancelled', 'expired'])
        .where('terminalAt', '>=', cutoff)
        .where('terminalAt', '<=', snapshotAt)
        .orderBy('terminalAt', 'desc')
        .orderBy(FieldPath.documentId(), 'desc')
      if (cursor) query = query.startAfter(cursor.terminalAt, cursor.invitationId)
      const snapshot = await query.limit(pageSize + 1).get()
      const documents = snapshot.docs.slice(0, pageSize)
      const items: HeartTalkTerminalHistoryItem[] = []
      documents.forEach((document) => {
        const data = document.data() as Record<string, unknown>
        const terminalAt = terminalTimestamp(data.terminalAt)
        const status = data.status
        const topicType = data.topicType
        if (!terminalAt || (status !== 'completed' && status !== 'declined' && status !== 'cancelled' && status !== 'expired')) return
        try { validInvitationRoles(data, context.callerUid, context.partnerUid) } catch { return }
        if (typeof data.scheduledLocalDate !== 'string' || !validLocalDate(data.scheduledLocalDate) || typeof data.startTime !== 'string' || !TIME.test(data.startTime) || typeof data.endTime !== 'string' || !TIME.test(data.endTime)) return
        if (topicType !== 'official' && topicType !== 'custom') return
        if (topicType === 'official' && (typeof data.officialTopicId !== 'string' || !OFFICIAL_TOPIC_ID.test(data.officialTopicId))) return
        const completionReason = status === 'completed' && typeof data.completionReason === 'string' ? data.completionReason : undefined
        items.push({ invitationId: document.id, pairId: context.pairId, status, terminalAt: terminalAt.toDate().toISOString(), scheduledLocalDate: data.scheduledLocalDate, startTime: data.startTime, endTime: data.endTime, topicType, ...(topicType === 'official' ? { officialTopicId: data.officialTopicId as string } : {}), ...(completionReason ? { completionReason } : {}) })
      })
      const lastDocument = documents.at(-1)
      const lastTerminalAt = lastDocument ? terminalTimestamp((lastDocument.data() as Record<string, unknown>).terminalAt) : undefined
      const nextCursor = snapshot.docs.length > pageSize && lastDocument
        && lastTerminalAt
        ? encodeTerminalCursor({ invitationId: lastDocument.id, snapshotSeconds: snapshotAt.seconds, snapshotNanoseconds: snapshotAt.nanoseconds, terminalSeconds: lastTerminalAt.seconds, terminalNanoseconds: lastTerminalAt.nanoseconds })
        : undefined
      return { items, ...(nextCursor ? { nextCursor } : {}), snapshotAt: snapshotAt.toDate().toISOString() }
    },
    async createHeartTalkInvitation(caller: VerifiedCaller, input: HeartTalkCreateInput) {
      const id = randomId()
      const result = await dependencies.firestore.runTransaction(async (transaction) => {
        const context = await resolveInTransaction(caller, transaction)
        const createdAt = now()
        const topic = validateCreate(input, createdAt)
        const invitationRef = dependencies.firestore.doc(invitationPath(context.pairId, id))
        const expiresAt = 'scheduledStartAt' in topic ? topic.scheduledStartAt : Timestamp.fromMillis(createdAt.toMillis() + HEART_TALK_PENDING_LIFETIME_MS)
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
          transaction.update(invitationRef, { status: 'expired', updatedAt, expiredAt: updatedAt, ...terminalFields(updatedAt), ...redactCustom(data) })
          return { status: 'expired' as const }
        }
        if (data.status !== 'pending') throw new HeartTalkError('heart-talk-transition-not-allowed')
        if (context.callerUid !== recipient) throw new HeartTalkError('heart-talk-recipient-required')
        if (action === 'accept') transaction.update(invitationRef, { status: 'accepted', updatedAt, acceptedAt: updatedAt })
        else transaction.update(invitationRef, { status: 'declined', updatedAt, declinedAt: updatedAt, ...terminalFields(updatedAt), ...redactCustom(data) })
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
          transaction.update(invitationRef, { status: 'expired', updatedAt, expiredAt: updatedAt, ...terminalFields(updatedAt), ...redactCustom(data) })
          return { status: 'expired' as const }
        }
        if (data.status === 'pending' && context.callerUid !== sender) throw new HeartTalkError('heart-talk-transition-not-allowed')
        if (data.status !== 'pending' && data.status !== 'accepted') throw new HeartTalkError('heart-talk-transition-not-allowed')
        transaction.update(invitationRef, { status: 'cancelled', updatedAt, cancelledAt: updatedAt, ...terminalFields(updatedAt), cancelReason: 'user-cancelled', ...redactCustom(data) })
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
        transaction.update(invitationRef, { status: 'completed', updatedAt, completedAt: updatedAt, ...terminalFields(updatedAt), completionReason: 'manual', ...redactCustom(data) })
        return { status: 'completed' as const }
      })
    },
  }
}
