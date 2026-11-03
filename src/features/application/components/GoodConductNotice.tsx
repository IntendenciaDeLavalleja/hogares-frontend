import { useEffect, useState } from 'react'
import { apiClient } from '../../../api/axios'

export function GoodConductNotice() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    apiClient.get<{ goodConductEmail: string }>('/applications/institution').then(({ data }) => {
      if (active) setEmail(data.goodConductEmail)
    }).catch(() => { if (active) setFailed(true) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  return <div role="alert" className="mb-5 rounded-box border border-warning/40 bg-warning/10 p-5 text-sm leading-6">
    <h2 className="font-semibold">Certificado de buena conducta</h2>
    <p className="mt-2">Para aspirantes mayores de edad, el certificado debe enviarlo el Ministerio del Interior directamente a la institución solicitante. No lo adjuntes al formulario.</p>
    {loading ? <p className="mt-2">Cargando correo de recepción…</p> : email ? <p className="mt-2">Indicá este correo institucional al realizar la gestión: <a className="break-all font-semibold text-primary underline" href={`mailto:${email}`}>{email}</a>.</p> : <p className="mt-2">{failed ? 'No se pudo consultar el correo de recepción.' : 'El correo de recepción está pendiente de publicación.'} Consultá a la Dirección de Servicios Sociales antes de gestionar el certificado.</p>}
    <p className="mt-2">Podés enviar tu inscripción mientras se gestiona el certificado. La institución registrará su recepción.</p>
  </div>
}
