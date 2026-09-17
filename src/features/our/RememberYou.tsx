import { useMemo, useState, type FormEvent } from 'react'
import { ourAssets } from '../../assets/uiAssets'
import { ConfirmDialog, FilterChip, PrimaryButton, SearchBar, SecondaryButton, SectionHeader } from '../../components'
import { usePersistence } from '../../data/PersistenceStateContext'
import type { RememberedYouCard } from '../../data/types'
import { useI18n } from '../../i18n/I18nContext'
import type { Locale, TranslationKey } from '../../i18n/messages'
import { formatOurLocalDate, formatOurNumber, getOurValidationKey } from './ourFormatters'
import './remember-you-groups.css'
import { groupRememberedYouCards } from './rememberYouGrouping'

const emptyForm = () => ({ title: '', content: '' })

export function RememberYou() {
  const { locale, t } = useI18n()
  const persistence = usePersistence()
  const cards = persistence?.rememberedYouCards
  const [search, setSearch] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string>()
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<RememberedYouCard>()
  const [feedbackKey, setFeedbackKey] = useState<TranslationKey>()
  const [expandedYears, setExpandedYears] = useState<Set<string>>(() => new Set())
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => new Set())
  const [touchedYears, setTouchedYears] = useState<Set<string>>(() => new Set())
  const [touchedMonths, setTouchedMonths] = useState<Set<string>>(() => new Set())
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const shown = useMemo(() => (cards ?? [])
    .filter((card) => (!favoritesOnly || card.isFavorite) && (!normalizedSearch || `${card.title} ${card.content}`.toLocaleLowerCase().includes(normalizedSearch)))
    .sort((left, right) => right.localDate.localeCompare(left.localDate) || right.createdAt.localeCompare(left.createdAt)), [cards, favoritesOnly, normalizedSearch])
  const groups = useMemo(() => groupRememberedYouCards(shown), [shown])
  const searchActive = normalizedSearch.length > 0

  const beginEdit = (card: RememberedYouCard) => {
    setEditingId(card.id)
    setForm({ title: card.title, content: card.content })
    setShowForm(true)
    setFeedbackKey(undefined)
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
      setFeedbackKey('our.actions.saved')
    } catch (caught) {
      setFeedbackKey(getOurValidationKey(caught))
    }
  }

  return <section className="remember-you">
    <SectionHeader title={t('our.rememberYou.title')} action={<SecondaryButton onClick={() => { setEditingId(undefined); setForm(emptyForm()); setShowForm((value) => !value); setFeedbackKey(undefined) }}>{t('our.actions.add')}</SecondaryButton>} />
    {showForm ? <form className="our-data-form" onSubmit={(event) => void submit(event)}>
      <label>{t('our.fields.title')}<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
      <label className="our-data-form__wide">{t('our.fields.content')}<textarea required aria-invalid={[...form.content].length > 100} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /><span>{t('our.message.characterCount', { current: formatOurNumber([...form.content].length, locale), max: formatOurNumber(100, locale) })}</span></label>
      <div className="our-data-form__actions"><SecondaryButton onClick={() => setShowForm(false)}>{t('common.cancel')}</SecondaryButton><PrimaryButton type="submit">{t('our.actions.save')}</PrimaryButton></div>
    </form> : null}
    <SearchBar placeholder={t('our.rememberYou.searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} />
    <div className="remember-you__filters" role="group" aria-label={t('our.rememberYou.filterLabel')}><FilterChip selected={!favoritesOnly} onClick={() => setFavoritesOnly(false)}>{t('our.rememberYou.all')}</FilterChip><FilterChip selected={favoritesOnly} onClick={() => setFavoritesOnly(true)}>{t('our.rememberYou.favoritesOnly')}</FilterChip></div>
    {shown.length === 0 ? <p className="our-empty-state">{(cards?.length ?? 0) === 0 ? t('our.rememberYou.empty') : t('our.rememberYou.noResults')}</p> : <div className="remember-you__groups">{groups.map((yearGroup, yearIndex) => {
      const yearExpanded = searchActive || (touchedYears.has(yearGroup.year) ? expandedYears.has(yearGroup.year) : yearIndex === 0)
      const yearId = `remember-you-year-${yearGroup.year}`
      return <section className="remember-you__year-group" key={yearGroup.year}>
        <button type="button" className="remember-you__year-toggle" aria-expanded={yearExpanded} aria-controls={yearId} aria-label={t(yearExpanded ? 'our.rememberYou.group.collapse' : 'our.rememberYou.group.expand', { label: formatRememberedYear(yearGroup.year, locale) })} onClick={() => { setTouchedYears((current) => addToSet(current, yearGroup.year)); setExpandedYears((current) => toggleSet(current, yearGroup.year, !yearExpanded)) }}><span aria-hidden="true">{yearExpanded ? '▼' : '▶'}</span><strong>{formatRememberedYear(yearGroup.year, locale)}</strong></button>
        {yearExpanded ? <div id={yearId} className="remember-you__year-content">{yearGroup.months.map((monthGroup, monthIndex) => {
          const monthExpanded = searchActive || (touchedMonths.has(monthGroup.key) ? expandedMonths.has(monthGroup.key) : yearIndex === 0 && monthIndex === 0)
          const monthId = `remember-you-month-${monthGroup.key}`
          return <section className="remember-you__month-group" key={monthGroup.key}>
            <button type="button" className="remember-you__month-toggle" aria-expanded={monthExpanded} aria-controls={monthId} aria-label={t(monthExpanded ? 'our.rememberYou.group.collapse' : 'our.rememberYou.group.expand', { label: formatRememberedMonth(monthGroup.key, locale) })} onClick={() => { setTouchedMonths((current) => addToSet(current, monthGroup.key)); setExpandedMonths((current) => toggleSet(current, monthGroup.key, !monthExpanded)) }}><span aria-hidden="true">{monthExpanded ? '▼' : '▶'}</span><span>{formatRememberedMonth(monthGroup.key, locale)}</span><small>{formatOurNumber(monthGroup.cards.length, locale)}</small></button>
            {monthExpanded ? <div id={monthId} className="remember-you__list">{monthGroup.cards.map((card) => <RememberedYouCardView key={card.id} card={card} locale={locale} beginEdit={beginEdit} onDelete={() => setDeleteTarget(card)} onToggleFavorite={() => { if (persistence) void persistence.toggleRememberedYouFavorite(card.id).catch(() => setFeedbackKey('our.validation.generic')) }} t={t} />)}</div> : null}
          </section>
        })}</div> : null}
      </section>
    })}</div>}
    <p className="mock-feedback" aria-live="polite">{feedbackKey ? t(feedbackKey) : ''}</p>
    <ConfirmDialog open={Boolean(deleteTarget)} title={t('our.actions.deleteConfirmTitle')} description={t('our.actions.deleteConfirmBody')} onCancel={() => setDeleteTarget(undefined)} onConfirm={() => { if (deleteTarget && persistence) void persistence.deleteRememberedYouCard(deleteTarget.id).catch(() => setFeedbackKey('our.validation.generic')); setDeleteTarget(undefined) }} />
  </section>
}

function RememberedYouCardView({ card, locale, beginEdit, onDelete, onToggleFavorite, t }: { card: RememberedYouCard; locale: Locale; beginEdit: (card: RememberedYouCard) => void; onDelete: () => void; onToggleFavorite: () => void; t: (key: TranslationKey, values?: Record<string, string | number>) => string }) {
  return <article className="remember-card"><time dateTime={card.localDate}>{formatOurLocalDate(card.localDate, locale)}</time><h3>{card.title}</h3><p>{card.content}</p><button className={`remember-card__favorite ${card.isFavorite ? 'is-active' : ''}`} type="button" aria-label={t(card.isFavorite ? 'our.rememberYou.unfavorite' : 'our.rememberYou.favorite')} aria-pressed={card.isFavorite} onClick={onToggleFavorite}><img src={ourAssets.rememberYou.favorite} alt="" aria-hidden="true" /></button><div className="remember-card__actions"><button type="button" onClick={() => beginEdit(card)}>{t('our.actions.edit')}</button><button type="button" onClick={onDelete}>{t('our.actions.delete')}</button></div></article>
}

function formatRememberedYear(year: string, locale: string) { return new Intl.DateTimeFormat(locale, { year: 'numeric', timeZone: 'UTC' }).format(new Date(`${year}-01-01T00:00:00Z`)) }
function formatRememberedMonth(yearMonth: string, locale: string) { return new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(new Date(`${yearMonth}-01T00:00:00Z`)) }
function addToSet(current: Set<string>, key: string) { return new Set(current).add(key) }
function toggleSet(current: Set<string>, key: string, shouldInclude: boolean) {
  const next = new Set(current)
  if (shouldInclude) next.add(key)
  else next.delete(key)
  return next
}
