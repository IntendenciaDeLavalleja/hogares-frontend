import { Buffer } from 'node:buffer'
import { expect, test, type Page } from '@playwright/test'

const apiURL = process.env.PLAYWRIGHT_API_URL || 'http://127.0.0.1:5001/api'
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(apiURL).hostname)) {
  throw new Error('La API de estas pruebas debe ser el servidor local aislado, nunca producción.')
}

const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAwAEADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD0eiiius4wooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/2Q==', 'base64')

function documentPdf(): Buffer {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << >> /Contents 4 0 R >>',
    '<< /Length 0 >>\nstream\n\nendstream',
  ]
  let content = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(content))
    content += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = Buffer.byteLength(content)
  content += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets.slice(1)) content += `${String(offset).padStart(10, '0')} 00000 n \n`
  content += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(content)
}

async function choose(page: Page, id: string, value: boolean) {
  await page.locator(`input[name="${id}"]`).nth(value ? 0 : 1).locator('..').click()
}

async function next(page: Page, heading: string) {
  await page.getByRole('button', { name: /^Continuar/ }).click()
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
}

interface SavedDraft { id: string; token: string; expiresAt: string }

async function draftCredential(page: Page): Promise<SavedDraft> {
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('idl-hogares-estudiantiles-2026') || '{}')
    return saved.state?.backendDraft?.id || null
  }), { message: 'El formulario debe crear un borrador antes de subir fotos' }).toBeTruthy()
  return page.evaluate(() => JSON.parse(localStorage.getItem('idl-hogares-estudiantiles-2026')!).state.backendDraft)
}

async function readDraft(page: Page, draft: SavedDraft) {
  const response = await page.request.get(`${apiURL}/applications/drafts/${draft.id}`, { headers: { 'X-Draft-Token': draft.token } })
  expect(response.status()).toBe(200)
  return response.json()
}

