import { FormField, Input, YesNo } from '../../../components/form/FormField'
import { APPLICATION_YEAR } from '../constants/steps'
import { parseNumber } from '../utils/number'
import type { VehicleData } from '../types/application'

export function VehicleFields({
  id,
  title,
  vehicle,
  onChange,
  error,
  detailsError,
  errors = {},
  onClearError,
}: {
  id: string
  title: string
  vehicle: VehicleData
  onChange: (data: Partial<VehicleData>) => void
  error?: string
  detailsError?: string
  errors?: Record<string, string>
  onClearError?: (key: string) => void
}) {
  const quantityError = errors[`${id}-quantity`]
  const brandError = errors[`${id}-brand`]
  const yearError = errors[`${id}-year`]
  const generalDetailsError = detailsError && !quantityError && !brandError && !yearError ? detailsError : undefined

  return (
    <fieldset className="rounded-box border border-base-300 p-4">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      <YesNo
        id={`${id}-owns`}
        label={`¿Posee ${title.toLowerCase()}?`}
        value={vehicle.owns}
        onChange={(value) => {
          onChange({ owns: value })
          onClearError?.(id)
        }}
        error={error}
      />
      {vehicle.owns && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <FormField id={`${id}-quantity`} label="Cantidad" required error={quantityError}>
            <Input
              id={`${id}-quantity`}
              type="number"
              min="1"
              max="100"
              step="1"
              value={vehicle.quantity}
              onChange={(e) => {
                onChange({ quantity: parseNumber(e.target.value) })
                onClearError?.(`${id}-quantity`)
                onClearError?.(`${id}Details`)
              }}
              error={quantityError}
            />
          </FormField>
          <FormField id={`${id}-brand`} label="Marca" required error={brandError}>
            <Input
              id={`${id}-brand`}
              value={vehicle.brand}
              onChange={(e) => {
                onChange({ brand: e.target.value })
                onClearError?.(`${id}-brand`)
                onClearError?.(`${id}Details`)
              }}
              maxLength={100}
              error={brandError}
            />
          </FormField>
          <FormField id={`${id}-year`} label="Año" required error={yearError}>
            <Input
              id={`${id}-year`}
              type="number"
              min="1900"
              max={APPLICATION_YEAR}
              step="1"
              value={vehicle.year}
              onChange={(e) => {
                onChange({ year: parseNumber(e.target.value) })
                onClearError?.(`${id}-year`)
                onClearError?.(`${id}Details`)
              }}
              error={yearError}
            />
          </FormField>
        </div>
      )}
      {generalDetailsError && (
        <p className="mt-2 text-xs text-error" role="alert">
          {generalDetailsError}
        </p>
      )}
    </fieldset>
  )
}
