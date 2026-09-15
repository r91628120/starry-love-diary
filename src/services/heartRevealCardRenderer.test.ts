import { describe, expect, it, vi } from 'vitest'
import { HEART_REVEAL_CARD_HEIGHT, HEART_REVEAL_CARD_WIDTH, getHeartRevealCardTextLayout, getHeartRevealOrientation, getHeartRevealOverlayLayout, renderHeartRevealCardPng } from './heartRevealCardRenderer'
import type { HeartRevealTextPlacement } from '../data/types'

function installCanvas() {
  const fillText = vi.fn(); const drawImage = vi.fn()
  const context = {
    fillStyle: '', font: '', textAlign: 'start', textBaseline: 'alphabetic', imageSmoothingQuality: 'low',
    fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), arcTo: vi.fn(), closePath: vi.fn(), fill: vi.fn(),
    save: vi.fn(), restore: vi.fn(), drawImage, fillText,
    measureText: vi.fn((text: string) => ({ width: [...text].length * 28 })),
  } as unknown as CanvasRenderingContext2D
  const canvas = { width: 0, height: 0, getContext: vi.fn(() => context), toBlob: (callback: BlobCallback) => callback(new Blob(['png'], { type: 'image/png' })) } as unknown as HTMLCanvasElement
  return { canvas, context, drawImage, fillText }
}

describe('heart reveal card renderer', () => {
  it('uses bottom-center as the first card default', () => {
    const layout = getHeartRevealOverlayLayout(1600, 900)
    expect(getHeartRevealOrientation(1600, 900)).toBe('landscape')
    expect(layout).toMatchObject({ orientation: 'landscape', textAlign: 'center' })
    expect(layout.y).toBeGreaterThan(HEART_REVEAL_CARD_HEIGHT / 2)
    expect(layout.width / HEART_REVEAL_CARD_WIDTH).toBeLessThanOrEqual(.45)
    expect(layout.height / HEART_REVEAL_CARD_HEIGHT).toBeLessThanOrEqual(.30)
  })

  it.each([[900, 1600], [1200, 1200]])('keeps portrait and square defaults in a compact bottom-centered overlay', (width, height) => {
    const layout = getHeartRevealOverlayLayout(width, height)
    expect(layout).toMatchObject({ orientation: 'portrait', textAlign: 'center' })
    expect(layout.y + layout.height).toBeLessThan(HEART_REVEAL_CARD_HEIGHT)
    expect(layout.width / HEART_REVEAL_CARD_WIDTH).toBeLessThanOrEqual(.82)
    expect(layout.height / HEART_REVEAL_CARD_HEIGHT).toBeLessThanOrEqual(.30)
  })

  it.each([
    ['top-left', 'left', 'top'], ['top-center', 'center', 'top'], ['top-right', 'right', 'top'],
    ['bottom-left', 'left', 'bottom'], ['bottom-center', 'center', 'bottom'], ['bottom-right', 'right', 'bottom'],
  ] as const)('maps %s to its safe %s/%s geometry', (placement, horizontal, vertical) => {
    const layout = getHeartRevealOverlayLayout(900, 1600, placement as HeartRevealTextPlacement)
    expect(layout.textAlign).toBe(horizontal)
    if (vertical === 'top') expect(layout.y).toBeGreaterThan(0)
    else expect(layout.y).toBeGreaterThan(HEART_REVEAL_CARD_HEIGHT / 2)
    expect(layout.x).toBeGreaterThanOrEqual(0)
    expect(layout.x + layout.width).toBeLessThanOrEqual(HEART_REVEAL_CARD_WIDTH)
  })

  it('wraps CJK by character and Western text by whole words before its long-word fallback', () => {
    const measure = (value: string, size: number) => [...value].length * size * .58
    const cjk = getHeartRevealCardTextLayout('謝謝你一直都在這裡陪著我', measure, 180, 'zh-TW', 4)
    const english = getHeartRevealCardTextLayout('Thank you for being here with me', measure, 260, 'en', 4)
    const spanish = getHeartRevealCardTextLayout('Gracias por acompañarme siempre', measure, 260, 'es', 4)
    const french = getHeartRevealCardTextLayout('Merci de rester près de moi', measure, 260, 'fr', 4)
    expect(cjk.lines.join('')).toBe('謝謝你一直都在這裡陪著我')
    expect(english.lines.join(' ')).toContain('Thank you')
    expect(spanish.lines.join(' ')).toContain('Gracias por')
    expect(french.lines.join(' ')).toContain('Merci de')
  })

  it('draws a real photo first, then only a compact dynamic overlay with no artwork dependency', async () => {
    const { canvas, drawImage, fillText } = installCanvas(); const create = vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    await renderHeartRevealCardPng('A small note', { locale: 'en' }, undefined, { positionX: .2, positionY: .8, zoom: .6 }, 'top-right', { width: 1600, height: 900 } as CanvasImageSource & { width: number; height: number })
    create.mockRestore()
    expect(canvas.width).toBe(HEART_REVEAL_CARD_WIDTH); expect(canvas.height).toBe(HEART_REVEAL_CARD_HEIGHT)
    expect(drawImage).toHaveBeenCalledTimes(1)
    expect(fillText).toHaveBeenCalledWith(expect.stringContaining('A'), expect.any(Number), expect.any(Number))
  })

  it.each(['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const)('exports locale-driven text for %s without baked-in artwork', async (locale) => {
    const { canvas, fillText } = installCanvas(); const create = vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    const blob = await renderHeartRevealCardPng('Merci pour tout', { locale })
    create.mockRestore()
    expect(blob.type).toBe('image/png'); expect(fillText).toHaveBeenCalled()
  })

  it('keeps the neutral no-photo card safe and rejects invalid phrase content', async () => {
    const { canvas } = installCanvas(); const create = vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    await expect(renderHeartRevealCardPng('心裡話', { locale: 'zh-TW' })).resolves.toBeInstanceOf(Blob)
    await expect(renderHeartRevealCardPng('x'.repeat(31), { locale: 'zh-TW' })).rejects.toThrow('Invalid heart reveal card message')
    create.mockRestore()
  })
})
