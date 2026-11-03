import { afterEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import contract from '../contracts/documents.json' with { type: 'json' }
import type { ApplicationFormData } from '../../src/features/application/types/application'
import { ApiError, saveApplicationDraft } from '../../src/api/applications'
import { apiClient } from '../../src/api/axios'

const draft = { id: 'local-test-draft', token: 'private-draft-token-not-for-display', expiresAt: '2027-12-31T00:00:00Z' }
const requestId = '2ca6677c-cf81-4d24-a5cb-5fa1d5a2361a'

function httpFailure(data: unknown, status = 503, headers: Record<string, string> = {}) {
  const config = { headers: new AxiosHeaders({ 'X-Draft-Token': draft.token }) }
  return new AxiosError('Request failed with status code', AxiosError.ERR_BAD_RESPONSE, config, undefined, { data, status, statusText: 'Service Unavailable', headers, config })
}

async function failedSave(error: unknown): Promise<ApiError> {
  vi.spyOn(apiClient, 'put').mockRejectedValueOnce(error)
  try {
    await saveApplicationDraft(draft, structuredClone(contract.baseline) as ApplicationFormData)
  } catch (failure) {
    expect(failure).toBeInstanceOf(ApiError)
    return failure as ApiError
  }
  throw new Error('La prueba esperaba un error de API.')
}

afterEach(() => vi.restoreAllMocks())

describe('diagnóstico útil y seguro de errores de servidor', () => {
  it('conserva la causa amigable de un fallo al guardar el avance y su referencia', async () => {
    const error = await failedSave(httpFailure({ error: 'No se pudo guardar el avance. Intentá nuevamente.', errorCode: 'DRAFT_SAVE_FAILED' }, 503, { 'x-request-id': requestId }))
    expect(error.status).toBe(503)
    expect(error.message).toContain('No se pudo guardar el avance. Intentá nuevamente.')
    expect(error.message).toContain(`Referencia: ${requestId} (HTTP 503)`)
    expect(error.message).not.toContain('temporalmente ocupado')
    expect(error.message).not.toContain(draft.token)
    expect(error.details).toMatchObject({ requestId, errorCode: 'DRAFT_SAVE_FAILED' })
  })

  it.each([
    ['No se pudo guardar el documento.', 'DOCUMENT_DATABASE_ERROR'],
    ['El almacenamiento no está disponible temporalmente.', 'DOCUMENT_STORAGE_UNAVAILABLE'],
  ])('mantiene diferenciada la causa del fallo: %s', async (message, code) => {
    const error = await failedSave(httpFailure({ error: message, errorCode: code, requestId }))
    expect(error.message).toContain(message)
    expect(error.details).toMatchObject({ errorCode: code, requestId })
    expect(error.status).toBe(503)
  })

  it('admite la referencia hex del proxy y omite HTML de una respuesta 502', async () => {
    const proxyReference = '8e027bccf511b16c15326ffb70391de5'
    const error = await failedSave(httpFailure('<html><body>Bad gateway</body></html>', 502, { 'x-request-id': proxyReference }))
    expect(error.message).toContain('El servidor no pudo completar esta operación.')
    expect(error.message).toContain(`Referencia: ${proxyReference} (HTTP 502)`)
    expect(error.message).not.toContain('<html>')
  })

  it.each([
    '<html>Error del proxy</html>',
    'OperationalError: UPDATE applications SET token=secreto',
    'password=credential-private-diagnostic',
    'Falló https://user:credential@internal.example.uy/?access_token=private',
    'Traceback: internal implementation details',
  ])('no muestra diagnósticos internos o credenciales recibidas como mensaje', async (unsafe) => {
    const error = await failedSave(httpFailure({ error: unsafe }, 503, { 'x-request-id': requestId }))
    expect(error.message).toContain('El servidor no pudo completar esta operación.')
    expect(error.message).not.toContain(unsafe)
    expect(error.message).not.toContain('credential')
  })

  it('no usa un token ni texto arbitrario como referencia visible', async () => {
    const error = await failedSave(httpFailure({ error: 'No se pudo guardar el documento.', requestId: draft.token }, 503, { 'x-request-id': 'invalid ref with spaces' }))
    expect(error.message).toBe('No se pudo guardar el documento.')
    expect(error.details?.requestId).toBeUndefined()
    expect(error.message).not.toContain(draft.token)
  })

  it('mantiene errores de validación y campos sin agregar ruido HTTP', async () => {
    const error = await failedSave(httpFailure({ error: 'La solicitud contiene datos inválidos.', fields: { applicant: { address: ['Revisá el domicilio.'] } } }, 422, { 'x-request-id': requestId }))
    expect(error.message).toBe('La solicitud contiene datos inválidos.')
    expect(error.status).toBe(422)
    expect(error.details?.fields).toEqual({ applicant: { address: ['Revisá el domicilio.'] } })
    expect(error.details?.requestId).toBe(requestId)
  })

  it('no expone configuración ni el token cuando no llegó ninguna respuesta HTTP', async () => {
    const config = { headers: new AxiosHeaders({ 'X-Draft-Token': draft.token }) }
    const error = await failedSave(new AxiosError(`Network error ${draft.token}`, AxiosError.ERR_NETWORK, config))
    expect(error.status).toBeUndefined()
    expect(error.message).toContain('Revisá tu conexión')
    expect(error.message).not.toContain(draft.token)
  })
})
