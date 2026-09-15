import type { ImportantDate } from '../../data/types'
import type { Locale } from '../../i18n/messages'

const DAY_MS = 86_400_000
const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export interface UpcomingImportantDate extends ImportantDate {
  nextOccurrence: string
  daysRemaining: number
}

function localDateToEpochDay(localDate: string) {
  const match = LOCAL_DATE_PATTERN.exec(localDate)
  if (!match) return Number.NaN
  const [, year, month, day] = match
  return Math.floor(Date.UTC(Number(year), Number(month) - 1, Number(day)) / DAY_MS)
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function isValidAnniversaryMonthDay(month: number, day: number) {
  const daysByMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return Number.isInteger(month) && Number.isInteger(day) && month >= 1 && month <= 12 && day >= 1 && day <= daysByMonth[month - 1]
}

function formatLocalDate(year: number, month: number, day: number) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function occurrenceForYear(year: number, month: number, day: number) {
  // February 29 stays February 29 in leap years and intentionally falls on
  // February 28 in other years. Never let Date silently roll it into March.
  const occurrenceDay = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day
  return formatLocalDate(year, month, occurrenceDay)
}

export function getNextImportantDateOccurrence(originalDate: string, currentLocalDate: string) {
  const original = LOCAL_DATE_PATTERN.exec(originalDate)
  const current = LOCAL_DATE_PATTERN.exec(currentLocalDate)
  if (!original || !current) return undefined
  const [, currentYear] = current
  const [, , originalMonth, originalDay] = original
  if (!isValidAnniversaryMonthDay(Number(originalMonth), Number(originalDay))) return undefined
  const currentDay = localDateToEpochDay(currentLocalDate)
  const candidate = occurrenceForYear(Number(currentYear), Number(originalMonth), Number(originalDay))
  return localDateToEpochDay(candidate) < currentDay
    ? occurrenceForYear(Number(currentYear) + 1, Number(originalMonth), Number(originalDay))
    : candidate
}

/** Returns the single closest important date on or after the current local date. */
export function getNextUpcomingImportantDate(dates: ImportantDate[], currentLocalDate: string): UpcomingImportantDate | undefined {
  const currentDay = localDateToEpochDay(currentLocalDate)
  if (!Number.isFinite(currentDay)) return undefined
  return dates
    .map((date) => {
      const nextOccurrence = getNextImportantDateOccurrence(date.date, currentLocalDate)
      return nextOccurrence ? { ...date, nextOccurrence, daysRemaining: localDateToEpochDay(nextOccurrence) - currentDay } : undefined
    })
    .filter((date): date is UpcomingImportantDate => {
      if (!date) return false
      return Number.isFinite(date.daysRemaining) && date.daysRemaining >= 0
    })
    // Match the repository's createdAt ordering for a shared occurrence, with
    // id as the final deterministic tie-breaker for equal timestamps.
    .sort((left, right) => left.nextOccurrence.localeCompare(right.nextOccurrence) || left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))[0]
}

export function formatUpcomingImportantDate(localDate: string, locale: Locale) {
  const match = LOCAL_DATE_PATTERN.exec(localDate)
  if (!match) return localDate
  const [, year, month, day] = match
  return new Intl.DateTimeFormat(locale, { month: 'numeric', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))))
}
