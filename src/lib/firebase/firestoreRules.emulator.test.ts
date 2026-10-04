import { readFileSync } from 'node:fs'
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'

const projectId = 'demo-starry-love-diary'
const usersPath = '_firebaseFoundationTestUsers'
let testEnvironment: RulesTestEnvironment

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  })
})

afterEach(async () => {
  await testEnvironment.clearFirestore()
})

afterAll(async () => {
  await testEnvironment.cleanup()
})

describe('Firestore Emulator security rules', () => {
  const sandboxDocument = (uid: string) => ({ uid, test: true, updatedAt: serverTimestamp() })

  it('denies unauthenticated sandbox reads and writes', async () => {
    const firestore = testEnvironment.unauthenticatedContext().firestore()
    const target = doc(firestore, usersPath, 'alice')

    await assertFails(getDoc(target))
    await assertFails(setDoc(target, sandboxDocument('alice')))
  })

  it('allows an authenticated owner to read and write its sandbox document', async () => {
    const owner = testEnvironment.authenticatedContext('alice').firestore()
    const target = doc(owner, usersPath, 'alice')

    await assertSucceeds(setDoc(target, sandboxDocument('alice')))
    await assertSucceeds(getDoc(target))
    await assertSucceeds(updateDoc(target, { test: false, updatedAt: serverTimestamp() }))
  })

  it('denies unrelated authenticated users', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), usersPath, 'alice'), sandboxDocument('alice'))
    })

    const intruder = testEnvironment.authenticatedContext('mallory').firestore()
    await assertFails(getDoc(doc(intruder, usersPath, 'alice')))
    await assertFails(setDoc(doc(intruder, usersPath, 'alice'), sandboxDocument('alice')))
  })

  it('denies all unknown and future domain paths', async () => {
    const authenticated = testEnvironment.authenticatedContext('alice').firestore()
    await assertFails(setDoc(doc(authenticated, 'pairs', 'future-pair'), { owner: 'alice' }))
  })
})
