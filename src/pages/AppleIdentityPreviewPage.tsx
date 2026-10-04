import { AppleIdentityGate } from '../features/our/PairedFeatureIdentityBoundary'
import '../features/our/our.css'

/**
 * Deliberately unlinked review surface. The gate receives no Firebase service
 * here, so this page can be inspected in a plain localhost runtime.
 */
export function AppleIdentityPreviewPage() {
  return <AppleIdentityGate preview upgrade={async () => ({ status: 'cancelled' })} onResult={() => undefined} />
}
