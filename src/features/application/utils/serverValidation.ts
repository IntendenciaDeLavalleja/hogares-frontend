import type { ApplicationFormData } from '../types/application'

export interface ServerValidationResult {
  step: number
  errors: Record<string, string>
  messages: string[]
}

interface FieldLocation { step: number; key: string; label: string }

const labels: Record<string, string> = {
  home: 'Hogar', type: 'Tipo de solicitud', renewalYear: 'Año de ingreso', sameHome: 'Continuidad en el hogar',
  fullName: 'Nombre completo', nationalId: 'Cédula', birthDate: 'Fecha de nacimiento', address: 'Domicilio', locality: 'Localidad', phone: 'Teléfono', ownMobile: 'Celular propio', responsibleMobile: 'Celular del responsable',
  grade: 'Año o grado', institution: 'Institución', previousInstitution: 'Centro educativo anterior', average: 'Promedio', hasPendingSubjects: 'Materias pendientes', pendingSubjectsCount: 'Cantidad de materias pendientes',
  healthCenter: 'Centro de salud', hasDisability: 'Situación de discapacidad', dailyLivingSupports: 'Apoyos y adaptaciones', hasChronicDisease: 'Enfermedad crónica', chronicDisease: 'Detalle de enfermedad crónica', inTreatment: 'Tratamiento', takesControlledMedication: 'Medicación controlada', controlledMedication: 'Detalle de medicación', hasNeurodevelopmentDiagnosis: 'Diagnóstico de neurodesarrollo', hasAllergy: 'Alergias', allergy: 'Detalle de alergia', emergencyName: 'Contacto de emergencia', emergencyPhone: 'Teléfono de emergencia', emergencyMobile: 'Celular de emergencia', receivesScholarship: 'Beca de estudios', scholarship: 'Detalle de beca', currentlyWorks: 'Trabajo actual', workplace: 'Lugar de trabajo', monthlySalary: 'Remuneración mensual',
  livesAlone: 'Convivencia', motherSituation: 'Situación de la madre', fatherSituation: 'Situación del padre',
  surnames: 'Apellidos', names: 'Nombres', name: 'Nombre', relationship: 'Parentesco', age: 'Edad', occupation: 'Ocupación', monthlyIncome: 'Ingresos mensuales', employmentStatus: 'Situación laboral', childSupportIncome: 'Pensión alimenticia',
  housingStatus: 'Ocupación de la vivienda', rentAmount: 'Monto del alquiler', installmentAmount: 'Cuota de vivienda', notes: 'Aclaraciones', quantity: 'Cantidad', brand: 'Marca', year: 'Año', ownsField: 'Propiedad de campo', leasesField: 'Arrendamiento de campo', leaseAmount: 'Monto del arrendamiento',
}

const healthKeys: Record<string, string> = {
  hasDisability: 'disabilityChoice', hasChronicDisease: 'chronicDiseaseChoice', inTreatment: 'treatmentChoice', takesControlledMedication: 'medicationChoice', hasNeurodevelopmentDiagnosis: 'neurodevelopment', hasAllergy: 'allergyChoice', receivesScholarship: 'scholarshipChoice', currentlyWorks: 'workChoice',
}

