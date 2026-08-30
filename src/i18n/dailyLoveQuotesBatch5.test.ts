import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DAILY_LOVE_QUOTE_BATCH_1_KEYS, dailyLoveQuotesBatch1 } from './dailyLoveQuotesBatch1'
import { DAILY_LOVE_QUOTE_BATCH_2_KEYS, dailyLoveQuotesBatch2 } from './dailyLoveQuotesBatch2'
import { DAILY_LOVE_QUOTE_BATCH_3_KEYS, dailyLoveQuotesBatch3 } from './dailyLoveQuotesBatch3'
import { DAILY_LOVE_QUOTE_BATCH_4_KEYS, dailyLoveQuotesBatch4 } from './dailyLoveQuotesBatch4'
import {
  DAILY_LOVE_QUOTE_BATCH_5_KEYS,
  DAILY_LOVE_QUOTE_BATCH_5_LOCALES,
  dailyLoveQuotesBatch5,
} from './dailyLoveQuotesBatch5'
import { messages } from './messages'

const expectedKeys = Array.from(
  { length: 50 },
  (_, index) => `dailyLoveQuotes.day${String(index + 201).padStart(3, '0')}`,
)

describe('Daily love quotes batch 5 localization', () => {
  it('maps exactly Day 201-250 to stable keys in order without touching earlier batches', () => {
    expect(DAILY_LOVE_QUOTE_BATCH_5_KEYS).toEqual(expectedKeys)
    expect(new Set(DAILY_LOVE_QUOTE_BATCH_5_KEYS).size).toBe(50)
    expect(DAILY_LOVE_QUOTE_BATCH_5_KEYS.some((key) => key.endsWith('day251'))).toBe(false)
    expect(DAILY_LOVE_QUOTE_BATCH_1_KEYS.at(-1)).toBe('dailyLoveQuotes.day050')
    expect(DAILY_LOVE_QUOTE_BATCH_2_KEYS.at(-1)).toBe('dailyLoveQuotes.day100')
    expect(DAILY_LOVE_QUOTE_BATCH_3_KEYS.at(-1)).toBe('dailyLoveQuotes.day150')
    expect(DAILY_LOVE_QUOTE_BATCH_4_KEYS.at(-1)).toBe('dailyLoveQuotes.day200')
  })

  it('has 50 complete, non-empty, non-duplicated messages in every locale', () => {
    for (const locale of DAILY_LOVE_QUOTE_BATCH_5_LOCALES) {
      const catalog = dailyLoveQuotesBatch5[locale]
      expect(Object.keys(catalog), locale).toEqual(expectedKeys)
      expect(Object.values(catalog), locale).toHaveLength(50)
      expect(Object.values(catalog).filter((value) => value.trim().length === 0), locale).toEqual([])
      expect(new Set(Object.values(catalog)).size, locale).toBe(50)
    }
  })

  it('keeps all 50 canonical zh-TW source lines unchanged', () => {
    const source = readFileSync(resolve(process.cwd(), 'docs/starry-love-quotes-365-v1.md'), 'utf8')
    const canonicalBatch = [...source.matchAll(/## Day (\d+)\r?\n\r?\n([^\r\n]+)/g)]
      .filter((match) => Number(match[1]) >= 201 && Number(match[1]) <= 250)
      .map((match) => match[2])

    expect(canonicalBatch).toHaveLength(50)
    expect(Object.values(dailyLoveQuotesBatch5['zh-TW'])).toEqual(canonicalBatch)
  })

  it('keeps Day 235 and Day 238 in everyday, non-clinical language', () => {
    const highRiskQuotes = DAILY_LOVE_QUOTE_BATCH_5_LOCALES.flatMap((locale) => [
      dailyLoveQuotesBatch5[locale]['dailyLoveQuotes.day235'].toLowerCase(),
      dailyLoveQuotesBatch5[locale]['dailyLoveQuotes.day238'].toLowerCase(),
    ])

    expect(highRiskQuotes.some((quote) =>
      /disorder|diagnos|patholog|syndrome|trastorno|trouble clinique|장애|障害/.test(quote),
    )).toBe(false)
  })

  it('registers the same Day 201-250 mapping in the app message catalog', () => {
    for (const locale of DAILY_LOVE_QUOTE_BATCH_5_LOCALES) {
      for (const key of DAILY_LOVE_QUOTE_BATCH_5_KEYS) {
        expect(messages[locale][key as keyof typeof messages['zh-TW']], `${locale}:${key}`).toBe(
          dailyLoveQuotesBatch5[locale][key],
        )
      }
    }
  })

  it('passes the cumulative Day 001-250 key and message audit in every locale', () => {
    const cumulativeKeys = [
      ...DAILY_LOVE_QUOTE_BATCH_1_KEYS,
      ...DAILY_LOVE_QUOTE_BATCH_2_KEYS,
      ...DAILY_LOVE_QUOTE_BATCH_3_KEYS,
      ...DAILY_LOVE_QUOTE_BATCH_4_KEYS,
      ...DAILY_LOVE_QUOTE_BATCH_5_KEYS,
    ]

    expect(cumulativeKeys).toHaveLength(250)
    expect(new Set(cumulativeKeys).size).toBe(250)
    expect(cumulativeKeys.some((key) => Number(key.slice(-3)) >= 251)).toBe(false)

    for (const locale of DAILY_LOVE_QUOTE_BATCH_5_LOCALES) {
      const cumulativeMessages = {
        ...dailyLoveQuotesBatch1[locale],
        ...dailyLoveQuotesBatch2[locale],
        ...dailyLoveQuotesBatch3[locale],
        ...dailyLoveQuotesBatch4[locale],
        ...dailyLoveQuotesBatch5[locale],
      }
      expect(Object.keys(cumulativeMessages), locale).toEqual(cumulativeKeys)
      expect(Object.values(cumulativeMessages), locale).toHaveLength(250)
      expect(Object.values(cumulativeMessages).filter((value) => value.trim().length === 0), locale).toEqual([])
    }
  })
})
