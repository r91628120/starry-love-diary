import { clearMilestone4MessagesEn } from './clearLocaleEn'
import { defineClearLocale, type ClearMilestone4LocaleMessages } from './clearLocaleFactory'

export function adaptClearLocale(
  locale: string,
  overrides: Partial<ClearMilestone4LocaleMessages> & Record<string, string>,
): ClearMilestone4LocaleMessages {
  return defineClearLocale(locale, { ...clearMilestone4MessagesEn, ...overrides })
}
