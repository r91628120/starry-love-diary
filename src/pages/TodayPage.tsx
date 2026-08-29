import { PageHeader } from '../components'
import { CoupleProfileHero } from '../features/today/CoupleProfileHero'
import { DailyLoveQuoteCard } from '../features/today/DailyLoveQuoteCard'
import { HeartLineCard } from '../features/today/HeartLineCard'
import { HeartRevealProgressCard } from '../features/today/HeartRevealProgressCard'
import { MoodSelector } from '../features/today/MoodSelector'
import { TodayHeroArtwork } from '../features/today/TodayHeroArtwork'
import { UpcomingImportantDateCard } from '../features/today/UpcomingImportantDateCard'
import '../features/today/today.css'

export function TodayPage() {
  return (
    <div className="page today-page">
      <PageHeader titleKey="today.title" brandOnly />
      <main className="today-page__content">
        <TodayHeroArtwork />
        <CoupleProfileHero />
        <DailyLoveQuoteCard />
        <MoodSelector />
        <div className="today-page__journal-grid">
          <HeartLineCard />
          <HeartRevealProgressCard />
        </div>
        <UpcomingImportantDateCard />
      </main>
    </div>
  )
}
