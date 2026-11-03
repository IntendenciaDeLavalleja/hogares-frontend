import { FormField, Input } from '../../../components/form/FormField'
import type { OutsideParent } from '../types/application'
import { parseNumber } from '../utils/number'

export function ParentOutsideHouseholdCard({
  parent,
  onUpdate,
  onRemove,
  errors = {},
  error,
  onClearError,
}: {
  parent: OutsideParent
  onUpdate: (data: Partial<OutsideParent>) => void
  onRemove: () => void
  errors?: Record<string, string>
  error?: string
  onClearError?: (key: string) => void
}) {
  const surnameError = errors[`parent-${parent.id}-surnames`]
  const nameError = errors[`parent-${parent.id}-name`]
  const relationshipError = errors[`parent-${parent.id}-relationship`]
  const ageError = errors[`parent-${parent.id}-age`]
  const occupationError = errors[`parent-${parent.id}-occupation`]
  const supportError = errors[`parent-${parent.id}-support`]
  const cardError = error || errors[`parent-${parent.id}`] || errors[`parent-${parent.role}`]

  const hasErrors = Boolean(
    surnameError ||
    nameError ||
    relationshipError ||
    ageError ||
    occupationError ||
    supportError ||
    cardError
  )

  const clear = (field: string) => {
    onClearError?.(`parent-${parent.id}-${field}`)
    onClearError?.(`parent-${parent.id}`)
    onClearError?.(`parent-${parent.role}`)
  }

  return (
    <article
      className={`rounded-box border transition-all p-4 ${
        hasErrors
          ? 'border-error/70 bg-error/5 shadow-sm ring-1 ring-error/30'
          : 'border-base-300 bg-base-100'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{parent.role === 'mother' ? 'Madre' : 'Padre'} que no convive</h3>
          {hasErrors && (
            <span className="badge badge-error badge-xs py-2 px-2 text-[10px] font-semibold text-white">
              Revisar campos
            </span>
          )}
        </div>
        <button type="button" className="btn btn-ghost btn-xs text-error" onClick={onRemove}>
          Eliminar
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={`parent-${parent.id}-surnames`} label="Apellidos" required error={surnameError}>
          <Input
            id={`parent-${parent.id}-surnames`}
            value={parent.surnames}
            onChange={(e) => {
              onUpdate({ surnames: e.target.value })
              clear('surnames')
            }}
            maxLength={120}
            error={surnameError}
          />
        </FormField>
        <FormField id={`parent-${parent.id}-name`} label="Nombre" required error={nameError}>
          <Input
            id={`parent-${parent.id}-name`}
            value={parent.name}
            onChange={(e) => {
              onUpdate({ name: e.target.value })
              clear('name')
            }}
            maxLength={120}
            error={nameError}
          />
        </FormField>
        <FormField id={`parent-${parent.id}-relationship`} label="Parentesco" required error={relationshipError}>
          <Input
            id={`parent-${parent.id}-relationship`}
            value={parent.relationship}
            onChange={(e) => {
              onUpdate({ relationship: e.target.value })
              clear('relationship')
            }}
            maxLength={80}
            error={relationshipError}
          />
        </FormField>
        <FormField id={`parent-${parent.id}-age`} label="Edad" required error={ageError}>
          <Input
            id={`parent-${parent.id}-age`}
            type="number"
            min="0"
            max="120"
            step="1"
            value={parent.age}
            onChange={(e) => {
              onUpdate({ age: parseNumber(e.target.value) })
              clear('age')
            }}
            error={ageError}
          />
        </FormField>
        <FormField id={`parent-${parent.id}-occupation`} label="Ocupación laboral" error={occupationError}>
          <Input
            id={`parent-${parent.id}-occupation`}
            value={parent.occupation}
            onChange={(e) => {
              onUpdate({ occupation: e.target.value })
              clear('occupation')
            }}
            maxLength={180}
            error={occupationError}
          />
        </FormField>
        <FormField id={`parent-${parent.id}-support`} label="Ingreso por pensión alimenticia" error={supportError}>
          <Input
            id={`parent-${parent.id}-support`}
            type="number"
            min="0"
            max="1000000000"
            step="0.01"
            value={parent.childSupportIncome}
            onChange={(e) => {
              onUpdate({ childSupportIncome: parseNumber(e.target.value) })
              clear('support')
            }}
            error={supportError}
          />
        </FormField>
      </div>
      {cardError && (
        <div className="mt-3 rounded-lg bg-error/10 p-2.5 text-xs text-error font-medium flex items-center gap-2" role="alert">
          <span>⚠️ {cardError}</span>
        </div>
      )}
    </article>
  )
}
