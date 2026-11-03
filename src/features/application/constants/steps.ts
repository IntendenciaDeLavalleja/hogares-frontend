import type { ApplicationFormData, DocumentType, RequiredDocument } from '../types/application'

export const APPLICATION_YEAR = Number(import.meta.env.VITE_APPLICATION_YEAR || new Date().getFullYear())

export const APPLICATION_STEPS = [
  { title: 'Solicitud', shortTitle: 'Solicitud' },
  { title: 'Aspirante', shortTitle: 'Aspirante' },
  { title: 'Estudios', shortTitle: 'Estudios' },
  { title: 'Salud', shortTitle: 'Salud' },
  { title: 'Núcleo familiar', shortTitle: 'Familia' },
  { title: 'Situación socioeconómica', shortTitle: 'Situación' },
  { title: 'Documentación', shortTitle: 'Documentos' },
  { title: 'Revisión', shortTitle: 'Revisión' },
] as const

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  applicant_id: 'Cédula de identidad del aspirante',
  household_ids: 'Cédulas del núcleo familiar',
  address: 'Constancia de domicilio',
  good_conduct: 'Certificado de buena conducta',
  income_proofs: 'Comprobantes de ingresos',
  income_affidavits: 'Declaraciones juradas de ingresos',
  unemployment_affidavits: 'Declaraciones juradas de desempleo',
  ute_receipt: 'Recibo de UTE',
  passport_photo: 'Foto carné',
  school_records: 'Escolaridad / calificaciones',
  health_card: 'Carné de adolescente o carné de salud vigente',
  housing: 'Documentación de vivienda',
  transit_certificate: 'Constancia de Tránsito sobre vehículos',
  dicose: 'DICOSE',
  medical_certificate: 'Constancia médica',
  rent_receipt: 'Recibo de alquiler',
  property_tax: 'Contribución inmobiliaria',
  installment_receipt: 'Recibo de cuota de vivienda',
}

export function getRequiredDocuments(application: ApplicationFormData): RequiredDocument[] {
  const { health, socioeconomic, householdMembers, outsideParents, request } = application
  const affidavitStatuses = ['self_employed', 'informal', 'seasonal']
  const hasIncomeAffidavits = householdMembers.some((member) => affidavitStatuses.includes(member.employmentStatus))
  const hasUnemploymentAffidavits = householdMembers.some((member) => member.employmentStatus === 'unemployed' && Number(member.age) >= 18)
  const hasIncomeProofs = health.currentlyWorks === true || health.receivesScholarship === true || outsideParents.some((parent) => Number(parent.childSupportIncome) > 0) || householdMembers.some((member) =>
    ['formal_employee', 'retired'].includes(member.employmentStatus) || (!affidavitStatuses.includes(member.employmentStatus) && Number(member.monthlyIncome) > 0))
  const documents: RequiredDocument[] = [
    { type: 'applicant_id', label: DOCUMENT_LABELS.applicant_id, description: 'Documento vigente y legible.', required: true },
    { type: 'address', label: DOCUMENT_LABELS.address, description: 'Constancia reciente del domicilio familiar.', required: true },
    { type: 'school_records', label: DOCUMENT_LABELS.school_records, description: 'Escolaridad correspondiente a los estudios declarados.', required: true },
    { type: 'health_card', label: DOCUMENT_LABELS.health_card, description: 'Carné vigente.', required: true },
    { type: 'ute_receipt', label: DOCUMENT_LABELS.ute_receipt, description: 'Recibo reciente del domicilio.', required: true },
    { type: 'passport_photo', label: DOCUMENT_LABELS.passport_photo, description: 'Foto actual tipo carné.', required: true },
  ]
  if (householdMembers.length) documents.push({ type: 'household_ids', label: DOCUMENT_LABELS.household_ids, description: 'Solo de las personas declaradas como convivientes.', required: true })
  if (hasIncomeProofs) documents.push({ type: 'income_proofs', label: DOCUMENT_LABELS.income_proofs, description: 'Recibos de sueldo, jubilación, beca u otros ingresos declarados que tengan comprobante.', required: true })
  if (hasIncomeAffidavits) documents.push({ type: 'income_affidavits', label: DOCUMENT_LABELS.income_affidavits, description: 'Para actividades sin recibo formal.', required: true })
  if (hasUnemploymentAffidavits) documents.push({ type: 'unemployment_affidavits', label: DOCUMENT_LABELS.unemployment_affidavits, description: 'Para integrantes mayores de edad desempleados.', required: true })
  if (socioeconomic.motorcycle.owns === true || socioeconomic.car.owns === true) documents.push({ type: 'transit_certificate', label: DOCUMENT_LABELS.transit_certificate, description: 'Solo por la moto o automóvil que declaraste tener.', required: true })
  if (health.hasChronicDisease || health.takesControlledMedication) documents.push({ type: 'medical_certificate', label: DOCUMENT_LABELS.medical_certificate, description: 'Constancia relacionada con la situación de salud declarada.', required: true })
  if (socioeconomic.housingStatus === 'tenant') documents.push({ type: 'rent_receipt', label: DOCUMENT_LABELS.rent_receipt, description: 'Recibo del alquiler vigente.', required: true })
  if (socioeconomic.housingStatus === 'owner') documents.push({ type: 'property_tax', label: DOCUMENT_LABELS.property_tax, description: 'Contribución inmobiliaria de la vivienda propia declarada.', required: true })
  if (socioeconomic.housingStatus === 'promissory_buyer') documents.push({ type: 'installment_receipt', label: DOCUMENT_LABELS.installment_receipt, description: 'Recibo de la cuota vigente.', required: true })
  if (socioeconomic.rural.ownsField || socioeconomic.rural.leasesField) documents.push({ type: 'dicose', label: DOCUMENT_LABELS.dicose, description: 'Por la propiedad o arrendamiento rural declarado.', required: true })
  if (request.type === 'renewal' && request.sameHome === true) {
    return documents.filter(({ type }) => !['applicant_id', 'address', 'school_records', 'ute_receipt'].includes(type))
  }
  return documents
}
