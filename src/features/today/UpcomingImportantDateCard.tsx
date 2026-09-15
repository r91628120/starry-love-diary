import { SecondaryButton, SectionHeader, SoftCard } from '../../components'
import { CalendarIcon } from '../../components/icons'
import { useNavigate } from 'react-router-dom'
import { usePersistence } from '../../data/PersistenceStateContext'
import { useI18n } from '../../i18n/I18nContext'
import { toLocalDate } from '../../services/localDateService'
import { formatUpcomingImportantDate, getNextUpcomingImportantDate } from './upcomingImportantDates'

export function UpcomingImportantDateCard() {
  const { locale, t } = useI18n()
  const persistence = usePersistence()
  const navigate = useNavigate()
  const nextImportantDate = getNextUpcomingImportantDate(persistence?.importantDates ?? [], persistence?.currentLocalDate ?? toLocalDate())
  const openImportantDates = (recordId?: string) => {
    const params = new URLSearchParams({ section: 'important-dates' })
    if (recordId) params.set('recordId', recordId)
    navigate(`/our?${params.toString()}`)
  }

  return (
    <SoftCard className="upcoming-date-card">
      <SectionHeader icon={<CalendarIcon />} title={t('today.upcomingImportantDate')} />
      {nextImportantDate ? <div className="upcoming-date-card__events"><button className="upcoming-date-card__event" type="button" onClick={() => openImportantDates(nextImportantDate.id)} aria-label={t('today.upcoming.open', { title: nextImportantDate.title })}>
        <strong>{nextImportantDate.title}</strong>
        <time dateTime={nextImportantDate.nextOccurrence}>{formatUpcomingImportantDate(nextImportantDate.nextOccurrence, locale)}</time>
        <span>{t('today.upcoming.daysRemaining', { days: new Intl.NumberFormat(locale).format(nextImportantDate.daysRemaining) })}</span>
      </button></div> : <div className="upcoming-date-card__empty"><p>{t('today.upcoming.empty')}</p><SecondaryButton onClick={() => openImportantDates()}>{t('today.upcoming.add')}</SecondaryButton></div>}
    </SoftCard>
  )
}
