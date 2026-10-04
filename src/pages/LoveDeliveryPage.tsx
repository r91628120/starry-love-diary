import { useState } from 'react'
import { PageHeader, PrimaryButton, SecondaryButton, SoftCard } from '../components'
import { useI18n } from '../i18n/I18nContext'
import { countGraphemes, truncateGraphemes } from '../services/graphemes'
import '../features/our/our.css'

const types = ['drink', 'meal', 'walk', 'call', 'meet', 'together', 'custom'] as const
const timeHours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
const timeMinutes = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'))
type LoveDeliveryType = typeof types[number]
type EditingTime = 'start' | 'end'
type Draft = { type?: LoveDeliveryType, customType: string, content: string, item: string, topic: string, date: string, startTime: string, endTime: string, location: string, note: string }
const limits = { customType: 200, content: 1000, item: 200, topic: 1000, location: 200, note: 1000 } as const
const isTwentyFourHourTime = (value: string) => /^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(value)

export function LoveDeliveryPage() {
  const { locale, t } = useI18n()
  const [draft, setDraft] = useState<Draft>({ customType: '', content: '', item: '', topic: '', date: '', startTime: '', endTime: '', location: '', note: '' })
  const [preview, setPreview] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string>()
  const [editingTime, setEditingTime] = useState<EditingTime>()
  const [draftHour, setDraftHour] = useState('00')
  const [draftMinute, setDraftMinute] = useState('00')
  const setText = (field: keyof typeof limits, value: string) => setDraft((current) => ({ ...current, [field]: truncateGraphemes(value, limits[field]) }))
  const typeLabel = (type: LoveDeliveryType) => t(`our.loveDelivery.type${type[0].toUpperCase()}${type.slice(1)}` as never)
  const validate = () => {
    if (!draft.type && !draft.content.trim()) { setError(t('our.loveDelivery.required')); return false }
    if (draft.type === 'custom' && !draft.customType.trim()) { setError(t('our.loveDelivery.customTypeRequired')); return false }
    if (draft.endTime && !draft.startTime) { setError(t('our.loveDelivery.endRequiresStart')); return false }
    if (draft.startTime && draft.endTime && draft.endTime <= draft.startTime) { setError(t('our.loveDelivery.invalidTime')); return false }
    setError(undefined); return true
  }
  const openTimePicker = (target: EditingTime) => {
    const value = target === 'start' ? draft.startTime : draft.endTime
    const [hour, minute] = value.split(':')
    setDraftHour(isTwentyFourHourTime(value) ? hour : '00')
    setDraftMinute(isTwentyFourHourTime(value) ? minute : '00')
    setEditingTime(target)
  }
  const confirmTimePicker = () => {
    const value = `${draftHour}:${draftMinute}`
    if (editingTime === 'start') setDraft((current) => ({ ...current, startTime: value }))
    if (editingTime === 'end') setDraft((current) => ({ ...current, endTime: value }))
    setError(undefined)
    setEditingTime(undefined)
  }
  const openPreview = () => { if (validate()) { setPreview(true); setSent(false) } }
  const send = () => { if (validate()) { setPreview(true); setSent(true) } }
  const dateLabel = draft.date ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${draft.date}T00:00:00`)) : ''
  const counter = (field: keyof typeof limits) => t('our.loveDelivery.counter', { count: countGraphemes(draft[field]), max: limits[field] })
  const timeLabel = draft.startTime && draft.endTime ? `${draft.startTime}–${draft.endTime}` : draft.startTime
  const rows: readonly [string, string][] = [
    [t('our.loveDelivery.typeLabel'), draft.type === 'custom' ? draft.customType : draft.type ? typeLabel(draft.type) : ''], [t('our.loveDelivery.contentLabel'), draft.content], [t('our.loveDelivery.itemLabel'), draft.item], [t('our.loveDelivery.topicLabel'), draft.topic], [t('our.loveDelivery.dateLabel'), dateLabel], [t('our.loveDelivery.previewTime'), timeLabel], [t('our.loveDelivery.locationLabel'), draft.location], [t('our.loveDelivery.noteLabel'), draft.note],
  ]
  return <div className="page our-page love-delivery-page"><PageHeader titleKey="our.loveDelivery.title" variant="secondary" backFallback="/our" /><main className="our-page__content love-delivery-page__content"><section className="love-delivery-hero"><img className="love-delivery-hero__art" src="/assets/love-delivery/love-delivery-hero-cat.png" alt={t('our.loveDelivery.heroImageAlt')} /><div className="love-delivery-hero__copy"><h2>{t('our.loveDelivery.heroCopy')}</h2><p>{t('our.loveDelivery.heroSupporting')}</p></div></section><SoftCard className="love-delivery-form"><p className="love-delivery-recipient">💕 {t('our.loveDelivery.recipient')}</p><fieldset><legend>{t('our.loveDelivery.typeLabel')}</legend><div className="love-delivery-types">{types.map((type) => <button key={type} type="button" aria-pressed={draft.type === type} className={draft.type === type ? 'is-selected' : ''} onClick={() => { setDraft((current) => ({ ...current, type })); setSent(false) }}>{typeLabel(type)}</button>)}</div></fieldset>{draft.type === 'custom' ? <label className="love-delivery-custom-type">{t('our.loveDelivery.customTypeLabel')}<span>{t('our.loveDelivery.customTypeHint')}</span><input value={draft.customType} maxLength={undefined} onChange={(event) => setText('customType', event.target.value)} aria-describedby="love-delivery-custom-type-counter" /><small id="love-delivery-custom-type-counter">{counter('customType')}</small></label> : null}<label>{t('our.loveDelivery.contentLabel')}<textarea value={draft.content} maxLength={undefined} onChange={(event) => setText('content', event.target.value)} /><small>{counter('content')}</small></label><label>{t('our.loveDelivery.itemLabel')}<input value={draft.item} maxLength={undefined} onChange={(event) => setText('item', event.target.value)} /><small>{counter('item')}</small></label><label>{t('our.loveDelivery.topicLabel')}<span>{t('our.loveDelivery.topicHint')}</span><textarea value={draft.topic} maxLength={undefined} onChange={(event) => setText('topic', event.target.value)} /><small>{counter('topic')}</small></label><div className="love-delivery-schedule"><label>{t('our.loveDelivery.dateLabel')}<input type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></label><label><span>{t('our.loveDelivery.startTime')}</span><button type="button" className="love-delivery-time-trigger" aria-label={t('our.loveDelivery.startTime')} onClick={() => openTimePicker('start')}>{draft.startTime || 'HH:mm'}</button></label><label><span>{t('our.loveDelivery.endTime')}</span><button type="button" className="love-delivery-time-trigger" aria-label={t('our.loveDelivery.endTime')} onClick={() => openTimePicker('end')}>{draft.endTime || 'HH:mm'}</button></label></div><label>{t('our.loveDelivery.locationLabel')}<input value={draft.location} maxLength={undefined} onChange={(event) => setText('location', event.target.value)} /><small>{counter('location')}</small></label><label>{t('our.loveDelivery.noteLabel')}<textarea value={draft.note} maxLength={undefined} onChange={(event) => setText('note', event.target.value)} /><small>{counter('note')}</small></label></SoftCard>{error ? <p className="love-delivery-error" role="alert">{error}</p> : null}<section className="love-delivery-actions"><SecondaryButton onClick={openPreview}>{t('our.loveDelivery.previewAction')}</SecondaryButton><PrimaryButton onClick={send}>{t('our.loveDelivery.send')}</PrimaryButton></section>{preview ? <SoftCard className="love-delivery-preview" aria-live="polite"><h2>{t('our.loveDelivery.preview')}</h2><dl>{rows.filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></SoftCard> : null}{sent ? <SoftCard className="love-delivery-sent" tone="pink" role="status"><h2>{t('our.loveDelivery.sentTitle')}</h2><p>{t('our.loveDelivery.sentBody')}</p><SecondaryButton onClick={() => setSent(false)}>{t('our.loveDelivery.close')}</SecondaryButton></SoftCard> : null}</main>{editingTime ? <div className="love-delivery-time-picker-backdrop" role="presentation"><section className="love-delivery-time-picker" role="dialog" aria-modal="true" aria-labelledby="love-delivery-time-picker-title"><h2 id="love-delivery-time-picker-title">{t('our.loveDelivery.timePickerTitle')}</h2><div><label><span>{t('our.loveDelivery.timePickerHour')}</span><select aria-label={t('our.loveDelivery.timePickerHour')} value={draftHour} onChange={(event) => setDraftHour(event.target.value)}>{timeHours.map((hour) => <option key={hour} value={hour}>{hour}</option>)}</select></label><span aria-hidden="true">:</span><label><span>{t('our.loveDelivery.timePickerMinute')}</span><select aria-label={t('our.loveDelivery.timePickerMinute')} value={draftMinute} onChange={(event) => setDraftMinute(event.target.value)}>{timeMinutes.map((minute) => <option key={minute} value={minute}>{minute}</option>)}</select></label></div><footer><SecondaryButton onClick={() => setEditingTime(undefined)}>{t('our.loveDelivery.timePickerCancel')}</SecondaryButton><PrimaryButton onClick={confirmTimePicker}>{t('our.loveDelivery.timePickerConfirm')}</PrimaryButton></footer></section></div> : null}</div>
}
