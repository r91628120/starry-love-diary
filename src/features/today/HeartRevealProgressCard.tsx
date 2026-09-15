import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog, HeartRevealPhotoVisual, PrimaryButton, SecondaryButton, SectionHeader, SoftCard } from '../../components'
import { SparkleIcon } from '../../components/icons'
import { useI18n } from '../../i18n/I18nContext'
import { usePersistence } from '../../data/PersistenceStateContext'
import { DEFAULT_PHOTO_PLACEMENT } from '../../services/photoPlacement'
import { usePhotoObjectUrl } from '../../services/usePhotoObjectUrl'
import { downloadHeartCardImage, shareHeartCardImage } from '../../services/heartCardShare'
import { renderHeartRevealCardPng } from '../../services/heartRevealCardRenderer'
import type { TranslationKey } from '../../i18n/messages'
import type { HeartRevealTextPlacement } from '../../data/types'

const TOTAL_PROGRESS = 7
type Stage = 'idle' | 'select' | 'confirm' | 'generated'
const TEXT_PLACEMENTS: HeartRevealTextPlacement[] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']
const DEFAULT_TEXT_PLACEMENT: HeartRevealTextPlacement = 'bottom-center'

export function HeartRevealProgressCard() {
  const { locale, t } = useI18n()
  const persistence = usePersistence()
  const [stage, setStage] = useState<Stage>('idle')
  const [selectedPhraseId, setSelectedPhraseId] = useState<string>()
  const [card, setCard] = useState<Blob>()
  const [cardUrl, setCardUrl] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [feedbackKey, setFeedbackKey] = useState<TranslationKey>()
  const [textPlacement, setTextPlacement] = useState<HeartRevealTextPlacement>(DEFAULT_TEXT_PLACEMENT)
  const renderedCardSignature = useRef<string | undefined>(undefined)
  const numberFormat = new Intl.NumberFormat(locale)
  const project = persistence?.activeHeartRevealProject
  const currentProgress = Math.max(0, Math.min(TOTAL_PROGRESS, project?.progressCount ?? 0))
  const photoUrl = usePhotoObjectUrl(persistence?.repositories.photos, project?.photoAssetId, 'master')
  const selectedPhrase = persistence?.heartPhrases.find((phrase) => phrase.id === selectedPhraseId)
  const placementKey = project?.photoPlacement ? `${project.photoPlacement.positionX}:${project.photoPlacement.positionY}:${project.photoPlacement.zoom}` : 'default'
  const cardSignature = `${locale}:${selectedPhrase?.id ?? ''}:${selectedPhrase?.content ?? ''}:${photoUrl ?? ''}:${placementKey}:${textPlacement}`

  useEffect(() => {
    if (!card) { setCardUrl(undefined); return }
    const url = URL.createObjectURL(card); setCardUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [card])
  useEffect(() => { if (currentProgress < TOTAL_PROGRESS && stage !== 'idle') { setStage('idle'); setSelectedPhraseId(undefined); setCard(undefined) } }, [currentProgress, stage])
  useEffect(() => { setTextPlacement(project?.textPlacement ?? DEFAULT_TEXT_PLACEMENT) }, [project?.textPlacement])
  useEffect(() => {
    if ((stage !== 'confirm' && stage !== 'generated') || !selectedPhrase || renderedCardSignature.current === cardSignature) return
    let active = true
    void renderHeartRevealCardPng(selectedPhrase.content, { locale }, photoUrl, project?.photoPlacement, textPlacement)
      .then((next) => { if (active) { renderedCardSignature.current = cardSignature; setCard(next) } })
      .catch(() => { if (active) setFeedbackKey('heartCard.generateError') })
    return () => { active = false }
  }, [cardSignature, locale, photoUrl, project?.photoPlacement, selectedPhrase, stage, textPlacement])

  const generate = async () => {
    if (!selectedPhrase) return
    setBusy(true); setFeedbackKey(undefined)
    try { const next = await renderHeartRevealCardPng(selectedPhrase.content, { locale }, photoUrl, project?.photoPlacement, textPlacement); renderedCardSignature.current = cardSignature; setCard(next); setStage('generated') }
    catch { setFeedbackKey('heartCard.generateError') } finally { setBusy(false) }
  }
  const share = async () => {
    if (!card || busy) return
    setBusy(true); setFeedbackKey(undefined)
    try { const result = await shareHeartCardImage(card); if (result === 'unsupported') { downloadHeartCardImage(card); setFeedbackKey('heartRevealCycle.shareUnsupported') } else if (result === 'error') setFeedbackKey('heartRevealCycle.shareError') }
    catch { setFeedbackKey('heartRevealCycle.shareError') } finally { setBusy(false) }
  }
  const finishCycle = async () => {
    if (!persistence || busy) return
    setBusy(true); setConfirmReset(false)
    try { await persistence.completeHeartRevealCycle(); setStage('idle'); setCard(undefined); setSelectedPhraseId(undefined); setFeedbackKey('heartRevealCycle.nextStarted') }
    finally { setBusy(false) }
  }
  const chooseTextPlacement = (next: HeartRevealTextPlacement) => {
    if (!persistence || !project?.photoAssetId) return
    setTextPlacement(next)
    void persistence.saveHeartRevealTextPlacement(next).catch(() => setFeedbackKey('heartCard.generateError'))
  }
  const placementPicker = project?.photoAssetId && selectedPhrase && (stage === 'confirm' || stage === 'generated') ? <fieldset className="heart-reveal-cycle__text-placement"><legend>{t('heartRevealCycle.textPlacement')}</legend><div role="radiogroup" aria-label={t('heartRevealCycle.textPlacement')}>{TEXT_PLACEMENTS.map((placement) => <button type="button" key={placement} role="radio" aria-checked={placement === textPlacement} className={placement === textPlacement ? 'is-selected' : ''} onClick={() => chooseTextPlacement(placement)}>{t(`heartRevealCycle.placement.${placement}` as TranslationKey)}<span aria-hidden="true">✓</span></button>)}</div></fieldset> : null

  return <SoftCard className="heart-reveal-card" tone="yellow">
    <SectionHeader icon={<SparkleIcon />} title={t('today.heartReveal.title')} />
    <p className="heart-reveal-card__description">{t('today.heartReveal.description')}</p>
    <div className="heart-reveal-card__body"><div className="heart-reveal-card__photo"><HeartRevealPhotoVisual photoUrl={photoUrl} placeholderSrc="/images/heart-reveal-placeholder.svg" placement={project?.photoPlacement ?? DEFAULT_PHOTO_PLACEMENT} alt={t('today.heartReveal.imageAlt')} /><div className="heart-reveal-card__mask" aria-hidden="true">{Array.from({ length: TOTAL_PROGRESS }, (_, index) => <span className={index < currentProgress ? 'is-revealed' : ''} key={index} />)}</div></div><div className="heart-reveal-card__status"><strong>{t('today.heartReveal.progress', { current: numberFormat.format(currentProgress), total: numberFormat.format(TOTAL_PROGRESS) })}</strong>{currentProgress === TOTAL_PROGRESS ? <p>{t('heartRevealCycle.ready')}</p> : <p>{t('heartRevealCycle.writeNext')}</p>}{!project?.photoAssetId ? <a className="button button--secondary" href="/settings/heart-reveal-photo">{t('heartRevealCycle.setNextPhoto')}</a> : null}{currentProgress === TOTAL_PROGRESS && stage === 'idle' ? <PrimaryButton onClick={() => { setStage('select'); setFeedbackKey(undefined) }}>{t('heartRevealCycle.choose')}</PrimaryButton> : null}</div></div>
    {stage === 'select' ? <section className="heart-reveal-cycle" aria-labelledby="heart-reveal-select-title"><h3 id="heart-reveal-select-title">{t('heartRevealCycle.chooseTitle')}</h3><p>{t('heartRevealCycle.chooseHint')}</p><div className="heart-reveal-cycle__phrases" role="radiogroup" aria-label={t('heartRevealCycle.chooseTitle')}>{persistence?.heartPhrases.map((phrase) => <button type="button" key={phrase.id} role="radio" aria-checked={phrase.id === selectedPhraseId} className={phrase.id === selectedPhraseId ? 'is-selected' : ''} onClick={() => setSelectedPhraseId(phrase.id)}>{phrase.content}<span aria-hidden="true">✓</span></button>)}</div><div className="heart-reveal-cycle__actions"><SecondaryButton onClick={() => setStage('idle')}>{t('heartRevealCycle.back')}</SecondaryButton><PrimaryButton disabled={!selectedPhrase} onClick={() => setStage('confirm')}>{t('common.confirm')}</PrimaryButton></div></section> : null}
    {stage === 'confirm' && selectedPhrase ? <section className="heart-reveal-cycle" aria-labelledby="heart-reveal-confirm-title"><h3 id="heart-reveal-confirm-title">{t('heartRevealCycle.confirmTitle')}</h3><blockquote>{selectedPhrase.content}</blockquote>{cardUrl ? <img className="heart-reveal-cycle__preview" src={cardUrl} alt={t('heartCard.previewLabel')} /> : null}{placementPicker}<div className="heart-reveal-cycle__actions"><SecondaryButton onClick={() => setStage('select')}>{t('heartRevealCycle.back')}</SecondaryButton><PrimaryButton disabled={busy} onClick={() => void generate()}>{t('heartRevealCycle.generate')}</PrimaryButton></div></section> : null}
    {stage === 'generated' && cardUrl ? <section className="heart-reveal-cycle heart-reveal-cycle--generated" aria-live="polite"><h3>{t('heartRevealCycle.generated')}</h3><img className="heart-reveal-cycle__preview" src={cardUrl} alt={t('heartCard.previewLabel')} />{placementPicker}<div className="heart-reveal-cycle__actions"><SecondaryButton onClick={() => { setCard(undefined); setStage('confirm') }}>{t('heartCard.backToEdit')}</SecondaryButton><SecondaryButton onClick={() => card && downloadHeartCardImage(card)}>{t('heartCard.saveImage')}</SecondaryButton><PrimaryButton disabled={busy} onClick={() => void share()}>{t('heartCard.shareImage')}</PrimaryButton><PrimaryButton disabled={busy} onClick={() => setConfirmReset(true)}>{t('heartRevealCycle.finish')}</PrimaryButton></div></section> : null}
    {feedbackKey ? <p className="mock-feedback" aria-live="polite">{t(feedbackKey)}</p> : null}
    <ConfirmDialog open={confirmReset} title={t('heartRevealCycle.resetTitle')} description={t('heartRevealCycle.resetBody')} confirmLabel={t('heartRevealCycle.startNext')} onCancel={() => setConfirmReset(false)} onConfirm={() => void finishCycle()} />
  </SoftCard>
}