test('inscripción completa real: respuestas, JPEG/PDF, reanudación, captcha, comprobante y seguimiento', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error' && /Content Security Policy|CORS|net::ERR/.test(message.text())) errors.push(message.text())
  })
  const email = `integracion-${testInfo.project.name}@example.uy`
  await page.goto('/')
  await page.getByRole('link', { name: 'Iniciar inscripción', exact: true }).click()
  await page.locator('input[name="home"][value="minas"]').locator('..').click()
  await page.getByText('Primera solicitud', { exact: true }).click()
  await next(page, 'Datos del aspirante')

  await page.locator('#full-name').fill('Persona Prueba Integración')
  await page.locator('#national-id').fill('4.567.890-5')
  await page.locator('#birth-date').fill('2006-01-01')
  await page.locator('#address').fill('Domicilio ficticio de pruebas 123')
  await page.locator('#locality').fill('Minas')
  await page.locator('#phone').fill('44421234')
  await page.locator('#own-mobile').fill('099123456')
  await next(page, 'Estudios formales')

  await page.locator('#grade').fill('Primer año')
  await page.locator('#institution').fill('Institución de prueba')
  await page.locator('#average').fill('9.25')
  await choose(page, 'pending-subjects', false)
  await next(page, 'Asistencia en salud')

  await page.locator('#health-center').fill('ASSE')
  for (const id of ['disability', 'chronic-disease', 'controlled-medication', 'neurodevelopment', 'allergy', 'scholarship', 'currently-works']) await choose(page, id, false)
  await page.locator('#emergency-name').fill('Persona de contacto ficticia')
  await page.locator('#emergency-mobile').fill('099111222')
  await next(page, 'Personas con las que convive')

  await choose(page, 'lives-alone', true)
  await page.locator('#mother-situation').selectOption('deceased')
  await page.locator('#father-situation').selectOption('unknown')
  await next(page, 'Situación socioeconómica')

  await page.locator('#housing-status').selectOption('usufruct')
  for (const id of ['motorcycle-owns', 'car-owns', 'owns-field', 'leases-field']) await choose(page, id, false)
  await next(page, 'Documentación requerida')

  const draft = await draftCredential(page)
  await expect.poll(async () => (await readDraft(page, draft)).data).toMatchObject({
    applicant: { fullName: 'Persona Prueba Integración' }, household: { livesAlone: true },
  })
  const beforeFiles = await readDraft(page, draft)
  expect(beforeFiles.status).toBe('draft')
  expect(beforeFiles.documents).toHaveLength(0)
  expect(beforeFiles.data.request).toMatchObject({ home: 'minas', type: 'new' })
  expect(beforeFiles.data.household.livesAlone).toBe(true)

  const files = [
    { type: 'applicant_id', name: 'cedula.JPG', mimeType: 'image/jpeg', buffer: jpeg },
    { type: 'address', name: 'domicilio.PDF', mimeType: '', buffer: documentPdf() },
    { type: 'school_records', name: 'escolaridad.pdf', mimeType: 'application/pdf', buffer: documentPdf() },
    { type: 'health_card', name: 'carne-salud.jpg', mimeType: 'image/jpeg', buffer: jpeg },
    { type: 'ute_receipt', name: 'recibo-ute.pdf', mimeType: 'application/pdf', buffer: documentPdf() },
    { type: 'passport_photo', name: 'foto-carne.jpg', mimeType: 'image/jpeg', buffer: jpeg },
  ]
  for (let index = 0; index < files.length; index += 1) {
    const { type, ...file } = files[index]
    const card = page.locator(`[data-document-type="${type}"]`)
    await card.locator('input[type="file"]').setInputFiles(file)
    await expect(card).toContainText('guardado correctamente', { timeout: 30_000 })
    if (index === 1) {
      await page.reload()
      await expect(page.getByRole('heading', { name: 'Documentación requerida', exact: true })).toBeVisible()
      for (const previous of files.slice(0, 2)) await expect(page.locator(`[data-document-type="${previous.type}"]`)).toContainText('guardado correctamente')
      const resumed = await draftCredential(page)
      expect(resumed.id).toBe(draft.id)
      expect((await readDraft(page, resumed)).documents).toHaveLength(2)
    }
  }

  const ready = await readDraft(page, draft)
  expect(ready.documents).toHaveLength(6)
  expect(ready.documents.some((file: { mimeType: string }) => file.mimeType === 'application/pdf')).toBe(true)
  expect(ready.documents.some((file: { mimeType: string }) => file.mimeType === 'image/webp')).toBe(true)
  await next(page, 'Revisión de la solicitud')
  await page.locator('#contactEmail').fill(email)
  await page.getByRole('checkbox').check()
  const captchaLabel = page.locator('label[for="confirmation-captcha"]')
  await expect(captchaLabel).toContainText('¿cuánto es')
  const question = (await captchaLabel.innerText()).match(/(\d+)\s*\+\s*(\d+)/)
  expect(question).not.toBeNull()
  await page.locator('#confirmation-captcha').fill(String(Number(question![1]) + Number(question![2])))
  await page.getByRole('button', { name: 'Enviar solicitud', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tu solicitud fue enviada', exact: true })).toBeVisible({ timeout: 30_000 })

  const submitted = await readDraft(page, draft)
  expect(submitted.status).toBe('submitted')
  expect(submitted.trackingCode).toMatch(/^HE27-[A-F0-9]{10}$/)
  expect(submitted.data.contactEmail).toBe(email)
  expect(submitted.data.documents).toHaveLength(6)
  expect(submitted.confirmationEmailSent).toBe(true)
  await expect(page.getByText(submitted.trackingCode, { exact: true })).toBeVisible()
  const receipt = await page.request.get(`${apiURL}/applications/receipts/${submitted.trackingCode}`, { headers: { 'X-Draft-Token': draft.token } })
  expect(receipt.status()).toBe(200)
  expect((await receipt.json()).trackingCode).toBe(submitted.trackingCode)
  const duplicate = await page.request.post(`${apiURL}/applications/drafts/${draft.id}/submit`, { headers: { 'X-Draft-Token': draft.token }, data: {} })
  expect(duplicate.status()).toBe(200)
  expect((await duplicate.json()).trackingCode).toBe(submitted.trackingCode)

  await page.getByRole('link', { name: 'Seguir mi trámite', exact: true }).click()
  await page.getByLabel('Código de seguimiento').fill(submitted.trackingCode)
  await page.getByLabel('Correo registrado').fill(email)
  await page.getByRole('button', { name: 'Consultar estado', exact: true }).click()
  await expect(page.locator('#seguimiento [role="status"]')).toContainText('Recibida')
  expect(errors).toEqual([])
})
