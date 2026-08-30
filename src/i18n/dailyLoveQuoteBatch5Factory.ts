export const DAILY_LOVE_QUOTE_BATCH_5_LOCALES = ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const

export type DailyLoveQuoteBatch5Locale = (typeof DAILY_LOVE_QUOTE_BATCH_5_LOCALES)[number]

export const DAILY_LOVE_QUOTE_BATCH_5_KEYS = Array.from(
  { length: 50 },
  (_, index) => `dailyLoveQuotes.day${String(index + 201).padStart(3, '0')}`,
)

export function createDailyLoveQuoteBatch5(locale: DailyLoveQuoteBatch5Locale, quotes: readonly string[]) {
  if (quotes.length !== DAILY_LOVE_QUOTE_BATCH_5_KEYS.length) {
    throw new Error(`Daily love quote locale ${locale} has ${quotes.length}/50 entries in batch 5`)
  }

  if (quotes.some((quote) => quote.trim().length === 0)) {
    throw new Error(`Daily love quote locale ${locale} contains an empty entry in batch 5`)
  }

  return Object.fromEntries(
    DAILY_LOVE_QUOTE_BATCH_5_KEYS.map((key, index) => [key, quotes[index]]),
  ) as Record<(typeof DAILY_LOVE_QUOTE_BATCH_5_KEYS)[number], string>
}
