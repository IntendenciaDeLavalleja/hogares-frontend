import { expect, test, type Page } from '@playwright/test'
import contract from '../contracts/documents.json' with { type: 'json' }

test('la página principal carga sus recursos sin errores de JavaScript o CSP', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('body')).not.toContainText('NaN')
  await page.waitForLoadState('networkidle')
  expect(errors).toEqual([])
})

async function openStep(page: Page, currentStep: number, legacy = false) {
  const application = structuredClone(contract.baseline) as Record<string, unknown>
  if (legacy) {
    const health = application.health as Record<string, unknown>
    delete health.hasDisability
    delete health.dailyLivingSupports
    application.household = { livesWithMother: true, livesWithFather: false }
  }
  await page.addInitScript(({ application, currentStep }) => {
    localStorage.setItem('idl-hogares-estudiantiles-2026', JSON.stringify({ state: { application, currentStep, backendDraft: null }, version: 2 }))
  }, { application, currentStep })
  await page.route('**/api/applications/institution', (route) => route.fulfill({ json: { goodConductEmail: 'institucion@example.uy' } }))
  await page.goto('/solicitud')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}

test('discapacidad: apoyos condicionales y persistencia al editar', async ({ page }) => {
  await openStep(page, 3)
  const choice = page.getByRole('group', { name: '¿Se encuentra en situación de discapacidad?' })
  await choice.getByText('Sí', { exact: true }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Describí los apoyos' })).toBeVisible()
  await page.getByLabel('¿Qué apoyos o adaptaciones necesita en la vida diaria?').fill('Apoyo para desplazarse y adaptar el espacio de estudio.')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('heading', { name: 'Personas con las que convive' })).toBeVisible()
  await page.getByRole('button', { name: 'Anterior' }).click()
  await expect(page.getByLabel('¿Qué apoyos o adaptaciones necesita en la vida diaria?')).toHaveValue('Apoyo para desplazarse y adaptar el espacio de estudio.')
  await choice.getByText('No', { exact: true }).click()
  await expect(page.getByLabel('¿Qué apoyos o adaptaciones necesita en la vida diaria?')).toHaveCount(0)
})

test('sin padres y viviendo solo: permite avanzar sin fichas ficticias', async ({ page }) => {
  await openStep(page, 4)
  await page.getByLabel('Situación de la madre').selectOption('deceased')
  await page.getByLabel('Situación del padre').selectOption('unknown')
  await page.getByRole('group', { name: '¿Vivís solo/a?' }).getByText('Sí', { exact: true }).click()
  await expect(page.getByRole('button', { name: '+ Agregar integrante' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '+ Agregar madre' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('heading', { name: 'Situación socioeconómica', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText(/^Cédulas del núcleo familiar/)).toHaveCount(0)
  await expect(page.getByText(/^Constancia de Tránsito sobre vehículos/)).toHaveCount(0)
  await page.screenshot({ path: test.info().outputPath('documentos-sin-convivientes.png'), fullPage: true })
})

test('documentos se recalculan al cambiar vehículos y vivienda', async ({ page }) => {
  await openStep(page, 6)
  await expect(page.getByText(/^Constancia de Tránsito sobre vehículos/)).toHaveCount(0)
  await expect(page.getByText(/^DICOSE/)).toHaveCount(0)
  await expect(page.getByText(/^Recibo de alquiler/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Anterior' }).click()
  await page.getByLabel('¿En qué calidad ocupa la vivienda el núcleo familiar?').selectOption('tenant')
  await page.getByLabel('Monto mensual del alquiler').fill('15000')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText(/^Recibo de alquiler/)).toBeVisible()
  await page.getByRole('button', { name: 'Anterior' }).click()
  await page.getByLabel('¿En qué calidad ocupa la vivienda el núcleo familiar?').selectOption('usufruct')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText(/^Recibo de alquiler/)).toHaveCount(0)
})

test('un borrador anterior recupera valores y exige responder la pregunta nueva', async ({ page }) => {
  await openStep(page, 3, true)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'situación de discapacidad' })).toBeVisible()
  await page.getByRole('group', { name: '¿Se encuentra en situación de discapacidad?' }).getByText('No', { exact: true }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByLabel('Situación de la madre')).toHaveValue('lives_with')
  await expect(page.getByLabel('Situación del padre')).toHaveValue('outside')
})
