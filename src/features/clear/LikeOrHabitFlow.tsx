import { useEffect, useState } from 'react'
import { ConfirmDialog, PrimaryButton, SecondaryButton, SoftCard } from '../../components'
import type { FearOfLossOption, LikeOrHabitAnswers, LikeOrHabitDimension, LikeOrHabitReflection, LikeOrHabitResultVariantKey, LikeOrHabitSection } from '../../data/clearTypes'
import { usePersistence } from '../../data/PersistenceStateContext'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'

const sections: Exclude<LikeOrHabitSection, 'result'>[] = ['real_person', 'habit', 'fear_of_loss', 'imagined_relationship']
const singleQuestions = {
  real_person: [
    ['real_person_three_real_traits', ['yes', 'some', 'not_really', 'not_sure']],
    ['real_person_without_romantic_expectation', ['yes', 'probably_yes', 'probably_no', 'not_sure']],
    ['real_person_present_vs_future_version', ['mostly_present', 'both', 'mostly_future', 'not_sure']],
  ],
  habit: [
    ['habit_expect_regular_contact', ['often', 'sometimes', 'rarely', 'not_sure']],
    ['habit_absence_feels_like_missing_routine', ['yes', 'somewhat', 'no', 'not_sure']],
    ['habit_missing_the_routine', ['yes', 'maybe', 'no', 'not_sure']],
  ],
  fear_of_loss: [
    ['fear_of_loss_person_vs_feeling', ['mostly_person', 'both', 'mostly_feeling', 'not_sure']],
    ['fear_of_loss_avoiding_discomfort', ['yes', 'sometimes', 'no', 'not_sure']],
  ],
  imagined_relationship: [
    ['imagined_relationship_future_more_than_reality', ['often', 'sometimes', 'rarely', 'not_sure']],
    ['imagined_relationship_future_fills_present_gap', ['often', 'sometimes', 'rarely', 'not_sure']],
  ],
} as const
const fearOptions: FearOfLossOption[] = ['lose_this_person', 'lose_daily_companionship', 'lose_feeling_cared_for', 'be_alone', 'investment_feels_wasted', 'no_result', 'uncertainty', 'other']

type Preview = {
  activeResultModules: LikeOrHabitDimension[]
  resultVariantKey: LikeOrHabitResultVariantKey
}

