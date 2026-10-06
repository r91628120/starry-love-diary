import { describe, expect, it } from 'vitest'
import { PairClaimDiagnostic } from './pairClaimDiagnostic'

describe('PairClaimDiagnostic', () => {
  it('distinguishes a callable failure without starting refresh', () => {
    const trace = new PairClaimDiagnostic()
    trace.claimStarted(); trace.claimFailed({ code: 'failed-precondition', message: 'opaque invite token must not appear' })
    expect(trace.summary()).toContain('claim-callable-failed — code: failed-precondition')
    expect(trace.summary()).not.toContain('pair-refresh-started')
    expect(trace.summary()).not.toContain('opaque')
  })

  it('distinguishes user and pair document failures', () => {
    const user = new PairClaimDiagnostic(); user.refreshStarted(); user.userReadFailed({ code: 'permission-denied' })
    const pair = new PairClaimDiagnostic(); pair.refreshStarted(); pair.userReadSucceeded(true); pair.pairReadFailed({ code: 'unavailable' })
    expect(user.summary()).toContain('user-relationship-read-failed — code: permission-denied, category: permission')
    expect(pair.summary()).toContain('pair-document-read-failed — code: unavailable, category: network')
  })

  it('records successful reconciliation using only safe derived fields', () => {
    const trace = new PairClaimDiagnostic()
    trace.claimStarted(); trace.claimSucceeded({ pairId: 'pair-secret', status: 'active' }); trace.refreshStarted(); trace.userReadSucceeded(true); trace.pairReadSucceeded({ exists: true, status: 'active', memberCount: 2, callerMember: true }); trace.reconciliationSucceeded()
    const summary = trace.summary()
    expect(summary).toContain('claim-callable-succeeded — pairIdPresent: true, status: active')
    expect(summary).toContain('pair-document-read-succeeded — exists: true, status: active, memberCount: 2, callerMember: true')
    expect(summary).not.toContain('pair-secret')
  })

  it('keeps output bounded and never serializes arbitrary error details', () => {
    const trace = new PairClaimDiagnostic()
    for (let index = 0; index < 20; index += 1) trace.claimFailed({ code: 'permission-denied', message: `uid-${index}-invite-token-auth-token-memberUid` })
    const summary = trace.summary()
    expect(summary.length).toBeLessThanOrEqual(1200)
    expect(summary.match(/claim-callable-failed/g)).toHaveLength(12)
    expect(summary).not.toMatch(/uid-|invite-token|auth-token|memberUid/u)
  })
})
