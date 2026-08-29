import { describe, expect, it } from 'vitest'
import type { BoatInvestmentQuestionKey, BoatResponseQuestionKey, LikeOrHabitAnswers, LoveBrainQuestionKey } from './clearTypes'
import {
  BOAT_A_KEYS,
  BOAT_B_KEYS,
  ClearDataValidationError,
  LOVE_BRAIN_KEYS,
  LocalClearRecordRepository,
  LocalLikeOrHabitReflectionRepository,
  LocalLoveBoatAssessmentRepository,
  LocalLoveBrainAssessmentRepository,
  calculateLoveBoat,
  calculateLoveBrain,
  deriveLikeOrHabitResult,
} from './repositories/clearRepositories'
import { LocalScoreRepository } from './repositories/repositories'
import { initializePersistence } from './persistence'
import { ensureObjectStores, SCHEMA_VERSION } from './storage/IndexedDbStorageAdapter'
import { createMemoryStorageBacking, MemoryStorageAdapter } from './storage/MemoryStorageAdapter'
import { STORE_NAMES } from './storage/StorageAdapter'

function answeredA(value: 0 | 1 | 2 | 3) {
  return Object.fromEntries(BOAT_A_KEYS.map((key) => [key, value])) as Record<BoatInvestmentQuestionKey, 0 | 1 | 2 | 3>
}
function answeredB(value: 0 | 1 | 2 | 'unknown') {
  return Object.fromEntries(BOAT_B_KEYS.map((key) => [key, value])) as Record<BoatResponseQuestionKey, 0 | 1 | 2 | 'unknown'>
}
function answeredBrain(value: 0 | 1 | 2 | 3) {
  return Object.fromEntries(LOVE_BRAIN_KEYS.map((key) => [key, value])) as Record<LoveBrainQuestionKey, 0 | 1 | 2 | 3>
}

describe('IndexedDB v4 migration plan', () => {
  it('creates every store on a fresh install', () => {
    const created: string[] = []
    ensureObjectStores({
      objectStoreNames: { contains: () => false } as unknown as DOMStringList,
      createObjectStore: ((name: string) => { created.push(name); return {} as IDBObjectStore }) as IDBDatabase['createObjectStore'],
    })
    expect(SCHEMA_VERSION).toBe(4)
    expect(created).toEqual(STORE_NAMES)
  })

  it('adds only four Clear stores to v3 and leaves every existing store untouched', () => {
    const v3Stores = STORE_NAMES.slice(0, 11)
    const created: string[] = []
    ensureObjectStores({
      objectStoreNames: { contains: (name: string) => v3Stores.includes(name as typeof v3Stores[number]) } as unknown as DOMStringList,
      createObjectStore: ((name: string) => { created.push(name); return {} as IDBObjectStore }) as IDBDatabase['createObjectStore'],
    })
    expect(created).toEqual(['clearRecords', 'loveBoatAssessments', 'loveBrainAssessments', 'likeOrHabitReflections'])
    expect(v3Stores).toEqual(['profiles', 'settings', 'moods', 'diaries', 'stars', 'scoreAwards', 'heartPhrases', 'importantDates', 'memoryMoments', 'messageToYou', 'rememberedYouCards'])
  })

  it('upgrades v3 settings while preserving records in every existing store', async () => {
    const backing = createMemoryStorageBacking()
    const adapter = new MemoryStorageAdapter(backing)
    await adapter.open()
    const timestamp = '2026-08-30T00:00:00.000Z'
    const legacyRecords = {
      profiles: { id: 'legacy-profile', createdAt: timestamp },
      settings: { id: 'settings', locale: 'zh-TW', loveQuoteReminderEnabled: false, importantDateReminderEnabled: false, reminderTime: '20:00', schemaVersion: 3, createdAt: timestamp, updatedAt: timestamp },
      moods: { id: 'legacy-mood', localDate: '2026-08-29', mood: 'happy', timezone: 'Asia/Taipei', createdAt: timestamp, updatedAt: timestamp },
      diaries: { id: 'legacy-diary', localDate: '2026-08-29', content: 'legacy', savedAsStar: false, timezone: 'Asia/Taipei', createdAt: timestamp, updatedAt: timestamp },
      stars: { id: 'legacy-star', type: 'mood', content: 'legacy', localDate: '2026-08-29', timezone: 'Asia/Taipei', createdAt: timestamp, updatedAt: timestamp },
      scoreAwards: { id: 'legacy-award', awardType: 'mood_selected', points: 2, localDate: '2026-08-29', timezone: 'Asia/Taipei', createdAt: timestamp, updatedAt: timestamp },
      heartPhrases: { id: 'legacy-phrase', content: 'legacy', order: 0, acceptedAt: timestamp, createdAt: timestamp, updatedAt: timestamp },
      importantDates: { id: 'legacy-date', type: 'custom', title: 'legacy', date: '2026-08-29', createdAt: timestamp, updatedAt: timestamp },
      memoryMoments: { id: 'legacy-moment', content: 'legacy', localDate: '2026-08-29', order: 0, createdAt: timestamp, updatedAt: timestamp },
      messageToYou: { id: 'message-to-you', content: 'legacy', createdAt: timestamp, updatedAt: timestamp },
      rememberedYouCards: { id: 'legacy-card', title: 'legacy', content: 'legacy', localDate: '2026-08-29', isFavorite: false, createdAt: timestamp, updatedAt: timestamp },
    } as const
    for (const store of Object.keys(legacyRecords) as Array<keyof typeof legacyRecords>) await adapter.put(store, legacyRecords[store])

    const runtime = await initializePersistence({ adapter, defaultLocale: 'zh-TW', localDate: '2026-08-30' })

    expect(runtime.initial.settings.schemaVersion).toBe(4)
    for (const store of Object.keys(legacyRecords) as Array<keyof typeof legacyRecords>) {
      expect(await adapter.get(store, legacyRecords[store].id)).toBeDefined()
    }
  })
})

