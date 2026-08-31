import { starBottleAssets } from '../../assets/uiAssets'
import { useI18n } from '../../i18n/I18nContext'
import type { Star } from '../../data/types'

export function StarStats({ stars }: { stars: Star[] }) {
  const { locale, t } = useI18n()
  const numberFormatter = new Intl.NumberFormat(locale)
  const stats = [
    { label: 'starBottle.totalStars', value: stars.length, icon: starBottleAssets.pinkStars.smile, tone: 'total' },
    { label: 'starBottle.moodStars', value: stars.filter((star) => star.type === 'mood').length, icon: starBottleAssets.moodStar, tone: 'mood' },
    { label: 'starBottle.clearStars', value: stars.filter((star) => star.type === 'clear_mind').length, icon: starBottleAssets.clearStar, tone: 'clear' },
  ] as const

  return (
    <section className="star-stats" aria-label={t('starBottle.stats.label')}>
      {stats.map((stat) => (
        <article
          aria-label={t('starBottle.statAria', { label: t(stat.label), count: numberFormatter.format(stat.value) })}
          className={`star-stat star-stat--${stat.tone}`}
          key={stat.label}
        >
          <img src={stat.icon} alt="" aria-hidden="true" />
          <div aria-hidden="true"><span>{t(stat.label)}</span><strong>{numberFormatter.format(stat.value)}</strong></div>
        </article>
      ))}
    </section>
  )
}
