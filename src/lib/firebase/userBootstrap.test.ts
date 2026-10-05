import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Auth, User } from 'firebase/auth'

vi.mock('./firebaseAuth', () => ({ firebaseAuth: {}, ensureAnonymousUser: vi.fn() }))
vi.mock('./firebaseEmulators', () => ({ connectFirebaseAuthEmulator: vi.fn() }))

import { ensureAnonymousUser } from './firebaseAuth'
import { bootstrapAnonymousUser, releaseStalledAnonymousBootstrap } from './userBootstrap'

const auth = {} as Auth
const user = { uid: 'alice', isAnonymous: true } as User

afterEach(() => { vi.mocked(ensureAnonymousUser).mockReset() })

describe('anonymous user bootstrap', () => {
  it('ensures an anonymous Firebase Auth user without any Firestore dependency', async () => {
    const ensureUser = vi.fn().mockResolvedValue(user)

    await expect(bootstrapAnonymousUser({ auth, ensureUser })).resolves.toEqual({ uid: 'alice', isAnonymous: true })
    expect(ensureUser).toHaveBeenCalledWith(auth)
  })

  it('returns the existing Firebase Auth user without creating product data', async () => {
    const existingUser = { uid: 'alice', isAnonymous: false } as User

    await expect(bootstrapAnonymousUser({ auth, ensureUser: vi.fn().mockResolvedValue(existingUser) })).resolves.toEqual({ uid: 'alice', isAnonymous: false })
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
