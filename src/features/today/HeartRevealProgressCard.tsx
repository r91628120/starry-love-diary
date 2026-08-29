import { useState } from 'react'
import { PrimaryButton, SectionHeader, SoftCard } from '../../components'
import { SparkleIcon } from '../../components/icons'
import { useI18n } from '../../i18n/I18nContext'

const CURRENT_PROGRESS = 3
const TOTAL_PROGRESS = 7

export function HeartRevealProgressCard() {
  const { t } = useI18n()
  const [showFeedback, setShowFeedback] = useState(false)

  return (
    <SoftCard className="heart-reveal-card" tone="yellow">
      <SectionHeader icon={<SparkleIcon />} title={t('today.heartReveal.title')} />
      <div className="heart-reveal-card__body">
        <div className="heart-reveal-card__photo">
          <img src="/images/heart-reveal-placeholder.svg" alt={t('today.heartReveal.imageAlt')} />
          <div className="heart-reveal-card__mask" aria-hidden="true">
            {Array.from({ length: TOTAL_PROGRESS }, (_, index) => <span className={index < CURRENT_PROGRESS ? 'is-revealed' : ''} key={index} />)}
          </div>
        </div>
        <div className="heart-reveal-card__status">
          <strong>{t('today.heartReveal.progress', { current: CURRENT_PROGRESS, total: TOTAL_PROGRESS })}</strong>
          <p>{t('today.heartReveal.availableToday')}</p>
          <PrimaryButton onClick={() => setShowFeedback(true)}>{t('today.heartReveal.continue')}</PrimaryButton>
        </div>
      </div>
      <p className="mock-feedback" aria-live="polite">{showFeedback ? t('today.heartReveal.feedback') : ''}</p>
    </SoftCard>
  )
}
