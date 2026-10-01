import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BoatInvestmentQuestionKey, BoatResponseQuestionKey, LikeOrHabitAnswers, LoveBrainQuestionKey } from './clearTypes'
import {
  BOAT_A_KEYS,
  BOAT_B_KEYS,
  ClearDataValidationError,
  LOVE_BRAIN_KEYS,
  LOVE_BRAIN_V2_QUESTION_DEFINITIONS,
  LocalClearFreeTalkRepository,
  LocalClearRecordRepository,
  LocalLikeOrHabitReflectionRepository,
  LocalLoveBoatAssessmentRepository,
  LocalLoveBrainAssessmentRepository,
  calculateLoveBoat,
  calculateLoveBrain,
  deriveLikeOrHabitResult,
  scoreLoveBrainAnswer,
} from './repositories/clearRepositories'
import { LocalScoreRepository } from './repositories/repositories'
import { initializePersistence } from './persistence'
import { ensureObjectStores, SCHEMA_VERSION } from './storage/IndexedDbStorageAdapter'
import { createMemoryStorageBacking, MemoryStorageAdapter } from './storage/MemoryStorageAdapter'
import { DIARY_DRAFT_V7_STORE_NAMES, FREE_TALK_V8_STORE_NAMES, LEGACY_V4_STORE_NAMES, PHOTO_V5_STORE_NAMES, STAR_DROP_V6_STORE_NAMES, STORE_NAMES } from './storage/StorageAdapter'

function answeredA(value: 0 | 1 | 2 | 3) {
  return Object.fromEntries(BOAT_A_KEYS.map((key) => [key, value])) as Record<BoatInvestmentQuestionKey, 0 | 1 | 2 | 3>
}
function answeredB(value: 0 | 1 | 2 | 'unknown') {
  return Object.fromEntries(BOAT_B_KEYS.map((key) => [key, value])) as Record<BoatResponseQuestionKey, 0 | 1 | 2 | 'unknown'>
}
function answeredBrain(value: 0 | 1 | 2 | 3) {
  return Object.fromEntries(LOVE_BRAIN_KEYS.map((key) => [key, value])) as Record<LoveBrainQuestionKey, 0 | 1 | 2 | 3>
}

function completedLikeOrHabitAnswers(): LikeOrHabitAnswers {
  return {
    realPerson: {
      real_person_three_real_traits: 'yes',
      real_person_without_romantic_expectation: 'yes',
      real_person_present_vs_future_version: 'mostly_present',
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
      imagined_relationship_reality_description: '保留對當下的觀察。',
    },
  }
}

afterEach(() => vi.useRealTimers())

