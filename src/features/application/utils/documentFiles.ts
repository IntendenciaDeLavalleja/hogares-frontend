import { optimizeImage } from './optimizeImage'

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
let pendingPreparation: Promise<void> = Promise.resolve()
const extensions: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif', pdf: 'application/pdf' }

export async function normalizeDocumentFile(file: File): Promise<File> {
  if (!file.size) throw new Error('El archivo está vacío. Seleccioná otra copia del documento.')
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const text = new TextDecoder('ascii').decode(header)
  let type = file.type.toLowerCase().split(';')[0]
  if (text.startsWith('%PDF-')) type = 'application/pdf'
  else if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) type = 'image/jpeg'
  else if (header[0] === 0x89 && text.slice(1, 4) === 'PNG') type = 'image/png'
  else if (text.startsWith('RIFF') && text.slice(8, 12) === 'WEBP') type = 'image/webp'
  else if (text.slice(4, 8) === 'ftyp' && /^(heic|heix|hevc|hevx|mif1|msf1|heif)$/.test(text.slice(8, 12))) type = 'image/heic'
  else if (['', 'application/octet-stream', 'binary/octet-stream'].includes(type)) type = extensions[file.name.split('.').at(-1)?.toLowerCase() ?? ''] ?? type
  if (type === 'image/jpg' || type === 'image/pjpeg') type = 'image/jpeg'
  if (!imageTypes.has(type) && type !== 'application/pdf') throw new Error('Formato no permitido. Seleccioná JPG, PNG, WebP, HEIC/HEIF o PDF.')
  if (file.size > (type === 'application/pdf' ? 10 : 30) * 1024 * 1024) throw new Error(type === 'application/pdf' ? 'El PDF supera el máximo permitido de 10 MB.' : 'La imagen supera el máximo permitido de 30 MB.')
  return file.type === type ? file : new File([file], file.name, { type, lastModified: file.lastModified })
}

export async function prepareDocumentFile(file: File, optimize = true): Promise<File> {
  const previous = pendingPreparation
  let release = () => {}
  pendingPreparation = new Promise<void>((resolve) => { release = resolve })
  await previous
  try {
    const normalized = await normalizeDocumentFile(file)
    return normalized.type === 'application/pdf' || !optimize ? normalized : (await optimizeImage(normalized)).file
  } finally { release() }
}
