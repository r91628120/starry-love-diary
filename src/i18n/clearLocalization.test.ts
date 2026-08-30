import { describe, expect, it } from 'vitest'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../data/storage/MemoryStorageAdapter'
import { initializePersistence } from '../data/persistence'
import { LOVE_BRAIN_KEYS } from '../data/repositories/clearRepositories'
import type { LoveBrainQuestionKey } from '../data/clearTypes'
import { clearMilestone4Messages } from './clearMilestone4Messages'
import { clearMilestone4LocalizedMessages } from './clearMilestone4LocalizedMessages'
import { messages, supportedLocales } from './messages'

describe('Clear six-language localization', () => {
  it('has every canonical key and no empty value in all six locales', () => {
    const canonicalKeys = Object.keys(clearMilestone4Messages).sort()
    expect(canonicalKeys).toHaveLength(400)

    for (const locale of supportedLocales) {
      const catalog = locale === 'zh-TW' ? clearMilestone4Messages : clearMilestone4LocalizedMessages[locale]
      expect(Object.keys(catalog).sort(), locale).toEqual(canonicalKeys)
      expect(Object.values(catalog).filter((value) => !value.trim()), locale).toEqual([])
    }
  })

  it('has the same complete Clear UI key set for every locale', () => {
    const canonicalClearKeys = Object.keys(messages['zh-TW']).filter((key) => key.startsWith('clear.')).sort()
    expect(canonicalClearKeys).toHaveLength(445)
    for (const locale of supportedLocales) {
      const localeKeys = Object.keys(messages[locale]).filter((key) => key.startsWith('clear.')).sort()
      expect(localeKeys, locale).toEqual(canonicalClearKeys)
      expect(localeKeys.filter((key) => !messages[locale][key as keyof typeof messages['zh-TW']].trim()), locale).toEqual([])
    }
  })

  it('keeps unknown and not-sure choices distinct from negative answers', () => {
    for (const locale of supportedLocales) {
      const localeMessages = messages[locale]
      expect(localeMessages['clear.organize.answer.unknown'], locale).not.toBe(localeMessages['clear.organize.answer.no'])
      expect(localeMessages['clear.boat.response.unknown'], locale).not.toBe(localeMessages['clear.boat.response.0'])
      expect(localeMessages['clear.like.answer.not_sure'], locale).not.toBe(localeMessages['clear.like.answer.no'])
    }
  })

  it('does not fall back to English inside non-English Milestone 4 catalogs', () => {
    const languageNeutralKeys = new Set([
      'clear.common.progress',
      'clear.organize.answer.no',
      'clear.boat.response.0',
      'clear.like.answer.no',
      'clear.organize.need.respect',
    ])
    for (const locale of ['ja', 'ko', 'es', 'fr'] as const) {
      const fallbackKeys = Object.keys(clearMilestone4LocalizedMessages.en).filter((key) =>
        !languageNeutralKeys.has(key) &&
        clearMilestone4LocalizedMessages[locale][key as keyof typeof clearMilestone4Messages] ===
          clearMilestone4LocalizedMessages.en[key as keyof typeof clearMilestone4Messages],
      )
      expect(fallbackKeys, locale).toEqual([])
    }
  })

  it('localizes every static Clear-home message that remains visible at runtime', () => {
    const runtimeKeys = [
      'clear.title', 'clear.scenarios.title', 'clear.scenarios.miss', 'clear.scenarios.waitingMessage',
      'clear.scenarios.tooDeep', 'clear.scenarios.unsureFeelings', 'clear.scenarios.unsureFit',
      'clear.scenarios.selected', 'clear.tools.label', 'clear.tools.organize.title',
      'clear.tools.organize.description', 'clear.tools.boatGuide.title', 'clear.tools.boatGuide.description',
      'clear.tools.loveBrain.title', 'clear.tools.loveBrain.description', 'clear.tools.likeOrHabit.title',
      'clear.tools.likeOrHabit.description', 'clear.latest.title', 'clear.latest.imageAlt',
      'clear.latest.summaryLabel', 'clear.latest.saved', 'clear.latest.viewDetails',
      'clear.quote.title', 'clear.quote.text', 'clear.tip.title', 'clear.tip.text',
    ] as const
    for (const locale of ['ja', 'ko', 'es', 'fr'] as const) {
      expect(runtimeKeys.filter((key) => messages[locale][key] === messages.en[key]), locale).toEqual([])
    }
  })

  it('changes locale without changing a persisted draft, its answers, scores, or history', async () => {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-08-30' })
    const draft = await first.loveBoatAssessments.createDraft()
    const saved = await first.loveBoatAssessments.updateDraft(draft.id, {
      currentQuestionIndex: 2,
      aAnswers: { a01: 3, a02: 1 },
    })
    const stableSnapshot = {
      id: saved.id,
      status: saved.status,
      answers: saved.aAnswers,
      aScore: saved.aScore,
      aLevel: saved.aLevel,
      currentQuestionIndex: saved.currentQuestionIndex,
    }
    const brainDraft = await first.loveBrainAssessments.createDraft()
    const brainAnswers = Object.fromEntries(LOVE_BRAIN_KEYS.map((key) => [key, 1])) as Record<LoveBrainQuestionKey, 1>
    await first.loveBrainAssessments.updateDraft(brainDraft.id, { answers: brainAnswers, currentQuestionIndex: 24 })
    const completedBrain = await first.loveBrainAssessments.complete(brainDraft.id)
    const historySnapshot = {
      id: completedBrain.id,
      answers: completedBrain.answers,
      scores: completedBrain.scores,
      resultVariantKey: completedBrain.resultVariantKey,
      primaryPatterns: completedBrain.primaryPatterns,
    }
    const likeDraft = await first.likeOrHabitReflections.createDraft()
    const userText = '我的原文 stays exactly the same'
    await first.likeOrHabitReflections.updateDraft(likeDraft.id, { realPersonNote: userText })

    for (const locale of supportedLocales) {
      await first.settings.updateSettings({ locale })
      const reopened = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: locale, localDate: '2026-08-30' })
      const resumed = await reopened.loveBoatAssessments.getActiveDraft()
      expect({
        id: resumed?.id,
        status: resumed?.status,
        answers: resumed?.aAnswers,
        aScore: resumed?.aScore,
        aLevel: resumed?.aLevel,
        currentQuestionIndex: resumed?.currentQuestionIndex,
      }, locale).toEqual(stableSnapshot)
      expect(await reopened.loveBoatAssessments.list(), locale).toEqual([])
      const [historyRecord] = await reopened.loveBrainAssessments.list()
      expect({
        id: historyRecord.id,
        answers: historyRecord.answers,
        scores: historyRecord.scores,
        resultVariantKey: historyRecord.resultVariantKey,
        primaryPatterns: historyRecord.primaryPatterns,
      }, locale).toEqual(historySnapshot)
      expect((await reopened.likeOrHabitReflections.getActiveDraft())?.realPersonNote, locale).toBe(userText)
    }
  })
})
