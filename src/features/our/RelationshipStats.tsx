import { footprintsAssets, ourAssets, todayAssets } from '../../assets/uiAssets'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'

const stats: Array<{ label: TranslationKey; value: TranslationKey; icon: string }> = [
  { label: 'our.stats.heartScore', value: 'our.stats.heartScore.value', icon: todayAssets.starHeart },
  { label: 'our.stats.clearDays', value: 'our.stats.clearDays.value', icon: footprintsAssets.clearRecordDrop },
  { label: 'our.stats.diaries', value: 'our.stats.diaries.value', icon: footprintsAssets.diaryNotebook },
  { label: 'our.stats.reveals', value: 'our.stats.reveals.value', icon: ourAssets.frames.heart },
]

export function RelationshipStats() {
  const { t } = useI18n()
  return <section className="our-stats" aria-label={t('our.stats.label')}>{stats.map((stat) => <article className="our-stat" key={stat.label}><img src={stat.icon} alt="" /><span>{t(stat.label)}</span><strong>{t(stat.value)}</strong></article>)}</section>
}