describe('ClearRecord repository', () => {
  it('validates completion, awards +5 once, reopens, deletes, and guards its star', async () => {
    const backing = createMemoryStorageBacking()
    const firstAdapter = new MemoryStorageAdapter(backing); await firstAdapter.open()
    const scores = new LocalScoreRepository(firstAdapter)
    const repository = new LocalClearRecordRepository(firstAdapter, scores)
    await expect(repository.complete({ emotions: [], emotionIntensity: 3 })).rejects.toBeInstanceOf(ClearDataValidationError)
    await expect(repository.complete({ triggerText: '字'.repeat(301), facts: '事實', emotions: ['anxious'], emotionIntensity: 3, nextActionType: 'take_a_walk' })).rejects.toMatchObject({ code: 'trigger_text_too_long' })
    const record = await repository.complete({ triggerType: 'no_reply', facts: '訊息還沒回', emotions: ['anxious'], emotionIntensity: 4, nextActionType: 'take_a_walk' })
    expect(await scores.getTotal()).toBe(5)
    await scores.award('clear_completed', { localDate: record.localDate, sourceId: record.id })
    expect(await scores.getTotal()).toBe(5)
    const firstStar = await repository.saveAsClearMindStar(record.id)
    const duplicate = await repository.saveAsClearMindStar(record.id)
    expect(firstStar.created).toBe(true)
    expect(duplicate.created).toBe(false)
    expect(await firstAdapter.getAll('stars')).toHaveLength(1)
    firstAdapter.close()
    const reopenedAdapter = new MemoryStorageAdapter(backing); await reopenedAdapter.open()
    const reopened = new LocalClearRecordRepository(reopenedAdapter, new LocalScoreRepository(reopenedAdapter))
    expect((await reopened.list())[0]).toMatchObject({ id: record.id, facts: '訊息還沒回' })
    await reopened.delete(record.id)
    expect(await reopened.list()).toEqual([])
    expect(await reopenedAdapter.getAll('stars')).toHaveLength(1)
    expect(await new LocalScoreRepository(reopenedAdapter).getTotal()).toBe(5)
  })
})

