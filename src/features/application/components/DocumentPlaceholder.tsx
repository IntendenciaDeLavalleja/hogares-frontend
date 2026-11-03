import { useEffect, useEffectEvent, useRef, useState, type ChangeEvent } from 'react'
import { ApiError, uploadApplicationDocument } from '../../../api/applications'
import { useApplicationStore } from '../../../store/applicationStore'
import type { DocumentMetadata, DocumentType } from '../types/application'
import { useOptimizedImage } from '../hooks/useOptimizedImage'
import { ensureApplicationDraft } from '../services/applicationDraft'
import { ACCEPTED_IMAGE_MIME_TYPES, formatBytes } from '../utils/optimizeImage'
import { removePreparedDocumentFile, setPreparedDocumentFile } from '../utils/preparedFiles'

const isImage = (type: string): boolean => (ACCEPTED_IMAGE_MIME_TYPES as readonly string[]).includes(type)

export function DocumentPlaceholder({ type, label, description, required }: { type: DocumentType; label: string; description: string; required: boolean }) {
  const document = useApplicationStore((state) => state.application.documents.find((item) => item.type === type))
  const updateApplication = useApplicationStore((state) => state.updateApplication)
  const setBackendDraft = useApplicationStore((state) => state.setBackendDraft)
  const { isOptimizing, error: optimizationError, result, setOriginalFile, reset, statusMessage } = useOptimizedImage()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const processingKey = useRef<string | null>(null)

  function setMetadata(metadata: DocumentMetadata | null) {
    const others = useApplicationStore.getState().application.documents.filter((item) => item.type !== type)
    updateApplication({ documents: metadata ? [...others, metadata] : others })
  }

  async function upload(file: File, localMetadata: DocumentMetadata) {
    setUploadError(null)
    setIsUploading(true)
    setMetadata({ ...localMetadata, status: 'uploading' })
    setPreparedDocumentFile(type, file)
    try {
      let draft = await ensureApplicationDraft()
      let uploaded: DocumentMetadata
      try {
        uploaded = await uploadApplicationDocument(draft, type, file)
      } catch (error) {
        if (error instanceof ApiError && (error.status === 403 || error.status === 410)) {
          setBackendDraft(null)
          draft = await ensureApplicationDraft()
          uploaded = await uploadApplicationDocument(draft, type, file)
        } else {
          throw error
        }
      }
      setMetadata({ ...localMetadata, ...uploaded, name: localMetadata.name, originalSize: localMetadata.originalSize })
      removePreparedDocumentFile(type)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo subir el documento.'
      setUploadError(message)
      setMetadata({ ...localMetadata, status: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  const uploadOptimized = useEffectEvent((optimized: NonNullable<typeof result>) => {
    const key = `${optimized.file.name}:${optimized.file.size}:${optimized.file.lastModified}`
    if (processingKey.current === key) return
    processingKey.current = key
    const selected = useApplicationStore.getState().application.documents.find((item) => item.type === type)
    void upload(optimized.file, { type, name: selected?.name ?? optimized.file.name, optimizedFileName: optimized.file.name, status: 'pending', mimeType: optimized.optimizedType, originalSize: optimized.originalSize, optimizedSize: optimized.optimizedSize, width: optimized.width, height: optimized.height, wasOptimized: optimized.wasOptimized })
  })

  useEffect(() => {
    if (!result || isOptimizing) return
    uploadOptimized(result)
  }, [isOptimizing, result])

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    setUploadError(null)
    processingKey.current = null
    if (!file) return
    removePreparedDocumentFile(type)
    if (isImage(file.type)) {
      setMetadata({ type, name: file.name, status: 'pending', mimeType: file.type, originalSize: file.size })
      setOriginalFile(file)
      return
    }
    if (file.type === 'application/pdf') {
      reset()
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('El PDF supera el máximo permitido de 10 MB.')
        setMetadata(null)
        return
      }
      void upload(file, { type, name: file.name, optimizedFileName: file.name, status: 'pending', mimeType: file.type, originalSize: file.size, optimizedSize: file.size, wasOptimized: false })
      return
    }
    setUploadError('Formato no permitido. Seleccioná JPG, PNG, WebP o PDF.')
  }

  const isBusy = isOptimizing || isUploading
  const visibleError = uploadError ?? optimizationError
  const uploaded = document?.status === 'ready' && Boolean(document.referenceId)
  return <div className="rounded-box border border-base-300 bg-base-100 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{label}{required && <span className="ml-1 text-error">*</span>}</p><p className="mt-1 text-xs text-base-content/55">{description}</p></div><label className={`btn btn-outline btn-sm shrink-0 ${isBusy ? 'pointer-events-none opacity-60' : ''}`}>{isOptimizing ? 'Optimizando...' : isUploading ? 'Subiendo...' : document ? 'Reemplazar archivo' : 'Seleccionar archivo'}<input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleChange} disabled={isBusy} /></label></div><p className="mt-2 text-xs text-base-content/50">JPG, PNG, WebP (hasta 30 MB de origen) o PDF (hasta 10 MB). Las imágenes se convierten a WebP antes de almacenarse.</p>{isOptimizing && <p className="mt-3 text-xs font-medium text-primary" role="status">Optimizando imagen para ahorrar espacio...</p>}{isUploading && <p className="mt-3 text-xs font-medium text-primary" role="status">Subiendo documento al almacenamiento seguro...</p>}{visibleError && <p className="mt-3 text-xs text-error" role="alert">{visibleError} Seleccioná nuevamente el archivo para reintentar.</p>}{statusMessage && !visibleError && !isUploading && !uploaded && <p className="mt-3 text-xs text-success" role="status">{statusMessage}</p>}{uploaded && <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-success" role="status"><span aria-hidden="true">✓</span>{document.name}<span className="text-base-content/50">{document.optimizedSize !== undefined ? `· ${formatBytes(document.optimizedSize)}` : ''} · almacenado correctamente</span></p>}{document?.status === 'ready' && !document.referenceId && <p className="mt-3 text-xs text-warning">Este archivo pertenece a una versión local anterior. Volvé a seleccionarlo para subirlo.</p>}</div>
}
