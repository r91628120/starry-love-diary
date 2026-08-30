export const DAILY_LOVE_QUOTE_BATCH_6_LOCALES = ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const

export type DailyLoveQuoteBatch6Locale = (typeof DAILY_LOVE_QUOTE_BATCH_6_LOCALES)[number]

export const DAILY_LOVE_QUOTE_BATCH_6_KEYS = Array.from(
  { length: 50 },
  (_, index) => `dailyLoveQuotes.day${String(index + 251).padStart(3, '0')}`,
)

export function createDailyLoveQuoteBatch6(locale: DailyLoveQuoteBatch6Locale, quotes: readonly string[]) {
  if (quotes.length !== DAILY_LOVE_QUOTE_BATCH_6_KEYS.length) {
    throw new Error(`Daily love quote locale ${locale} has ${quotes.length}/50 entries in batch 6`)
  }

  if (quotes.some((quote) => quote.trim().length === 0)) {
    throw new Error(`Daily love quote locale ${locale} contains an empty entry in batch 6`)
  }

  return Object.fromEntries(
    DAILY_LOVE_QUOTE_BATCH_6_KEYS.map((key, index) => [key, quotes[index]]),
  ) as Record<(typeof DAILY_LOVE_QUOTE_BATCH_6_KEYS)[number], string>
}