describe('LoveBoatAssessment repository and rules', () => {
  it('calculates A bands, unknown denominator, insufficient observation, and cross keys', () => {
    expect(calculateLoveBoat(answeredA(0), answeredB(2))).toMatchObject({ aScore: 0, aLevel: 'investment_low', bAnsweredItems: 10, bResponseRatio: 1, bLevel: 'response_high', crossResultKey: 'low_high' })
    const mostlyUnknown = answeredB('unknown')
    mostlyUnknown.b01 = 2
    mostlyUnknown.b02 = 0
    mostlyUnknown.b03 = 1
    expect(calculateLoveBoat(answeredA(3), mostlyUnknown)).toMatchObject({ aScore: 36, bAnsweredItems: 3, bEarnedScore: 3, bMaxPossibleScore: 6, bResponseRatio: 0.5, bLevel: 'response_insufficient_observation', crossResultKey: undefined })
  })

  it('autosaves and resumes A/B, recalculates preview, locks completed history, and gives no score', async () => {
    const backing = createMemoryStorageBacking()
    const firstAdapter = new MemoryStorageAdapter(backing); await firstAdapter.open()
    const repository = new LocalLoveBoatAssessmentRepository(firstAdapter)
    const draft = await repository.createDraft()
    await repository.updateDraft(draft.id, { aAnswers: { a01: 3 }, currentQuestionIndex: 1 })
    await expect(repository.updateDraft(draft.id, { aAnswers: { a01: 4 as 3 } })).rejects.toMatchObject({ code: 'boat_a_answer_invalid' })
    firstAdapter.close()
    const reopenedAdapter = new MemoryStorageAdapter(backing); await reopenedAdapter.open()
    const reopened = new LocalLoveBoatAssessmentRepository(reopenedAdapter)
    expect(await reopened.getActiveDraft()).toMatchObject({ id: draft.id, currentQuestionIndex: 1, aAnswers: { a01: 3 } })
    await reopened.updateDraft(draft.id, { aAnswers: answeredA(3), currentSection: 'B', currentQuestionIndex: 4, bAnswers: answeredB(0) })
    await reopened.updateDraft(draft.id, { aAnswers: answeredA(0), currentSection: 'result' })
    const completed = await reopened.complete(draft.id)
    expect(completed).toMatchObject({ status: 'completed', aScore: 0, crossResultKey: 'low_low' })
    await expect(reopened.updateDraft(draft.id, { currentQuestionIndex: 2 })).rejects.toMatchObject({ code: 'completed_locked' })
    const star = await reopened.saveAsClearMindStar(draft.id)
    expect(star.created).toBe(true)
    expect((await reopened.saveAsClearMindStar(draft.id)).created).toBe(false)
    expect(await reopenedAdapter.getAll('scoreAwards')).toEqual([])
  })
})

