import { describe, expect, it } from 'vitest'
import { countGraphemes, splitGraphemes, truncateGraphemes } from './graphemes'

describe('graphemes', () => {
  it('counts user-perceived characters with Intl.Segmenter', () => {
    expect(countGraphemes('星光')).toBe(2)
    expect(countGraphemes('Starry Love')).toBe(11)
    expect(countGraphemes('❤️')).toBe(1)
    expect(countGraphemes('🥰')).toBe(1)
    expect(countGraphemes('👩‍❤️‍👨')).toBe(1)
    expect(countGraphemes('👨‍👩‍👧‍👦')).toBe(1)
    expect(countGraphemes('👍🏻')).toBe(1)
    expect(countGraphemes('é')).toBe(1)
    expect(countGraphemes('e\u0301')).toBe(1)
    expect(splitGraphemes('❤️🥰👩‍❤️‍👨👨‍👩‍👧‍👦👍🏻ée\u0301')).toHaveLength(7)
  })

  it.each([299, 300, 301])('retains exact grapheme boundaries at %i', (length) => {
    const value = '👩‍❤️‍👨'.repeat(length)
    expect(countGraphemes(value)).toBe(length)
    expect(countGraphemes(truncateGraphemes(value, 300))).toBe(Math.min(length, 300))
  })
})
