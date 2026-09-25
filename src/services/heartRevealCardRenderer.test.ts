import { describe, expect, it, vi } from 'vitest'
import { HEART_REVEAL_CARD_HEIGHT, HEART_REVEAL_CARD_WIDTH, getHeartRevealCardTextLayout, getHeartRevealOrientation, getHeartRevealOverlayLayout, getHeartRevealPanelLayout, renderHeartRevealCardPng } from './heartRevealCardRenderer'
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
    expect(layout.width / HEART_REVEAL_CARD_WIDTH).toBeLessThanOrEqual(.82)
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

  it('prioritizes whitespace word boundaries, then uses Unicode-safe character wrapping for long tokens and CJK', () => {
    const measure = (value: string, size: number) => [...value].length * size * .58
    const cjk = getHeartRevealCardTextLayout('謝謝你一直都在這裡陪著我', measure, 180, 4)
    const english = getHeartRevealCardTextLayout('Thank you for being here with me', measure, 260, 4)
    const spanish = getHeartRevealCardTextLayout('Gracias por acompañarme siempre', measure, 420, 4)
    const french = getHeartRevealCardTextLayout('Merci de rester près de moi', measure, 420, 4)
    const japanese = getHeartRevealCardTextLayout('いつもそばにいてくれてありがとう', measure, 180, 4)
    const korean = getHeartRevealCardTextLayout('언제나내곁에있어줘서고마워', measure, 180, 4)
    const mixed = getHeartRevealCardTextLayout('想你 every day ❤️', measure, 180, 4)
    const longToken = getHeartRevealCardTextLayout('supercalifragilisticexpialidocious', measure, 180, 4)
    expect(cjk.lines.join('')).toBe('謝謝你一直都在這裡陪著我')
    expect(japanese.lines.join('')).toBe('いつもそばにいてくれてありがとう')
    expect(korean.lines.join('')).toBe('언제나내곁에있어줘서고마워')
    expect(english.lines.join(' ')).toBe('Thank you for being here with me')
    expect(spanish.lines.join(' ')).toBe('Gracias por acompañarme siempre')
    expect(french.lines.join(' ')).toBe('Merci de rester près de moi')
    expect(mixed.lines.join(' ')).toContain('every day')
    expect(longToken.lines.join('')).toBe('supercalifragilisticexpialidocious')
    expect(longToken.lines.length).toBeGreaterThan(1)
  })

  it('keeps Latin words intact at ordinary boundaries, including the near-limit English sentence', () => {
    const measure = (value: string, size: number) => [...value].length * size * .58
    const text = 'No matter how busy the day gets, there is always a quiet moment when I think of you. ❤️'
    const layout = getHeartRevealCardTextLayout(text, measure, 420, 4)

    expect(layout.lines.join(' ')).toBe(text)
    expect(layout.lines.flatMap((line) => line.split(' '))).toEqual(text.split(' '))
  })

  it.each(['在屋頂唱著你的歌。', '愛你在北半球', '思念是一種「愛」 ❤️'])('keeps a normal note on one line when it fits the safe panel width: %s', (text) => {
    const measure = (value: string, size: number) => [...value].length * size * .58
    const overlay = getHeartRevealOverlayLayout(1600, 900, 'bottom-center')
    const layout = getHeartRevealCardTextLayout(text, measure, overlay.width - 84, overlay.maxLines)

    expect(layout.lines).toEqual([text])
  })

  it('sizes the panel from wrapped line height instead of its former fixed overlay height', () => {
    const measure = (value: string, size: number) => [...value].length * size * .58
    const overlay = getHeartRevealOverlayLayout(900, 1600, 'bottom-center')
    const oneLine = getHeartRevealCardTextLayout('想你', measure, overlay.width - 84, overlay.maxLines)
    const multiLine = getHeartRevealCardTextLayout('你在我心目中是最好的，謝謝你一直陪著我', measure, 180, overlay.maxLines)
    const onePanel = getHeartRevealPanelLayout(overlay, oneLine)
    const multiPanel = getHeartRevealPanelLayout(overlay, multiLine)
    expect(oneLine.lines).toHaveLength(1)
    expect(multiLine.lines.length).toBeGreaterThanOrEqual(2)
    expect(onePanel.height).toBe(onePanel.textHeight + 76)
    expect(multiPanel.height).toBe(multiPanel.textHeight + 76)
    expect(onePanel.height).toBeLessThan(overlay.height)
    expect(multiPanel.height).toBeGreaterThan(onePanel.height)
  })

  it.each([
    ['top-left', 'zh-TW', '想你'], ['top-center', 'en', 'Thank you for always being here with me'], ['top-right', 'ja', 'いつもそばにいてくれてありがとう'],
    ['bottom-left', 'ko', '언제나 내 곁에 있어 줘서 고마워'], ['bottom-center', 'es', 'Gracias por acompañarme siempre en cada momento'], ['bottom-right', 'fr', 'Merci de rester près de moi chaque jour'],
  ] as const)('keeps %s safely positioned for wrapped %s text', (placement, locale, text) => {
    const measure = (value: string, size: number) => [...value].length * size * .58
    const overlay = getHeartRevealOverlayLayout(900, 1600, placement as HeartRevealTextPlacement)
    const textLayout = getHeartRevealCardTextLayout(text, measure, overlay.width - 84, overlay.maxLines)
    const panel = getHeartRevealPanelLayout(overlay, textLayout)
    expect(panel.x).toBeGreaterThanOrEqual(0)
    expect(panel.x + panel.width).toBeLessThanOrEqual(HEART_REVEAL_CARD_WIDTH)
    expect(panel.y).toBeGreaterThanOrEqual(54)
    expect(panel.y + panel.height).toBeLessThanOrEqual(HEART_REVEAL_CARD_HEIGHT - 54)
    if (placement.startsWith('bottom')) expect(panel.y + panel.height).toBe(HEART_REVEAL_CARD_HEIGHT - 54)
    else expect(panel.y).toBe(54)
  })

  it.each([
    ['top-left', 'left', 'top'], ['top-center', 'center', 'top'], ['top-right', 'right', 'top'],
    ['bottom-left', 'left', 'bottom'], ['bottom-center', 'center', 'bottom'], ['bottom-right', 'right', 'bottom'],
  ] as const)('contains emoji text in the %s content-aware panel', (placement, horizontal, vertical) => {
    const measure = (value: string, size: number) => [...value].length * size * .58
    const overlay = getHeartRevealOverlayLayout(900, 1600, placement as HeartRevealTextPlacement)
    const textLayout = getHeartRevealCardTextLayout('思念是一種「愛」 ❤️', measure, overlay.width - 84, overlay.maxLines)
    const panel = getHeartRevealPanelLayout(overlay, textLayout)

    expect(textLayout.lines.join('')).toBe('思念是一種「愛」 ❤️')
    expect(panel.x).toBeGreaterThanOrEqual(54)
    expect(panel.x + panel.width).toBeLessThanOrEqual(HEART_REVEAL_CARD_WIDTH - 54)
    expect(panel.y).toBe(vertical === 'top' ? 54 : HEART_REVEAL_CARD_HEIGHT - panel.height - 54)
    expect(panel.x).toBe(horizontal === 'left' ? 54 : horizontal === 'right' ? HEART_REVEAL_CARD_WIDTH - panel.width - 54 : (HEART_REVEAL_CARD_WIDTH - panel.width) / 2)
    expect(panel.x + 42 + textLayout.maxLineWidth).toBeLessThanOrEqual(panel.x + panel.width - 42 + .001)
  })

  it('shrinks a short panel while long text wraps at the safe maximum width', () => {
    const measure = (value: string, size: number) => [...value].length * size * .58
    const overlay = getHeartRevealOverlayLayout(900, 1600, 'bottom-center')
    const short = getHeartRevealPanelLayout(overlay, getHeartRevealCardTextLayout('愛你在北半球', measure, overlay.width - 84, overlay.maxLines))
    const longText = getHeartRevealCardTextLayout('思念是一種「愛」 ❤️ 思念是一種「愛」 ❤️ 思念是一種「愛」 ❤️', measure, overlay.width - 84, overlay.maxLines)
    const long = getHeartRevealPanelLayout(overlay, longText)

    expect(short.width).toBeLessThan(overlay.width)
    expect(long.width).toBeLessThanOrEqual(overlay.width)
    expect(longText.lines.length).toBeGreaterThan(1)
    expect(long.height).toBeGreaterThan(short.height)
  })

  it.each(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const)('keeps an eighty-code-point Latin phrase inside the %s panel', (placement) => {
    const measure = (value: string, size: number) => [...value].length * size * .58
    const text = 'Pensar en ti hace que cada día sea más cálido y luminoso, incluso lejos de ti ❤️'
    const overlay = getHeartRevealOverlayLayout(900, 1600, placement as HeartRevealTextPlacement)
    const textLayout = getHeartRevealCardTextLayout(text, measure, overlay.width - 84, overlay.maxLines)
    const panel = getHeartRevealPanelLayout(overlay, textLayout)

    expect(Array.from(text)).toHaveLength(80)
    expect(textLayout.lines.join('').replaceAll(' ', '')).toBe(text.replaceAll(' ', ''))
    expect(panel.x).toBeGreaterThanOrEqual(54)
    expect(panel.x + panel.width).toBeLessThanOrEqual(HEART_REVEAL_CARD_WIDTH - 54)
    expect(panel.y).toBeGreaterThanOrEqual(54)
    expect(panel.y + panel.height).toBeLessThanOrEqual(HEART_REVEAL_CARD_HEIGHT - 54)
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

  it.each([
    ['zh-TW', '思念是一種「愛」 ❤️'],
    ['en', 'Thinking of you makes me smile. ❤️'],
    ['en', 'Even on the busiest days, somehow my thoughts still find you. ❤️'],
    ['fr', 'Penser à toi me fait sourire. ❤️'],
    ['es', 'Pensar en ti me hace sonreír. ❤️'],
    ['zh-TW', '心'.repeat(80)],
    ['en', `${'a'.repeat(78)}💗b`],
  ] as const)('renders Unicode text up to the eighty-code-point limit: %s %s', async (locale, message) => {
    const { canvas, fillText } = installCanvas(); const create = vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    await expect(renderHeartRevealCardPng(message, { locale })).resolves.toBeInstanceOf(Blob)
    expect(fillText.mock.calls.map(([value]) => value).join('').replaceAll(' ', '')).toContain(message.replaceAll(' ', ''))
    create.mockRestore()
  })

  it('keeps the neutral no-photo card safe and rejects invalid phrase content', async () => {
    const { canvas } = installCanvas(); const create = vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    await expect(renderHeartRevealCardPng('心裡話', { locale: 'zh-TW' })).resolves.toBeInstanceOf(Blob)
    await expect(renderHeartRevealCardPng('x'.repeat(81), { locale: 'zh-TW' })).rejects.toThrow('Invalid heart reveal card message')
    create.mockRestore()
  })
})