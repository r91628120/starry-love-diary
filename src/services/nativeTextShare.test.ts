import { describe, expect, it, vi } from 'vitest'
import { shareNativeText } from './nativeTextShare'

describe('shareNativeText', () => {
  it('opens the Capacitor share sheet with the supplied title and text', async () => {
    const nativeShare = { canShare: vi.fn().mockResolvedValue({ value: true }), share: vi.fn().mockResolvedValue(undefined) }
    await expect(shareNativeText('invitation text', 'Pair invitation', { nativePlatform: { isNativePlatform: () => true }, nativeShare })).resolves.toBe('shared')
    expect(nativeShare.share).toHaveBeenCalledWith({ title: 'Pair invitation', text: 'invitation text' })
  })

  it('uses the existing clipboard fallback only when native sharing is unavailable before opening', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const nativeShare = { canShare: vi.fn().mockResolvedValue({ value: false }), share: vi.fn() }
    await expect(shareNativeText('fallback text', 'Title', { nativePlatform: { isNativePlatform: () => true }, nativeShare, target: { clipboard: { writeText } } })).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith('fallback text')
    expect(nativeShare.share).not.toHaveBeenCalled()
  })

  it('does not copy after a native share cancellation or failure', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const target = { clipboard: { writeText } }
    await expect(shareNativeText('text', 'Title', { nativePlatform: { isNativePlatform: () => true }, nativeShare: { canShare: vi.fn().mockResolvedValue({ value: true }), share: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')) }, target })).resolves.toBe('cancelled')
    await expect(shareNativeText('text', 'Title', { nativePlatform: { isNativePlatform: () => true }, nativeShare: { canShare: vi.fn().mockResolvedValue({ value: true }), share: vi.fn().mockRejectedValue(new Error('failed')) }, target })).resolves.toBe('error')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('keeps the existing non-native Web Share behavior', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    await expect(shareNativeText('web text', 'Web title', { nativePlatform: { isNativePlatform: () => false }, target: { share } })).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith({ title: 'Web title', text: 'web text' })
  })
})
