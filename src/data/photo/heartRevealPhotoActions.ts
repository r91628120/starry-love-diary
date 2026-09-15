import type { HeartRevealProject } from '../types'
import type { HeartRevealPhotoRepository } from './HeartRevealPhotoRepository'
import { PhotoInUseError, type PhotoRepository } from './PhotoRepository'

async function deleteIfUnreferenced(photos: PhotoRepository, photoAssetId?: string) {
  if (!photoAssetId) return
  try {
    await photos.deletePhoto(photoAssetId)
  } catch (error) {
    if (!(error instanceof PhotoInUseError)) throw error
  }
}

export async function replaceHeartRevealPhoto(file: File, projects: HeartRevealPhotoRepository, photos: PhotoRepository): Promise<HeartRevealProject> {
  const previous = await projects.getActiveProject()
  const imported = await photos.importPhoto(file, 'heart_reveal')
  try {
    const project = await projects.setActivePhoto(imported.id)
    if (previous?.photoAssetId && previous.photoAssetId !== imported.id) {
      await deleteIfUnreferenced(photos, previous.photoAssetId).catch(() => undefined)
    }
    return project
  } catch (error) {
    await deleteIfUnreferenced(photos, imported.id).catch(() => undefined)
    throw error
  }
}

export async function removeHeartRevealPhoto(projects: HeartRevealPhotoRepository, photos: PhotoRepository) {
  const previous = await projects.getActiveProject()
  await projects.clearActivePhoto()
  await deleteIfUnreferenced(photos, previous?.photoAssetId).catch(() => undefined)
}
