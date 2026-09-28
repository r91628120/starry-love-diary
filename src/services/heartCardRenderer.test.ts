import { existsSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_HEART_CARD_BACKGROUND, HEART_CARD_BACKGROUNDS, HEART_CARD_BANNER_ARTWORK_PATH, HEART_CARD_BRAND, HEART_CARD_BRAND_BASELINE_Y, HEART_CARD_FRONT_ARTWORK_PATH, HEART_CARD_HEIGHT, HEART_CARD_IMAGE_HEIGHT, HEART_CARD_MAX_CHARS, HEART_CARD_TEXT_CENTER_Y, HEART_CARD_TEXT_SAFE_BOTTOM, HEART_CARD_TEXT_SAFE_HEIGHT, HEART_CARD_TEXT_SAFE_TOP, HEART_CARD_TEXT_SIZE_CANDIDATES, HEART_CARD_TITLE_BASELINE_Y, HEART_CARD_TITLE_SIZE_CANDIDATES, HEART_CARD_WIDTH, getHeartCardLayout, renderHeartCardPng } from './heartCardRenderer'

function installCanvas() {
  const fontCalls: string[] = []
  const fontAssignments: string[] = []
  const drawnText: Array<{ text: string; font: string; x: number; y: number }> = []
  const drawImage = vi.fn()
  let font = ''
  const context = {
    fillStyle: '', get font() { return font }, set font(value: string) { font = value; fontAssignments.push(value) }, textAlign: 'start', shadowColor: '', shadowBlur: 0, imageSmoothingQuality: 'low', drawImage, fillRect: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })), measureText: vi.fn((text: string) => ({ width: [...text].length * Number(font.match(/(\d+)px/)?.[1] ?? 25) })), fillText: vi.fn((text: string, x: number, y: number) => { fontCalls.push(font); drawnText.push({ text, font, x, y }) }),
  } as unknown as CanvasRenderingContext2D
  const canvas = { width: 0, height: 0, getContext: vi.fn(() => context), toBlob: (callback: BlobCallback) => callback(new Blob(['png'], { type: 'image/png' })) } as unknown as HTMLCanvasElement
  return { canvas, fillText: context.fillText as ReturnType<typeof vi.fn>, drawImage, fontCalls, fontAssignments, drawnText }
}

