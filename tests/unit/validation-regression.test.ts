import { describe, expect, it } from 'vitest'
import contract from '../contracts/documents.json' with { type: 'json' }
import type { ApplicationFormData } from '../../src/features/application/types/application'
import { APPLICATION_YEAR } from '../../src/features/application/constants/steps'
import { validateStep } from '../../src/features/application/utils/validation'
import { mapServerValidation } from '../../src/features/application/utils/serverValidation'

function baseline(): ApplicationFormData {
  return structuredClone(contract.baseline) as ApplicationFormData
}

describe('validaciones del formulario antes del envío', () => {
  it('acepta los datos válidos de las secciones antes de los adjuntos', () => {
    const app = baseline()
    for (let step = 0; step < 6; step += 1) expect(validateStep(step, app)).toEqual({})
  })

  it('marca nombres demasiado cortos, domicilio y localidad con las mismas longitudes del servidor', () => {
    const app = baseline()
    app.applicant.fullName = 'Li'
    app.applicant.address = '12'
    app.applicant.locality = 'M'
    expect(validateStep(1, app)).toMatchObject({ fullName: expect.any(String), address: expect.any(String), locality: expect.any(String) })
  })

  it('no permite avanzar con espacios en los campos obligatorios', () => {
    const app = baseline()
    app.applicant.address = '   '
    app.studies.institution = '   '
    app.health.hasAllergy = true
    app.health.allergy = '   '
    expect(validateStep(1, app).address).toBeTruthy()
    expect(validateStep(2, app).institution).toBeTruthy()
    expect(validateStep(3, app).allergy).toBeTruthy()
  })

  it.each(['2025-02-30', '2024-13-01', 'not-a-date', '1800-01-01'])('rechaza la fecha de nacimiento inválida %s', (value) => {
    const app = baseline()
    app.applicant.birthDate = value
    expect(validateStep(1, app).birthDate).toBeTruthy()
  })

  it('acepta una fecha real de año bisiesto', () => {
    const app = baseline()
    app.applicant.birthDate = '2004-02-29'
    expect(validateStep(1, app).birthDate).toBeUndefined()
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])('rechaza valores numéricos no finitos (%s)', (value) => {
    const app = baseline()
    app.studies.average = value
    app.health.currentlyWorks = true
    app.health.workplace = 'Trabajo'
    app.health.monthlySalary = value
    expect(validateStep(2, app).average).toBeTruthy()
    expect(validateStep(3, app).monthlySalary).toBeTruthy()
  })

  it('no acepta enteros fuera de rango o fracciones en cantidades y años', () => {
    const app = baseline()
    app.request = { ...app.request, type: 'renewal', sameHome: true, renewalYear: 2020.5 }
    app.studies.hasPendingSubjects = true
    app.studies.pendingSubjectsCount = 101
    app.socioeconomic.car = { owns: true, quantity: 101, brand: 'Marca', year: APPLICATION_YEAR - 0.5 }
    expect(validateStep(0, app).renewalYear).toBeTruthy()
    expect(validateStep(2, app).pendingSubjectsCount).toBeTruthy()
    expect(validateStep(5, app)).toMatchObject({ 'car-quantity': expect.any(String), 'car-year': expect.any(String) })
  })

  it('señala cadenas que superan los límites del servidor en datos de salud y familiares', () => {
    const app = baseline()
    app.health.healthCenter = 'a'.repeat(181)
    app.health.receivesScholarship = true
    app.health.scholarship = 'a'.repeat(251)
    app.householdMembers[0].occupation = 'a'.repeat(181)
    expect(validateStep(3, app)).toMatchObject({ healthCenter: expect.any(String), scholarship: expect.any(String) })
    expect(validateStep(4, app)['member-member-1-occupation']).toBeTruthy()
  })

  it('no valida datos antiguos de vehículos cuando se declaró que no tiene', () => {
    const app = baseline()
    app.socioeconomic.car = { owns: false, quantity: -1, brand: '', year: 2099 }
    expect(validateStep(5, app)).toEqual({})
  })

  it('conserva el cero como un ingreso declarado válido', () => {
    const app = baseline()
    app.health.currentlyWorks = true
    app.health.workplace = 'Actividad'
    app.health.monthlySalary = 0
    app.householdMembers[0].monthlyIncome = 0
    expect(validateStep(3, app)).toEqual({})
    expect(validateStep(4, app)).toEqual({})
  })

  it('permite campos opcionales ausentes en un borrador anterior', () => {
    const app = baseline()
    delete (app.householdMembers[0] as Partial<typeof app.householdMembers[number]>).occupation
    delete (app.householdMembers[0] as Partial<typeof app.householdMembers[number]>).address
    expect(validateStep(4, app)).toEqual({})
  })
})

