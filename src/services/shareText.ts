export type ShareTextResult = 'shared' | 'copied' | 'cancelled' | 'error' | 'pending'

// Some desktop browsers expose Web Share but never settle its promise when no
// share surface is actually available. This guard only releases the UI; it
// must never be interpreted as a successful share.
export const SHARE_PENDING_SAFETY_TIMEOUT_MS = 12_000

export interface ShareTextTarget {
  share?: (data: ShareData) => Promise<void>
  clipboard?: { writeText(text: string): Promise<void> }
}

function isShareCancellation(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

async function waitForWebShare(
  share: NonNullable<ShareTextTarget['share']>,
  data: ShareData,
  pendingTimeoutMs: number,
): Promise<'shared' | 'cancelled' | 'error' | 'pending'> {
  let timeout: ReturnType<typeof globalThis.setTimeout> | undefined
  const outcome = share(data).then(
    () => 'shared' as const,
    (error) => isShareCancellation(error) ? 'cancelled' as const : 'error' as const,
  )
  const safetyGuard = new Promise<'pending'>((resolve) => {
    timeout = globalThis.setTimeout(() => resolve('pending'), pendingTimeoutMs)
  })

  try {
    return await Promise.race([outcome, safetyGuard])
  } finally {
    if (timeout !== undefined) globalThis.clearTimeout(timeout)
  }
}

export async function shareText(
  text: string,
  title?: string,
  target: ShareTextTarget = globalThis.navigator,
  pendingTimeoutMs = SHARE_PENDING_SAFETY_TIMEOUT_MS,
): Promise<ShareTextResult> {
  if (target.share) {
    const result = await waitForWebShare(target.share, title ? { title, text } : { text }, pendingTimeoutMs)
    if (result === 'shared' || result === 'cancelled' || result === 'pending') return result
  }
  try {
    if (target.clipboard) { await target.clipboard.writeText(text); return 'copied' }
    if (typeof document === 'undefined') return 'error'
    const area = document.createElement('textarea'); area.value = text; area.style.position = 'fixed'; area.style.opacity = '0'; document.body.append(area); area.select()
    const copied = document.execCommand?.('copy') ?? false; area.remove(); return copied ? 'copied' : 'error'
  } catch { return 'error' }
}
