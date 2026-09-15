import type { HeartRevealTextPlacement, PhotoPlacement } from '../data/types'
import { calculatePhotoPlacementGeometry } from './photoPlacementGeometry'
import { normalizePhotoPlacement } from './photoPlacement'

export const HEART_REVEAL_CARD_WIDTH = 1080
export const HEART_REVEAL_CARD_HEIGHT = 1350
export const HEART_REVEAL_CARD_MAX_CHARS = 30

type RevealLocale = 'zh-TW' | 'en' | 'ja' | 'ko' | 'es' | 'fr'
export type HeartRevealCardOrientation = 'landscape' | 'portrait'

export interface HeartRevealOverlayLayout {
  orientation: HeartRevealCardOrientation
  x: number
  y: number
  width: number
  height: number
  textAlign: CanvasTextAlign
  maxLines: number
}

export interface HeartRevealCardCopy { locale: RevealLocale }
export interface HeartRevealCardLayout { fontSize: number; lines: string[] }

const CARD_PADDING = 54
const fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

function isCjkLocale(locale: RevealLocale) { return locale === 'zh-TW' || locale === 'ja' || locale === 'ko' }

export function getHeartRevealOrientation(sourceWidth: number, sourceHeight: number): HeartRevealCardOrientation {
  return sourceWidth > sourceHeight ? 'landscape' : 'portrait'
}

export function getHeartRevealOverlayLayout(sourceWidth = HEART_REVEAL_CARD_WIDTH, sourceHeight = HEART_REVEAL_CARD_HEIGHT, textPlacement: HeartRevealTextPlacement = 'bottom-center'): HeartRevealOverlayLayout {
  const orientation = getHeartRevealOrientation(sourceWidth, sourceHeight)
  const isSquare = sourceWidth === sourceHeight
  const widthRatio = orientation === 'landscape' ? .40 : isSquare ? .64 : .74
  const width = HEART_REVEAL_CARD_WIDTH * widthRatio
  const height = HEART_REVEAL_CARD_HEIGHT * (orientation === 'landscape' ? .27 : .26)
  const horizontal = textPlacement.endsWith('left') ? 'left' : textPlacement.endsWith('right') ? 'right' : 'center'
  const vertical = textPlacement.startsWith('top') ? 'top' : 'bottom'
  const x = horizontal === 'left' ? CARD_PADDING : horizontal === 'right' ? HEART_REVEAL_CARD_WIDTH - width - CARD_PADDING : (HEART_REVEAL_CARD_WIDTH - width) / 2
  const y = vertical === 'top' ? CARD_PADDING : HEART_REVEAL_CARD_HEIGHT - height - CARD_PADDING
  return { orientation, x, y, width, height, textAlign: horizontal, maxLines: orientation === 'landscape' ? 3 : 4 }
}

function splitLongUnit(unit: string, measure: (value: string) => number, maxWidth: number) {
  const parts: string[] = []
  let part = ''
  for (const character of [...unit]) {
    if (part && measure(part + character) > maxWidth) { parts.push(part); part = character }
    else part += character
  }
  if (part) parts.push(part)
  return parts
}

function wrapText(text: string, measure: (value: string) => number, maxWidth: number, locale: RevealLocale) {
  const lines: string[] = []
  for (const paragraph of text.split(/\r?\n/)) {
    if (!paragraph) { lines.push(' '); continue }
    const units = isCjkLocale(locale) ? [...paragraph] : paragraph.split(/(\s+)/).filter(Boolean)
    let line = ''
    for (const unit of units) {
      const candidate = line + unit
      if (line && measure(candidate) > maxWidth) {
        lines.push(line.trimEnd())
        const next = unit.trimStart()
        if (measure(next) > maxWidth) {
          const pieces = splitLongUnit(next, measure, maxWidth)
          lines.push(...pieces.slice(0, -1)); line = pieces.at(-1) ?? ''
        } else line = next
      } else if (!line && measure(candidate) > maxWidth) {
        const pieces = splitLongUnit(unit.trimStart(), measure, maxWidth)
        lines.push(...pieces.slice(0, -1)); line = pieces.at(-1) ?? ''
      } else line = candidate
    }
    if (line) lines.push(line.trimEnd())
  }
  return lines
}

