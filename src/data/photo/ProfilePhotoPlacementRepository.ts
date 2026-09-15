import { DEFAULT_PHOTO_PLACEMENT, normalizePhotoPlacement } from '../../services/photoPlacement'
import type { StorageAdapter } from '../storage/StorageAdapter'
import type { PhotoLayout, PhotoPlacement, ProfileKind } from '../types'

const profilePlacementId = (kind: ProfileKind) => `profile-photo-placement-${kind}`

export interface ProfilePhotoPlacementRepository {
  getPlacement(kind: ProfileKind, photoAssetId?: string): Promise<PhotoPlacement>
  getSavedPlacement(kind: ProfileKind): Promise<{ photoAssetId: string; placement: PhotoPlacement } | undefined>
  savePlacement(kind: ProfileKind, photoAssetId: string, placement: Partial<PhotoPlacement>): Promise<PhotoPlacement>
  resetPlacement(kind: ProfileKind, photoAssetId: string): Promise<PhotoPlacement>
  clearPlacement(kind: ProfileKind): Promise<void>
}

export class LocalProfilePhotoPlacementRepository implements ProfilePhotoPlacementRepository {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async getSavedPlacement(kind: ProfileKind) {
    const record = await this.storage.get<PhotoLayout>('photoLayouts', profilePlacementId(kind))
    const slot = record?.slots[0]
    if (!slot) return undefined
    return { photoAssetId: slot.photoAssetId, placement: normalizePhotoPlacement(slot.placement) }
  }

  async getPlacement(kind: ProfileKind, photoAssetId?: string) {
    if (!photoAssetId) return { ...DEFAULT_PHOTO_PLACEMENT }
    const saved = await this.getSavedPlacement(kind)
    return saved?.photoAssetId === photoAssetId ? saved.placement : { ...DEFAULT_PHOTO_PLACEMENT }
  }

  async savePlacement(kind: ProfileKind, photoAssetId: string, placement: Partial<PhotoPlacement>) {
    const previous = await this.storage.get<PhotoLayout>('photoLayouts', profilePlacementId(kind))
    const timestamp = this.now()
    const normalized = normalizePhotoPlacement(placement)
    await this.storage.put('photoLayouts', {
      id: profilePlacementId(kind),
      layoutType: 'profile_photo',
      photoCount: 1,
      slots: [{ id: `profile-photo-slot-${kind}`, photoAssetId, placement: normalized }],
      isActive: true,
      createdAt: previous?.createdAt ?? timestamp,
      updatedAt: timestamp,
    } satisfies PhotoLayout)
    return normalized
  }

  resetPlacement(kind: ProfileKind, photoAssetId: string) {
    return this.savePlacement(kind, photoAssetId, DEFAULT_PHOTO_PLACEMENT)
  }

  clearPlacement(kind: ProfileKind) {
    return this.storage.delete('photoLayouts', profilePlacementId(kind))
  }
}
