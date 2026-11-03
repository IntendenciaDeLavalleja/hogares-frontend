import { ApiError, createApplicationDraft, getApplicationDraft, saveApplicationDraft, snapshotReceipt, storedDocumentMetadata } from '../../../api/applications'
import { useApplicationStore } from '../../../store/applicationStore'
import type { BackendDraft, DocumentMetadata, DraftSnapshot } from '../types/application'
import { getPreparedDocumentFile } from '../utils/preparedFiles'

let pendingDraft: Promise<BackendDraft> | null = null
let pendingSave: Promise<unknown> = Promise.resolve()

export async function ensureApplicationDraft(): Promise<BackendDraft> {
  const existing = useApplicationStore.getState().backendDraft
  if (existing && new Date(existing.expiresAt).getTime() > Date.now()) return existing
  if (!pendingDraft) {
    const data = useApplicationStore.getState().application
    const session = useApplicationStore.getState().applicationSession
    pendingDraft = createApplicationDraft(data).then((draft) => {
      const state = useApplicationStore.getState()
      if (state.applicationSession !== session) throw new ApiError('La solicitud cambió antes de completar la conexión. Volvé a intentar.')
      state.setBackendDraft(draft)
      // Only invalidate references after a replacement draft exists. A failed
      // connection must never erase already uploaded document references.
      state.updateApplication({ documents: state.application.documents.map((document) => document.referenceId
        ? { ...document, referenceId: undefined, status: 'error' as const } : document) })
      return draft
    }).finally(() => { pendingDraft = null })
  }
  return pendingDraft
}

export async function recoverApplicationDraft(draft: BackendDraft, error: unknown): Promise<BackendDraft> {
  if (!(error instanceof ApiError) || ![403, 404, 410].includes(error.status ?? 0)) throw error
  const state = useApplicationStore.getState()
  if (state.backendDraft?.id === draft.id) state.setBackendDraft(null)
  return ensureApplicationDraft()
}

export function persistApplicationDraft(draft: BackendDraft): Promise<DraftSnapshot | null> {
  const save = async () => {
    const state = useApplicationStore.getState()
    if (state.backendDraft?.id !== draft.id || state.submissionReceipt) return null
    try { return await saveApplicationDraft(draft, state.application) }
    catch (error) {
      // Allows frontend/backend rollouts to overlap briefly with the prior API.
      if (error instanceof ApiError && error.status === 405) return null
      throw error
    }
  }
  const result = pendingSave.catch(() => {}).then(save)
  pendingSave = result
  return result
}

export function applyDraftSnapshot(snapshot: DraftSnapshot, beforeRead?: DocumentMetadata[]) {
  const state = useApplicationStore.getState()
  if (state.backendDraft?.id !== snapshot.id) return
  const receipt = snapshotReceipt(snapshot)
  if (receipt) { state.setSubmissionReceipt(receipt); return }
  const documents = new Map(state.application.documents.map((document) => [document.type, document]))
  const changedSinceRead = (document: DocumentMetadata | undefined) => beforeRead && document?.referenceId !== beforeRead.find((before) => before.type === document?.type)?.referenceId
  for (const stored of snapshot.documents) {
    const local = documents.get(stored.type)
    if (changedSinceRead(local)) continue
    if ((local?.status === 'uploading' || local?.status === 'pending') && getPreparedDocumentFile(stored.type)) continue
    documents.set(stored.type, { ...storedDocumentMetadata(stored), name: local?.referenceId === stored.id ? local.name : stored.name })
  }
  for (const [type, local] of documents) {
    if (!changedSinceRead(local) && !snapshot.documents.some((document) => document.type === type) && !getPreparedDocumentFile(type)) {
      documents.set(type, { ...local, referenceId: undefined, status: 'error' })
    }
  }
  const next = [...documents.values()] as DocumentMetadata[]
  if (JSON.stringify(next) !== JSON.stringify(state.application.documents)) state.updateApplication({ documents: next })
}

export async function refreshApplicationDraft(): Promise<DraftSnapshot | null> {
  const draft = useApplicationStore.getState().backendDraft
  if (!draft) return null
  const beforeRead = useApplicationStore.getState().application.documents.map((document) => ({ ...document }))
  const snapshot = await getApplicationDraft(draft)
  applyDraftSnapshot(snapshot, beforeRead)
  return snapshot
}
