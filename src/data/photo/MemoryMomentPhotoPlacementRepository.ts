import { DEFAULT_PHOTO_PLACEMENT, normalizePhotoPlacement } from '../../services/photoPlacement'
import type { StorageAdapter } from '../storage/StorageAdapter'
import type { PhotoLayout, PhotoPlacement } from '../types'

const layoutId = (momentId: string) => `memory-moment:${momentId}`

export interface MemoryMomentPhotoPlacementRepository {
  getPlacement(momentId: string, photoAssetId?: string | null): Promise<PhotoPlacement>
  getSavedPlacement(momentId: string): Promise<{ photoAssetId: string; placement: PhotoPlacement } | undefined>
  savePlacement(momentId: string, photoAssetId: string, placement: Partial<PhotoPlacement>): Promise<PhotoPlacement>
  resetPlacement(momentId: string, photoAssetId: string): Promise<PhotoPlacement>
  clearPlacement(momentId: string): Promise<void>
}

export class LocalMemoryMomentPhotoPlacementRepository implements MemoryMomentPhotoPlacementRepository {
  constructor(private readonly storage: StorageAdapter, private readonly now: () => string = () => new Date().toISOString()) {}

  async getSavedPlacement(momentId: string) {
    const record = await this.storage.get<PhotoLayout>('photoLayouts', layoutId(momentId))
    const slot = record?.slots[0]
    return slot ? { photoAssetId: slot.photoAssetId, placement: normalizePhotoPlacement(slot.placement) } : undefined
  }

  async getPlacement(momentId: string, photoAssetId?: string | null) {
    if (!photoAssetId) return { ...DEFAULT_PHOTO_PLACEMENT }
    const saved = await this.getSavedPlacement(momentId)
    return saved?.photoAssetId === photoAssetId ? saved.placement : { ...DEFAULT_PHOTO_PLACEMENT }
  }

  async savePlacement(momentId: string, photoAssetId: string, placement: Partial<PhotoPlacement>) {
    const previous = await this.storage.get<PhotoLayout>('photoLayouts', layoutId(momentId))
    const timestamp = this.now()
    const normalized = normalizePhotoPlacement(placement)
    await this.storage.put('photoLayouts', {
      id: layoutId(momentId),
      layoutType: 'memory_moment_photo',
      photoCount: 1,
      slots: [{ id: `memory-moment-slot:${momentId}`, photoAssetId, placement: normalized }],
      isActive: true,
      createdAt: previous?.createdAt ?? timestamp,
      updatedAt: timestamp,
    } satisfies PhotoLayout)
    return normalized
  }

  resetPlacement(momentId: string, photoAssetId: string) { return this.savePlacement(momentId, photoAssetId, DEFAULT_PHOTO_PLACEMENT) }
  clearPlacement(momentId: string) { return this.storage.delete('photoLayouts', layoutId(momentId)) }
}
