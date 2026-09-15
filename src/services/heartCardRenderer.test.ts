import { existsSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { HEART_CARD_BANNER_ARTWORK_PATH, HEART_CARD_BRAND, HEART_CARD_FRONT_ARTWORK_PATH, HEART_CARD_HEIGHT, HEART_CARD_WIDTH, getHeartCardLayout, renderHeartCardPng } from './heartCardRenderer'

function installCanvas() {
  const fillText = vi.fn()
  const drawImage = vi.fn()
  const context = {
    fillStyle: '', font: '', textAlign: 'start', shadowColor: '', shadowBlur: 0, imageSmoothingQuality: 'low', drawImage, fillRect: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })), measureText: vi.fn((text: string) => ({ width: [...text].length * 25 })), fillText,
  } as unknown as CanvasRenderingContext2D
  const canvas = { width: 0, height: 0, getContext: vi.fn(() => context), toBlob: (callback: BlobCallback) => callback(new Blob(['png'], { type: 'image/png' })) } as unknown as HTMLCanvasElement
  return { canvas, fillText, drawImage }
}

describe('heart card renderer', () => {
  const artwork = { front: { width: 1358, height: 1159 } as unknown as CanvasImageSource }

  it('uses the one clean, local artwork set', () => {
    expect(HEART_CARD_BRAND).toBe('Starry Love Diary')
    expect(HEART_CARD_FRONT_ARTWORK_PATH).toBe('/assets/heart-card/heart-card-front-v1.png')
    expect(HEART_CARD_BANNER_ARTWORK_PATH).toBe('/assets/heart-card/heart-card-black-cat-banner-v1.png')
    for (const path of [HEART_CARD_FRONT_ARTWORK_PATH, HEART_CARD_BANNER_ARTWORK_PATH, '/assets/heart-card/heart-card-back-v1.png']) expect(existsSync(`public${path}`)).toBe(true)
  })

  it('draws locale-specific runtime copy over the unchanged artwork', async () => {
    const first = installCanvas(); const firstCreate = vi.spyOn(document, 'createElement').mockReturnValue(first.canvas)
    await renderHeartCardPng('A small note', { title: 'What I Want to Tell You', brand: 'Starry Love Diary', locale: 'en' }, artwork)
    firstCreate.mockRestore()
    const second = installCanvas(); const secondCreate = vi.spyOn(document, 'createElement').mockReturnValue(second.canvas)
    await renderHeartCardPng('Un petit mot', { title: 'Ce que je veux te dire', brand: 'Journal d’amour étoilé', locale: 'fr' }, artwork)
    secondCreate.mockRestore()
    expect(first.fillText).toHaveBeenCalledWith('What I Want to Tell You', expect.any(Number), expect.any(Number))
    expect(second.fillText).toHaveBeenCalledWith('Ce que je veux te dire', expect.any(Number), expect.any(Number))
    expect(first.fillText.mock.calls.map(([value]) => value)).not.toEqual(second.fillText.mock.calls.map(([value]) => value))
  })

  it('draws only the front artwork into the portrait export', async () => {
    const { canvas, drawImage } = installCanvas(); const create = vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    await renderHeartCardPng('A single front card', { title: 'What I Want to Tell You', brand: 'Starry Love Diary', locale: 'en' }, artwork)
    create.mockRestore()
    expect(drawImage).toHaveBeenCalledTimes(1)
    expect(canvas.width / canvas.height).toBeCloseTo(4 / 5)
  })

  it('wraps bounded multilingual text deterministically', () => {
    const layout = getHeartCardLayout('謝謝你，hola café 日本語 한국어 ✨', (value) => [...value].length * 30, 180)
    expect(layout.fontSize).toBeGreaterThan(0)
    expect(layout.lines.join('').replaceAll(' ', '')).toBe('謝謝你，holacafé日本語한국어✨')
    expect(layout.lines.length).toBeGreaterThan(1)
  })

  it.each(['想你了', 'x'.repeat(60), 'A short English note', 'ありがとう', '고마워요', 'Qué alegría verte', 'Merci pour tout', '你是我的✨'])('exports a real fixed-size PNG with dynamic text: %s', async (message) => {
    const { canvas, fillText } = installCanvas()
    const create = vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    const blob = await renderHeartCardPng(message, { title: '想對你說', brand: 'Starlove Diary', locale: 'zh-TW' }, artwork)
    expect(canvas.width).toBe(HEART_CARD_WIDTH); expect(canvas.height).toBe(HEART_CARD_HEIGHT)
    expect(blob.type).toBe('image/png'); expect(blob.size).toBeGreaterThan(0)
    expect(fillText).toHaveBeenCalledWith(expect.stringContaining([...message][0]), expect.any(Number), expect.any(Number))
    expect(fillText).toHaveBeenCalledWith('Starry Love Diary', expect.any(Number), expect.any(Number))
    expect(fillText.mock.calls.map(([value]) => value)).not.toContain('Starlove Diary')
    create.mockRestore()
  })

  it('rejects blank and over-limit user copy instead of clipping it', async () => {
    await expect(renderHeartCardPng('   ', {} as never, artwork)).rejects.toThrow('Invalid heart card message')
    await expect(renderHeartCardPng('x'.repeat(61), {} as never, artwork)).rejects.toThrow('Invalid heart card message')
  })
})
