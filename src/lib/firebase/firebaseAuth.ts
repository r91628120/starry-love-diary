import { getAuth, signInAnonymously, type Auth, type User } from 'firebase/auth'
import { firebaseApp } from './firebaseApp'

export const firebaseAuth = getAuth(firebaseApp)

export async function ensureAnonymousUser(auth: Auth = firebaseAuth): Promise<User> {
  if (auth.currentUser) return auth.currentUser
  return (await signInAnonymously(auth)).user
}
