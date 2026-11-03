import { FormField, Input, Select, Textarea, YesNo } from '../../../components/form/FormField'
import { SectionHeader } from '../../../components/form/SectionHeader'
import { useApplicationStore } from '../../../store/applicationStore'
import { VehicleFields } from '../components/VehicleFields'
import type { HousingStatus } from '../types/application'
import { parseNumber } from '../utils/number'

export function StepSocioeconomic({
  errors,
  onClearError,
}: {
  errors: Record<string, string>
  onClearError?: (key: string) => void
}) {
  const socioeconomic = useApplicationStore((state) => state.application.socioeconomic)
  const updateSocioeconomic = useApplicationStore((state) => state.updateSocioeconomic)
  const update = (data: Partial<typeof socioeconomic>) => updateSocioeconomic(data)

  return (
    <div>
      <SectionHeader eyebrow="Etapa 6" title="Situación socioeconómica" description="Estos datos permiten conocer la situación del núcleo familiar y orientar la evaluación de la solicitud." />
      <section>
        <h2 className="subsection-title">Vivienda</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="housing-status" label="¿En qué calidad ocupa la vivienda el núcleo familiar?" required error={errors.housingStatus}>
            <Select
              id="housing-status"
              value={socioeconomic.housingStatus}
              onChange={(e) => {
                update({ housingStatus: e.target.value as HousingStatus })
                onClearError?.('housingStatus')
              }}
              error={errors.housingStatus}
            >
              <option value="">Seleccionar</option><option value="owner">Propietarios</option><option value="usufruct">Usufructuarios</option><option value="succession">Sucesión</option><option value="tenant">Inquilinos</option><option value="promissory_buyer">Promitentes compradores</option>
            </Select>
          </FormField>
          {socioeconomic.housingStatus === 'tenant' && (
            <FormField id="rent-amount" label="Monto mensual del alquiler" required error={errors.rentAmount}>
              <Input
                id="rent-amount"
                type="number"
                min="0"
                max="1000000000"
                step="0.01"
                value={socioeconomic.rentAmount}
                onChange={(e) => {
                  update({ rentAmount: parseNumber(e.target.value) })
                  onClearError?.('rentAmount')
                }}
                error={errors.rentAmount}
              />
            </FormField>
          )}
          {socioeconomic.housingStatus === 'promissory_buyer' && (
            <FormField id="installment-amount" label="Monto mensual de la cuota" required error={errors.installmentAmount}>
              <Input
                id="installment-amount"
                type="number"
                min="0"
                max="1000000000"
                step="0.01"
                value={socioeconomic.installmentAmount}
                onChange={(e) => {
                  update({ installmentAmount: parseNumber(e.target.value) })
                  onClearError?.('installmentAmount')
                }}
                error={errors.installmentAmount}
              />
            </FormField>
          )}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="subsection-title">Vehículos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <VehicleFields
            id="motorcycle"
            title="Moto"
            vehicle={socioeconomic.motorcycle}
            error={errors.motorcycle}
            detailsError={errors.motorcycleDetails}
            errors={errors}
            onClearError={onClearError}
            onChange={(data) => update({ motorcycle: { ...socioeconomic.motorcycle, ...data } })}
          />
          <VehicleFields
            id="car"
            title="Automóvil"
            vehicle={socioeconomic.car}
            error={errors.car}
            detailsError={errors.carDetails}
            errors={errors}
            onClearError={onClearError}
            onChange={(data) => update({ car: { ...socioeconomic.car, ...data } })}
          />
        </div>
      </section>
      <section className="mt-8">
        <h2 className="subsection-title">Campo / actividad rural</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <YesNo
            id="owns-field"
            label="¿Son propietarios de campo?"
            value={socioeconomic.rural.ownsField}
            onChange={(value) => {
              update({ rural: { ...socioeconomic.rural, ownsField: value } })
              onClearError?.('ownsField')
            }}
            error={errors.ownsField}
          />
          <YesNo
            id="leases-field"
            label="¿Son arrendatarios de campo?"
            value={socioeconomic.rural.leasesField}
            onChange={(value) => {
              update({ rural: { ...socioeconomic.rural, leasesField: value, leaseAmount: value ? socioeconomic.rural.leaseAmount : '' } })
              onClearError?.('leasesField')
            }}
            error={errors.leasesField}
          />
          {socioeconomic.rural.leasesField && (
            <FormField id="lease-amount" label="Monto del arrendamiento" required error={errors.leaseAmount}>
              <Input
                id="lease-amount"
                type="number"
                min="0"
                max="1000000000"
                step="0.01"
                value={socioeconomic.rural.leaseAmount}
                onChange={(e) => {
                  update({ rural: { ...socioeconomic.rural, leaseAmount: parseNumber(e.target.value) } })
                  onClearError?.('leaseAmount')
                }}
                error={errors.leaseAmount}
              />
            </FormField>
          )}
        </div>
      </section>
      <section className="mt-8">
        <FormField id="socioeconomic-notes" label="Otros datos o aclaraciones que considere oportuno establecer"><Textarea id="socioeconomic-notes" rows={5} maxLength={5000} value={socioeconomic.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Podés agregar información relevante para la solicitud." /></FormField>
      </section>
    </div>
  )
}
