import { useEffect, useState } from 'react'
import type { ClearRecord, ClearToolSourceType, LikeOrHabitReflection, LoveBoatAssessment, LoveBrainAssessment } from '../../data/clearTypes'
import { usePersistence } from '../../data/PersistenceStateContext'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/messages'
import { LoveBrainRecordResult } from './LoveBrainFlow'
import { LikeResult } from './LikeOrHabitFlow'
import { ClearAiHandoff } from './ClearAiHandoff'
import { clearHistoryAiHandoffIdentity, resolveClearHistoryAiHandoffRepository, type AiHandoffRecord } from './clearHistoryAiHandoff'
import { buildLikeOrHabitAiHandoffText, buildLoveBoatAiHandoffText, buildOrganizeFeelingsAiHandoffText } from '../../services/clearAiHandoffBuilders'

const boatA = Array.from({ length: 12 }, (_, index) => `a${String(index + 1).padStart(2, '0')}`)
const boatB = Array.from({ length: 10 }, (_, index) => `b${String(index + 1).padStart(2, '0')}`)
const brainGroups = [['rumination', 1], ['message_dependency', 6], ['over_interpretation', 11], ['detective', 16], ['self_sacrifice', 21]] as const
const likeGroups = [
  ['realPerson', 'clear.historyDetail.realPerson', ['real_person_three_real_traits', 'real_person_without_romantic_expectation', 'real_person_present_vs_future_version']],
  ['habit', 'clear.historyDetail.habit', ['habit_expect_regular_contact', 'habit_absence_feels_like_missing_routine', 'habit_missing_the_routine']],
  ['fearOfLoss', 'clear.historyDetail.fear', ['fear_of_loss_person_vs_feeling', 'fear_of_loss_avoiding_discomfort']],
  ['imaginedRelationship', 'clear.historyDetail.imagined', ['imagined_relationship_future_more_than_reality', 'imagined_relationship_future_fills_present_gap']],
] as const

export function ClearHistoryDetail({ sourceType, recordId }: { sourceType: Exclude<ClearToolSourceType, 'free_talk'>; recordId: string }) {
  const persistence = usePersistence(); const identity = clearHistoryAiHandoffIdentity(sourceType, recordId)
  const [record, setRecord] = useState<AiHandoffRecord>()
  useEffect(() => {
    let active = true; setRecord(undefined)
    const repository = persistence && resolveClearHistoryAiHandoffRepository(persistence, sourceType)
    if (!repository) return () => { active = false }
    void repository.getById(recordId).then((value) => { if (active && value?.id === recordId) setRecord(value) })
    return () => { active = false }
  }, [identity, persistence, recordId, sourceType])
  if (!record) return null
  if (sourceType === 'clear_record') return <OrganizeDetail record={record as ClearRecord} />
  if (sourceType === 'love_boat_code') return <BoatDetail record={record as LoveBoatAssessment} />
  if (sourceType === 'love_brain_assessment') return <LoveBrainDetail record={record as LoveBrainAssessment} />
  return <LikeDetail record={record as LikeOrHabitReflection} />
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="clear-history-detail__section"><h3>{title}</h3>{children}</section> }
function Text({ title, value }: { title: string; value?: string }) { return value?.trim() ? <Section title={title}><p className="clear-history-detail__text">{value}</p></Section> : null }
function Chips({ values }: { values: string[] }) { const { t } = useI18n(); return <div className="clear-history-detail__chips">{values.map((value) => <span key={value}>{t(value as TranslationKey)}</span>)}</div> }

