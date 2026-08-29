import { useEffect, useState } from 'react'
import { ConfirmDialog, PrimaryButton, SecondaryButton, SoftCard } from '../../components'
import type { LoveBrainAnswer, LoveBrainAssessment } from '../../data/clearTypes'
import { LOVE_BRAIN_KEYS } from '../../data/repositories/clearRepositories'
import { usePersistence } from '../../data/PersistenceStateContext'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'

export function LoveBrainFlow({ onDone }: { onDone: () => void }) {
  const { t } = useI18n()
  const persistence = usePersistence()
  const [draft, setDraft] = useState<LoveBrainAssessment>()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(false)
  const [preview, setPreview] = useState(false)
  const [confirmRestart, setConfirmRestart] = useState(false)
  const [completed, setCompleted] = useState<LoveBrainAssessment>()
  const [savedStar, setSavedStar] = useState(false)
  const key = (value: string) => value as TranslationKey

  useEffect(() => {
    let mounted = true
    void persistence?.repositories.loveBrainAssessments.getActiveDraft().then((record) => {
      if (mounted) { setDraft(record); setLoading(false) }
    })
    if (!persistence) setLoading(false)
    return () => { mounted = false }
  }, [persistence])

  async function start() {
    if (persistence) setDraft(await persistence.repositories.loveBrainAssessments.createDraft())
  }
  async function restart() {
    if (!persistence) return
    setDraft(await persistence.repositories.loveBrainAssessments.restartDraft())
    setPreview(false)
    setConfirmRestart(false)
  }
  async function choose(answer: LoveBrainAnswer) {
    if (!persistence || !draft) return
    const question = LOVE_BRAIN_KEYS[draft.currentQuestionIndex]
    const answers = { ...draft.answers, [question]: answer }
    const finished = LOVE_BRAIN_KEYS.every((item) => answers[item] !== undefined)
    const updated = await persistence.repositories.loveBrainAssessments.updateDraft(draft.id, {
      answers,
      currentQuestionIndex: Math.min(draft.currentQuestionIndex + 1, LOVE_BRAIN_KEYS.length - 1),
    })
    setDraft(updated)
    if (finished) setPreview(true)
  }
  async function move(index: number) {
    if (!persistence || !draft) return
    setDraft(await persistence.repositories.loveBrainAssessments.updateDraft(draft.id, { currentQuestionIndex: Math.max(0, Math.min(LOVE_BRAIN_KEYS.length - 1, index)) }))
    setPreview(false)
  }
  async function finish() {
    if (!persistence || !draft) return
    setCompleted(await persistence.repositories.loveBrainAssessments.complete(draft.id))
  }
  async function saveStar() {
    if (!persistence || !completed) return
    await persistence.repositories.loveBrainAssessments.saveAsClearMindStar(completed.id)
    await persistence.refreshScoreAndStars()
    setSavedStar(true)
  }

  if (loading) return null
  if (completed) return <SoftCard className="clear-flow clear-result" tone="green"><h2>{t('clear.brain.completed')}</h2><BrainResult record={completed} /><div className="clear-flow__actions"><PrimaryButton onClick={saveStar} disabled={savedStar}>{t(savedStar ? 'clear.common.savedStar' : 'clear.common.saveStar')}</PrimaryButton><SecondaryButton onClick={onDone}>{t('clear.common.finishAndReturn')}</SecondaryButton></div></SoftCard>
  if (!draft) return <SoftCard className="clear-flow clear-intro" tone="purple"><SecondaryButton onClick={onDone}>{t('clear.home')}</SecondaryButton><h2>{t('clear.tools.loveBrain.title')}</h2><p>{t('clear.brain.intro')}</p><p>{t('clear.brain.duration')}</p><PrimaryButton onClick={start}>{t('clear.brain.start')}</PrimaryButton></SoftCard>
  if (preview) return <section className="clear-flow"><div className="clear-flow__top"><SecondaryButton onClick={() => setPreview(false)}>{t('clear.common.previous')}</SecondaryButton><SecondaryButton onClick={onDone}>{t('clear.common.continueLater')}</SecondaryButton></div><SoftCard className="clear-result" tone="purple"><BrainResult record={draft} /><PrimaryButton onClick={finish}>{t('clear.brain.finish')}</PrimaryButton></SoftCard><p>{t('clear.common.savedDraft')}</p></section>

  const question = LOVE_BRAIN_KEYS[draft.currentQuestionIndex]
  return <section className="clear-flow">
    <div className="clear-flow__top"><SecondaryButton onClick={onDone}>{t('clear.common.continueLater')}</SecondaryButton><span>{t('clear.common.progress', { current: draft.currentQuestionIndex + 1, total: 25 })}</span></div>
    <SoftCard><p className="clear-flow__eyebrow">{t('clear.tools.loveBrain.title')}</p><h2>{t(key('clear.brain.q.' + question))}</h2><div className="clear-answer-list">{([0, 1, 2, 3] as const).map((answer) => <button type="button" key={answer} className={draft.answers[question] === answer ? 'is-active' : ''} aria-pressed={draft.answers[question] === answer} onClick={() => choose(answer)}>{t(key('clear.boat.answer.' + answer))}</button>)}</div></SoftCard>
    <div className="clear-flow__actions"><SecondaryButton disabled={draft.currentQuestionIndex === 0} onClick={() => move(draft.currentQuestionIndex - 1)}>{t('clear.common.previous')}</SecondaryButton><SecondaryButton onClick={() => setOverview(!overview)}>{t('clear.common.overview')}</SecondaryButton><SecondaryButton disabled={draft.currentQuestionIndex === 24} onClick={() => move(draft.currentQuestionIndex + 1)}>{t('clear.common.next')}</SecondaryButton></div>
    {overview ? <SoftCard><div className="clear-question-grid">{LOVE_BRAIN_KEYS.map((item, index) => <button type="button" key={item} className={index === draft.currentQuestionIndex ? 'is-current' : draft.answers[item] !== undefined ? 'is-answered' : ''} onClick={() => move(index)}>{index + 1}</button>)}</div></SoftCard> : null}
    <SecondaryButton onClick={() => setConfirmRestart(true)}>{t('clear.common.restart')}</SecondaryButton><p>{t('clear.common.savedDraft')}</p>
    <ConfirmDialog open={confirmRestart} title={t('clear.common.restartTitle')} description={t('clear.common.restartBody')} onConfirm={restart} onCancel={() => setConfirmRestart(false)} />
  </section>
}

