export type StudentHome = 'minas' | 'mariscala' | 'montevideo'
export type ApplicationType = 'new' | 'renewal'
export type HousingStatus = 'owner' | 'usufruct' | 'succession' | 'tenant' | 'promissory_buyer'
export type EmploymentStatus =
  | 'formal_employee'
  | 'retired'
  | 'self_employed'
  | 'informal'
  | 'seasonal'
  | 'unemployed'
  | 'student'
  | 'other'
export type ParentRole = 'mother' | 'father'
export type ParentSituation = 'lives_with' | 'outside' | 'deceased' | 'unknown' | 'no_contact'
export type DocumentStatus = 'pending' | 'uploading' | 'ready' | 'error'
export type NumericValue = number | ''

export interface ApplicationRequestData {
  home: StudentHome | ''
  type: ApplicationType | ''
  renewalYear: NumericValue
  sameHome: boolean | null
}

export interface ApplicantData {
  fullName: string
  nationalId: string
  birthDate: string
  address: string
  locality: string
  phone: string
  ownMobile: string
  responsibleMobile: string
}

export interface StudiesData {
  grade: string
  institution: string
  previousInstitution: string
  average: NumericValue
  hasPendingSubjects: boolean | null
  pendingSubjectsCount: NumericValue
}

export interface HealthData {
  healthCenter: string
  hasDisability: boolean | null
  dailyLivingSupports: string
  hasChronicDisease: boolean | null
  chronicDisease: string
  inTreatment: boolean | null
  takesControlledMedication: boolean | null
  controlledMedication: string
  hasNeurodevelopmentDiagnosis: boolean | null
  hasAllergy: boolean | null
  allergy: string
  emergencyName: string
  emergencyPhone: string
  emergencyMobile: string
  receivesScholarship: boolean | null
  scholarship: string
  currentlyWorks: boolean | null
  workplace: string
  monthlySalary: NumericValue
}

export interface HouseholdMember {
  id: string
  surnames: string
  names: string
  relationship: string
  age: NumericValue
  occupation: string
  monthlyIncome: NumericValue
  employmentStatus: EmploymentStatus | ''
  nationalId: string
  address: string
}

export interface OutsideParent {
  id: string
  role: ParentRole
  surnames: string
  name: string
  relationship: string
  age: NumericValue
  occupation: string
  childSupportIncome: NumericValue
  nationalId: string
}

export interface HouseholdData {
  livesAlone: boolean | null
  motherSituation: ParentSituation | ''
  fatherSituation: ParentSituation | ''
  livesWithMother: boolean | null
  livesWithFather: boolean | null
}

export interface VehicleData {
  owns: boolean | null
  quantity: NumericValue
  brand: string
  year: NumericValue
}

export interface RuralData {
  ownsField: boolean | null
  leasesField: boolean | null
  leaseAmount: NumericValue
}

export interface SocioeconomicData {
  housingStatus: HousingStatus | ''
  rentAmount: NumericValue
  installmentAmount: NumericValue
  motorcycle: VehicleData
  car: VehicleData
  rural: RuralData
  notes: string
}

export type DocumentType =
  | 'applicant_id'
  | 'household_ids'
  | 'address'
  | 'good_conduct'
  | 'income_proofs'
  | 'income_affidavits'
  | 'unemployment_affidavits'
  | 'ute_receipt'
  | 'passport_photo'
  | 'school_records'
  | 'health_card'
  | 'housing'
  | 'transit_certificate'
  | 'dicose'
  | 'medical_certificate'
  | 'rent_receipt'
  | 'property_tax'
  | 'installment_receipt'

export interface RequiredDocument {
  type: DocumentType
  label: string
  description: string
  required: boolean
}

export interface DocumentMetadata {
  type: DocumentType
  name: string
  status: DocumentStatus
  referenceId?: string
  mimeType?: string
  originalSize?: number
  optimizedSize?: number
  width?: number
  height?: number
  wasOptimized?: boolean
  optimizedFileName?: string
}

export interface ApplicationFormData {
  contactEmail: string
  request: ApplicationRequestData
  applicant: ApplicantData
  studies: StudiesData
  health: HealthData
  household: HouseholdData
  householdMembers: HouseholdMember[]
  outsideParents: OutsideParent[]
  socioeconomic: SocioeconomicData
  documents: DocumentMetadata[]
  acceptedDeclaration: boolean
}

export interface BackendDraft {
  id: string
  token: string
  expiresAt: string
}

export interface SubmissionReceipt {
  id: string
  trackingCode: string
  submittedAt: string
  confirmationEmailSent?: boolean
}

export interface ConfirmationCaptcha {
  token: string
  answer: string
}

export interface ApplicationTracking {
  trackingCode: string
  status: string
  statusLabel: string
  message: string
  submittedAt: string
  home: StudentHome
  applicationType: ApplicationType
  applicationYear: number
}

export interface IncomeAffidavitData {
  memberId: string
  name: string
  nationalId: string
  activity: string
  monthlyIncome: NumericValue
}

export interface UnemploymentAffidavitData {
  memberId: string
  name: string
  nationalId: string
  address: string
}
