import { useState, type FormEvent } from 'react'
import { ourAssets } from '../../assets/uiAssets'
import { ConfirmDialog, FilterChip, PrimaryButton, SearchBar, SecondaryButton, SectionHeader } from '../../components'
import { usePersistence } from '../../data/PersistenceStateContext'
import type { RememberedYouCard } from '../../data/types'
import { useI18n } from '../../i18n/I18nContext'

const emptyForm = () => ({ title: '', content: '' })

export function RememberYou() {
  const { locale, t } = useI18n()
  const persistence = usePersistence()
  const cards = persistence?.rememberedYouCards ?? []
  const [search, setSearch] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string>()
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<RememberedYouCard>()
  const [feedback, setFeedback] = useState('')
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const shown = cards.filter((card) => (!favoritesOnly || card.isFavorite) && (!normalizedSearch || `${card.title} ${card.content}`.toLocaleLowerCase().includes(normalizedSearch)))

  const beginEdit = (card: RememberedYouCard) => {
    setEditingId(card.id)
    setForm({ title: card.title, content: card.content })
    setShowForm(true)
    setFeedback('')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!persistence) return
    try {
      if (editingId) await persistence.updateRememberedYouCard(editingId, form)
      else await persistence.createRememberedYouCard(form)
      setForm(emptyForm())
      setEditingId(undefined)
      setShowForm(false)
      setFeedback('')
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : t('our.validation.generic'))
    }
  }

  return <section className="remember-you">
    <SectionHeader title={t('our.rememberYou.title')} action={<SecondaryButton onClick={() => { setEditingId(undefined); setForm(emptyForm()); setShowForm((value) => !value); setFeedback('') }}>{t('our.actions.add')}</SecondaryButton>} />
    {showForm ? <form className="our-data-form" onSubmit={(event) => void submit(event)}>
      <label>{t('our.fields.title')}<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
      <label className="our-data-form__wide">{t('our.fields.content')}<textarea required aria-invalid={[...form.content].length > 100} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /><span>{[...form.content].length} / 100</span></label>
      <div className="our-data-form__actions"><SecondaryButton onClick={() => setShowForm(false)}>{t('common.cancel')}</SecondaryButton><PrimaryButton type="submit">{t('our.actions.save')}</PrimaryButton></div>
    </form> : null}
    <SearchBar placeholder={t('our.rememberYou.searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} />
    <div className="remember-you__filters" role="group" aria-label={t('our.rememberYou.filterLabel')}><FilterChip selected={!favoritesOnly} onClick={() => setFavoritesOnly(false)}>{t('our.rememberYou.all')}</FilterChip><FilterChip selected={favoritesOnly} onClick={() => setFavoritesOnly(true)}>{t('our.rememberYou.favoritesOnly')}</FilterChip></div>
    {shown.length === 0 ? <p className="our-empty-state">{cards.length === 0 ? t('our.rememberYou.empty') : t('our.rememberYou.noResults')}</p> : <div className="remember-you__list">{shown.map((card) => <article className="remember-card" key={card.id}><time dateTime={card.localDate}>{new Date(`${card.localDate}T00:00:00`).toLocaleDateString(locale)}</time><h3>{card.title}</h3><p>{card.content}</p><button className={`remember-card__favorite ${card.isFavorite ? 'is-active' : ''}`} type="button" aria-label={t(card.isFavorite ? 'our.rememberYou.unfavorite' : 'our.rememberYou.favorite')} aria-pressed={card.isFavorite} onClick={() => { if (persistence) void persistence.toggleRememberedYouFavorite(card.id) }}><img src={ourAssets.rememberYou.favorite} alt="" /></button><div className="remember-card__actions"><button type="button" onClick={() => beginEdit(card)}>{t('our.rememberYou.edit')}</button><button type="button" onClick={() => setDeleteTarget(card)}>{t('our.rememberYou.delete')}</button></div></article>)}</div>}
    <p className="mock-feedback" aria-live="polite">{feedback}</p>
    <ConfirmDialog open={Boolean(deleteTarget)} title={t('our.actions.deleteConfirmTitle')} description={t('our.actions.deleteConfirmBody')} onCancel={() => setDeleteTarget(undefined)} onConfirm={() => { if (deleteTarget && persistence) void persistence.deleteRememberedYouCard(deleteTarget.id); setDeleteTarget(undefined) }} />
  </section>
}
