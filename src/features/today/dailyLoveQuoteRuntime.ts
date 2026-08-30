import { messages, type Locale } from '../../i18n/messages'

const DAYS_IN_CYCLE = 365
const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function localDateToEpochDay(localDate: string): number {
  const match = LOCAL_DATE_PATTERN.exec(localDate)
  if (!match) throw new Error(`Invalid local date: ${localDate}`)
  const [, year, month, day] = match
  return Math.floor(Date.UTC(Number(year), Number(month) - 1, Number(day)) / 86_400_000)
}

export function getDailyLoveQuoteDayIndex(activationDate: string, currentLocalDate: string): number {
  const elapsedDays = Math.max(0, localDateToEpochDay(currentLocalDate) - localDateToEpochDay(activationDate))
  return (elapsedDays % DAYS_IN_CYCLE) + 1
}

export function getDailyLoveQuoteKey(dayIndex: number): `dailyLoveQuotes.day${string}` {
  if (!Number.isInteger(dayIndex) || dayIndex < 1 || dayIndex > DAYS_IN_CYCLE) throw new Error(`Invalid daily love quote day: ${dayIndex}`)
  return `dailyLoveQuotes.day${String(dayIndex).padStart(3, '0')}`
}

export function getDailyLoveQuote(locale: Locale, dayIndex: number): string {
  const key = getDailyLoveQuoteKey(dayIndex)
  const quote = (messages[locale] as Record<string, string>)[key]
  if (!quote) throw new Error(`Missing daily love quote: ${locale}/${key}`)
  return quote
}

export function formatDailyLoveQuoteDate(localDate: string, locale: Locale): string {
  const match = LOCAL_DATE_PATTERN.exec(localDate)
  if (!match) throw new Error(`Invalid local date: ${localDate}`)
  const [, year, month, day] = match
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))),
  )
}

interface ShareTarget {
  share?: (data: ShareData) => Promise<void>
  clipboard?: { writeText(text: string): Promise<void> }
}

export async function shareDailyLoveQuote(text: string, title: string, target: ShareTarget = globalThis.navigator): Promise<boolean> {
  if (target.share) {
    await target.share({ title, text })
    return true
  }
  if (target.clipboard) {
    await target.clipboard.writeText(text)
    return true
  }
  return false
}
