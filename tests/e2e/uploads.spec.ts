import { expect, test, type Page } from '@playwright/test'
import contract from '../contracts/documents.json' with { type: 'json' }
import type { StoredDocument } from '../../src/features/application/types/application'

const draft = { id: 'browser-upload-draft', token: 'browser-upload-token', expiresAt: '2099-01-01T00:00:00Z' }
const pdf = Buffer.from('%PDF-1.4\nDocumento ficticio para verificar el flujo de carga del navegador.\n%%EOF')
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/Y9sAAAAASUVORK5CYII=', 'base64')

interface UploadRequest { documentType: string; contentType: string; body: string; token?: string }

async function openDocuments(page: Page, options: { failOnce?: string; loseResponseOnce?: string } = {}) {
  const state = {
    saved: null as Record<string, unknown> | null,
    documents: [] as StoredDocument[],
    requests: [] as UploadRequest[],
    snapshotReads: 0,
    failed: false,
    responseLost: false,
  }
  await page.addInitScript(({ application }) => {
    if (!localStorage.getItem('idl-hogares-estudiantiles-2026')) {
      localStorage.setItem('idl-hogares-estudiantiles-2026', JSON.stringify({ version: 2, state: {
        application, currentStep: 6, backendDraft: null, submissionReceipt: null,
      } }))
    }
  }, { application: contract.baseline })
  function snapshot() {
    return { ...draft, status: 'draft', documents: state.documents, data: state.saved, updatedAt: new Date().toISOString() }
  }
  await page.route('**/api/applications/**', async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const method = request.method()
    if (path.endsWith('/institution')) return route.fulfill({ json: { goodConductEmail: 'institucion@example.uy' } })
    if (path.endsWith('/drafts') && method === 'POST') {
      state.saved = request.postData() ? request.postDataJSON() : null
      return route.fulfill({ status: 201, json: draft })
    }
    if (path.endsWith(`/drafts/${draft.id}`)) {
      expect(request.headers()['x-draft-token']).toBe(draft.token)
      if (method === 'PUT') state.saved = request.postDataJSON()
      else state.snapshotReads += 1
      return route.fulfill({ json: snapshot() })
    }
    if (path.endsWith('/documents') && method === 'POST') {
      const body = request.postDataBuffer()!.toString('latin1')
      const documentType = body.match(/name="type"\r\n\r\n([^\r\n]+)/)?.[1] ?? ''
      const contentType = body.match(/filename="[^\r\n]+\r\nContent-Type: ([^\r\n]+)/i)?.[1] ?? ''
      state.requests.push({ documentType, contentType, body, token: request.headers()['x-draft-token'] })
      expect(documentType).not.toBe('')
      expect(request.headers()['x-draft-token']).toBe(draft.token)
      if (options.failOnce === documentType && !state.failed) {
        state.failed = true
        return route.fulfill({ status: 429, headers: { 'Retry-After': '1' }, json: { error: 'Demasiadas solicitudes.' } })
      }
      const isPdf = contentType === 'application/pdf'
      const document: StoredDocument = {
        id: `document-${documentType}-${state.requests.length}`,
        type: documentType as StoredDocument['type'], name: isPdf ? 'documento.pdf' : 'foto.jpg',
        storedName: isPdf ? 'documento.pdf' : 'foto.webp',
        mimeType: isPdf ? 'application/pdf' : 'image/webp', size: isPdf ? pdf.length : 100,
      }
      state.documents = [...state.documents.filter(item => item.type !== documentType), document]
      if (options.loseResponseOnce === documentType && !state.responseLost) {
        state.responseLost = true
        return route.abort('failed')
      }
      return route.fulfill({ status: 201, json: { document } })
    }
    if (path.endsWith('/captcha')) return route.fulfill({ json: { question: '2 + 3', token: 'upload-captcha' } })
    return route.fulfill({ status: 404, json: { error: 'Ruta de prueba no definida.' } })
  })
  await page.goto('/solicitud')
  await expect(page.getByRole('heading', { name: 'Documentación requerida' })).toBeVisible()
  return state
}

