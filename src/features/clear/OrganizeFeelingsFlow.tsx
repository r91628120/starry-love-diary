import { useState } from 'react'
import { PrimaryButton, SecondaryButton, SoftCard } from '../../components'
import type { BodySensation, ClearActionType, ClearEmotion, ClearNeed, ClearObservationAnswer, ClearObservationKey, ClearRecord, ClearTriggerType } from '../../data/clearTypes'
import { usePersistence } from '../../data/PersistenceStateContext'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'

const triggerTypes: ClearTriggerType[] = ['no_reply', 'attitude_changed', 'social_media', 'argument', 'missing_them', 'waiting_response', 'overthinking', 'other']
const emotions: ClearEmotion[] = ['missing', 'anxious', 'sad', 'hurt', 'angry', 'jealous', 'afraid', 'lost', 'confused', 'hopeful']
const bodySensations: BodySensation[] = ['chest_tight', 'heart_racing', 'stomach_uncomfortable', 'restless', 'tired', 'sleepless', 'want_to_cry', 'none', 'other']
const observationKeys: ClearObservationKey[] = ['initiates_contact', 'makes_time', 'keeps_promises', 'listens', 'mutual_effort', 'words_match_actions']
const needs: ClearNeed[] = ['reassurance', 'understanding', 'respect', 'company', 'space', 'clarity', 'boundaries', 'rest', 'return_to_life', 'unknown']
const actions: ClearActionType[] = ['put_phone_down', 'stop_checking_social', 'shower_or_rest', 'take_a_walk', 'continue_own_plan', 'talk_to_trusted_person', 'reply_when_calm', 'decide_tomorrow', 'write_diary', 'custom']

interface FormState {
  triggerType?: ClearTriggerType
  triggerText: string
  facts: string
  interpretation: string
  unknown: string
  emotions: ClearEmotion[]
  emotionIntensity: 1 | 2 | 3 | 4 | 5
  bodySensations: BodySensation[]
  observations: Partial<Record<ClearObservationKey, ClearObservationAnswer>>
  needs: ClearNeed[]
  nextActionType?: ClearActionType
  nextActionText: string
}

