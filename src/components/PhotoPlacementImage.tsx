import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { PhotoPlacement } from '../data/types'
import { photoObjectPosition } from '../services/photoPlacement'
import { calculatePhotoPlacementGeometry, type PhotoPlacementGeometryInput } from '../services/photoPlacementGeometry'

interface Measurement extends PhotoPlacementGeometryInput { src: string }

export function PhotoPlacementImage({ src, alt, placement, className = '' }: { src: string; alt: string; placement: PhotoPlacement; className?: string }) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [measurement, setMeasurement] = useState<Measurement>()
  const measure = useCallback(() => {
    const image = imageRef.current
    const frame = image?.parentElement
    if (!image || !frame || image.naturalWidth <= 0 || image.naturalHeight <= 0) return
    const bounds = frame.getBoundingClientRect()
    if (bounds.width <= 0 || bounds.height <= 0) return
    const next = { src, frameWidth: bounds.width, frameHeight: bounds.height, sourceWidth: image.naturalWidth, sourceHeight: image.naturalHeight }
    setMeasurement((current) => current?.src === next.src && current.frameWidth === next.frameWidth && current.frameHeight === next.frameHeight && current.sourceWidth === next.sourceWidth && current.sourceHeight === next.sourceHeight ? current : next)
  }, [src])

  useEffect(() => {
    const frame = imageRef.current?.parentElement
    if (!frame || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [measure])

  const geometry = useMemo(() => measurement?.src === src ? calculatePhotoPlacementGeometry(measurement, placement) : undefined, [measurement, placement, src])
  const style: CSSProperties = geometry ? {
    position: 'absolute',
    left: `calc(50% + ${geometry.translateX}px)`,
    top: `calc(50% + ${geometry.translateY}px)`,
    width: `${geometry.renderedWidth}px`,
    height: `${geometry.renderedHeight}px`,
    maxWidth: 'none',
    transform: 'translate(-50%, -50%)',
    transformOrigin: 'center',
    objectFit: 'fill',
  } : {
    objectPosition: photoObjectPosition(placement),
    transform: `scale(${placement.zoom})`,
    transformOrigin: photoObjectPosition(placement),
  }

  return <img ref={imageRef} className={className} src={src} alt={alt} style={style} onLoad={measure} data-position-x={placement.positionX} data-position-y={placement.positionY} data-zoom={placement.zoom} data-translate-x={geometry?.translateX} data-translate-y={geometry?.translateY} />
}
