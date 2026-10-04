import { afterAll, describe, expect, it } from 'vitest'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { deleteApp, initializeApp } from 'firebase/app'
import { bootstrapAnonymousUser } from './userBootstrap'

const projectId = 'demo-starry-love-diary'
const app = initializeApp({
  apiKey: 'demo-api-key', authDomain: `${projectId}.firebaseapp.com`, projectId, appId: '1:000000000000:web:phase-3c-bootstrap-test',
}, 'phase-3c-bootstrap-emulator-test')
const auth = getAuth(app)
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })

afterAll(async () => { await deleteApp(app) })

describe('anonymous user bootstrap against emulators', () => {
  it('creates and reuses an Auth identity without a Firestore dependency', async () => {
    const first = await bootstrapAnonymousUser({ auth })
    expect(first).toMatchObject({ isAnonymous: true })

    const second = await bootstrapAnonymousUser({ auth })
    expect(second).toMatchObject({ uid: first.uid, isAnonymous: true })
  })
})
