import { describe, expect, it } from 'vitest'
import { messages, supportedLocales } from './messages'

const keys = ['clear.ai.returnSteps', 'clear.ai.returnHint', 'clear.aiReflection.response.title', 'clear.aiReflection.response.add', 'clear.aiReflection.reflection.title', 'clear.aiReflection.reflection.add', 'clear.aiReflection.tooLong'] as const

describe('AI handoff reflection localization', () => {
  it('provides every new handoff and reflection key in all supported locales', () => {
    for (const locale of supportedLocales) for (const key of keys) expect(messages[locale][key]).toBeTruthy()
  })
})
