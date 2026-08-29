import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import type { TranslationKey } from '../i18n/messages'
import { IconButton } from './IconButton'
import { BackIcon, SettingsIcon } from './icons'

interface PageHeaderProps {
  titleKey: TranslationKey
  variant?: 'main' | 'secondary'
  brandOnly?: boolean
}

interface SettingsLocationState {
  from?: string
}

export function PageHeader({ titleKey, variant = 'main', brandOnly = false }: PageHeaderProps) {
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const settingsState = location.state as SettingsLocationState | null

  const openSettings = () => navigate('/settings', { state: { from: location.pathname } })
  const goBack = () => navigate(settingsState?.from ?? '/today', { replace: true })

  return (
    <header className={`page-header page-header--${variant} ${brandOnly ? 'page-header--brand-only' : ''}`.trim()}>
      {variant === 'secondary' ? (
        <IconButton ariaLabel={t('common.back')} onClick={goBack}><BackIcon /></IconButton>
      ) : (
        <div className="page-header__brand">{t('app.brand')}</div>
      )}
      <h1 className={brandOnly ? 'sr-only' : undefined}>{t(titleKey)}</h1>
      {variant === 'main' ? (
        <IconButton ariaLabel={t('common.settings')} onClick={openSettings}><SettingsIcon /></IconButton>
      ) : (
        <span className="page-header__balance" aria-hidden="true" />
      )}
    </header>
  )
}
