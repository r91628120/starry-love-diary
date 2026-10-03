import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, PrimaryButton, SecondaryButton, SoftCard } from '../components'
import { starrySkyTopicById } from '../features/our/starrySkyTopics'
import { useI18n } from '../i18n/I18nContext'
import '../features/our/our.css'

type HeartTalkInvitationPreview = {
  topicId: string
  date: string
  startTime: string
  endTime: string
}

const previewInvitation: HeartTalkInvitationPreview = {
  topicId: 'Q002',
  date: '2026-12-22',
  startTime: '20:00',
  endTime: '20:30',
}

export function StarrySkyIncomingInvitationPage() {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const [decision, setDecision] = useState<'accepted' | 'declined'>()
  const topic = starrySkyTopicById(previewInvitation.topicId)
  const date = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${previewInvitation.date}T00:00:00`))

  if (!topic) return null

  return <div className="page our-page starry-sky-page starry-sky-incoming-page">
    <PageHeader titleKey="our.starrySky.incomingTitle" variant="secondary" backFallback="/our/starry-sky" />
    <main className="our-page__content starry-sky-page__content">
      <section className="starry-sky-incoming-hero">
        <img src="/assets/starry-sky/starry-sky-hero-bg.png" alt="" />
        <div><h2>{t('our.starrySky.incomingTitle')}</h2><p>{t('our.starrySky.incomingHeroCopy')}</p></div>
      </section>
      <SoftCard className="starry-sky-incoming-card" tone="purple"><p className="starry-sky-incoming-card__inviter">{t('our.starrySky.incomingInviter')}</p></SoftCard>
      <SoftCard className="starry-sky-incoming-card">
        <h2>{t('our.starrySky.incomingTopic')}</h2>
        <div className="starry-sky-incoming-topic"><span>{topic.id}</span><p lang="zh-TW">{topic.text}</p></div>
      </SoftCard>
      <SoftCard className="starry-sky-incoming-card">
        <h2>{t('our.starrySky.incomingSchedule')}</h2>
        <dl className="starry-sky-incoming-schedule"><div><dt>{t('our.starrySky.incomingDate')}</dt><dd>{date}</dd></div><div><dt>{t('our.starrySky.incomingTime')}</dt><dd>{previewInvitation.startTime}–{previewInvitation.endTime}</dd></div></dl>
        <p className="starry-sky-incoming-card__expiry">{t('our.starrySky.incomingExpiry')}</p>
        <p className="starry-sky-incoming-card__prototype">{t('our.starrySky.incomingPrototype')}</p>
      </SoftCard>
      <section className="starry-sky-incoming-actions" aria-label={t('our.starrySky.incomingTitle')}>
        <PrimaryButton disabled={Boolean(decision)} onClick={() => setDecision('accepted')}>{t('our.starrySky.incomingAccept')}</PrimaryButton>
        <SecondaryButton disabled={Boolean(decision)} onClick={() => setDecision('declined')}>{t('our.starrySky.incomingDecline')}</SecondaryButton>
      </section>
      {decision ? <SoftCard className="starry-sky-incoming-result" tone={decision === 'accepted' ? 'pink' : 'purple'} aria-live="polite"><h2>{t(decision === 'accepted' ? 'our.starrySky.incomingAcceptedTitle' : 'our.starrySky.incomingDeclinedTitle')}</h2><p>{t(decision === 'accepted' ? 'our.starrySky.incomingAcceptedBody' : 'our.starrySky.incomingDeclinedBody')}</p>{decision === 'accepted' ? <SecondaryButton onClick={() => navigate('/our/starry-sky/session-preview')}>{t('our.starrySky.incomingViewSession')}</SecondaryButton> : null}</SoftCard> : null}
    </main>
  </div>
}
