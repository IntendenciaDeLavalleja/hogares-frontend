import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AutoSaveIndicator } from '../components/form/AutoSaveIndicator'
import { FormNavigation } from '../components/form/FormNavigation'
import { FormStepper } from '../components/form/FormStepper'
import { FormLayout } from '../components/layout/FormLayout'
import { PageContainer } from '../components/layout/PageContainer'
import { useApplicationStore } from '../store/applicationStore'
import { APPLICATION_YEAR } from '../features/application/constants/steps'
import { StepApplication } from '../features/application/steps/StepApplication'
import { StepApplicant } from '../features/application/steps/StepApplicant'
import { StepStudies } from '../features/application/steps/StepStudies'
import { StepHealth } from '../features/application/steps/StepHealth'
import { StepHousehold } from '../features/application/steps/StepHousehold'
import { StepSocioeconomic } from '../features/application/steps/StepSocioeconomic'
import { StepDocuments } from '../features/application/steps/StepDocuments'
import { StepReview } from '../features/application/steps/StepReview'
import { SubmissionConfirmation } from '../features/application/components/SubmissionConfirmation'
import type { ConfirmationCaptcha } from '../features/application/types/application'
import { ApiError, finalizeApplication } from '../api/applications'
import { ensureApplicationDraft } from '../features/application/services/applicationDraft'
import { validateStep } from '../features/application/utils/validation'

type Errors = Record<string, string>


export function ApplicationPage() {
  const currentStep = useApplicationStore((state) => state.currentStep)
  const application = useApplicationStore((state) => state.application)
  const setCurrentStep = useApplicationStore((state) => state.setCurrentStep)
  const nextStep = useApplicationStore((state) => state.nextStep)
  const previousStep = useApplicationStore((state) => state.previousStep)
  const [errors, setErrors] = useState<Errors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [captcha, setCaptcha] = useState<ConfirmationCaptcha | null>(null)
  const [captchaAttempt, setCaptchaAttempt] = useState(0)
  const setSubmissionReceipt = useApplicationStore((state) => state.setSubmissionReceipt)
  const navigate = useNavigate()

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const goNext = () => {
    const nextErrors = validateStep(currentStep, application)
    setErrors(nextErrors)
    if (!Object.keys(nextErrors).length) {
      nextStep()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setTimeout(() => {
        const firstErrorEl = document.querySelector('[aria-invalid="true"], [role="alert"]')
        firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    }
  }

  const goBack = () => {
    setErrors({})
    previousStep()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finish = async () => {
    if (isSubmitting) return
    for (let index = 0; index < 7; index += 1) {
      const sectionErrors = validateStep(index, application)
      if (Object.keys(sectionErrors).length) {
        setCurrentStep(index)
        setErrors(sectionErrors)
        setSubmitError('Revisá esta sección antes de enviar la solicitud.')
        return
      }
    }
    const nextErrors = validateStep(7, application)
    if (!captcha?.token || !/^\d{1,2}$/.test(captcha.answer)) nextErrors.captcha = 'Completá la verificación numérica.'
    setErrors(nextErrors)
    setSubmitError(null)
    if (Object.keys(nextErrors).length || !captcha) return
    setIsSubmitting(true)
    try {
      const draft = await ensureApplicationDraft()
      const receipt = await finalizeApplication(draft, application, captcha)
      setSubmissionReceipt(receipt)
      navigate('/comprobante')
    } catch (error) {
      setCaptcha(null)
      setCaptchaAttempt((value) => value + 1)
      if (error instanceof ApiError && error.details?.fields && typeof error.details.fields === 'object') {
        const fields = error.details.fields as Record<string, unknown>
        if (fields.contactEmail) setErrors((previous) => ({ ...previous, contactEmail: 'Revisá el correo electrónico ingresado.' }))
        if (fields.captcha) setErrors((previous) => ({ ...previous, captcha: 'Resolvé la nueva verificación.' }))
      }
      if (error instanceof ApiError && Array.isArray(error.details?.missingDocuments)) {
        setSubmitError('Falta subir documentación obligatoria. Volvé a Documentación y completá los archivos indicados.')
      } else {
        setSubmitError(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const step = [
    <StepApplication errors={errors} onClearError={clearError} />,
    <StepApplicant errors={errors} onClearError={clearError} />,
    <StepStudies errors={errors} />,
    <StepHealth errors={errors} />,
    <StepHousehold errors={errors} onClearError={clearError} />,
    <StepSocioeconomic errors={errors} onClearError={clearError} />,
    <StepDocuments errors={errors} />,
    <><StepReview onEdit={(index) => { setCurrentStep(index); setErrors({}); window.scrollTo({ top: 0, behavior: 'smooth' }) }} errors={errors} /><SubmissionConfirmation key={captchaAttempt} value={captcha} onChange={setCaptcha} errors={errors} /></>
  ][currentStep]

  return <FormLayout><PageContainer className="py-6 sm:py-8"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Solicitud de alojamiento</p><p className="mt-1 text-sm text-base-content/55">Hogares Estudiantiles · Convocatoria {APPLICATION_YEAR}</p></div><AutoSaveIndicator /></div><FormStepper currentStep={currentStep} onSelect={(index) => { setCurrentStep(index); setErrors({}); setSubmitError(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }} /><section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-8">{step}{submitError && <div className="alert alert-error mt-6" role="alert"><span>{submitError}</span>{currentStep === 7 && <button type="button" className="btn btn-sm" onClick={() => setCurrentStep(6)}>Ir a Documentación</button>}</div>}<FormNavigation currentStep={currentStep} onBack={goBack} onNext={goNext} onSubmit={() => void finish()} canSubmit={!isSubmitting} submitting={isSubmitting} /></section></PageContainer></FormLayout>
}