function BrainResult({ record }: { record: LoveBrainAssessment }) {
  const { t } = useI18n()
  const key = (value: string) => value as TranslationKey
  if (record.isLowOverall) return <div><p className="clear-flow__eyebrow">{t('clear.common.result')}</p><h2>{t('clear.brain.low')}</h2><p>{t('clear.brain.copy.low_overall.v1')}</p></div>
  const ties = record.primaryPatterns ?? []
  return <div><p className="clear-flow__eyebrow">{t('clear.brain.resultIntro')}</p>
    {ties.length > 1 ? <><h3>{t('clear.brain.tie')}</h3>{ties.slice(0, 2).map((pattern) => <p key={pattern}><strong>{t(key('clear.brain.pattern.' + pattern))}</strong></p>)}<p>{t('clear.brain.copy.tie.v1')}</p></> : record.primaryPattern ? <><h3>{t('clear.brain.primary')}</h3><h2>{t(key('clear.brain.pattern.' + record.primaryPattern))}</h2><p>{t(key('clear.brain.copy.' + (record.resultVariantKey ?? `${record.primaryPattern}.v1`)))}</p></> : null}
    {record.secondaryPattern ? <p><strong>{t('clear.brain.secondary')}：{t(key('clear.brain.pattern.' + record.secondaryPattern))}</strong></p> : null}
  </div>
}
