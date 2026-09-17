export type HeartCardShareResult = 'shared' | 'cancelled' | 'unsupported' | 'error' | 'pending'
export type HeartCardSaveResult = 'downloaded' | 'save-sheet-opened' | 'cancelled' | 'unsupported' | 'error' | 'pending'
export const HEART_CARD_SHARE_PENDING_SAFETY_TIMEOUT_MS = 12_000

type NativePlatform = 'ios' | 'android'
interface CapacitorHost { Capacitor?: { getPlatform?: () => string } }
interface HeartCardSaveOptions {
  target?: Pick<Navigator, 'share' | 'canShare'>
  capacitorHost?: CapacitorHost
  download?: (blob: Blob) => void
}

function isCancelled(error: unknown) { return error instanceof DOMException && error.name === 'AbortError' }

export function getHeartCardNativePlatform(host: CapacitorHost = globalThis as CapacitorHost): NativePlatform | undefined {
  const platform = host.Capacitor?.getPlatform?.()
  return platform === 'ios' || platform === 'android' ? platform : undefined
}

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

export async function saveHeartCardImage(blob: Blob, options: HeartCardSaveOptions = {}): Promise<HeartCardSaveResult> {
  if (getHeartCardNativePlatform(options.capacitorHost)) {
    const result = await shareHeartCardImage(blob, options.target)
    return result === 'shared' ? 'save-sheet-opened' : result
  }
  try {
    ;(options.download ?? downloadHeartCardImage)(blob)
    return 'downloaded'
  } catch {
    return 'error'
  }
}
