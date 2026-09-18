import { describe, expect, it } from 'vitest'
import { messages, supportedLocales } from './messages'
import { qa12DiagnosticsMessages } from './qa12DiagnosticsMessages'

describe('QA-12 diagnostic localization', () => {
  const keys = Object.keys(qa12DiagnosticsMessages['zh-TW']) as Array<keyof typeof qa12DiagnosticsMessages['zh-TW']>

  it.each(supportedLocales)('has every non-empty diagnostic key in %s', (locale) => {
    expect(Object.keys(qa12DiagnosticsMessages[locale])).toEqual(keys)
    for (const key of keys) expect(messages[locale][key].trim(), `${locale} empty ${key}`).not.toBe('')
  })
})
