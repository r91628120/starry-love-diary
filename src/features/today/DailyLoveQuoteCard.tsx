import { useState } from 'react'
import { PrimaryButton, SectionHeader, SoftCard } from '../../components'
import { ShareIcon, SparkleIcon } from '../../components/icons'
import { useI18n } from '../../i18n/I18nContext'
import { usePersistence } from '../../data/PersistenceStateContext'

export function DailyLoveQuoteCard() {
  const { t } = useI18n()
  const [showFeedback, setShowFeedback] = useState(false)
  const persistence = usePersistence()

  return (
    <SoftCard className="daily-love-quote" tone="pink">
      <SectionHeader icon={<SparkleIcon />} title={t('today.dailyQuote')} />
      <div className="daily-love-quote__meta">
        <time dateTime="2026-08-23">{t('today.dailyQuote.date')}</time>
        <span aria-hidden="true">✦</span>
        <span>{t('today.dayNumber', { day: 128 })}</span>
      </div>
      <blockquote>{t('today.dailyQuote.text')}</blockquote>
      <PrimaryButton className="daily-love-quote__share" onClick={async () => { await persistence?.shareDailyQuote(); setShowFeedback(true) }}><ShareIcon />{t('today.share')}</PrimaryButton>
      <p className="mock-feedback" aria-live="polite">{showFeedback ? t('today.share.feedback') : ''}</p>
    </SoftCard>
  )
}
