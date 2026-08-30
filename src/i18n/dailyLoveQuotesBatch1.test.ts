import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DAILY_LOVE_QUOTE_BATCH_1_KEYS,
  DAILY_LOVE_QUOTE_BATCH_1_LOCALES,
  dailyLoveQuotesBatch1,
} from './dailyLoveQuotesBatch1'
import { messages } from './messages'

const expectedKeys = Array.from(
  { length: 50 },
  (_, index) => `dailyLoveQuotes.day${String(index + 1).padStart(3, '0')}`,
)

describe('Daily love quotes batch 1 localization', () => {
  it('maps exactly Day 001-050 to stable keys in order', () => {
    expect(DAILY_LOVE_QUOTE_BATCH_1_KEYS).toEqual(expectedKeys)
    expect(new Set(DAILY_LOVE_QUOTE_BATCH_1_KEYS).size).toBe(50)
    expect(DAILY_LOVE_QUOTE_BATCH_1_KEYS.some((key) => key.endsWith('day051'))).toBe(false)
  })

  it('has 50 complete, non-empty, non-duplicated messages in every locale', () => {
    for (const locale of DAILY_LOVE_QUOTE_BATCH_1_LOCALES) {
      const catalog = dailyLoveQuotesBatch1[locale]
      expect(Object.keys(catalog), locale).toEqual(expectedKeys)
      expect(Object.values(catalog), locale).toHaveLength(50)
      expect(Object.values(catalog).filter((value) => value.trim().length === 0), locale).toEqual([])
      expect(new Set(Object.values(catalog)).size, locale).toBe(50)
    }
  })

  it('keeps all 50 canonical zh-TW source lines unchanged', () => {
    const source = readFileSync(resolve(process.cwd(), 'docs/starry-love-quotes-365-v1.md'), 'utf8')
    const canonicalBatch = [...source.matchAll(/## Day (\d+)\r?\n\r?\n([^\r\n]+)/g)]
      .filter((match) => Number(match[1]) <= 50)
      .map((match) => match[2])

    expect(canonicalBatch).toHaveLength(50)
    expect(Object.values(dailyLoveQuotesBatch1['zh-TW'])).toEqual(canonicalBatch)
  })

  it('registers the same Day 001-050 mapping in the app message catalog', () => {
    for (const locale of DAILY_LOVE_QUOTE_BATCH_1_LOCALES) {
      for (const key of DAILY_LOVE_QUOTE_BATCH_1_KEYS) {
        expect(messages[locale][key as keyof typeof messages['zh-TW']], `${locale}:${key}`).toBe(
          dailyLoveQuotesBatch1[locale][key],
        )
      }
    }
  })

  it('changes only rendered copy when locale changes, not the selected stable day key', () => {
    const selectedKey = 'dailyLoveQuotes.day028' as const
    const renderedByLocale = DAILY_LOVE_QUOTE_BATCH_1_LOCALES.map((locale) => ({
      locale,
      key: selectedKey,
      text: (messages[locale] as Record<string, string>)[selectedKey],
    }))

    expect(renderedByLocale.map(({ key }) => key)).toEqual(Array(6).fill(selectedKey))
    expect(new Set(renderedByLocale.map(({ text }) => text)).size).toBe(6)
  })
})
