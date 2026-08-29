import { getDeviceTimezone, toLocalDate } from '../../services/localDateService'
import type {
  BoatCrossResultKey,
  BoatInvestmentAnswer,
  BoatInvestmentQuestionKey,
  BoatResponseAnswer,
  BoatResponseQuestionKey,
  ClearActionType,
  ClearEmotion,
  ClearNeed,
  ClearRecord,
  ClearToolSourceType,
  ClearTriggerType,
  InvestmentLevel,
  LikeOrHabitAnswers,
  LikeOrHabitCombinationKey,
  LikeOrHabitDimension,
  LikeOrHabitReflection,
  LikeOrHabitResultVariantKey,
  LikeOrHabitSection,
  LoveBoatAssessment,
  LoveBrainAssessment,
  LoveBrainPattern,
  LoveBrainQuestionKey,
  LoveBrainScores,
  ResponseLevel,
} from '../clearTypes'
import type { StorageAdapter, StoreName } from '../storage/StorageAdapter'
import type { Star } from '../types'
import type { AwardWriter } from './repositories'

function now() { return new Date().toISOString() }
function id(prefix: string) { return prefix + '-' + crypto.randomUUID() }
function count(value?: string) { return [...(value ?? '')].length }

export class ClearDataValidationError extends Error {
  constructor(message: string, readonly code: string) {
    super(message)
    this.name = 'ClearDataValidationError'
  }
}

function validateText(value: string | undefined, max: number, code: string) {
  if (count(value) > max) throw new ClearDataValidationError('Text exceeds ' + max + ' characters', code)
  const normalized = value?.trim()
  return normalized || undefined
}

function requireDraft<T extends { status: 'draft' | 'completed' }>(record: T | undefined, label: string): T {
  if (!record) throw new ClearDataValidationError(label + ' not found', 'not_found')
  if (record.status === 'completed') throw new ClearDataValidationError('Completed records are locked', 'completed_locked')
  return record
}

