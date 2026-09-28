import { useEffect, useState } from 'react'
import { ConfirmDialog, PrimaryButton, SecondaryButton, SoftCard } from '../../components'
import type { LoveBrainAnswer, LoveBrainAssessment } from '../../data/clearTypes'
import { LOVE_BRAIN_KEYS } from '../../data/repositories/clearRepositories'
import { usePersistence } from '../../data/PersistenceStateContext'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'
import { EXTERNAL_AI_HANDOFF_CONSENT_VERSION, buildLoveBrainAiHandoffText, copyLoveBrainAiHandoffText, openExternalAiDestination, type ExternalAiDestination } from '../../services/loveBrainAiHandoff'
import { getLoveBrainV2ResultSummary } from './loveBrainV2Result'

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
    const updated = await persistence.repositories.loveBrainAssessments.updateDraft(draft.id, {
      answers,
      // Keep the user on this question so the persisted answer can visibly
      // confirm selection and be changed before they choose Next.
      currentQuestionIndex: draft.currentQuestionIndex,
    })
    setDraft(updated)
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
  if (completed) return <SoftCard className="clear-flow clear-result" tone="green"><h2>{t('clear.brain.completed')}</h2><LoveBrainRecordResult record={completed} onRecordChange={setCompleted} /><div className="clear-flow__actions"><PrimaryButton onClick={saveStar} disabled={savedStar}>{t(savedStar ? 'clear.common.savedStar' : 'clear.common.saveStar')}</PrimaryButton><SecondaryButton onClick={onDone}>{t('clear.common.finishAndReturn')}</SecondaryButton></div></SoftCard>
  if (!draft) return <SoftCard className="clear-flow clear-intro clear-tool-intro" tone="purple"><SecondaryButton onClick={onDone}>{t('clear.home')}</SecondaryButton><p>{t('clear.brain.intro')}</p><p>{t('clear.brain.duration')}</p><PrimaryButton onClick={start}>{t('clear.brain.start')}</PrimaryButton></SoftCard>
  if (preview) return <section className="clear-flow"><div className="clear-flow__top"><SecondaryButton onClick={() => setPreview(false)}>{t('clear.common.previous')}</SecondaryButton><SecondaryButton onClick={onDone}>{t('clear.common.continueLater')}</SecondaryButton></div><SoftCard className="clear-result" tone="purple"><BrainResult record={draft} /><PrimaryButton onClick={finish}>{t('clear.brain.finish')}</PrimaryButton></SoftCard><p>{t('clear.common.savedDraft')}</p></section>

  const question = LOVE_BRAIN_KEYS[draft.currentQuestionIndex]
  const atEnd = draft.currentQuestionIndex === LOVE_BRAIN_KEYS.length - 1
  const allAnswered = LOVE_BRAIN_KEYS.every((item) => draft.answers[item] !== undefined)
  return <section className="clear-flow">
    <div className="clear-flow__top"><SecondaryButton onClick={onDone}>{t('clear.common.continueLater')}</SecondaryButton><span>{t('clear.common.progress', { current: draft.currentQuestionIndex + 1, total: 25 })}</span></div>
    <SoftCard><p className="clear-flow__eyebrow">{t('clear.tools.loveBrain.title')}</p><h2 id={`love-brain-question-${draft.currentQuestionIndex}`}>{t(key('clear.brain.q.' + question))}</h2><div className="clear-answer-list" role="radiogroup" aria-labelledby={`love-brain-question-${draft.currentQuestionIndex}`}>{([0, 1, 2, 3] as const).map((answer) => <button type="button" role="radio" key={answer} className={draft.answers[question] === answer ? 'is-active' : ''} aria-checked={draft.answers[question] === answer} onClick={() => choose(answer)}>{t(key('clear.boat.answer.' + answer))}</button>)}</div></SoftCard>
    <div className="clear-flow__actions"><SecondaryButton disabled={draft.currentQuestionIndex === 0} onClick={() => move(draft.currentQuestionIndex - 1)}>{t('clear.common.previous')}</SecondaryButton><SecondaryButton onClick={() => setOverview(!overview)}>{t('clear.common.overview')}</SecondaryButton>{atEnd && allAnswered ? <PrimaryButton onClick={() => setPreview(true)}>{t('clear.history.view')}</PrimaryButton> : <SecondaryButton disabled={atEnd} onClick={() => move(draft.currentQuestionIndex + 1)}>{t('clear.common.next')}</SecondaryButton>}</div>
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

