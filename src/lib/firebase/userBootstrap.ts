import type { Auth, User } from 'firebase/auth'
import { ensureAnonymousUser, firebaseAuth } from './firebaseAuth'
import { connectFirebaseAuthEmulator } from './firebaseEmulators'

export interface AnonymousIdentityBootstrapResult {
  uid: string
  isAnonymous: boolean
}

export interface AnonymousIdentityBootstrapDependencies {
  auth?: Auth
  ensureUser?: (auth: Auth) => Promise<User>
}

let activeBootstrap: Promise<AnonymousIdentityBootstrapResult> | undefined

async function runBootstrap(dependencies: Required<AnonymousIdentityBootstrapDependencies>): Promise<AnonymousIdentityBootstrapResult> {
  connectFirebaseAuthEmulator(dependencies.auth)
  const user = await dependencies.ensureUser(dependencies.auth)
  return { uid: user.uid, isAnonymous: user.isAnonymous }
}

// Phase 3C deliberately bootstraps Firebase Auth only. Product Firestore user
// documents are deferred until the later pairing/profile model is approved.
export function bootstrapAnonymousUser(overrides?: AnonymousIdentityBootstrapDependencies): Promise<AnonymousIdentityBootstrapResult> {
  const dependencies: Required<AnonymousIdentityBootstrapDependencies> = {
    auth: overrides?.auth ?? firebaseAuth,
    ensureUser: overrides?.ensureUser ?? ensureAnonymousUser,
  }
  const bootstrap = () => runBootstrap(dependencies)

  if (overrides) return bootstrap()
  if (!activeBootstrap) {
    const pendingBootstrap = bootstrap()
    activeBootstrap = pendingBootstrap
    void pendingBootstrap.finally(() => { activeBootstrap = undefined })
  }
  return activeBootstrap
}
