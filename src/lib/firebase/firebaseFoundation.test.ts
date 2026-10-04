import { describe, expect, it } from 'vitest'
import type { Auth, User } from 'firebase/auth'
import { ensureAnonymousUser, firebaseAuth } from './firebaseAuth'
import { firebaseApp, firebaseEmulatorMode, isFirebaseEmulatorMode } from './firebaseApp'
import { connectFirebaseEmulators } from './firebaseEmulators'
import { firebaseFirestore } from './firebaseFirestore'

describe('Firebase foundation', () => {
  it('exports one app with stable Auth and Firestore instances', () => {
    expect(firebaseApp.name).toBe('[DEFAULT]')
    expect(firebaseAuth.app).toBe(firebaseApp)
    expect(firebaseFirestore.app).toBe(firebaseApp)
  })

  it('does not connect emulators unless the explicit emulator flag is enabled', () => {
    expect(firebaseEmulatorMode).toBe(false)
    expect(isFirebaseEmulatorMode('true')).toBe(true)
    expect(isFirebaseEmulatorMode('false')).toBe(false)
    expect(isFirebaseEmulatorMode(undefined)).toBe(false)
    expect(connectFirebaseEmulators()).toBe(false)
  })

  it('returns an existing anonymous identity without signing in again', async () => {
    const existingUser = { uid: 'existing-local-user', isAnonymous: true } as User
    const authWithUser = { currentUser: existingUser } as Auth

    await expect(ensureAnonymousUser(authWithUser)).resolves.toBe(existingUser)
  })
})
