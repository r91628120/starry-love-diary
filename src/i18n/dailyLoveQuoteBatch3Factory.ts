export const DAILY_LOVE_QUOTE_BATCH_3_LOCALES = ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const

export type DailyLoveQuoteBatch3Locale = (typeof DAILY_LOVE_QUOTE_BATCH_3_LOCALES)[number]

export const DAILY_LOVE_QUOTE_BATCH_3_KEYS = Array.from(
  { length: 50 },
  (_, index) => `dailyLoveQuotes.day${String(index + 101).padStart(3, '0')}`,
)

export function createDailyLoveQuoteBatch3(locale: DailyLoveQuoteBatch3Locale, quotes: readonly string[]) {
  if (quotes.length !== DAILY_LOVE_QUOTE_BATCH_3_KEYS.length) {
    throw new Error(`Daily love quote locale ${locale} has ${quotes.length}/50 entries in batch 3`)
  }

  if (quotes.some((quote) => quote.trim().length === 0)) {
    throw new Error(`Daily love quote locale ${locale} contains an empty entry in batch 3`)
  }

  return Object.fromEntries(
    DAILY_LOVE_QUOTE_BATCH_3_KEYS.map((key, index) => [key, quotes[index]]),
  ) as Record<(typeof DAILY_LOVE_QUOTE_BATCH_3_KEYS)[number], string>
}
