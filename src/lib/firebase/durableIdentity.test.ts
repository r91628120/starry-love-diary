import { describe, expect, it, vi } from 'vitest'
import type { Auth, User } from 'firebase/auth'

const nativeAuthMocks = vi.hoisted(() => ({ signInWithApple: vi.fn() }))
vi.mock('@capacitor-firebase/authentication', () => ({ FirebaseAuthentication: nativeAuthMocks }))
vi.mock('./firebaseAuth', () => ({ firebaseAuth: {} }))

import { getDurableIdentityState, upgradeAnonymousUserWithApple } from './durableIdentity'

function user(overrides: Partial<User> = {}): User {
  return {
    uid: 'anonymous-uid',
    isAnonymous: true,
    providerData: [],
    ...overrides,
  } as User
}

function auth(currentUser: User | null): Auth {
  return { currentUser } as Auth
}

describe('durable identity state', () => {
  it('describes an anonymous identity without durable providers', () => {
    expect(getDurableIdentityState(user())).toEqual({ uid: 'anonymous-uid', isAnonymous: true, providerIds: [], hasAppleIdentity: false, hasDurableIdentity: false })
  })

  it('recognizes Apple as a durable provider', () => {
    expect(getDurableIdentityState(user({ isAnonymous: false, providerData: [{ providerId: 'apple.com' } as User['providerData'][number]] }))).toMatchObject({ hasAppleIdentity: true, hasDurableIdentity: true, providerIds: ['apple.com'] })
  })
})

describe('anonymous to Apple upgrade', () => {
  const appleCredential = { idToken: 'transient-id-token', rawNonce: 'transient-raw-nonce' }

  it('short-circuits an already linked Apple user without native authorization', async () => {
    const acquireAppleCredential = vi.fn()
    await expect(upgradeAnonymousUserWithApple({ auth: auth(user({ isAnonymous: false, providerData: [{ providerId: 'apple.com' } as User['providerData'][number]] })), acquireAppleCredential })).resolves.toEqual({ status: 'already-linked', uid: 'anonymous-uid' })
    expect(acquireAppleCredential).not.toHaveBeenCalled()
  })

  it('fails safely when there is no current JS Firebase user', async () => {
    await expect(upgradeAnonymousUserWithApple({ auth: auth(null) })).resolves.toEqual({ status: 'failed', code: 'no-current-user' })
  })

  it.each([
    [{ rawNonce: 'nonce' }, 'missing-apple-id-token'],
    [{ idToken: 'token' }, 'missing-apple-raw-nonce'],
  ])('validates transient native Apple material before linking', async (material, code) => {
    const linkCredential = vi.fn()
    await expect(upgradeAnonymousUserWithApple({ auth: auth(user()), acquireAppleCredential: vi.fn().mockResolvedValue(material), linkCredential })).resolves.toEqual({ status: 'failed', code })
    expect(linkCredential).not.toHaveBeenCalled()
  })

  it('links through Firebase JS and preserves the anonymous UID', async () => {
    const currentUser = user()
    const linkCredential = vi.fn().mockResolvedValue({ user: currentUser })
    await expect(upgradeAnonymousUserWithApple({ auth: auth(currentUser), acquireAppleCredential: vi.fn().mockResolvedValue(appleCredential), linkCredential })).resolves.toEqual({ status: 'linked', uid: 'anonymous-uid' })
    expect(linkCredential).toHaveBeenCalledOnce()
    expect(linkCredential.mock.calls[0][0]).toBe(currentUser)
  })

  it('rejects a linked result that violates UID continuity', async () => {
    await expect(upgradeAnonymousUserWithApple({ auth: auth(user()), acquireAppleCredential: vi.fn().mockResolvedValue(appleCredential), linkCredential: vi.fn().mockResolvedValue({ user: user({ uid: 'replacement-uid' }) }) })).resolves.toEqual({ status: 'failed', code: 'uid-continuity-violation' })
  })

  it.each([
    ['cancelled', { status: 'cancelled' }],
    ['auth/credential-already-in-use', { status: 'credential-in-use' }],
    ['auth/internal-error', { status: 'failed', code: 'auth/internal-error' }],
  ])('normalizes %s without changing the current session', async (code, expected) => {
    await expect(upgradeAnonymousUserWithApple({ auth: auth(user()), acquireAppleCredential: vi.fn().mockRejectedValue({ code }) })).resolves.toEqual(expected)
  })

  it('uses native Apple authorization only to obtain transient material with native auth skipped', async () => {
    nativeAuthMocks.signInWithApple.mockResolvedValue({ credential: appleCredential })
    await upgradeAnonymousUserWithApple({ auth: auth(user()), linkCredential: vi.fn().mockResolvedValue({ user: user() }) })
    expect(nativeAuthMocks.signInWithApple).toHaveBeenCalledWith({ skipNativeAuth: true })
  })
})
