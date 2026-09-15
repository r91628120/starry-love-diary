import { describe, expect, it, vi } from 'vitest'
import { HEART_CARD_SHARE_PENDING_SAFETY_TIMEOUT_MS, shareHeartCardImage } from './heartCardShare'

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
})
