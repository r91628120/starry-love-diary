import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader, PrimaryButton, SecondaryButton, SoftCard } from '../components'
import { useI18n } from '../i18n/I18nContext'
import type { TranslationKey } from '../i18n/messages'
import { featuredStarrySkyTopic, starrySkyCategoryIds } from '../features/our/starrySkyTopics'
import { usePersistence } from '../data/PersistenceStateContext'
import { shareStarrySkyTopic } from '../services/starrySkyTopicShare'
import { createHeartTalkInvitation, getHeartTalkState, type HeartTalkInvitation } from '../lib/firebase/heartTalkClient'
import '../features/our/our.css'

const categoryIcons = ['🤍','💞','👁️','🏠','🌱','👥','☀️','💼','🍃','🌈','✈️','🌙']

export function StarrySkyPage() {
  const { t, locale } = useI18n()
  const navigate = useNavigate(), location = useLocation()
  const persistence = usePersistence()
  const [feedback, setFeedback] = useState<string>((location.state as { pairingGuidance?: boolean } | null)?.pairingGuidance ? t('our.starrySky.chooseUnpaired') : '')
  const [active, setActive] = useState<HeartTalkInvitation>()
  const [customTopic, setCustomTopic] = useState('')
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [customStart, setCustomStart] = useState('20:00')
  const [customEnd, setCustomEnd] = useState('20:30')
  const [customSending, setCustomSending] = useState(false)
  const shareFeatured = async () => { const result = await shareStarrySkyTopic(featuredStarrySkyTopic.text, locale); setFeedback(result === 'copied' ? t('our.starrySky.copied') : result === 'error' ? t('our.starrySky.shareError') : '') }
  useEffect(() => { void getHeartTalkState().then((state) => setActive(state.invitations.find((item) => item.status === 'accepted') ?? state.invitations.find((item) => item.status === 'pending'))).catch(() => undefined) }, [])
  const sendCustom = async () => { const text = customTopic.trim(); if (!text || text.length > 1000 || customStart >= customEnd || customSending) return; setCustomSending(true); try { await createHeartTalkInvitation({ topicType: 'custom', customTopicText: text, scheduledLocalDate: customDate, startTime: customStart, endTime: customEnd }); const state = await getHeartTalkState(); setActive(state.invitations.find((item) => item.status === 'accepted') ?? state.invitations.find((item) => item.status === 'pending')); setCustomTopic('') } catch { setFeedback(t('our.starrySky.invitePreviewBody')) } finally { setCustomSending(false) } }

  return <div className="page our-page starry-sky-page"><PageHeader titleKey="our.starrySky.title" variant="secondary" backFallback="/our" /><main className="our-page__content starry-sky-page__content">
    <section className="starry-sky-hero"><div><p>{t('our.starrySky.heroCopy')}</p></div></section>
    <SoftCard className="starry-sky-count" tone="purple"><span>{t('our.starrySky.count', { count: persistence?.heartTalkCount ?? 0 })}</span><SecondaryButton onClick={() => navigate('/our/starry-sky/history')}>{t('our.starrySky.historyEntry')}</SecondaryButton></SoftCard>
    {active ? <SoftCard className="starry-sky-count" tone="purple"><p>{active.status === 'accepted' ? t('our.starrySky.sessionAcceptedTitle') : active.viewerRole === 'recipient' ? t('our.starrySky.incomingTitle') : t('our.starrySky.invitePreviewTitle')}</p><PrimaryButton onClick={() => navigate(active.status === 'accepted' ? `/our/starry-sky/session-preview?invitation=${encodeURIComponent(active.invitationId)}` : active.viewerRole === 'recipient' ? '/our/starry-sky/invitation-preview' : `/our/starry-sky/session-preview?invitation=${encodeURIComponent(active.invitationId)}`)}>{active.status === 'accepted' ? t('our.starrySky.incomingViewSession') : active.viewerRole === 'recipient' ? t('our.starrySky.incomingTitle') : t('our.starrySky.invitePreviewTitle')}</PrimaryButton></SoftCard> : null}
    <section className="starry-sky-section starry-sky-discovery"><h2>{t('our.starrySky.tonightTitle')}</h2><p>{t('our.starrySky.librarySubtitle')}</p><div className="starry-sky-category-grid">{starrySkyCategoryIds.map((id, index) => <button type="button" key={id} onClick={() => navigate('/our/starry-sky/topics', { state: { categoryId: id } })}><i aria-hidden="true">{categoryIcons[index]}</i><b>{id}</b><span>{t(`our.starrySky.category.${id}` as TranslationKey)}</span></button>)}</div></section>
    <SoftCard className="starry-sky-custom"><h2>{t('our.starrySky.custom')}</h2><p>{t('our.starrySky.customUnpaired')}</p><input aria-label={t('our.starrySky.custom')} value={customTopic} maxLength={1000} onChange={(event) => setCustomTopic(event.target.value)} /><label>{t('our.starrySky.inviteDateLabel')}<input aria-label={t('our.starrySky.inviteDateLabel')} type="date" value={customDate} onChange={(event) => setCustomDate(event.target.value)} /></label><label>{t('our.starrySky.inviteStartTime')}<input aria-label={t('our.starrySky.inviteStartTime')} type="time" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></label><label>{t('our.starrySky.inviteEndTime')}<input aria-label={t('our.starrySky.inviteEndTime')} type="time" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></label><SecondaryButton disabled={!customTopic.trim() || customStart >= customEnd || customSending} onClick={() => void sendCustom()}>{t('our.starrySky.invite')}</SecondaryButton></SoftCard>
    <SoftCard className="starry-sky-panel starry-sky-pairing" tone="purple">
      <img className="starry-sky-pairing__cats" src="/assets/starry-sky/starry-sky-pair-cats-card.png" alt="" />
      <h2>{t('our.starrySky.pairingTitle')}</h2><div className="starry-sky-panel__actions"><PrimaryButton onClick={() => navigate('/our/pair')}>{t('our.starrySky.invite')}</PrimaryButton><SecondaryButton onClick={() => navigate('/our/pair')}>{t('our.starrySky.code')}</SecondaryButton></div>
    </SoftCard>
    <section className="starry-sky-featured-section"><h2>{t('our.starrySky.featuredTitle')}</h2><SoftCard className="starry-sky-featured" tone="purple"><span>{featuredStarrySkyTopic.id}</span><p lang="zh-TW">{featuredStarrySkyTopic.text}</p><div><SecondaryButton onClick={() => void shareFeatured()}>{t('our.starrySky.share')}</SecondaryButton><PrimaryButton onClick={() => navigate('/our/starry-sky/topics')}>{t('our.starrySky.browse')}</PrimaryButton></div></SoftCard></section>
    {feedback ? <p className="mock-feedback" aria-live="polite">{feedback}</p> : null}
  </main></div>
}