function fieldLocation(path: string[], app: ApplicationFormData): FieldLocation {
  const [section, field, child] = path
  const label = labels[field] ?? 'Datos de la sección'
  if (section === 'contactEmail') return { step: 7, key: 'contactEmail', label: 'Correo electrónico' }
  if (section === 'captcha') return { step: 7, key: 'captcha', label: 'Verificación numérica' }
  if (section === 'acceptedDeclaration') return { step: 7, key: 'acceptedDeclaration', label: 'Declaración final' }
  if (section === 'request') return { step: 0, key: field && field !== '_schema' ? field : 'type', label: field === '_schema' ? 'Solicitud' : label }
  if (section === 'applicant') return { step: 1, key: field && field !== '_schema' ? field : 'fullName', label: field === '_schema' ? 'Datos del aspirante' : label }
  if (section === 'studies') return { step: 2, key: field === 'hasPendingSubjects' ? 'pendingSubjects' : field && field !== '_schema' ? field : 'institution', label: field === '_schema' ? 'Estudios' : label }
  if (section === 'health') return { step: 3, key: healthKeys[field] ?? (field && field !== '_schema' ? field : 'healthCenter'), label: field === '_schema' ? 'Salud' : label }
  if (section === 'household') return { step: 4, key: field === 'livesWithMother' ? 'motherSituation' : field === 'livesWithFather' ? 'fatherSituation' : field && field !== '_schema' ? field : 'members', label: field === '_schema' ? 'Convivencia' : label }
  if (section === 'householdMembers') {
    const member = app.householdMembers[Number(field)]
    if (!member || !/^\d+$/.test(field ?? '')) return { step: 4, key: 'members', label: 'Personas convivientes' }
    const suffix = ({ monthlyIncome: 'income', employmentStatus: 'employment', nationalId: 'ci' } as Record<string, string>)[child] ?? child
    return { step: 4, key: !suffix || suffix === '_schema' ? `member-${member.id}` : `member-${member.id}-${suffix}`, label: `Integrante ${Number(field) + 1} · ${labels[child] ?? 'Datos personales'}` }
  }
  if (section === 'outsideParents') {
    const parent = app.outsideParents[Number(field)]
    if (!parent || !/^\d+$/.test(field ?? '')) return { step: 4, key: 'members', label: 'Progenitores no convivientes' }
    const suffix = child === 'childSupportIncome' ? 'support' : child
    return { step: 4, key: !suffix || ['_schema', 'nationalId'].includes(suffix) ? `parent-${parent.id}` : `parent-${parent.id}-${suffix}`, label: `${parent.role === 'mother' ? 'Madre' : 'Padre'} · ${labels[child] ?? 'Datos personales'}` }
  }
  if (section === 'socioeconomic') {
    if (field === 'car' || field === 'motorcycle') return { step: 5, key: !child || child === 'owns' ? field : child === '_schema' ? `${field}Details` : `${field}-${child}`, label: `${field === 'car' ? 'Automóvil' : 'Moto'} · ${labels[child] ?? 'Datos del vehículo'}` }
    if (field === 'rural') return { step: 5, key: child && child !== '_schema' ? child : 'leaseAmount', label: `Actividad rural · ${labels[child] ?? 'Datos del campo'}` }
    return { step: 5, key: field && field !== '_schema' ? field : 'housingStatus', label: field === '_schema' ? 'Vivienda y situación socioeconómica' : label }
  }
  if (section === 'documents' || section === 'missingDocuments') return { step: 6, key: 'documents', label: 'Documentación' }
  return { step: 7, key: 'serverValidation', label: 'Solicitud' }
}

function readableMessage(message: string): string {
  if (/Missing data for required field|Field may not be null/i.test(message)) return 'Completá este campo.'
  const lengthRange = /Length must be between (\d+) and (\d+)/i.exec(message)
  if (lengthRange) return `Ingresá entre ${lengthRange[1]} y ${lengthRange[2]} caracteres.`
  const maxLength = /Longer than maximum length (\d+)/i.exec(message)
  if (maxLength) return `No superes ${maxLength[1]} caracteres.`
  const minLength = /Shorter than minimum length (\d+)/i.exec(message)
  if (minLength) return `Ingresá al menos ${minLength[1]} caracteres.`
  const range = /Must be greater than or equal to ([\d.-]+) and less than or equal to ([\d.-]+)/i.exec(message)
  if (range) return `Ingresá un valor entre ${range[1]} y ${range[2]}.`
  if (/Not a valid (integer|number)/i.test(message)) return 'Ingresá un número válido.'
  if (/Not a valid date/i.test(message)) return 'Ingresá una fecha válida.'
  if (/Not a valid email/i.test(message)) return 'Ingresá un correo electrónico válido.'
  if (/Not a valid (boolean|choice)|Must be one of/i.test(message)) return 'Seleccioná una de las opciones indicadas.'
  if (/Unknown field/i.test(message)) return 'Revisá los datos guardados de esta sección.'
  if (/String does not match expected pattern/i.test(message)) return 'Revisá el formato de este campo.'
  if (/Not a valid|Invalid input type|Must be equal to/i.test(message)) return 'Revisá y completá este campo.'
  return message
}

export function mapServerValidation(fields: Record<string, unknown>, application: ApplicationFormData): ServerValidationResult | null {
  const entries: Array<{ location: FieldLocation; message: string }> = []
  function visit(value: unknown, path: string[]) {
    if (typeof value === 'string' && value.trim()) entries.push({ location: fieldLocation(path, application), message: readableMessage(value) })
    else if (Array.isArray(value)) for (let index = 0; index < value.length; index += 1) visit(value[index], typeof value[index] === 'string' ? path : [...path, String(index)])
    else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) visit(child, [...path, key])
  }
  visit(fields, [])
  if (!entries.length) return null
  entries.sort((left, right) => left.location.step - right.location.step)
  const step = Math.min(...entries.map(({ location }) => location.step))
  const errors: Record<string, string> = {}
  for (const { location, message } of entries) {
    if (location.step !== step) continue
    errors[location.key] = errors[location.key] ? `${errors[location.key]} ${message}` : message
  }
  return { step, errors, messages: [...new Set(entries.map(({ location, message }) => `${location.label}: ${message}`))] }
}
