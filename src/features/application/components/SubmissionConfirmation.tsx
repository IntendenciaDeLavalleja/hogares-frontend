import { useEffect, useState } from 'react'
import { FormField, Input } from '../../../components/form/FormField'
import { getConfirmationCaptcha } from '../../../api/applications'
import { useApplicationStore } from '../../../store/applicationStore'
import { ensureApplicationDraft } from '../services/applicationDraft'
import type { ConfirmationCaptcha } from '../types/application'

export function SubmissionConfirmation({ value, onChange, errors }: {
  value: ConfirmationCaptcha | null
  onChange: (value: ConfirmationCaptcha | null) => void
  errors: Record<string, string>
}) {
  const email = useApplicationStore((state) => state.application.contactEmail)
  const update = useApplicationStore((state) => state.updateApplication)
  const [question, setQuestion] = useState('')
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    ensureApplicationDraft().then(getConfirmationCaptcha).then((challenge) => {
      if (active) {
        setQuestion(challenge.question)
        onChange({ token: challenge.token, answer: '' })
      }
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : 'No se pudo cargar la verificación.')
    })
    return () => { active = false }
  }, [reload, onChange])

  function refresh() {
    onChange(null)
    setQuestion('')
    setLoadError('')
    setReload((value) => value + 1)
  }

  return <section className="mt-7 rounded-box border border-base-300 bg-base-100 p-5 sm:p-6" aria-labelledby="confirmation-heading">
    <h2 id="confirmation-heading" className="text-lg font-semibold">Confirmación y seguimiento</h2>
    <p className="mt-2 text-sm leading-6 text-base-content/65">Ingresá un correo al que tengas acceso. Allí recibirás la confirmación y el código para seguir tu trámite.</p>
    <div className="mt-5 grid gap-5 sm:grid-cols-2">
      <FormField id="contactEmail" label="Correo electrónico" required error={errors.contactEmail}>
        <Input id="contactEmail" type="email" autoComplete="email" maxLength={254} value={email} error={errors.contactEmail} onChange={(event) => update({ contactEmail: event.target.value })} placeholder="nombre@correo.com" />
      </FormField>
      <div>
        <FormField id="confirmation-captcha" label={question ? `Verificación: ¿cuánto es ${question}?` : 'Verificación numérica'} required error={errors.captcha}>
          <Input id="confirmation-captcha" inputMode="numeric" autoComplete="off" maxLength={2} disabled={!question || !value} value={value?.answer ?? ''} error={errors.captcha} onChange={(event) => { if (value) onChange({ ...value, answer: event.target.value.replace(/\D/g, '') }) }} placeholder={question ? 'Resultado de la suma' : 'Cargando…'} />
        </FormField>
        {loadError && <p className="mt-2 text-sm text-error" role="alert">{loadError}</p>}
        <button type="button" className="mt-2 text-sm font-medium text-primary underline underline-offset-4" onClick={refresh}>Obtener otra verificación</button>
      </div>
    </div>
  </section>
}
