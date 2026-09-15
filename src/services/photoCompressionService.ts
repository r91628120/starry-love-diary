export const PHOTO_MASTER_MAX_EDGE = 2048
export const PHOTO_THUMBNAIL_MAX_EDGE = 512

export interface CompressedPhotoVariant {
  blob: Blob
  mimeType: string
  width: number
  height: number
}

export interface CompressedPhoto {
  master: CompressedPhotoVariant
  thumbnail: CompressedPhotoVariant
}

export interface PhotoCompressionService {
  compress(file: File): Promise<CompressedPhoto>
}

export function calculateContainedDimensions(width: number, height: number, maximumEdge: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('Photo dimensions must be positive')
  if (!Number.isFinite(maximumEdge) || maximumEdge <= 0) throw new Error('Maximum edge must be positive')
  const scale = Math.min(1, maximumEdge / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

interface DecodedPhoto {
  width: number
  height: number
  draw(context: CanvasRenderingContext2D, width: number, height: number): void
  close(): void
}

async function decodePhoto(file: File): Promise<DecodedPhoto> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (context, width, height) => context.drawImage(bitmap, 0, 0, width, height),
      close: () => bitmap.close(),
    }
  }

  if (typeof document === 'undefined' || typeof Image === 'undefined') throw new Error('Photo decoding is unavailable')
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = objectUrl
    await image.decode()
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      draw: (context, width, height) => context.drawImage(image, 0, 0, width, height),
      close: () => URL.revokeObjectURL(objectUrl),
    }
  } catch (error) {
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Photo compression failed')), mimeType, quality)
  })
}

async function renderVariant(decoded: DecodedPhoto, maximumEdge: number, mimeType: string, quality: number): Promise<CompressedPhotoVariant> {
  const dimensions = calculateContainedDimensions(decoded.width, decoded.height, maximumEdge)
  const canvas = document.createElement('canvas')
  canvas.width = dimensions.width
  canvas.height = dimensions.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Photo compression canvas is unavailable')
  decoded.draw(context, dimensions.width, dimensions.height)
  const blob = await canvasToBlob(canvas, mimeType, quality)
  return { blob, mimeType: blob.type || mimeType, ...dimensions }
}

export class BrowserPhotoCompressionService implements PhotoCompressionService {
  async compress(file: File): Promise<CompressedPhoto> {
    if (!file.type.startsWith('image/')) throw new Error('Selected file is not an image')
    if (typeof document === 'undefined') throw new Error('Photo compression is unavailable')
    const decoded = await decodePhoto(file)
    try {
      // Canvas re-encoding intentionally strips EXIF/GPS metadata. The source file itself is never persisted.
      const outputMimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const master = await renderVariant(decoded, PHOTO_MASTER_MAX_EDGE, outputMimeType, 0.82)
      const thumbnail = await renderVariant(decoded, PHOTO_THUMBNAIL_MAX_EDGE, outputMimeType, 0.75)
      return { master, thumbnail }
    } finally {
      decoded.close()
    }
  }
}
