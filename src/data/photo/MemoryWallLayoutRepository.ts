import { DEFAULT_PHOTO_PLACEMENT, normalizePhotoPlacement } from '../../services/photoPlacement'
import type { PhotoLayout, PhotoLayoutSlot, PhotoPlacement } from '../types'
import type { StorageAdapter } from '../storage/StorageAdapter'
import type { PhotoRepository } from './PhotoRepository'

export const ACTIVE_MEMORY_WALL_ID = 'memory-wall-active'
export const MAX_MEMORY_WALL_PHOTOS = 6

export type MemoryWallLayoutType = 'single' | 'split' | 'feature_two' | 'grid_four' | 'feature_four' | 'grid_six'

export interface MemoryWallSlotInput {
  id?: string
  photoAssetId: string
  placement?: Partial<PhotoPlacement>
}

export class MemoryWallValidationError extends Error {
  constructor(readonly code: 'photo_count' | 'duplicate_photo' | 'gallery_photo_required') {
    super(code)
    this.name = 'MemoryWallValidationError'
  }
}

export function memoryWallLayoutType(photoCount: number): MemoryWallLayoutType {
  const types: Record<number, MemoryWallLayoutType> = {
    1: 'single',
    2: 'split',
    3: 'feature_two',
    4: 'grid_four',
    5: 'feature_four',
    6: 'grid_six',
  }
  const type = types[photoCount]
  if (!type) throw new MemoryWallValidationError('photo_count')
  return type
}

export interface MemoryWallLayoutRepository {
  getActiveLayout(): Promise<PhotoLayout | undefined>
  saveActiveLayout(slots: MemoryWallSlotInput[]): Promise<PhotoLayout>
}

export class LocalMemoryWallLayoutRepository implements MemoryWallLayoutRepository {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly photos: Pick<PhotoRepository, 'getPhotoAsset'>,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  getActiveLayout() {
    return this.storage.get<PhotoLayout>('photoLayouts', ACTIVE_MEMORY_WALL_ID)
  }

  async saveActiveLayout(inputs: MemoryWallSlotInput[]) {
    if (inputs.length < 1 || inputs.length > MAX_MEMORY_WALL_PHOTOS) throw new MemoryWallValidationError('photo_count')
    const photoIds = inputs.map((slot) => slot.photoAssetId)
    if (new Set(photoIds).size !== photoIds.length) throw new MemoryWallValidationError('duplicate_photo')

    for (const photoId of photoIds) {
      const asset = await this.photos.getPhotoAsset(photoId)
      if (!asset || asset.category !== 'gallery') throw new MemoryWallValidationError('gallery_photo_required')
    }

    const previous = await this.getActiveLayout()
    const timestamp = this.now()
    const slots: PhotoLayoutSlot[] = inputs.map((input, index) => ({
      id: input.id ?? `memory-wall-slot-${index + 1}`,
      photoAssetId: input.photoAssetId,
      placement: normalizePhotoPlacement(input.placement ?? DEFAULT_PHOTO_PLACEMENT),
    }))
    const layout: PhotoLayout = {
      id: ACTIVE_MEMORY_WALL_ID,
      layoutType: memoryWallLayoutType(slots.length),
      photoCount: slots.length,
      slots,
      isActive: true,
      createdAt: previous?.createdAt ?? timestamp,
      updatedAt: timestamp,
    }
    await this.storage.put('photoLayouts', layout)
    return layout
  }
}