export function OrganizeFeelingsFlow({ initialTrigger, onDone }: { initialTrigger?: ClearTriggerType; onDone: () => void }) {
  const { t } = useI18n()
  const persistence = usePersistence()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>({ triggerType: initialTrigger, triggerText: '', facts: '', interpretation: '', unknown: '', emotions: [], emotionIntensity: 3, bodySensations: [], observations: {}, needs: [], nextActionText: '' })
  const [completed, setCompleted] = useState<ClearRecord>()
  const [savedStar, setSavedStar] = useState(false)
  const [error, setError] = useState('')
  const key = (value: string) => value as TranslationKey
  const toggle = <T,>(values: T[], value: T) => values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

  async function finish() {
    if (!persistence) return
    setError('')
    try {
      const record = await persistence.repositories.clearRecords.complete({
        triggerType: form.triggerType,
        triggerText: form.triggerText,
        facts: form.facts,
        interpretation: form.interpretation,
        unknown: form.unknown,
        emotions: form.emotions,
        emotionIntensity: form.emotionIntensity,
        bodySensations: form.bodySensations,
        observations: form.observations,
        needs: form.needs,
        nextActionType: form.nextActionType,
        nextActionText: form.nextActionText,
      })
      await persistence.refreshScoreAndStars()
      setCompleted(record)
    } catch {
      setError(t('clear.common.error'))
    }
  }

  async function saveStar() {
    if (!persistence || !completed) return
    await persistence.repositories.clearRecords.saveAsClearMindStar(completed.id)
    await persistence.refreshScoreAndStars()
    setSavedStar(true)
  }

  if (completed) return <SoftCard className="clear-flow clear-result" tone="green">
    <h2>{t('clear.organize.completed')}</h2>
    <p>{t('clear.organize.closing')}</p>
    <div className="clear-flow__actions">
      <PrimaryButton onClick={saveStar} disabled={savedStar}>{t(savedStar ? 'clear.common.savedStar' : 'clear.common.saveStar')}</PrimaryButton>
      <SecondaryButton onClick={onDone}>{t('clear.common.finishAndReturn')}</SecondaryButton>
    </div>
  </SoftCard>

  return <section className="clear-flow" aria-label={t('clear.tools.organize.title')}>
    <div className="clear-flow__top"><SecondaryButton onClick={onDone}>{t('clear.home')}</SecondaryButton><span>{t('clear.common.progress', { current: step, total: 6 })}</span></div>
    {step === 1 ? <SoftCard>
      <h2>{t('clear.organize.step1')}</h2><p>{t('clear.organize.step1Help')}</p>
      <div className="clear-choice-grid">{triggerTypes.map((item) => <button type="button" key={item} className={form.triggerType === item ? 'is-active' : ''} aria-pressed={form.triggerType === item} onClick={() => setForm({ ...form, triggerType: item })}>{t(key('clear.organize.trigger.' + item))}</button>)}</div>
      <label>{t('clear.organize.triggerText')}<textarea maxLength={300} value={form.triggerText} onChange={(event) => setForm({ ...form, triggerText: event.target.value })} /><span>{form.triggerText.length} / 300</span></label>
    </SoftCard> : null}
    {step === 2 ? <SoftCard>
      <h2>{t('clear.organize.step2')}</h2>
      <TextArea label={t('clear.organize.facts')} placeholder={t('clear.organize.factsPlaceholder')} value={form.facts} onChange={(facts) => setForm({ ...form, facts })} />
      <TextArea label={t('clear.organize.interpretation')} placeholder={t('clear.organize.interpretationPlaceholder')} value={form.interpretation} onChange={(interpretation) => setForm({ ...form, interpretation })} />
      <TextArea label={t('clear.organize.unknown')} placeholder={t('clear.organize.unknownPlaceholder')} value={form.unknown} onChange={(unknown) => setForm({ ...form, unknown })} />
    </SoftCard> : null}
    {step === 3 ? <SoftCard>
      <h2>{t('clear.organize.step3')}</h2>
      <div className="clear-choice-grid">{emotions.map((item) => <button type="button" key={item} className={form.emotions.includes(item) ? 'is-active' : ''} aria-pressed={form.emotions.includes(item)} onClick={() => setForm({ ...form, emotions: toggle(form.emotions, item) })}>{t(key('clear.organize.emotion.' + item))}</button>)}</div>
      <fieldset><legend>{t('clear.organize.intensity')}</legend><div className="clear-scale">{([1, 2, 3, 4, 5] as const).map((value) => <button type="button" key={value} className={form.emotionIntensity === value ? 'is-active' : ''} aria-pressed={form.emotionIntensity === value} onClick={() => setForm({ ...form, emotionIntensity: value })}>{value}</button>)}</div></fieldset>
      <h3>{t('clear.organize.body')}</h3><div className="clear-choice-grid">{bodySensations.map((item) => <button type="button" key={item} className={form.bodySensations.includes(item) ? 'is-active' : ''} aria-pressed={form.bodySensations.includes(item)} onClick={() => setForm({ ...form, bodySensations: toggle(form.bodySensations, item) })}>{t(key('clear.organize.body.' + item))}</button>)}</div>
    </SoftCard> : null}
    {step === 4 ? <SoftCard>
      <h2>{t('clear.organize.step4')}</h2><p>{t('clear.organize.step4Help')}</p>
      <div className="clear-observations">{observationKeys.map((item) => <label key={item}>{t(key('clear.organize.observation.' + item))}<select value={form.observations[item] ?? ''} onChange={(event) => setForm({ ...form, observations: { ...form.observations, [item]: event.target.value || undefined } })}><option value="" /><option value="yes">{t('clear.organize.answer.yes')}</option><option value="no">{t('clear.organize.answer.no')}</option><option value="unknown">{t('clear.organize.answer.unknown')}</option></select></label>)}</div>
    </SoftCard> : null}
    {step === 5 ? <SoftCard>
      <h2>{t('clear.organize.step5')}</h2><h3>{t('clear.organize.needs')}</h3>
      <div className="clear-choice-grid">{needs.map((item) => <button type="button" key={item} className={form.needs.includes(item) ? 'is-active' : ''} aria-pressed={form.needs.includes(item)} onClick={() => setForm({ ...form, needs: toggle(form.needs, item) })}>{t(key('clear.organize.need.' + item))}</button>)}</div>
      <h3>{t('clear.organize.action')}</h3>
      <div className="clear-choice-grid">{actions.map((item) => <button type="button" key={item} className={form.nextActionType === item ? 'is-active' : ''} aria-pressed={form.nextActionType === item} onClick={() => setForm({ ...form, nextActionType: item })}>{t(key('clear.organize.action.' + item))}</button>)}</div>
      {form.nextActionType === 'custom' ? <label>{t('clear.organize.customAction')}<textarea maxLength={150} value={form.nextActionText} onChange={(event) => setForm({ ...form, nextActionText: event.target.value })} /><span>{form.nextActionText.length} / 150</span></label> : null}
    </SoftCard> : null}
    {step === 6 ? <SoftCard tone="blue">
      <h2>{t('clear.organize.step6')}</h2>
      <dl className="clear-summary">
        <dt>{t('clear.organize.facts')}</dt><dd>{form.facts || form.triggerText}</dd>
        <dt>{t('clear.organize.interpretation')}</dt><dd>{form.interpretation}</dd>
        <dt>{t('clear.organize.unknown')}</dt><dd>{form.unknown}</dd>
        <dt>{t('clear.organize.step3')}</dt><dd>{form.emotions.map((item) => t(key('clear.organize.emotion.' + item))).join('、')} · {form.emotionIntensity} / 5</dd>
        <dt>{t('clear.organize.action')}</dt><dd>{form.nextActionType ? t(key('clear.organize.action.' + form.nextActionType)) : form.nextActionText}</dd>
      </dl>
      <p>{t('clear.organize.closing')}</p>
      <PrimaryButton onClick={finish}>{t('clear.organize.finish')}</PrimaryButton>
    </SoftCard> : null}
    <p className="clear-flow__error" role="alert">{error}</p>
    {step < 6 ? <div className="clear-flow__actions"><SecondaryButton onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>{t('clear.common.previous')}</SecondaryButton><PrimaryButton onClick={() => setStep(step + 1)}>{t('clear.common.next')}</PrimaryButton></div> : null}
  </section>
}

function TextArea({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return <label>{label}<textarea maxLength={300} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} /><span>{value.length} / 300</span></label>
}
