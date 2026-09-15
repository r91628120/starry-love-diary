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
})
