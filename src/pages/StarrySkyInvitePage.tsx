import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader, PrimaryButton, SecondaryButton, SoftCard } from '../components'
import { useI18n } from '../i18n/I18nContext'
import { starrySkyTopicById } from '../features/our/starrySkyTopics'
import { toLocalDate } from '../services/localDateService'
import '../features/our/our.css'

function addDays(localDate: string, days: number) {
  const date = new Date(`${localDate}T00:00:00`)
  date.setDate(date.getDate() + days)
  return toLocalDate(date)
}

const isTwentyFourHourTime = (value: string) => /^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(value)

export function StarrySkyInvitePage() {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const topic = starrySkyTopicById(searchParams.get('topic'))
  const [today] = useState(() => toLocalDate())
  const [selectedDate, setSelectedDate] = useState(today)
  const [startTime, setStartTime] = useState('20:00')
  const [endTime, setEndTime] = useState('20:30')
  const [editingTime, setEditingTime] = useState<'start' | 'end'>()
  const [draftHour, setDraftHour] = useState('20')
  const [draftMinute, setDraftMinute] = useState('00')
  const [error, setError] = useState<string>()
  const [preview, setPreview] = useState(false)
  const dateChoices = useMemo(() => {
    const windowStart = selectedDate === today || selectedDate < today ? today : addDays(selectedDate, -3) < today ? today : addDays(selectedDate, -3)
    return Array.from({ length: 7 }, (_, index) => addDays(windowStart, index))
  }, [selectedDate, today])
  const formatDate = (value: string, withWeekday = true) => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', ...(withWeekday ? { weekday: 'short' } : {}) }).format(new Date(`${value}T00:00:00`))
  const chooseDate = (value: string) => {
    if (value < today) { setError(t('our.starrySky.invitePastDate')); return }
    setSelectedDate(value); setError(undefined); setPreview(false)
  }
  const submit = () => {
    if (!topic || !selectedDate || !isTwentyFourHourTime(startTime) || !isTwentyFourHourTime(endTime) || endTime <= startTime) { setError(t('our.starrySky.inviteInvalidTime')); setPreview(false); return }
    // This is an explicitly local preview. A future real invitation will enter
    // the shared relationship identity boundary before any Pair write.
    setError(undefined); setPreview(true)
  }
  const openTimePicker = (target: 'start' | 'end') => {
    const [hour, minute] = (target === 'start' ? startTime : endTime).split(':')
    setDraftHour(isTwentyFourHourTime(`${hour}:${minute}`) ? hour : '00')
    setDraftMinute(isTwentyFourHourTime(`${hour}:${minute}`) ? minute : '00')
    setEditingTime(target)
  }
  const confirmTimePicker = () => {
    const value = `${draftHour}:${draftMinute}`
    if (editingTime === 'start') setStartTime(value)
    if (editingTime === 'end') setEndTime(value)
    setPreview(false); setEditingTime(undefined)
  }

  if (!topic) return <div className="page our-page starry-sky-page"><PageHeader titleKey="our.starrySky.inviteTitle" variant="secondary" backFallback="/our/starry-sky/topics" /><main className="our-page__content starry-sky-page__content"><SoftCard className="starry-sky-invite__empty" tone="purple"><h2>{t('our.starrySky.inviteInvalidTopicTitle')}</h2><p>{t('our.starrySky.inviteInvalidTopicBody')}</p><PrimaryButton onClick={() => navigate('/our/starry-sky/topics')}>{t('our.starrySky.inviteBackToLibrary')}</PrimaryButton></SoftCard></main></div>

  return <div className="page our-page starry-sky-page starry-sky-invite-page">
    <PageHeader titleKey="our.starrySky.inviteTitle" variant="secondary" backFallback="/our/starry-sky/topics" />
    <main className="our-page__content starry-sky-page__content">
      <section className="starry-sky-invite-hero"><img src="/assets/starry-sky/starry-sky-hero-bg.png" alt="" /><div><h2>{t('our.starrySky.inviteTitle')}</h2><p>{t('our.starrySky.inviteHeroCopy')}</p></div></section>
      <SoftCard className="starry-sky-invite-step"><header><h2>{t('our.starrySky.inviteStepTopic')}</h2><SecondaryButton onClick={() => navigate('/our/starry-sky/topics', { state: { categoryId: topic.categoryId } })}>{t('our.starrySky.inviteChangeTopic')}</SecondaryButton></header><div className="starry-sky-invite-topic"><span>{topic.id}</span><p lang="zh-TW">{topic.text}</p></div></SoftCard>
      <SoftCard className="starry-sky-invite-step"><header><h2>{t('our.starrySky.inviteStepDate')}</h2><label className="starry-sky-invite-date-input"><span>{t('our.starrySky.inviteOtherDate')}</span><input aria-label={t('our.starrySky.inviteDateLabel')} type="date" min={today} value={selectedDate} onChange={(event) => chooseDate(event.target.value)} /></label></header><div className="starry-sky-invite-dates" role="list">{dateChoices.map((date) => <button type="button" role="listitem" data-local-date={date} key={date} aria-pressed={selectedDate === date} className={selectedDate === date ? 'is-selected' : ''} onClick={() => chooseDate(date)}><small>{formatDate(date, false)}</small><strong>{date.slice(-2)}</strong><span>{new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(`${date}T00:00:00`))}</span></button>)}</div></SoftCard>
      <SoftCard className="starry-sky-invite-step"><h2>{t('our.starrySky.inviteStepTime')}</h2><div className="starry-sky-invite-times"><label><span>{t('our.starrySky.inviteStartTime')}</span><button type="button" className="starry-sky-invite-time-trigger" aria-label={t('our.starrySky.inviteStartTime')} onClick={() => openTimePicker('start')}>{startTime}</button></label><label><span>{t('our.starrySky.inviteEndTime')}</span><button type="button" className="starry-sky-invite-time-trigger" aria-label={t('our.starrySky.inviteEndTime')} onClick={() => openTimePicker('end')}>{endTime}</button></label></div></SoftCard>
      <SoftCard className="starry-sky-invite-step starry-sky-invite-send"><h2>{t('our.starrySky.inviteStepSend')}</h2><p>{t('our.starrySky.inviteNotice')}</p><p className="starry-sky-conversation-reminder">{t('our.starrySky.inviteExternalConversation')}</p><small>{t('our.starrySky.inviteExpiry')}</small><PrimaryButton onClick={submit}>{t('our.starrySky.inviteSubmit')}</PrimaryButton>{error ? <p className="starry-sky-invite__error" role="alert">{error}</p> : null}{preview ? <section className="starry-sky-invite-preview" aria-live="polite"><h3>{t('our.starrySky.invitePreviewTitle')}</h3><p>{t('our.starrySky.invitePreviewBody')}</p><dl><div><dt>{t('our.starrySky.invitePreviewTopic')}</dt><dd>{topic.id}</dd></div><div><dt>{t('our.starrySky.invitePreviewDate')}</dt><dd>{formatDate(selectedDate)}</dd></div><div><dt>{t('our.starrySky.invitePreviewTime')}</dt><dd>{startTime} – {endTime}</dd></div></dl><SecondaryButton onClick={() => navigate('/our/starry-sky/invitation-preview')}>{t('our.starrySky.inviteReviewIncoming')}</SecondaryButton><SecondaryButton onClick={() => setPreview(false)}>{t('our.starrySky.inviteClose')}</SecondaryButton></section> : null}</SoftCard>
    </main>
    {editingTime ? <div className="starry-sky-time-picker-backdrop" role="presentation"><section className="starry-sky-time-picker" role="dialog" aria-modal="true" aria-labelledby="starry-sky-time-picker-title"><h2 id="starry-sky-time-picker-title">{t('our.starrySky.inviteTimePickerTitle')}</h2><div><label><span>{t('our.starrySky.inviteHour')}</span><select aria-label={t('our.starrySky.inviteHour')} value={draftHour} onChange={(event) => setDraftHour(event.target.value)}>{Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0')).map((hour) => <option key={hour} value={hour}>{hour}</option>)}</select></label><span aria-hidden="true">:</span><label><span>{t('our.starrySky.inviteMinute')}</span><select aria-label={t('our.starrySky.inviteMinute')} value={draftMinute} onChange={(event) => setDraftMinute(event.target.value)}>{Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0')).map((minute) => <option key={minute} value={minute}>{minute}</option>)}</select></label></div><footer><SecondaryButton onClick={() => setEditingTime(undefined)}>{t('our.starrySky.invitePickerCancel')}</SecondaryButton><PrimaryButton onClick={confirmTimePicker}>{t('our.starrySky.invitePickerConfirm')}</PrimaryButton></footer></section></div> : null}
  </div>
}
