import { describe, expect, it } from 'vitest'
import contract from '../contracts/documents.json' with { type: 'json' }
import { getRequiredDocuments } from '../../src/features/application/constants/steps'
import { validateStep } from '../../src/features/application/utils/validation'
import type { ApplicationFormData } from '../../src/features/application/types/application'

function merge(base: Record<string, unknown>, changes: Record<string, unknown>): Record<string, unknown> {
  const result = structuredClone(base)
  for (const [key, value] of Object.entries(changes)) {
    result[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? merge(result[key] as Record<string, unknown>, value as Record<string, unknown>) : value
  }
  return result
}

function baseline(): ApplicationFormData {
  return structuredClone(contract.baseline) as ApplicationFormData
}

describe('Contrato de documentación compartido con el backend', () => {
  for (const scenario of contract.cases) {
    it(scenario.name, () => {
      const application = merge(contract.baseline, scenario.changes) as unknown as ApplicationFormData
      expect(getRequiredDocuments(application).map(({ type }) => type).sort()).toEqual(scenario.required)
    })
  }
})

it('permite solicitar alojamiento sin padres y viviendo solo', () => {
  const application = baseline()
  application.household = { livesAlone: true, motherSituation: 'deceased', fatherSituation: 'unknown', livesWithMother: false, livesWithFather: false }
  application.householdMembers = []
  expect(validateStep(4, application)).toEqual({})
  application.household.motherSituation = 'outside'
  expect(validateStep(4, application)['parent-missing-mother']).toBeTruthy()
})

it('exige describir apoyos cuando hay discapacidad y evita pedirlos cuando no corresponde', () => {
  const application = baseline()
  application.health.hasDisability = true
  application.health.dailyLivingSupports = '   '
  expect(validateStep(3, application).dailyLivingSupports).toBeTruthy()
  application.health.dailyLivingSupports = 'No necesita apoyos.'
  expect(validateStep(3, application)).toEqual({})
  application.health.hasDisability = false
  application.health.dailyLivingSupports = ''
  expect(validateStep(3, application)).toEqual({})
})

it('deja de exigir documentos al cambiar de respuesta', () => {
  const application = baseline()
  application.socioeconomic.car.owns = true
  application.socioeconomic.housingStatus = 'tenant'
  expect(validateStep(6, application).documents).toBeTruthy()
  application.socioeconomic.car.owns = false
  application.socioeconomic.housingStatus = 'usufruct'
  application.documents = getRequiredDocuments(application).map(({ type }) => ({ type, status: 'ready', name: type, referenceId: type }))
  expect(validateStep(6, application)).toEqual({})
  application.socioeconomic.car.owns = true
  expect(validateStep(6, application).documents).toContain('1 documento')
})
