import { FormField, Input, Select } from '../../../components/form/FormField'
import type { EmploymentStatus, HouseholdMember } from '../types/application'
import { parseNumber } from '../utils/number'
import { sanitizeNationalId } from '../utils/text'

const employmentOptions: Array<[EmploymentStatus, string]> = [
  ['formal_employee', 'Empleado formal'], ['retired', 'Jubilado / pensionista'], ['self_employed', 'Trabajador independiente'], ['informal', 'Trabajador informal'], ['seasonal', 'Jornalero / zafral'], ['unemployed', 'Desempleado'], ['student', 'Estudiante'], ['other', 'Otro'],
]

export function HouseholdMemberCard({
  member,
  index,
  onUpdate,
  onRemove,
  errors = {},
  error,
  onClearError,
}: {
  member: HouseholdMember
  index: number
  onUpdate: (data: Partial<HouseholdMember>) => void
  onRemove: () => void
  errors?: Record<string, string>
  error?: string
  onClearError?: (key: string) => void
}) {
  const surnameError = errors[`member-${member.id}-surnames`]
  const nameError = errors[`member-${member.id}-names`]
  const relationshipError = errors[`member-${member.id}-relationship`]
  const ageError = errors[`member-${member.id}-age`]
  const occupationError = errors[`member-${member.id}-occupation`]
  const employmentError = errors[`member-${member.id}-employment`]
  const incomeError = errors[`member-${member.id}-income`]
  const ciError = errors[`member-${member.id}-ci`]
  const cardError = error || errors[`member-${member.id}`]

  const hasErrors = Boolean(
    surnameError ||
    nameError ||
    relationshipError ||
    ageError ||
    occupationError ||
    employmentError ||
    incomeError ||
    ciError ||
    cardError
  )

  const clear = (field: string) => {
    onClearError?.(`member-${member.id}-${field}`)
    onClearError?.(`member-${member.id}`)
  }

  return (
    <article
      className={`rounded-box border transition-all p-4 sm:p-5 ${
        hasErrors
          ? 'border-error/70 bg-error/5 shadow-sm ring-1 ring-error/30'
          : 'border-base-300 bg-base-100'
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Integrante {index + 1}
            </span>
            {hasErrors && (
              <span className="badge badge-error badge-xs py-2 px-2 text-[10px] font-semibold text-white">
                Revisar campos
              </span>
            )}
          </div>
          <h3 className="mt-1 font-semibold">{member.names || member.surnames || 'Nueva persona'}</h3>
        </div>
        <button type="button" className="btn btn-ghost btn-sm text-error" onClick={onRemove}>
          Eliminar
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={`member-${member.id}-surnames`} label="Apellidos" required error={surnameError}>
          <Input
            id={`member-${member.id}-surnames`}
            value={member.surnames}
            onChange={(e) => {
              onUpdate({ surnames: e.target.value })
              clear('surnames')
            }}
            maxLength={120}
            error={surnameError}
          />
        </FormField>
        <FormField id={`member-${member.id}-names`} label="Nombres" required error={nameError}>
          <Input
            id={`member-${member.id}-names`}
            value={member.names}
            onChange={(e) => {
              onUpdate({ names: e.target.value })
              clear('names')
            }}
            maxLength={120}
            error={nameError}
          />
        </FormField>
        <FormField id={`member-${member.id}-relationship`} label="Parentesco con el aspirante" required error={relationshipError}>
          <Input
            id={`member-${member.id}-relationship`}
            value={member.relationship}
            onChange={(e) => {
              onUpdate({ relationship: e.target.value })
              clear('relationship')
            }}
            maxLength={80}
            error={relationshipError}
          />
        </FormField>
        <FormField id={`member-${member.id}-age`} label="Edad" required error={ageError}>
          <Input
            id={`member-${member.id}-age`}
            type="number"
            min="0"
            max="120"
            step="1"
            value={member.age}
            onChange={(e) => {
              onUpdate({ age: parseNumber(e.target.value) })
              clear('age')
            }}
            error={ageError}
          />
        </FormField>
        <FormField id={`member-${member.id}-occupation`} label="Ocupación laboral" error={occupationError}>
          <Input
            id={`member-${member.id}-occupation`}
            value={member.occupation}
            onChange={(e) => {
              onUpdate({ occupation: e.target.value })
              clear('occupation')
            }}
            maxLength={180}
            error={occupationError}
          />
        </FormField>
        <FormField id={`member-${member.id}-employment`} label="Tipo / situación laboral" required error={employmentError}>
          <Select
            id={`member-${member.id}-employment`}
            value={member.employmentStatus}
            onChange={(e) => {
              onUpdate({ employmentStatus: e.target.value as EmploymentStatus })
              clear('employment')
            }}
            error={employmentError}
          >
            <option value="">Seleccionar</option>
            {employmentOptions.map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id={`member-${member.id}-income`} label="Ingresos mensuales" error={incomeError}>
          <Input
            id={`member-${member.id}-income`}
            type="number"
            min="0"
            max="1000000000"
            step="0.01"
            value={member.monthlyIncome}
            onChange={(e) => {
              onUpdate({ monthlyIncome: parseNumber(e.target.value) })
              clear('income')
            }}
            error={incomeError}
          />
        </FormField>
        <FormField
          id={`member-${member.id}-ci`}
          label="Cédula de identidad"
          hint={!ciError ? 'Opcional. Si se ingresa, debe ser una cédula uruguaya válida.' : undefined}
          error={ciError}
        >
          <Input
            id={`member-${member.id}-ci`}
            inputMode="numeric"
            pattern="[0-9.\-]+"
            maxLength={12}
            value={member.nationalId}
            onChange={(e) => {
              onUpdate({ nationalId: sanitizeNationalId(e.target.value) })
              clear('ci')
            }}
            error={ciError}
          />
        </FormField>
      </div>
      {cardError && (
        <div className="mt-4 rounded-lg bg-error/10 p-2.5 text-xs text-error font-medium flex items-center gap-2" role="alert">
          <span>⚠️ {cardError}</span>
        </div>
      )}
      {['self_employed', 'informal', 'seasonal'].includes(member.employmentStatus) && <div className="mt-4 rounded-box bg-primary/5 p-3 text-sm text-primary"><strong>Declaración jurada de ingresos:</strong> corresponderá asociar una declaración por actividad independiente, informal o zafral.</div>}
      {member.employmentStatus === 'unemployed' && Number(member.age) >= 18 && <div className="mt-4 rounded-box bg-warning/10 p-3 text-sm text-base-content/75"><strong>Declaración de desempleo:</strong> corresponderá declarar domicilio y ausencia de ingresos por seguro de desempleo.</div>}
    </article>
  )
}
