import type { PhotoRepository } from '../data/photo/PhotoRepository'

export type PhotoVariant = 'master' | 'thumbnail'

export class PhotoObjectUrlResolver {
  private currentUrl?: string

  constructor(private readonly repository: Pick<PhotoRepository, 'getRenderableMaster' | 'getRenderableThumbnail'>) {}

  async resolve(assetId: string, variant: PhotoVariant = 'thumbnail') {
    this.release()
    const blob = variant === 'master'
      ? await this.repository.getRenderableMaster(assetId)
      : await this.repository.getRenderableThumbnail(assetId)
    if (!blob) return undefined
    this.currentUrl = URL.createObjectURL(blob)
    return this.currentUrl
  }

  release() {
    if (!this.currentUrl) return
    URL.revokeObjectURL(this.currentUrl)
    this.currentUrl = undefined
  }
}
