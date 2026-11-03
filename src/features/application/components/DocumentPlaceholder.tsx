import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { ApiError, uploadApplicationDocument } from '../../../api/applications'
import { useApplicationStore } from '../../../store/applicationStore'
import type { DocumentMetadata, DocumentType } from '../types/application'
import { ensureApplicationDraft, persistApplicationDraft, recoverApplicationDraft } from '../services/applicationDraft'
import { formatBytes } from '../utils/optimizeImage'
import { prepareDocumentFile } from '../utils/documentFiles'
import { getPreparedDocumentFile, removePreparedDocumentFile, setPreparedDocumentFile } from '../utils/preparedFiles'

export function DocumentPlaceholder({ type, label, description, required }: { type: DocumentType; label: string; description: string; required: boolean }) {
  const document = useApplicationStore((state) => state.application.documents.find((item) => item.type === type))
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'uploading'>('idle')
  const running = useRef(false)
  const inputId = `document-${type}`
  const statusId = `${inputId}-status`

  function setMetadata(metadata: DocumentMetadata) {
    const state = useApplicationStore.getState()
    state.updateApplication({ documents: [...state.application.documents.filter((item) => item.type !== type), metadata] })
  }

  async function upload(file: File, metadata: DocumentMetadata) {
    setPhase('uploading')
    setPreparedDocumentFile(type, file)
    setMetadata({ ...metadata, status: 'uploading' })
    let draft = await ensureApplicationDraft()
    let uploaded: DocumentMetadata
    try {
      await persistApplicationDraft(draft)
      uploaded = await uploadApplicationDocument(draft, type, file)
    } catch (failure) {
      if (failure instanceof ApiError && [403, 404, 410].includes(failure.status ?? 0)) {
        draft = await recoverApplicationDraft(draft, failure)
        uploaded = await uploadApplicationDocument(draft, type, file)
      } else throw failure
    }
    if (useApplicationStore.getState().backendDraft?.id === draft.id) {
      setMetadata({ ...metadata, ...uploaded, name: metadata.name, originalSize: metadata.originalSize })
      removePreparedDocumentFile(type)
    }
  }

  async function process(file: File, retry = false) {
    if (running.current) return
    running.current = true
    setError(null)
    setPhase('preparing')
    const previous = useApplicationStore.getState().application.documents.find((item) => item.type === type)
    const previousDraftId = useApplicationStore.getState().backendDraft?.id
    const session = useApplicationStore.getState().applicationSession
    let metadata: DocumentMetadata | undefined
    try {
      const prepared = await prepareDocumentFile(file, !retry)
      if (useApplicationStore.getState().applicationSession !== session) return
      metadata = { type, name: retry ? previous?.name ?? file.name : file.name, optimizedFileName: prepared.name, mimeType: prepared.type, originalSize: retry ? previous?.originalSize ?? file.size : file.size, optimizedSize: prepared.size, status: 'pending' }
      await upload(prepared, metadata)
    } catch (failure) {
      if (useApplicationStore.getState().applicationSession !== session) return
      setError(failure instanceof Error ? failure.message : 'No se pudo subir el archivo. Volvé a intentar.')
      if (metadata) {
        // A replacement failure must not discard a document already stored.
        setMetadata(previous?.status === 'ready' && previous.referenceId && useApplicationStore.getState().backendDraft?.id === previousDraftId ? previous : { ...metadata, status: 'error' })
      }
    } finally { running.current = false; setPhase('idle') }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (file) void process(file)
  }

  useEffect(() => {
    const online = () => {
      if (useApplicationStore.getState().application.documents.find((item) => item.type === type)?.status === 'error') {
        setError('La conexión volvió. Podés reintentar la carga con el botón de abajo.')
      }
    }
    window.addEventListener('online', online)
    return () => window.removeEventListener('online', online)
  }, [type])

  const busy = phase !== 'idle'
  const uploaded = document?.status === 'ready' && Boolean(document.referenceId)
  const canRetry = !busy && Boolean(getPreparedDocumentFile(type)) && Boolean(error || document?.status === 'error')
  return <div className="rounded-box border border-base-300 bg-base-100 p-4" data-document-type={type} aria-busy={busy}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-medium">{label}{required && <span className="ml-1 text-error" aria-hidden="true">*</span>}</p><p id={`${inputId}-description`} className="mt-1 text-xs text-base-content/70">{description}</p></div>
      <label className={`btn btn-outline btn-sm shrink-0 ${busy ? 'pointer-events-none opacity-60' : ''}`} htmlFor={inputId}>
        {phase === 'preparing' ? 'Preparando…' : phase === 'uploading' ? 'Subiendo…' : document ? 'Reemplazar archivo' : 'Seleccionar archivo'}
        <input id={inputId} aria-label={label} aria-describedby={`${inputId}-description ${statusId}`} aria-invalid={Boolean(error) && !uploaded} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf,.pdf" onChange={handleChange} disabled={busy} />
      </label>
    </div>
    <p className="mt-2 text-xs text-base-content/70">JPG, PNG, WebP o HEIC/HEIF (hasta 30 MB) y PDF (hasta 10 MB). Para varias páginas, frente y dorso o varios integrantes, adjuntá un PDF que los reúna.</p>
    <div id={statusId}>
      {busy && <p className="mt-3 text-sm font-medium text-primary" role="status">{phase === 'preparing' ? 'Preparando el archivo…' : 'Guardando el documento. En conexiones lentas puede tardar unos minutos.'}</p>}
      {error && <p className="mt-3 text-sm text-error" role="alert">{error}{uploaded && ' El documento anterior continúa guardado.'}</p>}
      {!busy && !uploaded && document && !error && <p className="mt-3 text-sm text-error" role="alert">La carga quedó pendiente. Volvé a intentarlo para completar este documento.</p>}
      {uploaded && <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-success" role="status"><span aria-hidden="true">✓</span><span className="break-all">{document.name}</span><span>{document.optimizedSize !== undefined ? `· ${formatBytes(document.optimizedSize)}` : ''} · guardado correctamente</span></p>}
    </div>
    {canRetry && <button type="button" className="btn btn-outline btn-sm mt-3" onClick={() => { const prepared = getPreparedDocumentFile(type); if (prepared) void process(prepared, true) }}>Reintentar carga</button>}
  </div>
}
