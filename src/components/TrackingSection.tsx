import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowUpRight, CheckCircle2, Search } from 'lucide-react'
import { trackApplication } from '../api/applications'
import type { ApplicationTracking } from '../features/application/types/application'
import { APPLICATION_YEAR } from '../features/application/constants/steps'
import { FormField, Input } from './form/FormField'

export function TrackingSection() {
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<ApplicationTracking | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    setResult(null)
    try { setResult(await trackApplication(code.trim(), email.trim())) }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo consultar el trámite.') }
    finally { setLoading(false) }
  }

  return <section id="seguimiento" className="landing-tracking border-b-2 border-ink bg-paper" aria-labelledby="tracking-heading">
    <div className="shell grid items-start gap-10 py-16 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:py-24">
      <div>
        <p className="eyebrow text-plum"><span className="eyebrow-dot" aria-hidden="true" />Consulta en línea</p>
        <h2 id="tracking-heading" className="display mt-6 text-[clamp(2.8rem,5.4vw,5.2rem)] leading-[0.9]">Seguí<br />tu trámite</h2>
        <p className="serif-accent mt-6 text-3xl leading-tight text-plum sm:text-4xl">Tu solicitud, paso a paso.</p>
        <p className="mt-5 max-w-md text-sm leading-7 text-ink/70">Si ya enviaste tu solicitud, ingresá el código del comprobante y el correo que registraste. Podés consultar desde cualquier dispositivo.</p>
      </div>
      <form onSubmit={(event) => void submit(event)} className="tracking-form min-w-0 rounded-3xl border-2 border-ink bg-cream p-5 shadow-hard sm:p-8" aria-label="Consultar estado de inscripción" aria-busy={loading}>
        <div className="mb-6 flex items-center gap-3 border-b border-ink/15 pb-5"><Search size={20} className="shrink-0 text-plum" aria-hidden="true" /><p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.13em]">Estado de inscripción</p></div>
        <fieldset disabled={loading} className="grid min-w-0 gap-5 sm:grid-cols-2">
          <FormField id="tracking-code" label="Código de seguimiento" required><Input id="tracking-code" value={code} maxLength={24} onChange={(event) => { setCode(event.target.value.toUpperCase()); setResult(null); setError('') }} placeholder={`HE${String(APPLICATION_YEAR).slice(-2)}-…`} autoComplete="off" /></FormField>
          <FormField id="tracking-email" label="Correo registrado" required><Input id="tracking-email" type="email" value={email} maxLength={254} onChange={(event) => { setEmail(event.target.value); setResult(null); setError('') }} placeholder="nombre@correo.com" autoComplete="email" /></FormField>
        </fieldset>
        <button type="submit" className="btn mt-6 max-w-full rounded-full border-2 border-ink bg-ink px-5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.1em] text-paper shadow-hard-sm transition-all hover:-translate-y-0.5 hover:border-plum hover:bg-plum hover:shadow-hard disabled:opacity-60" disabled={loading}>{loading ? 'Consultando…' : 'Consultar estado'}<ArrowUpRight size={16} aria-hidden="true" /></button>
        <p className="mt-5 font-mono text-[0.6rem] leading-5 text-ink/55">Encontrás tu código en el comprobante y en el correo de confirmación.</p>
        {error && <p role="alert" className="mt-5 rounded-xl border-2 border-error/30 bg-error/5 p-4 text-sm leading-6 text-error">{error}</p>}
        {result && <div role="status" className="mt-6 rounded-xl border-2 border-success/35 bg-success/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><strong className="break-all font-mono text-sm text-plum">{result.trackingCode}</strong><span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success"><CheckCircle2 size={14} aria-hidden="true" />{result.statusLabel}</span></div>
          <p className="mt-3 text-sm leading-6">{result.message}</p>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-ink/55">Fecha de recepción</dt><dd className="mt-1">{new Date(result.submittedAt).toLocaleString('es-UY')}</dd></div><div><dt className="text-ink/55">Hogar solicitado</dt><dd className="mt-1 capitalize">{result.home}</dd></div></dl>
        </div>}
      </form>
    </div>
  </section>
}
