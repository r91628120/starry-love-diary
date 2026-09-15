export type HeartCardShareResult = 'shared' | 'cancelled' | 'unsupported' | 'error' | 'pending'
export const HEART_CARD_SHARE_PENDING_SAFETY_TIMEOUT_MS = 12_000

function isCancelled(error: unknown) { return error instanceof DOMException && error.name === 'AbortError' }

export async function shareHeartCardImage(
  blob: Blob,
  target: Pick<Navigator, 'share' | 'canShare'> = navigator,
  pendingTimeoutMs = HEART_CARD_SHARE_PENDING_SAFETY_TIMEOUT_MS,
): Promise<HeartCardShareResult> {
  const file = new File([blob], 'starry-love-diary-heart-card.png', { type: 'image/png' })
  if (!target.share || !target.canShare?.({ files: [file] })) return 'unsupported'
  let timeout: ReturnType<typeof globalThis.setTimeout> | undefined
  const outcome = target.share({ title: 'Starry Love Diary', files: [file] }).then(
    () => 'shared' as const,
    (error) => isCancelled(error) ? 'cancelled' as const : 'error' as const,
  )
  const guard = new Promise<'pending'>((resolve) => { timeout = globalThis.setTimeout(() => resolve('pending'), pendingTimeoutMs) })
  try { return await Promise.race([outcome, guard]) } finally { if (timeout !== undefined) globalThis.clearTimeout(timeout) }
}

export function downloadHeartCardImage(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'starry-love-diary-heart-card.png'; anchor.click()
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 0)
}
