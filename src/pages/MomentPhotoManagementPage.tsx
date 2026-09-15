import { PageHeader } from '../components'
import { MomentCarousel } from '../features/our/MomentCarousel'
import '../features/our/our.css'

export function MomentPhotoManagementPage() {
  return <div className="app-shell"><div className="page page--settings"><PageHeader titleKey="settings.memories.moments" variant="secondary" backFallback="/settings" /><main className="page__content"><MomentCarousel photoManagement /></main></div></div>
}
