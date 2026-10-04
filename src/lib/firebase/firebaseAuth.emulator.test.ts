import { afterAll, describe, expect, it } from 'vitest'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { deleteApp, initializeApp } from 'firebase/app'
import { ensureAnonymousUser } from './firebaseAuth'

const projectId = 'demo-starry-love-diary'
const app = initializeApp({
  apiKey: 'demo-api-key',
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
  appId: '1:000000000000:web:phase-3b-auth-test',
}, 'phase-3b-auth-emulator-test')
const auth = getAuth(app)
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })

afterAll(async () => {
  await deleteApp(app)
})

describe('Firebase Auth Emulator', () => {
  it('creates one local anonymous user and reuses it for the current Auth session', async () => {
    const first = await ensureAnonymousUser(auth)
    const second = await ensureAnonymousUser(auth)

    expect(first.isAnonymous).toBe(true)
    expect(second.uid).toBe(first.uid)
  })
})