describe('LoveBrainAssessment repository and rules', () => {
  it('calculates five scores, low overall, secondary threshold, and ties without random choice', () => {
    expect(calculateLoveBrain(answeredBrain(0))).toMatchObject({ scores: { total: 0 }, isLowOverall: true, primaryPatterns: [] })
    const answers = answeredBrain(0)
    for (const key of LOVE_BRAIN_KEYS.filter((key) => key.startsWith('rumination_'))) answers[key] = 3
    for (const key of LOVE_BRAIN_KEYS.filter((key) => key.startsWith('message_dependency_')).slice(0, 4)) answers[key] = 3
    expect(calculateLoveBrain(answers)).toMatchObject({ primaryPattern: 'rumination', secondaryPattern: 'message_dependency', isLowOverall: false })
    answers.message_dependency_01 = 0
    answers.message_dependency_02 = 0
    expect(calculateLoveBrain(answers).secondaryPattern).toBeUndefined()
    const tied = answeredBrain(2)
    expect(calculateLoveBrain(tied)).toMatchObject({ primaryPattern: undefined, primaryPatterns: ['rumination', 'message_dependency', 'over_interpretation', 'detective', 'self_sacrifice'] })
  })

  it('reopens a draft, restarts with confirmation-ready API, locks completion, and guards stars', async () => {
    const backing = createMemoryStorageBacking()
    const firstAdapter = new MemoryStorageAdapter(backing); await firstAdapter.open()
    const first = new LocalLoveBrainAssessmentRepository(firstAdapter)
    const draft = await first.createDraft()
    await first.updateDraft(draft.id, { answers: { rumination_01: 2 }, currentQuestionIndex: 7 })
    await expect(first.updateDraft(draft.id, { answers: { rumination_01: 4 as 3 } })).rejects.toMatchObject({ code: 'love_brain_answer_invalid' })
    firstAdapter.close()
    const reopenedAdapter = new MemoryStorageAdapter(backing); await reopenedAdapter.open()
    const reopened = new LocalLoveBrainAssessmentRepository(reopenedAdapter)
    expect(await reopened.getActiveDraft()).toMatchObject({ currentQuestionIndex: 7 })
    await reopened.updateDraft(draft.id, { answers: answeredBrain(2), currentQuestionIndex: 24 })
    const completed = await reopened.complete(draft.id)
    expect(completed).toMatchObject({ status: 'completed', resultVariantKey: 'tie.v1', resultVariantIndex: 0 })
    await expect(reopened.updateDraft(draft.id, { currentQuestionIndex: 1 })).rejects.toMatchObject({ code: 'completed_locked' })
    expect((await reopened.saveAsClearMindStar(draft.id)).created).toBe(true)
    expect((await reopened.saveAsClearMindStar(draft.id)).created).toBe(false)
    expect(await reopenedAdapter.getAll('scoreAwards')).toEqual([])
    const newDraft = await reopened.restartDraft()
    expect(newDraft.id).not.toBe(draft.id)
  })

  it('locks stable v1 keys for low, primary, and primary plus secondary results across reopen/history', async () => {
    const backing = createMemoryStorageBacking()
    const adapter = new MemoryStorageAdapter(backing); await adapter.open()
    const repository = new LocalLoveBrainAssessmentRepository(adapter)
    const lowDraft = await repository.createDraft()
    await repository.updateDraft(lowDraft.id, { answers: answeredBrain(0) })
    expect(await repository.complete(lowDraft.id)).toMatchObject({ isLowOverall: true, resultVariantKey: 'low_overall.v1' })

    const primaryAnswers = answeredBrain(0)
    for (const question of LOVE_BRAIN_KEYS.filter((key) => key.startsWith('rumination_'))) primaryAnswers[question] = 3
    for (const question of LOVE_BRAIN_KEYS.filter((key) => key.startsWith('message_dependency_')).slice(0, 4)) primaryAnswers[question] = 3
    const primaryDraft = await repository.createDraft()
    await repository.updateDraft(primaryDraft.id, { answers: primaryAnswers })
    expect(await repository.complete(primaryDraft.id)).toMatchObject({ primaryPattern: 'rumination', secondaryPattern: 'message_dependency', resultVariantKey: 'rumination.v1' })

    const onlyPrimaryAnswers = { ...primaryAnswers }
    onlyPrimaryAnswers.message_dependency_01 = 0
    onlyPrimaryAnswers.message_dependency_02 = 0
    const onlyPrimaryDraft = await repository.createDraft()
    await repository.updateDraft(onlyPrimaryDraft.id, { answers: onlyPrimaryAnswers })
    expect(await repository.complete(onlyPrimaryDraft.id)).toMatchObject({ primaryPattern: 'rumination', secondaryPattern: undefined, resultVariantKey: 'rumination.v1' })
    adapter.close()

    const reopenedAdapter = new MemoryStorageAdapter(backing); await reopenedAdapter.open()
    const history = await new LocalLoveBrainAssessmentRepository(reopenedAdapter).list()
    expect(history.map((record) => record.resultVariantKey)).toEqual(expect.arrayContaining(['low_overall.v1', 'rumination.v1']))
  })
})

