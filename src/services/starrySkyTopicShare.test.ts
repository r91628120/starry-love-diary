import { describe, expect, it, vi } from 'vitest'
import { formatStarrySkyTopicShare, shareStarrySkyTopic } from './starrySkyTopicShare'

describe('starrySkyTopicShare', () => {
  it('uses the shared native text-share path for an official Heart Talk topic', async () => {
    const nativeShare = { canShare: vi.fn().mockResolvedValue({ value: true }), share: vi.fn().mockResolvedValue(undefined) }
    await expect(shareStarrySkyTopic('官方題目 Q001', 'zh-TW', { nativePlatform: { isNativePlatform: () => true }, nativeShare })).resolves.toBe('shared')
    expect(nativeShare.share).toHaveBeenCalledWith({ title: '星星戀愛日記', text: formatStarrySkyTopicShare('官方題目 Q001') })
  })

  it('localizes only the friendly attribution and never adds private Heart Talk data', () => {
    for (const locale of ['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const) {
      const payload = formatStarrySkyTopicShare('官方題目 Q001', locale)
      expect(payload).toContain('官方題目 Q001')
      expect(payload).not.toMatch(/answer|transcript|history|invite|uid/i)
    }
  })
})
