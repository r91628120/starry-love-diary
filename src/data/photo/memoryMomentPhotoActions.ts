import type { MemoryMomentRepository } from '../repositories/repositories'
import type { MemoryMoment } from '../types'
import { PhotoInUseError, type PhotoRepository } from './PhotoRepository'
import type { MemoryMomentPhotoPlacementRepository } from './MemoryMomentPhotoPlacementRepository'

async function cleanup(photos: PhotoRepository, assetId?: string | null) {
  if (!assetId) return
  try { await photos.deletePhoto(assetId) } catch (error) { if (!(error instanceof PhotoInUseError)) throw error }
}

export async function replaceMemoryMomentPhoto(momentId: string, file: File, moments: MemoryMomentRepository, photos: PhotoRepository, placements: MemoryMomentPhotoPlacementRepository) {
  const existing = await moments.getMemoryMoment(momentId)
  if (!existing) throw new Error('Memory moment not found')
  const previousPlacement = await placements.getSavedPlacement(momentId)
  const imported = await photos.importPhoto(file, 'moment')
  let updated = false
  try {
    const result = await moments.updateMemoryMoment(momentId, { photoAssetId: imported.id })
    updated = true
    await placements.resetPlacement(momentId, imported.id)
    await cleanup(photos, existing.photoAssetId).catch(() => undefined)
    return result
  } catch (error) {
    if (updated) {
      await moments.updateMemoryMoment(momentId, { photoAssetId: existing.photoAssetId ?? null }).catch(() => undefined)
      if (previousPlacement) await placements.savePlacement(momentId, previousPlacement.photoAssetId, previousPlacement.placement).catch(() => undefined)
      else await placements.clearPlacement(momentId).catch(() => undefined)
    }
    await cleanup(photos, imported.id).catch(() => undefined)
    throw error
  }
}

export async function removeMemoryMomentPhoto(momentId: string, moments: MemoryMomentRepository, photos: PhotoRepository, placements: MemoryMomentPhotoPlacementRepository) {
  const existing = await moments.getMemoryMoment(momentId)
  if (!existing) throw new Error('Memory moment not found')
  const previousPlacement = await placements.getSavedPlacement(momentId)
  const result = await moments.updateMemoryMoment(momentId, { photoAssetId: null })
  try { await placements.clearPlacement(momentId) }
  catch (error) {
    await moments.updateMemoryMoment(momentId, { photoAssetId: existing.photoAssetId ?? null }).catch(() => undefined)
    if (previousPlacement) await placements.savePlacement(momentId, previousPlacement.photoAssetId, previousPlacement.placement).catch(() => undefined)
    throw error
  }
  await cleanup(photos, existing.photoAssetId).catch(() => undefined)
  return result
}

export async function deleteMemoryMomentWithPhoto(momentId: string, moments: MemoryMomentRepository, photos: PhotoRepository, placements: MemoryMomentPhotoPlacementRepository) {
  const existing: MemoryMoment | undefined = await moments.getMemoryMoment(momentId)
  const previousPlacement = await placements.getSavedPlacement(momentId)
  await placements.clearPlacement(momentId)
  try { await moments.deleteMemoryMoment(momentId) }
  catch (error) {
    if (previousPlacement) await placements.savePlacement(momentId, previousPlacement.photoAssetId, previousPlacement.placement).catch(() => undefined)
    throw error
  }
  await cleanup(photos, existing?.photoAssetId).catch(() => undefined)
}