export function LoveBrainRecordResult({ record, onRecordChange }: { record: LoveBrainAssessment; onRecordChange?: (record: LoveBrainAssessment) => void }) {
  const { t } = useI18n()
  const persistence = usePersistence()
  const result = getLoveBrainV2ResultSummary(record)
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(record.noteToSay ?? '')
  const [confirmClear, setConfirmClear] = useState(false)
  useEffect(() => setNote(record.noteToSay ?? ''), [record.id, record.noteToSay])
  if (!result) return <BrainResult record={record} />
  const characters = [...note].length
  const saveNote = async () => {
    if (!persistence) return
    const updated = await persistence.repositories.loveBrainAssessments.updateNote(record.id, note)
    onRecordChange?.(updated)
    setEditing(false)
  }
  const clearNote = async () => {
    if (!persistence) return
    const updated = await persistence.repositories.loveBrainAssessments.updateNote(record.id, undefined)
    onRecordChange?.(updated)
    setEditing(false)
    setConfirmClear(false)
  }
  return <div className="clear-brain-v2">
    <section><p className="clear-flow__eyebrow">{t('clear.common.result')}</p><h2>{t('clear.brain.v2.title')}</h2><p>{t('clear.brain.v2.intro')}</p></section>
    <section className="clear-brain-v2__dimensions">{result.dimensions.map((item) => <article key={item.dimension} className="clear-brain-v2__dimension"><div><h3>{t(item.displayKey as TranslationKey)}</h3><strong>{t('clear.brain.v2.score', { score: item.score })}</strong></div><progress max={15} value={item.score}>{item.score} / 15</progress><p>{t(item.explanationKey as TranslationKey)}</p></article>)}</section>
    <section className="clear-brain-v2__meaning"><h3>{t('clear.brain.v2.notMeaningTitle')}</h3><p>{t('clear.brain.v2.notMeaningBody1')}</p><p>{t('clear.brain.v2.notMeaningBody2')}</p></section>
    <section className="clear-brain-v2__note"><h3>{t('clear.brain.v2.note.title')}</h3><p>{t('clear.brain.v2.note.body')}</p><p>{t('clear.brain.v2.note.ai')}</p>{editing ? <><label><span>{t('clear.brain.v2.note.optional')}</span><textarea value={note} maxLength={undefined} onChange={(event) => setNote([...event.target.value].slice(0, 500).join(''))} placeholder={t('clear.brain.v2.note.placeholder')} /><span>{t('clear.brain.v2.note.count', { count: characters, max: 500 })}</span></label><div className="clear-flow__actions"><PrimaryButton onClick={saveNote}>{t('clear.brain.v2.note.save')}</PrimaryButton>{record.noteToSay ? <SecondaryButton onClick={() => setConfirmClear(true)}>{t('clear.brain.v2.note.clear')}</SecondaryButton> : null}</div></> : <>{record.noteToSay ? <p className="clear-brain-v2__saved-note">{record.noteToSay}</p> : <p>{t('clear.brain.v2.note.optional')}</p>}<SecondaryButton onClick={() => setEditing(true)}>{t('clear.brain.v2.note.edit')}</SecondaryButton></>}<p className="clear-brain-v2__privacy">{t('clear.brain.v2.note.privacy')}</p></section>
    <LoveBrainAiHandoff record={record} />
    <ConfirmDialog open={confirmClear} title={t('clear.brain.v2.note.clearTitle')} description={t('clear.brain.v2.note.clearBody')} confirmLabel={t('clear.brain.v2.note.clear')} onConfirm={clearNote} onCancel={() => setConfirmClear(false)} danger />
  </div>
}

