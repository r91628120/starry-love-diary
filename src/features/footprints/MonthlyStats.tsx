import { footprintsAssets, todayAssets } from '../../assets/uiAssets'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'

const stats: Array<{ label: TranslationKey; value: TranslationKey; icon: string; tone: string }> = [
  { label: 'footprints.stats.monthlyDiary', value: 'footprints.stats.monthlyDiary.value', icon: footprintsAssets.diaryNotebook, tone: 'pink' },
  { label: 'footprints.stats.moodDays', value: 'footprints.stats.moodDays.value', icon: todayAssets.moods.happy, tone: 'yellow' },
  { label: 'footprints.stats.topMood', value: 'footprints.stats.topMood.value', icon: todayAssets.moods.miss, tone: 'purple' },
  { label: 'footprints.stats.monthlyHeartScore', value: 'footprints.stats.monthlyHeartScore.value', icon: todayAssets.starHeart, tone: 'blue' },
]

export function MonthlyStats() {
  const { t } = useI18n()
  return (
    <section className="monthly-stats" aria-label={t('footprints.stats.label')}>
      {stats.map((stat) => (
        <article className={`monthly-stat monthly-stat--${stat.tone}`} key={stat.label}>
          <img src={stat.icon} alt="" aria-hidden="true" />
          <div><span>{t(stat.label)}</span><strong>{t(stat.value)}</strong></div>
        </article>
      ))}
    </section>
  )
}
