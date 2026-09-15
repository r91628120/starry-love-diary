import { OurDataValidationError } from '../../data/repositories/repositories'
import type { Locale, TranslationKey } from '../../i18n/messages'

export function formatOurNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatOurLocalDate(localDate: string, locale: Locale) {
  const [year, month, day] = localDate.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function getOurValidationKey(error: unknown): TranslationKey {
  if (!(error instanceof OurDataValidationError)) return 'our.validation.generic'
  if (error.code === 'memory_moment_limit') return 'our.validation.memoryMomentLimit'
  if (error.code === 'message_too_long') return 'our.validation.messageTooLong'
  if (error.code === 'remembered_you_too_long') return 'our.validation.rememberedContentTooLong'
  if (error.code === 'remembered_you_limit') return 'our.validation.rememberedYouLimit'
  if (error.code === 'invalid_date') return 'our.validation.invalidDate'
  if (error.code.endsWith('_required')) return 'our.validation.required'
  return 'our.validation.generic'
}
