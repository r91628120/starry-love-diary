import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { OAuthProvider, linkWithCredential, signInWithCredential, type Auth, type AuthCredential, type User } from 'firebase/auth'
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

export type ExistingIdentityRecoveryResult =
  | { status: 'recovered' }
  | { status: 'cancelled' }
  | { status: 'failed'; code: string }

export interface AppleCredentialMaterial {
  idToken?: string
  rawNonce?: string
}

type AppleCredentialBuildResult =
  | { credential: AuthCredential }
  | { error: 'missing-apple-id-token' | 'missing-apple-raw-nonce' }

export interface DurableIdentityDependencies {
  auth?: Auth
  acquireAppleCredential?: () => Promise<AppleCredentialMaterial>
  linkCredential?: typeof linkWithCredential
  signInCredential?: typeof signInWithCredential
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

function credentialFromAppleMaterial(credentialMaterial: AppleCredentialMaterial): AppleCredentialBuildResult {
  if (!credentialMaterial.idToken) return { error: 'missing-apple-id-token' as const }
  if (!credentialMaterial.rawNonce) return { error: 'missing-apple-raw-nonce' as const }
  return { credential: new OAuthProvider(appleProviderId).credential({ idToken: credentialMaterial.idToken, rawNonce: credentialMaterial.rawNonce }) }
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
    const material = credentialFromAppleMaterial(credentialMaterial)
    if ('error' in material) return { status: 'failed', code: material.error }
    const uidBefore = currentUser.uid
    const linked = await (dependencies.linkCredential ?? linkWithCredential)(currentUser, material.credential)
    if (linked.user.uid !== uidBefore) return { status: 'failed', code: 'uid-continuity-violation' }
    return { status: 'linked', uid: linked.user.uid }
  } catch (error) {
    const code = normalizedErrorCode(error)
    if (code === 'auth/credential-already-in-use') return { status: 'credential-in-use' }
    if (isCancellation(code)) return { status: 'cancelled' }
    return { status: 'failed', code }
  }
}

/**
 * Signs into the already-owned Firebase account only after the UI has shown
 * explicit recovery consent following a credential-in-use result. This always
 * obtains a new native Apple assertion; no failed-link material is reused.
 */
export async function recoverExistingAppleIdentity(dependencies: DurableIdentityDependencies = {}): Promise<ExistingIdentityRecoveryResult> {
  const auth = dependencies.auth ?? firebaseAuth
  if (!auth.currentUser) return { status: 'failed', code: 'no-current-user' }

  try {
    const credentialMaterial = await (dependencies.acquireAppleCredential ?? acquireNativeAppleCredential)()
    const material = credentialFromAppleMaterial(credentialMaterial)
    if ('error' in material) return { status: 'failed', code: material.error }
    const signedIn = await (dependencies.signInCredential ?? signInWithCredential)(auth, material.credential)
    if (!getDurableIdentityState(signedIn.user).hasAppleIdentity) return { status: 'failed', code: 'apple-identity-not-linked' }
    return { status: 'recovered' }
  } catch (error) {
    const code = normalizedErrorCode(error)
    if (isCancellation(code)) return { status: 'cancelled' }
    return { status: 'failed', code }
  }
}
