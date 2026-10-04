import type { Timestamp } from 'firebase/firestore'

/** Server-populated Firestore document timestamps; clients never author relationship authority. */
export type RelationshipTimestamp = Timestamp

export const PAIR_STATUSES = ['active', 'ended'] as const
export type PairStatus = (typeof PAIR_STATUSES)[number]

export const PAIR_INVITE_STATUSES = ['pending', 'claimed', 'expired', 'cancelled'] as const
export type PairInviteStatus = (typeof PAIR_INVITE_STATUSES)[number]

/** Cloud relationship reference. It is deliberately excluded from local backup authority. */
export interface UserRelationshipRecord {
  uid: string
  currentPairId: string | null
  createdAt: RelationshipTimestamp
  updatedAt: RelationshipTimestamp
  schemaVersion: number
}

/** Pair document id is the Pair id. Exactly two distinct durable Firebase UIDs are required. */
export interface PairRecord {
  memberUids: [string, string]
  status: PairStatus
  createdAt: RelationshipTimestamp
  endedAt: RelationshipTimestamp | null
  schemaVersion: number
}

/** Opaque backend-owned invitation record. Its document id is not a pairing-code contract. */
export interface PairInviteRecord {
  inviterUid: string
  status: PairInviteStatus
  createdAt: RelationshipTimestamp
  expiresAt: RelationshipTimestamp
  claimedByUid: string | null
  claimedAt: RelationshipTimestamp | null
  pairId: string | null
  schemaVersion: number
}

export function hasValidPairMembers(memberUids: readonly string[]): memberUids is [string, string] {
  return memberUids.length === 2 && memberUids.every((uid) => uid.trim().length > 0) && memberUids[0] !== memberUids[1]
}

export function isPairStatus(value: unknown): value is PairStatus { return typeof value === 'string' && PAIR_STATUSES.includes(value as PairStatus) }
