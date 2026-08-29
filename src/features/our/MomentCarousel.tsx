import { useState, type FormEvent } from 'react'
import { footprintsAssets, ourAssets } from '../../assets/uiAssets'
import { ConfirmDialog, IconButton, PrimaryButton, SecondaryButton, SectionHeader, SoftCard } from '../../components'
import { usePersistence } from '../../data/PersistenceStateContext'
import type { MemoryMoment } from '../../data/types'
import { useI18n } from '../../i18n/I18nContext'
import { toLocalDate } from '../../services/localDateService'

const emptyForm = () => ({ title: '', content: '', localDate: toLocalDate() })

export function MomentCarousel() {
  const { locale, t } = useI18n()
  const persistence = usePersistence()
  const moments = persistence?.memoryMoments ?? []
  const [index, setIndex] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string>()
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<MemoryMoment>()
  const [error, setError] = useState('')
  const safeIndex = Math.min(index, Math.max(0, moments.length - 1))
  const moment = moments[safeIndex]
  const move = (step: number) => { if (moments.length) setIndex((safeIndex + step + moments.length) % moments.length) }

  const beginEdit = (record: MemoryMoment) => {
    setEditingId(record.id)
    setForm({ title: record.title ?? '', content: record.content, localDate: record.localDate })
    setShowForm(true)
    setError('')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!persistence) return
    try {
      if (editingId) await persistence.updateMemoryMoment(editingId, form)
      else await persistence.createMemoryMoment(form)
      setForm(emptyForm())
      setEditingId(undefined)
      setShowForm(false)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('our.validation.generic'))
    }
  }

  return <SoftCard className="moment-carousel">
    <SectionHeader title={t('our.moments.title')} action={<SecondaryButton onClick={() => { setEditingId(undefined); setForm(emptyForm()); setShowForm((value) => !value); setError('') }}>{t('our.actions.add')}</SecondaryButton>} />
    {showForm ? <form className="our-data-form" onSubmit={(event) => void submit(event)}>
      <label>{t('our.fields.titleOptional')}<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
      <label>{t('our.fields.date')}<input required type="date" value={form.localDate} onChange={(event) => setForm({ ...form, localDate: event.target.value })} /></label>
      <label className="our-data-form__wide">{t('our.fields.content')}<textarea required value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label>
      <div className="our-data-form__actions"><SecondaryButton onClick={() => setShowForm(false)}>{t('common.cancel')}</SecondaryButton><PrimaryButton type="submit">{t('our.actions.save')}</PrimaryButton></div>
    </form> : null}
    {moment ? <><div className="moment-carousel__row">
      <IconButton ariaLabel={t('our.moments.previous')} onClick={() => move(-1)}><img src={ourAssets.moments.arrowLeft} alt="" /></IconButton>
      <article className="moment-card"><img src={footprintsAssets.hero} alt={t('our.moments.photoAlt')} /><div><h3>{moment.title || t('our.moments.untitled')}</h3><p>{moment.content}</p><time dateTime={moment.localDate}>{new Date(`${moment.localDate}T00:00:00`).toLocaleDateString(locale)}</time><div className="our-inline-actions"><button type="button" onClick={() => beginEdit(moment)}>{t('our.rememberYou.edit')}</button><button type="button" onClick={() => setDeleteTarget(moment)}>{t('our.rememberYou.delete')}</button></div></div></article>
      <IconButton ariaLabel={t('our.moments.next')} onClick={() => move(1)}><img src={ourAssets.moments.arrowRight} alt="" /></IconButton>
    </div><div className="moment-carousel__dots" aria-hidden="true">{moments.map((item, dot) => <span className={dot === safeIndex ? 'is-active' : ''} key={item.id} />)}</div></> : <p className="our-empty-state">{t('our.moments.empty')}</p>}
    {moments.length ? <SecondaryButton onClick={() => setShowAll((value) => !value)}>{t(showAll ? 'our.actions.showRecent' : 'our.moments.viewAll')}</SecondaryButton> : null}
    {showAll ? <div className="moment-all-list">{moments.map((item) => <article key={item.id}><strong>{item.title || t('our.moments.untitled')}</strong><span>{item.localDate}</span><p>{item.content}</p></article>)}</div> : null}
    <p className="mock-feedback" aria-live="polite">{error}</p>
    <ConfirmDialog open={Boolean(deleteTarget)} title={t('our.actions.deleteConfirmTitle')} description={t('our.actions.deleteConfirmBody')} onCancel={() => setDeleteTarget(undefined)} onConfirm={() => { if (deleteTarget && persistence) void persistence.deleteMemoryMoment(deleteTarget.id); setDeleteTarget(undefined) }} />
  </SoftCard>
}
