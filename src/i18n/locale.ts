import { supportedLocales, type Locale } from './messages'

export function resolveLocale(language?: string): Locale {
  if (!language) return 'zh-TW'
  const exactMatch = supportedLocales.find((locale) => locale.toLowerCase() === language.toLowerCase())
  if (exactMatch) return exactMatch
  const languageCode = language.split('-')[0].toLowerCase()
  return supportedLocales.find((locale) => locale.split('-')[0].toLowerCase() === languageCode) ?? 'zh-TW'
}

