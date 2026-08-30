import { useEffect, useState } from 'react'
import { PrimaryButton, SectionHeader, SoftCard } from '../../components'
import { ShareIcon, SparkleIcon } from '../../components/icons'
import { useI18n } from '../../i18n/I18nContext'
import { usePersistence } from '../../data/PersistenceStateContext'
import { toLocalDate } from '../../services/localDateService'
import { formatDailyLoveQuoteDate, getDailyLoveQuote, getDailyLoveQuoteDayIndex, shareDailyLoveQuote } from './dailyLoveQuoteRuntime'

function useCurrentLocalDate(initialLocalDate: string) {
  const [currentLocalDate, setCurrentLocalDate] = useState(initialLocalDate)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const scheduleNextLocalDay = () => {
      const now = new Date()
      const nextLocalDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = globalThis.setTimeout(() => {
        setCurrentLocalDate(toLocalDate())
        scheduleNextLocalDay()
      }, nextLocalDay.getTime() - now.getTime() + 100)
    }
    scheduleNextLocalDay()
    return () => globalThis.clearTimeout(timer)
  }, [])

  return currentLocalDate
}

export function DailyLoveQuoteCard() {
  const { locale, t } = useI18n()
  const [showFeedback, setShowFeedback] = useState(false)
  const persistence = usePersistence()
  const currentLocalDate = useCurrentLocalDate(persistence?.currentLocalDate ?? toLocalDate())
  const activationDate = persistence?.settings.dailyLoveQuoteActivationDate ?? currentLocalDate
  const dayIndex = getDailyLoveQuoteDayIndex(activationDate, currentLocalDate)
  const quote = getDailyLoveQuote(locale, dayIndex)

  async function handleShare() {
    try {
      const shared = await shareDailyLoveQuote(quote, t('today.dailyQuote'))
      if (!shared) return
      await persistence?.shareDailyQuote()
      setShowFeedback(true)
    } catch {
      // Closing the system share sheet is not an application error.
    }
  }

  return (
    <SoftCard className="daily-love-quote" tone="pink">
      <SectionHeader icon={<SparkleIcon />} title={t('today.dailyQuote')} />
      <div className="daily-love-quote__meta">
        <time dateTime={currentLocalDate}>{formatDailyLoveQuoteDate(currentLocalDate, locale)}</time>
        <span aria-hidden="true">✦</span>
        <span>{t('today.dayNumber', { day: dayIndex })}</span>
      </div>
      <blockquote>{quote}</blockquote>
      <PrimaryButton className="daily-love-quote__share" onClick={handleShare}><ShareIcon />{t('today.share')}</PrimaryButton>
      <p className="mock-feedback" aria-live="polite">{showFeedback ? t('today.share.feedback') : ''}</p>
    </SoftCard>
  )
}
