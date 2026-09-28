import { describe, expect, it, vi } from 'vitest'
import type { LoveBrainAssessment } from '../data/clearTypes'
import { EXTERNAL_AI_DESTINATIONS, buildLoveBrainAiHandoffText, copyLoveBrainAiHandoffText, openExternalAiDestination } from './loveBrainAiHandoff'

const record: LoveBrainAssessment = {
  id: 'v2-ai', status: 'completed', quizVersion: 2, answers: {}, currentQuestionIndex: 24,
  v2Scores: { rumination: 2, messagePull: 4, overInterpretation: 6, checking: 8, selfNeglect: 10, totalScore: 30 },
  noteToSay: '我想慢慢把注意力帶回自己 ❤️',
  localDate: '2026-09-27', timezone: 'Asia/Taipei', createdAt: '2026-09-27T00:00:00Z', updatedAt: '2026-09-27T00:00:00Z', completedAt: '2026-09-27T00:00:00Z',
}

describe('Love Brain external AI handoff', () => {
  it('builds the canonical V2-only prompt from scores, optional note, and fixed guidance', () => {
    const text = buildLoveBrainAiHandoffText(record, 'zh-TW')
    expect(text).toContain('《星星戀愛日記｜清醒結果》')
    expect(text).toContain('總分：30 / 75')
    expect(text).toContain('反芻：2 / 15')
    expect(text).toContain('訊息牽動：4 / 15')
    expect(text).toContain('過度解讀：6 / 15')
    expect(text).toContain('查找確認：8 / 15')
    expect(text).toContain('忽略自己：10 / 15')
    expect(text).toContain('【我想說的話】\n我想慢慢把注意力帶回自己 ❤️')
    expect(text).toContain('一次只問我一個問題')
    expect(text).not.toContain('other-private-app-data')
  })

  it('omits the note block entirely when no note exists and rejects V1 records', () => {
    expect(buildLoveBrainAiHandoffText({ ...record, noteToSay: undefined }, 'zh-TW')).not.toContain('【我想說的話】')
    expect(() => buildLoveBrainAiHandoffText({ ...record, quizVersion: 1 }, 'zh-TW')).toThrow('completed V2')
  })

  it('copies before controlled official HTTPS destinations and never reports success on a clipboard error', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    expect(await copyLoveBrainAiHandoffText('prompt', { clipboard: { writeText } } as unknown as Pick<Navigator, 'clipboard'>)).toBe(true)
    expect(writeText).toHaveBeenCalledWith('prompt')
    const opener = vi.fn().mockReturnValue({})
    expect(openExternalAiDestination('chatgpt', opener)).toBe('opened')
    expect(opener).toHaveBeenCalledWith(EXTERNAL_AI_DESTINATIONS.chatgpt, '_blank', 'noopener,noreferrer')
    expect(openExternalAiDestination('gemini', vi.fn().mockReturnValue(null))).toBe('unconfirmed')
    expect(openExternalAiDestination('gemini', vi.fn(() => { throw new Error('blocked') }))).toBe('failed')
    expect(await copyLoveBrainAiHandoffText('prompt', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } } as unknown as Pick<Navigator, 'clipboard'>)).toBe(false)
  })
})
