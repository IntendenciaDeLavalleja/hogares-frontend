import { expect, test, type Page } from '@playwright/test'
import contract from '../contracts/documents.json' with { type: 'json' }

const trackingResult = {
  trackingCode: 'HE27-PRUEBA123', status: 'submitted', statusLabel: 'Recibida',
  message: 'Tu solicitud quedó registrada. La recepción no implica la adjudicación de la beca.',
  submittedAt: '2026-10-29T15:30:00Z', home: 'minas', applicationType: 'new', applicationYear: 2027,
}

async function seedProgress(page: Page, receipt = false) {
  await page.addInitScript(({ application, receipt }) => {
    localStorage.setItem('idl-hogares-estudiantiles-2026', JSON.stringify({ version: 2, state: {
      application, currentStep: 3, backendDraft: null,
      submissionReceipt: receipt ? { id: 'test-id', trackingCode: 'HE27-PRUEBA123', submittedAt: '2026-10-29T15:30:00Z', confirmationEmailSent: true } : null,
    } }))
  }, { application: contract.baseline, receipt })
}

test('la landing conserva el diseño institucional y abre el formulario con su tema original', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Hogares Estudiantiles de la Intendencia de Lavalleja')
  await expect(page.getByText('Inscripciones a partir del')).toHaveCount(0)
  await expect(page.locator('#contacto')).toContainText('4442 2752')
  await page.getByRole('link', { name: 'Iniciar inscripción', exact: true }).click()
  await expect(page).toHaveURL(/\/solicitud$/)
  await expect(page.getByText('Paso 1 de 8', { exact: true })).toBeVisible()
  await expect(page.locator('.landing-page')).toHaveCount(0)
  expect(await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(244, 246, 248)')
})

test('continuar una inscripción conserva el paso y los datos guardados', async ({ page }) => {
  await seedProgress(page)
  await page.goto('/')
  await page.getByRole('link', { name: 'Continuar inscripción', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Asistencia en salud' })).toBeVisible()
  await expect(page.locator('#health-center')).toHaveValue('ASSE')
})

test('conserva el comprobante y permite iniciar otra solicitud con confirmación', async ({ page }) => {
  await seedProgress(page, true)
  await page.goto('/')
  await page.getByRole('link', { name: 'Ver comprobante', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tu solicitud fue enviada' })).toBeVisible()
  await page.getByRole('main').getByRole('link', { name: 'Ir al inicio', exact: true }).click()
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('button', { name: 'Nueva solicitud', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Ver comprobante', exact: true })).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Nueva solicitud', exact: true }).click()
  await expect(page).toHaveURL(/\/solicitud$/)
  await expect(page.getByText('Paso 1 de 8', { exact: true })).toBeVisible()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('idl-hogares-estudiantiles-2026')!).state)
  expect(saved.application.applicant.fullName).toBe('')
  expect(saved.submissionReceipt).toBeNull()
})

test('la consulta usa el código y correo existentes y muestra el estado recibido', async ({ page }) => {
  let resolveRequest: () => void = () => {}
  const responseReady = new Promise<void>(resolve => { resolveRequest = resolve })
  await page.route('**/api/applications/track', async route => {
    expect(route.request().postDataJSON()).toEqual({ trackingCode: 'HE27-PRUEBA123', email: 'aspirante@example.uy' })
    await responseReady
    await route.fulfill({ json: trackingResult })
  })
  await page.goto('/#seguimiento')
  await page.getByLabel('Código de seguimiento').fill('he27-prueba123')
  await page.getByLabel('Correo registrado').fill('aspirante@example.uy')
  await page.getByRole('button', { name: 'Consultar estado', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Consultando…' })).toBeDisabled()
  await expect(page.getByLabel('Código de seguimiento')).toBeDisabled()
  resolveRequest()
  await expect(page.locator('#seguimiento [role="status"]')).toContainText('Recibida')
  await expect(page.locator('#seguimiento [role="status"]')).toContainText('HE27-PRUEBA123')
  await expect(page.locator('#seguimiento [role="status"]')).toContainText('Minas', { ignoreCase: true })
})

test('los errores de seguimiento se muestran y se puede volver a consultar', async ({ page }) => {
  let calls = 0
  await page.route('**/api/applications/track', route => {
    calls += 1
    return calls === 1
      ? route.fulfill({ status: 404, json: { error: 'No encontramos un trámite con ese código y correo. Revisá ambos datos.' } })
      : route.fulfill({ json: trackingResult })
  })
  await page.goto('/#seguimiento')
  await page.getByLabel('Código de seguimiento').fill('HE27-INCORRECTO')
  await page.getByLabel('Correo registrado').fill('aspirante@example.uy')
  await page.getByRole('button', { name: 'Consultar estado', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('No encontramos un trámite')
  await page.getByLabel('Código de seguimiento').fill('HE27-PRUEBA123')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.getByRole('button', { name: 'Consultar estado', exact: true }).click()
  await expect(page.locator('#seguimiento [role="status"]')).toContainText('Recibida')
})

test('el acceso a seguimiento funciona en la navegación de escritorio y móvil', async ({ page, isMobile }) => {
  await page.goto('/')
  if (isMobile) {
    await page.getByRole('button', { name: 'Abrir menú de navegación' }).click()
    const dialog = page.getByRole('dialog', { name: 'Menú de navegación' })
    await expect(dialog.getByRole('button', { name: 'Cerrar menú de navegación' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Abrir menú de navegación' })).toBeFocused()
    await page.getByRole('button', { name: 'Abrir menú de navegación' }).click()
    await dialog.getByRole('link', { name: 'Seguí tu trámite', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    expect(await page.locator('body').evaluate(element => element.style.overflow)).not.toBe('hidden')
  } else {
    await page.getByRole('navigation', { name: 'Navegación principal', exact: true }).getByRole('link', { name: 'Seguí tu trámite', exact: true }).click()
  }
  await expect(page).toHaveURL(/#seguimiento$/)
  await expect(page.getByLabel('Código de seguimiento')).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('las fuentes locales y las animaciones respetan la CSP de producción', async ({ page }) => {
  const errors: string[] = []
  const externalRequests: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('request', request => { if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) externalRequests.push(request.url()) })
  await page.route('**/', async route => {
    if (!route.request().isNavigationRequest()) return route.continue()
    const response = await route.fetch()
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" } })
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.fonts.check('900 24px "Archivo Variable"'))).toBe(true)
  expect(await page.evaluate(() => document.fonts.check('italic 24px "Instrument Serif"'))).toBe(true)
  const menuButton = page.getByRole('button', { name: 'Abrir menú de navegación' })
  if (await menuButton.isVisible()) {
    await menuButton.click()
    await page.getByRole('button', { name: 'Cerrar menú de navegación' }).click()
  }
  await page.waitForLoadState('networkidle')
  expect(errors).toEqual([])
  expect(externalRequests).toEqual([])
})
