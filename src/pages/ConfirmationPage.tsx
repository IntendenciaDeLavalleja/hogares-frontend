import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { retryConfirmationEmail } from '../api/applications'
import { FormLayout } from '../components/layout/FormLayout'
import { PageContainer } from '../components/layout/PageContainer'
import { useApplicationStore } from '../store/applicationStore'

export function ConfirmationPage() {
  const receipt = useApplicationStore((state) => state.submissionReceipt)
  const draft = useApplicationStore((state) => state.backendDraft)
  const email = useApplicationStore((state) => state.application.contactEmail)
  const setReceipt = useApplicationStore((state) => state.setSubmissionReceipt)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  if (!receipt) return <Navigate to="/" replace />

  async function retry() {
    if (!draft || sending) return
    setSending(true)
    setError('')
    try { setReceipt(await retryConfirmationEmail(draft)) }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo enviar el correo.') }
    finally { setSending(false) }
  }

  return <FormLayout><PageContainer className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center py-12">
    <section className="w-full max-w-2xl rounded-box border border-base-300 bg-base-100 p-6 text-center shadow-sm sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-2xl text-success" aria-hidden="true">✓</div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-primary">Solicitud recibida</p>
      <h1 className="mt-2 text-3xl font-semibold">Tu solicitud fue enviada</h1>
      <p className="mx-auto mt-4 max-w-lg leading-7 text-base-content/65">La información y los documentos quedaron registrados correctamente. Conservá el código para consultar tu trámite.</p>
      <div className="my-7 rounded-box bg-base-200 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-base-content/50">Código de seguimiento</p>
        <p className="mt-2 break-all text-2xl font-bold tracking-wider text-primary">{receipt.trackingCode}</p>
        <p className="mt-2 text-xs text-base-content/55">Enviada el {new Date(receipt.submittedAt).toLocaleString('es-UY')}</p>
      </div>
      {receipt.confirmationEmailSent === true && <p role="status" className="rounded-box bg-success/10 p-4 text-sm leading-6">Enviamos la confirmación a <strong className="break-all">{email}</strong>. Si no la encontrás, revisá la carpeta de correo no deseado.</p>}
      {receipt.confirmationEmailSent === false && <div className="rounded-box bg-warning/10 p-4 text-sm leading-6" role="status">
        <p>Tu trámite está registrado, pero no pudimos enviar el correo de confirmación. Guardá el código que aparece arriba.</p>
        {draft && <button type="button" className="btn btn-outline btn-sm mt-3" disabled={sending} onClick={() => void retry()}>{sending ? 'Enviando…' : 'Reintentar correo de confirmación'}</button>}
      </div>}
      {error && <p role="alert" className="mt-3 text-sm text-error">{error}</p>}
      <p className="mt-5 text-sm leading-6 text-base-content/60">Podés consultar desde la página principal con tu código y el correo registrado. La recepción no implica la adjudicación de la beca.</p>
      <a href="/#seguimiento" className="btn btn-primary mt-7">Seguir mi trámite</a>
      <Link to="/" className="btn btn-ghost mt-3 sm:ml-3 sm:mt-7">Ir al inicio</Link>
    </section>
  </PageContainer></FormLayout>
}
