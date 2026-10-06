export type PairClaimDiagnosticStage =
  | 'claim-callable-started'
  | 'claim-callable-succeeded'
  | 'claim-callable-failed'
  | 'pair-refresh-started'
  | 'user-relationship-read-succeeded'
  | 'user-relationship-read-failed'
  | 'pair-document-read-succeeded'
  | 'pair-document-read-failed'
  | 'pair-reconciliation-succeeded'
  | 'pair-reconciliation-failed'

type SafeError = { code: string; category: string }
type Entry = { stage: PairClaimDiagnosticStage; fields: Record<string, string | boolean | number> }

const MAX_ENTRIES = 12

function safeError(error: unknown): SafeError {
  const source = typeof error === 'object' && error ? error as { firebaseCode?: unknown; code?: unknown; message?: unknown } : {}
  const candidate = source.firebaseCode ?? source.code ?? source.message
  const normalized = typeof candidate === 'string' ? candidate.replace(/^functions\//u, '') : ''
  const code = /^[a-z-]{1,64}$/u.test(normalized) ? normalized : 'unknown'
  return { code, category: code === 'permission-denied' ? 'permission' : code === 'unavailable' ? 'network' : code === 'unauthenticated' ? 'authentication' : code === 'not-found' ? 'not-found' : 'other' }
}

/** In-memory, bounded claim evidence. It deliberately never retains identifiers or raw error text. */
export class PairClaimDiagnostic {
  private readonly entries: Entry[] = []

  private record(stage: PairClaimDiagnosticStage, fields: Entry['fields'] = {}) {
    if (this.entries.length < MAX_ENTRIES) this.entries.push({ stage, fields })
  }

  claimStarted() { this.record('claim-callable-started') }
  claimSucceeded(result: { pairId: string; status: string }) { this.record('claim-callable-succeeded', { pairIdPresent: Boolean(result.pairId), status: result.status }) }
  claimFailed(error: unknown) { this.record('claim-callable-failed', safeError(error)) }
  refreshStarted() { this.record('pair-refresh-started') }
  userReadSucceeded(currentPairIdPresent: boolean) { this.record('user-relationship-read-succeeded', { currentPairIdPresent }) }
  userReadFailed(error: unknown) { this.record('user-relationship-read-failed', safeError(error)) }
  pairReadSucceeded(input: { exists: boolean; status: string; memberCount: number; callerMember: boolean }) { this.record('pair-document-read-succeeded', input) }
  pairReadFailed(error: unknown) { this.record('pair-document-read-failed', safeError(error)) }
  reconciliationSucceeded() { this.record('pair-reconciliation-succeeded') }
  reconciliationFailed(error: unknown) { this.record('pair-reconciliation-failed', safeError(error)) }

  summary() {
    return ['PAIR CLAIM DIAGNOSTIC', ...this.entries.map(({ stage, fields }) => {
      const values = Object.entries(fields).map(([key, value]) => `${key}: ${String(value)}`)
      return values.length ? `${stage} — ${values.join(', ')}` : stage
    })].join('\n').slice(0, 1200)
  }
}
