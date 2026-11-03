import axios from 'axios'
import { apiClient } from './axios'
import type { ApplicationFormData, ApplicationTracking, BackendDraft, ConfirmationCaptcha, DocumentMetadata, DocumentType, SubmissionReceipt } from '../features/application/types/application'

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
    return new ApiError(typeof data?.error === 'string' ? data.error : 'No se pudo comunicar con el servidor.', error.response?.status, data)
  }
  return error instanceof ApiError ? error : new ApiError('Ocurrió un error inesperado.')
}

export async function createApplicationDraft(): Promise<BackendDraft> {
  try {
    const response = await apiClient.post<BackendDraft>('/applications/drafts')
    return response.data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function uploadApplicationDocument(draft: BackendDraft, type: DocumentType, file: File): Promise<DocumentMetadata> {
  const form = new FormData()
  form.append('type', type)
  form.append('file', file)
  try {
    const response = await apiClient.post<{ document: { id: string; name: string; storedName: string; mimeType: string; size: number; width?: number; height?: number } }>(`/applications/drafts/${draft.id}/documents`, form, { headers: { 'X-Draft-Token': draft.token } })
    const document = response.data.document
    return { type, name: document.name, optimizedFileName: document.storedName, status: 'ready', referenceId: document.id, mimeType: document.mimeType, optimizedSize: document.size, width: document.width, height: document.height, wasOptimized: document.mimeType === 'image/webp' }
  } catch (error) {
    throw toApiError(error)
  }
}

export async function finalizeApplication(draft: BackendDraft, data: ApplicationFormData, captcha: ConfirmationCaptcha): Promise<SubmissionReceipt> {
  try {
    const response = await apiClient.post<SubmissionReceipt>(`/applications/drafts/${draft.id}/submit`, data, { headers: { 'X-Draft-Token': draft.token, 'X-Captcha-Token': captcha.token, 'X-Captcha-Answer': captcha.answer } })
    return response.data
  } catch (error) {
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
