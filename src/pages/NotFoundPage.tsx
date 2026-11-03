import { Link } from 'react-router-dom'
import { FormLayout } from '../components/layout/FormLayout'
import { PageContainer } from '../components/layout/PageContainer'

export function NotFoundPage() {
  return <FormLayout><PageContainer className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center py-12"><div className="text-center"><p className="text-6xl font-semibold text-primary">404</p><h1 className="mt-4 text-2xl font-semibold">Página no encontrada</h1><p className="mt-2 text-base-content/60">La dirección que ingresaste no existe.</p><Link to="/" className="btn btn-primary mt-6">Volver al inicio</Link></div></PageContainer></FormLayout>
}
