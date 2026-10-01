import { describe, expect, it } from 'vitest'
import type { ClearRecord, LikeOrHabitReflection, LoveBoatAssessment } from '../data/clearTypes'
import { messages, type TranslationKey } from '../i18n/messages'
import { buildClearFreeTalkAiHandoffText, buildLikeOrHabitAiHandoffText, buildLoveBoatAiHandoffText, buildOrganizeFeelingsAiHandoffText } from './clearAiHandoffBuilders'

const t = (key: TranslationKey, values?: Record<string, string | number>) => Object.entries(values ?? {}).reduce((text, [name, value]) => text.replace(`{${name}}`, String(value)), messages['zh-TW'][key])
const meta = { id:'x', status:'completed' as const, localDate:'2026-09-28', timezone:'Asia/Taipei', createdAt:'x', updatedAt:'x', completedAt:'x' }

describe('Clear AI handoff builders', () => {
  it('keeps organize facts and interpretations separate, without metadata', () => {
    const record: ClearRecord = { ...meta, emotions:['anxious'], emotionIntensity:3, triggerType:'waiting_response', facts:'No reply today', interpretation:'They dislike me', unknown:'Why they are busy', needs:['clarity'], nextActionType:'put_phone_down' }
    const text = buildOrganizeFeelingsAiHandoffText(record, 'zh-TW', t)
    expect(text).toContain('【我知道的事實】\nNo reply today'); expect(text).toContain('【我現在的解讀】\nThey dislike me'); expect(text).not.toContain('clearMindStarId')
  })
  it('preserves Love Boat unknown responses and omits an empty note', () => {
    const record: LoveBoatAssessment = { ...meta, currentSection:'result', currentQuestionIndex:0, aAnswers:{a01:2}, bAnswers:{b01:'unknown'}, aScore:2, aLevel:'investment_low', bAnsweredItems:0, bLevel:'response_insufficient_observation' }
    const text = buildLoveBoatAiHandoffText(record, 'zh-TW', t)
    expect(text).toContain(t('clear.boat.response.unknown')); expect(text).toContain('目前可觀察資訊'); expect(text).not.toContain('【我想補充的情況】')
  })
  it('never invents missing Love Boat metrics as zero', () => {
    const record: LoveBoatAssessment = { ...meta, currentSection:'result', currentQuestionIndex:0, aAnswers:{a01:2}, bAnswers:{b01:'unknown'}, aLevel:'investment_low', bLevel:'response_insufficient_observation' }
    const text = buildLoveBoatAiHandoffText(record, 'zh-TW', t)
    expect(text).not.toContain('投入分數：0')
    expect(text).not.toMatch(/\n0\n/)
  })
  it('uses Like or Habit user-facing modules and omits technical keys', () => {
    const record: LikeOrHabitReflection = { ...meta, currentSection:'result', answers:{ realPerson:{real_person_three_real_traits:'yes'}, habit:{}, fearOfLoss:{}, imaginedRelationship:{} }, activeResultModules:['real_person'], resultCombinationKey:'like_only', resultVariantKey:'like_only.v1', realPersonNote:'I value their kindness' }
    const text = buildLikeOrHabitAiHandoffText(record, 'zh-TW', t)
    expect(text).toContain('I value their kindness'); expect(text).toContain(t('clear.like.module.real_person.title')); expect(text).not.toContain('resultCombinationKey')
  })
  it('does not fabricate an unclear result when a legacy Like or Habit record lacks a result key', () => {
    const record: LikeOrHabitReflection = { ...meta, currentSection:'result', answers:{ realPerson:{real_person_three_real_traits:'yes'} } }
    const text = buildLikeOrHabitAiHandoffText(record, 'zh-TW', t)
    expect(text).not.toContain('unclear.v1')
    expect(text).not.toContain(t('clear.like.result.unclear.v1.title'))
  })
  it('omits a missing Like or Habit option without moving its persisted free text', () => {
    const record: LikeOrHabitReflection = { ...meta, currentSection:'result', answers:{ imaginedRelationship:{ imagined_relationship_reality_description:'很像男女朋友的关系。' } }, resultVariantKey:'like_only.v1' }
    const text = buildLikeOrHabitAiHandoffText(record, 'zh-TW', t)
    expect(text).toContain('【我描述的現實】\n很像男女朋友的关系。')
    expect(text).not.toContain('如果只看已經發生的事情，不看期待，我會怎麼形容現在的關係？: undefined')
    expect(text).not.toMatch(/undefined|null|NaN/)
  })
  it('builds the Free Talk handoff from the current text with one-question-at-a-time guidance', () => {
    const text = buildClearFreeTalkAiHandoffText('我想先慢慢說 ❤️', 'zh-TW')
    expect(text).toContain('【我想說的話】\n我想先慢慢說 ❤️')
    expect(text).toContain('一次問一個問題')
    expect(text).not.toContain('clearFreeTalkRecords')
  })
})
