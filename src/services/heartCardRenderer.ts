export const HEART_CARD_WIDTH = 1080
export const HEART_CARD_HEIGHT = 1350
export const HEART_CARD_MAX_CHARS = 60
export const HEART_CARD_BRAND = 'Starry Love Diary'

export const HEART_CARD_FRONT_ARTWORK_PATH = '/assets/heart-card/heart-card-front-v1.png'
export const HEART_CARD_BANNER_ARTWORK_PATH = '/assets/heart-card/heart-card-black-cat-banner-v1.png'

export interface HeartCardCopy {
  title: string
  brand: string
  locale?: 'zh-TW' | 'en' | 'ja' | 'ko' | 'es' | 'fr'
}

export interface HeartCardLayout { fontSize: number; lines: string[] }
export interface HeartCardArtwork { front: CanvasImageSource }

const artworkFont = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
let artworkPromise: Promise<HeartCardArtwork> | undefined

function isCjkLocale(locale: HeartCardCopy['locale']) { return locale === 'zh-TW' || locale === 'ja' || locale === 'ko' }

export function getHeartCardLayout(text: string, measure: (value: string) => number, maxWidth = 560, locale?: HeartCardCopy['locale']): HeartCardLayout {
  const length = [...text].length
  const fontSize = length <= 18 ? 56 : length <= 36 ? 46 : 38
  const lines: string[] = []
  for (const paragraph of text.split(/\r?\n/)) {
    if (!paragraph) { lines.push(' '); continue }
    const units = isCjkLocale(locale) ? [...paragraph] : paragraph.split(/(\s+)/).filter(Boolean)
    let line = ''
    for (const unit of units) {
      const candidate = line + unit
      if (line && measure(candidate) > maxWidth) {
        lines.push(line.trimEnd())
        line = unit.trimStart()
      } else line = candidate
    }
    if (line) lines.push(line.trimEnd())
  }
  return { fontSize, lines }
}

async function loadImage(path: string): Promise<HTMLImageElement> {
  const image = new Image()
  image.src = path
  if (typeof image.decode === 'function') {
    await image.decode()
    return image
  }
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error(`Could not load ${path}`)) })
  return image
}

export function loadHeartCardArtwork(): Promise<HeartCardArtwork> {
  artworkPromise ??= loadImage(HEART_CARD_FRONT_ARTWORK_PATH).then((front) => ({ front }))
  return artworkPromise
}

function drawContainedArtwork(context: CanvasRenderingContext2D, artwork: CanvasImageSource, targetX: number, targetY: number, targetWidth: number, targetHeight: number) {
  const source = artwork as { width: number; height: number }
  const scale = Math.min(targetWidth / source.width, targetHeight / source.height)
  const width = source.width * scale; const height = source.height * scale
  const x = targetX + (targetWidth - width) / 2; const y = targetY + (targetHeight - height) / 2
  context.drawImage(artwork, x, y, width, height)
  return { x, y, width, height, scale }
}

function drawCenteredLines(context: CanvasRenderingContext2D, lines: string[], centerX: number, centerY: number, lineHeight: number) {
  const startY = centerY - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((line, index) => context.fillText(line, centerX, startY + index * lineHeight))
}

export async function renderHeartCardPng(text: string, copy: HeartCardCopy, suppliedArtwork?: HeartCardArtwork, revealPhotoUrl?: string, revealPlacement?: Partial<PhotoPlacement>): Promise<Blob> {
  const message = text.trim()
  if (!message || [...message].length > HEART_CARD_MAX_CHARS) throw new Error('Invalid heart card message')
  if (typeof document === 'undefined') throw new Error('Canvas is unavailable')
  await document.fonts?.ready
  const artwork = suppliedArtwork ?? await loadHeartCardArtwork()
  const canvas = document.createElement('canvas'); canvas.width = HEART_CARD_WIDTH; canvas.height = HEART_CARD_HEIGHT
  const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas is unavailable')
  context.imageSmoothingQuality = 'high'
  context.fillStyle = '#f7e6eb'; context.fillRect(0, 0, HEART_CARD_WIDTH, HEART_CARD_HEIGHT)
  // The cycle card may quietly carry the currently revealed photo. Artwork
  // remains legible above it, while no-photo cycles stay fully supported.
  if (revealPhotoUrl) {
    try {
      const reveal = await loadImage(revealPhotoUrl)
      const source = reveal as { width: number; height: number }
      const placement = normalizePhotoPlacement(revealPlacement ?? DEFAULT_PHOTO_PLACEMENT)
      const scale = Math.max(HEART_CARD_WIDTH / source.width, HEART_CARD_HEIGHT / source.height) * placement.zoom
      const width = source.width * scale; const height = source.height * scale
      context.save(); context.globalAlpha = .20
      context.drawImage(reveal, (HEART_CARD_WIDTH - width) * placement.positionX, (HEART_CARD_HEIGHT - height) * placement.positionY, width, height)
      context.restore()
    } catch { /* A photo URL is ephemeral; card generation still succeeds without it. */ }
  }
  const front = drawContainedArtwork(context, artwork.front, 0, 116, HEART_CARD_WIDTH, 921)

  // These regions follow the actual whitespace of the clean front artwork, not the old placeholder composition.
  const frontCenterX = front.x + front.width / 2
  const brand = HEART_CARD_BRAND
  context.textAlign = 'center'; context.fillStyle = '#fff5f0'; context.shadowColor = 'rgba(35, 31, 73, .45)'; context.shadowBlur = 8
  context.font = `700 ${Math.min(52, front.width * .065)}px ${artworkFont}`; context.fillText(copy.title, frontCenterX, front.y + front.height * .10)
  context.shadowBlur = 0; context.font = `600 ${Math.min(25, front.width * .032)}px ${artworkFont}`; context.fillText(brand, frontCenterX, front.y + front.height * .145)

  const messageWidth = front.width * .56; const messageCenterY = front.y + front.height * .435
  const layout = getHeartCardLayout(message, (value) => { context.font = `500 ${layoutFontForMeasure(message)}px ${artworkFont}`; return context.measureText(value).width }, messageWidth, copy.locale)
  context.fillStyle = '#49334d'; context.font = `500 ${layout.fontSize * front.scale}px ${artworkFont}`
  drawCenteredLines(context, layout.lines, frontCenterX, messageCenterY, layout.fontSize * front.scale * 1.46)

  // Keep the footer compact and use the current app's formal brand copy.
  context.fillStyle = '#76546f'; context.font = `600 25px ${artworkFont}`; context.fillText(brand, HEART_CARD_WIDTH / 2, HEART_CARD_HEIGHT - 128)

  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'))
}

function layoutFontForMeasure(text: string) { const length = [...text].length; return length <= 18 ? 56 : length <= 36 ? 46 : 38 }
import type { PhotoPlacement } from '../data/types'
import { DEFAULT_PHOTO_PLACEMENT, normalizePhotoPlacement } from './photoPlacement'
