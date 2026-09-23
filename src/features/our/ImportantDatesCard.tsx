import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ourAssets } from '../../assets/uiAssets'
import { ConfirmDialog, PrimaryButton, SecondaryButton, SectionHeader, SoftCard } from '../../components'
import { usePersistence } from '../../data/PersistenceStateContext'
import type { ImportantDate, ImportantDateType } from '../../data/types'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'
import { toLocalDate } from '../../services/localDateService'
import { formatOurLocalDate, getOurValidationKey } from './ourFormatters'

const dateTypes: Array<{ value: ImportantDateType; label: TranslationKey }> = [
  { value: 'first_chat', label: 'our.importantDates.type.firstChat' },
  { value: 'first_meeting', label: 'our.importantDates.type.firstMeeting' },
  { value: 'first_date', label: 'our.importantDates.type.firstDate' },
  { value: 'confession', label: 'our.importantDates.type.confession' },
  { value: 'dating', label: 'our.importantDates.type.dating' },
  { value: 'birthday', label: 'our.importantDates.type.birthday' },
  { value: 'anniversary', label: 'our.importantDates.type.anniversary' },
  { value: 'trip', label: 'our.importantDates.type.trip' },
  { value: 'custom', label: 'our.importantDates.type.custom' },
]

const emptyForm = () => ({ type: 'custom' as ImportantDateType, title: '', date: toLocalDate(), description: '' })

export function ImportantDatesCard() {
  const { locale, t } = useI18n()
  const persistence = usePersistence()
  const [searchParams] = useSearchParams()
  const dates = persistence?.importantDates ?? []
  const section = searchParams.get('section')
  const focusedRecordId = searchParams.get('recordId')
  const sectionRef = useRef<HTMLElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [editingId, setEditingId] = useState<string>()
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ImportantDate>()
  const [feedbackKey, setFeedbackKey] = useState<TranslationKey>()
  const visibleDates = expanded ? dates : dates.slice(0, 2)

  useEffect(() => {
    if (section !== 'important-dates') return
    if (focusedRecordId) setExpanded(true)
    const timer = globalThis.setTimeout(() => {
      const record = focusedRecordId ? document.getElementById(`important-date-${focusedRecordId}`) : undefined
      const target = record ?? sectionRef.current
      target?.scrollIntoView?.({ block: 'start' })
      target?.focus?.()
    }, 0)
    return () => globalThis.clearTimeout(timer)
  }, [focusedRecordId, section])

  const beginEdit = (record: ImportantDate) => {
    setEditingId(record.id)
    setForm({ type: record.type, title: record.title, date: record.date, description: record.description ?? '' })
    setShowForm(true)
    setFeedbackKey(undefined)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!persistence) return
    try {
      if (editingId) await persistence.updateImportantDate(editingId, form)
      else await persistence.createImportantDate(form)
      setForm(emptyForm())
      setEditingId(undefined)
      setShowForm(false)
      setFeedbackKey('our.actions.saved')
    } catch (caught) {
      setFeedbackKey(getOurValidationKey(caught))
    }
  }

  return <section className="important-dates-anchor" ref={sectionRef} tabIndex={-1} aria-label={t('our.importantDates.title')}><SoftCard className="important-dates">
    <SectionHeader title={t('our.importantDates.title')} action={<SecondaryButton onClick={() => { setEditingId(undefined); setForm(emptyForm()); setShowForm((value) => !value); setFeedbackKey(undefined) }}>{t('our.actions.add')}</SecondaryButton>} />
    {showForm ? <form className="our-data-form" onSubmit={(event) => void submit(event)}>
      <label>{t('our.importantDates.typeLabel')}<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ImportantDateType })}>{dateTypes.map((type) => <option value={type.value} key={type.value}>{t(type.label)}</option>)}</select></label>
      <label>{t('our.fields.title')}<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
      <label>{t('our.fields.date')}<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
      <label className="our-data-form__wide">{t('our.fields.description')}<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      <div className="our-data-form__actions"><SecondaryButton onClick={() => setShowForm(false)}>{t('common.cancel')}</SecondaryButton><PrimaryButton type="submit">{t('our.actions.save')}</PrimaryButton></div>
    </form> : null}
    {dates.length === 0 ? <p className="our-empty-state">{t('our.importantDates.empty')}</p> : <div className="important-dates__list">{visibleDates.map((item) => <article className={`important-date${focusedRecordId === item.id ? ' important-date--focused' : ''}`} id={`important-date-${item.id}`} key={item.id} tabIndex={focusedRecordId === item.id ? -1 : undefined}><img src={item.type === 'birthday' ? ourAssets.importantDates.birthday : ourAssets.importantDates.anniversary} alt="" aria-hidden="true" /><div><strong>{item.title}</strong><time dateTime={item.date}>{formatOurLocalDate(item.date, locale)}</time><span>{item.description ?? t(dateTypes.find((type) => type.value === item.type)?.label ?? 'our.importantDates.type.custom')}</span><div className="our-inline-actions"><button type="button" onClick={() => beginEdit(item)}>{t('our.actions.edit')}</button><button type="button" onClick={() => setDeleteTarget(item)}>{t('our.actions.delete')}</button></div></div></article>)}</div>}
    {dates.length > 2 ? <SecondaryButton className="important-dates__view-all" onClick={() => setExpanded((value) => !value)}>{t(expanded ? 'our.actions.showRecent' : 'our.actions.viewAll')}</SecondaryButton> : null}
    <p className="mock-feedback" aria-live="polite">{feedbackKey ? t(feedbackKey) : ''}</p>
    <ConfirmDialog open={Boolean(deleteTarget)} title={t('our.actions.deleteConfirmTitle')} description={t('our.actions.deleteConfirmBody')} onCancel={() => setDeleteTarget(undefined)} onConfirm={() => { if (deleteTarget && persistence) void persistence.deleteImportantDate(deleteTarget.id).catch(() => setFeedbackKey('our.validation.generic')); setDeleteTarget(undefined) }} />
  </SoftCard></section>
}
