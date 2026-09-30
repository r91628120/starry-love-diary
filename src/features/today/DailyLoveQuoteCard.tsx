import { useState } from 'react'
import { PrimaryButton, SectionHeader, SoftCard } from '../../components'
import { ShareIcon, SparkleIcon } from '../../components/icons'
import { useI18n } from '../../i18n/I18nContext'
import { usePersistence } from '../../data/PersistenceStateContext'
import { toLocalDate } from '../../services/localDateService'
import { formatDailyLoveQuoteDate, formatDailyLoveQuoteSharePayload, getDailyLoveQuote, getDailyLoveQuoteDayIndex, shareDailyLoveQuote } from './dailyLoveQuoteRuntime'
import type { TranslationKey } from '../../i18n/messages'

export function DailyLoveQuoteCard() {
  const { locale, t } = useI18n()
  const [feedbackKey, setFeedbackKey] = useState<TranslationKey>()
  const [sharing, setSharing] = useState(false)
  const persistence = usePersistence()
  const currentLocalDate = persistence?.currentLocalDate ?? toLocalDate()
  const activationDate = persistence?.settings.dailyLoveQuoteActivationDate ?? currentLocalDate
  const dayIndex = getDailyLoveQuoteDayIndex(activationDate, currentLocalDate)
  const quote = getDailyLoveQuote(locale, dayIndex)

  async function handleShare() {
    if (sharing) return
    setSharing(true)
    setFeedbackKey(undefined)
    try {
      const result = await shareDailyLoveQuote(formatDailyLoveQuoteSharePayload({
        quote,
        title: t('today.dailyQuote'),
        date: formatDailyLoveQuoteDate(currentLocalDate, locale),
        dayNumber: t('today.dayNumber', { day: dayIndex }),
        appName: t('app.brand'),
      }), t('today.dailyQuote'))
      if (result === 'shared' || result === 'copied') {
        await persistence?.shareDailyQuote()
        setFeedbackKey(result === 'shared' ? 'today.share.shared' : 'today.share.copied')
      } else if (result === 'error' || result === 'pending') {
        setFeedbackKey('today.share.error')
      }
    } catch {
      setFeedbackKey('today.share.error')
    } finally {
      setSharing(false)
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
      <PrimaryButton className="daily-love-quote__share" onClick={() => void handleShare()} disabled={sharing} aria-busy={sharing}><ShareIcon />{t('today.share')}</PrimaryButton>
      <p className="mock-feedback" aria-live="polite">{feedbackKey ? t(feedbackKey) : ''}</p>
    </SoftCard>
  )
}