export function getHeartRevealCardTextLayout(text: string, measure: (value: string, fontSize: number) => number, maxWidth: number, locale: RevealLocale, maxLines: number): HeartRevealCardLayout {
  for (let fontSize = 64; fontSize >= 28; fontSize -= 2) {
    const lines = wrapText(text, (value) => measure(value, fontSize), maxWidth, locale)
    if (lines.length <= maxLines) return { fontSize, lines }
  }
  // The input is limited to 30 characters. This guard is only for an unusual
  // single long token and retains every character instead of silently clipping it.
  const fontSize = 26
  return { fontSize, lines: wrapText(text, (value) => measure(value, fontSize), maxWidth, locale) }
}

function drawRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
  context.fill()
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image()
  image.src = url
  if (typeof image.decode === 'function') { await image.decode(); return image }
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error(`Could not load ${url}`)) })
  return image
}

function drawPlacedPhoto(context: CanvasRenderingContext2D, image: CanvasImageSource & { width: number; height: number }, placement: Partial<PhotoPlacement>) {
  const geometry = calculatePhotoPlacementGeometry({
    frameWidth: HEART_REVEAL_CARD_WIDTH,
    frameHeight: HEART_REVEAL_CARD_HEIGHT,
    sourceWidth: image.width,
    sourceHeight: image.height,
  }, normalizePhotoPlacement(placement))
  if (!geometry) return
  context.drawImage(image, HEART_REVEAL_CARD_WIDTH / 2 + geometry.translateX - geometry.renderedWidth / 2, HEART_REVEAL_CARD_HEIGHT / 2 + geometry.translateY - geometry.renderedHeight / 2, geometry.renderedWidth, geometry.renderedHeight)
}

function drawOverlay(context: CanvasRenderingContext2D, text: string, copy: HeartRevealCardCopy, sourceWidth: number, sourceHeight: number, textPlacement: HeartRevealTextPlacement) {
  const overlay = getHeartRevealOverlayLayout(sourceWidth, sourceHeight, textPlacement)
  const inset = 42
  context.save()
  context.fillStyle = 'rgba(255, 250, 244, 0.78)'
  drawRoundedRect(context, overlay.x, overlay.y, overlay.width, overlay.height, 34)
  const textLayout = getHeartRevealCardTextLayout(text, (value, fontSize) => { context.font = `600 ${fontSize}px ${fontFamily}`; return context.measureText(value).width }, overlay.width - inset * 2, copy.locale, overlay.maxLines)
  const lineHeight = textLayout.fontSize * 1.38
  const textHeight = textLayout.lines.length * lineHeight
  const anchorX = overlay.textAlign === 'left' ? overlay.x + inset : overlay.textAlign === 'right' ? overlay.x + overlay.width - inset : overlay.x + overlay.width / 2
  const anchorY = overlay.y + (overlay.height - textHeight) / 2 + textLayout.fontSize
  context.fillStyle = '#49334d'; context.font = `600 ${textLayout.fontSize}px ${fontFamily}`; context.textAlign = overlay.textAlign; context.textBaseline = 'alphabetic'
  textLayout.lines.forEach((line, index) => context.fillText(line, anchorX, anchorY + index * lineHeight))
  context.restore()
}

export async function renderHeartRevealCardPng(text: string, copy: HeartRevealCardCopy, photoUrl?: string, placement?: Partial<PhotoPlacement>, textPlacement: HeartRevealTextPlacement = 'bottom-center', suppliedPhoto?: CanvasImageSource & { width: number; height: number }): Promise<Blob> {
  const message = text.trim()
  if (!message || [...message].length > HEART_REVEAL_CARD_MAX_CHARS) throw new Error('Invalid heart reveal card message')
  if (typeof document === 'undefined') throw new Error('Canvas is unavailable')
  await document.fonts?.ready
  const canvas = document.createElement('canvas'); canvas.width = HEART_REVEAL_CARD_WIDTH; canvas.height = HEART_REVEAL_CARD_HEIGHT
  const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas is unavailable')
  context.imageSmoothingQuality = 'high'
  context.fillStyle = '#f7e6eb'; context.fillRect(0, 0, HEART_REVEAL_CARD_WIDTH, HEART_REVEAL_CARD_HEIGHT)
  let photo = suppliedPhoto
  if (!photo && photoUrl) {
    try { photo = await loadImage(photoUrl) } catch { /* The neutral no-photo card remains safe. */ }
  }
  if (photo) drawPlacedPhoto(context, photo, placement ?? {})
  drawOverlay(context, message, copy, photo?.width ?? HEART_REVEAL_CARD_WIDTH, photo?.height ?? HEART_REVEAL_CARD_HEIGHT, textPlacement)
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'))
}
