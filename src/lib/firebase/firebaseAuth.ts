import { browserLocalPersistence, initializeAuth, signInAnonymously, type Auth, type User } from 'firebase/auth'
import { firebaseApp } from './firebaseApp'

export const firebaseAuth = initializeAuth(firebaseApp, {
  persistence: browserLocalPersistence,
})

export async function ensureAnonymousUser(auth: Auth = firebaseAuth): Promise<User> {
  if (auth.currentUser) return auth.currentUser
  return (await signInAnonymously(auth)).user
}
