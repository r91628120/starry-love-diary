import { useState } from 'react'
import { PageHeader } from '../components'
import type { CompletedHeartTalk } from '../data/types'
import { StarrySkyHistoryView } from '../features/our/StarrySkyHistoryView'
import { type CompletedHeartTalk as DemoHeartTalk, starrySkyHistoryDemoRecords } from '../features/our/starrySkyHistoryDemo'
import { useI18n } from '../i18n/I18nContext'
import '../features/our/our.css'

type HistoryPageProps = { records?: readonly DemoHeartTalk[] }

function previewRecords(source: readonly DemoHeartTalk[]): CompletedHeartTalk[] {
  return source.map((record, index) => record.type === 'official'
    ? { id: `preview-heart-talk-${index}`, topicType: 'official', questionId: record.topicId, localDate: record.date, startTime: record.startTime, endTime: record.endTime, createdAt: '2026-12-22T00:00:00.000Z', updatedAt: '2026-12-22T00:00:00.000Z' }
    : { id: `preview-heart-talk-${index}`, topicType: 'custom', localDate: record.date, startTime: record.startTime, endTime: record.endTime, createdAt: '2026-12-22T00:00:00.000Z', updatedAt: '2026-12-22T00:00:00.000Z' })
}

/** Preview intentionally owns only in-memory fixture state; it never accesses persistence. */
export function StarrySkyHistoryPreviewPage({ records = starrySkyHistoryDemoRecords }: HistoryPageProps) {
  const { t } = useI18n()
  const [preview, setPreview] = useState(() => previewRecords(records))
  return <div className="page our-page starry-sky-page starry-sky-history-page"><PageHeader titleKey="our.starrySky.historyTitle" variant="secondary" backFallback="/our/starry-sky" /><main className="our-page__content starry-sky-page__content">
    <section className="starry-sky-history-hero"><img src="/assets/starry-sky/starry-sky-hero-bg.png" alt="" /><div><h2>{t('our.starrySky.historyTitle')}</h2><p>{t('our.starrySky.historyHeroCopy')}</p></div></section>
    <StarrySkyHistoryView records={preview} onDeleteOne={(id) => setPreview((current) => current.filter((record) => record.id !== id))} onClearAll={() => setPreview([])} />
  </main></div>
}
