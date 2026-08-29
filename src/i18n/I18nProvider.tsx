import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext } from './I18nContext'
import { messages, type Locale, type TranslationKey } from './messages'
import { resolveLocale } from './locale'

export function I18nProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(() => initialLocale ?? resolveLocale(globalThis.navigator?.language))

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: TranslationKey, values: Record<string, string | number> = {}) => {
        const template: string = messages[locale][key] ?? messages['zh-TW'][key]
        return Object.entries(values).reduce<string>(
          (result, [name, replacement]) => result.replaceAll(`{${name}}`, String(replacement)),
          template,
        )
      },
    }),
    [locale],
  )

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = value.t('app.brand')
  }, [locale, value])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
