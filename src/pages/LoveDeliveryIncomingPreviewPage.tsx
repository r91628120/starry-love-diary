import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, PrimaryButton, SecondaryButton, SoftCard } from '../components'
import { useI18n } from '../i18n/I18nContext'
import '../features/our/our.css'

const demo = { activity: '一起去餵魚', content: '明天想一起去湖邊走走。', item: '一包魚飼料', topic: '最近有件事想跟你聊聊。', date: '2026-10-05', startTime: '09:30', endTime: '13:00', location: '六堆客家文化村', note: '不見不散喔。' }

export function LoveDeliveryIncomingPreviewPage() {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'pending' | 'accepted' | 'declined'>('pending')
  const date = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${demo.date}T00:00:00`))
  const rows: readonly [string, string][] = [[t('our.loveDelivery.typeLabel'), demo.activity], [t('our.loveDelivery.contentLabel'), demo.content], [t('our.loveDelivery.itemLabel'), demo.item], [t('our.loveDelivery.topicLabel'), demo.topic], [t('our.loveDelivery.dateLabel'), date], [t('our.loveDelivery.previewTime'), `${demo.startTime}–${demo.endTime}`], [t('our.loveDelivery.locationLabel'), demo.location], [t('our.loveDelivery.noteLabel'), demo.note]]
  return <div className="page our-page love-delivery-page love-delivery-incoming-page"><PageHeader titleKey="our.loveDelivery.incomingTitle" variant="secondary" backFallback="/our/love-delivery" /><main className="our-page__content love-delivery-page__content"><section className="love-delivery-hero"><img className="love-delivery-hero__art" src="/assets/love-delivery/love-delivery-hero-cat.png" alt={t('our.loveDelivery.incomingHeroAlt')} /><div className="love-delivery-hero__copy"><h2>{t('our.loveDelivery.incomingHeroTitle')}</h2><p>{t('our.loveDelivery.incomingHeroBody')}</p></div></section><SoftCard className="love-delivery-preview love-delivery-incoming-card"><h2>{t('our.loveDelivery.incomingTitle')}</h2><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{status === 'pending' ? <section className="love-delivery-actions"><SecondaryButton onClick={() => setStatus('declined')}>{t('our.loveDelivery.decline')}</SecondaryButton><PrimaryButton onClick={() => setStatus('accepted')}>{t('our.loveDelivery.accept')}</PrimaryButton></section> : <SoftCard className="love-delivery-incoming-result" tone={status === 'accepted' ? 'pink' : 'cream'} role="status"><h3>{t(status === 'accepted' ? 'our.loveDelivery.acceptedTitle' : 'our.loveDelivery.declinedTitle')}</h3><p>{t(status === 'accepted' ? 'our.loveDelivery.acceptedBody' : 'our.loveDelivery.declinedBody')}</p>{status === 'accepted' ? <SecondaryButton onClick={() => navigate('/our/love-delivery/session-preview')}>{t('our.loveDelivery.viewSession')}</SecondaryButton> : null}</SoftCard>}</SoftCard></main></div>
}
