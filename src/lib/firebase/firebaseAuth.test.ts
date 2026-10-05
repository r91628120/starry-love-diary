import { describe, expect, it, vi } from 'vitest'
import type { User } from 'firebase/auth'

const authMocks = vi.hoisted(() => {
  const firebaseApp = { name: 'test-app' }
  const firebaseAuth = { currentUser: null as User | null }
  const browserLocalPersistence = { type: 'LOCAL' }
  return {
    firebaseApp,
    firebaseAuth,
    browserLocalPersistence,
    initializeAuth: vi.fn((app: unknown, options: unknown) => {
      void app
      void options
      return firebaseAuth
    }),
    signInAnonymously: vi.fn<(auth: unknown) => Promise<{ user: User }>>(),
  }
})

vi.mock('./firebaseApp', () => ({ firebaseApp: authMocks.firebaseApp }))
vi.mock('firebase/auth', () => ({
  browserLocalPersistence: authMocks.browserLocalPersistence,
  initializeAuth: (app: unknown, options: unknown) => authMocks.initializeAuth(app, options),
  signInAnonymously: (auth: unknown) => authMocks.signInAnonymously(auth),
}))

import { ensureAnonymousUser, firebaseAuth } from './firebaseAuth'

describe('Firebase Auth initialization', () => {
  it('creates one exported Auth instance with browser local persistence', () => {
    expect(firebaseAuth).toBe(authMocks.firebaseAuth)
    expect(authMocks.initializeAuth).toHaveBeenCalledOnce()
    expect(authMocks.initializeAuth).toHaveBeenCalledWith(authMocks.firebaseApp, { persistence: authMocks.browserLocalPersistence })
  })

  it('reuses an existing Firebase user without anonymous sign-in', async () => {
    const existingUser = { uid: 'existing-user', isAnonymous: true } as User
    authMocks.firebaseAuth.currentUser = existingUser
    await expect(ensureAnonymousUser()).resolves.toBe(existingUser)
    expect(authMocks.signInAnonymously).not.toHaveBeenCalled()
  })

  it('creates an anonymous Firebase user when no current user exists', async () => {
    const anonymousUser = { uid: 'anonymous-user', isAnonymous: true } as User
    authMocks.firebaseAuth.currentUser = null
    authMocks.signInAnonymously.mockResolvedValue({ user: anonymousUser })
    await expect(ensureAnonymousUser()).resolves.toBe(anonymousUser)
    expect(authMocks.signInAnonymously).toHaveBeenCalledWith(authMocks.firebaseAuth)
  })
})