function OrganizeDetail({ record }: { record: ClearRecord }) {
  const { t } = useI18n(); const key = (value: string) => value as TranslationKey
  const emotions = record.emotions ?? []
  const observations = Object.entries(record.observations ?? {}).filter(([, value]) => value)
  return <div className="clear-history-detail"><Section title={t('clear.organize.step6')}><dl className="clear-summary">{record.facts || record.triggerText ? <><dt>{t('clear.organize.facts')}</dt><dd>{record.facts || record.triggerText}</dd></> : null}{record.interpretation ? <><dt>{t('clear.organize.interpretation')}</dt><dd>{record.interpretation}</dd></> : null}{record.unknown ? <><dt>{t('clear.organize.unknown')}</dt><dd>{record.unknown}</dd></> : null}{emotions.length ? <><dt>{t('clear.organize.step3')}</dt><dd>{emotions.map((value) => t(key(`clear.organize.emotion.${value}`))).join('、')}{record.emotionIntensity !== undefined ? ` · ${record.emotionIntensity} / 5` : ''}</dd></> : null}{record.nextActionType || record.nextActionText ? <><dt>{t('clear.organize.action')}</dt><dd>{record.nextActionType ? t(key(`clear.organize.action.${record.nextActionType}`)) : record.nextActionText}</dd></> : null}</dl><p>{t('clear.organize.closing')}</p></Section><OriginalAnswers>
  <Section title={t('clear.historyDetail.meThen')}>
    {record.triggerType || record.triggerText ? <div><strong>{t('clear.historyDetail.event')}</strong><p>{record.triggerType ? t(key(`clear.organize.trigger.${record.triggerType}`)) : ''}{record.triggerType && record.triggerText ? ' · ' : ''}{record.triggerText}</p></div> : null}
    {emotions.length ? <div><strong>{t('clear.historyDetail.feelings')}</strong><Chips values={emotions.map((value) => `clear.organize.emotion.${value}`)} />{record.emotionIntensity !== undefined ? <p>{t('clear.historyDetail.intensity', { value: record.emotionIntensity })}</p> : null}</div> : null}
  </Section><Text title={t('clear.historyDetail.facts')} value={record.facts} /><Text title={t('clear.historyDetail.interpretation')} value={record.interpretation} /><Text title={t('clear.historyDetail.unknown')} value={record.unknown} />
  {(record.bodySensations?.length || observations.length) ? <Section title={t('clear.historyDetail.bodyAndObservations')}>{record.bodySensations?.length ? <div><strong>{t('clear.historyDetail.body')}</strong><Chips values={record.bodySensations.map((value) => `clear.organize.body.${value}`)} /></div> : null}{observations.length ? <div><strong>{t('clear.historyDetail.observations')}</strong><ul>{observations.map(([name, value]) => <li key={name}>{t(key(`clear.organize.observation.${name}`))}：{t(key(`clear.organize.answer.${value}`))}</li>)}</ul></div> : null}</Section> : null}
  {record.needs?.length ? <Section title={t('clear.historyDetail.needs')}><Chips values={record.needs.map((value) => `clear.organize.need.${value}`)} /></Section> : null}
  {(record.nextActionType || record.nextActionText) ? <Section title={t('clear.historyDetail.nextAction')}><p className="clear-history-detail__text">{record.nextActionType ? t(key(`clear.organize.action.${record.nextActionType}`)) : record.nextActionText}</p>{record.nextActionType === 'custom' && record.nextActionText ? <p className="clear-history-detail__text">{record.nextActionText}</p> : null}</Section> : null}
  </OriginalAnswers><SavedHistoryAiHandoff sourceType="clear_record" record={record} /></div>
}

function BoatDetail({ record }: { record: LoveBoatAssessment }) {
  const { t } = useI18n(); const key = (value: string) => value as TranslationKey
  const hasResult = Boolean(record.crossResultKey || record.aLevel || record.bLevel)
  const title = record.crossResultKey ? t(key(`clear.boat.result.${record.crossResultKey}`)) : record.aLevel ? t(key(`clear.boat.insufficientTitle.${record.aLevel}`)) : undefined
  const body = record.crossResultKey ? t(key(`clear.boat.resultBody.${record.crossResultKey}.${record.resultVariantIndex ?? 0}`)) : record.aLevel ? t('clear.boat.result.insufficient') : undefined
  const hasInvestment = record.aScore !== undefined || Boolean(record.aLevel)
  const hasResponse = record.bAnsweredItems !== undefined || record.bEarnedScore !== undefined || record.bMaxPossibleScore !== undefined || record.bResponseRatio !== undefined || Boolean(record.bLevel)
  return <div className="clear-history-detail">{hasResult ? <Section title={t('clear.historyDetail.result')}>{title ? <h3>{title}</h3> : null}{body ? <p>{body}</p> : null}</Section> : null}{hasInvestment || hasResponse ? <div className="clear-history-detail__metrics">{hasInvestment ? <Section title={t('clear.historyDetail.investment')}><p>{record.aScore === undefined ? '' : t('clear.historyDetail.score', { value: record.aScore })}</p>{record.aLevel ? <p>{t(key(`clear.boat.level.${record.aLevel}`))}</p> : null}</Section> : null}{hasResponse ? <Section title={t('clear.historyDetail.response')}><p>{record.bAnsweredItems === undefined ? '' : t('clear.historyDetail.answered', { count: record.bAnsweredItems })}</p>{record.bEarnedScore !== undefined && record.bMaxPossibleScore !== undefined ? <p>{t('clear.historyDetail.score', { value: `${record.bEarnedScore} / ${record.bMaxPossibleScore}` })}</p> : null}{record.bResponseRatio !== undefined ? <p>{Math.round(record.bResponseRatio * 100)}%</p> : null}{record.bLevel ? <p>{t(key(`clear.boat.level.${record.bLevel}`))}</p> : null}</Section> : null}</div> : null}<OriginalAnswers><Text title={t('clear.historyDetail.note')} value={record.noteToSay} /><AnswerGroups groups={[['A. ' + t('clear.historyDetail.investment'), boatA, record.aAnswers ?? {}, 'clear.boat.answer.'], ['B. ' + t('clear.historyDetail.response'), boatB, record.bAnswers ?? {}, 'clear.boat.response.']]} /></OriginalAnswers><SavedHistoryAiHandoff sourceType="love_boat_code" record={record} /></div>
}

