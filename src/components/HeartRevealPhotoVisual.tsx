import type { PhotoPlacement } from '../data/types'
import { PhotoPlacementImage } from './PhotoPlacementImage'

export function HeartRevealPhotoVisual({ photoUrl, placeholderSrc, placement, alt, className = '' }: { photoUrl?: string; placeholderSrc: string; placement: PhotoPlacement; alt: string; className?: string }) {
  return <div className={`heart-reveal-photo-visual ${className}`.trim()}>
    <div className="heart-reveal-photo-visual__crop">
      {photoUrl
        ? <PhotoPlacementImage src={photoUrl} alt={alt} placement={placement} className="heart-reveal-photo-visual__photo heart-reveal-photo-visual__photo--real" />
        : <img src={placeholderSrc} alt={alt} className="heart-reveal-photo-visual__photo heart-reveal-photo-visual__photo--placeholder" />}
    </div>
  </div>
}