export function LikeOrHabitFlow({ onDone }: { onDone: () => void }) {
  const { t } = useI18n()
  const persistence = usePersistence()
  const [draft, setDraft] = useState<LikeOrHabitReflection>()
  const [loading, setLoading] = useState(true)
  const [confirmRestart, setConfirmRestart] = useState(false)
  const [preview, setPreview] = useState<Preview>()
  const [completed, setCompleted] = useState<LikeOrHabitReflection>()
  const [savedStar, setSavedStar] = useState(false)
  const [error, setError] = useState('')
  const key = (value: string) => value as TranslationKey

  useEffect(() => {
    let mounted = true
    void persistence?.repositories.likeOrHabitReflections.getActiveDraft().then((record) => {
      if (mounted) { setDraft(record); setLoading(false) }
    })
    if (!persistence) setLoading(false)
    return () => { mounted = false }
  }, [persistence])

  async function start() {
    if (persistence) setDraft(await persistence.repositories.likeOrHabitReflections.createDraft())
  }
  async function restart() {
    if (!persistence) return
    setDraft(await persistence.repositories.likeOrHabitReflections.restartDraft())
    setPreview(undefined)
    setError('')
    setConfirmRestart(false)
  }
  async function persist(changes: Parameters<NonNullable<typeof persistence>['repositories']['likeOrHabitReflections']['updateDraft']>[1]) {
    if (!persistence || !draft) return
    const updated = await persistence.repositories.likeOrHabitReflections.updateDraft(draft.id, changes)
    setDraft(updated)
  }
  async function move(index: number) {
    const section = sections[Math.max(0, Math.min(3, index))]
    await persist({ currentSection: section })
    setPreview(undefined)
    setError('')
  }
  function setSingle(section: typeof sections[number], question: string, value: string) {
    if (!draft) return
    const answers: LikeOrHabitAnswers = structuredClone(draft.answers)
    if (section === 'real_person') answers.realPerson = { ...answers.realPerson, [question]: value } as NonNullable<LikeOrHabitAnswers['realPerson']>
    if (section === 'habit') answers.habit = { ...answers.habit, [question]: value } as NonNullable<LikeOrHabitAnswers['habit']>
    if (section === 'fear_of_loss') answers.fearOfLoss = { ...answers.fearOfLoss, [question]: value } as NonNullable<LikeOrHabitAnswers['fearOfLoss']>
    if (section === 'imagined_relationship') answers.imaginedRelationship = { ...answers.imaginedRelationship, [question]: value } as NonNullable<LikeOrHabitAnswers['imaginedRelationship']>
    setDraft({ ...draft, answers })
    void persist({ answers })
  }
  function toggleFear(option: FearOfLossOption) {
    if (!draft) return
    const selected = draft.answers.fearOfLoss?.fear_of_loss_hardest_part ?? []
    const next = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]
    const answers = { ...draft.answers, fearOfLoss: { ...draft.answers.fearOfLoss, fear_of_loss_hardest_part: next } }
    setDraft({ ...draft, answers })
    void persist({ answers })
  }
  function setText(field: 'realPersonNote' | 'habitNote' | 'otherText' | 'realityDescription', value: string) {
    if (!draft) return
    if (field === 'realPersonNote' || field === 'habitNote') {
      setDraft({ ...draft, [field]: value })
      void persist({ [field]: value })
      return
    }
    const answers: LikeOrHabitAnswers = field === 'otherText'
      ? { ...draft.answers, fearOfLoss: { ...draft.answers.fearOfLoss, otherText: value } }
      : { ...draft.answers, imaginedRelationship: { ...draft.answers.imaginedRelationship, imagined_relationship_reality_description: value } }
    setDraft({ ...draft, answers })
    void persist({ answers })
  }
  async function showPreview() {
    if (!persistence || !draft) return
    try {
      const result = await persistence.repositories.likeOrHabitReflections.preview(draft.id)
      const updated = await persistence.repositories.likeOrHabitReflections.updateDraft(draft.id, { currentSection: 'result' })
      setDraft(updated)
      setPreview(result)
      setError('')
    } catch {
      setError(t('clear.like.validation'))
    }
  }
  async function finish() {
    if (!persistence || !draft) return
    setCompleted(await persistence.repositories.likeOrHabitReflections.complete(draft.id))
  }
  async function saveStar() {
    if (!persistence || !completed) return
    await persistence.repositories.likeOrHabitReflections.saveAsClearMindStar(completed.id)
    await persistence.refreshScoreAndStars()
    setSavedStar(true)
  }

  if (loading) return null
  if (completed) return <SoftCard className="clear-flow clear-result" tone="green"><h2>{t('clear.like.completed')}</h2><LikeResult modules={completed.activeResultModules ?? []} variantKey={completed.resultVariantKey ?? 'unclear.v1'} /><div className="clear-flow__actions"><PrimaryButton onClick={saveStar} disabled={savedStar || Boolean(completed.clearMindStarId)}>{t(savedStar || completed.clearMindStarId ? 'clear.common.savedStar' : 'clear.common.saveStar')}</PrimaryButton><SecondaryButton onClick={onDone}>{t('clear.common.finishAndReturn')}</SecondaryButton></div></SoftCard>
  if (!draft) return <SoftCard className="clear-flow clear-intro" tone="green"><SecondaryButton onClick={onDone}>{t('clear.home')}</SecondaryButton><h2>{t('clear.tools.likeOrHabit.title')}</h2><p>{t('clear.like.intro')}</p><PrimaryButton onClick={start}>{t('clear.like.start')}</PrimaryButton></SoftCard>
  if (preview) return <section className="clear-flow"><div className="clear-flow__top"><SecondaryButton onClick={() => move(3)}>{t('clear.common.previous')}</SecondaryButton><SecondaryButton onClick={onDone}>{t('clear.common.continueLater')}</SecondaryButton></div><SoftCard className="clear-result" tone="green"><LikeResult modules={preview.activeResultModules} variantKey={preview.resultVariantKey} /><PrimaryButton onClick={finish}>{t('clear.like.finish')}</PrimaryButton></SoftCard><p>{t('clear.common.savedDraft')}</p></section>

  const section = draft.currentSection === 'result' ? 'imagined_relationship' : draft.currentSection
  const index = sections.indexOf(section)
  const answers = draft.answers
  const answerFor = (question: string) => {
    if (section === 'real_person') return answers.realPerson?.[question as keyof NonNullable<LikeOrHabitAnswers['realPerson']>]
    if (section === 'habit') return answers.habit?.[question as keyof NonNullable<LikeOrHabitAnswers['habit']>]
    if (section === 'fear_of_loss') return answers.fearOfLoss?.[question as keyof NonNullable<LikeOrHabitAnswers['fearOfLoss']>]
    return answers.imaginedRelationship?.[question as keyof NonNullable<LikeOrHabitAnswers['imaginedRelationship']>]
  }
  const questions = singleQuestions[section]
  return <section className="clear-flow">
    <div className="clear-flow__top"><SecondaryButton onClick={onDone}>{t('clear.common.continueLater')}</SecondaryButton><span>{t('clear.common.progress', { current: index + 1, total: 4 })}</span></div>
    <SoftCard tone="green">
      <p className="clear-flow__eyebrow">{t(key('clear.like.section.' + section))}</p>
      {section === 'fear_of_loss' ? <fieldset><legend>{t('clear.like.q.fear_of_loss_hardest_part')}</legend><div className="clear-choice-grid">{fearOptions.map((option) => <button type="button" key={option} className={answers.fearOfLoss?.fear_of_loss_hardest_part?.includes(option) ? 'is-active' : ''} aria-pressed={answers.fearOfLoss?.fear_of_loss_hardest_part?.includes(option)} onClick={() => toggleFear(option)}>{t(key('clear.like.option.' + option))}</button>)}</div>{answers.fearOfLoss?.fear_of_loss_hardest_part?.includes('other') ? <label>{t('clear.like.other')}<textarea maxLength={150} value={answers.fearOfLoss.otherText ?? ''} onChange={(event) => setText('otherText', event.target.value)} /><span>{answers.fearOfLoss.otherText?.length ?? 0} / 150</span></label> : null}</fieldset> : null}
      {questions.map(([question, options]) => <fieldset key={question}><legend>{t(key('clear.like.q.' + question))}</legend><div className="clear-answer-list">{options.map((option) => <button type="button" key={option} className={answerFor(question) === option ? 'is-active' : ''} aria-pressed={answerFor(question) === option} onClick={() => setSingle(section, question, option)}>{t(key('clear.like.answer.' + option))}</button>)}</div></fieldset>)}
      {section === 'real_person' ? <TextField label={t('clear.like.prompt.real_person')} value={draft.realPersonNote ?? ''} onChange={(value) => setText('realPersonNote', value)} /> : null}
      {section === 'habit' ? <TextField label={t('clear.like.prompt.habit')} value={draft.habitNote ?? ''} onChange={(value) => setText('habitNote', value)} /> : null}
      {section === 'imagined_relationship' ? <TextField label={t('clear.like.q.imagined_relationship_reality_description')} value={answers.imaginedRelationship?.imagined_relationship_reality_description ?? ''} onChange={(value) => setText('realityDescription', value)} /> : null}
    </SoftCard>
    <p className="clear-flow__error" role="alert">{error}</p>
    <div className="clear-flow__actions"><SecondaryButton disabled={index === 0} onClick={() => move(index - 1)}>{t('clear.common.previous')}</SecondaryButton><PrimaryButton onClick={() => index === 3 ? showPreview() : move(index + 1)}>{index === 3 ? t('clear.like.preview') : t('clear.common.next')}</PrimaryButton></div>
    <SecondaryButton onClick={() => setConfirmRestart(true)}>{t('clear.common.restart')}</SecondaryButton><p>{t('clear.common.savedDraft')}</p>
    <ConfirmDialog open={confirmRestart} title={t('clear.common.restartTitle')} description={t('clear.common.restartBody')} onConfirm={restart} onCancel={() => setConfirmRestart(false)} />
  </section>
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label>{label}<textarea maxLength={300} value={value} onChange={(event) => onChange(event.target.value)} /><span>{value.length} / 300</span></label>
}

function LikeResult({ modules, variantKey }: { modules: LikeOrHabitDimension[]; variantKey: LikeOrHabitResultVariantKey }) {
  const { t } = useI18n()
  const key = (value: string) => value as TranslationKey
  const root = 'clear.like.result.' + variantKey
  return <div><p className="clear-flow__eyebrow">{t('clear.common.result')}</p><h2>{t(key(root + '.title'))}</h2><p>{t(key(root + '.body'))}</p>{modules.map((module) => <SoftCard key={module} tone="blue"><h3>{t(key('clear.like.module.' + module + '.title'))}</h3><p>{t(key('clear.like.module.' + module + '.body'))}</p></SoftCard>)}<p><strong>{t(key(root + '.reflection'))}</strong></p><p>{t('clear.like.closing')}</p></div>
}
