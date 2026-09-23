import { PageHeader } from '../components'
import { MomentCarousel } from '../features/our/MomentCarousel'
import { useLocation } from 'react-router-dom'
import '../features/our/our.css'

export function MomentPhotoManagementPage() {
  const location = useLocation()
  const state = location.state as { momentId?: string } | null
  return <div className="app-shell"><div className="page page--settings"><PageHeader titleKey="settings.memories.moments" variant="secondary" backFallback="/settings" /><main className="page__content"><MomentCarousel photoManagement initialMomentId={state?.momentId} /></main></div></div>
}
