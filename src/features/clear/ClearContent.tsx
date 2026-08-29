import { useCallback, useEffect, useState } from 'react'
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

const scenarios: Array<{ key: TranslationKey; icon: string; trigger: ClearTriggerType }> = [
  { key: 'clear.scenarios.miss', icon: clearAssets.scenarios.miss, trigger: 'missing_them' },
  { key: 'clear.scenarios.waitingMessage', icon: clearAssets.scenarios.waitingMessage, trigger: 'waiting_response' },
  { key: 'clear.scenarios.tooDeep', icon: clearAssets.scenarios.tooDeep, trigger: 'overthinking' },
  { key: 'clear.scenarios.unsureFeelings', icon: clearAssets.scenarios.unsureFeelings, trigger: 'other' },
  { key: 'clear.scenarios.unsureFit', icon: clearAssets.scenarios.unsureFit, trigger: 'other' },
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
  const [tool, setTool] = useState<Tool>('home')
  const [selectedScenario, setSelectedScenario] = useState(0)
  const [history, setHistory] = useState<HistoryView[]>([])
  const [selectedRecord, setSelectedRecord] = useState<HistoryView>()
  const [deleteRecord, setDeleteRecord] = useState<HistoryView>()
  const [deleteStarToo, setDeleteStarToo] = useState(false)
  const [savedSourceIds, setSavedSourceIds] = useState<string[]>([])
  const [draftProgress, setDraftProgress] = useState<Partial<Record<Tool, string>>>({})
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
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    setHistory(entries)
    setDraftProgress({
      boat: boatDraft ? t('clear.common.draftProgress', { current: boatDraft.currentQuestionIndex + 1, total: boatDraft.currentSection === 'A' ? 12 : 10 }) : undefined,
      brain: brainDraft ? t('clear.common.draftProgress', { current: brainDraft.currentQuestionIndex + 1, total: 25 }) : undefined,
      like: reflectionDraft ? t('clear.common.draftProgress', { current: Math.max(1, ['real_person', 'habit', 'fear_of_loss', 'imagined_relationship'].indexOf(reflectionDraft.currentSection) + 1), total: 4 }) : undefined,
    })
  }, [persistence, t])

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

  if (tool === 'organize') return <OrganizeFeelingsFlow initialTrigger={scenarios[selectedScenario].trigger} onDone={returnHome} />
  if (tool === 'boat') return <LoveBoatFlow onDone={returnHome} />
  if (tool === 'brain') return <LoveBrainFlow onDone={returnHome} />
  if (tool === 'like') return <LikeOrHabitFlow onDone={returnHome} />

  if (selectedRecord) {
    const saved = selectedRecord.hasStar || savedSourceIds.includes(selectedRecord.id)
    return <section className="clear-flow"><SecondaryButton onClick={() => setSelectedRecord(undefined)}>{t('clear.home')}</SecondaryButton><SoftCard className="clear-result" tone="blue"><p className="clear-flow__eyebrow">{formatDate(selectedRecord.localDate, locale)}</p><h2>{selectedRecord.title}</h2><p>{selectedRecord.subtitle}</p><div className="clear-flow__actions"><PrimaryButton disabled={saved} onClick={saveSelectedStar}>{t(saved ? 'clear.common.savedStar' : 'clear.common.saveStar')}</PrimaryButton><SecondaryButton onClick={() => setDeleteRecord(selectedRecord)}>{t('clear.history.delete')}</SecondaryButton></div></SoftCard><DeleteDialog record={deleteRecord} deleteStarToo={deleteStarToo} setDeleteStarToo={setDeleteStarToo} onConfirm={deleteSelected} onCancel={() => setDeleteRecord(undefined)} /></section>
  }

  const latest = history[0]
  return <>
    <SoftCard className="clear-scenarios"><SectionHeader title={t('clear.scenarios.title')} /><div className="clear-scenarios__rail" role="group" aria-label={t('clear.scenarios.title')}>{scenarios.map((item, index) => <button type="button" className={selectedScenario === index ? 'is-active' : ''} aria-pressed={selectedScenario === index} onClick={() => setSelectedScenario(index)} key={item.key}><img src={item.icon} alt="" /><span>{t(item.key)}</span></button>)}</div><p className="mock-feedback" aria-live="polite">{t('clear.scenarios.selected', { scenario: t(scenarios[selectedScenario].key) })}</p></SoftCard>
    <section className="clear-tools" aria-label={t('clear.tools.label')}>{tools.map((item, index) => <button type="button" className={index === 0 ? 'clear-tool clear-tool--primary' : 'clear-tool'} onClick={() => setTool(item.id)} key={item.id}><img src={item.icon} alt="" /><div><h2>{t(item.title)}</h2><p>{draftProgress[item.id] ?? t(item.description)}</p></div></button>)}</section>
    <SoftCard className="clear-latest"><SectionHeader title={t('clear.latest.title')} />{latest ? <><div className="clear-latest__body"><img src={clearAssets.recentSummaryThumbnail} alt={t('clear.latest.imageAlt')} /><div><time dateTime={latest.localDate}>{formatDate(latest.localDate, locale)}</time><h3>{latest.title}</h3><strong>{t('clear.latest.summaryLabel')}</strong><p>{latest.subtitle}</p><span>{t('clear.latest.saved')}</span></div></div><SecondaryButton onClick={() => setSelectedRecord(latest)}>{t('clear.latest.viewDetails')}</SecondaryButton></> : <p className="clear-empty">{t('clear.empty')}</p>}</SoftCard>
    <section className="clear-records"><SectionHeader title={t('clear.history.title')} /><div>{history.slice(0, 5).map((record) => <button type="button" className="clear-record-button" key={record.sourceType + record.id} onClick={() => setSelectedRecord(record)}><img src={recordIcon(record.sourceType)} alt="" /><div><h3>{record.title}</h3><time dateTime={record.localDate}>{formatDate(record.localDate, locale)}</time><p>{record.subtitle}</p></div><span aria-hidden="true">›</span></button>)}</div>{history.length === 0 ? <p className="clear-empty">{t('clear.empty')}</p> : null}</section>
    <SoftCard className="clear-quote"><img className="clear-quote__background" src={clearAssets.quoteBanner} alt="" /><div><SectionHeader title={t('clear.quote.title')} /><blockquote>{t('clear.quote.text')}</blockquote></div></SoftCard>
    <SoftCard className="clear-tip"><img src={clearAssets.tip} alt="" /><div><h2>{t('clear.tip.title')}</h2><p>{t('clear.tip.text')}</p></div></SoftCard>
  </>
}

function DeleteDialog({ record, deleteStarToo, setDeleteStarToo, onConfirm, onCancel }: { record?: HistoryView; deleteStarToo: boolean; setDeleteStarToo: (value: boolean) => void; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useI18n()
  return <ConfirmDialog open={Boolean(record)} title={t('clear.history.deleteTitle')} description={record?.hasStar ? t('clear.history.deleteWithStar') : t('clear.history.deleteBody')} onConfirm={onConfirm} onCancel={onCancel}>{record?.hasStar ? <label className="clear-delete-star"><input type="checkbox" checked={deleteStarToo} onChange={(event) => setDeleteStarToo(event.target.checked)} />{t('clear.history.deleteStarToo')}</label> : null}</ConfirmDialog>
}

function formatDate(localDate: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(localDate + 'T00:00:00'))
}

function recordIcon(sourceType: ClearToolSourceType) {
  if (sourceType === 'clear_record') return clearAssets.records.organizeFeelings
  if (sourceType === 'love_boat_code') return clearAssets.records.boatGuide
  return clearAssets.records.likeOrHabit
}
