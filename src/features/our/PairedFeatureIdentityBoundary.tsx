import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { PrimaryButton, SecondaryButton, SoftCard } from '../../components'
import { useI18n } from '../../i18n/I18nContext'
import { isFirebaseRuntimeConfigured } from '../../lib/firebase/firebaseEnvironment'
import type { Auth, User } from 'firebase/auth'
import type { DurableIdentityState, IdentityUpgradeResult } from '../../lib/firebase/durableIdentity'

interface FirebaseIdentityServices {
  auth: Auth
  getDurableIdentityState: (user: User | null | undefined) => DurableIdentityState
  upgradeAnonymousUserWithApple: () => Promise<IdentityUpgradeResult>
  onAuthStateChanged: (auth: Auth, nextOrObserver: (user: User | null) => void) => () => void
}

type AppleIdentityGateProps = {
  onResult: (result: IdentityUpgradeResult) => void
  backTo?: string
  upgrade: () => Promise<IdentityUpgradeResult>
  /** Visual-only use for localhost product review. It never starts authentication. */
  preview?: boolean
}

export function AppleIdentityGate({ onResult, backTo = '/our', upgrade, preview = false }: AppleIdentityGateProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<'credential-in-use' | 'failed'>()
  const continueWithApple = async () => {
    if (preview) return
    if (busy) return
    setBusy(true); setMessage(undefined)
    let result: IdentityUpgradeResult
    try {
      result = await upgrade()
    } catch {
      result = { status: 'failed', code: 'unexpected' }
    }
    setBusy(false)
    if (result.status === 'credential-in-use') setMessage('credential-in-use')
    if (result.status === 'failed') setMessage('failed')
    onResult(result)
  }
  const messageKey = message === 'credential-in-use' ? 'identityGate.credentialInUse' : 'identityGate.failed'
  return <div className="page our-page identity-gate-page"><main className="our-page__content identity-gate-page__content"><section className="identity-gate-hero"><div><span aria-hidden="true">✦</span><h1>{t('identityGate.title')}</h1><p>{t('identityGate.bodyOne')}</p><p>{t('identityGate.bodyTwo')}</p></div></section><SoftCard className="identity-gate-card" tone="purple"><p className="identity-gate-card__privacy">{t('identityGate.privacy')}</p><PrimaryButton className="identity-gate-card__apple" disabled={busy} aria-busy={busy} onClick={() => void continueWithApple()}><img className="identity-gate-card__apple-logo" src="/assets/auth/apple-logo-white.png" alt="" /><span>{busy ? t('identityGate.loading') : t('identityGate.continue')}</span></PrimaryButton>{message ? <p role="alert" className="identity-gate-card__message">{t(messageKey)}</p> : null}<p className="identity-gate-card__single">{t('identityGate.notRequired')}</p><SecondaryButton onClick={() => navigate(backTo)}>{t('identityGate.notNow')}</SecondaryButton></SoftCard></main></div>
}

/**
 * Shared durable-identity gate for a relationship-establishing action.
 * Routes stay browseable; callers mount this only after the user chooses a
 * real invite, claim, or paired action.
 */
function IdentityLoading() {
  const { t } = useI18n()
  return <div className="page our-page identity-gate-page" aria-busy="true"><main className="our-page__content identity-gate-page__content"><SoftCard className="identity-gate-status" tone="purple"><h1>{t('identityGate.preparingTitle')}</h1><p>{t('identityGate.preparingBody')}</p></SoftCard></main></div>
}

function IdentityInitializationError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n()
  return <div className="page our-page identity-gate-page"><main className="our-page__content identity-gate-page__content"><SoftCard className="identity-gate-status" tone="purple"><h1>{t('identityGate.initializeErrorTitle')}</h1><p>{t('identityGate.initializeErrorBody')}</p><PrimaryButton onClick={onRetry}>{t('identityGate.retry')}</PrimaryButton></SoftCard></main></div>
}

export function PairedFeatureIdentityBoundary({ children, backTo = '/our' }: { children: ReactNode; backTo?: string }) {
  const [user, setUser] = useState<User | null | undefined>(() => isFirebaseRuntimeConfigured() ? undefined : null)
  const [services, setServices] = useState<FirebaseIdentityServices>()
  const [initialization, setInitialization] = useState<'loading' | 'ready' | 'error'>(() => isFirebaseRuntimeConfigured() ? 'loading' : 'ready')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!isFirebaseRuntimeConfigured()) return
    let active = true
    let unsubscribe: (() => void) | undefined
    setInitialization('loading'); setServices(undefined); setUser(undefined)
    void Promise.all([
      import('../../lib/firebase/firebaseAuth'),
      import('../../lib/firebase/durableIdentity'),
      import('../../lib/firebase/userBootstrap'),
      import('firebase/auth'),
    ]).then(async ([{ firebaseAuth }, durableIdentity, { bootstrapAnonymousUser }, { onAuthStateChanged }]) => {
      const loaded: FirebaseIdentityServices = { auth: firebaseAuth, getDurableIdentityState: durableIdentity.getDurableIdentityState, upgradeAnonymousUserWithApple: durableIdentity.upgradeAnonymousUserWithApple, onAuthStateChanged }
      unsubscribe = loaded.onAuthStateChanged(loaded.auth, (nextUser) => { if (active) setUser(nextUser) })
      await bootstrapAnonymousUser()
      if (!active || !loaded.auth.currentUser) throw new Error('firebase-user-unavailable')
      setServices(loaded); setUser(loaded.auth.currentUser); setInitialization('ready')
    }).catch(() => { if (active) { unsubscribe?.(); unsubscribe = undefined; setServices(undefined); setUser(undefined); setInitialization('error') } })
    return () => { active = false; unsubscribe?.() }
  }, [attempt])
  if (!isFirebaseRuntimeConfigured()) return <>{children}</>
  if (initialization === 'loading') return <IdentityLoading />
  if (initialization === 'error' || user === undefined || !services) return <IdentityInitializationError onRetry={() => setAttempt((current) => current + 1)} />
  if (services.getDurableIdentityState(user).hasAppleIdentity) return <>{children}</>
  return <AppleIdentityGate backTo={backTo} upgrade={services.upgradeAnonymousUserWithApple} onResult={(result) => { if (result.status === 'linked' || result.status === 'already-linked') setUser(services.auth.currentUser) }} />
}
