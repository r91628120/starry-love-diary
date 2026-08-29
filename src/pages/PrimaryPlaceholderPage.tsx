import { EmptyStateCard, PageHeader } from '../components'
import { useI18n } from '../i18n/I18nContext'
import type { TranslationKey } from '../i18n/messages'

export function PrimaryPlaceholderPage({ titleKey }: { titleKey: TranslationKey }) {
  const { t } = useI18n()

  return <div className="page"><PageHeader titleKey={titleKey} /><main className="page__content"><EmptyStateCard title={t('page.placeholderTitle')} body={t('page.placeholderBody')} /></main></div>
}
