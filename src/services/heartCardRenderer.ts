import type { PhotoPlacement } from '../data/types'
import { countGraphemes, splitGraphemes } from './graphemes'

export const HEART_CARD_WIDTH = 1080
export const HEART_CARD_HEIGHT = 1350
export const HEART_CARD_MAX_CHARS = 300
export const HEART_CARD_TEXT_SIZE_CANDIDATES = [56, 46, 38, 34, 32, 30] as const
export const HEART_CARD_TITLE_SIZE_CANDIDATES = [28, 26, 24] as const
export const HEART_CARD_IMAGE_HEIGHT = 560
export const HEART_CARD_TITLE_BASELINE_Y = 615
export const HEART_CARD_TEXT_SAFE_WIDTH = 880
export const HEART_CARD_TEXT_SAFE_TOP = 640
export const HEART_CARD_TEXT_SAFE_BOTTOM = 1220
export const HEART_CARD_TEXT_SAFE_HEIGHT = HEART_CARD_TEXT_SAFE_BOTTOM - HEART_CARD_TEXT_SAFE_TOP
export const HEART_CARD_TEXT_CENTER_Y = (HEART_CARD_TEXT_SAFE_TOP + HEART_CARD_TEXT_SAFE_BOTTOM) / 2
export const HEART_CARD_BRAND_BASELINE_Y = 1290
export const HEART_CARD_BRAND = 'Starry Love Diary'
export const HEART_CARD_FRONT_ARTWORK_PATH = '/assets/heart-card/heart-card-front-v1.png'
export const HEART_CARD_BANNER_ARTWORK_PATH = '/assets/heart-card/heart-card-black-cat-banner-v1.png'
export const HEART_CARD_BACKGROUNDS = [
  { id: 'original-night', path: '/assets/heart-card/heart-card-bg-01-starry-night-v2.png' },
  { id: 'sunny-garden', path: '/assets/heart-card/heart-card-bg-02-sunny-garden-v2.png' },
  { id: 'blue-beach', path: '/assets/heart-card/heart-card-bg-03-blue-beach-v2.png' },
  { id: 'romantic-sunset', path: '/assets/heart-card/heart-card-bg-04-romantic-sunset-v2.png' },
  { id: 'winter-night', path: '/assets/heart-card/heart-card-bg-05-winter-night-v2.png' },
  { id: 'sakura-moonlight', path: '/assets/heart-card/heart-card-bg-06-sakura-moonlight-v2.png' },
] as const
export type HeartCardBackgroundId = typeof HEART_CARD_BACKGROUNDS[number]['id']
export type HeartCardStyleId = HeartCardBackgroundId | 'my-photo'
export const DEFAULT_HEART_CARD_BACKGROUND: HeartCardBackgroundId = 'original-night'
export interface HeartCardCopy { title: string; brand: string; locale?: 'zh-TW' | 'en' | 'ja' | 'ko' | 'es' | 'fr' }
export interface HeartCardLayout { lines: string[]; hasOversizeWord?: boolean }
export interface HeartCardArtwork { front: CanvasImageSource }
export interface HeartCardRenderOptions { backgroundId?: HeartCardStyleId; photoUrl?: string }
const artworkFont = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
let artworkPromise: Promise<HeartCardArtwork> | undefined
function isLatinWordCharacter(value: string) { return /[\p{Script=Latin}\p{Number}\p{Mark}'’_-]/u.test(value) }
function contentUnits(paragraph: string) {
  const units: string[] = []
  let word = ''
  const flushWord = () => { if (word) { units.push(word); word = '' } }
  for (const grapheme of splitGraphemes(paragraph)) {
    if (/^\s+$/u.test(grapheme)) { flushWord(); if (units.at(-1) !== ' ') units.push(' '); continue }
    if (isLatinWordCharacter(grapheme)) { word += grapheme; continue }
    flushWord()
    if (/^[.,!?;:…)]$/u.test(grapheme) && units.length && units.at(-1) !== ' ') units[units.length - 1] += grapheme
    else units.push(grapheme)
  }
  flushWord()
  return units
}
export function getHeartCardLayout(text: string, measure: (value: string) => number, maxWidth = 560, _locale?: HeartCardCopy['locale'], splitOversizeWords = true): HeartCardLayout {
  const lines: string[] = []
  let hasOversizeWord = false
  for (const paragraph of text.split(/\r?\n/)) {
    if (!paragraph) { lines.push(' '); continue }
    const units = contentUnits(paragraph)
    let line = ''
    for (const unit of units) {
      const candidate = line + unit
      if (line && measure(candidate) > maxWidth) { lines.push(line.trimEnd()); line = unit.trimStart(); continue }
      if (!line && measure(unit) > maxWidth) {
        hasOversizeWord = true
        if (!splitOversizeWords) { lines.push(unit); continue }
        for (const character of [...unit]) { if (line && measure(line + character) > maxWidth) { lines.push(line.trimEnd()); line = character } else line += character }
      } else line = candidate
    }
    if (line) lines.push(line.trimEnd())
  }
  return { lines, hasOversizeWord }
}
async function loadImage(path: string): Promise<HTMLImageElement> { const image = new Image(); image.src = path; if (typeof image.decode === 'function') { await image.decode(); return image }; await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error(`Could not load ${path}`)) }); return image }
export function loadHeartCardArtwork(): Promise<HeartCardArtwork> { artworkPromise ??= loadImage(HEART_CARD_FRONT_ARTWORK_PATH).then((front) => ({ front })); return artworkPromise }
function drawCenteredLines(context: CanvasRenderingContext2D, lines: string[], centerX: number, centerY: number, lineHeight: number) { const startY = centerY - ((lines.length - 1) * lineHeight) / 2; lines.forEach((line, index) => context.fillText(line, centerX, startY + index * lineHeight)) }
function backgroundPath(id: HeartCardBackgroundId) { return HEART_CARD_BACKGROUNDS.find((background) => background.id === id)?.path ?? HEART_CARD_FRONT_ARTWORK_PATH }
function drawCover(context: CanvasRenderingContext2D, image: CanvasImageSource, x: number, y: number, width: number, height: number) { const source = image as { width: number; height: number }, scale = Math.max(width / source.width, height / source.height), drawnWidth = source.width * scale, drawnHeight = source.height * scale; context.drawImage(image, x + (width - drawnWidth) / 2, y + (height - drawnHeight) / 2, drawnWidth, drawnHeight) }
function selectTitleSize(title: string, context: CanvasRenderingContext2D) {
  for (const size of HEART_CARD_TITLE_SIZE_CANDIDATES) {
    context.font = `600 ${size}px ${artworkFont}`
    if (context.measureText(title).width <= HEART_CARD_TEXT_SAFE_WIDTH) return size
  }
  throw new Error('Heart card text does not fit')
}
function selectTextLayout(text: string, context: CanvasRenderingContext2D, locale: HeartCardCopy['locale']) {
  for (const size of HEART_CARD_TEXT_SIZE_CANDIDATES) {
    context.font = `500 ${size}px ${artworkFont}`
    const layout = getHeartCardLayout(text, (value) => context.measureText(value).width, HEART_CARD_TEXT_SAFE_WIDTH, locale, false)
    const height = (layout.lines.length - 1) * size * 1.46 + size
    const fitsWidth = layout.lines.every((line) => context.measureText(line).width <= HEART_CARD_TEXT_SAFE_WIDTH), fitsHeight = height <= HEART_CARD_TEXT_SAFE_HEIGHT
    if (!layout.hasOversizeWord && fitsWidth && fitsHeight) return { layout, size }
  }
  context.font = `500 30px ${artworkFont}`
  const layout = getHeartCardLayout(text, (value) => context.measureText(value).width, HEART_CARD_TEXT_SAFE_WIDTH, locale)
  const height = (layout.lines.length - 1) * 30 * 1.46 + 30
  const fitsWidth = layout.lines.every((line) => context.measureText(line).width <= HEART_CARD_TEXT_SAFE_WIDTH), fitsHeight = height <= HEART_CARD_TEXT_SAFE_HEIGHT
  if (fitsWidth && fitsHeight) return { layout, size: 30 }
  throw new Error('Heart card text does not fit')
}
function drawTextPanel(context: CanvasRenderingContext2D, message: string, copy: HeartCardCopy) {
  const titleSize = selectTitleSize(copy.title, context)
  context.textAlign = 'center'; context.fillStyle = '#76546f'; context.font = `600 ${titleSize}px ${artworkFont}`; context.fillText(copy.title, HEART_CARD_WIDTH / 2, HEART_CARD_TITLE_BASELINE_Y)
  const { layout, size } = selectTextLayout(message, context, copy.locale)
  context.fillStyle = '#49334d'; context.font = `500 ${size}px ${artworkFont}`; drawCenteredLines(context, layout.lines, HEART_CARD_WIDTH / 2, HEART_CARD_TEXT_CENTER_Y, size * 1.46)
  context.fillStyle = '#76546f'; context.font = `600 25px ${artworkFont}`; context.fillText(HEART_CARD_BRAND, HEART_CARD_WIDTH / 2, HEART_CARD_BRAND_BASELINE_Y)
}
export async function renderHeartCardPng(text: string, copy: HeartCardCopy, suppliedArtwork?: HeartCardArtwork, revealPhotoUrl?: string, revealPlacement?: Partial<PhotoPlacement>, options: HeartCardRenderOptions = {}): Promise<Blob> {
  const message = text.trim(); if (!message || countGraphemes(message) > HEART_CARD_MAX_CHARS) throw new Error('Invalid heart card message'); if (typeof document === 'undefined') throw new Error('Canvas is unavailable'); await document.fonts?.ready
  const canvas = document.createElement('canvas'); canvas.width = HEART_CARD_WIDTH; canvas.height = HEART_CARD_HEIGHT; const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas is unavailable'); context.imageSmoothingQuality = 'high'; context.fillStyle = '#f7e6eb'; context.fillRect(0, 0, HEART_CARD_WIDTH, HEART_CARD_HEIGHT)
  if (options.backgroundId === 'my-photo') {
    if (!options.photoUrl) throw new Error('Heart card photo is required'); drawCover(context, await loadImage(options.photoUrl), 0, 0, HEART_CARD_WIDTH, HEART_CARD_IMAGE_HEIGHT); context.fillStyle = '#fff8f3'; context.fillRect(0, HEART_CARD_IMAGE_HEIGHT, HEART_CARD_WIDTH, HEART_CARD_HEIGHT - HEART_CARD_IMAGE_HEIGHT)
    drawTextPanel(context, message, copy)
  } else {
    const artwork = suppliedArtwork?.front ?? await loadImage(backgroundPath(options.backgroundId ?? DEFAULT_HEART_CARD_BACKGROUND))
    drawCover(context, artwork, 0, 0, HEART_CARD_WIDTH, HEART_CARD_IMAGE_HEIGHT); context.fillStyle = '#fff8f3'; context.fillRect(0, HEART_CARD_IMAGE_HEIGHT, HEART_CARD_WIDTH, HEART_CARD_HEIGHT - HEART_CARD_IMAGE_HEIGHT)
    drawTextPanel(context, message, copy)
  }
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'))
}
