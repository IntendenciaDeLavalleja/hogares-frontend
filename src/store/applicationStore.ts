import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ApplicantData,
  ApplicationFormData,
  HealthData,
  HouseholdMember,
  OutsideParent,
  StudiesData,
  SocioeconomicData,
  BackendDraft,
  SubmissionReceipt,
} from '../features/application/types/application'
import { clearPreparedDocumentFiles } from '../features/application/utils/preparedFiles'

const emptyApplication: ApplicationFormData = {
  contactEmail: '',
  request: { home: '', type: '', renewalYear: '', sameHome: null },
  applicant: { fullName: '', nationalId: '', birthDate: '', address: '', locality: '', phone: '', ownMobile: '', responsibleMobile: '' },
  studies: { grade: '', institution: '', previousInstitution: '', average: '', hasPendingSubjects: null, pendingSubjectsCount: '' },
  health: { healthCenter: '', hasDisability: null, dailyLivingSupports: '', hasChronicDisease: null, chronicDisease: '', inTreatment: null, takesControlledMedication: null, controlledMedication: '', hasNeurodevelopmentDiagnosis: null, hasAllergy: null, allergy: '', emergencyName: '', emergencyPhone: '', emergencyMobile: '', receivesScholarship: null, scholarship: '', currentlyWorks: null, workplace: '', monthlySalary: '' },
  household: { livesAlone: null, motherSituation: '', fatherSituation: '', livesWithMother: null, livesWithFather: null },
  householdMembers: [],
  outsideParents: [],
  socioeconomic: {
    housingStatus: '', rentAmount: '', installmentAmount: '',
    motorcycle: { owns: null, quantity: '', brand: '', year: '' },
    car: { owns: null, quantity: '', brand: '', year: '' },
    rural: { ownsField: null, leasesField: null, leaseAmount: '' },
    notes: '',
  },
  documents: [],
  acceptedDeclaration: false,
}

function newId(): string {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

interface ApplicationStore {
  currentStep: number
  application: ApplicationFormData
  backendDraft: BackendDraft | null
  submissionReceipt: SubmissionReceipt | null
  setCurrentStep: (step: number) => void
  nextStep: () => void
  previousStep: () => void
  updateApplication: (data: Partial<ApplicationFormData>) => void
  updateApplicant: (data: Partial<ApplicantData>) => void
  updateStudies: (data: Partial<StudiesData>) => void
  updateHealth: (data: Partial<HealthData>) => void
  updateSocioeconomic: (data: Partial<SocioeconomicData>) => void
  addHouseholdMember: () => void
  updateHouseholdMember: (id: string, data: Partial<HouseholdMember>) => void
  removeHouseholdMember: (id: string) => void
  addOutsideParent: (role: OutsideParent['role']) => void
  updateOutsideParent: (id: string, data: Partial<OutsideParent>) => void
  removeOutsideParent: (id: string) => void
  setBackendDraft: (draft: BackendDraft | null) => void
  setSubmissionReceipt: (receipt: SubmissionReceipt | null) => void
  resetApplication: () => void
}

export const useApplicationStore = create<ApplicationStore>()(
  persist(
    (set) => ({
      currentStep: 0,
      application: emptyApplication,
      backendDraft: null,
      submissionReceipt: null,
      setCurrentStep: (step) => set({ currentStep: Math.max(0, Math.min(7, step)) }),
      nextStep: () => set((state) => ({ currentStep: Math.min(7, state.currentStep + 1) })),
      previousStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
      updateApplication: (data) => set((state) => ({ application: { ...state.application, ...data } })),
      updateApplicant: (data) => set((state) => ({ application: { ...state.application, applicant: { ...state.application.applicant, ...data } } })),
      updateStudies: (data) => set((state) => ({ application: { ...state.application, studies: { ...state.application.studies, ...data } } })),
      updateHealth: (data) => set((state) => ({ application: { ...state.application, health: { ...state.application.health, ...data } } })),
      updateSocioeconomic: (data) => set((state) => ({ application: { ...state.application, socioeconomic: { ...state.application.socioeconomic, ...data } } })),
      addHouseholdMember: () => set((state) => ({ application: { ...state.application, householdMembers: [...state.application.householdMembers, { id: newId(), surnames: '', names: '', relationship: '', age: '', occupation: '', monthlyIncome: '', employmentStatus: '', nationalId: '', address: '' }] } })),
      updateHouseholdMember: (id, data) => set((state) => ({ application: { ...state.application, householdMembers: state.application.householdMembers.map((member) => member.id === id ? { ...member, ...data } : member) } })),
      removeHouseholdMember: (id) => set((state) => ({ application: { ...state.application, householdMembers: state.application.householdMembers.filter((member) => member.id !== id) } })),
      addOutsideParent: (role) => set((state) => ({ application: { ...state.application, outsideParents: [...state.application.outsideParents, { id: newId(), role, surnames: '', name: '', relationship: role === 'mother' ? 'Madre' : 'Padre', age: '', occupation: '', childSupportIncome: '', nationalId: '' }] } })),
      updateOutsideParent: (id, data) => set((state) => ({ application: { ...state.application, outsideParents: state.application.outsideParents.map((parent) => parent.id === id ? { ...parent, ...data } : parent) } })),
      removeOutsideParent: (id) => set((state) => ({ application: { ...state.application, outsideParents: state.application.outsideParents.filter((parent) => parent.id !== id) } })),
      setBackendDraft: (backendDraft) => set({ backendDraft }),
      setSubmissionReceipt: (submissionReceipt) => set({ submissionReceipt }),
      resetApplication: () => { clearPreparedDocumentFiles(); set({ currentStep: 0, application: structuredClone(emptyApplication), backendDraft: null, submissionReceipt: null }) },
    }),
    {
      name: 'idl-hogares-estudiantiles-2026', version: 2,
      merge: (persisted, current) => {
        const saved = persisted as Partial<ApplicationStore> | undefined
        const household = saved?.application?.household
        return { ...current, ...saved, application: {
          ...emptyApplication, ...saved?.application,
          health: { ...emptyApplication.health, ...saved?.application?.health },
          household: {
            ...emptyApplication.household, ...household,
            motherSituation: household?.motherSituation ?? (household?.livesWithMother === true ? 'lives_with' : household?.livesWithMother === false ? 'outside' : ''),
            fatherSituation: household?.fatherSituation ?? (household?.livesWithFather === true ? 'lives_with' : household?.livesWithFather === false ? 'outside' : ''),
            livesAlone: household?.livesAlone ?? (saved?.application?.householdMembers?.length ? false : null),
          },
        } }
      },
      partialize: (state) => ({ currentStep: state.currentStep, application: state.application, backendDraft: state.backendDraft, submissionReceipt: state.submissionReceipt }),
    },
  ),
)
