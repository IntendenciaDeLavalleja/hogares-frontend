import { expect, test, type Locator, type Page } from '@playwright/test'
import contract from '../contracts/documents.json' with { type: 'json' }

async function openStep(page: Page, currentStep: number) {
  await page.addInitScript(({ application, currentStep }) => {
    localStorage.setItem('idl-hogares-estudiantiles-2026', JSON.stringify({ version: 2, state: {
      application, currentStep, backendDraft: null, submissionReceipt: null,
    } }))
  }, { application: contract.baseline, currentStep })
  await page.route('**/api/applications/institution', route => route.fulfill({ json: { goodConductEmail: 'institucion@example.uy' } }))
  await page.route('**/api/applications/drafts', route => route.fulfill({ status: 201, json: {
    id: 'theme-draft', token: 'theme-token', expiresAt: '2099-01-01T00:00:00Z',
  } }))
  await page.route('**/api/applications/drafts/theme-draft', route => route.fulfill({ json: {
    id: 'theme-draft', status: 'draft', expiresAt: '2099-01-01T00:00:00Z', documents: [],
  } }))
  await page.route('**/api/applications/drafts/theme-draft/captcha', route => route.fulfill({ json: {
    question: '2 + 3', token: 'theme-captcha',
  } }))
  await page.goto('/solicitud')
}

async function contrast(locator: Locator) {
  return locator.evaluate((element) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const context = canvas.getContext('2d')!
    function rgba(color: string) {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      return Array.from(context.getImageData(0, 0, 1, 1).data)
    }
    function composite(front: number[], back: number[]) {
      const alpha = front[3] / 255
      return front.slice(0, 3).map((channel, i) => channel * alpha + back[i] * (1 - alpha))
    }
    function luminance(color: number[]) {
      const channels = color.map((channel) => {
        const normalized = channel / 255
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
      })
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
    }
    const ancestors: Element[] = []
    for (let current: Element | null = element; current; current = current.parentElement) ancestors.unshift(current)
    let background = [255, 255, 255]
    for (const ancestor of ancestors) background = composite(rgba(getComputedStyle(ancestor).backgroundColor), background)
    const foreground = composite(rgba(getComputedStyle(element).color), background)
    const values = [luminance(background), luminance(foreground)].sort((a, b) => b - a)
    return (values[0] + 0.05) / (values[1] + 0.05)
  })
}

test('el formulario mantiene texto legible con el modo oscuro del sistema', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await openStep(page, 6)
  const form = page.locator('.form-page')
  await expect(form).toHaveAttribute('data-theme', 'light')
  expect(await form.evaluate(element => getComputedStyle(element).colorScheme)).toContain('light')
  expect(await form.evaluate(element => getComputedStyle(element).colorScheme)).not.toContain('dark')
  await expect(page.getByRole('heading', { name: 'Documentación requerida' })).toBeVisible()
  const notice = page.getByRole('note', { name: 'Certificado de buena conducta' })
  await expect(notice.getByRole('link', { name: 'institucion@example.uy' })).toBeVisible()
  expect(await contrast(notice.getByRole('heading'))).toBeGreaterThanOrEqual(4.5)
  expect(await contrast(notice.locator('p').first())).toBeGreaterThanOrEqual(4.5)
  expect(await contrast(notice.getByRole('link'))).toBeGreaterThanOrEqual(4.5)
  const documentTitle = page.getByText(/^Cédula de identidad del aspirante/)
  expect(await contrast(documentTitle)).toBeGreaterThanOrEqual(4.5)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: test.info().outputPath('documentacion-sistema-oscuro.png'), fullPage: true })
})

test('fecha y controles móviles conservan tamaño, descripción y foco accesibles', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await openStep(page, 1)
  const date = page.getByLabel('Fecha de nacimiento')
  await expect(date).toHaveValue(contract.baseline.applicant.birthDate)
  expect(await date.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16)
  expect((await date.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  const age = page.getByLabel('Edad', { exact: true })
  await expect(age).toHaveAttribute('aria-describedby', 'age-hint')
  expect(await contrast(page.locator('#age-hint'))).toBeGreaterThanOrEqual(4.5)
  const next = page.getByRole('button', { name: 'Continuar', exact: false })
  expect((await next.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await date.focus()
  await expect(date).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.setViewportSize({ width: 320, height: 700 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('los errores del formulario tienen contraste y están asociados al control', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await openStep(page, 1)
  const fullName = page.getByLabel('Nombre completo')
  await fullName.fill('')
  await page.getByRole('button', { name: 'Continuar', exact: false }).click()
  await expect(fullName).toHaveAttribute('aria-invalid', 'true')
  await expect(fullName).toHaveAttribute('aria-describedby', 'full-name-error')
  await expect(page.locator('#full-name-error')).toBeVisible()
  expect(await contrast(page.locator('#full-name-error'))).toBeGreaterThanOrEqual(4.5)
})

test('la landing conserva su tema y el formulario su tema al navegar con sistema oscuro', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await expect(page.locator('.landing-page')).toHaveAttribute('data-theme', 'lavalleja')
  await page.getByRole('link', { name: 'Iniciar inscripción', exact: true }).click()
  await expect(page.locator('.form-page')).toHaveAttribute('data-theme', 'light')
  await expect(page.getByRole('heading', { name: 'Solicitud de beca de alojamiento', exact: true })).toBeVisible()
  expect(await contrast(page.getByRole('heading', { level: 1 }))).toBeGreaterThanOrEqual(4.5)
})
