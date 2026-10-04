import { Navigate, useSearchParams } from 'react-router-dom'
import { PairedFeatureIdentityBoundary } from '../features/our/PairedFeatureIdentityBoundary'

const safeReturns = new Set(['/our/starry-sky/invite', '/our/starry-sky'])

/**
 * Transition-only identity boundary. It is intentionally not a browse route:
 * on success it returns to the existing pre-Pair surface without fabricating a
 * relationship, invite, claim, or session.
 */
export function RelationshipIdentityActionPage() {
  const [searchParams] = useSearchParams()
  const requestedReturn = searchParams.get('returnTo')
  const returnTo = requestedReturn && safeReturns.has(requestedReturn) ? requestedReturn : '/our/starry-sky'
  return <PairedFeatureIdentityBoundary backTo={returnTo}><Navigate to={returnTo} replace /></PairedFeatureIdentityBoundary>
}
