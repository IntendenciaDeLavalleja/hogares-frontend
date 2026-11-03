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

function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined
    const status = error.response?.status
    const retryAfter = Number(error.response?.headers?.['retry-after'])
    const requestId = error.response?.headers?.['x-request-id']
    let message = typeof data?.error === 'string' ? data.error : 'No se pudo comunicar con el servidor. Revisá tu conexión y volvé a intentar; tus respuestas siguen guardadas.'
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') message = 'La conexión tardó demasiado. Tus respuestas siguen guardadas; podés volver a intentar.'
    if (status === 413) message = 'El archivo supera el tamaño que admite el servidor. El máximo es 30 MB por imagen o 10 MB por PDF.'
    if (status === 429) message = Number.isFinite(retryAfter) && retryAfter > 0 ? `Se alcanzó el límite temporal de intentos. Esperá ${Math.max(1, Math.ceil(retryAfter / 60))} minuto(s) antes de reintentar. Tus datos y archivos guardados se conservan.` : 'Se alcanzó el límite temporal de intentos. Esperá unos minutos y volvé a intentar; tus datos se conservan.'
    if (status === 502 || status === 503 || status === 504) message = 'El servicio está temporalmente ocupado. Tus respuestas se conservan; volvé a intentar en unos momentos.'
    return new ApiError(message, status, { ...data, ...(requestId ? { requestId } : {}) })
  }
  return error instanceof ApiError ? error : new ApiError('Ocurrió un error inesperado.')
}

export async function createApplicationDraft(data?: ApplicationFormData): Promise<BackendDraft> {
  try {
    const response = await apiClient.post<BackendDraft>('/applications/drafts', data)
    return response.data
  } catch (error) {
    throw toApiError(error)
  }
}

export function storedDocumentMetadata(document: StoredDocument): DocumentMetadata {
  return { type: document.type, name: document.name, optimizedFileName: document.storedName, status: 'ready', referenceId: document.id, mimeType: document.mimeType, optimizedSize: document.size, width: document.width, height: document.height, wasOptimized: document.mimeType === 'image/webp' }
}

export async function getApplicationDraft(draft: BackendDraft): Promise<DraftSnapshot> {
  try {
    return (await apiClient.get<DraftSnapshot>(`/applications/drafts/${draft.id}`, { headers: { 'X-Draft-Token': draft.token } })).data
  } catch (error) { throw toApiError(error) }
}

export async function saveApplicationDraft(draft: BackendDraft, data: ApplicationFormData): Promise<DraftSnapshot> {
  try {
    return (await apiClient.put<DraftSnapshot>(`/applications/drafts/${draft.id}`, data, { headers: { 'X-Draft-Token': draft.token } })).data
  } catch (error) { throw toApiError(error) }
}

export function snapshotReceipt(snapshot: DraftSnapshot): SubmissionReceipt | null {
  return snapshot.status === 'submitted' && snapshot.trackingCode && snapshot.submittedAt
    ? { id: snapshot.id, trackingCode: snapshot.trackingCode, submittedAt: snapshot.submittedAt, confirmationEmailSent: snapshot.confirmationEmailSent }
    : null
}

export async function uploadApplicationDocument(draft: BackendDraft, type: DocumentType, file: File, previousReferenceId?: string): Promise<DocumentMetadata> {
  const form = new FormData()
  form.append('type', type)
  form.append('file', file)
  const previousUpload = pendingUpload
  let release = () => {}
  pendingUpload = new Promise<void>((resolve) => { release = resolve })
  await previousUpload
  try {
    const response = await apiClient.post<{ document: StoredDocument }>(`/applications/drafts/${draft.id}/documents`, form, { headers: { 'X-Draft-Token': draft.token }, timeout: 300000 })
    return storedDocumentMetadata({ ...response.data.document, type })
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    if (!status || status >= 500 || status === 408) {
      try {
        const snapshot = await getApplicationDraft(draft)
        const recovered = snapshot.documents.find((document) => document.type === type && document.id !== previousReferenceId)
        if (recovered) return storedDocumentMetadata(recovered)
      } catch { /* Keep the original upload error and the selected file for a manual retry. */ }
    }
    throw toApiError(error)
  } finally {
    release()
  }
}

export async function finalizeApplication(draft: BackendDraft, data: ApplicationFormData, captcha: ConfirmationCaptcha): Promise<SubmissionReceipt> {
  try {
    const response = await apiClient.post<SubmissionReceipt>(`/applications/drafts/${draft.id}/submit`, data, { headers: { 'X-Draft-Token': draft.token, 'X-Captcha-Token': captcha.token, 'X-Captcha-Answer': captcha.answer }, timeout: 120000 })
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
