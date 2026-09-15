import { PageHeader } from '../components'
import { MemoryWallPhotoLibrary } from '../features/settings/MemoryWallPhotoLibrary'
import '../features/settings/memoryWallPhotoLibrary.css'

export function MemoryWallPhotoLibraryPage() {
  return <div className="app-shell"><div className="page page--settings memory-wall-library-page"><PageHeader titleKey="settings.memories.wall" variant="secondary" backFallback="/settings" /><main className="page__content memory-wall-library-page__content"><MemoryWallPhotoLibrary /></main></div></div>
}