describe('errores del servidor orientados a la sección que debe corregirse', () => {
  it('señala el campo del aspirante y traduce mensajes de Marshmallow', () => {
    const mapped = mapServerValidation({ applicant: { address: ['Length must be between 3 and 255.'] } }, baseline())
    expect(mapped).toEqual({ step: 1, errors: { address: 'Ingresá entre 3 y 255 caracteres.' }, messages: ['Domicilio: Ingresá entre 3 y 255 caracteres.'] })
  })

  it('resuelve índices de integrantes a los ids reales y marca el monto correspondiente', () => {
    const app = baseline()
    app.householdMembers[0].id = 'real-member-id'
    const mapped = mapServerValidation({ householdMembers: { 0: { monthlyIncome: ['Not a valid number.'], employmentStatus: ['Must be one of: formal_employee, student.'] } } }, app)
    expect(mapped?.step).toBe(4)
    expect(mapped?.errors).toEqual({ 'member-real-member-id-income': 'Ingresá un número válido.', 'member-real-member-id-employment': 'Seleccioná una de las opciones indicadas.' })
    expect(mapped?.messages[0]).toContain('Integrante 1 · Ingresos mensuales')
  })

  it('localiza un progenitor no conviviente por su id y traduce su monto', () => {
    const app = baseline()
    app.outsideParents = [{ id: 'father-id', role: 'father', name: 'Nombre', surnames: 'Apellido', relationship: 'Padre', age: 40, occupation: '', childSupportIncome: '', nationalId: '' }]
    const mapped = mapServerValidation({ outsideParents: { 0: { childSupportIncome: ['Must be greater than or equal to 0 and less than or equal to 1000000000.'] } } }, app)
    expect(mapped?.step).toBe(4)
    expect(mapped?.errors['parent-father-id-support']).toContain('entre 0 y 1000000000')
    expect(mapped?.messages[0]).toContain('Padre · Pensión alimenticia')
  })

  it('mapea el vehículo, las preguntas de salud y los errores generales de documentación', () => {
    const app = baseline()
    expect(mapServerValidation({ socioeconomic: { motorcycle: { year: ['El año no es válido.'] }, rural: { leaseAmount: ['Not a valid number.'] } } }, app)?.errors).toEqual({ 'motorcycle-year': 'El año no es válido.', leaseAmount: 'Ingresá un número válido.' })
    expect(mapServerValidation({ health: { hasDisability: ['Field may not be null.'], inTreatment: ['Missing data for required field.'] } }, app)?.errors).toEqual({ disabilityChoice: 'Completá este campo.', treatmentChoice: 'Completá este campo.' })
    expect(mapServerValidation({ documents: ['Faltan documentos.'] }, app)).toEqual({ step: 6, errors: { documents: 'Faltan documentos.' }, messages: ['Documentación: Faltan documentos.'] })
  })

  it('regresa al primer paso con errores sin perder la explicación de los restantes', () => {
    const mapped = mapServerValidation({ contactEmail: ['Not a valid email address.'], studies: { institution: ['Missing data for required field.'] }, captcha: ['Resolvé una nueva verificación.'] }, baseline())
    expect(mapped?.step).toBe(2)
    expect(mapped?.errors).toEqual({ institution: 'Completá este campo.' })
    expect(mapped?.messages).toHaveLength(3)
    expect(mapped?.messages).toContain('Correo electrónico: Ingresá un correo electrónico válido.')
  })

  it('no inventa errores cuando la respuesta no incluye mensajes válidos', () => {
    expect(mapServerValidation({}, baseline())).toBeNull()
    expect(mapServerValidation({ applicant: null, health: [] }, baseline())).toBeNull()
  })
})
