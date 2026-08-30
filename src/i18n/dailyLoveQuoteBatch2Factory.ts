export const DAILY_LOVE_QUOTE_BATCH_2_LOCALES = ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const

export type DailyLoveQuoteBatch2Locale = (typeof DAILY_LOVE_QUOTE_BATCH_2_LOCALES)[number]

export const DAILY_LOVE_QUOTE_BATCH_2_KEYS = Array.from(
  { length: 50 },
  (_, index) => `dailyLoveQuotes.day${String(index + 51).padStart(3, '0')}`,
)

export function createDailyLoveQuoteBatch2(locale: DailyLoveQuoteBatch2Locale, quotes: readonly string[]) {
  if (quotes.length !== DAILY_LOVE_QUOTE_BATCH_2_KEYS.length) {
    throw new Error(`Daily love quote locale ${locale} has ${quotes.length}/50 entries in batch 2`)
  }

  if (quotes.some((quote) => quote.trim().length === 0)) {
    throw new Error(`Daily love quote locale ${locale} contains an empty entry in batch 2`)
  }

  return Object.fromEntries(
    DAILY_LOVE_QUOTE_BATCH_2_KEYS.map((key, index) => [key, quotes[index]]),
  ) as Record<(typeof DAILY_LOVE_QUOTE_BATCH_2_KEYS)[number], string>
}
