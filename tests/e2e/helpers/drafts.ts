import type { Page } from '@playwright/test'

// Isolate presentation/navigation tests from any local or production backend.
// Submission and uploads have their own explicit API fixtures.
export async function mockDraftAutosave(page: Page) {
  const draft = { id: 'isolated-browser-draft', token: 'isolated-browser-token', expiresAt: '2099-01-01T00:00:00Z' }
  let data: Record<string, unknown> | null = null
  const snapshot = () => ({ ...draft, status: 'draft', documents: [], data })
  await page.route('**/api/applications/drafts', route => {
    data = route.request().postData() ? route.request().postDataJSON() : null
    return route.fulfill({ status: 201, json: draft })
  })
  await page.route('**/api/applications/drafts/*', route => {
    if (route.request().method() === 'PUT') data = route.request().postDataJSON()
    return route.fulfill({ json: snapshot() })
  })
  await page.route('**/api/applications/drafts/*/captcha', route => route.fulfill({ json: { question: '2 + 3', token: 'isolated-captcha' } }))
}
