import { useEffect, useState } from 'react'
import { PageHeader, PrimaryButton, SecondaryButton, SoftCard } from '../components'
import { PairedFeatureIdentityBoundary } from '../features/our/PairedFeatureIdentityBoundary'
import { LoveDeliveryOverlay } from '../features/our/LoveDeliveryOverlay'
import { useI18n } from '../i18n/I18nContext'
import { claimPairInvite, createPairInvite, endPair, loadPairState, resolvePairInvite, type PairErrorCode, type PairState } from '../lib/firebase/pairClient'
import { PairClaimDiagnostic } from '../lib/firebase/pairClaimDiagnostic'
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
  const [diagnostic, setDiagnostic] = useState<string>()
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [ending, setEnding] = useState(false)
  const refresh = (trace?: PairClaimDiagnostic) => void loadPairState(trace).then((nextState) => { trace?.reconciliationSucceeded(); setState(nextState) }).catch((caught) => { trace?.reconciliationFailed(caught); setState(null); setError('unexpected'); if (trace) setDiagnostic(trace.summary()) })
  useEffect(refresh, [])
  useEffect(() => {
    if (!confirmEnd) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [confirmEnd])
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
  const confirmEnding = () => {
    setEnding(true); setError(undefined)
    void endPair().then(() => { setConfirmEnd(false); refresh() }).catch((caught) => setError(caught.message)).finally(() => setEnding(false))
  }

  if (state === undefined) return <main className="our-page__content" aria-busy="true"><SoftCard className="identity-gate-status" tone="purple"><h2>{t('pair.loadingTitle')}</h2><p>{t('pair.loadingBody')}</p></SoftCard></main>

  return <main className="our-page__content">
      <SoftCard className="pair-card" tone="purple">
        {state ? <section className="pair-card__active"><h2>{t('pair.paired')}</h2><SecondaryButton onClick={() => refresh()}>{t('pair.refresh')}</SecondaryButton><SecondaryButton onClick={() => setConfirmEnd(true)}>{t('pair.end')}</SecondaryButton></section> : <>
          <section className="pair-card__section pair-card__section--invite">
            <header><h2>{t('pair.invitePartnerTitle')}</h2><p>{t('pair.invitePartnerBody')}</p></header>
            {created ? <div className="pair-card__created"><h3>{t('pair.created')}</h3><code>{created}</code><p>{t('pair.expires')}</p><div className="pair-card__actions"><PrimaryButton onClick={() => void shareInvitation()}>{t('pair.share')}</PrimaryButton><SecondaryButton onClick={() => void copyInvitation()}>{t('pair.copy')}</SecondaryButton></div>{shareFeedback ? <p className="mock-feedback" aria-live="polite">{shareFeedback}</p> : null}</div> : <PrimaryButton onClick={() => void createPairInvite().then(({ inviteId }) => { setCreated(inviteId); setShareFeedback(undefined) }).catch((caught) => setError(caught.message))}>{t('pair.create')}</PrimaryButton>}
          </section>
          <section className="pair-card__section pair-card__section--receive">
            <header><h2>{t('pair.receivedTitle')}</h2><p>{t('pair.receivedBody')}</p></header>
            <label>{t('pair.input')}<input value={invite} onChange={(event) => { setInvite(event.target.value); setPreview(false); setError(undefined) }} /></label>
            {!preview ? <PrimaryButton disabled={!invite.trim()} onClick={() => void resolvePairInvite(invite.trim()).then(() => setPreview(true)).catch((caught) => setError(caught.message))}>{t('pair.view')}</PrimaryButton> : <section className="pair-card__preview"><p>{t('pair.inviteBody')}</p><p>{t('pair.privacy')}</p><PrimaryButton onClick={() => { const trace = new PairClaimDiagnostic(); setDiagnostic(undefined); void claimPairInvite(invite.trim(), trace).then(() => refresh(trace)).catch((caught) => { setError(caught.message); setDiagnostic(trace.summary()) }) }}>{t('pair.accept')}</PrimaryButton><SecondaryButton onClick={() => setPreview(false)}>{t('pair.later')}</SecondaryButton></section>}
          </section>
        </>}
        {error ? <p role="alert" className="pair-card__error">{message(error)}</p> : null}
        {error && diagnostic ? <pre className="pair-card__diagnostic" aria-label="Pair claim diagnostic">{diagnostic}</pre> : null}
      </SoftCard>
      {confirmEnd ? <LoveDeliveryOverlay><section className="pair-card__end-dialog" role="dialog" aria-modal="true" aria-labelledby="pair-end-title"><h2 id="pair-end-title">{t('pair.endConfirmTitle')}</h2><p>{t('pair.endConfirmBody')}</p><footer><SecondaryButton disabled={ending} onClick={() => setConfirmEnd(false)}>{t('pair.endCancel')}</SecondaryButton><PrimaryButton className="pair-card__end-confirm" disabled={ending} aria-busy={ending} onClick={confirmEnding}>{ending ? t('pair.ending') : t('pair.endConfirm')}</PrimaryButton></footer></section></LoveDeliveryOverlay> : null}
    </main>
}

export function PairPage() {
  return <div className="page our-page pair-page">
    <PageHeader titleKey="pair.title" variant="secondary" backFallback="/our" />
    <PairedFeatureIdentityBoundary embedded backTo="/our"><PairScreen /></PairedFeatureIdentityBoundary>
  </div>
}
