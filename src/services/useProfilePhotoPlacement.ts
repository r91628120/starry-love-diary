import { useEffect, useState } from 'react'
import type { ProfilePhotoPlacementRepository } from '../data/photo/ProfilePhotoPlacementRepository'
import type { PhotoPlacement, ProfileKind } from '../data/types'
import { DEFAULT_PHOTO_PLACEMENT } from './photoPlacement'

export function useProfilePhotoPlacement(repository: ProfilePhotoPlacementRepository | undefined, kind: ProfileKind, photoAssetId?: string) {
  const [placement, setPlacement] = useState<PhotoPlacement>({ ...DEFAULT_PHOTO_PLACEMENT })

  useEffect(() => {
    let active = true
    setPlacement({ ...DEFAULT_PHOTO_PLACEMENT })
    if (repository && photoAssetId) void repository.getPlacement(kind, photoAssetId).then((saved) => {
      if (active) setPlacement(saved)
    })
    return () => { active = false }
  }, [kind, photoAssetId, repository])

  return [placement, setPlacement] as const
}
