import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { PrimaryButton, SecondaryButton, SoftCard } from '../../components'
import { useI18n } from '../../i18n/I18nContext'
import { isFirebaseRuntimeConfigured } from '../../lib/firebase/firebaseEnvironment'
import type { Auth, User } from 'firebase/auth'
import type { DurableIdentityState, ExistingIdentityRecoveryResult, IdentityUpgradeResult } from '../../lib/firebase/durableIdentity'

interface FirebaseIdentityServices {
  auth: Auth
  getDurableIdentityState: (user: User | null | undefined) => DurableIdentityState
  upgradeAnonymousUserWithApple: () => Promise<IdentityUpgradeResult>
  recoverExistingAppleIdentity: () => Promise<ExistingIdentityRecoveryResult>
  onAuthStateChanged: (auth: Auth, nextOrObserver: (user: User | null) => void) => () => void
}

type AppleIdentityGateProps = {
  onResult: (result: IdentityUpgradeResult) => void
  onRecoveryResult?: (result: ExistingIdentityRecoveryResult) => void
  backTo?: string
  upgrade: () => Promise<IdentityUpgradeResult>
  recover?: () => Promise<ExistingIdentityRecoveryResult>
  embedded?: boolean
  /** Visual-only use for localhost product review. It never starts authentication. */
  preview?: boolean
}

function IdentityPage({ children, busy = false, embedded = false }: { children: ReactNode; busy?: boolean; embedded?: boolean }) {
  const content = <main className="our-page__content identity-gate-page__content" aria-busy={busy || undefined}>{children}</main>
  return embedded ? content : <div className="page our-page identity-gate-page">{content}</div>
}

export function AppleIdentityGate({ onResult, onRecoveryResult, backTo = '/our', upgrade, recover, preview = false, embedded = false }: AppleIdentityGateProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<'failed'>()
  const [recovery, setRecovery] = useState<'consent' | 'failed'>()
  const continueWithApple = async () => {
    if (preview) return
    if (busy) return
    setBusy(true); setMessage(undefined); setRecovery(undefined)
    let result: IdentityUpgradeResult
    try {
      result = await upgrade()
    } catch {
      result = { status: 'failed', code: 'unexpected' }
    }
    setBusy(false)
    if (result.status === 'credential-in-use') setRecovery('consent')
    if (result.status === 'failed') setMessage('failed')
    onResult(result)
  }
  const recoverExistingIdentity = async () => {
    if (preview || busy) return
    setBusy(true); setRecovery(undefined)
    let result: ExistingIdentityRecoveryResult
    try {
      result = recover ? await recover() : { status: 'failed', code: 'recovery-unavailable' }
    } catch {
      result = { status: 'failed', code: 'unexpected' }
    }
    setBusy(false)
    onRecoveryResult?.(result)
    if (result.status === 'cancelled') setRecovery('consent')
    if (result.status === 'failed') setRecovery('failed')
  }
  if (recovery) return <IdentityPage embedded={embedded}><SoftCard className="identity-gate-card" tone="purple"><h1>{t(recovery === 'consent' ? 'identityGate.recoveryTitle' : 'identityGate.recoveryFailedTitle')}</h1><p>{t(recovery === 'consent' ? 'identityGate.recoveryBody' : 'identityGate.recoveryFailedBody')}</p><PrimaryButton disabled={busy} aria-busy={busy} onClick={() => void recoverExistingIdentity()}>{busy ? t('identityGate.loading') : t(recovery === 'consent' ? 'identityGate.recoveryContinue' : 'identityGate.retry')}</PrimaryButton><SecondaryButton disabled={busy} onClick={() => { setRecovery(undefined); setMessage(undefined) }}>{t('identityGate.recoveryCancel')}</SecondaryButton></SoftCard></IdentityPage>
  const messageKey = 'identityGate.failed'
  return <IdentityPage embedded={embedded}><section className="identity-gate-hero"><div><span aria-hidden="true">✦</span><h1>{t('identityGate.title')}</h1><p>{t('identityGate.bodyOne')}</p><p>{t('identityGate.bodyTwo')}</p></div></section><SoftCard className="identity-gate-card" tone="purple"><p className="identity-gate-card__privacy">{t('identityGate.privacy')}</p><PrimaryButton className="identity-gate-card__apple" disabled={busy} aria-busy={busy} onClick={() => void continueWithApple()}><img className="identity-gate-card__apple-logo" src="/assets/auth/apple-logo-white.png" alt="" /><span>{busy ? t('identityGate.loading') : t('identityGate.continue')}</span></PrimaryButton>{message ? <p role="alert" className="identity-gate-card__message">{t(messageKey)}</p> : null}<p className="identity-gate-card__single">{t('identityGate.notRequired')}</p><SecondaryButton onClick={() => navigate(backTo)}>{t('identityGate.notNow')}</SecondaryButton></SoftCard></IdentityPage>
}

