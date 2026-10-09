import { afterEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { Auth, User } from 'firebase/auth'

vi.mock('./firebaseAuth', () => ({ firebaseAuth: { authStateReady: vi.fn<() => Promise<void>>().mockResolvedValue(undefined) }, ensureAnonymousUser: vi.fn() }))
vi.mock('./firebaseEmulators', () => ({ connectFirebaseAuthEmulator: vi.fn() }))

import { ensureAnonymousUser } from './firebaseAuth'
import { bootstrapAnonymousUser, releaseStalledAnonymousBootstrap } from './userBootstrap'

const user = { uid: 'alice', isAnonymous: true } as User

type TestAuth = Omit<Auth, 'authStateReady' | 'currentUser'> & {
  authStateReady: Mock<() => Promise<void>>
  currentUser: User | null
}

function createAuth(): TestAuth {
  return {
    currentUser: null,
    authStateReady: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  } as unknown as TestAuth
}

afterEach(() => { vi.mocked(ensureAnonymousUser).mockReset() })

describe('anonymous user bootstrap', () => {
  it('ensures an anonymous Firebase Auth user without any Firestore dependency', async () => {
    const auth = createAuth()
    const ensureUser = vi.fn().mockResolvedValue(user)

    await expect(bootstrapAnonymousUser({ auth, ensureUser })).resolves.toEqual({ uid: 'alice', isAnonymous: true })
    expect(auth.authStateReady).toHaveBeenCalledOnce()
    expect(ensureUser).toHaveBeenCalledWith(auth)
  })

  it('returns the existing Firebase Auth user without creating product data', async () => {
    const auth = createAuth()
    const existingUser = { uid: 'alice', isAnonymous: false } as User

    await expect(bootstrapAnonymousUser({ auth, ensureUser: vi.fn().mockResolvedValue(existingUser) })).resolves.toEqual({ uid: 'alice', isAnonymous: false })
  })

  it('does not create an anonymous user before persisted auth restoration settles', async () => {
    let finishRestoration: () => void = () => undefined
    const auth = createAuth()
    auth.authStateReady.mockImplementation(() => new Promise<void>((resolve) => { finishRestoration = resolve }))
    const ensureUser = vi.fn().mockResolvedValue(user)

    const pending = bootstrapAnonymousUser({ auth, ensureUser })
    expect(ensureUser).not.toHaveBeenCalled()
    finishRestoration()

    await expect(pending).resolves.toEqual({ uid: 'alice', isAnonymous: true })
    expect(ensureUser).toHaveBeenCalledOnce()
  })

  it('reuses an Apple-linked user restored by authStateReady without anonymous sign-in', async () => {
    const restoredUser = { uid: 'durable-user', isAnonymous: false, providerData: [{ providerId: 'apple.com' }] } as unknown as User
    const auth = createAuth()
    auth.authStateReady.mockImplementation(async () => { auth.currentUser = restoredUser })
    const ensureUser = vi.fn(async (currentAuth: Auth) => currentAuth.currentUser!)

    await expect(bootstrapAnonymousUser({ auth, ensureUser })).resolves.toEqual({ uid: 'durable-user', isAnonymous: false })
    expect(ensureUser).toHaveBeenCalledWith(auth)
  })

  it('propagates auth restoration failure without attempting anonymous sign-in', async () => {
    const auth = createAuth()
    auth.authStateReady.mockRejectedValue(new Error('persistence unavailable'))
    const ensureUser = vi.fn().mockResolvedValue(user)

    await expect(bootstrapAnonymousUser({ auth, ensureUser })).rejects.toThrow('persistence unavailable')
    expect(ensureUser).not.toHaveBeenCalled()
  })

  it('allows a fresh retry after releasing a stalled shared attempt without letting the stale completion clear it', async () => {
    let resolveStalled: (value: User) => void = () => undefined
    let resolveRetry: (value: User) => void = () => undefined
    const stalled = new Promise<User>((resolve) => { resolveStalled = resolve })
    const retryPending = new Promise<User>((resolve) => { resolveRetry = resolve })
    const ensureUser = vi.mocked(ensureAnonymousUser).mockReturnValueOnce(stalled).mockReturnValueOnce(retryPending)

    const first = bootstrapAnonymousUser()
    releaseStalledAnonymousBootstrap(first)
    const retry = bootstrapAnonymousUser()

    resolveStalled(user)
    await expect(first).resolves.toEqual({ uid: 'alice', isAnonymous: true })
    expect(bootstrapAnonymousUser()).toBe(retry)
    resolveRetry(user)
    await expect(retry).resolves.toEqual({ uid: 'alice', isAnonymous: true })
    expect(ensureUser).toHaveBeenCalledTimes(2)
  })
})
