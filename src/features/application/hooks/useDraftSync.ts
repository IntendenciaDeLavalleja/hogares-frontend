import { useEffect, useState } from 'react'
import { useApplicationStore } from '../../../store/applicationStore'
import { ensureApplicationDraft, persistApplicationDraft, refreshApplicationDraft } from '../services/applicationDraft'

export function useDraftSync() {
  const application = useApplicationStore((state) => state.application)
  const currentStep = useApplicationStore((state) => state.currentStep)
  const draftId = useApplicationStore((state) => state.backendDraft?.id)
  const receipt = useApplicationStore((state) => state.submissionReceipt)
  const [message, setMessage] = useState('Las respuestas se guardan en este dispositivo.')
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!draftId || receipt) return
    let active = true
    void refreshApplicationDraft().catch(() => {
      if (active) setMessage('Tus respuestas siguen guardadas en este dispositivo. Se reintentará la conexión.')
    })
    return () => { active = false }
  }, [draftId, receipt])

  useEffect(() => {
    if (receipt || (!draftId && (currentStep < 2 || !application.applicant.fullName.trim()))) return
    let active = true
    const timer = window.setTimeout(() => {
      setMessage('Guardando tus respuestas…')
      void ensureApplicationDraft().then(persistApplicationDraft).then(() => {
        if (active) { setMessage('Tus respuestas están guardadas. La inscripción se completa al pulsar Enviar.'); setFailed(false) }
      }).catch(() => {
        if (active) { setMessage('No se pudo respaldar la última edición. Tus respuestas siguen en este dispositivo.'); setFailed(true) }
      })
    }, 1000)
    return () => { active = false; window.clearTimeout(timer) }
  }, [application, currentStep, draftId, receipt, retry])

  return { message, failed, retry: () => setRetry((value) => value + 1) }
}