async function listNewest<T extends { createdAt: string }>(storage: StorageAdapter, store: StoreName) {
  return (await storage.getAll<T>(store)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

async function deleteLinkedRecord(storage: StorageAdapter, store: StoreName, record: { id: string; clearMindStarId?: string } | undefined, deleteStar: boolean) {
  if (!record) return
  if (deleteStar && record.clearMindStarId) await storage.delete('stars', record.clearMindStarId)
  await storage.delete(store, record.id)
}

async function saveLinkedClearStar<T extends { id: string; status?: 'draft' | 'completed'; localDate: string; clearMindStarId?: string; updatedAt: string }>(
  storage: StorageAdapter,
  store: StoreName,
  record: T,
  sourceType: ClearToolSourceType,
) {
  if (record.status === 'draft') throw new ClearDataValidationError('Only completed records can become stars', 'completion_required')
  const existing = (await storage.getAll<Star>('stars')).find((star) => star.type === 'clear_mind' && star.sourceType === sourceType && star.sourceId === record.id)
  if (existing) {
    if (record.clearMindStarId !== existing.id) await storage.put(store, { ...record, clearMindStarId: existing.id, updatedAt: now() })
    return { star: existing, created: false }
  }
  const timestamp = now()
  const star: Star = {
    id: id('star'),
    type: 'clear_mind',
    sourceType,
    sourceId: record.id,
    content: sourceType,
    localDate: record.localDate,
    timezone: getDeviceTimezone(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await storage.put('stars', star)
  await storage.put(store, { ...record, clearMindStarId: star.id, updatedAt: timestamp })
  return { star, created: true }
}

export interface CompleteClearRecordInput {
  triggerType?: ClearTriggerType
  triggerText?: string
  facts?: string
  interpretation?: string
  unknown?: string
  emotions: ClearEmotion[]
  emotionIntensity: 1 | 2 | 3 | 4 | 5
  bodySensations?: ClearRecord['bodySensations']
  observations?: ClearRecord['observations']
  needs?: ClearNeed[]
  nextActionType?: ClearActionType
  nextActionText?: string
  localDate?: string
}

function normalizeClearInput(input: CompleteClearRecordInput): CompleteClearRecordInput {
  const normalized = {
    ...input,
    triggerText: validateText(input.triggerText, 300, 'trigger_text_too_long'),
    facts: validateText(input.facts, 300, 'facts_too_long'),
    interpretation: validateText(input.interpretation, 300, 'interpretation_too_long'),
    unknown: validateText(input.unknown, 300, 'unknown_too_long'),
    nextActionText: validateText(input.nextActionText, 150, 'next_action_text_too_long'),
    emotions: [...new Set(input.emotions)],
    bodySensations: input.bodySensations ? [...new Set(input.bodySensations)] : undefined,
    needs: input.needs ? [...new Set(input.needs)] : undefined,
  }
  if (!normalized.triggerType && !normalized.triggerText) throw new ClearDataValidationError('Step 1 requires a trigger or text', 'trigger_required')
  if (!normalized.facts && !normalized.interpretation) throw new ClearDataValidationError('Step 2 requires facts or interpretation', 'fact_or_interpretation_required')
  if (normalized.emotions.length === 0) throw new ClearDataValidationError('Step 3 requires an emotion', 'emotion_required')
  if (!normalized.nextActionType && !normalized.nextActionText) throw new ClearDataValidationError('Step 5 requires a next action', 'next_action_required')
  if (normalized.nextActionType === 'custom' && !normalized.nextActionText) throw new ClearDataValidationError('Custom action text is required', 'custom_action_required')
  return normalized
}

export class LocalClearRecordRepository {
  constructor(private readonly storage: StorageAdapter, private readonly awards: AwardWriter) {}
  async complete(input: CompleteClearRecordInput) {
    const normalized = normalizeClearInput(input)
    const timestamp = now()
    const record: ClearRecord = {
      ...normalized,
      id: id('clear-record'),
      localDate: normalized.localDate ?? toLocalDate(),
      timezone: getDeviceTimezone(),
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: timestamp,
    }
    await this.storage.put('clearRecords', record)
    await this.awards.award('clear_completed', { localDate: record.localDate, sourceId: record.id })
    return record
  }
  getById(recordId: string) { return this.storage.get<ClearRecord>('clearRecords', recordId) }
  async list() { return listNewest<ClearRecord>(this.storage, 'clearRecords') }
  async delete(recordId: string, deleteStar = false) { await deleteLinkedRecord(this.storage, 'clearRecords', await this.getById(recordId), deleteStar) }
  async saveAsClearMindStar(recordId: string) {
    const record = await this.getById(recordId)
    if (!record) throw new ClearDataValidationError('Clear record not found', 'not_found')
    return saveLinkedClearStar(this.storage, 'clearRecords', record, 'clear_record')
  }
}

export const BOAT_A_KEYS: BoatInvestmentQuestionKey[] = ['a01', 'a02', 'a03', 'a04', 'a05', 'a06', 'a07', 'a08', 'a09', 'a10', 'a11', 'a12']
export const BOAT_B_KEYS: BoatResponseQuestionKey[] = ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09', 'b10']

function validateBoatAnswers(aAnswers: LoveBoatAssessment['aAnswers'], bAnswers: LoveBoatAssessment['bAnswers']) {
  if (Object.entries(aAnswers).some(([key, value]) => !BOAT_A_KEYS.includes(key as BoatInvestmentQuestionKey) || ![0, 1, 2, 3].includes(value))) {
    throw new ClearDataValidationError('Love boat A answers are invalid', 'boat_a_answer_invalid')
  }
  if (Object.entries(bAnswers).some(([key, value]) => !BOAT_B_KEYS.includes(key as BoatResponseQuestionKey) || ![0, 1, 2, 'unknown'].includes(value))) {
    throw new ClearDataValidationError('Love boat B answers are invalid', 'boat_b_answer_invalid')
  }
}

function investmentLevel(score: number): InvestmentLevel {
  if (score <= 8) return 'investment_low'
  if (score <= 17) return 'investment_mild'
  if (score <= 26) return 'investment_high'
  return 'investment_very_high'
}

function responseLevel(answeredItems: number, ratio: number | undefined): ResponseLevel {
  if (answeredItems < 4 || ratio === undefined) return 'response_insufficient_observation'
  if (ratio < 0.35) return 'response_low'
  if (ratio < 0.6) return 'response_mixed'
  if (ratio < 0.8) return 'response_good'
  return 'response_high'
}

const A_CROSS: Record<InvestmentLevel, 'low' | 'mild' | 'high' | 'very_high'> = {
  investment_low: 'low',
  investment_mild: 'mild',
  investment_high: 'high',
  investment_very_high: 'very_high',
}
const B_CROSS: Record<Exclude<ResponseLevel, 'response_insufficient_observation'>, 'low' | 'mixed' | 'good' | 'high'> = {
  response_low: 'low',
  response_mixed: 'mixed',
  response_good: 'good',
  response_high: 'high',
}

export function calculateLoveBoat(aAnswers: LoveBoatAssessment['aAnswers'], bAnswers: LoveBoatAssessment['bAnswers']) {
  const aValues = BOAT_A_KEYS.flatMap((key) => aAnswers[key] === undefined ? [] : [aAnswers[key] as BoatInvestmentAnswer])
  const bValues = BOAT_B_KEYS.flatMap((key) => bAnswers[key] === undefined ? [] : [bAnswers[key] as BoatResponseAnswer])
  const aScore = aValues.reduce<number>((total, value) => total + value, 0)
  const aLevel = investmentLevel(aScore)
  const knownB = bValues.filter((value): value is 0 | 1 | 2 => value !== 'unknown')
  const bAnsweredItems = knownB.length
  const bEarnedScore = knownB.reduce<number>((total, value) => total + value, 0)
  const bMaxPossibleScore = bAnsweredItems * 2
  const bResponseRatio = bMaxPossibleScore > 0 ? bEarnedScore / bMaxPossibleScore : undefined
  const bLevel = responseLevel(bAnsweredItems, bResponseRatio)
  const crossResultKey = bLevel === 'response_insufficient_observation'
    ? undefined
    : (A_CROSS[aLevel] + '_' + B_CROSS[bLevel]) as BoatCrossResultKey
  return { aScore, aLevel, bAnsweredItems, bEarnedScore, bMaxPossibleScore, bResponseRatio, bLevel, crossResultKey }
}

export class LocalLoveBoatAssessmentRepository {
  constructor(private readonly storage: StorageAdapter) {}
  async createDraft() {
    const active = await this.getActiveDraft()
    if (active) return active
    const timestamp = now()
    const draft: LoveBoatAssessment = { id: id('love-boat'), status: 'draft', currentSection: 'A', currentQuestionIndex: 0, aAnswers: {}, bAnswers: {}, localDate: toLocalDate(), timezone: getDeviceTimezone(), createdAt: timestamp, updatedAt: timestamp }
    await this.storage.put('loveBoatAssessments', draft)
    return draft
  }
  getById(recordId: string) { return this.storage.get<LoveBoatAssessment>('loveBoatAssessments', recordId) }
  async list() { return (await listNewest<LoveBoatAssessment>(this.storage, 'loveBoatAssessments')).filter((item) => item.status === 'completed') }
  async getActiveDraft() { return (await listNewest<LoveBoatAssessment>(this.storage, 'loveBoatAssessments')).find((item) => item.status === 'draft') }
  async updateDraft(recordId: string, changes: Partial<Pick<LoveBoatAssessment, 'currentSection' | 'currentQuestionIndex' | 'aAnswers' | 'bAnswers'>>) {
    const existing = requireDraft(await this.getById(recordId), 'Love boat assessment')
    const aAnswers = changes.aAnswers ?? existing.aAnswers
    const bAnswers = changes.bAnswers ?? existing.bAnswers
    validateBoatAnswers(aAnswers, bAnswers)
    if (changes.currentQuestionIndex !== undefined && (!Number.isInteger(changes.currentQuestionIndex) || changes.currentQuestionIndex < 0 || changes.currentQuestionIndex > 21)) {
      throw new ClearDataValidationError('Love boat question index is invalid', 'boat_question_index_invalid')
    }
    const result = calculateLoveBoat(aAnswers, bAnswers)
    const updated: LoveBoatAssessment = { ...existing, ...changes, aAnswers, bAnswers, ...result, updatedAt: now() }
    await this.storage.put('loveBoatAssessments', updated)
    return updated
  }
  async restartDraft() {
    const active = await this.getActiveDraft()
    if (active) await this.storage.delete('loveBoatAssessments', active.id)
    return this.createDraft()
  }
  async complete(recordId: string) {
    const existing = requireDraft(await this.getById(recordId), 'Love boat assessment')
    if (BOAT_A_KEYS.some((key) => existing.aAnswers[key] === undefined) || BOAT_B_KEYS.some((key) => existing.bAnswers[key] === undefined)) {
      throw new ClearDataValidationError('All 22 questions are required', 'boat_answers_incomplete')
    }
    const result = calculateLoveBoat(existing.aAnswers, existing.bAnswers)
    const sameResultCount = (await this.list()).filter((item) => item.crossResultKey === result.crossResultKey && item.aLevel === result.aLevel && item.bLevel === result.bLevel).length
    const timestamp = now()
    const completed: LoveBoatAssessment = { ...existing, ...result, status: 'completed', currentSection: 'result', resultVariantIndex: sameResultCount % 3, completedAt: timestamp, updatedAt: timestamp }
    await this.storage.put('loveBoatAssessments', completed)
    return completed
  }
  async delete(recordId: string, deleteStar = false) { await deleteLinkedRecord(this.storage, 'loveBoatAssessments', await this.getById(recordId), deleteStar) }
  async saveAsClearMindStar(recordId: string) {
    const record = await this.getById(recordId)
    if (!record) throw new ClearDataValidationError('Love boat assessment not found', 'not_found')
    return saveLinkedClearStar(this.storage, 'loveBoatAssessments', record, 'love_boat_code')
  }
}

export const LOVE_BRAIN_PATTERNS: LoveBrainPattern[] = ['rumination', 'message_dependency', 'over_interpretation', 'detective', 'self_sacrifice']
export const LOVE_BRAIN_KEYS: LoveBrainQuestionKey[] = LOVE_BRAIN_PATTERNS.flatMap((pattern) =>
  ['01', '02', '03', '04', '05'].map((number) => (pattern + '_' + number) as LoveBrainQuestionKey),
)

export function calculateLoveBrain(answers: LoveBrainAssessment['answers']) {
  const scoreFor = (pattern: LoveBrainPattern) => LOVE_BRAIN_KEYS
    .filter((key) => key.startsWith(pattern + '_'))
    .reduce((total, key) => total + (answers[key] ?? 0), 0)
  const scores: LoveBrainScores = {
    rumination: scoreFor('rumination'),
    messageDependency: scoreFor('message_dependency'),
    overInterpretation: scoreFor('over_interpretation'),
    detective: scoreFor('detective'),
    selfSacrifice: scoreFor('self_sacrifice'),
    total: 0,
  }
  scores.total = scores.rumination + scores.messageDependency + scores.overInterpretation + scores.detective + scores.selfSacrifice
  const byPattern: Record<LoveBrainPattern, number> = {
    rumination: scores.rumination,
    message_dependency: scores.messageDependency,
    over_interpretation: scores.overInterpretation,
    detective: scores.detective,
    self_sacrifice: scores.selfSacrifice,
  }
  const isLowOverall = scores.total <= 18
  if (isLowOverall) return { scores, isLowOverall, primaryPatterns: [] as LoveBrainPattern[] }
  const ranked = LOVE_BRAIN_PATTERNS.map((pattern) => ({ pattern, score: byPattern[pattern] })).sort((a, b) => b.score - a.score)
  const primaryPatterns = ranked.filter((item) => item.score === ranked[0].score).map((item) => item.pattern)
  const primaryPattern = primaryPatterns.length === 1 ? primaryPatterns[0] : undefined
  const secondaryPattern = primaryPattern && ranked[0].score - ranked[1].score <= 3 ? ranked[1].pattern : undefined
  return { scores, isLowOverall, primaryPatterns, primaryPattern, secondaryPattern }
}

export class LocalLoveBrainAssessmentRepository {
  constructor(private readonly storage: StorageAdapter) {}
  async createDraft() {
    const active = await this.getActiveDraft()
    if (active) return active
    const timestamp = now()
    const draft: LoveBrainAssessment = { id: id('love-brain'), status: 'draft', answers: {}, currentQuestionIndex: 0, localDate: toLocalDate(), timezone: getDeviceTimezone(), createdAt: timestamp, updatedAt: timestamp }
    await this.storage.put('loveBrainAssessments', draft)
    return draft
  }
  getById(recordId: string) { return this.storage.get<LoveBrainAssessment>('loveBrainAssessments', recordId) }
  async list() { return (await listNewest<LoveBrainAssessment>(this.storage, 'loveBrainAssessments')).filter((item) => item.status === 'completed') }
  async getActiveDraft() { return (await listNewest<LoveBrainAssessment>(this.storage, 'loveBrainAssessments')).find((item) => item.status === 'draft') }
  async updateDraft(recordId: string, changes: Partial<Pick<LoveBrainAssessment, 'answers' | 'currentQuestionIndex'>>) {
    const existing = requireDraft(await this.getById(recordId), 'Love brain assessment')
    const answers = changes.answers ?? existing.answers
    if (Object.entries(answers).some(([key, value]) => !LOVE_BRAIN_KEYS.includes(key as LoveBrainQuestionKey) || ![0, 1, 2, 3].includes(value))) {
      throw new ClearDataValidationError('Love brain answers are invalid', 'love_brain_answer_invalid')
    }
    if (changes.currentQuestionIndex !== undefined && (!Number.isInteger(changes.currentQuestionIndex) || changes.currentQuestionIndex < 0 || changes.currentQuestionIndex > 24)) {
      throw new ClearDataValidationError('Love brain question index is invalid', 'love_brain_question_index_invalid')
    }
    const calculated = calculateLoveBrain(answers)
    const updated: LoveBrainAssessment = { ...existing, ...changes, answers, ...calculated, updatedAt: now() }
    await this.storage.put('loveBrainAssessments', updated)
    return updated
  }
  async restartDraft() {
    const active = await this.getActiveDraft()
    if (active) await this.storage.delete('loveBrainAssessments', active.id)
    return this.createDraft()
  }
  async complete(recordId: string) {
    const existing = requireDraft(await this.getById(recordId), 'Love brain assessment')
    if (LOVE_BRAIN_KEYS.some((key) => existing.answers[key] === undefined)) throw new ClearDataValidationError('All 25 questions are required', 'love_brain_answers_incomplete')
    const calculated = calculateLoveBrain(existing.answers)
    const timestamp = now()
    const resultVariantKey = calculated.isLowOverall
      ? 'low_overall.v1' as const
      : calculated.primaryPattern
        ? `${calculated.primaryPattern}.v1` as const
        : 'tie.v1' as const
    const completed: LoveBrainAssessment = { ...existing, ...calculated, status: 'completed', resultVariantIndex: 0, resultVariantKey, completedAt: timestamp, updatedAt: timestamp }
    await this.storage.put('loveBrainAssessments', completed)
    return completed
  }
  async delete(recordId: string, deleteStar = false) { await deleteLinkedRecord(this.storage, 'loveBrainAssessments', await this.getById(recordId), deleteStar) }
  async saveAsClearMindStar(recordId: string) {
    const record = await this.getById(recordId)
    if (!record) throw new ClearDataValidationError('Love brain assessment not found', 'not_found')
    return saveLinkedClearStar(this.storage, 'loveBrainAssessments', record, 'love_brain_assessment')
  }
}

const LIKE_OR_HABIT_MODULE_ORDER: LikeOrHabitDimension[] = ['real_person', 'habit', 'fear_of_loss', 'imagined_relationship']
const FEAR_SUPPORT_OPTIONS = ['lose_daily_companionship', 'lose_feeling_cared_for', 'be_alone', 'investment_feels_wasted', 'no_result', 'uncertainty']

function combinationKey(modules: LikeOrHabitDimension[]): LikeOrHabitCombinationKey {
  const present = new Set(modules)
  const signature = LIKE_OR_HABIT_MODULE_ORDER.filter((module) => present.has(module)).join('|')
  const keys: Record<string, LikeOrHabitCombinationKey> = {
    real_person: 'like_only',
    habit: 'habit_only',
    fear_of_loss: 'fear_only',
    imagined_relationship: 'imagined_only',
    'real_person|habit': 'like_habit',
    'real_person|fear_of_loss': 'like_fear',
    'real_person|imagined_relationship': 'like_imagined',
    'habit|fear_of_loss': 'habit_fear',
    'habit|imagined_relationship': 'habit_imagined',
    'fear_of_loss|imagined_relationship': 'fear_imagined',
    'real_person|habit|fear_of_loss': 'like_habit_fear',
    'real_person|habit|imagined_relationship': 'like_habit_imagined',
    'real_person|fear_of_loss|imagined_relationship': 'like_fear_imagined',
    'habit|fear_of_loss|imagined_relationship': 'habit_fear_imagined',
  }
  return keys[signature] ?? 'unclear'
}

export function deriveLikeOrHabitResult(answers: LikeOrHabitAnswers): {
  activeResultModules: LikeOrHabitDimension[]
  resultCombinationKey: LikeOrHabitCombinationKey
  resultVariantKey: LikeOrHabitResultVariantKey
} {
  const real = answers.realPerson
  const habit = answers.habit
  const fear = answers.fearOfLoss
  const imagined = answers.imaginedRelationship
  const realOnePositive = real?.real_person_three_real_traits === 'yes' || real?.real_person_three_real_traits === 'some'
  const realTwoPositive = real?.real_person_without_romantic_expectation === 'yes' || real?.real_person_without_romantic_expectation === 'probably_yes'
  const realPersonTriggered = Boolean(
    (realOnePositive && realTwoPositive && real?.real_person_present_vs_future_version !== 'mostly_future')
    || (real?.real_person_present_vs_future_version === 'mostly_present' && (realOnePositive || realTwoPositive)),
  )
  const habitSupport = [
    habit?.habit_expect_regular_contact === 'often' || habit?.habit_expect_regular_contact === 'sometimes',
    habit?.habit_absence_feels_like_missing_routine === 'yes' || habit?.habit_absence_feels_like_missing_routine === 'somewhat',
    habit?.habit_missing_the_routine === 'yes' || habit?.habit_missing_the_routine === 'maybe',
  ].filter(Boolean).length
  const fearOptions = fear?.fear_of_loss_hardest_part ?? []
  const fearSupportCount = fearOptions.filter((option) => FEAR_SUPPORT_OPTIONS.includes(option)).length
  const fearTriggered = fear?.fear_of_loss_person_vs_feeling === 'mostly_feeling'
    || fear?.fear_of_loss_avoiding_discomfort === 'yes'
    || fearSupportCount >= 2
    || (fearSupportCount >= 1 && (fear?.fear_of_loss_person_vs_feeling === 'both' || fear?.fear_of_loss_avoiding_discomfort === 'sometimes'))
  const imaginedTriggered = real?.real_person_present_vs_future_version === 'mostly_future'
    || imagined?.imagined_relationship_future_more_than_reality === 'often'
    || imagined?.imagined_relationship_future_fills_present_gap === 'often'
    || (imagined?.imagined_relationship_future_more_than_reality === 'sometimes' && imagined?.imagined_relationship_future_fills_present_gap === 'sometimes')
  const triggered = new Set<LikeOrHabitDimension>()
  if (realPersonTriggered) triggered.add('real_person')
  if (habitSupport >= 2) triggered.add('habit')
  if (fearTriggered) triggered.add('fear_of_loss')
  if (imaginedTriggered) triggered.add('imagined_relationship')
  const priority: LikeOrHabitDimension[] = real?.real_person_present_vs_future_version === 'mostly_future'
    ? ['real_person', 'imagined_relationship', 'habit', 'fear_of_loss']
    : LIKE_OR_HABIT_MODULE_ORDER
  const activeResultModules = priority.filter((module) => triggered.has(module)).slice(0, 3)
  const resultCombinationKey = combinationKey(activeResultModules)
  return { activeResultModules, resultCombinationKey, resultVariantKey: `${resultCombinationKey}.v1` }
}

function validateLikeOrHabitAnswers(answers: LikeOrHabitAnswers, realPersonNote?: string, habitNote?: string, requireComplete = false) {
  if ([realPersonNote, habitNote, answers.imaginedRelationship?.imagined_relationship_reality_description].some((value) => count(value) > 300)) {
    throw new ClearDataValidationError('Reflection text must not exceed 300 characters', 'like_or_habit_text_too_long')
  }
  if (count(answers.fearOfLoss?.otherText) > 150) throw new ClearDataValidationError('Other text must not exceed 150 characters', 'like_or_habit_other_too_long')
  if (!requireComplete) return
  const required = [
    answers.realPerson?.real_person_three_real_traits,
    answers.realPerson?.real_person_without_romantic_expectation,
    answers.realPerson?.real_person_present_vs_future_version,
    answers.habit?.habit_expect_regular_contact,
    answers.habit?.habit_absence_feels_like_missing_routine,
    answers.habit?.habit_missing_the_routine,
    answers.fearOfLoss?.fear_of_loss_person_vs_feeling,
    answers.fearOfLoss?.fear_of_loss_avoiding_discomfort,
    answers.imaginedRelationship?.imagined_relationship_future_more_than_reality,
    answers.imaginedRelationship?.imagined_relationship_future_fills_present_gap,
  ]
  if (required.some((answer) => answer === undefined) || !answers.fearOfLoss?.fear_of_loss_hardest_part?.length) {
    throw new ClearDataValidationError('Every required reflection answer is needed', 'like_or_habit_answers_incomplete')
  }
  if (answers.fearOfLoss.fear_of_loss_hardest_part.includes('other') && !answers.fearOfLoss.otherText?.trim()) {
    throw new ClearDataValidationError('Other text is required when other is selected', 'like_or_habit_other_required')
  }
  if (!answers.imaginedRelationship?.imagined_relationship_reality_description?.trim()) {
    throw new ClearDataValidationError('Reality description is required', 'like_or_habit_reality_required')
  }
}

export class LocalLikeOrHabitReflectionRepository {
  constructor(private readonly storage: StorageAdapter) {}
  async createDraft() {
    const active = await this.getActiveDraft()
    if (active) return active
    const timestamp = now()
    const draft: LikeOrHabitReflection = { id: id('like-or-habit'), status: 'draft', currentSection: 'real_person', answers: {}, localDate: toLocalDate(), timezone: getDeviceTimezone(), createdAt: timestamp, updatedAt: timestamp }
    await this.storage.put('likeOrHabitReflections', draft)
    return draft
  }
  getById(recordId: string) { return this.storage.get<LikeOrHabitReflection>('likeOrHabitReflections', recordId) }
  async list() { return (await listNewest<LikeOrHabitReflection>(this.storage, 'likeOrHabitReflections')).filter((item) => item.status === 'completed') }
  async getActiveDraft() { return (await listNewest<LikeOrHabitReflection>(this.storage, 'likeOrHabitReflections')).find((item) => item.status === 'draft') }
  async updateDraft(recordId: string, changes: { currentSection?: LikeOrHabitSection; answers?: LikeOrHabitAnswers; realPersonNote?: string; habitNote?: string }) {
    const existing = requireDraft(await this.getById(recordId), 'Like or habit reflection')
    const answers = changes.answers ?? existing.answers
    const realPersonNote = changes.realPersonNote ?? existing.realPersonNote
    const habitNote = changes.habitNote ?? existing.habitNote
    validateLikeOrHabitAnswers(answers, realPersonNote, habitNote)
    const updated: LikeOrHabitReflection = { ...existing, ...changes, answers, updatedAt: now() }
    await this.storage.put('likeOrHabitReflections', updated)
    return updated
  }
  async restartDraft() {
    const active = await this.getActiveDraft()
    if (active) await this.storage.delete('likeOrHabitReflections', active.id)
    return this.createDraft()
  }
  async preview(recordId: string) {
    const existing = requireDraft(await this.getById(recordId), 'Like or habit reflection')
    validateLikeOrHabitAnswers(existing.answers, existing.realPersonNote, existing.habitNote, true)
    return deriveLikeOrHabitResult(existing.answers)
  }
  async complete(recordId: string) {
    const existing = requireDraft(await this.getById(recordId), 'Like or habit reflection')
    const result = await this.preview(recordId)
    const timestamp = now()
    const completed: LikeOrHabitReflection = { ...existing, ...result, status: 'completed', currentSection: 'result', completedAt: timestamp, updatedAt: timestamp }
    await this.storage.put('likeOrHabitReflections', completed)
    return completed
  }
  async delete(recordId: string, deleteStar = false) { await deleteLinkedRecord(this.storage, 'likeOrHabitReflections', await this.getById(recordId), deleteStar) }
  async saveAsClearMindStar(recordId: string) {
    const record = await this.getById(recordId)
    if (!record) throw new ClearDataValidationError('Like or habit reflection not found', 'not_found')
    return saveLinkedClearStar(this.storage, 'likeOrHabitReflections', record, 'like_or_habit')
  }
}