function LoveBrainDetail({ record }: { record: LoveBrainAssessment }) {
  const { t } = useI18n(); const key = (value: string) => value as TranslationKey
  const groups = brainGroups.map(([pattern, first]) => [t(key(`clear.brain.pattern.${pattern}`)), Array.from({ length: 5 }, (_, index) => `${pattern}_${String(first + index).padStart(2, '0')}`), record.answers ?? {}, 'clear.boat.answer.'] as [string, string[], Record<string, unknown>, string])
  return <div className="clear-history-detail"><LoveBrainRecordResult record={record} /><AnswerDetails groups={groups} /></div>
}

function LikeDetail({ record }: { record: LikeOrHabitReflection }) {
  const { t } = useI18n(); const key = (value: string) => value as TranslationKey
  const allAnswers = record.answers ?? {}
  return <div className="clear-history-detail">{record.resultVariantKey ? <LikeResult modules={record.activeResultModules ?? []} variantKey={record.resultVariantKey} /> : null}<OriginalAnswers>{likeGroups.map(([group, title, fields]) => {
    const answers = allAnswers[group] as Record<string, string | undefined> | undefined
    const note = group === 'realPerson' ? record.realPersonNote : group === 'habit' ? record.habitNote : group === 'fearOfLoss' ? allAnswers.fearOfLoss?.otherText : allAnswers.imaginedRelationship?.imagined_relationship_reality_description
    const items = fields.filter((field) => answers?.[field])
    const fear = group === 'fearOfLoss' ? allAnswers.fearOfLoss?.fear_of_loss_hardest_part : undefined
    if (!items.length && !note && !fear?.length) return null
    return <Section key={group} title={t(title as TranslationKey)}>{items.map((field) => <p key={field}><strong>{t(key(`clear.like.q.${field}`))}</strong><br />{t(key(`clear.like.answer.${answers![field]}`))}</p>)}{fear?.length ? <Chips values={fear.map((value) => `clear.like.option.${value}`)} /> : null}{note ? <p className="clear-history-detail__text">{note}</p> : null}</Section>
  })}</OriginalAnswers><SavedHistoryAiHandoff sourceType="like_or_habit" record={record} /></div>
}

function SavedHistoryAiHandoff({ sourceType, record }: { sourceType: 'clear_record'; record: ClearRecord } | { sourceType: 'love_boat_code'; record: LoveBoatAssessment } | { sourceType: 'like_or_habit'; record: LikeOrHabitReflection }) {
  const { locale, t } = useI18n()
  if (sourceType === 'clear_record') {
    if (!canBuildOrganizeHandoff(record)) return null
    return <ClearAiHandoff buildText={() => buildOrganizeFeelingsAiHandoffText(record, locale, t)} />
  }
  if (sourceType === 'love_boat_code') {
    if (!canBuildBoatHandoff(record)) return null
    return <ClearAiHandoff buildText={() => buildLoveBoatAiHandoffText(record, locale, t)} />
  }
  if (!canBuildLikeHandoff(record)) return null
  return <ClearAiHandoff buildText={() => buildLikeOrHabitAiHandoffText(record, locale, t)} />
}

function canBuildOrganizeHandoff(record: ClearRecord) {
  return Boolean((record.triggerType || record.triggerText) && (record.facts || record.interpretation) && record.emotions?.length && (record.nextActionType || record.nextActionText))
}

function canBuildBoatHandoff(record: LoveBoatAssessment) {
  return record.status === 'completed' && Boolean(record.aLevel && record.bLevel && Object.keys(record.aAnswers ?? {}).length && Object.keys(record.bAnswers ?? {}).length)
}

function canBuildLikeHandoff(record: LikeOrHabitReflection) {
  return record.status === 'completed' && Boolean(record.resultVariantKey)
}

function OriginalAnswers({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  return <details className="clear-history-detail__details"><summary>{t('clear.historyDetail.answers')}</summary>{children}</details>
}

function AnswerDetails({ groups }: { groups: Array<[string, string[], Record<string, unknown>, string]> }) {
  return <OriginalAnswers><AnswerGroups groups={groups} /></OriginalAnswers>
}

function AnswerGroups({ groups }: { groups: Array<[string, string[], Record<string, unknown>, string]> }) {
  const { t } = useI18n(); const key = (value: string) => value as TranslationKey
  const visible = groups.map(([name, questions, answers, prefix]) => [name, questions.filter((question) => answers[question] !== undefined), answers, prefix] as const).filter(([, questions]) => questions.length)
  if (!visible.length) return null
  return <>{visible.map(([name, questions, answers, prefix]) => <Section key={name} title={name}>{questions.map((question) => <div className="clear-history-detail__answer" key={question}><strong>{t(key(`clear.${question.startsWith('a') || question.startsWith('b') ? 'boat' : 'brain'}.q.${question}`))}</strong><span>{t('clear.historyDetail.answer', { value: t(key(prefix + String(answers[question]))) })}</span></div>)}</Section>)}</>
}
