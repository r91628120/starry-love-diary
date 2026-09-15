import type { PhotoPlacement } from '../data/types'

export const DEFAULT_PHOTO_PLACEMENT: PhotoPlacement = {
  positionX: 0.5,
  positionY: 0.5,
  zoom: 1,
}

export const MIN_PHOTO_ZOOM = 0.5
export const MAX_PHOTO_ZOOM = 4

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

export function normalizePhotoPlacement(input: Partial<PhotoPlacement> = {}): PhotoPlacement {
  return {
    positionX: clamp(finiteOr(input.positionX ?? DEFAULT_PHOTO_PLACEMENT.positionX, DEFAULT_PHOTO_PLACEMENT.positionX), 0, 1),
    positionY: clamp(finiteOr(input.positionY ?? DEFAULT_PHOTO_PLACEMENT.positionY, DEFAULT_PHOTO_PLACEMENT.positionY), 0, 1),
    zoom: clamp(finiteOr(input.zoom ?? DEFAULT_PHOTO_PLACEMENT.zoom, DEFAULT_PHOTO_PLACEMENT.zoom), MIN_PHOTO_ZOOM, MAX_PHOTO_ZOOM),
  }
}

export function photoObjectPosition(input: Partial<PhotoPlacement> = {}) {
  const placement = normalizePhotoPlacement(input)
  return `${placement.positionX * 100}% ${placement.positionY * 100}%`
}
