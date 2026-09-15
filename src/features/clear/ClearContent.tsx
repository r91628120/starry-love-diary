import { useCallback, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { clearAssets } from '../../assets/uiAssets'
import { ConfirmDialog, PrimaryButton, SecondaryButton, SectionHeader, SoftCard } from '../../components'
import type { ClearToolSourceType, ClearTriggerType } from '../../data/clearTypes'
import { usePersistence } from '../../data/PersistenceStateContext'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'
import { LikeOrHabitFlow } from './LikeOrHabitFlow'
import { LoveBoatFlow } from './LoveBoatFlow'
import { LoveBrainFlow } from './LoveBrainFlow'
import { OrganizeFeelingsFlow } from './OrganizeFeelingsFlow'

type Tool = 'home' | 'organize' | 'boat' | 'brain' | 'like'
interface HistoryView {
  id: string
  sourceType: ClearToolSourceType
  localDate: string
  title: string
  subtitle: string
  createdAt: string
  hasStar: boolean
}

interface ClearHistoryMonthGroup {
  monthKey: string
  records: HistoryView[]
}

interface ClearHistoryYearGroup {
  year: string
  months: ClearHistoryMonthGroup[]
}

const scenarios: Array<{ key: TranslationKey; icon: string; trigger: ClearTriggerType; tool: Exclude<Tool, 'home'>; recommendation: TranslationKey }> = [
  { key: 'clear.scenarios.miss', icon: clearAssets.scenarios.miss, trigger: 'missing_them', tool: 'organize', recommendation: 'clear.scenarios.recommendation.organize' },
  { key: 'clear.scenarios.waitingMessage', icon: clearAssets.scenarios.waitingMessage, trigger: 'waiting_response', tool: 'organize', recommendation: 'clear.scenarios.recommendation.organize' },
  { key: 'clear.scenarios.tooDeep', icon: clearAssets.scenarios.tooDeep, trigger: 'overthinking', tool: 'brain', recommendation: 'clear.scenarios.recommendation.brain' },
  { key: 'clear.scenarios.unsureFeelings', icon: clearAssets.scenarios.unsureFeelings, trigger: 'other', tool: 'like', recommendation: 'clear.scenarios.recommendation.like' },
  { key: 'clear.scenarios.unsureFit', icon: clearAssets.scenarios.unsureFit, trigger: 'other', tool: 'boat', recommendation: 'clear.scenarios.recommendation.boat' },
]
const tools: Array<{ id: Tool; title: TranslationKey; description: TranslationKey; icon: string }> = [
  { id: 'organize', title: 'clear.tools.organize.title', description: 'clear.tools.organize.description', icon: clearAssets.tools.organizeFeelings },
  { id: 'boat', title: 'clear.tools.boatGuide.title', description: 'clear.tools.boatGuide.description', icon: clearAssets.tools.boatGuide },
  { id: 'brain', title: 'clear.tools.loveBrain.title', description: 'clear.tools.loveBrain.description', icon: clearAssets.tools.loveBrainTest },
  { id: 'like', title: 'clear.tools.likeOrHabit.title', description: 'clear.tools.likeOrHabit.description', icon: clearAssets.tools.likeOrHabit },
]

export function ClearContent() {
  const { t, locale } = useI18n()
  const persistence = usePersistence()
  const searchParams = new URLSearchParams(window.location.search)
  const requestedRecordId = searchParams.get('recordId')
  const requestedSourceType = searchParams.get('sourceType')
  const [tool, setTool] = useState<Tool>('home')
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null)
  const [history, setHistory] = useState<HistoryView[]>([])
  const [selectedRecord, setSelectedRecord] = useState<HistoryView>()
  const [deleteRecord, setDeleteRecord] = useState<HistoryView>()
  const [deleteStarToo, setDeleteStarToo] = useState(false)
  const [savedSourceIds, setSavedSourceIds] = useState<string[]>([])
  const [draftProgress, setDraftProgress] = useState<Partial<Record<Tool, string>>>({})
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [expandedHistoryYears, setExpandedHistoryYears] = useState<Set<string>>(() => new Set())
  const [touchedHistoryYears, setTouchedHistoryYears] = useState<Set<string>>(() => new Set())
  const [expandedHistoryMonths, setExpandedHistoryMonths] = useState<Set<string>>(() => new Set())
  const [touchedHistoryMonths, setTouchedHistoryMonths] = useState<Set<string>>(() => new Set())
  const key = (value: string) => value as TranslationKey

  const loadHistory = useCallback(async () => {
    if (!persistence) { setHistory([]); return }
    const [clearRecords, boats, brains, reflections, boatDraft, brainDraft, reflectionDraft] = await Promise.all([
      persistence.repositories.clearRecords.list(),
      persistence.repositories.loveBoatAssessments.list(),
      persistence.repositories.loveBrainAssessments.list(),
      persistence.repositories.likeOrHabitReflections.list(),
      persistence.repositories.loveBoatAssessments.getActiveDraft(),
      persistence.repositories.loveBrainAssessments.getActiveDraft(),
      persistence.repositories.likeOrHabitReflections.getActiveDraft(),
    ])
    const entries: HistoryView[] = [
      ...clearRecords.map((record) => ({ id: record.id, sourceType: 'clear_record' as const, localDate: record.localDate, title: t('clear.history.clearRecord'), subtitle: record.triggerText || record.facts || t('clear.organize.closing'), createdAt: record.createdAt, hasStar: Boolean(record.clearMindStarId) })),
      ...boats.map((record) => ({ id: record.id, sourceType: 'love_boat_code' as const, localDate: record.localDate, title: t('clear.history.loveBoat'), subtitle: record.crossResultKey ? t(key('clear.boat.result.' + record.crossResultKey)) : t('clear.boat.level.response_insufficient_observation'), createdAt: record.createdAt, hasStar: Boolean(record.clearMindStarId) })),
      ...brains.map((record) => ({ id: record.id, sourceType: 'love_brain_assessment' as const, localDate: record.localDate, title: t('clear.history.loveBrain'), subtitle: record.isLowOverall ? t('clear.brain.low') : record.primaryPattern ? t(key('clear.brain.pattern.' + record.primaryPattern)) : t('clear.brain.tie'), createdAt: record.createdAt, hasStar: Boolean(record.clearMindStarId) })),
      ...reflections.map((record) => ({ id: record.id, sourceType: 'like_or_habit' as const, localDate: record.localDate, title: t('clear.history.likeOrHabit'), subtitle: t(key('clear.like.result.' + (record.resultVariantKey ?? 'unclear.v1') + '.title')), createdAt: record.createdAt, hasStar: Boolean(record.clearMindStarId) })),
    ].sort(sortClearHistory)
    setHistory(entries)
    const requestedRecord = entries.find((entry) => entry.id === requestedRecordId && entry.sourceType === requestedSourceType)
    if (requestedRecord) setSelectedRecord(requestedRecord)
    setDraftProgress({
      boat: boatDraft ? t('clear.common.draftProgress', { current: boatDraft.currentQuestionIndex + 1, total: boatDraft.currentSection === 'A' ? 12 : 10 }) : undefined,
      brain: brainDraft ? t('clear.common.draftProgress', { current: brainDraft.currentQuestionIndex + 1, total: 25 }) : undefined,
      like: reflectionDraft ? t('clear.common.draftProgress', { current: Math.max(1, ['real_person', 'habit', 'fear_of_loss', 'imagined_relationship'].indexOf(reflectionDraft.currentSection) + 1), total: 4 }) : undefined,
    })
  }, [persistence, requestedRecordId, requestedSourceType, t])

  useEffect(() => { void loadHistory() }, [loadHistory])

  async function deleteSelected() {
    if (!persistence || !deleteRecord) return
    if (deleteRecord.sourceType === 'clear_record') await persistence.repositories.clearRecords.delete(deleteRecord.id, deleteStarToo)
    if (deleteRecord.sourceType === 'love_boat_code') await persistence.repositories.loveBoatAssessments.delete(deleteRecord.id, deleteStarToo)
    if (deleteRecord.sourceType === 'love_brain_assessment') await persistence.repositories.loveBrainAssessments.delete(deleteRecord.id, deleteStarToo)
    if (deleteRecord.sourceType === 'like_or_habit') await persistence.repositories.likeOrHabitReflections.delete(deleteRecord.id, deleteStarToo)
    setDeleteRecord(undefined)
    setSelectedRecord(undefined)
    setDeleteStarToo(false)
    await persistence.refreshScoreAndStars()
    await loadHistory()
  }

  async function saveSelectedStar() {
    if (!persistence || !selectedRecord) return
    if (selectedRecord.sourceType === 'clear_record') await persistence.repositories.clearRecords.saveAsClearMindStar(selectedRecord.id)
    if (selectedRecord.sourceType === 'love_boat_code') await persistence.repositories.loveBoatAssessments.saveAsClearMindStar(selectedRecord.id)
    if (selectedRecord.sourceType === 'love_brain_assessment') await persistence.repositories.loveBrainAssessments.saveAsClearMindStar(selectedRecord.id)
    if (selectedRecord.sourceType === 'like_or_habit') await persistence.repositories.likeOrHabitReflections.saveAsClearMindStar(selectedRecord.id)
    setSavedSourceIds((ids) => [...ids, selectedRecord.id])
    await persistence.refreshScoreAndStars()
    await loadHistory()
  }

  function returnHome() {
    setTool('home')
    setSelectedRecord(undefined)
    void loadHistory()
  }

  if (tool === 'organize') return <ClearToolContext title={t('clear.tools.organize.title')}><OrganizeFeelingsFlow initialTrigger={selectedScenario === null ? undefined : scenarios[selectedScenario].trigger} onDone={returnHome} /></ClearToolContext>
  if (tool === 'boat') return <ClearToolContext title={t('clear.tools.boatGuide.title')}><LoveBoatFlow onDone={returnHome} /></ClearToolContext>
  if (tool === 'brain') return <ClearToolContext title={t('clear.tools.loveBrain.title')}><LoveBrainFlow onDone={returnHome} /></ClearToolContext>
  if (tool === 'like') return <ClearToolContext title={t('clear.tools.likeOrHabit.title')}><LikeOrHabitFlow onDone={returnHome} /></ClearToolContext>

  if (selectedRecord) {
    const saved = selectedRecord.hasStar || savedSourceIds.includes(selectedRecord.id)
    return <section className="clear-flow"><SecondaryButton onClick={() => setSelectedRecord(undefined)}>{t('clear.home')}</SecondaryButton><SoftCard className="clear-result" tone="blue"><p className="clear-flow__eyebrow">{formatDate(selectedRecord.localDate, locale)}</p><h2>{selectedRecord.title}</h2><p>{selectedRecord.subtitle}</p><div className="clear-flow__actions"><PrimaryButton disabled={saved} onClick={saveSelectedStar}>{t(saved ? 'clear.common.savedStar' : 'clear.common.saveStar')}</PrimaryButton><SecondaryButton onClick={() => setDeleteRecord(selectedRecord)}>{t('clear.history.delete')}</SecondaryButton></div></SoftCard><DeleteDialog record={deleteRecord} deleteStarToo={deleteStarToo} setDeleteStarToo={setDeleteStarToo} onConfirm={deleteSelected} onCancel={() => setDeleteRecord(undefined)} /></section>
  }

  const latest = history[0]
  const historyGroups = groupClearHistory(history)
  const scenario = selectedScenario === null ? undefined : scenarios[selectedScenario]
  const recommendedTool = scenario ? tools.find((item) => item.id === scenario.tool) : undefined
  return <>
    <SoftCard className="clear-scenarios"><SectionHeader title={t('clear.scenarios.title')} /><div className="clear-scenarios__rail" role="group" aria-label={t('clear.scenarios.title')}>{scenarios.map((item, index) => <button type="button" className={selectedScenario === index ? 'is-active' : ''} aria-pressed={selectedScenario === index} onClick={() => setSelectedScenario(index)} key={item.key}><img src={item.icon} alt="" /><span>{t(item.key)}</span></button>)}</div>{scenario && recommendedTool ? <section className="clear-scenario-recommendation" aria-label={t('clear.scenarios.recommendation.label')} aria-live="polite"><p className="clear-flow__eyebrow">{t('clear.scenarios.selected', { scenario: t(scenario.key) })}</p><div className="clear-scenario-recommendation__heading"><img src={recommendedTool.icon} alt="" /><div><span>{t('clear.scenarios.recommendation.label')}</span><h3>{t(recommendedTool.title)}</h3></div></div><p>{t(scenario.recommendation)}</p><div className="clear-scenario-recommendation__actions"><PrimaryButton onClick={() => setTool(recommendedTool.id)}>{t('clear.scenarios.recommendation.cta', { tool: t(recommendedTool.title) })}</PrimaryButton></div></section> : null}</SoftCard>
    <section id="clear-tools" className="clear-tools" aria-label={t('clear.tools.label')}>{tools.map((item, index) => <button type="button" className={index === 0 ? 'clear-tool clear-tool--primary' : 'clear-tool'} onClick={() => setTool(item.id)} key={item.id}><img src={item.icon} alt="" /><div><h2>{t(item.title)}</h2><p>{draftProgress[item.id] ?? t(item.description)}</p></div></button>)}</section>
    <SoftCard className="clear-latest"><SectionHeader title={t('clear.latest.title')} />{latest ? <><div className="clear-latest__body"><img src={clearAssets.recentSummaryThumbnail} alt={t('clear.latest.imageAlt')} /><div><time dateTime={latest.localDate}>{formatDate(latest.localDate, locale)}</time><h3>{latest.title}</h3><strong>{t('clear.latest.summaryLabel')}</strong><p>{latest.subtitle}</p><span>{t('clear.latest.saved')}</span></div></div><SecondaryButton onClick={() => setSelectedRecord(latest)}>{t('clear.latest.viewDetails')}</SecondaryButton></> : <p className="clear-empty">{t('clear.empty')}</p>}</SoftCard>
    <section className="clear-records"><SectionHeader title={t('clear.history.title')} />
      {history.length === 0 ? <p className="clear-empty">{t('clear.empty')}</p> : showAllHistory ? <ClearHistoryGroups groups={historyGroups} locale={locale} t={t} onSelect={setSelectedRecord} expandedYears={expandedHistoryYears} touchedYears={touchedHistoryYears} setExpandedYears={setExpandedHistoryYears} setTouchedYears={setTouchedHistoryYears} expandedMonths={expandedHistoryMonths} touchedMonths={touchedHistoryMonths} setExpandedMonths={setExpandedHistoryMonths} setTouchedMonths={setTouchedHistoryMonths} /> : <ClearHistoryCards records={history.slice(0, 3)} locale={locale} onSelect={setSelectedRecord} />}
      {history.length > 3 ? <SecondaryButton onClick={() => setShowAllHistory((value) => !value)}>{t(showAllHistory ? 'clear.history.showRecent' : 'clear.history.viewAll')}</SecondaryButton> : null}
    </section>
    <SoftCard className="clear-quote"><img className="clear-quote__background" src={clearAssets.quoteBanner} alt="" /><div><SectionHeader title={t('clear.quote.title')} /><blockquote>{t('clear.quote.text')}</blockquote></div></SoftCard>
    <SoftCard className="clear-tip"><img src={clearAssets.tip} alt="" /><div><h2>{t('clear.tip.title')}</h2><p>{t('clear.tip.text')}</p></div></SoftCard>
  </>
}

