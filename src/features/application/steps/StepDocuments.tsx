import { SectionHeader } from '../../../components/form/SectionHeader'
import { getRequiredDocuments } from '../constants/steps'
import { DocumentPlaceholder } from '../components/DocumentPlaceholder'
import { useApplicationStore } from '../../../store/applicationStore'
import { GoodConductNotice } from '../components/GoodConductNotice'

export function StepDocuments({ errors }: { errors: Record<string, string> }) {
  const application = useApplicationStore((state) => state.application)
  const documents = getRequiredDocuments(application)
  return (
    <div>
      <SectionHeader
        eyebrow="Etapa 7"
        title="Documentación requerida"
        description="Seleccionamos la documentación requerida a partir de la información declarada en tu solicitud."
      />
      {errors.documents && (
        <div className="alert alert-error mb-5" role="alert">
          {errors.documents}
        </div>
      )}
      <GoodConductNotice />
      <div className="space-y-3">
        {documents.map((document) => (
          <DocumentPlaceholder key={document.type} {...document} />
        ))}
      </div>
    </div>
  )
}
