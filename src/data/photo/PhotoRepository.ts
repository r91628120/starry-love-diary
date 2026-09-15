import type { PhotoCompressionService } from '../../services/photoCompressionService'
import type { DiaryPhoto, HeartRevealProject, MemoryMoment, PhotoAsset, PhotoCategory, PhotoLayout, Profile } from '../types'
import type { StorageAdapter } from '../storage/StorageAdapter'
import type { PhotoContentStore } from './PhotoContentStore'

export type PhotoReferenceType = 'profile' | 'diary' | 'memory_moment' | 'important_date' | 'photo_layout' | 'heart_reveal_project'

export interface PhotoReference {
  type: PhotoReferenceType
  recordId: string
  slotId?: string
}

export class PhotoInUseError extends Error {
  readonly code = 'photo_in_use'
  constructor(readonly references: PhotoReference[]) {
    super('Photo is still referenced')
    this.name = 'PhotoInUseError'
  }
}

export interface PhotoRepository {
  importPhoto(file: File, category: PhotoCategory): Promise<PhotoAsset>
  getPhotoAsset(id: string): Promise<PhotoAsset | undefined>
  listPhotoAssets(category?: PhotoCategory): Promise<PhotoAsset[]>
  getRenderableMaster(id: string): Promise<Blob | undefined>
  getRenderableThumbnail(id: string): Promise<Blob | undefined>
  getReferences(id: string): Promise<PhotoReference[]>
  deletePhoto(id: string): Promise<void>
  cleanupOrphans(): Promise<string[]>
}

interface PhotoRepositoryOptions {
  createId?: () => string
  now?: () => string
}

interface OptionalPhotoReferenceRecord { id: string; photoAssetId?: string | null }

export class LocalPhotoRepository implements PhotoRepository {
  private readonly createId: () => string
  private readonly now: () => string

  constructor(
    private readonly storage: StorageAdapter,
    private readonly content: PhotoContentStore,
    private readonly compression: PhotoCompressionService,
    options: PhotoRepositoryOptions = {},
  ) {
    this.createId = options.createId ?? (() => `photo-${crypto.randomUUID()}`)
    this.now = options.now ?? (() => new Date().toISOString())
  }

  async importPhoto(file: File, category: PhotoCategory) {
    const compressed = await this.compression.compress(file)
    const assetId = this.createId()
    const timestamp = this.now()
    const asset: PhotoAsset = {
      id: assetId,
      category,
      storageKind: 'indexeddb_blob',
      localUri: `indexeddb-photo://${assetId}/master`,
      thumbnailUri: `indexeddb-photo://${assetId}/thumbnail`,
      mimeType: compressed.master.mimeType,
      width: compressed.master.width,
      height: compressed.master.height,
      fileSizeBytes: compressed.master.blob.size,
      thumbnailMimeType: compressed.thumbnail.mimeType,
      thumbnailWidth: compressed.thumbnail.width,
      thumbnailHeight: compressed.thumbnail.height,
      thumbnailFileSizeBytes: compressed.thumbnail.blob.size,
      sourceCreatedAt: file.lastModified > 0 ? new Date(file.lastModified).toISOString() : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    await this.content.write(assetId, compressed.master.blob, compressed.thumbnail.blob)
    try {
      await this.storage.put('photoAssets', asset)
      return asset
    } catch (error) {
      await this.content.delete(assetId).catch(() => undefined)
      throw error
    }
  }

  getPhotoAsset(id: string) {
    return this.storage.get<PhotoAsset>('photoAssets', id)
  }

  async listPhotoAssets(category?: PhotoCategory) {
    const assets = await this.storage.getAll<PhotoAsset>('photoAssets')
    return assets
      .filter((asset) => !category || asset.category === category)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))
  }

  async getRenderableMaster(id: string) {
    if (!await this.getPhotoAsset(id)) return undefined
    return this.content.readMaster(id)
  }

  async getRenderableThumbnail(id: string) {
    if (!await this.getPhotoAsset(id)) return undefined
    return this.content.readThumbnail(id)
  }

  async getReferences(id: string) {
    const [profiles, diaryPhotos, moments, importantDates, layouts, revealProjects] = await Promise.all([
      this.storage.getAll<Profile>('profiles'),
      this.storage.getAll<DiaryPhoto>('diaryPhotos'),
      this.storage.getAll<MemoryMoment>('memoryMoments'),
      this.storage.getAll<OptionalPhotoReferenceRecord>('importantDates'),
      this.storage.getAll<PhotoLayout>('photoLayouts'),
      this.storage.getAll<HeartRevealProject>('heartRevealProjects'),
    ])
    const references: PhotoReference[] = []
    for (const profile of profiles) if (profile.photoAssetId === id) references.push({ type: 'profile', recordId: profile.id })
    for (const diaryPhoto of diaryPhotos) if (diaryPhoto.photoAssetId === id) references.push({ type: 'diary', recordId: diaryPhoto.id })
    for (const moment of moments) if (moment.photoAssetId === id) references.push({ type: 'memory_moment', recordId: moment.id })
    for (const date of importantDates) if (date.photoAssetId === id) references.push({ type: 'important_date', recordId: date.id })
    for (const layout of layouts) {
      for (const slot of layout.slots) if (slot.photoAssetId === id) references.push({ type: 'photo_layout', recordId: layout.id, slotId: slot.id })
    }
    for (const project of revealProjects) if (project.photoAssetId === id) references.push({ type: 'heart_reveal_project', recordId: project.id })
    return references
  }

  async deletePhoto(id: string) {
    const asset = await this.getPhotoAsset(id)
    if (!asset) return
    const references = await this.getReferences(id)
    if (references.length) throw new PhotoInUseError(references)

    const master = await this.content.readMaster(id)
    const thumbnail = await this.content.readThumbnail(id)
    await this.content.delete(id)
    try {
      await this.storage.delete('photoAssets', id)
    } catch (error) {
      if (master && thumbnail) await this.content.write(id, master, thumbnail).catch(() => undefined)
      throw error
    }
  }

  async cleanupOrphans() {
    const removed: string[] = []
    for (const asset of await this.listPhotoAssets()) {
      // A gallery asset is itself a retained Memory Wall library item even when it is not in the active layout.
      if (asset.category === 'gallery') continue
      if ((await this.getReferences(asset.id)).length > 0) continue
      await this.deletePhoto(asset.id)
      removed.push(asset.id)
    }
    return removed
  }
}
