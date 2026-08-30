import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DAILY_LOVE_QUOTE_BATCH_1_KEYS, dailyLoveQuotesBatch1 } from './dailyLoveQuotesBatch1'
import { DAILY_LOVE_QUOTE_BATCH_2_KEYS, dailyLoveQuotesBatch2 } from './dailyLoveQuotesBatch2'
import { DAILY_LOVE_QUOTE_BATCH_3_KEYS, dailyLoveQuotesBatch3 } from './dailyLoveQuotesBatch3'
import {
  DAILY_LOVE_QUOTE_BATCH_4_KEYS,
  DAILY_LOVE_QUOTE_BATCH_4_LOCALES,
  dailyLoveQuotesBatch4,
} from './dailyLoveQuotesBatch4'
import { messages } from './messages'

const expectedKeys = Array.from(
  { length: 50 },
  (_, index) => `dailyLoveQuotes.day${String(index + 151).padStart(3, '0')}`,
)

describe('Daily love quotes batch 4 localization', () => {
  it('maps exactly Day 151-200 to stable keys in order without touching earlier batches', () => {
    expect(DAILY_LOVE_QUOTE_BATCH_4_KEYS).toEqual(expectedKeys)
    expect(new Set(DAILY_LOVE_QUOTE_BATCH_4_KEYS).size).toBe(50)
    expect(DAILY_LOVE_QUOTE_BATCH_4_KEYS.some((key) => key.endsWith('day201'))).toBe(false)
    expect(DAILY_LOVE_QUOTE_BATCH_1_KEYS.at(-1)).toBe('dailyLoveQuotes.day050')
    expect(DAILY_LOVE_QUOTE_BATCH_2_KEYS.at(-1)).toBe('dailyLoveQuotes.day100')
    expect(DAILY_LOVE_QUOTE_BATCH_3_KEYS.at(-1)).toBe('dailyLoveQuotes.day150')
  })

  it('has 50 complete, non-empty, non-duplicated messages in every locale', () => {
    for (const locale of DAILY_LOVE_QUOTE_BATCH_4_LOCALES) {
      const catalog = dailyLoveQuotesBatch4[locale]
      expect(Object.keys(catalog), locale).toEqual(expectedKeys)
      expect(Object.values(catalog), locale).toHaveLength(50)
      expect(Object.values(catalog).filter((value) => value.trim().length === 0), locale).toEqual([])
      expect(new Set(Object.values(catalog)).size, locale).toBe(50)
    }
  })

  it('keeps all 50 canonical zh-TW source lines unchanged', () => {
    const source = readFileSync(resolve(process.cwd(), 'docs/starry-love-quotes-365-v1.md'), 'utf8')
    const canonicalBatch = [...source.matchAll(/## Day (\d+)\r?\n\r?\n([^\r\n]+)/g)]
      .filter((match) => Number(match[1]) >= 151 && Number(match[1]) <= 200)
      .map((match) => match[2])

    expect(canonicalBatch).toHaveLength(50)
    expect(Object.values(dailyLoveQuotesBatch4['zh-TW'])).toEqual(canonicalBatch)
  })

  it('localizes Day 159 as letting go without literal deletion wording', () => {
    const literalDeletionTerms = {
      en: 'delete', ja: '削除', ko: '삭제', es: 'borrar', fr: 'supprimer',
    } as const
    for (const locale of ['en', 'ja', 'ko', 'es', 'fr'] as const) {
      expect(dailyLoveQuotesBatch4[locale]['dailyLoveQuotes.day159'].toLowerCase(), locale)
        .not.toContain(literalDeletionTerms[locale])
    }
  })

  it('preserves the repeated Day 174-176 rhythm in every locale', () => {
    const repeatedOpenings = {
      'zh-TW': '不是每個', en: 'Not every', ja: 'すべての', ko: '모든', es: 'No tod', fr: 'Tout',
    } as const
    for (const locale of DAILY_LOVE_QUOTE_BATCH_4_LOCALES) {
      for (const day of [174, 175, 176]) {
        expect(
          dailyLoveQuotesBatch4[locale][`dailyLoveQuotes.day${day}`],
          `${locale}:day${day}`,
        ).toMatch(new RegExp(`^${repeatedOpenings[locale]}`))
      }
    }
  })

  it('keeps Day 180 feelings distinct from thoughts without clinical wording', () => {
    const day180 = Object.fromEntries(DAILY_LOVE_QUOTE_BATCH_4_LOCALES.map((locale) => [
      locale,
      dailyLoveQuotesBatch4[locale]['dailyLoveQuotes.day180'].toLowerCase(),
    ])) as Record<(typeof DAILY_LOVE_QUOTE_BATCH_4_LOCALES)[number], string>

    expect(day180['zh-TW']).toContain('情緒是真的')
    expect(day180.en).toContain('feelings are real')
    expect(day180.ja).toContain('感情は本物')
    expect(day180.ko).toContain('감정은 진짜')
    expect(day180.es).toContain('emociones son reales')
    expect(day180.fr).toContain('émotions sont réelles')
    expect(Object.values(day180).some((quote) => /disorder|diagnos|trouble|장애|障害/.test(quote))).toBe(false)
  })

  it('registers Batch 4 and passes the cumulative Day 001-200 audit', () => {
    const cumulativeKeys = [
      ...DAILY_LOVE_QUOTE_BATCH_1_KEYS,
      ...DAILY_LOVE_QUOTE_BATCH_2_KEYS,
      ...DAILY_LOVE_QUOTE_BATCH_3_KEYS,
      ...DAILY_LOVE_QUOTE_BATCH_4_KEYS,
    ]

    expect(cumulativeKeys).toHaveLength(200)
    expect(new Set(cumulativeKeys).size).toBe(200)
    expect(cumulativeKeys.some((key) => Number(key.slice(-3)) >= 201)).toBe(false)

    for (const locale of DAILY_LOVE_QUOTE_BATCH_4_LOCALES) {
      const cumulativeMessages = {
        ...dailyLoveQuotesBatch1[locale],
        ...dailyLoveQuotesBatch2[locale],
        ...dailyLoveQuotesBatch3[locale],
        ...dailyLoveQuotesBatch4[locale],
      }
      expect(Object.keys(cumulativeMessages), locale).toEqual(cumulativeKeys)
      expect(Object.values(cumulativeMessages), locale).toHaveLength(200)
      expect(Object.values(cumulativeMessages).filter((value) => value.trim().length === 0), locale).toEqual([])
      for (const key of DAILY_LOVE_QUOTE_BATCH_4_KEYS) {
        expect(messages[locale][key as keyof typeof messages['zh-TW']], `${locale}:${key}`).toBe(
          dailyLoveQuotesBatch4[locale][key],
        )
      }
    }
  })
})
