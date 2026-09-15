import type { PhotoAssetBlobRecord } from '../types'
import type { StorageAdapter } from '../storage/StorageAdapter'

export interface PhotoContentStore {
  write(assetId: string, master: Blob, thumbnail: Blob): Promise<void>
  readMaster(assetId: string): Promise<Blob | undefined>
  readThumbnail(assetId: string): Promise<Blob | undefined>
  delete(assetId: string): Promise<void>
}

export class IndexedDbPhotoContentStore implements PhotoContentStore {
  constructor(private readonly storage: StorageAdapter) {}

  async write(assetId: string, master: Blob, thumbnail: Blob) {
    const record: PhotoAssetBlobRecord = { id: assetId, master, thumbnail }
    await this.storage.put('photoAssetBlobs', record)
  }

  async readMaster(assetId: string) {
    return (await this.storage.get<PhotoAssetBlobRecord>('photoAssetBlobs', assetId))?.master
  }

  async readThumbnail(assetId: string) {
    return (await this.storage.get<PhotoAssetBlobRecord>('photoAssetBlobs', assetId))?.thumbnail
  }

  delete(assetId: string) {
    return this.storage.delete('photoAssetBlobs', assetId)
  }
}
