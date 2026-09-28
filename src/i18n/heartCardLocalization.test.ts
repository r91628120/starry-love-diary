import { describe, expect, it } from 'vitest'
import { heartCardMessages } from './heartCardMessages'

describe('heart card six-language catalog', () => {
  it('has the same non-empty keys in every supported locale', () => {
    const canonical = Object.keys(heartCardMessages['zh-TW']).sort()
    for (const [locale, messages] of Object.entries(heartCardMessages)) {
      expect(Object.keys(messages).sort(), locale).toEqual(canonical)
      expect(Object.values(messages).every((value) => value.trim().length > 0), locale).toBe(true)
    }
  })

  it('defines the V2 limit and error messages in all six locales', () => {
    for (const messages of Object.values(heartCardMessages)) {
      for (const key of ['heartCard.hint', 'heartCard.tooLong', 'heartCard.limitExceeded', 'heartCard.layoutOverflow'] as const) expect(messages[key].trim()).not.toBe('')
      expect(messages['heartCard.hint']).toContain('300')
      expect(messages['heartCard.tooLong']).toContain('300')
      expect(`${messages['heartCard.hint']} ${messages['heartCard.tooLong']}`).not.toMatch(/60\s*(字|characters|文字|자|caracteres|caractères)/i)
    }
  })
})
