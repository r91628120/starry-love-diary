import { connectFirebaseEmulators } from './firebaseEmulators'

// This is the only client entry point for future Firebase-backed feature work.
// It remains unused by current product flows in Phase 3B.
connectFirebaseEmulators()

export { ensureAnonymousUser, firebaseAuth } from './firebaseAuth'
export { firebaseApp, firebaseEmulatorMode } from './firebaseApp'
export { connectFirebaseAuthEmulator, connectFirebaseEmulators } from './firebaseEmulators'
export { firebaseFirestore } from './firebaseFirestore'
export { bootstrapAnonymousUser } from './userBootstrap'
export { appleProviderId, getDurableIdentityState, upgradeAnonymousUserWithApple } from './durableIdentity'
export type { DurableIdentityState, IdentityUpgradeResult } from './durableIdentity'
