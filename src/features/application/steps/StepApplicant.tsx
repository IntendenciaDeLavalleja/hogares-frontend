import { FormField, Input } from '../../../components/form/FormField'
import { SectionHeader } from '../../../components/form/SectionHeader'
import { useApplicationStore } from '../../../store/applicationStore'
import { calculateAge } from '../utils/age'
import { sanitizeDigits, sanitizeNationalId } from '../utils/text'

export function StepApplicant({
  errors,
  onClearError,
}: {
  errors: Record<string, string>
  onClearError?: (key: string) => void
}) {
  const applicant = useApplicationStore((state) => state.application.applicant)
  const updateApplicant = useApplicationStore((state) => state.updateApplicant)
  const update = (data: Partial<typeof applicant>) => {
    updateApplicant(data)
    Object.keys(data).forEach((key) => onClearError?.(key))
  }
  const age = calculateAge(applicant.birthDate)

  return (
    <div>
      <SectionHeader eyebrow="Etapa 2" title="Datos del aspirante" description="Ingresá los datos personales de quien solicita el alojamiento." />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="full-name" label="Nombre completo" required error={errors.fullName}><Input id="full-name" value={applicant.fullName} onChange={(e) => update({ fullName: e.target.value })} error={errors.fullName} autoComplete="name" minLength={3} maxLength={180} /></FormField>
        <FormField id="national-id" label="Cédula de identidad" required hint="Solo se admiten números, puntos y guion." error={errors.nationalId}><Input id="national-id" value={applicant.nationalId} onChange={(e) => update({ nationalId: sanitizeNationalId(e.target.value) })} error={errors.nationalId} inputMode="numeric" pattern="[0-9.\-]+" maxLength={12} /></FormField>
        <FormField id="birth-date" label="Fecha de nacimiento" required error={errors.birthDate}><Input id="birth-date" type="date" max={new Date().toISOString().slice(0, 10)} value={applicant.birthDate} onChange={(e) => update({ birthDate: e.target.value })} error={errors.birthDate} /></FormField>
        <FormField id="age" label="Edad" hint="Se calcula automáticamente a partir de la fecha de nacimiento."><Input id="age" value={age === null ? '' : `${age} años`} readOnly className="bg-base-200" /></FormField>
        <FormField id="address" label="Domicilio" required hint="Lugar donde reside con su familia." error={errors.address}><Input id="address" value={applicant.address} onChange={(e) => update({ address: e.target.value })} error={errors.address} autoComplete="street-address" minLength={3} maxLength={255} /></FormField>
        <FormField id="locality" label="Localidad / ciudad" required error={errors.locality}><Input id="locality" value={applicant.locality} onChange={(e) => update({ locality: e.target.value })} error={errors.locality} minLength={2} maxLength={120} /></FormField>
        <FormField id="phone" label="Número de teléfono" required error={errors.phone}><Input id="phone" type="tel" value={applicant.phone} onChange={(e) => update({ phone: sanitizeDigits(e.target.value) })} error={errors.phone} inputMode="tel" maxLength={20} /></FormField>
        <FormField id="own-mobile" label="Celular propio" error={errors.ownMobile}><Input id="own-mobile" type="tel" value={applicant.ownMobile} onChange={(e) => update({ ownMobile: sanitizeDigits(e.target.value) })} inputMode="tel" maxLength={20} error={errors.ownMobile} /></FormField>
        <FormField id="responsible-mobile" label="Celular de madre, padre o responsable" error={errors.responsibleMobile}><Input id="responsible-mobile" type="tel" value={applicant.responsibleMobile} onChange={(e) => update({ responsibleMobile: sanitizeDigits(e.target.value) })} inputMode="tel" maxLength={20} error={errors.responsibleMobile} /></FormField>
      </div>
    </div>
  )
}
