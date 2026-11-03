import { FormField, Input, Textarea, YesNo } from '../../../components/form/FormField'
import { SectionHeader } from '../../../components/form/SectionHeader'
import { useApplicationStore } from '../../../store/applicationStore'
import { parseNumber } from '../utils/number'
import { sanitizeDigits } from '../utils/text'

export function StepHealth({ errors }: { errors: Record<string, string> }) {
  const health = useApplicationStore((state) => state.application.health)
  const updateHealth = useApplicationStore((state) => state.updateHealth)

  return (
    <div>
      <SectionHeader eyebrow="Etapa 4" title="Asistencia en salud" description="Esta información se utiliza para conocer apoyos o cuidados que puedan ser necesarios durante la estadía." />
      <div className="grid gap-4 sm:grid-cols-2">
        <YesNo id="disability" label="¿Se encuentra en situación de discapacidad?" value={health.hasDisability} onChange={(value) => updateHealth({ hasDisability: value, dailyLivingSupports: value ? health.dailyLivingSupports : '' })} error={errors.disabilityChoice} />
        {health.hasDisability && <div className="sm:col-span-2"><FormField id="daily-living-supports" label="¿Qué apoyos o adaptaciones necesita en la vida diaria?" required error={errors.dailyLivingSupports} hint="Por ejemplo, apoyos para desplazarse, comunicarse, estudiar o realizar actividades cotidianas. Si no necesita apoyos, indíquelo."><Textarea id="daily-living-supports" rows={4} maxLength={2000} value={health.dailyLivingSupports} onChange={(e) => updateHealth({ dailyLivingSupports: e.target.value })} error={errors.dailyLivingSupports} /></FormField></div>}
        <div className="sm:col-span-2"><FormField id="health-center" label="¿En qué centro de salud recibe asistencia médica?" required error={errors.healthCenter}><Input id="health-center" value={health.healthCenter} onChange={(e) => updateHealth({ healthCenter: e.target.value })} error={errors.healthCenter} /></FormField></div>
        <YesNo id="chronic-disease" label="¿Padece alguna enfermedad crónica?" value={health.hasChronicDisease} onChange={(value) => updateHealth({ hasChronicDisease: value, chronicDisease: value ? health.chronicDisease : '', inTreatment: value ? health.inTreatment : null })} error={errors.chronicDiseaseChoice} />
        {health.hasChronicDisease && <FormField id="chronic-disease-detail" label="Especificar enfermedad" required error={errors.chronicDisease}><Input id="chronic-disease-detail" value={health.chronicDisease} onChange={(e) => updateHealth({ chronicDisease: e.target.value })} error={errors.chronicDisease} /><p className="mt-1 text-xs text-base-content/55">Diabetes, celiaquía, asma, epilepsia u otras.</p></FormField>}
        {health.hasChronicDisease && <YesNo id="in-treatment" label="¿Se encuentra actualmente en tratamiento?" value={health.inTreatment} onChange={(value) => updateHealth({ inTreatment: value })} error={errors.treatmentChoice} />}
        <YesNo id="controlled-medication" label="¿Toma medicación controlada?" value={health.takesControlledMedication} onChange={(value) => updateHealth({ takesControlledMedication: value, controlledMedication: value ? health.controlledMedication : '' })} error={errors.medicationChoice} />
        {health.takesControlledMedication && <FormField id="controlled-medication-detail" label="Especificar medicación" required error={errors.controlledMedication}><Input id="controlled-medication-detail" value={health.controlledMedication} onChange={(e) => updateHealth({ controlledMedication: e.target.value })} error={errors.controlledMedication} /></FormField>}
        <YesNo id="neurodevelopment" label="¿Ha presentado un diagnóstico relativo al neurodesarrollo durante su vida?" value={health.hasNeurodevelopmentDiagnosis} onChange={(value) => updateHealth({ hasNeurodevelopmentDiagnosis: value })} error={errors.neurodevelopment} />
        <YesNo id="allergy" label="¿Padece alguna alergia?" value={health.hasAllergy} onChange={(value) => updateHealth({ hasAllergy: value, allergy: value ? health.allergy : '' })} error={errors.allergyChoice} />
        {health.hasAllergy && <FormField id="allergy-detail" label="Especificar alergia" required error={errors.allergy}><Input id="allergy-detail" value={health.allergy} onChange={(e) => updateHealth({ allergy: e.target.value })} error={errors.allergy} /></FormField>}
      </div>
      <div className="my-7 border-t border-base-300" />
      <h2 className="mb-4 text-lg font-semibold">Contacto en caso de necesidad o emergencia</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField id="emergency-name" label="Nombre" required error={errors.emergencyName}><Input id="emergency-name" value={health.emergencyName} onChange={(e) => updateHealth({ emergencyName: e.target.value })} error={errors.emergencyName} /></FormField>
        <FormField id="emergency-phone" label="Teléfono" error={errors.emergencyPhone}><Input id="emergency-phone" type="tel" value={health.emergencyPhone} onChange={(e) => updateHealth({ emergencyPhone: sanitizeDigits(e.target.value) })} inputMode="tel" maxLength={20} error={errors.emergencyPhone} /></FormField>
        <FormField id="emergency-mobile" label="Celular" required error={errors.emergencyMobile}><Input id="emergency-mobile" type="tel" value={health.emergencyMobile} onChange={(e) => updateHealth({ emergencyMobile: sanitizeDigits(e.target.value) })} error={errors.emergencyMobile} inputMode="tel" maxLength={20} /></FormField>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <YesNo id="scholarship" label="¿Actualmente recibe alguna beca de estudios?" value={health.receivesScholarship} onChange={(value) => updateHealth({ receivesScholarship: value, scholarship: value ? health.scholarship : '' })} error={errors.scholarshipChoice} />
        {health.receivesScholarship && <FormField id="scholarship-detail" label="Especificar beca" required error={errors.scholarship}><Input id="scholarship-detail" value={health.scholarship} onChange={(e) => updateHealth({ scholarship: e.target.value })} error={errors.scholarship} /></FormField>}
        <YesNo id="currently-works" label="¿Actualmente trabaja?" value={health.currentlyWorks} onChange={(value) => updateHealth({ currentlyWorks: value, workplace: value ? health.workplace : '', monthlySalary: value ? health.monthlySalary : '' })} error={errors.workChoice} />
        {health.currentlyWorks && <FormField id="workplace" label="Lugar de trabajo" required error={errors.workplace}><Input id="workplace" value={health.workplace} onChange={(e) => updateHealth({ workplace: e.target.value })} error={errors.workplace} /></FormField>}
        {health.currentlyWorks && <FormField id="monthly-salary" label="Remuneración nominal mensual" required error={errors.monthlySalary}><Input id="monthly-salary" type="number" min="0" max="1000000000" step="0.01" value={health.monthlySalary} onChange={(e) => updateHealth({ monthlySalary: parseNumber(e.target.value) })} error={errors.monthlySalary} /></FormField>}
      </div>
    </div>
  )
}
