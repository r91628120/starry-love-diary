import { describe, expect, it, vi } from 'vitest'
import { Directory } from '@capacitor/filesystem'
import { getHeartCardNativePlatform, HEART_CARD_SHARE_PENDING_SAFETY_TIMEOUT_MS, saveHeartCardImage, shareHeartCardImage } from './heartCardShare'

describe('shareHeartCardImage', () => {
  const png = new Blob(['heart-card'], { type: 'image/png' })

  it('shares a PNG File when file sharing is available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    await expect(shareHeartCardImage(png, { canShare: vi.fn(() => true), share } as Pick<Navigator, 'canShare' | 'share'>)).resolves.toBe('shared')
    const data = share.mock.calls[0][0] as ShareData
    expect(data.files?.[0]).toBeInstanceOf(File)
    expect(data.files?.[0].type).toBe('image/png')
    expect(data.files?.[0].name).toBe('starry-love-diary-heart-card.png')
  })

  it('reports unsupported file sharing without claiming a share', async () => {
    const share = vi.fn()
    await expect(shareHeartCardImage(png, { canShare: vi.fn(() => false), share } as Pick<Navigator, 'canShare' | 'share'>)).resolves.toBe('unsupported')
    expect(share).not.toHaveBeenCalled()
  })

  it('treats a dismissed share sheet as neutral', async () => {
    await expect(shareHeartCardImage(png, { canShare: () => true, share: vi.fn().mockRejectedValue(new DOMException('dismissed', 'AbortError')) } as Pick<Navigator, 'canShare' | 'share'>)).resolves.toBe('cancelled')
  })

  it('reports a file-share error', async () => {
    await expect(shareHeartCardImage(png, { canShare: () => true, share: vi.fn().mockRejectedValue(new Error('failed')) } as Pick<Navigator, 'canShare' | 'share'>)).resolves.toBe('error')
  })

  it('releases an unresolved share request without claiming success', async () => {
    vi.useFakeTimers()
    const result = shareHeartCardImage(png, { canShare: () => true, share: vi.fn(() => new Promise<void>(() => undefined)) } as Pick<Navigator, 'canShare' | 'share'>)
    await vi.advanceTimersByTimeAsync(HEART_CARD_SHARE_PENDING_SAFETY_TIMEOUT_MS)
    await expect(result).resolves.toBe('pending')
    vi.useRealTimers()
  })

  it('uses the browser download path outside Capacitor', async () => {
    const download = vi.fn()
    await expect(saveHeartCardImage(png, { nativePlatform: { getPlatform: () => 'web' }, download })).resolves.toBe('downloaded')
    expect(download).toHaveBeenCalledWith(png)
  })

  it('reports browser download failures instead of failing silently', async () => {
    await expect(saveHeartCardImage(png, { nativePlatform: { getPlatform: () => 'web' }, download: () => { throw new Error('download failed') } })).resolves.toBe('error')
  })

  it('writes a private-safe Cache PNG and shares its native URI for a Capacitor iOS save request', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const writeFile = vi.fn().mockResolvedValue({ uri: 'file:///tmp/starry-love-card-fixed.png' })
    const deleteFile = vi.fn().mockResolvedValue(undefined)
    const filename = 'starry-love-card-fixed.png'
    await expect(saveHeartCardImage(png, { nativePlatform: { getPlatform: () => 'ios' }, nativeShare: { canShare: vi.fn().mockResolvedValue({ value: true }), share }, nativeFilesystem: { writeFile, deleteFile }, filename: () => filename })).resolves.toBe('save-sheet-opened')
    expect(writeFile).toHaveBeenCalledWith(expect.objectContaining({ path: filename, directory: Directory.Cache, data: expect.any(String) }))
    expect(writeFile.mock.calls[0][0].data).not.toContain('heart-card')
    expect(share).toHaveBeenCalledWith({ files: ['file:///tmp/starry-love-card-fixed.png'] })
    expect(deleteFile).toHaveBeenCalledWith({ path: filename, directory: Directory.Cache })
  })

  it('keeps native cancellation and unsupported outcomes distinct from success without downloading', async () => {
    const download = vi.fn()
    const nativeFilesystem = { writeFile: vi.fn().mockResolvedValue({ uri: 'file:///tmp/card.png' }), deleteFile: vi.fn().mockResolvedValue(undefined) }
    await expect(saveHeartCardImage(png, { nativePlatform: { getPlatform: () => 'android' }, nativeShare: { canShare: vi.fn().mockResolvedValue({ value: false }), share: vi.fn() }, nativeFilesystem, download })).resolves.toBe('unsupported')
    await expect(saveHeartCardImage(png, { nativePlatform: { getPlatform: () => 'ios' }, nativeShare: { canShare: vi.fn().mockResolvedValue({ value: true }), share: vi.fn().mockRejectedValue(new Error('Share canceled')) }, nativeFilesystem, download })).resolves.toBe('cancelled')
    expect(download).not.toHaveBeenCalled()
  })

  it('identifies only Capacitor iOS and Android as native save platforms', () => {
    expect(getHeartCardNativePlatform({ getPlatform: () => 'ios' })).toBe('ios')
    expect(getHeartCardNativePlatform({ getPlatform: () => 'android' })).toBe('android')
    expect(getHeartCardNativePlatform({ getPlatform: () => 'web' })).toBeUndefined()
  })
})
