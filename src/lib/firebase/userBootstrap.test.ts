import { describe, expect, it, vi } from 'vitest'
import type { Auth, User } from 'firebase/auth'

vi.mock('./firebaseAuth', () => ({ firebaseAuth: {}, ensureAnonymousUser: vi.fn() }))
vi.mock('./firebaseEmulators', () => ({ connectFirebaseAuthEmulator: vi.fn() }))

import { bootstrapAnonymousUser } from './userBootstrap'

const auth = {} as Auth
const user = { uid: 'alice', isAnonymous: true } as User

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
})
