import type { PhotoPlacement } from '../data/types'
import { PhotoPlacementImage } from './PhotoPlacementImage'

export function ProfilePhotoVisual({ photoUrl, placeholderSrc, frameSrc, placement, alt, className = '', photoClassName = '' }: { photoUrl?: string; placeholderSrc: string; frameSrc: string; placement: PhotoPlacement; alt: string; className?: string; photoClassName?: string }) {
  return <div className={`profile-photo-visual ${className}`.trim()}>
    <span className="profile-photo-visual__crop">
      {photoUrl ? <PhotoPlacementImage className={`profile-photo-visual__photo profile-photo-visual__photo--real ${photoClassName}`.trim()} src={photoUrl} alt={alt} placement={placement} /> : <img className={`profile-photo-visual__photo ${photoClassName}`.trim()} src={placeholderSrc} alt={alt} />}
    </span>
    <img className="profile-photo-visual__frame" src={frameSrc} alt="" aria-hidden="true" />
  </div>
}
