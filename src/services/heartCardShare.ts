import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export type HeartCardShareResult = 'shared' | 'cancelled' | 'unsupported' | 'error' | 'pending'
export type HeartCardSaveResult = 'downloaded' | 'save-sheet-opened' | 'cancelled' | 'unsupported' | 'error' | 'pending'
export const HEART_CARD_SHARE_PENDING_SAFETY_TIMEOUT_MS = 12_000

type NativePlatform = 'ios' | 'android'
interface NativePlatformHost { getPlatform(): string }
interface NativeImageShare {
  canShare(): Promise<{ value: boolean }>
  share(options: { title?: string; files: string[] }): Promise<unknown>
}
interface NativeFilesystem {
  writeFile(options: { path: string; data: string; directory: Directory }): Promise<{ uri: string }>
  deleteFile(options: { path: string; directory: Directory }): Promise<void>
}
interface HeartCardSaveOptions {
  nativePlatform?: NativePlatformHost
  nativeShare?: NativeImageShare
  nativeFilesystem?: NativeFilesystem
  download?: (blob: Blob) => void
  filename?: () => string
}

function isCancelled(error: unknown) {
  return (error instanceof DOMException && error.name === 'AbortError')
    || (error instanceof Error && /cancel/i.test(error.message))
}

export function getHeartCardNativePlatform(host: NativePlatformHost = Capacitor): NativePlatform | undefined {
  const platform = host.getPlatform()
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

function createNativeHeartCardFilename() {
  return `starry-love-card-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.png`
}

async function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('PNG conversion failed'))
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const base64 = result.split(',', 2)[1]
      if (base64) resolve(base64)
      else reject(new Error('PNG conversion failed'))
    }
    reader.readAsDataURL(blob)
  })
}

async function saveNativeHeartCardImage(blob: Blob, options: HeartCardSaveOptions): Promise<HeartCardSaveResult> {
  const nativeShare = options.nativeShare ?? Share
  const nativeFilesystem = options.nativeFilesystem ?? Filesystem
  const filename = (options.filename ?? createNativeHeartCardFilename)()
  let written = false

  try {
    if (!(await nativeShare.canShare()).value) return 'unsupported'
    const { uri } = await nativeFilesystem.writeFile({
      path: filename,
      data: await blobToBase64(blob),
      directory: Directory.Cache,
    })
    written = true
    await nativeShare.share({ files: [uri] })
    return 'save-sheet-opened'
  } catch (error) {
    return isCancelled(error) ? 'cancelled' : 'error'
  } finally {
    if (written) await nativeFilesystem.deleteFile({ path: filename, directory: Directory.Cache }).catch(() => undefined)
  }
}

export async function saveHeartCardImage(blob: Blob, options: HeartCardSaveOptions = {}): Promise<HeartCardSaveResult> {
  if (getHeartCardNativePlatform(options.nativePlatform)) return saveNativeHeartCardImage(blob, options)
  try {
    ;(options.download ?? downloadHeartCardImage)(blob)
    return 'downloaded'
  } catch {
    return 'error'
  }
}
