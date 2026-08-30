export const DAILY_LOVE_QUOTE_BATCH_7_LOCALES = ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const

export type DailyLoveQuoteBatch7Locale = (typeof DAILY_LOVE_QUOTE_BATCH_7_LOCALES)[number]

export const DAILY_LOVE_QUOTE_BATCH_7_KEYS = Array.from(
  { length: 65 },
  (_, index) => `dailyLoveQuotes.day${String(index + 301).padStart(3, '0')}`,
)

export function createDailyLoveQuoteBatch7(locale: DailyLoveQuoteBatch7Locale, quotes: readonly string[]) {
  if (quotes.length !== DAILY_LOVE_QUOTE_BATCH_7_KEYS.length) {
    throw new Error(`Daily love quote locale ${locale} has ${quotes.length}/65 entries in batch 7`)
  }

  if (quotes.some((quote) => quote.trim().length === 0)) {
    throw new Error(`Daily love quote locale ${locale} contains an empty entry in batch 7`)
  }

  return Object.fromEntries(
    DAILY_LOVE_QUOTE_BATCH_7_KEYS.map((key, index) => [key, quotes[index]]),
  ) as Record<(typeof DAILY_LOVE_QUOTE_BATCH_7_KEYS)[number], string>
}
