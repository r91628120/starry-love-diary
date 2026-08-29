import { useEffect, useState } from 'react'
import { ConfirmDialog, PrimaryButton, SecondaryButton, SoftCard } from '../../components'
import type { BoatInvestmentAnswer, BoatResponseAnswer, LoveBoatAssessment } from '../../data/clearTypes'
import { BOAT_A_KEYS, BOAT_B_KEYS } from '../../data/repositories/clearRepositories'
import { usePersistence } from '../../data/PersistenceStateContext'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'

export function LoveBoatFlow({ onDone }: { onDone: () => void }) {
  const { t } = useI18n()
  const persistence = usePersistence()
  const [draft, setDraft] = useState<LoveBoatAssessment>()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(false)
  const [confirmRestart, setConfirmRestart] = useState(false)
  const [completed, setCompleted] = useState<LoveBoatAssessment>()
  const [savedStar, setSavedStar] = useState(false)
  const key = (value: string) => value as TranslationKey

  useEffect(() => {
    let mounted = true
    void persistence?.repositories.loveBoatAssessments.getActiveDraft().then((record) => {
      if (mounted) { setDraft(record); setLoading(false) }
    })
    if (!persistence) setLoading(false)
    return () => { mounted = false }
  }, [persistence])

  async function start() {
    if (!persistence) return
    setDraft(await persistence.repositories.loveBoatAssessments.createDraft())
  }

  async function restart() {
    if (!persistence) return
    setDraft(await persistence.repositories.loveBoatAssessments.restartDraft())
    setConfirmRestart(false)
    setCompleted(undefined)
  }

  async function choose(answer: BoatInvestmentAnswer | BoatResponseAnswer) {
    if (!persistence || !draft) return
    if (draft.currentSection === 'A') {
      const questionKey = BOAT_A_KEYS[draft.currentQuestionIndex]
      const answers = { ...draft.aAnswers, [questionKey]: answer as BoatInvestmentAnswer }
      const sectionDone = BOAT_A_KEYS.every((item) => answers[item] !== undefined)
      const atEnd = draft.currentQuestionIndex === BOAT_A_KEYS.length - 1
      setDraft(await persistence.repositories.loveBoatAssessments.updateDraft(draft.id, {
        aAnswers: answers,
        currentSection: atEnd && sectionDone ? 'B' : 'A',
        currentQuestionIndex: atEnd && sectionDone ? 0 : Math.min(draft.currentQuestionIndex + 1, BOAT_A_KEYS.length - 1),
      }))
    } else if (draft.currentSection === 'B') {
      const questionKey = BOAT_B_KEYS[draft.currentQuestionIndex]
      const answers = { ...draft.bAnswers, [questionKey]: answer as BoatResponseAnswer }
      const sectionDone = BOAT_B_KEYS.every((item) => answers[item] !== undefined)
      const atEnd = draft.currentQuestionIndex === BOAT_B_KEYS.length - 1
      setDraft(await persistence.repositories.loveBoatAssessments.updateDraft(draft.id, {
        bAnswers: answers,
        currentSection: atEnd && sectionDone ? 'result' : 'B',
        currentQuestionIndex: atEnd ? draft.currentQuestionIndex : draft.currentQuestionIndex + 1,
      }))
    }
  }

  async function move(delta: number) {
    if (!persistence || !draft || draft.currentSection === 'result') return
    const total = draft.currentSection === 'A' ? BOAT_A_KEYS.length : BOAT_B_KEYS.length
    setDraft(await persistence.repositories.loveBoatAssessments.updateDraft(draft.id, { currentQuestionIndex: Math.max(0, Math.min(total - 1, draft.currentQuestionIndex + delta)) }))
  }

  async function jump(section: 'A' | 'B', index: number) {
    if (!persistence || !draft) return
    setDraft(await persistence.repositories.loveBoatAssessments.updateDraft(draft.id, { currentSection: section, currentQuestionIndex: index }))
    setOverview(false)
  }

  async function finish() {
    if (!persistence || !draft) return
    setCompleted(await persistence.repositories.loveBoatAssessments.complete(draft.id))
  }

  async function saveStar() {
    if (!persistence || !completed) return
    await persistence.repositories.loveBoatAssessments.saveAsClearMindStar(completed.id)
    await persistence.refreshScoreAndStars()
    setSavedStar(true)
  }

  if (loading) return null
  if (completed) return <SoftCard className="clear-flow clear-result" tone="green">
    <h2>{t('clear.boat.completed')}</h2>
    <BoatResult record={completed} />
    <div className="clear-flow__actions"><PrimaryButton onClick={saveStar} disabled={savedStar}>{t(savedStar ? 'clear.common.savedStar' : 'clear.common.saveStar')}</PrimaryButton><SecondaryButton onClick={onDone}>{t('clear.common.finishAndReturn')}</SecondaryButton></div>
  </SoftCard>
  if (!draft) return <SoftCard className="clear-flow clear-intro" tone="blue">
    <SecondaryButton onClick={onDone}>{t('clear.home')}</SecondaryButton>
    <h2>{t('clear.tools.boatGuide.title')}</h2><p>{t('clear.boat.intro')}</p>
    <PrimaryButton onClick={start}>{t('clear.boat.start')}</PrimaryButton>
  </SoftCard>

  if (draft.currentSection === 'result') return <section className="clear-flow">
    <div className="clear-flow__top"><SecondaryButton onClick={() => jump('B', 9)}>{t('clear.common.previous')}</SecondaryButton><SecondaryButton onClick={onDone}>{t('clear.common.continueLater')}</SecondaryButton></div>
    <SoftCard className="clear-result" tone="blue"><BoatResult record={draft} /><PrimaryButton onClick={finish}>{t('clear.boat.finish')}</PrimaryButton></SoftCard>
    <p>{t('clear.common.savedDraft')}</p>
  </section>

  const isA = draft.currentSection === 'A'
  const questions = isA ? BOAT_A_KEYS : BOAT_B_KEYS
  const question = questions[draft.currentQuestionIndex]
  const currentAnswer = isA ? draft.aAnswers[question as typeof BOAT_A_KEYS[number]] : draft.bAnswers[question as typeof BOAT_B_KEYS[number]]
  const answerOptions = isA ? [0, 1, 2, 3] as const : [2, 1, 0, 'unknown'] as const
  return <section className="clear-flow">
    <div className="clear-flow__top"><SecondaryButton onClick={onDone}>{t('clear.common.continueLater')}</SecondaryButton><span>{t('clear.common.progress', { current: draft.currentQuestionIndex + 1, total: questions.length })}</span></div>
    <SoftCard>
      <p className="clear-flow__eyebrow">{t(isA ? 'clear.boat.sectionA' : 'clear.boat.sectionB')}</p>
      <h2>{t(key('clear.boat.q.' + question))}</h2>
      {!isA ? <p>{t('clear.boat.unknownHelp')}</p> : null}
      <div className="clear-answer-list">{answerOptions.map((answer) => {
        const answerKey = isA ? 'clear.boat.answer.' + answer : 'clear.boat.response.' + answer
        return <button type="button" key={answer} className={currentAnswer === answer ? 'is-active' : ''} aria-pressed={currentAnswer === answer} onClick={() => choose(answer)}>{t(key(answerKey))}</button>
      })}</div>
    </SoftCard>
    <div className="clear-flow__actions"><SecondaryButton onClick={() => move(-1)} disabled={draft.currentQuestionIndex === 0}>{t('clear.common.previous')}</SecondaryButton><SecondaryButton onClick={() => setOverview(!overview)}>{t('clear.common.overview')}</SecondaryButton><SecondaryButton onClick={() => move(1)} disabled={draft.currentQuestionIndex === questions.length - 1}>{t('clear.common.next')}</SecondaryButton></div>
    {overview ? <SoftCard className="clear-overview"><h3>{t('clear.boat.sectionA')}</h3><QuestionGrid count={12} current={isA ? draft.currentQuestionIndex : -1} answered={(index) => draft.aAnswers[BOAT_A_KEYS[index]] !== undefined} onClick={(index) => jump('A', index)} /><h3>{t('clear.boat.sectionB')}</h3><QuestionGrid count={10} current={!isA ? draft.currentQuestionIndex : -1} answered={(index) => draft.bAnswers[BOAT_B_KEYS[index]] !== undefined} onClick={(index) => jump('B', index)} /></SoftCard> : null}
    <SecondaryButton onClick={() => setConfirmRestart(true)}>{t('clear.common.restart')}</SecondaryButton>
    <p>{t('clear.common.savedDraft')}</p>
    <ConfirmDialog open={confirmRestart} title={t('clear.common.restartTitle')} description={t('clear.common.restartBody')} onConfirm={restart} onCancel={() => setConfirmRestart(false)} />
  </section>
}

