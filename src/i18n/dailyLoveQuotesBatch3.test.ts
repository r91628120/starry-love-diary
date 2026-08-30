import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DAILY_LOVE_QUOTE_BATCH_1_KEYS, dailyLoveQuotesBatch1 } from './dailyLoveQuotesBatch1'
import { DAILY_LOVE_QUOTE_BATCH_2_KEYS, dailyLoveQuotesBatch2 } from './dailyLoveQuotesBatch2'
import {
  DAILY_LOVE_QUOTE_BATCH_3_KEYS,
  DAILY_LOVE_QUOTE_BATCH_3_LOCALES,
  dailyLoveQuotesBatch3,
} from './dailyLoveQuotesBatch3'
import { messages } from './messages'

const expectedKeys = Array.from(
  { length: 50 },
  (_, index) => `dailyLoveQuotes.day${String(index + 101).padStart(3, '0')}`,
)

describe('Daily love quotes batch 3 localization', () => {
  it('maps exactly Day 101-150 to stable keys in order without touching earlier batches', () => {
    expect(DAILY_LOVE_QUOTE_BATCH_3_KEYS).toEqual(expectedKeys)
    expect(new Set(DAILY_LOVE_QUOTE_BATCH_3_KEYS).size).toBe(50)
    expect(DAILY_LOVE_QUOTE_BATCH_3_KEYS.some((key) => key.endsWith('day151'))).toBe(false)
    expect(DAILY_LOVE_QUOTE_BATCH_1_KEYS.at(-1)).toBe('dailyLoveQuotes.day050')
    expect(DAILY_LOVE_QUOTE_BATCH_2_KEYS.at(-1)).toBe('dailyLoveQuotes.day100')
  })

  it('has 50 complete, non-empty, non-duplicated messages in every locale', () => {
    for (const locale of DAILY_LOVE_QUOTE_BATCH_3_LOCALES) {
      const catalog = dailyLoveQuotesBatch3[locale]
      expect(Object.keys(catalog), locale).toEqual(expectedKeys)
      expect(Object.values(catalog), locale).toHaveLength(50)
      expect(Object.values(catalog).filter((value) => value.trim().length === 0), locale).toEqual([])
      expect(new Set(Object.values(catalog)).size, locale).toBe(50)
    }
  })

  it('keeps all 50 canonical zh-TW source lines unchanged', () => {
    const source = readFileSync(resolve(process.cwd(), 'docs/starry-love-quotes-365-v1.md'), 'utf8')
    const canonicalBatch = [...source.matchAll(/## Day (\d+)\r?\n\r?\n([^\r\n]+)/g)]
      .filter((match) => Number(match[1]) >= 101 && Number(match[1]) <= 150)
      .map((match) => match[2])

    expect(canonicalBatch).toHaveLength(50)
    expect(Object.values(dailyLoveQuotesBatch3['zh-TW'])).toEqual(canonicalBatch)
  })

  it('preserves both uncertainty markers in every Day 108 localization', () => {
    expect(dailyLoveQuotesBatch3['zh-TW']['dailyLoveQuotes.day108']).toContain('有時候')
    expect(dailyLoveQuotesBatch3['zh-TW']['dailyLoveQuotes.day108']).toContain('不一定')
    expect(dailyLoveQuotesBatch3.en['dailyLoveQuotes.day108']).toContain('Sometimes')
    expect(dailyLoveQuotesBatch3.en['dailyLoveQuotes.day108']).toContain('not necessarily')
    expect(dailyLoveQuotesBatch3.ja['dailyLoveQuotes.day108']).toContain('ときには')
    expect(dailyLoveQuotesBatch3.ja['dailyLoveQuotes.day108']).toContain('必ずしも')
    expect(dailyLoveQuotesBatch3.ko['dailyLoveQuotes.day108']).toContain('때로는')
    expect(dailyLoveQuotesBatch3.ko['dailyLoveQuotes.day108']).toContain('반드시')
    expect(dailyLoveQuotesBatch3.es['dailyLoveQuotes.day108']).toContain('A veces')
    expect(dailyLoveQuotesBatch3.es['dailyLoveQuotes.day108']).toContain('no necesariamente')
    expect(dailyLoveQuotesBatch3.fr['dailyLoveQuotes.day108']).toContain('Parfois')
    expect(dailyLoveQuotesBatch3.fr['dailyLoveQuotes.day108']).toContain('pas nécessairement')
  })

  it('registers the same Day 101-150 mapping in the app message catalog', () => {
    for (const locale of DAILY_LOVE_QUOTE_BATCH_3_LOCALES) {
      for (const key of DAILY_LOVE_QUOTE_BATCH_3_KEYS) {
        expect(messages[locale][key as keyof typeof messages['zh-TW']], `${locale}:${key}`).toBe(
          dailyLoveQuotesBatch3[locale][key],
        )
      }
    }
  })

  it('passes the cumulative Day 001-150 key and message audit in every locale', () => {
    const cumulativeKeys = [
      ...DAILY_LOVE_QUOTE_BATCH_1_KEYS,
      ...DAILY_LOVE_QUOTE_BATCH_2_KEYS,
      ...DAILY_LOVE_QUOTE_BATCH_3_KEYS,
    ]

    expect(cumulativeKeys).toHaveLength(150)
    expect(new Set(cumulativeKeys).size).toBe(150)
    expect(cumulativeKeys.some((key) => Number(key.slice(-3)) >= 151)).toBe(false)

    for (const locale of DAILY_LOVE_QUOTE_BATCH_3_LOCALES) {
      const cumulativeMessages = {
        ...dailyLoveQuotesBatch1[locale],
        ...dailyLoveQuotesBatch2[locale],
        ...dailyLoveQuotesBatch3[locale],
      }
      expect(Object.keys(cumulativeMessages), locale).toEqual(cumulativeKeys)
      expect(Object.values(cumulativeMessages), locale).toHaveLength(150)
      expect(Object.values(cumulativeMessages).filter((value) => value.trim().length === 0), locale).toEqual([])
    }
  })
})
