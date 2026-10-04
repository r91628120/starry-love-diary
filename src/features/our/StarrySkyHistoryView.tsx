import { useState } from 'react'
import { SecondaryButton, SoftCard } from '../../components'
import type { CompletedHeartTalk } from '../../data/types'
import { starrySkyTopicById } from './starrySkyTopics'
import { useI18n } from '../../i18n/I18nContext'

export type StarrySkyHistoryViewProps = {
  records: readonly CompletedHeartTalk[]
  onDeleteOne(recordId: string): Promise<void> | void
  onClearAll(): Promise<void> | void
}

function localDate(value: string) { return new Date(`${value}T00:00:00`) }

/** Shared production/preview presentation. Persistence remains outside this component. */
export function StarrySkyHistoryView({ records, onDeleteOne, onClearAll }: StarrySkyHistoryViewProps) {
  const { locale, t } = useI18n()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ type: 'one'; id: string } | { type: 'all' } | null>(null)
  const dateLabel = (date: string) => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(localDate(date))
  const remove = async () => {
    if (!confirm) return
    if (confirm.type === 'all') await onClearAll()
    else await onDeleteOne(confirm.id)
    setConfirm(null)
    setExpanded(null)
  }
  return <>
    <SoftCard className="starry-sky-history-count" tone="purple">{t('our.starrySky.count', { count: records.length })}</SoftCard>
    {records.length === 0 ? <SoftCard className="starry-sky-history-empty" tone="cream"><h2>{t('our.starrySky.historyEmptyTitle')}</h2><p>{t('our.starrySky.historyEmptyBody')}</p></SoftCard> : <><SecondaryButton onClick={() => setConfirm({ type: 'all' })}>{t('our.starrySky.historyClearAll')}</SecondaryButton><section className="starry-sky-history-list" aria-labelledby="starry-sky-history-heading"><h2 id="starry-sky-history-heading">{t('our.starrySky.historyHeading')}</h2>{records.map((record) => { const topic = record.topicType === 'official' ? starrySkyTopicById(record.questionId) : undefined; const isExpanded = expanded === record.id; return <SoftCard className="starry-sky-history-card" key={record.id}><button type="button" className="starry-sky-history-card__toggle" aria-expanded={isExpanded} onClick={() => setExpanded(isExpanded ? null : record.id)}><span className="starry-sky-history-card__topic">{record.topicType === 'official' ? <><b>{record.questionId}</b><p lang="zh-TW">{topic?.text ?? record.questionId}</p></> : <p>{t('our.starrySky.historyCustomLabel')}</p>}</span><span>{dateLabel(record.localDate)} · {record.startTime}–{record.endTime} <b aria-hidden="true">{isExpanded ? '⌃' : '⌄'}</b></span></button>{isExpanded ? <div className="starry-sky-history-card__details"><dl><div><dt>{t('our.starrySky.historyDate')}</dt><dd>{dateLabel(record.localDate)}</dd></div><div><dt>{t('our.starrySky.historyTime')}</dt><dd>{record.startTime}–{record.endTime}</dd></div></dl><SecondaryButton onClick={() => setConfirm({ type: 'one', id: record.id })}>{t('our.starrySky.historyDeleteOne')}</SecondaryButton></div> : null}</SoftCard> })}</section></>}
    {confirm ? <div className="starry-sky-history-confirm" role="dialog" aria-modal="true" aria-labelledby="heart-talk-confirm-title"><SoftCard className="starry-sky-history-confirm__card" tone="cream"><h2 id="heart-talk-confirm-title">{t(confirm.type === 'all' ? 'our.starrySky.historyClearTitle' : 'our.starrySky.historyDeleteTitle')}</h2><p>{t(confirm.type === 'all' ? 'our.starrySky.historyClearBody' : 'our.starrySky.historyDeleteBody')}</p><div className="starry-sky-history-confirm__actions"><SecondaryButton onClick={() => setConfirm(null)}>{t('common.cancel')}</SecondaryButton><SecondaryButton onClick={() => void remove()}>{t(confirm.type === 'all' ? 'our.starrySky.historyClearConfirm' : 'our.starrySky.historyDeleteConfirm')}</SecondaryButton></div></SoftCard></div> : null}
  </>
}
