import type { InputHTMLAttributes, ReactNode } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { SearchIcon } from './icons'

type SearchBarProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { icon?: ReactNode }

export function SearchBar({ className = '', icon, placeholder, ...props }: SearchBarProps) {
  const { t } = useI18n()
  const label = placeholder ?? t('common.search')

  return <label className={`search-bar ${className}`.trim()}><span className="sr-only">{label}</span>{icon ?? <SearchIcon />}<input type="search" placeholder={label} {...props} /></label>
}
