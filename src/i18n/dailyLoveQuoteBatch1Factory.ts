export const DAILY_LOVE_QUOTE_BATCH_1_LOCALES = ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const

export type DailyLoveQuoteBatch1Locale = (typeof DAILY_LOVE_QUOTE_BATCH_1_LOCALES)[number]

export const DAILY_LOVE_QUOTE_BATCH_1_KEYS = Array.from(
  { length: 50 },
  (_, index) => `dailyLoveQuotes.day${String(index + 1).padStart(3, '0')}`,
)

export function createDailyLoveQuoteBatch1(locale: DailyLoveQuoteBatch1Locale, quotes: readonly string[]) {
  if (quotes.length !== DAILY_LOVE_QUOTE_BATCH_1_KEYS.length) {
    throw new Error(`Daily love quote locale ${locale} has ${quotes.length}/50 entries`)
  }

  if (quotes.some((quote) => quote.trim().length === 0)) {
    throw new Error(`Daily love quote locale ${locale} contains an empty entry`)
  }

  return Object.fromEntries(
    DAILY_LOVE_QUOTE_BATCH_1_KEYS.map((key, index) => [key, quotes[index]]),
  ) as Record<(typeof DAILY_LOVE_QUOTE_BATCH_1_KEYS)[number], string>
}
