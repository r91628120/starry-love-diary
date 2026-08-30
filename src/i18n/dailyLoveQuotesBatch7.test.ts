import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DAILY_LOVE_QUOTE_BATCH_1_KEYS, dailyLoveQuotesBatch1 } from './dailyLoveQuotesBatch1'
import { DAILY_LOVE_QUOTE_BATCH_2_KEYS, dailyLoveQuotesBatch2 } from './dailyLoveQuotesBatch2'
import { DAILY_LOVE_QUOTE_BATCH_3_KEYS, dailyLoveQuotesBatch3 } from './dailyLoveQuotesBatch3'
import { DAILY_LOVE_QUOTE_BATCH_4_KEYS, dailyLoveQuotesBatch4 } from './dailyLoveQuotesBatch4'
import { DAILY_LOVE_QUOTE_BATCH_5_KEYS, dailyLoveQuotesBatch5 } from './dailyLoveQuotesBatch5'
import { DAILY_LOVE_QUOTE_BATCH_6_KEYS, dailyLoveQuotesBatch6 } from './dailyLoveQuotesBatch6'
import {
  DAILY_LOVE_QUOTE_BATCH_7_KEYS,
  DAILY_LOVE_QUOTE_BATCH_7_LOCALES,
  dailyLoveQuotesBatch7,
} from './dailyLoveQuotesBatch7'
import { messages } from './messages'

const expectedKeys = Array.from(
  { length: 65 },
  (_, index) => `dailyLoveQuotes.day${String(index + 301).padStart(3, '0')}`,
)

const allKeys = [
  ...DAILY_LOVE_QUOTE_BATCH_1_KEYS,
  ...DAILY_LOVE_QUOTE_BATCH_2_KEYS,
  ...DAILY_LOVE_QUOTE_BATCH_3_KEYS,
  ...DAILY_LOVE_QUOTE_BATCH_4_KEYS,
  ...DAILY_LOVE_QUOTE_BATCH_5_KEYS,
  ...DAILY_LOVE_QUOTE_BATCH_6_KEYS,
  ...DAILY_LOVE_QUOTE_BATCH_7_KEYS,
]

function allMessagesFor(locale: (typeof DAILY_LOVE_QUOTE_BATCH_7_LOCALES)[number]) {
  return {
    ...dailyLoveQuotesBatch1[locale],
    ...dailyLoveQuotesBatch2[locale],
    ...dailyLoveQuotesBatch3[locale],
    ...dailyLoveQuotesBatch4[locale],
    ...dailyLoveQuotesBatch5[locale],
    ...dailyLoveQuotesBatch6[locale],
    ...dailyLoveQuotesBatch7[locale],
  }
}

describe('Daily love quotes batch 7 and complete localization', () => {
  it('maps exactly Day 301-365 to stable keys in order', () => {
    expect(DAILY_LOVE_QUOTE_BATCH_7_KEYS).toEqual(expectedKeys)
    expect(new Set(DAILY_LOVE_QUOTE_BATCH_7_KEYS).size).toBe(65)
    expect(DAILY_LOVE_QUOTE_BATCH_7_KEYS.at(0)).toBe('dailyLoveQuotes.day301')
    expect(DAILY_LOVE_QUOTE_BATCH_7_KEYS.at(-1)).toBe('dailyLoveQuotes.day365')
  })

  it('has 65 complete, non-empty, non-duplicated messages in every locale', () => {
    for (const locale of DAILY_LOVE_QUOTE_BATCH_7_LOCALES) {
      const catalog = dailyLoveQuotesBatch7[locale]
      expect(Object.keys(catalog), locale).toEqual(expectedKeys)
      expect(Object.values(catalog), locale).toHaveLength(65)
      expect(Object.values(catalog).filter((value) => value.trim().length === 0), locale).toEqual([])
      expect(new Set(Object.values(catalog)).size, locale).toBe(65)
    }
  })

  it('keeps all Day 301-365 canonical zh-TW source lines unchanged', () => {
    const source = readFileSync(resolve(process.cwd(), 'docs/starry-love-quotes-365-v1.md'), 'utf8')
    const canonicalBatch = [...source.matchAll(/## Day (\d+)\r?\n\r?\n([^\r\n]+)/g)]
      .filter((match) => Number(match[1]) >= 301 && Number(match[1]) <= 365)
      .map((match) => match[2])

    expect(canonicalBatch).toHaveLength(65)
    expect(Object.values(dailyLoveQuotesBatch7['zh-TW'])).toEqual(canonicalBatch)
  })

  it('passes the complete Day 001-365 six-locale audit', () => {
    expect(allKeys).toHaveLength(365)
    expect(new Set(allKeys).size).toBe(365)
    expect(allKeys).toEqual(Array.from(
      { length: 365 },
      (_, index) => `dailyLoveQuotes.day${String(index + 1).padStart(3, '0')}`,
    ))

    let totalStrings = 0
    for (const locale of DAILY_LOVE_QUOTE_BATCH_7_LOCALES) {
      const catalog = allMessagesFor(locale)
      expect(Object.keys(catalog), locale).toEqual(allKeys)
      expect(Object.values(catalog), locale).toHaveLength(365)
      expect(Object.values(catalog).filter((value) => value.trim().length === 0), locale).toEqual([])
      totalStrings += Object.values(catalog).length
    }
    expect(totalStrings).toBe(2190)
  })

  it('has zero canonical mismatch across all 365 zh-TW days', () => {
    const source = readFileSync(resolve(process.cwd(), 'docs/starry-love-quotes-365-v1.md'), 'utf8')
    const canonical = [...source.matchAll(/## Day (\d+)\r?\n\r?\n([^\r\n]+)/g)].map((match) => match[2])
    expect(canonical).toHaveLength(365)
    expect(Object.values(allMessagesFor('zh-TW'))).toEqual(canonical)
  })

  it('keeps every requested cross-day group contiguous and complete', () => {
    const groups = [[98, 99, 100], [173, 174, 175, 176], [181, 182, 183, 184], [251, 252, 253], [300, 301]]
    for (const locale of DAILY_LOVE_QUOTE_BATCH_7_LOCALES) {
      const catalog = allMessagesFor(locale)
      for (const group of groups) {
        const keys = group.map((day) => `dailyLoveQuotes.day${String(day).padStart(3, '0')}`)
        expect(keys.map((key) => catalog[key]).filter(Boolean), `${locale}:${group.join('-')}`).toHaveLength(group.length)
        expect(new Set(keys.map((key) => catalog[key])).size, `${locale}:${group.join('-')}`).toBe(group.length)
      }
    }
  })

  it('switches locale copy without changing the selected Day key or retaining stale text', () => {
    const selectedKey = 'dailyLoveQuotes.day346'
    const rendered = DAILY_LOVE_QUOTE_BATCH_7_LOCALES.map((locale) => ({
      key: selectedKey,
      text: (messages[locale] as Record<string, string>)[selectedKey],
      expected: allMessagesFor(locale)[selectedKey],
    }))

    expect(rendered.every(({ key }) => key === selectedKey)).toBe(true)
    expect(rendered.every(({ text, expected }) => text === expected)).toBe(true)
    expect(new Set(rendered.map(({ text }) => text)).size).toBe(6)
    expect((messages['zh-TW'] as Record<string, string>)[selectedKey]).toBe(rendered[0].text)
  })
})
