import { connectAuthEmulator, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, type Firestore } from 'firebase/firestore'
import { firebaseAuth } from './firebaseAuth'
import { firebaseEmulatorMode } from './firebaseApp'
import { firebaseFirestore } from './firebaseFirestore'

const emulatorConnectionMarker = Symbol.for('starry-love-diary.firebase-emulators-connected')
const authEmulatorConnectionMarker = Symbol.for('starry-love-diary.firebase-auth-emulator-connected')
type FirebaseGlobal = typeof globalThis & { [emulatorConnectionMarker]?: boolean; [authEmulatorConnectionMarker]?: boolean }

export function connectFirebaseAuthEmulator(auth: Auth = firebaseAuth): boolean {
  const firebaseGlobal = globalThis as FirebaseGlobal
  if (!firebaseEmulatorMode || firebaseGlobal[authEmulatorConnectionMarker]) return false

  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  firebaseGlobal[authEmulatorConnectionMarker] = true
  return true
}

export function connectFirebaseEmulators(auth: Auth = firebaseAuth, firestore: Firestore = firebaseFirestore): boolean {
  const firebaseGlobal = globalThis as FirebaseGlobal
  if (!firebaseEmulatorMode || firebaseGlobal[emulatorConnectionMarker]) return false

  connectFirebaseAuthEmulator(auth)
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080)
  firebaseGlobal[emulatorConnectionMarker] = true
  return true
}
