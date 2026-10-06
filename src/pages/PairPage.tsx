import { useEffect, useState } from 'react'
import { PageHeader, PrimaryButton, SecondaryButton, SoftCard } from '../components'
import { PairedFeatureIdentityBoundary } from '../features/our/PairedFeatureIdentityBoundary'
import { useI18n } from '../i18n/I18nContext'
import { claimPairInvite, createPairInvite, loadPairState, resolvePairInvite, type PairErrorCode, type PairState } from '../lib/firebase/pairClient'
import { shareNativeText } from '../services/nativeTextShare'
import { copyText } from '../services/shareText'

function PairScreen() {
  const { t } = useI18n()
  const [state, setState] = useState<PairState | undefined>()
  const [invite, setInvite] = useState('')
  const [created, setCreated] = useState<string>()
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState<PairErrorCode>()
  const [shareFeedback, setShareFeedback] = useState<string>()
  const refresh = () => void loadPairState().then(setState).catch(() => { setState(null); setError('unexpected') })
  useEffect(refresh, [])
  const message = (code: PairErrorCode) => t(`pair.${code === 'durable-identity-required' ? 'identity' : code === 'unauthenticated' ? 'login' : code === 'unexpected' ? 'error' : code.replace('invite-', '')}` as never)
  const invitationMessage = created ? t('pair.shareMessage', { inviteId: created }) : ''
  const shareInvitation = async () => {
    const result = await shareNativeText(invitationMessage, t('pair.shareTitle'))
    setShareFeedback(result === 'copied' ? t('pair.copied') : result === 'error' || result === 'pending' ? t('pair.shareError') : undefined)
  }
  const copyInvitation = async () => {
    const result = await copyText(invitationMessage)
    setShareFeedback(result === 'copied' ? t('pair.copied') : t('pair.shareError'))
  }

  if (state === undefined) return <main className="our-page__content" aria-busy="true"><SoftCard className="identity-gate-status" tone="purple"><h2>{t('pair.loadingTitle')}</h2><p>{t('pair.loadingBody')}</p></SoftCard></main>

  return <main className="our-page__content">
      <SoftCard className="pair-card" tone="purple">
        {state ? <section className="pair-card__active"><h2>{t('pair.paired')}</h2><SecondaryButton onClick={refresh}>{t('pair.refresh')}</SecondaryButton></section> : <>
          <section className="pair-card__section pair-card__section--invite">
            <header><h2>{t('pair.invitePartnerTitle')}</h2><p>{t('pair.invitePartnerBody')}</p></header>
            {created ? <div className="pair-card__created"><h3>{t('pair.created')}</h3><code>{created}</code><p>{t('pair.expires')}</p><div className="pair-card__actions"><PrimaryButton onClick={() => void shareInvitation()}>{t('pair.share')}</PrimaryButton><SecondaryButton onClick={() => void copyInvitation()}>{t('pair.copy')}</SecondaryButton></div>{shareFeedback ? <p className="mock-feedback" aria-live="polite">{shareFeedback}</p> : null}</div> : <PrimaryButton onClick={() => void createPairInvite().then(({ inviteId }) => { setCreated(inviteId); setShareFeedback(undefined) }).catch((caught) => setError(caught.message))}>{t('pair.create')}</PrimaryButton>}
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
}

export function PairPage() {
  return <div className="page our-page pair-page">
    <PageHeader titleKey="pair.title" variant="secondary" backFallback="/our" />
    <PairedFeatureIdentityBoundary embedded backTo="/our"><PairScreen /></PairedFeatureIdentityBoundary>
  </div>
}