function LoveBrainAiHandoff({ record }: { record: LoveBrainAssessment }) {
  const { locale, t } = useI18n()
  const persistence = usePersistence()
  const [requestedAction, setRequestedAction] = useState<ExternalAiDestination | 'copy'>()
  const [retryDestination, setRetryDestination] = useState<ExternalAiDestination>()
  const [feedback, setFeedback] = useState<string>()

  const continueWith = async (action: ExternalAiDestination | 'copy', saveConsent: boolean) => {
    setFeedback(undefined)
    setRetryDestination(undefined)
    if (saveConsent && persistence) await persistence.updateSettings({ externalAiHandoffConsentVersion: EXTERNAL_AI_HANDOFF_CONSENT_VERSION })
    const copied = await copyLoveBrainAiHandoffText(buildLoveBrainAiHandoffText(record, locale))
    if (!copied) { setFeedback(t('clear.brain.v2.ai.copyFailed')); return }
    if (action === 'copy') { setFeedback(t('clear.brain.v2.ai.copied')); return }
    const openResult = openExternalAiDestination(action)
    if (openResult === 'failed') {
      setRetryDestination(action)
      setFeedback(t('clear.brain.v2.ai.openFailed', { provider: action === 'chatgpt' ? 'ChatGPT' : 'Gemini' }))
      return
    }
    setFeedback(t('clear.brain.v2.ai.opened', { provider: action === 'chatgpt' ? 'ChatGPT' : 'Gemini' }))
  }
  const request = (action: ExternalAiDestination | 'copy') => {
    if (persistence?.settings.externalAiHandoffConsentVersion === EXTERNAL_AI_HANDOFF_CONSENT_VERSION) void continueWith(action, false)
    else setRequestedAction(action)
  }
  const retry = () => {
    if (!retryDestination) return
    if (openExternalAiDestination(retryDestination) === 'failed') { setFeedback(t('clear.brain.v2.ai.openFailed', { provider: retryDestination === 'chatgpt' ? 'ChatGPT' : 'Gemini' })); return }
    setFeedback(t('clear.brain.v2.ai.opened', { provider: retryDestination === 'chatgpt' ? 'ChatGPT' : 'Gemini' }))
    setRetryDestination(undefined)
  }
  return <section className="clear-brain-v2__ai">
    <h3>{t('clear.brain.v2.ai.title')}</h3><p>{t('clear.brain.v2.ai.body')}</p><p>{t('clear.brain.v2.ai.steps')}</p><p>{t('clear.ai.returnSteps')}</p><p>{t('clear.ai.returnHint')}</p>
    <div className="clear-flow__actions"><SecondaryButton onClick={() => request('copy')}>{t('clear.brain.v2.ai.copy')}</SecondaryButton><PrimaryButton onClick={() => request('chatgpt')}>{t('clear.brain.v2.ai.chatgpt')}</PrimaryButton><SecondaryButton onClick={() => request('gemini')}>{t('clear.brain.v2.ai.gemini')}</SecondaryButton></div>
    <p className="clear-brain-v2__privacy">{t('clear.brain.v2.ai.reminder')}</p>
    {feedback ? <p role="status">{feedback}</p> : null}
    {retryDestination ? <SecondaryButton onClick={retry}>{t('clear.brain.v2.ai.retry')}</SecondaryButton> : null}
    <ConfirmDialog open={requestedAction !== undefined} title={t('clear.brain.v2.ai.consentTitle')} description={`${t('clear.brain.v2.ai.consentBody1')}\n\n${t('clear.brain.v2.ai.consentBody2')}\n\n${t('clear.brain.v2.ai.consentBody3')}`} confirmLabel={t('clear.brain.v2.ai.consentConfirm')} onConfirm={() => { const action = requestedAction; setRequestedAction(undefined); if (action) void continueWith(action, true) }} onCancel={() => setRequestedAction(undefined)} />
  </section>
}
