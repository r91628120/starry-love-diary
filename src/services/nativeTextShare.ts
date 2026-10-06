import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { shareText, type ShareTextResult, type ShareTextTarget } from './shareText'

export interface NativeTextSharePlatform { isNativePlatform(): boolean }
export interface NativeTextSharePlugin {
  canShare(): Promise<{ value: boolean }>
  share(options: { title?: string; text: string }): Promise<unknown>
}

export interface NativeTextShareOptions {
  nativePlatform?: NativeTextSharePlatform
  nativeShare?: NativeTextSharePlugin
  target?: ShareTextTarget
}

function isShareCancellation(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

export async function shareNativeText(
  text: string,
  title?: string,
  options: NativeTextShareOptions = {},
): Promise<ShareTextResult> {
  const nativePlatform = options.nativePlatform ?? Capacitor
  const nativeShare = options.nativeShare ?? Share
  const target = options.target ?? globalThis.navigator

  if (!nativePlatform.isNativePlatform()) return shareText(text, title, target)

  try {
    if (!(await nativeShare.canShare()).value) return shareText(text, title, target)
  } catch (error) {
    return isShareCancellation(error) ? 'cancelled' : shareText(text, title, target)
  }

  try {
    await nativeShare.share(title ? { title, text } : { text })
    return 'shared'
  } catch (error) {
    return isShareCancellation(error) ? 'cancelled' : 'error'
  }
}
