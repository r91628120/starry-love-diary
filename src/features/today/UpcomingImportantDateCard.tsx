import { SectionHeader, SoftCard } from '../../components'
import { CalendarIcon } from '../../components/icons'
import { useI18n } from '../../i18n/I18nContext'

export function UpcomingImportantDateCard() {
  const { t } = useI18n()

  return (
    <SoftCard className="upcoming-date-card">
      <SectionHeader icon={<CalendarIcon />} title={t('today.upcomingImportantDate')} />
      <div className="upcoming-date-card__event">
        <time dateTime="2026-08-30">{t('today.upcoming.date')}</time>
        <strong>{t('today.upcoming.event')}</strong>
        <span>{t('today.upcoming.daysRemaining', { days: 7 })}</span>
      </div>
    </SoftCard>
  )
}
