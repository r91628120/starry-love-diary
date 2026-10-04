import { PageHeader, SoftCard } from '../components'
import { type CompletedHeartTalk, starrySkyHistoryDemoRecords } from '../features/our/starrySkyHistoryDemo'
import { starrySkyTopicById } from '../features/our/starrySkyTopics'
import { useI18n } from '../i18n/I18nContext'
import '../features/our/our.css'

type HistoryPageProps = { records?: readonly CompletedHeartTalk[] }

function localDate(value: string) { return new Date(`${value}T00:00:00`) }

export function StarrySkyHistoryPreviewPage({ records = starrySkyHistoryDemoRecords }: HistoryPageProps) {
  const { locale, t } = useI18n()
  const sortedRecords = [...records].sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`))
  const dateLabel = (date: string) => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(localDate(date))
  const monthLabel = (date: string) => new Intl.DateTimeFormat(locale, { month: 'long' }).format(localDate(date))
  const dayLabel = (date: string) => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(localDate(date))
  const yearGroups = [...new Set(sortedRecords.map((record) => record.date.slice(0, 4)))]

  return <div className="page our-page starry-sky-page starry-sky-history-page">
    <PageHeader titleKey="our.starrySky.historyTitle" variant="secondary" backFallback="/our/starry-sky" />
    <main className="our-page__content starry-sky-page__content">
      <section className="starry-sky-history-hero"><img src="/assets/starry-sky/starry-sky-hero-bg.png" alt="" /><div><h2>{t('our.starrySky.historyTitle')}</h2><p>{t('our.starrySky.historyHeroCopy')}</p></div></section>
      <SoftCard className="starry-sky-history-count" tone="purple">{t('our.starrySky.count', { count: sortedRecords.length })}</SoftCard>
      {sortedRecords.length === 0 ? <SoftCard className="starry-sky-history-empty" tone="cream"><h2>{t('our.starrySky.historyEmptyTitle')}</h2><p>{t('our.starrySky.historyEmptyBody')}</p></SoftCard> : <section className="starry-sky-history-list" aria-labelledby="starry-sky-history-heading"><h2 id="starry-sky-history-heading">{t('our.starrySky.historyHeading')}</h2>{yearGroups.map((year) => {
        const recordsForYear = sortedRecords.filter((record) => record.date.startsWith(year))
        const months = [...new Set(recordsForYear.map((record) => record.date.slice(0, 7)))]
        return <section className="starry-sky-history-year" key={year}><h3>{year}</h3>{months.map((month) => { const recordsForMonth = recordsForYear.filter((record) => record.date.startsWith(month)); const days = [...new Set(recordsForMonth.map((record) => record.date))]; return <section className="starry-sky-history-month" key={month}><h4>{monthLabel(`${month}-01`)}</h4>{days.map((day) => <section className="starry-sky-history-day" key={day}><h5>{dayLabel(day)}</h5>{recordsForMonth.filter((record) => record.date === day).map((record) => <SoftCard className="starry-sky-history-card" key={`${record.type}-${record.date}-${record.startTime}`}><div className="starry-sky-history-card__topic">{record.type === 'official' ? <>{(() => { const topic = starrySkyTopicById(record.topicId); if (!topic) throw new Error(`Missing official Starry Sky topic: ${record.topicId}`); return <><span>{topic.id}</span><p lang="zh-TW">{topic.text}</p></> })()}</> : <p>{t('our.starrySky.historyCustomLabel')}</p>}</div><dl><div><dt>{t('our.starrySky.historyDate')}</dt><dd>{dateLabel(record.date)}</dd></div><div><dt>{t('our.starrySky.historyTime')}</dt><dd>{record.startTime}–{record.endTime}</dd></div></dl></SoftCard>)}</section>)}</section> })}</section>
      })}</section>}
    </main>
  </div>
}
