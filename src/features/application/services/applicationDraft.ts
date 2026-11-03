import { createApplicationDraft } from '../../../api/applications'
import { useApplicationStore } from '../../../store/applicationStore'
import type { BackendDraft } from '../types/application'

let pendingDraft: Promise<BackendDraft> | null = null

export async function ensureApplicationDraft(): Promise<BackendDraft> {
  const existing = useApplicationStore.getState().backendDraft
  if (existing && new Date(existing.expiresAt).getTime() > Date.now()) return existing
  if (!pendingDraft) {
    const state = useApplicationStore.getState()
    state.updateApplication({
      documents: state.application.documents.map((document) => ({
        ...document,
        referenceId: undefined,
        status: 'error',
      })),
    })
    pendingDraft = createApplicationDraft().then((draft) => {
      useApplicationStore.getState().setBackendDraft(draft)
      return draft
    }).finally(() => { pendingDraft = null })
  }
  return pendingDraft
}
