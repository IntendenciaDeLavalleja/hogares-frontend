import { FormField, Input, YesNo } from '../../../components/form/FormField'
import { SectionHeader } from '../../../components/form/SectionHeader'
import { APPLICATION_YEAR } from '../constants/steps'
import { useApplicationStore } from '../../../store/applicationStore'
import type { StudentHome } from '../types/application'
import { parseNumber } from '../utils/number'

const homes: Array<[StudentHome, string, string]> = [
  ['minas', 'Minas', 'Hogar cercano al centro de Minas'],
  ['mariscala', 'Mariscala', 'Hogar de referencia para la zona este'],
  ['montevideo', 'Montevideo', 'Hogar para estudiantes en la capital'],
]

export function StepApplication({
  errors,
  onClearError,
}: {
  errors: Record<string, string>
  onClearError?: (key: string) => void
}) {
  const request = useApplicationStore((state) => state.application.request)
  const updateApplication = useApplicationStore((state) => state.updateApplication)
  const updateRequest = (data: Partial<typeof request>) => {
    updateApplication({ request: { ...request, ...data } })
    Object.keys(data).forEach((key) => onClearError?.(key))
  }

  return (
    <div>
      <SectionHeader eyebrow="Etapa 1" title="Solicitud de beca de alojamiento" description={`Hogares Estudiantiles de la Intendencia de Lavalleja. Completá la información para iniciar tu solicitud ${APPLICATION_YEAR}.`} />
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">¿A qué Hogar Estudiantil aspira? <span className="text-error">*</span></legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {homes.map(([value, title, description]) => <label key={value} className={`home-choice ${request.home === value ? 'home-choice-selected' : ''}`}><input className="sr-only" type="radio" name="home" value={value} checked={request.home === value} onChange={() => updateRequest({ home: value })} /><span className="text-lg font-semibold">{title}</span><span className="mt-1 text-xs leading-5 text-base-content/55">{description}</span></label>)}
        </div>
        {errors.home && <p className="mt-2 text-xs text-error" role="alert">{errors.home}</p>}
      </fieldset>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <fieldset>
          <legend className="label pb-1"><span className="label-text font-medium">¿Es la primera vez que aspira a una beca? <span className="text-error">*</span></span></legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={`choice-pill ${request.type === 'new' ? 'choice-pill-selected' : ''}`}><input type="radio" className="sr-only" name="application-type" checked={request.type === 'new'} onChange={() => updateRequest({ type: 'new', renewalYear: '', sameHome: null })} />Primera solicitud</label>
            <label className={`choice-pill ${request.type === 'renewal' ? 'choice-pill-selected' : ''}`}><input type="radio" className="sr-only" name="application-type" checked={request.type === 'renewal'} onChange={() => updateRequest({ type: 'renewal' })} />Renovación</label>
          </div>
          {errors.type && <p className="mt-2 text-xs text-error" role="alert">{errors.type}</p>}
        </fieldset>
        {request.type === 'renewal' && <div className="space-y-4"><FormField id="renewal-year" label="¿En qué año ingresó al Hogar Estudiantil?" required error={errors.renewalYear}><Input id="renewal-year" type="number" min="2000" max={APPLICATION_YEAR} step="1" value={request.renewalYear} onChange={(e) => updateRequest({ renewalYear: parseNumber(e.target.value) })} error={errors.renewalYear} /></FormField><YesNo id="same-home" label="¿Corresponde al mismo hogar?" value={request.sameHome} onChange={(value) => updateRequest({ sameHome: value })} error={errors.sameHome} /></div>}
      </div>
    </div>
  )
}
