import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader, PrimaryButton, SecondaryButton, SoftCard } from '../components'
import { useI18n } from '../i18n/I18nContext'
import type { TranslationKey } from '../i18n/messages'
import { featuredStarrySkyTopic, starrySkyCategoryIds, starrySkyTopicById } from '../features/our/starrySkyTopics'
import { usePersistence } from '../data/PersistenceStateContext'
import { shareStarrySkyTopic } from '../services/starrySkyTopicShare'
import { createHeartTalkInvitation, getHeartTalkState, HEART_TALK_LOADED_INVITATION_LIMIT, heartTalkErrorCode, sortHeartTalkInvitations, type HeartTalkInvitation } from '../lib/firebase/heartTalkClient'
import { useVisibleRefresh } from '../lib/firebase/useVisibleRefresh'
import { validateHeartTalkSchedule } from '../lib/heartTalkSchedule'
import { toLocalDate } from '../services/localDateService'
import '../features/our/our.css'

const categoryIcons = ['🤍','💞','👁️','🏠','🌱','👥','☀️','💼','🍃','🌈','✈️','🌙']

function invitationLabel(invitation: HeartTalkInvitation) {
  const topic = invitation.topicType === 'official' ? starrySkyTopicById(invitation.officialTopicId) : undefined
  return invitation.topicType === 'custom' ? invitation.customTopicText : topic ? `${topic.id} ${topic.text}` : '—'
}

type InvitationSection = 'received' | 'sent' | 'scheduled'