describe('IndexedDB v5 migration plan', () => {
  it('creates every store on a fresh install', () => {
    const created: string[] = []
    ensureObjectStores({
      objectStoreNames: { contains: () => false } as unknown as DOMStringList,
      createObjectStore: ((name: string) => { created.push(name); return {} as IDBObjectStore }) as IDBDatabase['createObjectStore'],
    })
    expect(SCHEMA_VERSION).toBe(8)
    expect(created).toEqual(STORE_NAMES)
  })

  it('retains the v3 to v4 Clear migration path and also creates the v5 photo stores', () => {
    const v3Stores = LEGACY_V4_STORE_NAMES.slice(0, 11)
    const created: string[] = []
    ensureObjectStores({
      objectStoreNames: { contains: (name: string) => v3Stores.includes(name as typeof v3Stores[number]) } as unknown as DOMStringList,
      createObjectStore: ((name: string) => { created.push(name); return {} as IDBObjectStore }) as IDBDatabase['createObjectStore'],
    })
    expect(created).toEqual([...LEGACY_V4_STORE_NAMES.slice(11), ...PHOTO_V5_STORE_NAMES, ...STAR_DROP_V6_STORE_NAMES, ...DIARY_DRAFT_V7_STORE_NAMES, ...FREE_TALK_V8_STORE_NAMES])
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

    expect(runtime.initial.settings.schemaVersion).toBe(8)
    expect(runtime.initial.settings.onboardingCompleted).toBe(true)
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

describe('Free Talk repository', () => {
  it('keeps one active draft, completes without awards, and supports editing and deletion', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const freeTalk = new LocalClearFreeTalkRepository(adapter)
    const first = await freeTalk.createDraft('先寫下來 💛')
    expect((await freeTalk.createDraft('不應建立第二份')).id).toBe(first.id)
    const updated = await freeTalk.updateDraft(first.id, '更新後的內容 ❤️')
    expect(updated).toMatchObject({ id: first.id, status: 'draft', text: '更新後的內容 ❤️' })
    const completed = await freeTalk.complete(first.id, '完成的自由整理')
    expect(completed).toMatchObject({ id: first.id, status: 'completed' })
    expect(await freeTalk.getActiveDraft()).toBeUndefined()
    expect(await freeTalk.updateCompleted(first.id, '可再編輯')).toMatchObject({ text: '可再編輯', status: 'completed' })
    expect(await adapter.getAll('scoreAwards')).toEqual([])
    await freeTalk.delete(first.id)
    expect(await freeTalk.listAll()).toEqual([])
  })
})

describe('AI handoff reflections', () => {
  it('saves each AI field on the original five completed records without changing identities, source results, or store counts', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const clear = new LocalClearRecordRepository(adapter, new LocalScoreRepository(adapter))
    const freeTalk = new LocalClearFreeTalkRepository(adapter)
    const boat = new LocalLoveBoatAssessmentRepository(adapter)
    const brain = new LocalLoveBrainAssessmentRepository(adapter)
    const like = new LocalLikeOrHabitReflectionRepository(adapter)
    const clearRecord = await clear.complete({ triggerType: 'no_reply', facts: '尚未收到回覆', emotions: ['anxious'], emotionIntensity: 3, nextActionType: 'take_a_walk' })
    const freeTalkDraft = await freeTalk.createDraft('想慢慢說'); const freeTalkRecord = await freeTalk.complete(freeTalkDraft.id, '想慢慢說')
    const boatDraft = await boat.createDraft(); await boat.updateDraft(boatDraft.id, { aAnswers: answeredA(1), bAnswers: answeredB(1) }); const boatRecord = await boat.complete(boatDraft.id)
    const brainDraft = await brain.createDraft(); await brain.updateDraft(brainDraft.id, { answers: answeredBrain(1) }); const brainRecord = await brain.complete(brainDraft.id)
    const likeDraft = await like.createDraft(); await like.updateDraft(likeDraft.id, { answers: completedLikeOrHabitAnswers() }); const likeRecord = await like.complete(likeDraft.id)
    const sources = [
      [clearRecord, (changes: { aiResponseExcerpt?: string; postChatReflection?: string }) => clear.updateAiHandoff(clearRecord.id, changes)],
      [freeTalkRecord, (changes: { aiResponseExcerpt?: string; postChatReflection?: string }) => freeTalk.updateAiHandoff(freeTalkRecord.id, changes)],
      [boatRecord, (changes: { aiResponseExcerpt?: string; postChatReflection?: string }) => boat.updateAiHandoff(boatRecord.id, changes)],
      [brainRecord, (changes: { aiResponseExcerpt?: string; postChatReflection?: string }) => brain.updateAiHandoff(brainRecord.id, changes)],
      [likeRecord, (changes: { aiResponseExcerpt?: string; postChatReflection?: string }) => like.updateAiHandoff(likeRecord.id, changes)],
    ] as const
    const countsBefore = await Promise.all(['clearRecords', 'clearFreeTalkRecords', 'loveBoatAssessments', 'loveBrainAssessments', 'likeOrHabitReflections'].map((store) => adapter.getAll(store as 'clearRecords')))
    for (const [source, update] of sources) {
      const responseSaved = await update({ aiResponseExcerpt: 'A'.repeat(5000), postChatReflection: 'first reflection' })
      expect(responseSaved).toMatchObject({ id: source.id, createdAt: source.createdAt, localDate: source.localDate, aiResponseExcerpt: 'A'.repeat(5000), postChatReflection: 'first reflection' })
      const reflectionSaved = await update({ aiResponseExcerpt: responseSaved.aiResponseExcerpt, postChatReflection: 'B'.repeat(2000) })
      expect(reflectionSaved).toMatchObject({ id: source.id, createdAt: source.createdAt, localDate: source.localDate, aiResponseExcerpt: 'A'.repeat(5000), postChatReflection: 'B'.repeat(2000) })
      expect(reflectionSaved.updatedAt >= source.updatedAt).toBe(true)
      expect(reflectionSaved).toMatchObject(Object.fromEntries(Object.entries(source).filter(([key]) => !['aiResponseExcerpt', 'postChatReflection', 'updatedAt'].includes(key))))
      await expect(update({ aiResponseExcerpt: 'A'.repeat(5001), postChatReflection: 'ok' })).rejects.toMatchObject({ code: 'ai_response_excerpt_too_long' })
      await expect(update({ aiResponseExcerpt: 'ok', postChatReflection: 'B'.repeat(2001) })).rejects.toMatchObject({ code: 'post_chat_reflection_too_long' })
    }
    const countsAfter = await Promise.all(['clearRecords', 'clearFreeTalkRecords', 'loveBoatAssessments', 'loveBrainAssessments', 'likeOrHabitReflections'].map((store) => adapter.getAll(store as 'clearRecords')))
    expect(countsAfter.map((records) => records.length)).toEqual(countsBefore.map((records) => records.length))
  })
})

describe('Clear completion local-date contract', () => {
  it('writes completion-day localDate for all four tools, including a draft that crosses midnight', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 8, 9, 23, 55))
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const organize = new LocalClearRecordRepository(adapter, new LocalScoreRepository(adapter))
    const boat = new LocalLoveBoatAssessmentRepository(adapter)
    const brain = new LocalLoveBrainAssessmentRepository(adapter)
    const reflection = new LocalLikeOrHabitReflectionRepository(adapter)
    const boatDraft = await boat.createDraft()
    const brainDraft = await brain.createDraft()
    const reflectionDraft = await reflection.createDraft()
    await boat.updateDraft(boatDraft.id, { aAnswers: answeredA(1), bAnswers: answeredB(1) })
    await brain.updateDraft(brainDraft.id, { answers: answeredBrain(1) })
    await reflection.updateDraft(reflectionDraft.id, { answers: completedLikeOrHabitAnswers() })
    expect(boatDraft.localDate).toBe('2026-09-09')

    vi.setSystemTime(new Date(2026, 8, 10, 0, 5))
    const organized = await organize.complete({ triggerType: 'waiting_response', facts: '等待回覆', emotions: ['anxious'], emotionIntensity: 3, nextActionType: 'take_a_walk' })
    const completedBoat = await boat.complete(boatDraft.id)
    const completedBrain = await brain.complete(brainDraft.id)
    const completedReflection = await reflection.complete(reflectionDraft.id)

    for (const record of [organized, completedBoat, completedBrain, completedReflection]) {
      expect(record.localDate).toBe('2026-09-10')
      expect(record.completedAt).toBe(new Date(2026, 8, 10, 0, 5).toISOString())
    }
    const clearStar = await boat.saveAsClearMindStar(completedBoat.id)
    expect(clearStar.star.localDate).toBe('2026-09-10')
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

  it('keeps a completed Love Boat note on the same record, counts emoji by code point, and clears only the note', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const repository = new LocalLoveBoatAssessmentRepository(adapter)
    const draft = await repository.createDraft()
    await repository.updateDraft(draft.id, { aAnswers: answeredA(2), bAnswers: answeredB(1), currentSection: 'result', currentQuestionIndex: 9 })
    const completed = await repository.complete(draft.id)
    const note = Array.from({ length: 500 }, () => '✨').join('')
    const saved = await repository.updateNote(draft.id, note)
    expect(saved).toMatchObject({ id: draft.id, noteToSay: note, aScore: completed.aScore, crossResultKey: completed.crossResultKey, completedAt: completed.completedAt })
    await expect(repository.updateNote(draft.id, `${note}x`)).rejects.toMatchObject({ code: 'love_boat_note_too_long' })
    expect(await repository.updateNote(draft.id, undefined)).toMatchObject({ id: draft.id, aScore: completed.aScore, crossResultKey: completed.crossResultKey, noteToSay: undefined })
  })
})

