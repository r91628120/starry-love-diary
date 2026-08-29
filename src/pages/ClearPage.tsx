import { PageHeader } from '../components'
import { ClearContent } from '../features/clear/ClearContent'
import { useI18n } from '../i18n/I18nContext'
import '../features/clear/clear.css'

export function ClearPage() {
  const {t}=useI18n(); return <div className="page clear-page"><PageHeader titleKey="clear.title" brandOnly/><main className="clear-page__content"><div className="clear-page__title" aria-hidden="true">✦ {t('clear.title')} ✦</div><ClearContent/></main></div>
}