function BoatResult({ record }: { record: LoveBoatAssessment }) {
  const { t } = useI18n()
  const key = (value: string) => value as TranslationKey
  const resultTitle = record.crossResultKey ? t(key('clear.boat.result.' + record.crossResultKey)) : record.aLevel ? t(key('clear.boat.insufficientTitle.' + record.aLevel)) : t('clear.boat.level.response_insufficient_observation')
  const resultBody = record.crossResultKey ? t(key('clear.boat.resultBody.' + record.crossResultKey + '.' + (record.resultVariantIndex ?? 0))) : t('clear.boat.result.insufficient')
  return <div>
    <p className="clear-flow__eyebrow">{t('clear.common.result')}</p><h2>{resultTitle}</h2>
    <p>{t('clear.boat.scoreA', { score: record.aScore ?? 0 })}</p>
    {record.aLevel ? <p><strong>{t(key('clear.boat.level.' + record.aLevel))}</strong></p> : null}
    {record.bLevel ? <p><strong>{t(key('clear.boat.level.' + record.bLevel))}</strong></p> : null}
    <p>{resultBody}</p>
  </div>
}

function QuestionGrid({ count, current, answered, onClick }: { count: number; current: number; answered: (index: number) => boolean; onClick: (index: number) => void }) {
  return <div className="clear-question-grid">{Array.from({ length: count }, (_, index) => <button type="button" key={index} className={current === index ? 'is-current' : answered(index) ? 'is-answered' : ''} onClick={() => onClick(index)}>{index + 1}</button>)}</div>
}
