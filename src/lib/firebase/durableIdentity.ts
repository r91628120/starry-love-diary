import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { OAuthProvider, linkWithCredential, type Auth, type User } from 'firebase/auth'
import { firebaseAuth } from './firebaseAuth'

export const appleProviderId = 'apple.com'

export interface DurableIdentityState {
  uid: string | null
  isAnonymous: boolean
  providerIds: string[]
  hasAppleIdentity: boolean
  hasDurableIdentity: boolean
}

export type IdentityUpgradeResult =
  | { status: 'linked'; uid: string }
  | { status: 'already-linked'; uid: string }
  | { status: 'credential-in-use' }
  | { status: 'cancelled' }
  | { status: 'failed'; code: string }

export interface AppleCredentialMaterial {
  idToken?: string
  rawNonce?: string
}

export interface DurableIdentityDependencies {
  auth?: Auth
  acquireAppleCredential?: () => Promise<AppleCredentialMaterial>
  linkCredential?: typeof linkWithCredential
}

function providerIdsFor(user: User): string[] {
  return [...new Set(user.providerData.map(({ providerId }) => providerId).filter(Boolean))]
}

export function getDurableIdentityState(user: User | null | undefined): DurableIdentityState {
  if (!user) return { uid: null, isAnonymous: false, providerIds: [], hasAppleIdentity: false, hasDurableIdentity: false }

  const providerIds = providerIdsFor(user)
  const hasAppleIdentity = providerIds.includes(appleProviderId)
  return {
    uid: user.uid,
    isAnonymous: user.isAnonymous,
    providerIds,
    hasAppleIdentity,
    hasDurableIdentity: !user.isAnonymous || providerIds.length > 0,
  }
}

async function acquireNativeAppleCredential(): Promise<AppleCredentialMaterial> {
  const result = await FirebaseAuthentication.signInWithApple({ skipNativeAuth: true })
  return {
    idToken: result.credential?.idToken,
    rawNonce: result.credential?.nonce,
  }
}

function normalizedErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') return error.code
  return 'unknown'
}

function isCancellation(code: string): boolean {
  return code === 'cancelled' || code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'ASAuthorizationError.canceled'
}

export async function upgradeAnonymousUserWithApple(dependencies: DurableIdentityDependencies = {}): Promise<IdentityUpgradeResult> {
  const auth = dependencies.auth ?? firebaseAuth
  const currentUser = auth.currentUser
  if (!currentUser) return { status: 'failed', code: 'no-current-user' }

  const state = getDurableIdentityState(currentUser)
  if (state.hasAppleIdentity) return { status: 'already-linked', uid: currentUser.uid }
  if (!currentUser.isAnonymous) return { status: 'failed', code: 'not-anonymous' }

  try {
    const credentialMaterial = await (dependencies.acquireAppleCredential ?? acquireNativeAppleCredential)()
    if (!credentialMaterial.idToken) return { status: 'failed', code: 'missing-apple-id-token' }
    if (!credentialMaterial.rawNonce) return { status: 'failed', code: 'missing-apple-raw-nonce' }

    const credential = new OAuthProvider(appleProviderId).credential({
      idToken: credentialMaterial.idToken,
      rawNonce: credentialMaterial.rawNonce,
    })
    const uidBefore = currentUser.uid
    const linked = await (dependencies.linkCredential ?? linkWithCredential)(currentUser, credential)
    if (linked.user.uid !== uidBefore) return { status: 'failed', code: 'uid-continuity-violation' }
    return { status: 'linked', uid: linked.user.uid }
  } catch (error) {
    const code = normalizedErrorCode(error)
    if (code === 'auth/credential-already-in-use') return { status: 'credential-in-use' }
    if (isCancellation(code)) return { status: 'cancelled' }
    return { status: 'failed', code }
  }
}