describe('LoveBrainAssessment repository and rules', () => {
  it('keeps V1 scoring and its legacy total threshold available for unversioned completed records', () => {
    expect(calculateLoveBrain(answeredBrain(0), 1)).toMatchObject({ scores: { total: 0 }, isLowOverall: true, primaryPatterns: [] })
    const answers = answeredBrain(0)
    for (const key of LOVE_BRAIN_KEYS.filter((key) => key.startsWith('rumination_'))) answers[key] = 3
    for (const key of LOVE_BRAIN_KEYS.filter((key) => key.startsWith('message_dependency_')).slice(0, 4)) answers[key] = 3
    expect(calculateLoveBrain(answers, 1)).toMatchObject({ primaryPattern: 'rumination', secondaryPattern: 'message_dependency', isLowOverall: false })
    answers.message_dependency_01 = 0
    answers.message_dependency_02 = 0
    expect(calculateLoveBrain(answers, 1).secondaryPattern).toBeUndefined()
    const tied = answeredBrain(2)
    expect(calculateLoveBrain(tied, 1)).toMatchObject({ primaryPattern: undefined, primaryPatterns: ['rumination', 'message_dependency', 'over_interpretation', 'detective', 'self_sacrifice'] })
  })

  it('defines all 25 V2 questions once and applies reverse scoring from question metadata', () => {
    expect(LOVE_BRAIN_V2_QUESTION_DEFINITIONS).toHaveLength(25)
    expect(LOVE_BRAIN_V2_QUESTION_DEFINITIONS.map((question) => question.number)).toEqual(Array.from({ length: 25 }, (_, index) => index + 1))
    for (const pattern of ['rumination', 'message_dependency', 'over_interpretation', 'detective', 'self_sacrifice']) expect(LOVE_BRAIN_V2_QUESTION_DEFINITIONS.filter((question) => question.pattern === pattern)).toHaveLength(5)
    expect(LOVE_BRAIN_V2_QUESTION_DEFINITIONS.filter((question) => question.reverseScored).map((question) => question.number)).toEqual([4, 5, 9, 10, 14, 15, 19, 20, 24, 25])
    expect(([0, 1, 2, 3] as const).map((answer) => scoreLoveBrainAnswer(answer, false))).toEqual([0, 1, 2, 3])
    expect(([0, 1, 2, 3] as const).map((answer) => scoreLoveBrainAnswer(answer, true))).toEqual([3, 2, 1, 0])
    expect(calculateLoveBrain(answeredBrain(0), 2).v2Scores).toEqual({ rumination: 6, messagePull: 6, overInterpretation: 6, checking: 6, selfNeglect: 6, totalScore: 30 })
    expect(calculateLoveBrain(answeredBrain(3), 2).v2Scores).toEqual({ rumination: 9, messagePull: 9, overInterpretation: 9, checking: 9, selfNeglect: 9, totalScore: 45 })
    const minimum = answeredBrain(0); for (const question of LOVE_BRAIN_V2_QUESTION_DEFINITIONS.filter((item) => item.reverseScored)) minimum[question.key] = 3
    expect(calculateLoveBrain(minimum, 2).v2Scores).toEqual({ rumination: 0, messagePull: 0, overInterpretation: 0, checking: 0, selfNeglect: 0, totalScore: 0 })
    const maximum = answeredBrain(3); for (const question of LOVE_BRAIN_V2_QUESTION_DEFINITIONS.filter((item) => item.reverseScored)) maximum[question.key] = 0
    expect(calculateLoveBrain(maximum, 2).v2Scores).toEqual({ rumination: 15, messagePull: 15, overInterpretation: 15, checking: 15, selfNeglect: 15, totalScore: 75 })
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

  it('does not reinterpret an unversioned completed V1 history record with V2 scoring', async () => {
    const backing = createMemoryStorageBacking()
    const adapter = new MemoryStorageAdapter(backing); await adapter.open()
    const repository = new LocalLoveBrainAssessmentRepository(adapter)
    const legacy = { id: 'legacy-v1', status: 'completed' as const, answers: answeredBrain(0), currentQuestionIndex: 24, scores: { rumination: 0, messageDependency: 0, overInterpretation: 0, detective: 0, selfSacrifice: 0, total: 0 }, isLowOverall: true, resultVariantKey: 'low_overall.v1' as const, primaryPatterns: [], localDate: '2026-09-01', timezone: 'Asia/Taipei', createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z', completedAt: '2026-09-01T00:00:00.000Z' }
    await adapter.put('loveBrainAssessments', legacy)
    expect(await repository.getById(legacy.id)).toEqual(legacy)
    const v2Draft = await repository.createDraft()
    await repository.updateDraft(v2Draft.id, { answers: answeredBrain(2) })
    expect(await repository.complete(v2Draft.id)).toMatchObject({ quizVersion: 2, isLowOverall: false, resultVariantKey: 'tie.v1', v2Scores: { totalScore: 40 } })
    adapter.close()

    const reopenedAdapter = new MemoryStorageAdapter(backing); await reopenedAdapter.open()
    const history = await new LocalLoveBrainAssessmentRepository(reopenedAdapter).list()
    expect(history.find((record) => record.id === legacy.id)).toEqual(legacy)
  })

  it('keeps a V2 note on the same completed record, counts emoji by code point, and clears only the note', async () => {
    const adapter = new MemoryStorageAdapter(); await adapter.open()
    const repository = new LocalLoveBrainAssessmentRepository(adapter)
    const draft = await repository.createDraft()
    await repository.updateDraft(draft.id, { answers: answeredBrain(2) })
    const completed = await repository.complete(draft.id)
    const originalTime = completed.completedAt
    const prefix = '思念是一種「愛」 ❤️'
    const note = [...prefix, ...Array.from({ length: 500 - [...prefix].length }, () => '✨')].join('')
    const saved = await repository.updateNote(draft.id, note)
    expect([...note]).toHaveLength(500)
    expect(saved).toMatchObject({ id: draft.id, noteToSay: note, v2Scores: completed.v2Scores, completedAt: originalTime })
    await expect(repository.updateNote(draft.id, `${note}x`)).rejects.toMatchObject({ code: 'love_brain_note_too_long' })
    const cleared = await repository.updateNote(draft.id, undefined)
    expect(cleared).toMatchObject({ id: draft.id, status: 'completed', v2Scores: completed.v2Scores, completedAt: originalTime })
    expect(cleared.noteToSay).toBeUndefined()
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
