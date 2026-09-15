import type { PhotoAsset } from '../types'
import type { PhotoRepository } from './PhotoRepository'

export const MAX_GALLERY_PHOTOS = 60

export class GalleryCapacityError extends Error {
  readonly code = 'gallery_capacity_exceeded'

  constructor(readonly remainingCapacity: number) {
    super('Memory Wall photo library capacity exceeded')
    this.name = 'GalleryCapacityError'
  }
}

export async function importGalleryPhotos(repository: PhotoRepository, files: File[]): Promise<PhotoAsset[]> {
  if (files.length === 0) return []
  const current = await repository.listPhotoAssets('gallery')
  const remainingCapacity = Math.max(0, MAX_GALLERY_PHOTOS - current.length)
  if (files.length > remainingCapacity) throw new GalleryCapacityError(remainingCapacity)

  const imported: PhotoAsset[] = []
  try {
    for (const file of files) imported.push(await repository.importPhoto(file, 'gallery'))
    return imported
  } catch (error) {
    await Promise.allSettled(imported.map((asset) => repository.deletePhoto(asset.id)))
    throw error
  }
}
