import { readFileSync } from 'node:fs'
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'

const projectId = 'demo-starry-love-diary'
let testEnvironment: RulesTestEnvironment

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterEach(async () => { await testEnvironment.clearFirestore() })
afterAll(async () => { await testEnvironment.cleanup() })

async function seedRelationshipFixtures() {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore()
    await setDoc(doc(firestore, 'users', 'alice'), { uid: 'alice', currentPairId: 'pair-alice-bob', schemaVersion: 1 })
    await setDoc(doc(firestore, 'pairs', 'pair-alice-bob'), { memberUids: ['alice', 'bob'], status: 'active', schemaVersion: 1 })
    await setDoc(doc(firestore, 'pairInvites', 'opaque-invite'), { inviterUid: 'alice', status: 'pending', schemaVersion: 1 })
  })
}

describe('Pair Firestore authorization foundation', () => {
  it('allows only an owner to read an existing user relationship reference', async () => {
    await seedRelationshipFixtures()
    await assertSucceeds(getDoc(doc(testEnvironment.authenticatedContext('alice').firestore(), 'users', 'alice')))
    await assertFails(getDoc(doc(testEnvironment.authenticatedContext('mallory').firestore(), 'users', 'alice')))
    await assertFails(getDoc(doc(testEnvironment.unauthenticatedContext().firestore(), 'users', 'alice')))
  })

  it('denies user lists and every client attempt to create, change, or delete a relationship reference', async () => {
    await seedRelationshipFixtures()
    const owner = testEnvironment.authenticatedContext('alice').firestore()
    await assertFails(getDocs(collection(owner, 'users')))
    await assertFails(setDoc(doc(owner, 'users', 'new-user'), { uid: 'new-user', currentPairId: null, schemaVersion: 1 }))
    await assertFails(setDoc(doc(owner, 'users', 'alice'), { uid: 'alice', currentPairId: 'pair-123', schemaVersion: 1 }))
    await assertFails(updateDoc(doc(owner, 'users', 'alice'), { currentPairId: 'pair-123' }))
    await assertFails(deleteDoc(doc(owner, 'users', 'alice')))
  })

  it('allows exactly Pair members to read a seeded Pair', async () => {
    await seedRelationshipFixtures()
    const pairFor = (uid: string) => doc(testEnvironment.authenticatedContext(uid).firestore(), 'pairs', 'pair-alice-bob')
    await assertSucceeds(getDoc(pairFor('alice')))
    await assertSucceeds(getDoc(pairFor('bob')))
    await assertFails(getDoc(pairFor('mallory')))
    await assertFails(getDoc(doc(testEnvironment.unauthenticatedContext().firestore(), 'pairs', 'pair-alice-bob')))
  })

  it('denies Pair lists and all client Pair creation, mutation, membership changes, ending, and deletion', async () => {
    await seedRelationshipFixtures()
    const alice = testEnvironment.authenticatedContext('alice').firestore()
    const pair = doc(alice, 'pairs', 'pair-alice-bob')
    await assertFails(getDocs(collection(alice, 'pairs')))
    await assertFails(setDoc(doc(alice, 'pairs', 'new-pair'), { memberUids: ['alice', 'mallory'], status: 'active' }))
    await assertFails(updateDoc(pair, { memberUids: ['alice', 'mallory'] }))
    await assertFails(updateDoc(pair, { status: 'ended' }))
    await assertFails(deleteDoc(pair))
  })

  it('denies anonymous, arbitrary-user, and inviter direct Pair invite reads, creation, claims, and deletion', async () => {
    await seedRelationshipFixtures()
    const alice = testEnvironment.authenticatedContext('alice').firestore()
    const invite = doc(alice, 'pairInvites', 'opaque-invite')
    await assertFails(getDoc(doc(testEnvironment.unauthenticatedContext().firestore(), 'pairInvites', 'opaque-invite')))
    await assertFails(getDoc(doc(testEnvironment.authenticatedContext('mallory').firestore(), 'pairInvites', 'opaque-invite')))
    await assertFails(getDoc(invite))
    await assertFails(setDoc(doc(alice, 'pairInvites', 'new-invite'), { inviterUid: 'alice', status: 'pending' }))
    await assertFails(updateDoc(invite, { claimedByUid: 'alice', status: 'claimed' }))
    await assertFails(deleteDoc(invite))
  })

  it('keeps unknown paths deny-by-default', async () => {
    const alice = testEnvironment.authenticatedContext('alice').firestore()
    const unknown = doc(alice, 'messages', 'x')
    await assertFails(getDoc(unknown))
    await assertFails(setDoc(unknown, { value: true }))
  })
})
