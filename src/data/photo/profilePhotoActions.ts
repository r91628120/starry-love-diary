import type { ProfileKind } from '../types'
import type { ProfileRepository } from '../repositories/repositories'
import type { PhotoRepository } from './PhotoRepository'
import { PhotoInUseError } from './PhotoRepository'
import type { ProfilePhotoPlacementRepository } from './ProfilePhotoPlacementRepository'

async function removeAssetIfUnreferenced(photos: PhotoRepository, photoAssetId: string | undefined) {
  if (!photoAssetId) return
  try {
    await photos.deletePhoto(photoAssetId)
  } catch (error) {
    if (!(error instanceof PhotoInUseError)) throw error
  }
}

export async function replaceProfilePhoto(kind: ProfileKind, file: File, profiles: ProfileRepository, photos: PhotoRepository, placements?: ProfilePhotoPlacementRepository) {
  const existing = await profiles.getProfile(kind)
  const existingPlacement = await placements?.getSavedPlacement(kind)
  const imported = await photos.importPhoto(file, kind === 'user' ? 'profile' : 'partner')
  let profileUpdated = false
  try {
    const updated = await profiles.updateProfile(kind, { photoAssetId: imported.id })
    profileUpdated = true
    await placements?.resetPlacement(kind, imported.id)
    if (existing?.photoAssetId && existing.photoAssetId !== imported.id) {
      await removeAssetIfUnreferenced(photos, existing.photoAssetId).catch(() => undefined)
    }
    return updated
  } catch (error) {
    if (profileUpdated) {
      await profiles.updateProfile(kind, { photoAssetId: existing?.photoAssetId }).catch(() => undefined)
      if (placements) {
        if (existingPlacement) await placements.savePlacement(kind, existingPlacement.photoAssetId, existingPlacement.placement).catch(() => undefined)
        else await placements.clearPlacement(kind).catch(() => undefined)
      }
    }
    await removeAssetIfUnreferenced(photos, imported.id).catch(() => undefined)
    throw error
  }
}

export async function removeProfilePhoto(kind: ProfileKind, profiles: ProfileRepository, photos: PhotoRepository, placements?: ProfilePhotoPlacementRepository) {
  const existing = await profiles.getProfile(kind)
  const updated = await profiles.updateProfile(kind, { photoAssetId: undefined })
  try {
    await placements?.clearPlacement(kind)
  } catch (error) {
    await profiles.updateProfile(kind, { photoAssetId: existing?.photoAssetId }).catch(() => undefined)
    throw error
  }
  await removeAssetIfUnreferenced(photos, existing?.photoAssetId).catch(() => undefined)
  return updated
}
