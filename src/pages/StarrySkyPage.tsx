import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader, PrimaryButton, SecondaryButton, SoftCard } from '../components'
import { useI18n } from '../i18n/I18nContext'
import type { TranslationKey } from '../i18n/messages'
import { featuredStarrySkyTopic, starrySkyCategoryIds } from '../features/our/starrySkyTopics'
import { starrySkyHistoryDemoRecords } from '../features/our/starrySkyHistoryDemo'
import { shareStarrySkyTopic } from '../services/starrySkyTopicShare'
import '../features/our/our.css'

type StarrySkyView = 'unpaired' | 'invite' | 'enter-code'
const categoryIcons = ['🤍','💞','👁️','🏠','🌱','👥','☀️','💼','🍃','🌈','✈️','🌙']

export function StarrySkyPage() {
  const { t } = useI18n()
  const navigate = useNavigate(), location = useLocation()
  const [view, setView] = useState<StarrySkyView>('unpaired')
  const [code, setCode] = useState('')
  const [feedback, setFeedback] = useState<string>((location.state as { pairingGuidance?: boolean } | null)?.pairingGuidance ? t('our.starrySky.chooseUnpaired') : '')
  const reset = () => { setView('unpaired'); setCode('') }
  const shareFeatured = async () => { const result = await shareStarrySkyTopic(featuredStarrySkyTopic.text); setFeedback(result === 'copied' ? t('our.starrySky.copied') : result === 'error' ? t('our.starrySky.shareError') : '') }

  return <div className="page our-page starry-sky-page"><PageHeader titleKey="our.starrySky.title" variant="secondary" backFallback="/our" /><main className="our-page__content starry-sky-page__content">
    <section className="starry-sky-hero"><div><p>{t('our.starrySky.heroCopy')}</p></div></section>
    <SoftCard className="starry-sky-count" tone="purple"><span>{t('our.starrySky.count', { count: starrySkyHistoryDemoRecords.length })}</span><SecondaryButton onClick={() => navigate('/our/starry-sky/history-preview')}>{t('our.starrySky.historyEntry')}</SecondaryButton></SoftCard>
    <section className="starry-sky-section starry-sky-discovery"><h2>{t('our.starrySky.tonightTitle')}</h2><p>{t('our.starrySky.librarySubtitle')}</p><div className="starry-sky-category-grid">{starrySkyCategoryIds.map((id, index) => <button type="button" key={id} onClick={() => navigate('/our/starry-sky/topics', { state: { categoryId: id } })}><i aria-hidden="true">{categoryIcons[index]}</i><b>{id}</b><span>{t(`our.starrySky.category.${id}` as TranslationKey)}</span></button>)}</div></section>
    <SoftCard className="starry-sky-custom"><h2>{t('our.starrySky.custom')}</h2><p>{t('our.starrySky.customUnpaired')}</p><SecondaryButton onClick={() => setFeedback(t('our.starrySky.customUnpaired'))}>{t('our.starrySky.invite')}</SecondaryButton></SoftCard>
    <SoftCard className="starry-sky-panel starry-sky-pairing" tone="purple">
      <img className="starry-sky-pairing__cats" src="/assets/starry-sky/starry-sky-pair-cats-card.png" alt="" />
      {view === 'unpaired' ? <><h2>{t('our.starrySky.pairingTitle')}</h2><p>{t('our.starrySky.pairingPlaceholder')}</p><div className="starry-sky-panel__actions"><PrimaryButton onClick={() => setView('invite')}>{t('our.starrySky.invite')}</PrimaryButton><SecondaryButton onClick={() => setView('enter-code')}>{t('our.starrySky.code')}</SecondaryButton></div></> : null}
      {view === 'invite' ? <><h2>{t('our.starrySky.invite')}</h2><p>{t('our.starrySky.pairingPlaceholder')}</p><SecondaryButton onClick={reset}>{t('common.cancel')}</SecondaryButton></> : null}
      {view === 'enter-code' ? <><h2>{t('our.starrySky.code')}</h2><p>{t('our.starrySky.pairingPlaceholder')}</p><label className="starry-sky-panel__code-label" htmlFor="starry-sky-pairing-code">{t('our.starrySky.code')}</label><input id="starry-sky-pairing-code" className="starry-sky-panel__code" type="text" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/gu, '').slice(0, 6))} /><SecondaryButton onClick={reset}>{t('common.cancel')}</SecondaryButton></> : null}
    </SoftCard>
    <section className="starry-sky-featured-section"><h2>{t('our.starrySky.featuredTitle')}</h2><SoftCard className="starry-sky-featured" tone="purple"><span>{featuredStarrySkyTopic.id}</span><p lang="zh-TW">{featuredStarrySkyTopic.text}</p><div><SecondaryButton onClick={() => void shareFeatured()}>{t('our.starrySky.share')}</SecondaryButton><PrimaryButton onClick={() => navigate('/our/starry-sky/topics')}>{t('our.starrySky.browse')}</PrimaryButton></div></SoftCard></section>
    {feedback ? <p className="mock-feedback" aria-live="polite">{feedback}</p> : null}
  </main></div>
}
