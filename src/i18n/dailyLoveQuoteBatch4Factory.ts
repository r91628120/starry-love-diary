export const DAILY_LOVE_QUOTE_BATCH_4_LOCALES = ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const

export type DailyLoveQuoteBatch4Locale = (typeof DAILY_LOVE_QUOTE_BATCH_4_LOCALES)[number]

export const DAILY_LOVE_QUOTE_BATCH_4_KEYS = Array.from(
  { length: 50 },
  (_, index) => `dailyLoveQuotes.day${String(index + 151).padStart(3, '0')}`,
)

export function createDailyLoveQuoteBatch4(locale: DailyLoveQuoteBatch4Locale, quotes: readonly string[]) {
  if (quotes.length !== DAILY_LOVE_QUOTE_BATCH_4_KEYS.length) {
    throw new Error(`Daily love quote locale ${locale} has ${quotes.length}/50 entries in batch 4`)
  }

  if (quotes.some((quote) => quote.trim().length === 0)) {
    throw new Error(`Daily love quote locale ${locale} contains an empty entry in batch 4`)
  }

  return Object.fromEntries(
    DAILY_LOVE_QUOTE_BATCH_4_KEYS.map((key, index) => [key, quotes[index]]),
  ) as Record<(typeof DAILY_LOVE_QUOTE_BATCH_4_KEYS)[number], string>
}
