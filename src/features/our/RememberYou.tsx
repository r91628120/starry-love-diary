import { useMemo, useState } from 'react'
import { ourAssets } from '../../assets/uiAssets'
import { FilterChip, SearchBar, SectionHeader } from '../../components'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'

const initialCards: Array<{ id: number; title: TranslationKey; body: TranslationKey; date: TranslationKey; favorite: boolean }> = [
  { id: 1, title: 'our.rememberYou.one.title', body: 'our.rememberYou.one.body', date: 'our.rememberYou.one.date', favorite: true },
  { id: 2, title: 'our.rememberYou.two.title', body: 'our.rememberYou.two.body', date: 'our.rememberYou.two.date', favorite: false },
  { id: 3, title: 'our.rememberYou.three.title', body: 'our.rememberYou.three.body', date: 'our.rememberYou.three.date', favorite: true },
  { id: 4, title: 'our.rememberYou.four.title', body: 'our.rememberYou.four.body', date: 'our.rememberYou.four.date', favorite: false },
]

export function RememberYou() {
  const { t } = useI18n(); const [cards, setCards] = useState(initialCards); const [search, setSearch] = useState(''); const [favoritesOnly, setFavoritesOnly] = useState(false); const [feedback, setFeedback] = useState('')
  const shown = useMemo(() => cards.filter((card) => (!favoritesOnly || card.favorite) && `${t(card.title)} ${t(card.body)}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())), [cards, favoritesOnly, search, t])
  const toggle = (id: number) => setCards((current) => current.map((card) => card.id === id ? { ...card, favorite: !card.favorite } : card))
  return <section className="remember-you"><SectionHeader title={t('our.rememberYou.title')} /><SearchBar placeholder={t('our.rememberYou.searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} /><div className="remember-you__filters" role="group" aria-label={t('our.rememberYou.filterLabel')}><FilterChip selected={!favoritesOnly} onClick={() => setFavoritesOnly(false)}>{t('our.rememberYou.all')}</FilterChip><FilterChip selected={favoritesOnly} onClick={() => setFavoritesOnly(true)}>{t('our.rememberYou.favoritesOnly')}</FilterChip></div>
    <div className="remember-you__list">{shown.map((card) => <article className="remember-card" key={card.id}><time>{t(card.date)}</time><h3>{t(card.title)}</h3><p>{t(card.body)}</p><button className={`remember-card__favorite ${card.favorite ? 'is-active' : ''}`} type="button" aria-label={t(card.favorite ? 'our.rememberYou.unfavorite' : 'our.rememberYou.favorite')} aria-pressed={card.favorite} onClick={() => toggle(card.id)}><img src={ourAssets.rememberYou.favorite} alt="" /></button><div className="remember-card__actions"><button type="button" onClick={() => setFeedback(t('our.rememberYou.editFeedback'))}>{t('our.rememberYou.edit')}</button><button type="button" onClick={() => setFeedback(t('our.rememberYou.deleteFeedback'))}>{t('our.rememberYou.delete')}</button></div></article>)}</div><p className="mock-feedback" aria-live="polite">{feedback}</p>
  </section>
}
