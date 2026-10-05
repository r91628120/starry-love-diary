import { useEffect, useState } from 'react'
import { PageHeader, PrimaryButton, SecondaryButton, SoftCard } from '../components'
import { PairedFeatureIdentityBoundary } from '../features/our/PairedFeatureIdentityBoundary'
import { useI18n } from '../i18n/I18nContext'
import { claimPairInvite, createPairInvite, loadPairState, resolvePairInvite, type PairErrorCode, type PairState } from '../lib/firebase/pairClient'

function PairScreen() {
  const { t } = useI18n()
  const [state, setState] = useState<PairState | undefined>()
  const [invite, setInvite] = useState('')
  const [created, setCreated] = useState<string>()
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState<PairErrorCode>()
  const refresh = () => void loadPairState().then(setState).catch(() => { setState(null); setError('unexpected') })
  useEffect(refresh, [])
  const message = (code: PairErrorCode) => t(`pair.${code === 'durable-identity-required' ? 'identity' : code === 'unauthenticated' ? 'login' : code === 'unexpected' ? 'error' : code.replace('invite-', '')}` as never)

  if (state === undefined) return <div className="page our-page" aria-busy="true" />

  return <div className="page our-page">
    <PageHeader titleKey="pair.title" variant="secondary" backFallback="/our" />
    <main className="our-page__content">
      <SoftCard className="pair-card" tone="purple">
        {state ? <section className="pair-card__active"><h2>{t('pair.paired')}</h2><SecondaryButton onClick={refresh}>{t('pair.refresh')}</SecondaryButton></section> : <>
          <section className="pair-card__section pair-card__section--invite">
            <header><h2>{t('pair.invitePartnerTitle')}</h2><p>{t('pair.invitePartnerBody')}</p></header>
            {created ? <div className="pair-card__created"><h3>{t('pair.created')}</h3><code>{created}</code><p>{t('pair.expires')}</p><SecondaryButton onClick={() => void navigator.clipboard?.writeText(created)}>{t('pair.copy')}</SecondaryButton></div> : <PrimaryButton onClick={() => void createPairInvite().then(({ inviteId }) => setCreated(inviteId)).catch((caught) => setError(caught.message))}>{t('pair.create')}</PrimaryButton>}
          </section>
          <section className="pair-card__section pair-card__section--receive">
            <header><h2>{t('pair.receivedTitle')}</h2><p>{t('pair.receivedBody')}</p></header>
            <label>{t('pair.input')}<input value={invite} onChange={(event) => { setInvite(event.target.value); setPreview(false); setError(undefined) }} /></label>
            {!preview ? <PrimaryButton disabled={!invite.trim()} onClick={() => void resolvePairInvite(invite.trim()).then(() => setPreview(true)).catch((caught) => setError(caught.message))}>{t('pair.view')}</PrimaryButton> : <section className="pair-card__preview"><p>{t('pair.inviteBody')}</p><p>{t('pair.privacy')}</p><PrimaryButton onClick={() => void claimPairInvite(invite.trim()).then(refresh).catch((caught) => setError(caught.message))}>{t('pair.accept')}</PrimaryButton><SecondaryButton onClick={() => setPreview(false)}>{t('pair.later')}</SecondaryButton></section>}
          </section>
        </>}
        {error ? <p role="alert" className="pair-card__error">{message(error)}</p> : null}
      </SoftCard>
    </main>
  </div>
}

export function PairPage() { return <PairedFeatureIdentityBoundary backTo="/our/pair"><PairScreen /></PairedFeatureIdentityBoundary> }
