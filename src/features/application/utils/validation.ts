import type { ApplicationFormData, NumericValue } from '../types/application'
import { APPLICATION_YEAR, getRequiredDocuments } from '../constants/steps'
import { isValidPersonName, isValidPhone, isValidUruguayanId } from './text'

type Errors = Record<string, string>

function required(errors: Errors, key: string, value: string | number | boolean | null | undefined, label: string) {
  if (value === '' || value === null || value === undefined) errors[key] = `${label} es obligatorio.`
}

function outsideRange(value: NumericValue, min: number, max: number): boolean {
  return typeof value === 'number' && (value < min || value > max)
}

export function validateStep(step: number, app: ApplicationFormData): Errors {
  const errors: Errors = {}
  if (step === 0) {
    required(errors, 'home', app.request.home, 'El hogar')
    required(errors, 'type', app.request.type, 'El tipo de solicitud')
    if (app.request.type === 'renewal') {
      required(errors, 'renewalYear', app.request.renewalYear, 'El año de ingreso')
      if (outsideRange(app.request.renewalYear, 2000, APPLICATION_YEAR)) errors.renewalYear = `Ingresá un año entre 2000 y ${APPLICATION_YEAR}.`
      if (app.request.sameHome === null) required(errors, 'sameHome', app.request.sameHome, 'La respuesta sobre el hogar')
    }
  }
  if (step === 1) {
    required(errors, 'fullName', app.applicant.fullName, 'El nombre completo')
    if (app.applicant.fullName && !isValidPersonName(app.applicant.fullName)) errors.fullName = 'Ingresá un nombre válido, sin números.'
    required(errors, 'nationalId', app.applicant.nationalId, 'La cédula de identidad')
    if (app.applicant.nationalId) {
      const digits = app.applicant.nationalId.replace(/\D/g, '')
      if (digits.length < 7 || digits.length > 8) {
        errors.nationalId = 'La cédula debe contener 7 u 8 dígitos.'
      } else if (!isValidUruguayanId(app.applicant.nationalId)) {
        errors.nationalId = 'El dígito verificador no es correcto. Revisá el número de cédula.'
      }
    }
    required(errors, 'birthDate', app.applicant.birthDate, 'La fecha de nacimiento')
    if (app.applicant.birthDate && app.applicant.birthDate > new Date().toISOString().slice(0, 10)) errors.birthDate = 'La fecha de nacimiento no puede ser futura.'
    required(errors, 'address', app.applicant.address, 'El domicilio')
    required(errors, 'locality', app.applicant.locality, 'La localidad')
    required(errors, 'phone', app.applicant.phone, 'El teléfono')
    if (app.applicant.phone && !isValidPhone(app.applicant.phone)) errors.phone = 'Ingresá entre 6 y 20 dígitos.'
    if (app.applicant.ownMobile && !isValidPhone(app.applicant.ownMobile)) errors.ownMobile = 'Ingresá entre 6 y 20 dígitos.'
    if (app.applicant.responsibleMobile && !isValidPhone(app.applicant.responsibleMobile)) errors.responsibleMobile = 'Ingresá entre 6 y 20 dígitos.'
  }
  if (step === 2) {
    required(errors, 'grade', app.studies.grade, 'El año o grado')
    required(errors, 'institution', app.studies.institution, 'La institución')
    if (app.studies.average !== '' && outsideRange(app.studies.average, 0, 12)) errors.average = 'El promedio debe estar entre 0 y 12.'
    if (app.studies.hasPendingSubjects === null) errors.pendingSubjects = 'Indicá si tiene materias pendientes.'
    if (app.studies.hasPendingSubjects && (app.studies.pendingSubjectsCount === '' || !Number.isInteger(app.studies.pendingSubjectsCount) || app.studies.pendingSubjectsCount < 1)) errors.pendingSubjectsCount = 'Ingresá una cantidad entera mayor que cero.'
  }
  if (step === 3) {
    if (app.health.hasDisability == null) errors.disabilityChoice = 'Indicá si se encuentra en situación de discapacidad.'
    if (app.health.hasDisability && !app.health.dailyLivingSupports.trim()) errors.dailyLivingSupports = 'Describí los apoyos o adaptaciones necesarios; si no necesita apoyos, indicalo.'
    required(errors, 'healthCenter', app.health.healthCenter, 'El centro de salud')
    if (app.health.hasChronicDisease === null) errors.chronicDiseaseChoice = 'Indicá si padece una enfermedad crónica.'
    if (app.health.hasChronicDisease && !app.health.chronicDisease) errors.chronicDisease = 'Especificá la enfermedad.'
    if (app.health.hasChronicDisease && app.health.inTreatment === null) errors.treatmentChoice = 'Indicá si se encuentra en tratamiento.'
    if (app.health.takesControlledMedication === null) errors.medicationChoice = 'Indicá si toma medicación controlada.'
    if (app.health.takesControlledMedication && !app.health.controlledMedication) errors.controlledMedication = 'Especificá la medicación.'
    if (app.health.hasNeurodevelopmentDiagnosis === null) errors.neurodevelopment = 'Indicá si corresponde.'
    if (app.health.hasAllergy === null) errors.allergyChoice = 'Indicá si padece alguna alergia.'
    if (app.health.hasAllergy && !app.health.allergy) errors.allergy = 'Especificá la alergia.'
    required(errors, 'emergencyName', app.health.emergencyName, 'El nombre de emergencia')
    required(errors, 'emergencyMobile', app.health.emergencyMobile, 'El celular de emergencia')
    if (app.health.emergencyPhone && !isValidPhone(app.health.emergencyPhone)) errors.emergencyPhone = 'Ingresá entre 6 y 20 dígitos.'
    if (app.health.emergencyMobile && !isValidPhone(app.health.emergencyMobile)) errors.emergencyMobile = 'Ingresá entre 6 y 20 dígitos.'
    if (app.health.receivesScholarship === null) errors.scholarshipChoice = 'Indicá si recibe una beca.'
    if (app.health.receivesScholarship && !app.health.scholarship) errors.scholarship = 'Especificá la beca.'
    if (app.health.currentlyWorks === null) errors.workChoice = 'Indicá si trabaja.'
    if (app.health.currentlyWorks && !app.health.workplace) errors.workplace = 'Indicá el lugar de trabajo.'
    if (app.health.currentlyWorks && (app.health.monthlySalary === '' || outsideRange(app.health.monthlySalary, 0, 1_000_000_000))) errors.monthlySalary = 'Ingresá una remuneración válida.'
  }
  if (step === 4) {
    if (app.household.livesAlone == null) errors.livesAlone = 'Indicá si vivís solo/a.'
    if (app.household.livesAlone === false && !app.householdMembers.length) errors.members = 'Agregá al menos una persona con la que convivas.'
    if (app.household.livesAlone && (app.householdMembers.length || app.household.motherSituation === 'lives_with' || app.household.fatherSituation === 'lives_with')) errors.members = 'Si vivís solo/a, no podés declarar personas convivientes.'
    app.householdMembers.forEach((member) => {
      let memberHasError = false
      if (!member.surnames || !member.surnames.trim()) {
        errors[`member-${member.id}-surnames`] = 'El apellido es obligatorio.'
        memberHasError = true
      } else if (!isValidPersonName(member.surnames)) {
        errors[`member-${member.id}-surnames`] = 'Ingresá un apellido válido (mínimo 2 letras, sin números).'
        memberHasError = true
      }

      if (!member.names || !member.names.trim()) {
        errors[`member-${member.id}-names`] = 'El nombre es obligatorio.'
        memberHasError = true
      } else if (!isValidPersonName(member.names)) {
        errors[`member-${member.id}-names`] = 'Ingresá un nombre válido (mínimo 2 letras, sin números).'
        memberHasError = true
      }

      if (!member.relationship || !member.relationship.trim()) {
        errors[`member-${member.id}-relationship`] = 'El parentesco con el aspirante es obligatorio.'
        memberHasError = true
      }

      if (member.age === '' || member.age === null || member.age === undefined) {
        errors[`member-${member.id}-age`] = 'La edad es obligatoria.'
        memberHasError = true
      } else if (!Number.isInteger(member.age) || outsideRange(member.age, 0, 120)) {
        errors[`member-${member.id}-age`] = 'Ingresá una edad entera válida entre 0 y 120 años.'
        memberHasError = true
      }

      if (!member.employmentStatus) {
        errors[`member-${member.id}-employment`] = 'Seleccioná la situación laboral.'
        memberHasError = true
      }

      if (member.monthlyIncome !== '' && member.monthlyIncome !== null && member.monthlyIncome !== undefined) {
        if (typeof member.monthlyIncome !== 'number' || isNaN(member.monthlyIncome) || outsideRange(member.monthlyIncome, 0, 1_000_000_000)) {
          errors[`member-${member.id}-income`] = 'Ingresá un monto de ingresos válido (mayor o igual a 0).'
          memberHasError = true
        }
      }

      if (member.nationalId && member.nationalId.trim()) {
        const digits = member.nationalId.replace(/\D/g, '')
        if (digits.length < 7 || digits.length > 8) {
          errors[`member-${member.id}-ci`] = 'La cédula debe contener 7 u 8 dígitos.'
          memberHasError = true
        } else if (!isValidUruguayanId(member.nationalId)) {
          errors[`member-${member.id}-ci`] = 'El dígito verificador no es correcto. Revisá la cédula.'
          memberHasError = true
        }
      }

      if (memberHasError) {
        errors[`member-${member.id}`] = 'Revisá los campos marcados en rojo en este integrante.'
      }
    })

    if (!app.household.motherSituation) errors.motherSituation = 'Indicá la situación de tu madre.'
    if (!app.household.fatherSituation) errors.fatherSituation = 'Indicá la situación de tu padre.'
    const requiredRoles = [app.household.motherSituation === 'outside' ? 'mother' : null, app.household.fatherSituation === 'outside' ? 'father' : null].filter(Boolean)
    requiredRoles.forEach((role) => {
      const parent = app.outsideParents.find((item) => item.role === role)
      if (!parent) {
        errors[`parent-missing-${role}`] = `Falta agregar los datos de ${role === 'mother' ? 'la madre' : 'el padre'} que no convive.`
      } else {
        let parentHasError = false
        if (!parent.surnames || !parent.surnames.trim()) {
          errors[`parent-${parent.id}-surnames`] = 'El apellido es obligatorio.'
          parentHasError = true
        } else if (!isValidPersonName(parent.surnames)) {
          errors[`parent-${parent.id}-surnames`] = 'Ingresá un apellido válido (mínimo 2 letras, sin números).'
          parentHasError = true
        }

        if (!parent.name || !parent.name.trim()) {
          errors[`parent-${parent.id}-name`] = 'El nombre es obligatorio.'
          parentHasError = true
        } else if (!isValidPersonName(parent.name)) {
          errors[`parent-${parent.id}-name`] = 'Ingresá un nombre válido (mínimo 2 letras, sin números).'
          parentHasError = true
        }

        if (!parent.relationship || !parent.relationship.trim()) {
          errors[`parent-${parent.id}-relationship`] = 'El parentesco es obligatorio.'
          parentHasError = true
        }

        if (parent.age === '' || parent.age === null || parent.age === undefined) {
          errors[`parent-${parent.id}-age`] = 'La edad es obligatoria.'
          parentHasError = true
        } else if (!Number.isInteger(parent.age) || outsideRange(parent.age, 0, 120)) {
          errors[`parent-${parent.id}-age`] = 'Ingresá una edad entera válida entre 0 y 120 años.'
          parentHasError = true
        }

        if (parent.childSupportIncome !== '' && parent.childSupportIncome !== null && parent.childSupportIncome !== undefined) {
          if (typeof parent.childSupportIncome !== 'number' || isNaN(parent.childSupportIncome) || outsideRange(parent.childSupportIncome, 0, 1_000_000_000)) {
            errors[`parent-${parent.id}-support`] = 'Ingresá un monto de pensión válido (mayor o igual a 0).'
            parentHasError = true
          }
        }

        if (parentHasError) {
          const roleLabel = role === 'mother' ? 'la madre' : 'el padre'
          errors[`parent-${parent.id}`] = `Revisá los campos marcados en rojo en ${roleLabel}.`
          errors[`parent-${role}`] = `Revisá los campos marcados en rojo en ${roleLabel}.`
        }
      }
    })
  }
  if (step === 5) {
    required(errors, 'housingStatus', app.socioeconomic.housingStatus, 'La calidad de ocupación')
    if (app.socioeconomic.housingStatus === 'tenant' && (app.socioeconomic.rentAmount === '' || outsideRange(app.socioeconomic.rentAmount, 0, 1_000_000_000))) errors.rentAmount = 'Ingresá un monto de alquiler válido.'
    if (app.socioeconomic.housingStatus === 'promissory_buyer' && (app.socioeconomic.installmentAmount === '' || outsideRange(app.socioeconomic.installmentAmount, 0, 1_000_000_000))) errors.installmentAmount = 'Ingresá un monto de cuota válido.'
    if (app.socioeconomic.motorcycle.owns === null) errors.motorcycle = 'Indicá si posee moto.'
    if (app.socioeconomic.motorcycle.owns) {
      if (app.socioeconomic.motorcycle.quantity === '' || app.socioeconomic.motorcycle.quantity < 1 || !Number.isInteger(app.socioeconomic.motorcycle.quantity)) {
        errors['motorcycle-quantity'] = 'Ingresá una cantidad entera mayor o igual a 1.'
      }
      if (!app.socioeconomic.motorcycle.brand?.trim()) {
        errors['motorcycle-brand'] = 'La marca de la moto es obligatoria.'
      }
      if (app.socioeconomic.motorcycle.year === '' || outsideRange(app.socioeconomic.motorcycle.year, 1900, APPLICATION_YEAR)) {
        errors['motorcycle-year'] = `Ingresá un año entre 1900 y ${APPLICATION_YEAR}.`
      }
      if (errors['motorcycle-quantity'] || errors['motorcycle-brand'] || errors['motorcycle-year']) {
        errors.motorcycleDetails = `Completá cantidad, marca y un año entre 1900 y ${APPLICATION_YEAR}.`
      }
    }
    if (app.socioeconomic.car.owns === null) errors.car = 'Indicá si posee automóvil.'
    if (app.socioeconomic.car.owns) {
      if (app.socioeconomic.car.quantity === '' || app.socioeconomic.car.quantity < 1 || !Number.isInteger(app.socioeconomic.car.quantity)) {
        errors['car-quantity'] = 'Ingresá una cantidad entera mayor o igual a 1.'
      }
      if (!app.socioeconomic.car.brand?.trim()) {
        errors['car-brand'] = 'La marca del automóvil es obligatoria.'
      }
      if (app.socioeconomic.car.year === '' || outsideRange(app.socioeconomic.car.year, 1900, APPLICATION_YEAR)) {
        errors['car-year'] = `Ingresá un año entre 1900 y ${APPLICATION_YEAR}.`
      }
      if (errors['car-quantity'] || errors['car-brand'] || errors['car-year']) {
        errors.carDetails = `Completá cantidad, marca y un año entre 1900 y ${APPLICATION_YEAR}.`
      }
    }
    if (app.socioeconomic.rural.ownsField === null) errors.ownsField = 'Indicá si son propietarios de campo.'
    if (app.socioeconomic.rural.leasesField === null) errors.leasesField = 'Indicá si son arrendatarios de campo.'
    if (app.socioeconomic.rural.leasesField && (app.socioeconomic.rural.leaseAmount === '' || outsideRange(app.socioeconomic.rural.leaseAmount, 0, 1_000_000_000))) errors.leaseAmount = 'Ingresá un monto de arrendamiento válido.'
  }
  if (step === 6) {
    const requiredDocuments = getRequiredDocuments(app)
    const uploaded = new Set(app.documents.filter((document) => document.status === 'ready' && document.referenceId).map((document) => document.type))
    const missingCount = requiredDocuments.filter((document) => !uploaded.has(document.type)).length
    if (missingCount) errors.documents = `Falta subir ${missingCount} ${missingCount === 1 ? 'documento obligatorio' : 'documentos obligatorios'}.`
  }
  if (step === 7 && !app.acceptedDeclaration) errors.acceptedDeclaration = 'Debés aceptar la declaración para continuar.'
  if (step === 7 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(app.contactEmail.trim())) errors.contactEmail = 'Ingresá un correo electrónico válido para recibir la confirmación.'
  return errors
}
