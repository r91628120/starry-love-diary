import { PageHeader } from '../components'
import { ImportantDatesCard } from '../features/our/ImportantDatesCard'
import { MemoryWall } from '../features/our/MemoryWall'
import { MessageCard } from '../features/our/MessageCard'
import { MomentCarousel } from '../features/our/MomentCarousel'
import { RelationshipStats } from '../features/our/RelationshipStats'
import { RememberYou } from '../features/our/RememberYou'
import { useI18n } from '../i18n/I18nContext'
import '../features/our/our.css'

export function OurPage() {
  const { t } = useI18n()
  return <div className="page our-page"><PageHeader titleKey="our.title" brandOnly /><main className="our-page__content"><div className="our-page__title" aria-hidden="true">♡ {t('our.title')} ♡</div><MemoryWall /><RelationshipStats /><ImportantDatesCard /><MomentCarousel /><MessageCard /><RememberYou /></main></div>
}
