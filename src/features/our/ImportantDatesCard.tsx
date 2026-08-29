import { useState, type FormEvent } from 'react'
import { ourAssets } from '../../assets/uiAssets'
import { ConfirmDialog, PrimaryButton, SecondaryButton, SectionHeader, SoftCard } from '../../components'
import { usePersistence } from '../../data/PersistenceStateContext'
import type { ImportantDate, ImportantDateType } from '../../data/types'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'
import { toLocalDate } from '../../services/localDateService'

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

const emptyForm = () => ({ type: 'custom' as ImportantDateType, title: '', date: toLocalDate(), description: '', reminderEnabled: false })

export function ImportantDatesCard() {
  const { locale, t } = useI18n()
  const persistence = usePersistence()
  const dates = persistence?.importantDates ?? []
  const [expanded, setExpanded] = useState(false)
  const [editingId, setEditingId] = useState<string>()
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ImportantDate>()
  const [error, setError] = useState('')
  const visibleDates = expanded ? dates : dates.slice(0, 2)

  const beginEdit = (record: ImportantDate) => {
    setEditingId(record.id)
    setForm({ type: record.type, title: record.title, date: record.date, description: record.description ?? '', reminderEnabled: record.reminderEnabled ?? false })
    setShowForm(true)
    setError('')
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
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('our.validation.generic'))
    }
  }

  return <SoftCard className="important-dates">
    <SectionHeader title={t('our.importantDates.title')} action={<SecondaryButton onClick={() => { setEditingId(undefined); setForm(emptyForm()); setShowForm((value) => !value); setError('') }}>{t('our.actions.add')}</SecondaryButton>} />
    {showForm ? <form className="our-data-form" onSubmit={(event) => void submit(event)}>
      <label>{t('our.importantDates.typeLabel')}<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ImportantDateType })}>{dateTypes.map((type) => <option value={type.value} key={type.value}>{t(type.label)}</option>)}</select></label>
      <label>{t('our.fields.title')}<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
      <label>{t('our.fields.date')}<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
      <label className="our-data-form__wide">{t('our.fields.description')}<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      <label className="our-data-form__check"><input type="checkbox" checked={form.reminderEnabled} onChange={(event) => setForm({ ...form, reminderEnabled: event.target.checked })} />{t('our.importantDates.reminder')}</label>
      <div className="our-data-form__actions"><SecondaryButton onClick={() => setShowForm(false)}>{t('common.cancel')}</SecondaryButton><PrimaryButton type="submit">{t('our.actions.save')}</PrimaryButton></div>
    </form> : null}
    {dates.length === 0 ? <p className="our-empty-state">{t('our.importantDates.empty')}</p> : <div className="important-dates__list">{visibleDates.map((item) => <article className="important-date" key={item.id}><img src={item.type === 'birthday' ? ourAssets.importantDates.birthday : ourAssets.importantDates.anniversary} alt="" /><div><strong>{item.title}</strong><time dateTime={item.date}>{new Date(`${item.date}T00:00:00`).toLocaleDateString(locale)}</time><span>{item.description ?? t(dateTypes.find((type) => type.value === item.type)?.label ?? 'our.importantDates.type.custom')}</span><div className="our-inline-actions"><button type="button" onClick={() => beginEdit(item)}>{t('our.rememberYou.edit')}</button><button type="button" onClick={() => setDeleteTarget(item)}>{t('our.rememberYou.delete')}</button></div></div></article>)}</div>}
    {dates.length > 2 ? <SecondaryButton onClick={() => setExpanded((value) => !value)}>{t(expanded ? 'our.actions.showRecent' : 'our.actions.viewAll')}</SecondaryButton> : null}
    <p className="mock-feedback" aria-live="polite">{error}</p>
    <ConfirmDialog open={Boolean(deleteTarget)} title={t('our.actions.deleteConfirmTitle')} description={t('our.actions.deleteConfirmBody')} onCancel={() => setDeleteTarget(undefined)} onConfirm={() => { if (deleteTarget && persistence) void persistence.deleteImportantDate(deleteTarget.id); setDeleteTarget(undefined) }} />
  </SoftCard>
}