export function StarrySkyPage() {
  const { t, locale } = useI18n()
  const navigate = useNavigate(), location = useLocation()
  const persistence = usePersistence()
  const [feedback, setFeedback] = useState<string>((location.state as { pairingGuidance?: boolean } | null)?.pairingGuidance ? t('our.starrySky.chooseUnpaired') : '')
  const [invitations, setInvitations] = useState<HeartTalkInvitation[]>([])
  const [customTopic, setCustomTopic] = useState('')
  const [customDate, setCustomDate] = useState(() => toLocalDate())
  const [customStart, setCustomStart] = useState('20:00')
  const [customEnd, setCustomEnd] = useState('20:30')
  const [customSending, setCustomSending] = useState(false)
  const [openSections, setOpenSections] = useState<Record<InvitationSection, boolean>>({ received: false, sent: false, scheduled: false })
  const [openInvitation, setOpenInvitation] = useState<{ section: InvitationSection; invitationId: string }>()
  const shareFeatured = async () => { const result = await shareStarrySkyTopic(featuredStarrySkyTopic.text, locale); setFeedback(result === 'copied' ? t('our.starrySky.copied') : result === 'error' ? t('our.starrySky.shareError') : '') }
  const errorMessage = (error: unknown) => { const code = heartTalkErrorCode(error); return t(`our.heartTalk.${code === 'durable-identity-required' || code === 'unauthenticated' ? 'identity' : code === 'no-active-pair' ? 'pair' : code === 'heart-talk-start-time-passed' ? 'startPassed' : code === 'heart-talk-end-time-invalid' ? 'endBeforeStart' : code === 'invalid-heart-talk-input' ? 'invalid' : code === 'network-unavailable' ? 'network' : 'service'}` as TranslationKey) }
  const updateInvitations = async (isCurrent: () => boolean) => { const state = await getHeartTalkState(); if (isCurrent()) { const next = sortHeartTalkInvitations(state.invitations); setInvitations(next); setOpenInvitation((current) => current && next.some((item) => item.invitationId === current.invitationId && ((current.section === 'received' && item.viewerRole === 'recipient' && item.status === 'pending') || (current.section === 'sent' && item.viewerRole === 'sender' && item.status === 'pending') || (current.section === 'scheduled' && item.status === 'accepted'))) ? current : undefined) } }
  const { refresh } = useVisibleRefresh(updateInvitations, (error) => setFeedback(errorMessage(error)))
  const sendCustom = async () => { const text = customTopic.trim(); const schedule = validateHeartTalkSchedule(customDate, customStart, customEnd); if (!text || text.length > 1000 || customSending) return; if (schedule.status !== 'valid') { setFeedback(t(`our.heartTalk.${schedule.status === 'past-date' ? 'pastDate' : schedule.status === 'start-passed' ? 'startPassed' : schedule.status === 'end-not-after-start' ? 'endBeforeStart' : 'invalid'}` as TranslationKey)); return } setCustomSending(true); setFeedback(''); let created = false; try { await createHeartTalkInvitation({ topicType: 'custom', customTopicText: text, scheduledLocalDate: customDate, startTime: customStart, endTime: customEnd, ...schedule }); created = true; setCustomTopic(''); await refresh({ afterCurrent: true }) } catch (error) { setFeedback(created ? t('our.heartTalk.syncPending') : errorMessage(error)) } finally { setCustomSending(false) } }
  const senderPending = invitations.filter((item) => item.viewerRole === 'sender' && item.status === 'pending')
  const recipientPending = invitations.filter((item) => item.viewerRole === 'recipient' && item.status === 'pending')
  const accepted = invitations.filter((item) => item.status === 'accepted')
  const invitationCard = (section: InvitationSection, invitation: HeartTalkInvitation, action: () => void, actionLabel: string, status: string) => {
    const expanded = openInvitation?.section === section && openInvitation.invitationId === invitation.invitationId
    return <SoftCard className="starry-sky-heart-talk-status" tone="purple" key={invitation.invitationId}><button type="button" className="starry-sky-invitation-summary" aria-expanded={expanded} onClick={() => setOpenInvitation(expanded ? undefined : { section, invitationId: invitation.invitationId })}><span>{status}</span><strong>{invitationLabel(invitation)}</strong><small>{expanded ? t('our.heartTalk.collapse') : t('our.heartTalk.expand')}</small></button>{expanded ? <div className="starry-sky-invitation-detail"><p>{new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${invitation.scheduledLocalDate}T00:00:00`))} · {invitation.startTime}–{invitation.endTime}</p><PrimaryButton onClick={action}>{actionLabel}</PrimaryButton></div> : null}</SoftCard>
  }
  const invitationSection = (section: InvitationSection, title: string, items: HeartTalkInvitation[], action: (invitation: HeartTalkInvitation) => void, actionLabel: string, status: string) => <section className="starry-sky-invitation-list" aria-label={title}><button type="button" className="starry-sky-invitation-group" aria-expanded={openSections[section]} onClick={() => setOpenSections((current) => ({ ...current, [section]: !current[section] }))}><span>{title}</span><b>{items.length}</b></button>{openSections[section] ? <div className="starry-sky-invitation-list__items">{items.map((invitation) => invitationCard(section, invitation, () => action(invitation), actionLabel, status))}</div> : null}</section>

  return <div className="page our-page starry-sky-page"><PageHeader titleKey="our.starrySky.title" variant="secondary" backFallback="/our" /><main className="our-page__content starry-sky-page__content">
    <section className="starry-sky-hero"><div><p>{t('our.starrySky.heroCopy')}</p></div></section>
    <SoftCard className="starry-sky-count starry-sky-heart-talk-summary" tone="purple"><span>{t('our.starrySky.count', { count: persistence?.heartTalkCount ?? 0 })}</span><SecondaryButton onClick={() => navigate('/our/starry-sky/history')}>{t('our.starrySky.historyEntry')}</SecondaryButton></SoftCard>
    {invitationSection('received', t('our.starrySky.incomingTitle'), recipientPending, (invitation) => navigate(`/our/starry-sky/invitation-preview?invitation=${encodeURIComponent(invitation.invitationId)}`), t('our.starrySky.incomingTitle'), t('our.heartTalk.pending'))}
    {invitationSection('sent', t('our.starrySky.invitePreviewTitle'), senderPending, (invitation) => navigate(`/our/starry-sky/session-preview?invitation=${encodeURIComponent(invitation.invitationId)}`), t('our.starrySky.invitePreviewTitle'), t('our.heartTalk.pending'))}
    {invitationSection('scheduled', t('our.starrySky.sessionAcceptedTitle'), accepted, (invitation) => navigate(`/our/starry-sky/session-preview?invitation=${encodeURIComponent(invitation.invitationId)}`), t('our.starrySky.incomingViewSession'), t('our.starrySky.sessionAcceptedTitle'))}
    {invitations.length === HEART_TALK_LOADED_INVITATION_LIMIT ? <p className="mock-feedback" role="status">{t('our.heartTalk.loadedLimit')}</p> : null}
    <section className="starry-sky-section starry-sky-discovery"><h2>{t('our.starrySky.tonightTitle')}</h2><p>{t('our.starrySky.librarySubtitle')}</p><div className="starry-sky-category-grid">{starrySkyCategoryIds.map((id, index) => <button type="button" key={id} onClick={() => navigate('/our/starry-sky/topics', { state: { categoryId: id } })}><i aria-hidden="true">{categoryIcons[index]}</i><b>{id}</b><span>{t(`our.starrySky.category.${id}` as TranslationKey)}</span></button>)}</div></section>
    <SoftCard className="starry-sky-custom"><h2>{t('our.starrySky.custom')}</h2><p>{t('our.starrySky.customUnpaired')}</p><input aria-label={t('our.starrySky.custom')} value={customTopic} maxLength={1000} onChange={(event) => setCustomTopic(event.target.value)} /><label>{t('our.starrySky.inviteDateLabel')}<input aria-label={t('our.starrySky.inviteDateLabel')} type="date" value={customDate} onChange={(event) => setCustomDate(event.target.value)} /></label><label>{t('our.starrySky.inviteStartTime')}<input aria-label={t('our.starrySky.inviteStartTime')} type="time" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></label><label>{t('our.starrySky.inviteEndTime')}<input aria-label={t('our.starrySky.inviteEndTime')} type="time" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></label><SecondaryButton disabled={!customTopic.trim() || customStart >= customEnd || customSending} onClick={() => void sendCustom()}>{t('our.starrySky.invite')}</SecondaryButton></SoftCard>
    <SoftCard className="starry-sky-panel starry-sky-pairing" tone="purple"><img className="starry-sky-pairing__cats" src="/assets/starry-sky/starry-sky-pair-cats-card.png" alt="" /><h2>{t('our.starrySky.pairingTitle')}</h2><div className="starry-sky-panel__actions"><PrimaryButton onClick={() => navigate('/our/pair')}>{t('our.starrySky.invite')}</PrimaryButton><SecondaryButton onClick={() => navigate('/our/pair')}>{t('our.starrySky.code')}</SecondaryButton></div></SoftCard>
    <section className="starry-sky-featured-section"><h2>{t('our.starrySky.featuredTitle')}</h2><SoftCard className="starry-sky-featured" tone="purple"><span>{featuredStarrySkyTopic.id}</span><p lang="zh-TW">{featuredStarrySkyTopic.text}</p><div><SecondaryButton onClick={() => void shareFeatured()}>{t('our.starrySky.share')}</SecondaryButton><PrimaryButton onClick={() => navigate('/our/starry-sky/topics')}>{t('our.starrySky.browse')}</PrimaryButton></div></SoftCard></section>
    {feedback ? <p className="mock-feedback" aria-live="polite">{feedback}</p> : null}
  </main></div>
}
