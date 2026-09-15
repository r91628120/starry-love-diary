import type { PhotoPlacement } from '../data/types'
import { normalizePhotoPlacement } from './photoPlacement'

export interface PhotoPlacementGeometryInput {
  frameWidth: number
  frameHeight: number
  sourceWidth: number
  sourceHeight: number
}

export interface PhotoPlacementGeometry extends PhotoPlacementGeometryInput {
  coverScale: number
  baseWidth: number
  baseHeight: number
  renderedWidth: number
  renderedHeight: number
  panRangeX: number
  panRangeY: number
  translateX: number
  translateY: number
}

const PAN_EPSILON = 0.001

function positiveFinite(value: number) {
  return Number.isFinite(value) && value > 0
}

export function calculatePhotoPlacementGeometry(input: PhotoPlacementGeometryInput, placementInput: Partial<PhotoPlacement> = {}): PhotoPlacementGeometry | undefined {
  if (![input.frameWidth, input.frameHeight, input.sourceWidth, input.sourceHeight].every(positiveFinite)) return undefined
  const placement = normalizePhotoPlacement(placementInput)
  const coverScale = Math.max(input.frameWidth / input.sourceWidth, input.frameHeight / input.sourceHeight)
  const baseWidth = input.sourceWidth * coverScale
  const baseHeight = input.sourceHeight * coverScale
  const renderedWidth = baseWidth * placement.zoom
  const renderedHeight = baseHeight * placement.zoom
  const panRangeX = Math.abs(renderedWidth - input.frameWidth) / 2
  const panRangeY = Math.abs(renderedHeight - input.frameHeight) / 2
  return {
    ...input,
    coverScale,
    baseWidth,
    baseHeight,
    renderedWidth,
    renderedHeight,
    panRangeX,
    panRangeY,
    translateX: (placement.positionX - 0.5) * 2 * panRangeX,
    translateY: (placement.positionY - 0.5) * 2 * panRangeY,
  }
}

export function applyPointerDeltaToPlacement(startInput: Partial<PhotoPlacement>, deltaX: number, deltaY: number, geometry: Pick<PhotoPlacementGeometry, 'panRangeX' | 'panRangeY'>): PhotoPlacement {
  const start = normalizePhotoPlacement(startInput)
  return normalizePhotoPlacement({
    ...start,
    positionX: geometry.panRangeX > PAN_EPSILON ? start.positionX + deltaX / (2 * geometry.panRangeX) : start.positionX,
    positionY: geometry.panRangeY > PAN_EPSILON ? start.positionY + deltaY / (2 * geometry.panRangeY) : start.positionY,
  })
}

export function measurePhotoPlacementGeometry(frame: HTMLElement | null, image: HTMLImageElement | null, placement: Partial<PhotoPlacement>) {
  if (!frame || !image) return undefined
  const bounds = frame.getBoundingClientRect()
  return calculatePhotoPlacementGeometry({
    frameWidth: bounds.width,
    frameHeight: bounds.height,
    sourceWidth: image.naturalWidth,
    sourceHeight: image.naturalHeight,
  }, placement)
}