/**
 * Shared durable-identity gate for a relationship-establishing action.
 * Routes stay browseable; callers mount this only after the user chooses a
 * real invite, claim, or paired action.
 */
function IdentityLoading({ embedded }: { embedded: boolean }) {
  const { t } = useI18n()
  return <IdentityPage embedded={embedded} busy><SoftCard className="identity-gate-status" tone="purple"><h1>{t('identityGate.preparingTitle')}</h1><p>{t('identityGate.preparingBody')}</p></SoftCard></IdentityPage>
}

function IdentityInitializationError({ onRetry, embedded }: { onRetry: () => void; embedded: boolean }) {
  const { t } = useI18n()
  return <IdentityPage embedded={embedded}><SoftCard className="identity-gate-status" tone="purple"><h1>{t('identityGate.initializeErrorTitle')}</h1><p>{t('identityGate.initializeErrorBody')}</p><PrimaryButton onClick={onRetry}>{t('identityGate.retry')}</PrimaryButton></SoftCard></IdentityPage>
}

export const IDENTITY_BOOTSTRAP_TIMEOUT_MS = 12_000

export function PairedFeatureIdentityBoundary({ children, backTo = '/our', embedded = false }: { children: ReactNode; backTo?: string; embedded?: boolean }) {
  const [user, setUser] = useState<User | null | undefined>(() => isFirebaseRuntimeConfigured() ? undefined : null)
  const [services, setServices] = useState<FirebaseIdentityServices>()
  const [initialization, setInitialization] = useState<'loading' | 'ready' | 'error'>(() => isFirebaseRuntimeConfigured() ? 'loading' : 'ready')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!isFirebaseRuntimeConfigured()) return
    let active = true
    let unsubscribe: (() => void) | undefined
    let pendingBootstrap: Promise<{ uid: string; isAnonymous: boolean }> | undefined
    let releaseStalledBootstrap: ((pending: Promise<{ uid: string; isAnonymous: boolean }>) => void) | undefined
    const finishWithError = (releasePendingBootstrap = false) => {
      if (!active) return
      active = false
      if (timeoutId) clearTimeout(timeoutId)
      if (releasePendingBootstrap && pendingBootstrap && releaseStalledBootstrap) releaseStalledBootstrap(pendingBootstrap)
      unsubscribe?.(); unsubscribe = undefined
      setServices(undefined); setUser(undefined); setInitialization('error')
    }
    const timeoutId = setTimeout(() => finishWithError(true), IDENTITY_BOOTSTRAP_TIMEOUT_MS)
    setInitialization('loading'); setServices(undefined); setUser(undefined)
    void Promise.all([
      import('../../lib/firebase/firebaseAuth'),
      import('../../lib/firebase/durableIdentity'),
      import('../../lib/firebase/userBootstrap'),
      import('firebase/auth'),
    ]).then(async ([{ firebaseAuth }, durableIdentity, { bootstrapAnonymousUser, releaseStalledAnonymousBootstrap }, { onAuthStateChanged }]) => {
      if (!active) return
      const loaded: FirebaseIdentityServices = { auth: firebaseAuth, getDurableIdentityState: durableIdentity.getDurableIdentityState, upgradeAnonymousUserWithApple: durableIdentity.upgradeAnonymousUserWithApple, recoverExistingAppleIdentity: durableIdentity.recoverExistingAppleIdentity, onAuthStateChanged }
      unsubscribe = loaded.onAuthStateChanged(loaded.auth, (nextUser) => { if (active) setUser(nextUser) })
      releaseStalledBootstrap = releaseStalledAnonymousBootstrap
      pendingBootstrap = bootstrapAnonymousUser()
      await pendingBootstrap
      if (!active || !loaded.auth.currentUser) throw new Error('firebase-user-unavailable')
      if (timeoutId) clearTimeout(timeoutId)
      setServices(loaded); setUser(loaded.auth.currentUser); setInitialization('ready')
    }).catch(() => finishWithError())
    return () => { active = false; if (timeoutId) clearTimeout(timeoutId); unsubscribe?.() }
  }, [attempt])
  if (!isFirebaseRuntimeConfigured()) return <>{children}</>
  if (initialization === 'loading') return <IdentityLoading embedded={embedded} />
  if (initialization === 'error' || user === undefined || !services) return <IdentityInitializationError embedded={embedded} onRetry={() => setAttempt((current) => current + 1)} />
  if (services.getDurableIdentityState(user).hasAppleIdentity) return <>{children}</>
  return <AppleIdentityGate embedded={embedded} backTo={backTo} upgrade={services.upgradeAnonymousUserWithApple} recover={services.recoverExistingAppleIdentity} onResult={(result) => { if (result.status === 'linked' || result.status === 'already-linked') setUser(services.auth.currentUser) }} onRecoveryResult={(result) => { if (result.status === 'recovered') setUser(services.auth.currentUser) }} />
}
