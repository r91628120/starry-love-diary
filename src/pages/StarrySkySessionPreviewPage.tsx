import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, PrimaryButton, SecondaryButton, SoftCard } from '../components'
import { starrySkyTopicById } from '../features/our/starrySkyTopics'
import { useI18n } from '../i18n/I18nContext'
import '../features/our/our.css'

export type HeartTalkSessionStatus = 'accepted' | 'cancelled' | 'completed'

export type HeartTalkSessionPreview = {
  topicId: string
  date: string
  startTime: string
  endTime: string
  status: HeartTalkSessionStatus
}

const previewSession: Omit<HeartTalkSessionPreview, 'status'> = {
  topicId: 'Q002',
  date: '2026-12-22',
  startTime: '20:00',
  endTime: '20:30',
}

function scheduledTime(date: string, time: string) { return new Date(`${date}T${time}:00`) }

export function StarrySkySessionPreviewPage({ initialStatus, now = new Date() }: { initialStatus?: HeartTalkSessionStatus, now?: Date }) {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const defaultStatus = initialStatus ?? (now >= scheduledTime(previewSession.date, previewSession.endTime) ? 'completed' : 'accepted')
  const [status, setStatus] = useState<HeartTalkSessionStatus>(defaultStatus)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const topic = starrySkyTopicById(previewSession.topicId)
  const start = scheduledTime(previewSession.date, previewSession.startTime)
  const date = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(start)
  const isBeforeStart = now < start

  if (!topic) return null

  const statusTitle = status === 'cancelled' ? t('our.starrySky.sessionCancelledTitle') : status === 'completed' ? t('our.starrySky.sessionCompletedTitle') : t('our.starrySky.sessionAcceptedTitle')
  const statusBody = status === 'cancelled' ? t('our.starrySky.sessionCancelledBody') : status === 'completed' ? t('our.starrySky.sessionCompletedBody') : t('our.starrySky.sessionAcceptedBody')

  return <div className="page our-page starry-sky-page starry-sky-session-page">
    <PageHeader titleKey="our.starrySky.sessionTitle" variant="secondary" backFallback="/our/starry-sky/invitation-preview" />
    <main className="our-page__content starry-sky-page__content">
      <section className="starry-sky-session-hero"><img src="/assets/starry-sky/starry-sky-hero-bg.png" alt="" /><div><h2>{t('our.starrySky.sessionTitle')}</h2><p>{t('our.starrySky.sessionHeroCopy')}</p></div></section>
      <SoftCard className="starry-sky-session-card" tone={status === 'cancelled' ? 'purple' : status === 'completed' ? 'pink' : 'cream'}><h2>{statusTitle}</h2><p>{statusBody}</p>{status === 'accepted' ? <div className="starry-sky-session-card__moment"><strong>{isBeforeStart ? t('our.starrySky.sessionBeforeStartTitle') : t('our.starrySky.sessionDuringTitle')}</strong><span>{isBeforeStart ? t('our.starrySky.sessionBeforeStartBody') : t('our.starrySky.sessionDuringBody')}</span></div> : null}</SoftCard>
      <SoftCard className="starry-sky-session-card"><h2>{t('our.starrySky.sessionTopic')}</h2><div className="starry-sky-session-topic"><span>{topic.id}</span><p lang="zh-TW">{topic.text}</p></div></SoftCard>
      <SoftCard className="starry-sky-session-card"><h2>{t('our.starrySky.sessionSchedule')}</h2><dl className="starry-sky-session-schedule"><div><dt>{t('our.starrySky.sessionDate')}</dt><dd>{date}</dd></div><div><dt>{t('our.starrySky.sessionTime')}</dt><dd>{previewSession.startTime}–{previewSession.endTime}</dd></div></dl></SoftCard>
      <SoftCard className="starry-sky-session-card starry-sky-session-reminder" tone="cream"><p className="starry-sky-conversation-reminder">{t('our.starrySky.sessionExternalConversation')}</p></SoftCard>
      {status === 'accepted' ? <section className="starry-sky-session-actions"><SecondaryButton onClick={() => setConfirmingCancel(true)}>{t('our.starrySky.sessionCancel')}</SecondaryButton></section> : null}
      {status === 'completed' ? <section className="starry-sky-session-actions"><SecondaryButton onClick={() => navigate('/our/starry-sky/history-preview')}>{t('our.starrySky.sessionViewHistory')}</SecondaryButton></section> : null}
      {confirmingCancel ? <div className="starry-sky-session-dialog-backdrop" role="presentation"><section className="starry-sky-session-dialog" role="dialog" aria-modal="true" aria-labelledby="starry-sky-session-cancel-title" onKeyDown={(event) => { if (event.key === 'Escape') setConfirmingCancel(false) }}><h2 id="starry-sky-session-cancel-title">{t('our.starrySky.sessionCancelDialogTitle')}</h2><p>{t('our.starrySky.sessionCancelDialogBody')}</p><footer><SecondaryButton autoFocus onClick={() => setConfirmingCancel(false)}>{t('our.starrySky.sessionCancelKeep')}</SecondaryButton><PrimaryButton onClick={() => { setStatus('cancelled'); setConfirmingCancel(false) }}>{t('our.starrySky.sessionCancelConfirm')}</PrimaryButton></footer></section></div> : null}
    </main>
  </div>
}
