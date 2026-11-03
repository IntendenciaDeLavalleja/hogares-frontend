export const ACCEPTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type AcceptedImageMimeType = (typeof ACCEPTED_IMAGE_MIME_TYPES)[number]

export const MAX_ORIGINAL_SIZE_BYTES = 30 * 1024 * 1024
export const MAX_FINAL_SIZE_BYTES = 5 * 1024 * 1024
export const MAX_LONG_SIDE_PX = 1920
export const INITIAL_WEBP_QUALITY = 0.8
export const MIN_WEBP_QUALITY = 0.5
export const QUALITY_STEP = 0.1

export interface OptimizeImageResult {
  file: File
  originalSize: number
  optimizedSize: number
  originalType: string
  optimizedType: string
  width: number
  height: number
  wasOptimized: boolean
  quality?: number
}

export type OptimizeImageReason = 'invalid_type' | 'too_large_original' | 'decode_failed' | 'invalid_dimensions' | 'final_too_large' | 'canvas_blob_null'

export class OptimizeImageError extends Error {
  readonly reason: OptimizeImageReason

  constructor(reason: OptimizeImageReason, message: string) {
    super(message)
    this.name = 'OptimizeImageError'
    this.reason = reason
  }
}

interface DecodedImage {
  source: ImageBitmap | HTMLImageElement
  width: number
  height: number
  cleanup: () => void
}

function isAcceptedMime(type: string): type is AcceptedImageMimeType {
  return (ACCEPTED_IMAGE_MIME_TYPES as readonly string[]).includes(type)
}

function optimizedFileName(originalName: string): string {
  const base = originalName.slice(0, originalName.lastIndexOf('.') > 0 ? originalName.lastIndexOf('.') : originalName.length).replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 80) || 'imagen'
  return `${base}.webp`
}

async function decodeWithBitmap(file: File): Promise<DecodedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close() }
}

function decodeWithImageElement(file: File): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    const fail = () => { URL.revokeObjectURL(url); reject(new OptimizeImageError('decode_failed', 'El archivo está dañado o no es una imagen válida.')) }
    image.onerror = fail
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) { fail(); return }
      resolve({ source: image, width: image.naturalWidth, height: image.naturalHeight, cleanup: () => URL.revokeObjectURL(url) })
    }
    image.src = url
  })
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try { return await decodeWithBitmap(file) } catch { /* Fallback for browsers without bitmap image decoding. */ }
  }
  return decodeWithImageElement(file)
}

function targetSize(width: number, height: number): { width: number; height: number } {
  const longSide = Math.max(width, height)
  if (longSide <= MAX_LONG_SIDE_PX) return { width, height }
  const ratio = MAX_LONG_SIDE_PX / longSide
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
}

export async function optimizeImage(file: File): Promise<OptimizeImageResult> {
  if (!(file instanceof File) || !isAcceptedMime(file.type)) throw new OptimizeImageError('invalid_type', 'El formato de imagen no está permitido. Usá JPG, PNG o WebP.')
  if (file.size > MAX_ORIGINAL_SIZE_BYTES) throw new OptimizeImageError('too_large_original', 'La imagen supera el máximo permitido de 30 MB.')

  const decoded = await decodeImage(file)
  try {
    if (decoded.width < 1 || decoded.height < 1) throw new OptimizeImageError('invalid_dimensions', 'No pudimos procesar esta imagen. Probá seleccionando otra.')
    const size = targetSize(decoded.width, decoded.height)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d')
    if (!context) throw new OptimizeImageError('decode_failed', 'No pudimos procesar esta imagen. Probá seleccionando otra.')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(decoded.source, 0, 0, size.width, size.height)

    let quality = INITIAL_WEBP_QUALITY
    let blob: Blob | null = null
    while (quality >= MIN_WEBP_QUALITY - 0.001) {
      blob = await canvasToBlob(canvas, quality)
      if (blob && blob.size <= MAX_FINAL_SIZE_BYTES) break
      quality -= QUALITY_STEP
    }
    if (!blob) {
      if (file.size <= MAX_FINAL_SIZE_BYTES) return { file, originalSize: file.size, optimizedSize: file.size, originalType: file.type, optimizedType: file.type, width: decoded.width, height: decoded.height, wasOptimized: false }
      throw new OptimizeImageError('canvas_blob_null', 'No pudimos procesar esta imagen. Probá seleccionando otra.')
    }

    if (file.size <= MAX_FINAL_SIZE_BYTES && blob.size >= file.size) {
      return { file, originalSize: file.size, optimizedSize: file.size, originalType: file.type, optimizedType: file.type, width: decoded.width, height: decoded.height, wasOptimized: false }
    }
    if (blob.size > MAX_FINAL_SIZE_BYTES) throw new OptimizeImageError('final_too_large', 'La imagen sigue siendo demasiado pesada después de optimizarla.')
    const result = new File([blob], optimizedFileName(file.name), { type: 'image/webp', lastModified: file.lastModified })
    return { file: result, originalSize: file.size, optimizedSize: blob.size, originalType: file.type, optimizedType: 'image/webp', width: size.width, height: size.height, wasOptimized: true, quality: Math.round(quality * 100) / 100 }
  } finally {
    decoded.cleanup()
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace(/\.0$/, '')} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`
}
