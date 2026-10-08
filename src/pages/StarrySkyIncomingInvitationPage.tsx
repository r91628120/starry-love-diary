import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, PrimaryButton, SecondaryButton, SoftCard } from '../components'
import { starrySkyTopicById } from '../features/our/starrySkyTopics'
import { useI18n } from '../i18n/I18nContext'
import { getHeartTalkState, heartTalkErrorCode, respondToHeartTalkInvitation, type HeartTalkInvitation } from '../lib/firebase/heartTalkClient'
import { useVisibleRefresh } from '../lib/firebase/useVisibleRefresh'
import '../features/our/our.css'

export function StarrySkyIncomingInvitationPage() {
  const { locale, t } = useI18n(); const navigate = useNavigate()
  const [invitation, setInvitation] = useState<HeartTalkInvitation>(); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const errorMessage = (caught: unknown) => t(`our.heartTalk.${heartTalkErrorCode(caught) === 'durable-identity-required' || heartTalkErrorCode(caught) === 'unauthenticated' ? 'identity' : heartTalkErrorCode(caught) === 'no-active-pair' ? 'pair' : heartTalkErrorCode(caught) === 'invalid-heart-talk-input' ? 'invalid' : heartTalkErrorCode(caught) === 'network-unavailable' ? 'network' : 'service'}` as never)
  const updateInvitation = async (isCurrent: () => boolean) => { const state = await getHeartTalkState(); if (isCurrent()) setInvitation(state.invitations.find((item) => item.viewerRole === 'recipient' && item.status === 'pending')) }
  const { refresh } = useVisibleRefresh(updateInvitation, (caught) => setError(errorMessage(caught)))
  const respond = async (action: 'accept' | 'decline') => { if (!invitation) return; setBusy(true); setError(''); try { await respondToHeartTalkInvitation(invitation.invitationId, action); await refresh({ afterCurrent: true }); if (action === 'accept') navigate(`/our/starry-sky/session-preview?invitation=${encodeURIComponent(invitation.invitationId)}`) } catch (caught) { setError(errorMessage(caught)) } finally { setBusy(false) } }
  const topic = invitation?.topicType === 'official' ? starrySkyTopicById(invitation.officialTopicId) : undefined
  const label = invitation?.topicType === 'custom' ? invitation.customTopicText : topic ? `${topic.id} ${topic.text}` : invitation ? '—' : ''
  return <div className="page our-page starry-sky-page starry-sky-incoming-page"><PageHeader titleKey="our.starrySky.incomingTitle" variant="secondary" backFallback="/our/starry-sky" /><main className="our-page__content starry-sky-page__content"><section className="starry-sky-incoming-hero"><img src="/assets/starry-sky/starry-sky-hero-bg.png" alt="" /><div><h2>{t('our.starrySky.incomingTitle')}</h2><p>{t('our.starrySky.incomingHeroCopy')}</p></div></section>{invitation ? <><SoftCard className="starry-sky-incoming-card" tone="purple"><p>{t('our.starrySky.incomingInviter')}</p></SoftCard><SoftCard className="starry-sky-incoming-card"><h2>{t('our.starrySky.incomingTopic')}</h2><p>{label}</p></SoftCard><SoftCard className="starry-sky-incoming-card"><h2>{t('our.starrySky.incomingSchedule')}</h2><p>{new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${invitation.scheduledLocalDate}T00:00:00`))} · {invitation.startTime}–{invitation.endTime}</p><p>{t('our.starrySky.incomingExpiry')}</p></SoftCard><section className="starry-sky-incoming-actions"><PrimaryButton disabled={busy} onClick={() => void respond('accept')}>{t('our.starrySky.incomingAccept')}</PrimaryButton><SecondaryButton disabled={busy} onClick={() => void respond('decline')}>{t('our.starrySky.incomingDecline')}</SecondaryButton></section></> : <SoftCard tone="purple"><p>{busy ? t('our.starrySky.incomingHeroCopy') : t('our.starrySky.historyEmptyBody')}</p></SoftCard>}{error ? <p role="alert">{error}</p> : null}<SecondaryButton disabled={busy} onClick={() => void refresh({ afterCurrent: true }).catch((caught) => setError(errorMessage(caught)))}>{t('our.starrySky.inviteChangeTopic')}</SecondaryButton></main></div>
}
