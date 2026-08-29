import { PageHeader } from '../components'
import { SettingsContent } from '../features/settings/SettingsContent'
import '../features/settings/settings.css'

export function SettingsPage() {
  return <div className="app-shell"><div className="page page--settings settings-page"><PageHeader titleKey="common.settings" variant="secondary" /><main className="page__content settings-page__content"><SettingsContent/></main></div></div>
}
