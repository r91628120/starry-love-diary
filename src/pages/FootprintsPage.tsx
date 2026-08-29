import { useState } from 'react'
import { footprintsAssets } from '../assets/uiAssets'
import { PageHeader, SearchBar } from '../components'
import { CalendarCard } from '../features/footprints/CalendarCard'
import { FootprintsHero } from '../features/footprints/FootprintsHero'
import { MonthlyStats } from '../features/footprints/MonthlyStats'
import { RecentFootprints } from '../features/footprints/RecentFootprints'
import { TodayDiaryCard } from '../features/footprints/TodayDiaryCard'
import { useI18n } from '../i18n/I18nContext'
import '../features/footprints/footprints.css'

export function FootprintsPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  return (
    <div className="page footprints-page">
      <PageHeader titleKey="footprints.title" brandOnly />
      <main className="footprints-page__content">
        <div className="footprints-page__title" aria-hidden="true"><img src={footprintsAssets.mainIcon} alt="" />{t('footprints.title')}</div>
        <FootprintsHero />
        <CalendarCard />
        <MonthlyStats />
        <SearchBar className="footprints-search" icon={<img src={footprintsAssets.searchIcon} alt="" aria-hidden="true" />} placeholder={t('footprints.searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} />
        <TodayDiaryCard />
        <RecentFootprints />
      </main>
    </div>
  )
}