describe('heart card renderer', () => {
  const artwork = { front: { width: 1358, height: 1159 } as unknown as CanvasImageSource }

  it('uses the one clean, local artwork set', () => {
    expect(HEART_CARD_BRAND).toBe('Starry Love Diary')
    expect(HEART_CARD_FRONT_ARTWORK_PATH).toBe('/assets/heart-card/heart-card-front-v1.png')
    expect(HEART_CARD_BANNER_ARTWORK_PATH).toBe('/assets/heart-card/heart-card-black-cat-banner-v1.png')
    for (const path of [HEART_CARD_FRONT_ARTWORK_PATH, HEART_CARD_BANNER_ARTWORK_PATH, '/assets/heart-card/heart-card-back-v1.png']) expect(existsSync(`public${path}`)).toBe(true)
  })

  it('defines six local, exportable backgrounds and keeps the original night as the default', () => {
    expect(DEFAULT_HEART_CARD_BACKGROUND).toBe('original-night')
    expect(HEART_CARD_BACKGROUNDS.map((background) => background.id)).toEqual(['original-night', 'sunny-garden', 'blue-beach', 'romantic-sunset', 'winter-night', 'sakura-moonlight'])
    for (const background of HEART_CARD_BACKGROUNDS) expect(existsSync(`public${background.path}`)).toBe(true)
  })

  it('draws the title below the pure V2 image area', async () => {
    const first = installCanvas(); const firstCreate = vi.spyOn(document, 'createElement').mockReturnValue(first.canvas)
    await renderHeartCardPng('A small note', { title: 'What I Want to Tell You', brand: 'Starry Love Diary', locale: 'en' }, artwork)
    firstCreate.mockRestore()
    const second = installCanvas(); const secondCreate = vi.spyOn(document, 'createElement').mockReturnValue(second.canvas)
    await renderHeartCardPng('Un petit mot', { title: 'Ce que je veux te dire', brand: 'Journal d’amour étoilé', locale: 'fr' }, artwork)
    secondCreate.mockRestore()
    expect(first.drawnText).toContainEqual(expect.objectContaining({ text: 'What I Want to Tell You', x: 540, y: HEART_CARD_TITLE_BASELINE_Y, font: expect.stringContaining('28px') }))
    expect(second.drawnText).toContainEqual(expect.objectContaining({ text: 'Ce que je veux te dire', x: 540, y: HEART_CARD_TITLE_BASELINE_Y, font: expect.stringContaining('28px') }))
    expect(first.drawnText.find(({ text }) => text === 'What I Want to Tell You')?.y).toBeGreaterThan(HEART_CARD_IMAGE_HEIGHT)
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
    expect(layout.lines.join('').replaceAll(' ', '')).toBe('謝謝你，holacafé日本語한국어✨')
    expect(layout.lines.length).toBeGreaterThan(1)
  })

  it.each([
    ['en', 'Anyone can make you smile. Many people can make you cry. But it takes someone really special to make you smile with tears in your eyes.'],
    ['es', 'No importa que nos separe la distancia, siempre habrá un mismo cielo que nos una.'],
    ['fr', "La vie est une fleur dont l'amour est le miel. C'est la colombe qui a l'aile dans le ciel."],
  ] as const)('keeps complete %s words, accents, apostrophes, and punctuation on one line unit', (locale, text) => {
    const layout = getHeartCardLayout(text, (value) => [...value].length * 20, 220, locale, false)
    expect(layout.hasOversizeWord).toBe(false)
    expect(layout.lines.flatMap((line) => line.split(' '))).toEqual(text.split(' '))
    expect(layout.lines).not.toContain('.')
    expect(layout.lines.some((line) => line.includes('Many'))).toBe(locale === 'en')
    expect(layout.lines.some((line) => line.includes('distancia,'))).toBe(locale === 'es')
    expect(layout.lines.some((line) => line.includes("l'amour"))).toBe(locale === 'fr')
    expect(layout.lines.some((line) => line.includes("C'est"))).toBe(locale === 'fr')
  })

  it('uses the body content rather than a zh-TW UI locale to keep English words intact', () => {
    const text = "Since I met you, my ordinary days have felt brighter. I think of you when I see the sky, hear a familiar song, or simply wonder how your day has been. I don't need our love to be perfect. I only hope we can keep walking together, sharing our laughter, worries, and little moments. ❤️"
    const layout = getHeartCardLayout(text, (value) => [...value].length * 20, 220, 'zh-TW', false)
    const rejoined = layout.lines.join(' ')
    expect(layout.hasOversizeWord).toBe(false)
    for (const word of ['felt', 'wonder', 'our', 'laughter']) expect(rejoined).toContain(word)
    expect(rejoined).not.toMatch(/f\s+elt|wond\s+er|o\s+ur|laugh\s+ter/)
  })

  it('keeps CJK grapheme wrapping when the UI locale is English', () => {
    const text = '今天真的很開心因為有你陪在我身邊每一個平凡的瞬間都變得特別溫柔'
    const layout = getHeartCardLayout(text, (value) => [...value].length * 20, 120, 'en', false)
    expect(layout.hasOversizeWord).toBe(false)
    expect(layout.lines.length).toBeGreaterThan(1)
    expect(layout.lines.join('')).toBe(text)
    expect(layout.lines.every((line) => [...line].length <= 6)).toBe(true)
  })

  it('keeps Latin words intact while wrapping mixed CJK and Latin content', () => {
    const text = '今天真的很開心，Thank you for being with me. ❤️'
    const layout = getHeartCardLayout(text, (value) => [...value].length * 20, 160, 'zh-TW', false)
    const rejoined = layout.lines.join(' ')
    expect(layout.hasOversizeWord).toBe(false)
    for (const word of ['Thank', 'you', 'for', 'being', 'with', 'me.']) expect(rejoined).toContain(word)
    expect(rejoined).not.toMatch(/Tha\s+nk|be\s+ing|wi\s+th/)
    expect(layout.lines.join('').replaceAll(' ', '')).toBe(text.replaceAll(' ', ''))
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

  it('distinguishes the 300-grapheme length boundary from layout fitting', async () => {
    await expect(renderHeartCardPng('   ', {} as never, artwork)).rejects.toThrow('Invalid heart card message')
    const { canvas } = installCanvas(); const create = vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    await expect(renderHeartCardPng('x'.repeat(HEART_CARD_MAX_CHARS), { title: '', brand: '' }, artwork)).resolves.toBeInstanceOf(Blob)
    create.mockRestore()
    await expect(renderHeartCardPng('x'.repeat(HEART_CARD_MAX_CHARS + 1), {} as never, artwork)).rejects.toThrow('Invalid heart card message')
  })

  it('keeps long bounded copy in a fitted multi-line layout', () => {
    const layout = getHeartCardLayout('x'.repeat(60), (value) => [...value].length * 25, 180, 'en')
    expect(layout.lines.length).toBeGreaterThan(1)
    expect(layout.lines.join('')).toBe('x'.repeat(60))
  })

  it('renders a selected photo above a separate text panel', async () => {
    class TestImage { width = 1600; height = 900; src = ''; async decode() {} }
    vi.stubGlobal('Image', TestImage)
    const { canvas, drawImage } = installCanvas(); const create = vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    await renderHeartCardPng('A card with my photo', { title: 'What I Want to Tell You', brand: 'Starry Love Diary', locale: 'en' }, undefined, undefined, undefined, { backgroundId: 'my-photo', photoUrl: 'data:image/png;base64,photo' })
    expect(drawImage).toHaveBeenCalledWith(expect.any(TestImage), expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number))
    create.mockRestore(); vi.unstubAllGlobals()
  })

  it.each(['我愛你 ❤️', '愛在北半球 ❤️'])('uses 56px for a short message: %s', async (message) => {
    const { canvas, fontCalls } = installCanvas(); const create = vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    await renderHeartCardPng(message, { title: '', brand: '', locale: 'zh-TW' }, artwork)
    expect(fontCalls).toEqual(expect.arrayContaining([expect.stringContaining('56px')]))
    create.mockRestore()
  })

  it('tries smaller sizes only when a larger size does not fit', async () => {
    const { canvas, fontCalls, fontAssignments } = installCanvas(); const create = vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    await renderHeartCardPng('Many people make you smile with kindness. '.repeat(3).trim(), { title: '', brand: '', locale: 'en' }, artwork)
    expect(fontCalls).toEqual(expect.arrayContaining([expect.stringContaining('38px')]))
    expect(fontCalls).not.toEqual(expect.arrayContaining([expect.stringContaining('56px')]))
    expect(fontAssignments).toEqual(expect.arrayContaining([expect.stringContaining('56px'), expect.stringContaining('46px')]))
    create.mockRestore()
  })

  it.each([
    ['zh-TW', 'Anyone can make you smile. Many people can make you cry. '.repeat(5).trim()],
    ['zh-TW', `${'No importa que nos separe la distancia, siempre habrá un mismo cielo que nos una. '.repeat(3)}Aunque estemos lejos, seguimos bajo la misma luz.`],
    ['zh-TW', `${"La vie est une fleur dont l'amour est le miel. C'est la colombe qui a l'aile dans le ciel. ".repeat(3)}Toujours près.`],
  ] as const)('fits near-300-grapheme Latin text even with a %s UI locale', async (locale, text) => {
    const long = installCanvas(); const longCreate = vi.spyOn(document, 'createElement').mockReturnValue(long.canvas)
    expect([...text].length).toBeGreaterThanOrEqual(280)
    expect([...text].length).toBeLessThanOrEqual(300)
    await expect(renderHeartCardPng(text, { title: '', brand: '', locale }, artwork)).resolves.toBeInstanceOf(Blob)
    expect(long.fontAssignments).toEqual(expect.arrayContaining([expect.stringContaining('56px'), expect.stringContaining('46px')]))
    expect(long.fontCalls.some((font) => HEART_CARD_TEXT_SIZE_CANDIDATES.some((size) => font.includes(`${size}px`)))).toBe(true)
    longCreate.mockRestore()
  })

  it('rejects text that cannot fit at 30px', async () => {
    const overflow = installCanvas(); const overflowCreate = vi.spyOn(document, 'createElement').mockReturnValue(overflow.canvas)
    await expect(renderHeartCardPng(Array.from({ length: 21 }, () => 'x').join('\n'), { title: '', brand: '', locale: 'en' }, artwork)).rejects.toThrow('Heart card text does not fit')
    expect(overflow.fontAssignments).toEqual(expect.arrayContaining([expect.stringContaining('30px')]))
    overflowCreate.mockRestore()
  })

  it('uses the same sizing rule for built-in artwork and my photo', async () => {
    const builtIn = installCanvas(); const builtInCreate = vi.spyOn(document, 'createElement').mockReturnValue(builtIn.canvas)
    await renderHeartCardPng('愛在北半球 ❤️', { title: '', brand: '', locale: 'zh-TW' }, artwork)
    builtInCreate.mockRestore()
    class TestImage { width = 1600; height = 900; src = ''; async decode() {} }
    vi.stubGlobal('Image', TestImage)
    const photo = installCanvas(); const photoCreate = vi.spyOn(document, 'createElement').mockReturnValue(photo.canvas)
    await renderHeartCardPng('愛在北半球 ❤️', { title: '', brand: '', locale: 'zh-TW' }, undefined, undefined, undefined, { backgroundId: 'my-photo', photoUrl: 'data:image/png;base64,photo' })
    expect(HEART_CARD_TEXT_SIZE_CANDIDATES).toEqual([56, 46, 38, 34, 32, 30])
    expect(builtIn.fontCalls).toEqual(expect.arrayContaining([expect.stringContaining('56px')]))
    expect(photo.fontCalls).toEqual(expect.arrayContaining([expect.stringContaining('56px')]))
    photoCreate.mockRestore(); vi.unstubAllGlobals()
  })

  it('sizes a single-line title down only when 28px exceeds its safe width', async () => {
    const { canvas, drawnText, fontAssignments } = installCanvas(); const create = vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    const title = 'x'.repeat(33)
    await renderHeartCardPng('愛在北半球 ❤️', { title, brand: '', locale: 'en' }, artwork)
    expect(drawnText).toContainEqual(expect.objectContaining({ text: title, font: expect.stringContaining('26px'), y: HEART_CARD_TITLE_BASELINE_Y }))
    expect(fontAssignments).toEqual(expect.arrayContaining([expect.stringContaining('28px'), expect.stringContaining('26px')]))
    create.mockRestore()
  })

  it('uses the explicit 580px body safe box in both image-source branches', async () => {
    expect(HEART_CARD_TEXT_SAFE_TOP).toBe(640)
    expect(HEART_CARD_TEXT_SAFE_BOTTOM).toBe(1220)
    expect(HEART_CARD_TEXT_SAFE_HEIGHT).toBe(580)
    expect(HEART_CARD_TEXT_CENTER_Y).toBe(930)
    expect(HEART_CARD_BRAND_BASELINE_Y).toBe(1290)
    expect(HEART_CARD_TITLE_SIZE_CANDIDATES).toEqual([28, 26, 24])
  })
})