test('acepta PDF y fotos de móvil sin MIME y conserva las respuestas con los adjuntos', async ({ page }) => {
  const state = await openDocuments(page)
  await page.getByLabel('Cédula de identidad del aspirante', { exact: true }).setInputFiles({ name: 'cedula.PDF', mimeType: '', buffer: pdf })
  await expect(page.getByRole('status').filter({ hasText: /cedula\.PDF/ })).toContainText('guardado correctamente')
  const jpeg = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 2
    canvas.getContext('2d')!.fillRect(0, 0, 2, 2)
    return canvas.toDataURL('image/jpeg').split(',')[1]
  })
  await page.getByLabel('Foto carné', { exact: true }).setInputFiles({ name: 'foto.JPG', mimeType: '', buffer: Buffer.from(jpeg, 'base64') })
  await expect(page.getByRole('status').filter({ hasText: /foto\.JPG/ })).toContainText('guardado correctamente')
  await expect.poll(() => state.saved?.applicant).toEqual(expect.objectContaining({ fullName: contract.baseline.applicant.fullName }))
  expect(state.requests.find(request => request.documentType === 'applicant_id')?.contentType).toBe('application/pdf')
  expect(state.requests.find(request => request.documentType === 'passport_photo')?.contentType).toMatch(/^image\/(jpeg|png|webp)$/)
  expect(state.documents).toHaveLength(2)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('idl-hogares-estudiantiles-2026')!).state)
  expect(stored.application.documents.filter((document: { status: string }) => document.status === 'ready')).toHaveLength(2)
  expect(stored.application.applicant.fullName).toBe(contract.baseline.applicant.fullName)
})

test('permite reintentar un adjunto tras 429 sin volver a seleccionar el archivo', async ({ page }) => {
  const state = await openDocuments(page, { failOnce: 'household_ids' })
  await page.getByLabel('Cédulas del núcleo familiar', { exact: true }).setInputFiles({ name: 'familia.pdf', mimeType: 'application/pdf', buffer: pdf })
  await expect(page.getByRole('alert').filter({ hasText: /límite temporal/ })).toBeVisible()
  await page.getByRole('button', { name: 'Reintentar carga', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: /familia\.pdf/ })).toContainText('guardado correctamente')
  expect(state.requests.filter(request => request.documentType === 'household_ids')).toHaveLength(2)
  expect(state.documents.filter(document => document.type === 'household_ids')).toHaveLength(1)
  await page.getByRole('button', { name: 'Anterior', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Situación socioeconómica', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Continuar', exact: false }).click()
  await expect(page.getByRole('status').filter({ hasText: /familia\.pdf/ })).toContainText('guardado correctamente')
})

test('recupera una carga confirmada por el servidor aunque se pierda la respuesta', async ({ page }) => {
  const state = await openDocuments(page, { loseResponseOnce: 'address' })
  await page.getByLabel('Constancia de domicilio', { exact: true }).setInputFiles({ name: 'domicilio.pdf', mimeType: 'application/pdf', buffer: pdf })
  await expect(page.getByRole('status').filter({ hasText: /domicilio\.pdf/ })).toContainText('guardado correctamente')
  expect(state.snapshotReads).toBeGreaterThan(0)
  expect(state.requests.filter(request => request.documentType === 'address')).toHaveLength(1)
  await expect(page.getByRole('button', { name: 'Reintentar carga', exact: true })).toHaveCount(0)
})

test('conserva el adjunto y los datos personales al recargar y volver a los pasos anteriores', async ({ page }) => {
  const state = await openDocuments(page)
  await page.getByLabel('Cédula de identidad del aspirante', { exact: true }).setInputFiles({ name: 'identidad.png', mimeType: 'image/png', buffer: png })
  await expect(page.getByRole('status').filter({ hasText: /identidad\.png/ })).toContainText('guardado correctamente')
  await page.reload()
  await expect(page.getByRole('status').filter({ hasText: /identidad\.png|foto\.jpg/ })).toContainText('guardado correctamente')
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('idl-hogares-estudiantiles-2026')!).state)
  expect(stored.application.applicant.fullName).toBe(contract.baseline.applicant.fullName)
  expect(stored.backendDraft.id).toBe(draft.id)
  expect(state.requests.filter(request => request.documentType === 'applicant_id')).toHaveLength(1)
})
