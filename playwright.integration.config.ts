import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173'
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(baseURL).hostname)) {
  throw new Error('Las pruebas de inscripción real requieren un frontend local; nunca deben apuntar a producción.')
}

export default defineConfig({
  testDir: './tests/integration',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  use: {
    baseURL,
    locale: 'es-UY',
    colorScheme: 'dark',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
  },
  projects: [
    { name: 'integration-desktop', use: { ...devices['Desktop Chrome'], browserName: 'chromium' } },
    { name: 'integration-android', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
    { name: 'integration-iphone', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
  ],
})
