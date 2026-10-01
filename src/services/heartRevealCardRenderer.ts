import type { HeartRevealTextPlacement, PhotoPlacement } from '../data/types'
import { heartPhraseCodePointLength, MAX_HEART_PHRASE_CODE_POINTS } from '../data/heartPhraseLimit'
import { calculatePhotoPlacementGeometry } from './photoPlacementGeometry'
import { normalizePhotoPlacement } from './photoPlacement'
import { splitGraphemes } from './graphemes'

export const HEART_REVEAL_CARD_WIDTH = 1080
export const HEART_REVEAL_CARD_HEIGHT = 1350
export const HEART_REVEAL_CARD_MAX_CHARS = MAX_HEART_PHRASE_CODE_POINTS

type RevealLocale = 'zh-TW' | 'en' | 'ja' | 'ko' | 'es' | 'fr'
export type HeartRevealCardOrientation = 'landscape' | 'portrait'

export interface HeartRevealOverlayLayout {
  orientation: HeartRevealCardOrientation
  vertical: 'top' | 'bottom'
  x: number
  y: number
  width: number
  height: number
  textAlign: CanvasTextAlign
  maxLines: number
}

export interface HeartRevealCardCopy { locale: RevealLocale }
export interface HeartRevealPaintedTextMetrics { advanceWidth: number; paintedLeft: number; paintedRight: number; paintedWidth: number }
export type HeartRevealTextMeasure = (value: string, fontSize: number) => number | HeartRevealPaintedTextMetrics
export interface HeartRevealCardLayout { fontSize: number; lines: string[]; lineMetrics: HeartRevealPaintedTextMetrics[]; maxLineWidth: number }
export interface HeartRevealPanelLayout extends HeartRevealOverlayLayout { lineHeight: number; textHeight: number }

const CARD_PADDING = 54
const PANEL_VERTICAL_PADDING = 38
const PANEL_HORIZONTAL_PADDING = 42
const MIN_PANEL_WIDTH = 180
const fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

export function getHeartRevealOrientation(sourceWidth: number, sourceHeight: number): HeartRevealCardOrientation {
  return sourceWidth > sourceHeight ? 'landscape' : 'portrait'
}

export function getHeartRevealOverlayLayout(sourceWidth = HEART_REVEAL_CARD_WIDTH, sourceHeight = HEART_REVEAL_CARD_HEIGHT, textPlacement: HeartRevealTextPlacement = 'bottom-center'): HeartRevealOverlayLayout {
  const orientation = getHeartRevealOrientation(sourceWidth, sourceHeight)
  const isSquare = sourceWidth === sourceHeight
  const widthRatio = isSquare ? .64 : .74
  const width = HEART_REVEAL_CARD_WIDTH * widthRatio
  const height = HEART_REVEAL_CARD_HEIGHT * (orientation === 'landscape' ? .27 : .26)
  const horizontal = textPlacement.endsWith('left') ? 'left' : textPlacement.endsWith('right') ? 'right' : 'center'
  const vertical = textPlacement.startsWith('top') ? 'top' : 'bottom'
  const x = horizontal === 'left' ? CARD_PADDING : horizontal === 'right' ? HEART_REVEAL_CARD_WIDTH - width - CARD_PADDING : (HEART_REVEAL_CARD_WIDTH - width) / 2
  const y = vertical === 'top' ? CARD_PADDING : HEART_REVEAL_CARD_HEIGHT - height - CARD_PADDING
  return { orientation, vertical, x, y, width, height, textAlign: horizontal, maxLines: orientation === 'landscape' ? 3 : 4 }
}

function normalizeTextMetrics(value: number | HeartRevealPaintedTextMetrics): HeartRevealPaintedTextMetrics {
  if (typeof value === 'number') return { advanceWidth: value, paintedLeft: 0, paintedRight: value, paintedWidth: value }
  return value
}

function splitLongUnit(unit: string, measure: (value: string) => HeartRevealPaintedTextMetrics, maxWidth: number) {
  const parts: string[] = []
  let part = ''
  // A visible emoji such as ❤️ is one grapheme (U+2764 + U+FE0F). Never split
  // it while fitting a long CJK token: the same completed grapheme is supplied
  // to canvas.measureText and canvas.fillText.
  for (const grapheme of splitGraphemes(unit)) {
    if (part && measure(part + grapheme).paintedWidth > maxWidth) { parts.push(part); part = grapheme }
    else part += grapheme
  }
  if (part) parts.push(part)
  return parts
}

function wrapText(text: string, measure: (value: string) => HeartRevealPaintedTextMetrics, maxWidth: number) {
  const lines: string[] = []
  for (const paragraph of text.split(/\r?\n/)) {
    if (!paragraph) { lines.push(' '); continue }
    const units = paragraph.match(/\S+|\s+/gu) ?? []
    let line = ''
    for (const unit of units) {
      if (/^\s+$/u.test(unit)) {
        if (line) line += unit
        continue
      }
      const token = unit.trimStart()
      if (line && measure(line + token).paintedWidth > maxWidth) {
        lines.push(line.trimEnd())
        if (measure(token).paintedWidth > maxWidth) {
          const pieces = splitLongUnit(token, measure, maxWidth)
          lines.push(...pieces.slice(0, -1)); line = pieces.at(-1) ?? ''
        } else line = token
      } else if (!line && measure(token).paintedWidth > maxWidth) {
        const pieces = splitLongUnit(token, measure, maxWidth)
        lines.push(...pieces.slice(0, -1)); line = pieces.at(-1) ?? ''
      } else line += token
    }
    if (line) lines.push(line.trimEnd())
  }
  return lines
}

