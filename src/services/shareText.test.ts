import { describe, expect, it, vi } from 'vitest'
import { SHARE_PENDING_SAFETY_TIMEOUT_MS, shareText } from './shareText'

describe('shareText', () => {
  it('shares only the supplied text when Web Share is available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    await expect(shareText('only the user text', undefined, { share })).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith({ text: 'only the user text' })
  })
  it('treats share cancellation as neutral', async () => {
    await expect(shareText('text', undefined, { share: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')) })).resolves.toBe('cancelled')
  })
  it('falls back to the clipboard when Web Share rejects with an error', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    await expect(shareText('text', undefined, { share: vi.fn().mockRejectedValue(new Error('no share')), clipboard: { writeText } })).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith('text')
  })
  it('falls back to the clipboard with the exact text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    await expect(shareText('my message', undefined, { clipboard: { writeText } })).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith('my message')
  })
  it('reports an unavailable or failing share path', async () => {
    await expect(shareText('text', undefined, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('no')) } })).resolves.toBe('error')
  })
  it('releases a permanently pending Web Share request without claiming success', async () => {
    vi.useFakeTimers()
    const share = vi.fn(() => new Promise<void>(() => undefined))
    const result = shareText('text', undefined, { share })
    await vi.advanceTimersByTimeAsync(SHARE_PENDING_SAFETY_TIMEOUT_MS)
    await expect(result).resolves.toBe('pending')
    vi.useRealTimers()
  })
})
