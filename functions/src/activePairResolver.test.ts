import { describe, expect, it } from 'vitest'
import { PairInviteError, type VerifiedCaller } from './pairInviteService.js'
import { resolveActivePairForCaller } from './activePairResolver.js'

type DocumentData = Record<string, unknown> | undefined

function firestoreWith(documents: Record<string, DocumentData>) {
  const reference = (path: string) => ({ path, get: async () => ({ exists: documents[path] !== undefined, data: () => documents[path] }) })
  const firestore = { collection: (name: string) => ({ doc: (id: string) => reference(`${name}/${id}`) }) }
  return firestore as never
}

const durable = (uid: string): VerifiedCaller => ({ uid, signInProvider: 'apple.com' })
const anonymous: VerifiedCaller = { uid: 'anonymous', signInProvider: 'anonymous' }
const activePair = { memberUids: ['alice', 'bob'], status: 'active' }

async function expectError(work: () => Promise<unknown>, applicationCode: PairInviteError['applicationCode']) {
  await expect(work()).rejects.toMatchObject({ applicationCode })
}

describe('trusted active Pair resolver', () => {
  it('derives the active partner from backend-owned relationship documents', async () => {
    const context = await resolveActivePairForCaller({ ...durable('alice'), partnerUid: 'mallory' } as VerifiedCaller, { firestore: firestoreWith({ 'users/alice': { currentPairId: 'pair-alice-bob' }, 'pairs/pair-alice-bob': activePair }) })
    expect(context).toMatchObject({ pairId: 'pair-alice-bob', callerUid: 'alice', partnerUid: 'bob', pairData: activePair })
    expect(context.pairRef.path).toBe('pairs/pair-alice-bob')
  })

  it.each([
    ['unauthenticated caller', null, {}, 'unauthenticated'],
    ['anonymous caller', anonymous, {}, 'durable-identity-required'],
    ['missing caller record', durable('alice'), {}, 'no-active-pair'],
    ['missing currentPairId', durable('alice'), { 'users/alice': {} }, 'no-active-pair'],
    ['blank currentPairId', durable('alice'), { 'users/alice': { currentPairId: ' ' } }, 'no-active-pair'],
    ['missing Pair', durable('alice'), { 'users/alice': { currentPairId: 'missing' } }, 'pair-not-found'],
    ['ended Pair', durable('alice'), { 'users/alice': { currentPairId: 'pair' }, 'pairs/pair': { ...activePair, status: 'ended' } }, 'no-active-pair'],
    ['caller outside Pair', durable('alice'), { 'users/alice': { currentPairId: 'pair' }, 'pairs/pair': { memberUids: ['bob', 'carol'], status: 'active' } }, 'not-pair-member'],
    ['one Pair member', durable('alice'), { 'users/alice': { currentPairId: 'pair' }, 'pairs/pair': { memberUids: ['alice'], status: 'active' } }, 'no-active-pair'],
    ['three Pair members', durable('alice'), { 'users/alice': { currentPairId: 'pair' }, 'pairs/pair': { memberUids: ['alice', 'bob', 'carol'], status: 'active' } }, 'no-active-pair'],
    ['duplicate Pair member', durable('alice'), { 'users/alice': { currentPairId: 'pair' }, 'pairs/pair': { memberUids: ['alice', 'alice'], status: 'active' } }, 'no-active-pair'],
    ['malformed Pair members', durable('alice'), { 'users/alice': { currentPairId: 'pair' }, 'pairs/pair': { memberUids: 'alice,bob', status: 'active' } }, 'no-active-pair'],
    ['blank Pair member', durable('alice'), { 'users/alice': { currentPairId: 'pair' }, 'pairs/pair': { memberUids: ['alice', ' '], status: 'active' } }, 'no-active-pair'],
  ] as const)('rejects %s', async (_label, caller, documents, applicationCode) => {
    await expectError(() => resolveActivePairForCaller(caller, { firestore: firestoreWith(documents) }), applicationCode)
  })
})
