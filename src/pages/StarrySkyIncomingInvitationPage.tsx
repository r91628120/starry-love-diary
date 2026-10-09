import { useState } from 'react'
import { PageHeader, PrimaryButton, SecondaryButton, SoftCard } from '../components'
import { starrySkyTopicById } from '../features/our/starrySkyTopics'
import { useI18n } from '../i18n/I18nContext'
import { getHeartTalkState, HEART_TALK_LOADED_INVITATION_LIMIT, heartTalkErrorCode, respondToHeartTalkInvitation, sortHeartTalkInvitations, type HeartTalkInvitation } from '../lib/firebase/heartTalkClient'
import { useVisibleRefresh } from '../lib/firebase/useVisibleRefresh'
import '../features/our/our.css'

function invitationLabel(invitation: HeartTalkInvitation) {
  const topic = invitation.topicType === 'official' ? starrySkyTopicById(invitation.officialTopicId) : undefined
  return invitation.topicType === 'custom' ? invitation.customTopicText : topic ? `${topic.id} ${topic.text}` : '—'
}

export function StarrySkyIncomingInvitationPage() {
  const { locale, t } = useI18n()
  const [invitations, setInvitations] = useState<HeartTalkInvitation[]>([])
  const [busyInvitationId, setBusyInvitationId] = useState<string>()
  const [error, setError] = useState('')
  const errorMessage = (caught: unknown) => t(`our.heartTalk.${heartTalkErrorCode(caught) === 'durable-identity-required' || heartTalkErrorCode(caught) === 'unauthenticated' ? 'identity' : heartTalkErrorCode(caught) === 'no-active-pair' ? 'pair' : heartTalkErrorCode(caught) === 'invalid-heart-talk-input' ? 'invalid' : heartTalkErrorCode(caught) === 'network-unavailable' ? 'network' : 'service'}` as never)
  const updateInvitations = async (isCurrent: () => boolean) => {
    const state = await getHeartTalkState()
    if (isCurrent()) setInvitations(sortHeartTalkInvitations(state.invitations.filter((item) => item.viewerRole === 'recipient' && item.status === 'pending')))
  }
  const { refresh } = useVisibleRefresh(updateInvitations, (caught) => setError(errorMessage(caught)))
  const respond = async (invitation: HeartTalkInvitation, action: 'accept' | 'decline') => {
    if (busyInvitationId) return
    setBusyInvitationId(invitation.invitationId); setError('')
    try {
      await respondToHeartTalkInvitation(invitation.invitationId, action)
      await refresh({ afterCurrent: true })
    } catch (caught) {
      setError(errorMessage(caught))
      await refresh({ afterCurrent: true }).catch(() => undefined)
    } finally {
      setBusyInvitationId(undefined)
    }
  }

  return <div className="page our-page starry-sky-page starry-sky-incoming-page"><PageHeader titleKey="our.starrySky.incomingTitle" variant="secondary" backFallback="/our/starry-sky" /><main className="our-page__content starry-sky-page__content"><section className="starry-sky-incoming-hero"><img src="/assets/starry-sky/starry-sky-hero-bg.png" alt="" /><div><h2>{t('our.starrySky.incomingTitle')}</h2><p>{t('our.starrySky.incomingHeroCopy')}</p></div></section>{invitations.length ? <section className="starry-sky-invitation-list" aria-label={t('our.starrySky.incomingTitle')}>{invitations.map((invitation) => { const busy = busyInvitationId === invitation.invitationId; return <SoftCard className="starry-sky-incoming-card" key={invitation.invitationId} tone="purple"><p>{t('our.heartTalk.pending')}</p><h2>{invitationLabel(invitation)}</h2><p>{new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${invitation.scheduledLocalDate}T00:00:00`))} · {invitation.startTime}–{invitation.endTime}</p><section className="starry-sky-incoming-actions"><PrimaryButton disabled={Boolean(busyInvitationId)} aria-busy={busy || undefined} onClick={() => void respond(invitation, 'accept')}>{t('our.starrySky.incomingAccept')}</PrimaryButton><SecondaryButton disabled={Boolean(busyInvitationId)} onClick={() => void respond(invitation, 'decline')}>{t('our.starrySky.incomingDecline')}</SecondaryButton></section></SoftCard> })}</section> : <SoftCard tone="purple"><p>{t('our.heartTalk.noActive')}</p></SoftCard>}{invitations.length === HEART_TALK_LOADED_INVITATION_LIMIT ? <p className="mock-feedback" role="status">{t('our.heartTalk.loadedLimit')}</p> : null}{error ? <p role="alert">{error}</p> : null}<SecondaryButton disabled={Boolean(busyInvitationId)} onClick={() => void refresh({ afterCurrent: true }).catch((caught) => setError(errorMessage(caught)))}>{t('our.starrySky.inviteChangeTopic')}</SecondaryButton></main></div>
}
