import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { navigationAssets } from '../assets/uiAssets'
import type { TranslationKey } from '../i18n/messages'

const navigationItems: Array<{ path: string; labelKey: TranslationKey; icon: string }> = [
  { path: '/today', labelKey: 'nav.today', icon: navigationAssets.today },
  { path: '/star-bottle', labelKey: 'nav.starBottle', icon: navigationAssets.starBottle },
  { path: '/footprints', labelKey: 'nav.footprints', icon: navigationAssets.footprints },
  { path: '/our', labelKey: 'nav.our', icon: navigationAssets.our },
  { path: '/clear', labelKey: 'nav.clear', icon: navigationAssets.clear },
]

export function BottomNavigation() {
  const { t } = useI18n()

  return (
    <nav className="bottom-navigation" aria-label={t('app.brand')}>
      <div className="bottom-navigation__inner">
        {navigationItems.map(({ path, labelKey, icon }) => (
          <NavLink key={path} to={path} className={({ isActive }) => `bottom-navigation__item ${isActive ? 'bottom-navigation__item--active' : ''}`}>
            <img className="bottom-navigation__icon" src={icon} alt="" aria-hidden="true" />
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
