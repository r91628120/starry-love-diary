import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app'
import { configuredFirebaseOptions, demoEmulatorOptions, hasFirebaseWebConfiguration, isFirebaseEmulatorMode } from './firebaseEnvironment'

export { isFirebaseEmulatorMode } from './firebaseEnvironment'
export const firebaseEmulatorMode = isFirebaseEmulatorMode()

function firebaseOptions(): FirebaseOptions {
  const configured = configuredFirebaseOptions()
  if (hasFirebaseWebConfiguration(configured)) return configured
  if (firebaseEmulatorMode || import.meta.env.MODE === 'test') return demoEmulatorOptions()
  throw new Error('Firebase Web configuration is required before Firebase services can be used outside local emulator mode.')
}

export const firebaseApp: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseOptions())
