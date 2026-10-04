import type { FirebaseOptions } from 'firebase/app'

export const firebaseDemoProjectId = 'demo-starry-love-diary'

export function isFirebaseEmulatorMode(value: string | undefined = import.meta.env.VITE_USE_FIREBASE_EMULATORS): boolean {
  return value === 'true'
}

export function configuredFirebaseOptions(): FirebaseOptions {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
}

export function hasFirebaseWebConfiguration(config: FirebaseOptions = configuredFirebaseOptions()): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)
}

export function isFirebaseRuntimeConfigured(): boolean {
  return isFirebaseEmulatorMode() || hasFirebaseWebConfiguration()
}

export function demoEmulatorOptions(): FirebaseOptions {
  return {
    apiKey: 'demo-api-key',
    authDomain: `${firebaseDemoProjectId}.firebaseapp.com`,
    projectId: firebaseDemoProjectId,
    storageBucket: `${firebaseDemoProjectId}.firebasestorage.app`,
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:demo',
  }
}