describe('LikeOrHabitReflection repository', () => {
  const baseAnswers = (): LikeOrHabitAnswers => ({
    realPerson: {
      real_person_three_real_traits: 'not_really',
      real_person_without_romantic_expectation: 'probably_no',
      real_person_present_vs_future_version: 'both',
    },
    habit: {
      habit_expect_regular_contact: 'rarely',
      habit_absence_feels_like_missing_routine: 'no',
      habit_missing_the_routine: 'no',
    },
    fearOfLoss: {
      fear_of_loss_hardest_part: ['lose_this_person'],
      fear_of_loss_person_vs_feeling: 'mostly_person',
      fear_of_loss_avoiding_discomfort: 'no',
    },
    imaginedRelationship: {
      imagined_relationship_future_more_than_reality: 'rarely',
      imagined_relationship_future_fills_present_gap: 'rarely',
      imagined_relationship_reality_description: '目前只是偶爾聊天。',
    },
  })
  function withModules(...modules: Array<'real_person' | 'habit' | 'fear_of_loss' | 'imagined_relationship'>) {
    const answers = baseAnswers()
    if (modules.includes('real_person')) answers.realPerson = { real_person_three_real_traits: 'yes', real_person_without_romantic_expectation: 'yes', real_person_present_vs_future_version: 'both' }
    if (modules.includes('habit')) answers.habit = { habit_expect_regular_contact: 'often', habit_absence_feels_like_missing_routine: 'yes', habit_missing_the_routine: 'no' }
    if (modules.includes('fear_of_loss')) answers.fearOfLoss = { fear_of_loss_hardest_part: ['be_alone', 'no_result'], fear_of_loss_person_vs_feeling: 'mostly_person', fear_of_loss_avoiding_discomfort: 'no' }
    if (modules.includes('imagined_relationship')) answers.imaginedRelationship = { ...answers.imaginedRelationship, imagined_relationship_future_more_than_reality: 'often' }
    return answers
  }

  it.each([
    [['real_person'], 'like_only'],
    [['habit'], 'habit_only'],
    [['fear_of_loss'], 'fear_only'],
    [['imagined_relationship'], 'imagined_only'],
    [['real_person', 'habit'], 'like_habit'],
    [['real_person', 'fear_of_loss'], 'like_fear'],
    [['real_person', 'imagined_relationship'], 'like_imagined'],
    [['habit', 'fear_of_loss'], 'habit_fear'],
    [['habit', 'imagined_relationship'], 'habit_imagined'],
    [['fear_of_loss', 'imagined_relationship'], 'fear_imagined'],
    [['real_person', 'habit', 'fear_of_loss'], 'like_habit_fear'],
    [['real_person', 'habit', 'imagined_relationship'], 'like_habit_imagined'],
    [['real_person', 'fear_of_loss', 'imagined_relationship'], 'like_fear_imagined'],
    [['habit', 'fear_of_loss', 'imagined_relationship'], 'habit_fear_imagined'],
  ] as const)('derives %s as %s with its stable v1 key', (modules, combination) => {
    expect(deriveLikeOrHabitResult(withModules(...modules))).toMatchObject({
      resultCombinationKey: combination,
      resultVariantKey: combination + '.v1',
    })
  })

  it('returns unclear, limits all four triggers by priority, and applies mostly_future priority override', () => {
    expect(deriveLikeOrHabitResult(baseAnswers())).toEqual({ activeResultModules: [], resultCombinationKey: 'unclear', resultVariantKey: 'unclear.v1' })
    expect(deriveLikeOrHabitResult(withModules('real_person', 'habit', 'fear_of_loss', 'imagined_relationship'))).toEqual({
      activeResultModules: ['real_person', 'habit', 'fear_of_loss'],
      resultCombinationKey: 'like_habit_fear',
      resultVariantKey: 'like_habit_fear.v1',
    })
    const future = withModules('habit', 'fear_of_loss')
    future.realPerson = { real_person_three_real_traits: 'yes', real_person_without_romantic_expectation: 'yes', real_person_present_vs_future_version: 'mostly_future' }
    expect(deriveLikeOrHabitResult(future)).toEqual({
      activeResultModules: ['imagined_relationship', 'habit', 'fear_of_loss'],
      resultCombinationKey: 'habit_fear_imagined',
      resultVariantKey: 'habit_fear_imagined.v1',
    })
  })

  it('is deterministic and independent of optional free text or locale', () => {
    const answers = withModules('real_person', 'habit')
    const expected = deriveLikeOrHabitResult(answers)
    expect(deriveLikeOrHabitResult(structuredClone(answers))).toEqual(expected)
    const changedText = structuredClone(answers)
    if (changedText.imaginedRelationship) changedText.imaginedRelationship.imagined_relationship_reality_description = '完全不同的自由文字，不應被分類。'
    expect(deriveLikeOrHabitResult(changedText)).toEqual(expected)
    for (const locale of ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr']) {
      expect({ locale, result: deriveLikeOrHabitResult(answers) }.result).toEqual(expected)
    }
  })

  it('validates requirements, keeps preview as draft, locks completion, reruns, reopens history, guards stars, and gives no score', async () => {
    const backing = createMemoryStorageBacking()
    const firstAdapter = new MemoryStorageAdapter(backing); await firstAdapter.open()
    const first = new LocalLikeOrHabitReflectionRepository(firstAdapter)
    const draft = await first.createDraft()
    await first.updateDraft(draft.id, { currentSection: 'habit', answers: withModules('real_person', 'habit'), realPersonNote: '我欣賞他的真誠' })
    await expect(first.updateDraft(draft.id, { realPersonNote: '字'.repeat(301) })).rejects.toMatchObject({ code: 'like_or_habit_text_too_long' })
    firstAdapter.close()
    const reopenedAdapter = new MemoryStorageAdapter(backing); await reopenedAdapter.open()
    const reopened = new LocalLikeOrHabitReflectionRepository(reopenedAdapter)
    expect(await reopened.getActiveDraft()).toMatchObject({ currentSection: 'habit', realPersonNote: '我欣賞他的真誠' })
    const preview = await reopened.preview(draft.id)
    expect(preview).toMatchObject({ resultCombinationKey: 'like_habit', resultVariantKey: 'like_habit.v1' })
    expect(await reopened.getById(draft.id)).toMatchObject({ status: 'draft' })
    const completed = await reopened.complete(draft.id)
    expect(completed).toMatchObject({ status: 'completed', resultCombinationKey: 'like_habit', resultVariantKey: 'like_habit.v1' })
    expect(completed).not.toHaveProperty('likeScore')
    expect(completed).not.toHaveProperty('habitScore')
    await expect(reopened.updateDraft(draft.id, { currentSection: 'result' })).rejects.toMatchObject({ code: 'completed_locked' })
    expect((await reopened.saveAsClearMindStar(draft.id)).created).toBe(true)
    expect((await reopened.saveAsClearMindStar(draft.id)).created).toBe(false)
    expect(await reopenedAdapter.getAll('scoreAwards')).toEqual([])
    const rerun = await reopened.createDraft()
    expect(rerun.id).not.toBe(draft.id)
    expect((await reopened.list())[0]).toMatchObject({ id: draft.id, resultVariantKey: 'like_habit.v1' })
  })

  it('rejects missing answers, other without text, and an empty required reality description', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const repository = new LocalLikeOrHabitReflectionRepository(adapter)
    const draft = await repository.createDraft()
    await expect(repository.preview(draft.id)).rejects.toMatchObject({ code: 'like_or_habit_answers_incomplete' })
    const otherMissing = baseAnswers()
    if (otherMissing.fearOfLoss) otherMissing.fearOfLoss.fear_of_loss_hardest_part = ['other']
    await repository.updateDraft(draft.id, { answers: otherMissing })
    await expect(repository.preview(draft.id)).rejects.toMatchObject({ code: 'like_or_habit_other_required' })
    const emptyReality = baseAnswers()
    if (emptyReality.imaginedRelationship) emptyReality.imaginedRelationship.imagined_relationship_reality_description = '   '
    await repository.updateDraft(draft.id, { answers: emptyReality })
    await expect(repository.preview(draft.id)).rejects.toMatchObject({ code: 'like_or_habit_reality_required' })
  })
})
