import { useEffect, useState } from 'react'
import type { PhotoRepository } from '../data/photo/PhotoRepository'
import { PhotoObjectUrlResolver, type PhotoVariant } from './photoObjectUrl'

export function usePhotoObjectUrl(repository: Pick<PhotoRepository, 'getRenderableMaster' | 'getRenderableThumbnail'> | undefined, assetId: string | null | undefined, variant: PhotoVariant = 'thumbnail') {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (!repository || !assetId) {
      setUrl(undefined)
      return
    }
    const resolver = new PhotoObjectUrlResolver(repository)
    let active = true
    void resolver.resolve(assetId, variant).then((nextUrl) => {
      if (active) setUrl(nextUrl)
      else resolver.release()
    }).catch(() => { if (active) setUrl(undefined) })
    return () => {
      active = false
      resolver.release()
    }
  }, [assetId, repository, variant])

  return url
}
