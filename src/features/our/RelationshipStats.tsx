import { footprintsAssets, ourAssets, todayAssets } from '../../assets/uiAssets'
import { useI18n } from '../../i18n/I18nContext'
import { usePersistence } from '../../data/PersistenceStateContext'
import type { TranslationKey } from '../../i18n/messages'

export function RelationshipStats() {
  const { t } = useI18n()
  const persistence = usePersistence()
  const stats: Array<{ label: TranslationKey; value: number; icon: string }> = [
    { label: 'our.stats.heartScore', value: persistence?.starHeartTotal ?? 0, icon: todayAssets.starHeart },
    { label: 'our.stats.clearDays', value: 0, icon: footprintsAssets.clearRecordDrop },
    { label: 'our.stats.diaries', value: persistence?.diaryCount ?? 0, icon: footprintsAssets.diaryNotebook },
    { label: 'our.stats.reveals', value: 0, icon: ourAssets.frames.heart },
  ]
  return <section className="our-stats" aria-label={t('our.stats.label')}>{stats.map((stat) => <article className="our-stat" key={stat.label}><img src={stat.icon} alt="" /><span>{t(stat.label)}</span><strong>{stat.value}</strong></article>)}</section>
}
