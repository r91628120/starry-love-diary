import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DAILY_LOVE_QUOTE_BATCH_1_KEYS, dailyLoveQuotesBatch1 } from './dailyLoveQuotesBatch1'
import { DAILY_LOVE_QUOTE_BATCH_2_KEYS, dailyLoveQuotesBatch2 } from './dailyLoveQuotesBatch2'
import { DAILY_LOVE_QUOTE_BATCH_3_KEYS, dailyLoveQuotesBatch3 } from './dailyLoveQuotesBatch3'
import { DAILY_LOVE_QUOTE_BATCH_4_KEYS, dailyLoveQuotesBatch4 } from './dailyLoveQuotesBatch4'
import { DAILY_LOVE_QUOTE_BATCH_5_KEYS, dailyLoveQuotesBatch5 } from './dailyLoveQuotesBatch5'
import {
  DAILY_LOVE_QUOTE_BATCH_6_KEYS,
  DAILY_LOVE_QUOTE_BATCH_6_LOCALES,
  dailyLoveQuotesBatch6,
} from './dailyLoveQuotesBatch6'
import { messages } from './messages'

const expectedKeys = Array.from(
  { length: 50 },
  (_, index) => `dailyLoveQuotes.day${String(index + 251).padStart(3, '0')}`,
)

describe('Daily love quotes batch 6 localization', () => {
  it('maps exactly Day 251-300 to stable keys in order without touching earlier batches', () => {
    expect(DAILY_LOVE_QUOTE_BATCH_6_KEYS).toEqual(expectedKeys)
    expect(new Set(DAILY_LOVE_QUOTE_BATCH_6_KEYS).size).toBe(50)
    expect(DAILY_LOVE_QUOTE_BATCH_6_KEYS.some((key) => key.endsWith('day301'))).toBe(false)
    expect(DAILY_LOVE_QUOTE_BATCH_1_KEYS.at(-1)).toBe('dailyLoveQuotes.day050')
    expect(DAILY_LOVE_QUOTE_BATCH_2_KEYS.at(-1)).toBe('dailyLoveQuotes.day100')
    expect(DAILY_LOVE_QUOTE_BATCH_3_KEYS.at(-1)).toBe('dailyLoveQuotes.day150')
    expect(DAILY_LOVE_QUOTE_BATCH_4_KEYS.at(-1)).toBe('dailyLoveQuotes.day200')
    expect(DAILY_LOVE_QUOTE_BATCH_5_KEYS.at(-1)).toBe('dailyLoveQuotes.day250')
  })

  it('has 50 complete, non-empty, non-duplicated messages in every locale', () => {
    for (const locale of DAILY_LOVE_QUOTE_BATCH_6_LOCALES) {
      const catalog = dailyLoveQuotesBatch6[locale]
      expect(Object.keys(catalog), locale).toEqual(expectedKeys)
      expect(Object.values(catalog), locale).toHaveLength(50)
      expect(Object.values(catalog).filter((value) => value.trim().length === 0), locale).toEqual([])
      expect(new Set(Object.values(catalog)).size, locale).toBe(50)
    }
  })

  it('keeps all 50 canonical zh-TW source lines unchanged', () => {
    const source = readFileSync(resolve(process.cwd(), 'docs/starry-love-quotes-365-v1.md'), 'utf8')
    const canonicalBatch = [...source.matchAll(/## Day (\d+)\r?\n\r?\n([^\r\n]+)/g)]
      .filter((match) => Number(match[1]) >= 251 && Number(match[1]) <= 300)
      .map((match) => match[2])

    expect(canonicalBatch).toHaveLength(50)
    expect(Object.values(dailyLoveQuotesBatch6['zh-TW'])).toEqual(canonicalBatch)
  })

  it('preserves the repeated Day 251-253 rhythm in every locale', () => {
    const repeatedClosings = {
      'zh-TW': '更重要', en: 'matters more', ja: 'もっと大切', ko: '더 중요', es: 'es más importante', fr: 'est plus important',
    } as const
    for (const locale of DAILY_LOVE_QUOTE_BATCH_6_LOCALES) {
      for (const day of [251, 252, 253]) {
        expect(
          dailyLoveQuotesBatch6[locale][`dailyLoveQuotes.day${day}`],
          `${locale}:day${day}`,
        ).toContain(repeatedClosings[locale])
      }
    }
  })

  it('keeps Day 300 independently readable and excludes Day 301', () => {
    for (const locale of DAILY_LOVE_QUOTE_BATCH_6_LOCALES) {
      const day300 = dailyLoveQuotesBatch6[locale]['dailyLoveQuotes.day300']
      expect(day300.trim().length, locale).toBeGreaterThan(0)
      expect(day300, locale).not.toMatch(/^(And|而|そして|그리고|Y |Et )/)
      expect(`dailyLoveQuotes.day301` in dailyLoveQuotesBatch6[locale], locale).toBe(false)
    }
  })

  it('registers Batch 6 and passes the cumulative Day 001-300 audit', () => {
    const cumulativeKeys = [
      ...DAILY_LOVE_QUOTE_BATCH_1_KEYS,
      ...DAILY_LOVE_QUOTE_BATCH_2_KEYS,
      ...DAILY_LOVE_QUOTE_BATCH_3_KEYS,
      ...DAILY_LOVE_QUOTE_BATCH_4_KEYS,
      ...DAILY_LOVE_QUOTE_BATCH_5_KEYS,
      ...DAILY_LOVE_QUOTE_BATCH_6_KEYS,
    ]

    expect(cumulativeKeys).toHaveLength(300)
    expect(new Set(cumulativeKeys).size).toBe(300)
    expect(cumulativeKeys.some((key) => Number(key.slice(-3)) >= 301)).toBe(false)

    for (const locale of DAILY_LOVE_QUOTE_BATCH_6_LOCALES) {
      const cumulativeMessages = {
        ...dailyLoveQuotesBatch1[locale],
        ...dailyLoveQuotesBatch2[locale],
        ...dailyLoveQuotesBatch3[locale],
        ...dailyLoveQuotesBatch4[locale],
        ...dailyLoveQuotesBatch5[locale],
        ...dailyLoveQuotesBatch6[locale],
      }
      expect(Object.keys(cumulativeMessages), locale).toEqual(cumulativeKeys)
      expect(Object.values(cumulativeMessages), locale).toHaveLength(300)
      expect(Object.values(cumulativeMessages).filter((value) => value.trim().length === 0), locale).toEqual([])
      for (const key of DAILY_LOVE_QUOTE_BATCH_6_KEYS) {
        expect(messages[locale][key as keyof typeof messages['zh-TW']], `${locale}:${key}`).toBe(
          dailyLoveQuotesBatch6[locale][key],
        )
      }
    }
  })
})
