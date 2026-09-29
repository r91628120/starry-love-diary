import { describe, expect, it } from 'vitest'
import { messages } from './messages'

describe('French user-facing typography', () => {
  it('does not place whitespace between an apostrophe and the following letter', () => {
    const invalidValues = Object.entries(messages.fr).filter(([, value]) => /[’']\s+\p{L}/u.test(value))

    expect(invalidValues).toEqual([])
  })

  it('keeps English About-page titles in Title Case', () => {
    expect(messages.en['settings.about.privacyPolicy']).toBe('Privacy Policy')
    expect(messages.en['settings.about.terms']).toBe('Terms of Use')
  })
})
