import { useEffect, useState } from 'react'
import { footprintsAssets, todayAssets } from '../../assets/uiAssets'
import { usePersistence } from '../../data/PersistenceStateContext'
import type { MoodKey } from '../../data/types'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'
import { deriveMonthlyFootprintStats, type MonthlyFootprintStats } from './footprintsData'

const emptyStats: MonthlyFootprintStats = { diaryCount: 0, moodDayCount: 0, monthlyScore: 0 }
const moodIcons: Record<MoodKey, string> = {
  flutter: todayAssets.moods.flutter,
  happy: todayAssets.moods.happy,
  peaceful: todayAssets.moods.peaceful,
  miss: todayAssets.moods.miss,
  uneasy: todayAssets.moods.uneasy,
  sad: todayAssets.moods.sad,
  rumination: todayAssets.moods.rumination,
}

export function MonthlyStats() {
  const { locale, t } = useI18n()
  const persistence = usePersistence()
  const [stats, setStats] = useState<MonthlyFootprintStats>(emptyStats)
  const numberFormatter = new Intl.NumberFormat(locale)

  useEffect(() => {
    let active = true
    if (!persistence) {
      setStats(emptyStats)
      return () => { active = false }
    }
    void Promise.all([
      persistence.repositories.diaries.getDiaries(),
      persistence.repositories.moods.getMoods(),
      persistence.repositories.scores.getAwards(),
    ]).then(([diaries, moods, awards]) => {
      if (active) setStats(deriveMonthlyFootprintStats(persistence.currentLocalDate, diaries, moods, awards))
    })
    return () => { active = false }
  }, [persistence, persistence?.diaryCount, persistence?.starHeartTotal, persistence?.todayMood?.updatedAt])

  const cards: Array<{ label: TranslationKey; value: string; icon: string; tone: string }> = [
    { label: 'footprints.stats.monthlyDiary', value: t('footprints.stats.monthlyDiary.value', { count: numberFormatter.format(stats.diaryCount) }), icon: footprintsAssets.diaryNotebook, tone: 'pink' },
    { label: 'footprints.stats.moodDays', value: t('footprints.stats.moodDays.value', { count: numberFormatter.format(stats.moodDayCount) }), icon: todayAssets.moods.happy, tone: 'yellow' },
    { label: 'footprints.stats.topMood', value: stats.topMood ? t(`today.mood.${stats.topMood}` as TranslationKey) : t('footprints.stats.empty'), icon: stats.topMood ? moodIcons[stats.topMood] : footprintsAssets.mainIcon, tone: 'purple' },
    { label: 'footprints.stats.monthlyHeartScore', value: t('footprints.stats.monthlyHeartScore.value', { count: numberFormatter.format(stats.monthlyScore) }), icon: todayAssets.starHeart, tone: 'blue' },
  ]

  return (
    <section className="monthly-stats" aria-label={t('footprints.stats.label')}>
      {cards.map((card) => <article aria-label={t('footprints.stats.itemAria', { label: t(card.label), value: card.value })} className={`monthly-stat monthly-stat--${card.tone}`} key={card.label}>
        <img src={card.icon} alt="" aria-hidden="true" />
        <div aria-hidden="true"><span>{t(card.label)}</span><strong>{card.value}</strong></div>
      </article>)}
    </section>
  )
}
