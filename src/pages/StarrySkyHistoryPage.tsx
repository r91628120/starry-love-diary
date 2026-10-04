import { useEffect, useState } from 'react'
import { PageHeader } from '../components'
import { usePersistence } from '../data/PersistenceStateContext'
import type { CompletedHeartTalk } from '../data/types'
import { StarrySkyHistoryView } from '../features/our/StarrySkyHistoryView'
import { useI18n } from '../i18n/I18nContext'
import '../features/our/our.css'

export function StarrySkyHistoryPage() {
  const { t } = useI18n()
  const persistence = usePersistence()
  const [records, setRecords] = useState<CompletedHeartTalk[]>([])
  const refresh = async () => { setRecords(await persistence?.repositories.completedHeartTalks.list() ?? []); await persistence?.refreshHeartTalkCount() }
  useEffect(() => { void (async () => { setRecords(await persistence?.repositories.completedHeartTalks.list() ?? []); await persistence?.refreshHeartTalkCount() })() }, [persistence])
  return <div className="page our-page starry-sky-page starry-sky-history-page"><PageHeader titleKey="our.starrySky.historyTitle" variant="secondary" backFallback="/our/starry-sky" /><main className="our-page__content starry-sky-page__content">
    <section className="starry-sky-history-hero"><img src="/assets/starry-sky/starry-sky-hero-bg.png" alt="" /><div><h2>{t('our.starrySky.historyTitle')}</h2><p>{t('our.starrySky.historyHeroCopy')}</p></div></section>
    <StarrySkyHistoryView records={records} onDeleteOne={async (id) => { await persistence?.repositories.completedHeartTalks.deleteOne(id); await refresh() }} onClearAll={async () => { await persistence?.repositories.completedHeartTalks.clearAll(); await refresh() }} />
  </main></div>
}
