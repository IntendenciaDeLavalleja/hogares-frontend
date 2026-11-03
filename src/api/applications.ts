import axios from 'axios'
import { apiClient } from './axios'
import type { ApplicationFormData, ApplicationTracking, BackendDraft, ConfirmationCaptcha, DocumentMetadata, DocumentType, DraftSnapshot, StoredDocument, SubmissionReceipt } from '../features/application/types/application'

let pendingUpload: Promise<void> = Promise.resolve()

export class ApiError extends Error {
  status?: number
  details?: Record<string, unknown>

  constructor(message: string, status?: number, details?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function safeResponseMessage(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const message = value.trim()
  if (!message || message.length > 600 || [...message].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return undefined
  // API error messages are short public explanations, never proxy HTML,
  // stack traces, SQL statements, URLs or credential-bearing diagnostics.
  if (/<[^>]+>|https?:\/\/|\b(?:Traceback|OperationalError|IntegrityError|SQLAlchemyError)\b|\b(?:password|secret|authorization|x-draft-token|access_token)\s*[:=]|\b(?:INSERT\s+INTO|UPDATE\s+\S+\s+SET|DELETE\s+FROM|SELECT\s+.+\s+FROM)\b/i.test(message)) return undefined
  return message
}

function safeRequestReference(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  // Flask produces UUIDs; the reverse proxy can supply a 32-digit hex id.
  return /^(?:[a-f0-9]{32}|[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12})$/i.test(value) ? value : undefined
}

function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const responseData: unknown = error.response?.data
    const data = responseData && typeof responseData === 'object' && !Array.isArray(responseData) ? responseData as Record<string, unknown> : undefined
    const status = error.response?.status
    const retryAfter = Number(error.response?.headers?.['retry-after'])
    const requestId = safeRequestReference(error.response?.headers?.['x-request-id']) ?? safeRequestReference(data?.requestId)
    let message = safeResponseMessage(data?.error) ?? (status && status >= 500
      ? 'El servidor no pudo completar esta operación. Tus respuestas se conservan; volvé a intentar.'
      : 'No se pudo comunicar con el servidor. Revisá tu conexión y volvé a intentar; tus respuestas siguen guardadas.')
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') message = 'La conexión tardó demasiado. Tus respuestas siguen guardadas; podés volver a intentar.'
    if (status === 413) message = 'El archivo supera el tamaño que admite el servidor. El máximo es 30 MB por imagen o 10 MB por PDF.'
    if (status === 429) message = Number.isFinite(retryAfter) && retryAfter > 0 ? `Se alcanzó el límite temporal de intentos. Esperá ${Math.max(1, Math.ceil(retryAfter / 60))} minuto(s) antes de reintentar. Tus datos y archivos guardados se conservan.` : 'Se alcanzó el límite temporal de intentos. Esperá unos minutos y volvé a intentar; tus datos se conservan.'
    if (status && status >= 500 && requestId) message += ` Referencia: ${requestId} (HTTP ${status}).`
    const details = { ...data }
    delete details.requestId
    if (requestId) details.requestId = requestId
    return new ApiError(message, status, details)
  }
  return error instanceof ApiError ? error : new ApiError('Ocurrió un error inesperado.')
}

function applicationRequestData(data: ApplicationFormData): ApplicationFormData {
  return { ...data, documents: data.documents.map((document) => {
    // Revisions belong to authenticated server snapshots, not the form schema.
    // Keep them locally while remaining compatible with strict older APIs.
    const requestDocument = { ...document }
    delete requestDocument.revision
    delete requestDocument.updatedAt
    return requestDocument
  }) }
}

export async function createApplicationDraft(data?: ApplicationFormData): Promise<BackendDraft> {
  try {
    const response = await apiClient.post<BackendDraft>('/applications/drafts', data ? applicationRequestData(data) : undefined)
    return response.data
  } catch (error) {
    throw toApiError(error)
  }
}

export function storedDocumentMetadata(document: StoredDocument): DocumentMetadata {
  return { type: document.type, name: document.name, optimizedFileName: document.storedName, status: 'ready', referenceId: document.id, mimeType: document.mimeType, optimizedSize: document.size, width: document.width, height: document.height, updatedAt: document.updatedAt ?? undefined, revision: document.revision, wasOptimized: document.mimeType === 'image/webp' }
}

export async function getApplicationDraft(draft: BackendDraft): Promise<DraftSnapshot> {
  try {
    return (await apiClient.get<DraftSnapshot>(`/applications/drafts/${draft.id}`, { headers: { 'X-Draft-Token': draft.token } })).data
  } catch (error) { throw toApiError(error) }
}

export async function saveApplicationDraft(draft: BackendDraft, data: ApplicationFormData): Promise<DraftSnapshot> {
  try {
    return (await apiClient.put<DraftSnapshot>(`/applications/drafts/${draft.id}`, applicationRequestData(data), { headers: { 'X-Draft-Token': draft.token } })).data
  } catch (error) { throw toApiError(error) }
}

export function snapshotReceipt(snapshot: DraftSnapshot): SubmissionReceipt | null {
  return snapshot.status === 'submitted' && snapshot.trackingCode && snapshot.submittedAt
    ? { id: snapshot.id, trackingCode: snapshot.trackingCode, submittedAt: snapshot.submittedAt, confirmationEmailSent: snapshot.confirmationEmailSent }
    : null
}

function documentRevisionChanged(current: StoredDocument, previous: StoredDocument | undefined): boolean {
  if (!previous) return true
  if (current.revision && previous.revision) return current.revision !== previous.revision
  if (current.id !== previous.id) return true
  if (current.updatedAt && previous.updatedAt && current.updatedAt !== previous.updatedAt) return true
  // Older servers do not return updatedAt. Compare server metadata, never the
  // locally displayed original filename, which can differ after sanitizing.
  return (['name', 'storedName', 'mimeType', 'size', 'width', 'height'] as const).some((key) => current[key] !== previous[key])
}

export async function uploadApplicationDocument(draft: BackendDraft, type: DocumentType, file: File): Promise<DocumentMetadata> {
  const form = new FormData()
  form.append('type', type)
  form.append('file', file)
  const previousUpload = pendingUpload
  let release = () => {}
  pendingUpload = new Promise<void>((resolve) => { release = resolve })
  await previousUpload
  let baselineKnown = false
  let previousDocument: StoredDocument | undefined
  try {
    // A stable row ID identifies a document type, not a particular replacement.
    // Read the authenticated server revision immediately before this upload.
    // Failure to read it must not prevent a successful POST, but then a lost
    // POST response cannot safely be inferred from a pre-existing attachment.
    try {
      const baseline = await getApplicationDraft(draft)
      if (Array.isArray(baseline.documents)) {
        previousDocument = baseline.documents.find((document) => document.type === type)
        baselineKnown = true
      }
    } catch { /* A manual retry remains available if both requests fail. */ }
    const response = await apiClient.post<{ document: StoredDocument }>(`/applications/drafts/${draft.id}/documents`, form, { headers: { 'X-Draft-Token': draft.token }, timeout: 300000 })
    return storedDocumentMetadata({ ...response.data.document, type })
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    if (baselineKnown && (!status || status >= 500 || status === 408)) {
      try {
        const snapshot = await getApplicationDraft(draft)
        const recovered = snapshot.documents.find((document) => document.type === type)
        if (recovered && documentRevisionChanged(recovered, previousDocument)) return storedDocumentMetadata(recovered)
      } catch { /* Keep the original upload error and the selected file for a manual retry. */ }
    }
    throw toApiError(error)
  } finally {
    release()
  }
}

export async function finalizeApplication(draft: BackendDraft, data: ApplicationFormData, captcha: ConfirmationCaptcha): Promise<SubmissionReceipt> {
  try {
    const response = await apiClient.post<SubmissionReceipt>(`/applications/drafts/${draft.id}/submit`, applicationRequestData(data), { headers: { 'X-Draft-Token': draft.token, 'X-Captcha-Token': captcha.token, 'X-Captcha-Answer': captcha.answer }, timeout: 120000 })
    return response.data
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    if (!status || status >= 500 || status === 408) {
      try {
        const receipt = snapshotReceipt(await getApplicationDraft(draft))
        if (receipt) return receipt
      } catch { /* A retry of submit remains safe; the server returns the same receipt. */ }
    }
    throw toApiError(error)
  }
}

export async function getConfirmationCaptcha(draft: BackendDraft): Promise<{ question: string; token: string }> {
  try {
    const response = await apiClient.get<{ question: string; token: string }>(`/applications/drafts/${draft.id}/captcha`, { headers: { 'X-Draft-Token': draft.token } })
    return response.data
  } catch (error) { throw toApiError(error) }
}

export async function retryConfirmationEmail(draft: BackendDraft): Promise<SubmissionReceipt> {
  try {
    const response = await apiClient.post<SubmissionReceipt>(`/applications/drafts/${draft.id}/confirmation-email`, {}, { headers: { 'X-Draft-Token': draft.token } })
    return response.data
  } catch (error) { throw toApiError(error) }
}

export async function trackApplication(trackingCode: string, email: string): Promise<ApplicationTracking> {
  try {
    const response = await apiClient.post<ApplicationTracking>('/applications/track', { trackingCode, email })
    return response.data
  } catch (error) { throw toApiError(error) }
}
