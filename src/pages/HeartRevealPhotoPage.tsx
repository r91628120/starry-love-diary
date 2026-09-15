import { PageHeader } from '../components'
import { HeartRevealPhotoEditor } from '../features/settings/HeartRevealPhotoEditor'
import '../features/settings/heartRevealPhotoEditor.css'

export function HeartRevealPhotoPage() {
  return <div className="app-shell"><div className="page page--settings heart-reveal-photo-page"><PageHeader titleKey="today.heartReveal.title" variant="secondary" backFallback="/settings" /><main className="page__content heart-reveal-photo-page__content"><HeartRevealPhotoEditor /></main></div></div>
}
