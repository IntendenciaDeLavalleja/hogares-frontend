import { APPLICATION_YEAR } from '../../features/application/constants/steps'

export function Footer() {
  return (
    <footer className="border-t border-base-300 bg-base-100">
      <div className="page-container flex flex-col gap-2 py-6 text-sm text-base-content/60 sm:flex-row sm:items-center sm:justify-between">
        <p>Intendencia de Lavalleja</p>
        <p>Dirección General de Servicios Sociales · Convocatoria {APPLICATION_YEAR}</p>
      </div>
    </footer>
  )
}
