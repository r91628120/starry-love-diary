import { useState } from 'react'
import { PageHeader, SearchBar } from '../components'
import { BottleHeroCard } from '../features/star-bottle/BottleHeroCard'
import { StarEntryList } from '../features/star-bottle/StarEntryList'
import { StarStats } from '../features/star-bottle/StarStats'
import { TimeRangeFilter, type TimeRange } from '../features/star-bottle/TimeRangeFilter'
import { useI18n } from '../i18n/I18nContext'
import '../features/star-bottle/star-bottle.css'
import { usePersistence } from '../data/PersistenceStateContext'
import { toLocalDate } from '../services/localDateService'
import { filterStarsByRange } from '../features/star-bottle/filterStars'

export function StarBottlePage() {
  const { t } = useI18n()
  const [range, setRange] = useState<TimeRange>('today')
  const [search, setSearch] = useState('')
  const persistence = usePersistence()
  const rangedStars = filterStarsByRange(persistence?.stars ?? [], range, toLocalDate())
  const visibleStars = rangedStars.filter((star) => `${star.title ?? ''} ${star.content}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))

  return (
    <div className="page star-bottle-page">
      <PageHeader titleKey="starBottle.title" brandOnly />
      <main className="star-bottle-page__content">
        <div className="star-bottle-page__title" aria-hidden="true">{t('starBottle.title')}</div>
        <BottleHeroCard />
        <TimeRangeFilter value={range} onChange={setRange} />
        <StarStats stars={rangedStars} />
        <SearchBar className="star-bottle-search" placeholder={t('starBottle.searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} />
        <StarEntryList entries={visibleStars} />
      </main>
    </div>
  )
}
