import { useState } from 'react'
import { starBottleAssets } from '../../assets/uiAssets'
import { PrimaryButton, SectionHeader } from '../../components'
import { useI18n } from '../../i18n/I18nContext'
import type { Star } from '../../data/types'
import type { TranslationKey } from '../../i18n/messages'

export function StarEntryList({ entries }: { entries: Star[] }) {
  const { locale, t } = useI18n()
  const [showFeedback, setShowFeedback] = useState(false)
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' })

  return (
    <section className="star-entry-section">
      <SectionHeader title={t('starBottle.recentStars')} icon={<span className="star-entry-section__sparkle" aria-hidden="true">✦</span>} />
      <div className="star-entry-list">
        {entries.map((entry) => {
          const isMood = entry.type === 'mood'
          const typeLabel = t(isMood ? 'starBottle.type.mood' : 'starBottle.type.clear')
          const sourceContent = entry.type === 'clear_mind' && entry.sourceType && ['clear_record', 'love_boat_code', 'love_brain_assessment', 'like_or_habit'].includes(entry.sourceType)
            ? t(('clear.star.' + entry.sourceType) as TranslationKey)
            : entry.content
          return (
            <article className={`star-entry star-entry--${isMood ? 'mood' : 'clear'}`} key={entry.id}>
              <img src={isMood ? starBottleAssets.moodStar : starBottleAssets.clearStar} alt="" aria-hidden="true" />
              <div className="star-entry__content">
                <strong>{typeLabel}</strong>
                <p>{sourceContent}</p>
                <div className="star-entry__meta"><time dateTime={entry.localDate}>{formatLocalDate(entry.localDate, dateFormatter)}</time><span>{typeLabel}</span></div>
              </div>
              <button className="star-entry__more" type="button" aria-label={t('starBottle.entry.more', { type: typeLabel })}>•••</button>
              <span className="star-entry__flower" aria-hidden="true">✿</span>
            </article>
          )
        })}
        {entries.length === 0 ? <p className="star-entry-list__empty">{t('starBottle.empty')}</p> : null}
      </div>
      <PrimaryButton className="star-entry-section__view-all" onClick={() => setShowFeedback(true)}>{t('starBottle.viewAll')}</PrimaryButton>
      <p className="mock-feedback" aria-live="polite">{showFeedback ? t('starBottle.viewAll.feedback') : ''}</p>
    </section>
  )
}

function formatLocalDate(localDate: string, formatter: Intl.DateTimeFormat) {
  const [year, month, day] = localDate.split('-').map(Number)
  return formatter.format(new Date(Date.UTC(year, month - 1, day)))
}
