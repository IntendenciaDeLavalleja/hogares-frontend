import { beforeEach, expect, it, vi } from 'vitest'
import { apiClient } from '../../src/api/axios'
import { ApiError, finalizeApplication, uploadApplicationDocument } from '../../src/api/applications'
import { normalizeDocumentFile } from '../../src/features/application/utils/documentFiles'
import { applyDraftSnapshot, ensureApplicationDraft } from '../../src/features/application/services/applicationDraft'
import { useApplicationStore } from '../../src/store/applicationStore'
import contract from '../contracts/documents.json' with { type: 'json' }
import type { ApplicationFormData } from '../../src/features/application/types/application'

vi.mock('../../src/api/axios', () => ({ apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn() } }))
const draft = { id: 'test-draft', token: 'test-token', expiresAt: '2099-01-01T00:00:00Z' }
const file = () => new File(['%PDF-1.7\ncontenido'], 'cedula.PDF', { type: 'application/pdf' })
const stored = { id: 'document-new', type: 'applicant_id', name: 'cedula.pdf', storedName: 'cedula.pdf', mimeType: 'application/pdf', size: 100 }
const networkFailure = { isAxiosError: true, code: 'ECONNABORTED', message: 'timeout' }

beforeEach(() => { vi.resetAllMocks() })

it('admite PDF y JPEG sin MIME enviados desde móviles', async () => {
  const pdf = await normalizeDocumentFile(new File(['%PDF-1.7\ncontenido'], 'CEDULA.PDF'))
  expect(pdf.type).toBe('application/pdf')
  const jpg = await normalizeDocumentFile(new File([new Uint8Array([255, 216, 255, 224])], 'FOTO.JPG'))
  expect(jpg.type).toBe('image/jpeg')
})

it('identifica HEIC por su cabecera y rechaza archivos vacíos o tipos no admitidos', async () => {
  const heic = await normalizeDocumentFile(new File([new Uint8Array([0, 0, 0, 24]), 'ftypheic0000'], 'foto.heic'))
  expect(heic.type).toBe('image/heic')
  await expect(normalizeDocumentFile(new File([], 'foto.jpg'))).rejects.toThrow('vacío')
  await expect(normalizeDocumentFile(new File(['<svg/>'], 'foto.svg', { type: 'image/svg+xml' }))).rejects.toThrow('Formato')
})

it('rechaza PDFs mayores de 10 MB con un mensaje específico', async () => {
  const pdf = file()
  Object.defineProperty(pdf, 'size', { value: 10 * 1024 * 1024 + 1 })
  await expect(normalizeDocumentFile(pdf)).rejects.toThrow('10 MB')
})

it('recupera un archivo guardado si se pierde la respuesta de la subida', async () => {
  vi.mocked(apiClient.post).mockRejectedValue(networkFailure)
  vi.mocked(apiClient.get).mockResolvedValue({ data: { documents: [stored] } })
  const metadata = await uploadApplicationDocument(draft, 'applicant_id', file())
  expect(metadata.referenceId).toBe(stored.id)
  expect(metadata.status).toBe('ready')
  expect(apiClient.post).toHaveBeenCalledTimes(1)
  expect(apiClient.post).toHaveBeenCalledWith(expect.any(String), expect.any(FormData), expect.objectContaining({ timeout: 300000 }))
})

it('no confunde el adjunto anterior con una sustitución fallida', async () => {
  vi.mocked(apiClient.post).mockRejectedValue(networkFailure)
  vi.mocked(apiClient.get).mockResolvedValue({ data: { documents: [stored] } })
  await expect(uploadApplicationDocument(draft, 'applicant_id', file(), stored.id)).rejects.toBeInstanceOf(ApiError)
})

it('una cuota temporal conserva un mensaje útil y no da una carga por exitosa', async () => {
  vi.mocked(apiClient.post).mockRejectedValue({ isAxiosError: true, response: { status: 429, data: {}, headers: { 'retry-after': '120' } } })
  await expect(uploadApplicationDocument(draft, 'applicant_id', file())).rejects.toThrow('2 minuto')
  expect(apiClient.get).not.toHaveBeenCalled()
})

it('recupera el comprobante de una solicitud enviada aunque se pierda su respuesta', async () => {
  vi.mocked(apiClient.post).mockRejectedValue(networkFailure)
  vi.mocked(apiClient.get).mockResolvedValue({ data: { id: draft.id, status: 'submitted', trackingCode: 'HE27-1234567890', submittedAt: '2026-11-03T12:00:00Z', confirmationEmailSent: true, documents: [] } })
  const receipt = await finalizeApplication(draft, contract.baseline as ApplicationFormData, { token: 'captcha', answer: '2' })
  expect(receipt.trackingCode).toBe('HE27-1234567890')
})

it('una conexión fallida al renovar el borrador no borra referencias existentes', async () => {
  const application = structuredClone(contract.baseline) as ApplicationFormData
  application.documents = [{ type: 'applicant_id', status: 'ready', name: 'cedula.pdf', referenceId: 'already-stored' }]
  useApplicationStore.setState({ application, backendDraft: { ...draft, expiresAt: '2000-01-01T00:00:00Z' }, submissionReceipt: null })
  vi.mocked(apiClient.post).mockRejectedValue(networkFailure)
  await expect(ensureApplicationDraft()).rejects.toBeInstanceOf(ApiError)
  expect(useApplicationStore.getState().application.documents[0].referenceId).toBe('already-stored')
})

it('crea un solo borrador compartido para cargas simultáneas y envía las respuestas', async () => {
  const application = structuredClone(contract.baseline) as ApplicationFormData
  useApplicationStore.setState({ application, backendDraft: null, submissionReceipt: null })
  vi.mocked(apiClient.post).mockResolvedValue({ data: draft })
  const [first, second] = await Promise.all([ensureApplicationDraft(), ensureApplicationDraft()])
  expect(first.id).toBe(second.id)
  expect(apiClient.post).toHaveBeenCalledTimes(1)
  expect(apiClient.post).toHaveBeenCalledWith('/applications/drafts', expect.objectContaining({ applicant: application.applicant }))
})

it('una lectura iniciada antes de completar la carga no borra el archivo recién guardado', () => {
  const application = structuredClone(contract.baseline) as ApplicationFormData
  const before = [{ type: 'applicant_id' as const, status: 'ready' as const, name: 'anterior.pdf', referenceId: 'previous' }]
  application.documents = [{ ...before[0], name: 'nuevo.pdf', referenceId: 'newly-saved' }]
  useApplicationStore.setState({ application, backendDraft: draft, submissionReceipt: null })
  applyDraftSnapshot({ ...draft, status: 'draft', documents: [] }, before)
  expect(useApplicationStore.getState().application.documents[0].referenceId).toBe('newly-saved')
  applyDraftSnapshot({ ...draft, status: 'draft', documents: [{ ...stored, id: 'previous', type: 'applicant_id' }] }, before)
  expect(useApplicationStore.getState().application.documents[0].referenceId).toBe('newly-saved')
})
