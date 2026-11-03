import { FormField, Select, YesNo } from '../../../components/form/FormField'
import { SectionHeader } from '../../../components/form/SectionHeader'
import { useApplicationStore } from '../../../store/applicationStore'
import { HouseholdMemberCard } from '../components/HouseholdMemberCard'
import { ParentOutsideHouseholdCard } from '../components/ParentOutsideHouseholdCard'
import { PARENT_SITUATIONS } from '../constants/household'
import type { ParentRole, ParentSituation } from '../types/application'


export function StepHousehold({ errors, onClearError }: {
  errors: Record<string, string>
  onClearError?: (key: string) => void
}) {
  const application = useApplicationStore((state) => state.application)
  const updateApplication = useApplicationStore((state) => state.updateApplication)
  const addMember = useApplicationStore((state) => state.addHouseholdMember)
  const updateMember = useApplicationStore((state) => state.updateHouseholdMember)
  const removeMember = useApplicationStore((state) => state.removeHouseholdMember)
  const addParent = useApplicationStore((state) => state.addOutsideParent)
  const updateParent = useApplicationStore((state) => state.updateOutsideParent)
  const removeParent = useApplicationStore((state) => state.removeOutsideParent)

  const setSituation = (role: ParentRole, value: ParentSituation | '') => {
    const situationKey = role === 'mother' ? 'motherSituation' : 'fatherSituation'
    const livesKey = role === 'mother' ? 'livesWithMother' : 'livesWithFather'
    updateApplication({
      household: { ...application.household, [situationKey]: value, [livesKey]: value ? value === 'lives_with' : null },
      outsideParents: value === 'outside' ? application.outsideParents : application.outsideParents.filter((parent) => parent.role !== role),
    })
    onClearError?.(situationKey)
    onClearError?.(`parent-missing-${role}`)
    onClearError?.('members')
  }

  return <div>
    <SectionHeader eyebrow="Etapa 5" title="Personas con las que convive" description="Registrá a quienes viven con vos: familiares, referentes u otras personas. No te incluyas en esta lista. No es necesario tener madre o padre para completar la solicitud." />
    <YesNo id="lives-alone" label="¿Vivís solo/a?" value={application.household.livesAlone} error={errors.livesAlone} onChange={(value) => {
      updateApplication({ household: { ...application.household, livesAlone: value }, ...(value ? { householdMembers: [] } : {}) })
      onClearError?.('livesAlone')
      onClearError?.('members')
    }} />
    {application.household.livesAlone === false && <>
      <div className="mt-5 space-y-4">{application.householdMembers.map((member, index) => <HouseholdMemberCard key={member.id} member={member} index={index} errors={errors} error={errors[`member-${member.id}`]} onClearError={onClearError} onUpdate={(data) => updateMember(member.id, data)} onRemove={() => removeMember(member.id)} />)}</div>
      <button type="button" className="btn btn-outline mt-4" onClick={() => { addMember(); onClearError?.('members') }}>+ Agregar integrante</button>
    </>}
    {errors.members && <div className="alert alert-error mt-3 py-2 text-xs" role="alert">{errors.members}</div>}
    <div className="mt-8 grid gap-5 rounded-box bg-base-200 p-4 sm:grid-cols-2">{(['mother', 'father'] as const).map((role) => {
      const key = role === 'mother' ? 'motherSituation' : 'fatherSituation'
      return <FormField key={role} id={`${role}-situation`} label={role === 'mother' ? 'Situación de la madre' : 'Situación del padre'} required error={errors[key]}>
        <Select id={`${role}-situation`} value={application.household[key]} error={errors[key]} onChange={(e) => setSituation(role, e.target.value as ParentSituation | '')}>
          <option value="">Seleccioná una opción</option>
          {Object.entries(PARENT_SITUATIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
      </FormField>
    })}</div>
    <p className="mt-3 text-sm text-base-content/60">Si falleció, no conocés sus datos o no tenés vínculo, no se solicitará su ficha. Podés registrar a tu tutor/a o referente entre las personas convivientes.</p>
    {(['mother', 'father'] as const).some((role) => application.household[role === 'mother' ? 'motherSituation' : 'fatherSituation'] === 'outside') && <section className="mt-8">
      <h2 className="mb-2 text-lg font-semibold">Madre o padre que no integra el núcleo conviviente</h2>
      <p className="mb-4 text-sm text-base-content/60">Completá los datos únicamente de quienes indicaste que podés aportar información.</p>
      {(['mother', 'father'] as const).map((role) => application.household[role === 'mother' ? 'motherSituation' : 'fatherSituation'] === 'outside' && <div key={role} className="mb-4">
        {errors[`parent-missing-${role}`] && <div className="alert alert-error mb-3 py-2 text-xs" role="alert">{errors[`parent-missing-${role}`]}</div>}
        {application.outsideParents.filter((parent) => parent.role === role).map((parent) => <ParentOutsideHouseholdCard key={parent.id} parent={parent} errors={errors} error={errors[`parent-${parent.id}`] || errors[`parent-${parent.role}`]} onClearError={onClearError} onUpdate={(data) => updateParent(parent.id, data)} onRemove={() => removeParent(parent.id)} />)}
        {!application.outsideParents.some((parent) => parent.role === role) && <button type="button" className="btn btn-sm btn-outline" onClick={() => { addParent(role); onClearError?.(`parent-missing-${role}`) }}>+ Agregar {role === 'mother' ? 'madre' : 'padre'}</button>}
      </div>)}
    </section>}
  </div>
}