export function getHeartRevealCardTextLayout(text: string, measure: HeartRevealTextMeasure, maxWidth: number, maxLines: number): HeartRevealCardLayout {
  for (let fontSize = 64; fontSize >= 28; fontSize -= 2) {
    const lines = wrapText(text, (value) => normalizeTextMetrics(measure(value, fontSize)), maxWidth)
    const lineMetrics = lines.map((line) => normalizeTextMetrics(measure(line, fontSize)))
    if (lines.length <= maxLines) return { fontSize, lines, lineMetrics, maxLineWidth: Math.max(...lineMetrics.map((metrics) => metrics.paintedWidth)) }
  }
  // The input is limited to the product maximum. This guard is only for an unusual
  // single long token and retains every character instead of silently clipping it.
  const fontSize = 26
  const lines = wrapText(text, (value) => normalizeTextMetrics(measure(value, fontSize)), maxWidth)
  const lineMetrics = lines.map((line) => normalizeTextMetrics(measure(line, fontSize)))
  return { fontSize, lines, lineMetrics, maxLineWidth: Math.max(...lineMetrics.map((metrics) => metrics.paintedWidth)) }
}

export function getHeartRevealPanelLayout(overlay: HeartRevealOverlayLayout, textLayout: HeartRevealCardLayout): HeartRevealPanelLayout {
  const width = Math.min(overlay.width, Math.max(MIN_PANEL_WIDTH, textLayout.maxLineWidth + PANEL_HORIZONTAL_PADDING * 2))
  const lineHeight = textLayout.fontSize * 1.38
  const textHeight = textLayout.lines.length * lineHeight
  const height = textHeight + PANEL_VERTICAL_PADDING * 2
  const x = overlay.textAlign === 'left' ? CARD_PADDING : overlay.textAlign === 'right' ? HEART_REVEAL_CARD_WIDTH - width - CARD_PADDING : (HEART_REVEAL_CARD_WIDTH - width) / 2
  const y = overlay.vertical === 'top' ? CARD_PADDING : HEART_REVEAL_CARD_HEIGHT - height - CARD_PADDING
  return { ...overlay, x, y, width, height, lineHeight, textHeight }
}

export function getHeartRevealLineDrawX(panel: HeartRevealPanelLayout, metrics: HeartRevealPaintedTextMetrics) {
  const innerLeft = panel.x + PANEL_HORIZONTAL_PADDING
  const innerRight = panel.x + panel.width - PANEL_HORIZONTAL_PADDING
  const paintedLeft = panel.textAlign === 'left' ? innerLeft : panel.textAlign === 'right' ? innerRight - metrics.paintedWidth : (innerLeft + innerRight - metrics.paintedWidth) / 2
  return paintedLeft - metrics.paintedLeft
}

function measurePaintedText(context: CanvasRenderingContext2D, value: string, fontSize: number): HeartRevealPaintedTextMetrics {
  context.font = `600 ${fontSize}px ${fontFamily}`
  context.textAlign = 'left'
  const metrics = context.measureText(value)
  const left = metrics.actualBoundingBoxLeft
  const right = metrics.actualBoundingBoxRight
  if (Number.isFinite(left) && Number.isFinite(right) && left >= 0 && right >= 0 && left + right > 0) {
    return { advanceWidth: metrics.width, paintedLeft: -left, paintedRight: right, paintedWidth: left + right }
  }
  return { advanceWidth: metrics.width, paintedLeft: 0, paintedRight: metrics.width, paintedWidth: metrics.width }
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
  const textLayout = getHeartRevealCardTextLayout(text, (value, fontSize) => measurePaintedText(context, value, fontSize), overlay.width - PANEL_HORIZONTAL_PADDING * 2, overlay.maxLines)
  const panel = getHeartRevealPanelLayout(overlay, textLayout)
  context.save()
  context.fillStyle = 'rgba(255, 250, 244, 0.78)'
  drawRoundedRect(context, panel.x, panel.y, panel.width, panel.height, 34)
  const anchorY = panel.y + PANEL_VERTICAL_PADDING + textLayout.fontSize
  context.fillStyle = '#49334d'; context.font = `600 ${textLayout.fontSize}px ${fontFamily}`; context.textAlign = 'left'; context.textBaseline = 'alphabetic'
  textLayout.lines.forEach((line, index) => context.fillText(line, getHeartRevealLineDrawX(panel, textLayout.lineMetrics[index]), anchorY + index * panel.lineHeight))
  context.restore()
}

export async function renderHeartRevealCardPng(text: string, copy: HeartRevealCardCopy, photoUrl?: string, placement?: Partial<PhotoPlacement>, textPlacement: HeartRevealTextPlacement = 'bottom-center', suppliedPhoto?: CanvasImageSource & { width: number; height: number }): Promise<Blob> {
  const message = text.trim()
  if (!message || heartPhraseCodePointLength(message) > HEART_REVEAL_CARD_MAX_CHARS) throw new Error('Invalid heart reveal card message')
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