function ClearToolContext({ title, children }: { title: string; children: ReactNode }) {
  return <section className="clear-tool-context"><h2 className="clear-tool-context__name">{title}</h2>{children}</section>
}

function DeleteDialog({ record, deleteStarToo, setDeleteStarToo, onConfirm, onCancel }: { record?: HistoryView; deleteStarToo: boolean; setDeleteStarToo: (value: boolean) => void; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useI18n()
  return <ConfirmDialog open={Boolean(record)} title={t('clear.history.deleteTitle')} description={record?.hasStar ? t('clear.history.deleteWithStar') : t('clear.history.deleteBody')} onConfirm={onConfirm} onCancel={onCancel}>{record?.hasStar ? <label className="clear-delete-star"><input type="checkbox" checked={deleteStarToo} onChange={(event) => setDeleteStarToo(event.target.checked)} />{t('clear.history.deleteStarToo')}</label> : null}</ConfirmDialog>
}

function ClearHistoryGroups({ groups, locale, t, onSelect, expandedYears, touchedYears, setExpandedYears, setTouchedYears, expandedMonths, touchedMonths, setExpandedMonths, setTouchedMonths }: {
  groups: ClearHistoryYearGroup[]
  locale: string
  t: ReturnType<typeof useI18n>['t']
  onSelect: (record: HistoryView) => void
  expandedYears: Set<string>
  touchedYears: Set<string>
  setExpandedYears: Dispatch<SetStateAction<Set<string>>>
  setTouchedYears: Dispatch<SetStateAction<Set<string>>>
  expandedMonths: Set<string>
  touchedMonths: Set<string>
  setExpandedMonths: Dispatch<SetStateAction<Set<string>>>
  setTouchedMonths: Dispatch<SetStateAction<Set<string>>>
}) {
  return <div className="clear-history-groups">{groups.map((yearGroup, yearIndex) => {
    const yearExpanded = touchedYears.has(yearGroup.year) ? expandedYears.has(yearGroup.year) : yearIndex === 0
    const yearContentId = `clear-history-year-${yearGroup.year}`
    return <section className="clear-history-year" key={yearGroup.year}>
      <button type="button" className="clear-history-year__toggle" aria-expanded={yearExpanded} aria-controls={yearContentId} aria-label={t(yearExpanded ? 'clear.history.group.collapse' : 'clear.history.group.expand', { label: yearGroup.year })} onClick={() => {
        setTouchedYears((current) => new Set(current).add(yearGroup.year))
        setExpandedYears((current) => setExpanded(current, yearGroup.year, !yearExpanded))
      }}><span aria-hidden="true">{yearExpanded ? '⌄' : '›'}</span><strong>{yearGroup.year}</strong></button>
      {yearExpanded ? <div id={yearContentId} className="clear-history-year__content">{yearGroup.months.map((monthGroup, monthIndex) => {
        const monthExpanded = touchedMonths.has(monthGroup.monthKey) ? expandedMonths.has(monthGroup.monthKey) : yearIndex === 0 && monthIndex === 0
        const monthLabel = formatHistoryMonth(monthGroup.monthKey, locale)
        const monthContentId = `clear-history-month-${monthGroup.monthKey}`
        return <section className="clear-history-month" key={monthGroup.monthKey}>
          <button type="button" className="clear-history-month__toggle" aria-expanded={monthExpanded} aria-controls={monthContentId} aria-label={t(monthExpanded ? 'clear.history.group.collapse' : 'clear.history.group.expand', { label: monthLabel })} onClick={() => {
            setTouchedMonths((current) => new Set(current).add(monthGroup.monthKey))
            setExpandedMonths((current) => setExpanded(current, monthGroup.monthKey, !monthExpanded))
          }}><span aria-hidden="true">{monthExpanded ? '⌄' : '›'}</span><span>{monthLabel}</span><small>{t('clear.history.group.count', { count: monthGroup.records.length })}</small></button>
          {monthExpanded ? <div id={monthContentId} className="clear-history-month__content"><ClearHistoryCards records={monthGroup.records} locale={locale} onSelect={onSelect} /></div> : null}
        </section>
      })}</div> : null}
    </section>
  })}</div>
}

function ClearHistoryCards({ records, locale, onSelect }: { records: HistoryView[]; locale: string; onSelect: (record: HistoryView) => void }) {
  return <div className="clear-history-cards">{records.map((record) => <button type="button" className="clear-record-button" key={record.sourceType + record.id} onClick={() => onSelect(record)}><img src={recordIcon(record.sourceType)} alt="" /><div><h3>{record.title}</h3><time dateTime={record.localDate}>{formatDate(record.localDate, locale)}</time><p>{record.subtitle}</p></div><span aria-hidden="true">›</span></button>)}</div>
}

function groupClearHistory(records: HistoryView[]): ClearHistoryYearGroup[] {
  const years = new Map<string, Map<string, HistoryView[]>>()
  for (const record of records) {
    const year = record.localDate.slice(0, 4)
    const monthKey = record.localDate.slice(0, 7)
    const months = years.get(year) ?? new Map<string, HistoryView[]>()
    months.set(monthKey, [...(months.get(monthKey) ?? []), record])
    years.set(year, months)
  }
  return [...years.entries()].sort(([left], [right]) => right.localeCompare(left)).map(([year, months]) => ({
    year,
    months: [...months.entries()].sort(([left], [right]) => right.localeCompare(left)).map(([monthKey, monthRecords]) => ({ monthKey, records: monthRecords })),
  }))
}

function sortClearHistory(left: HistoryView, right: HistoryView) {
  return right.localDate.localeCompare(left.localDate)
    || right.createdAt.localeCompare(left.createdAt)
    || right.id.localeCompare(left.id)
}

function formatHistoryMonth(monthKey: string, locale: string) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)))
}

function setExpanded(current: Set<string>, value: string, expanded: boolean) {
  const next = new Set(current)
  if (expanded) next.add(value)
  else next.delete(value)
  return next
}

function formatDate(localDate: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(localDate + 'T00:00:00'))
}

function recordIcon(sourceType: ClearToolSourceType) {
  if (sourceType === 'clear_record') return clearAssets.records.organizeFeelings
  if (sourceType === 'love_boat_code') return clearAssets.records.boatGuide
  return clearAssets.records.likeOrHabit
}
