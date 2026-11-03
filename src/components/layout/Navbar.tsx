import { Link } from 'react-router-dom'
import { APPLICATION_YEAR } from '../../features/application/constants/steps'

export function Navbar() {
  return (
    <nav className="border-b border-base-300 bg-base-100" aria-label="Navegación principal">
      <div className="page-container flex min-h-18 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3" aria-label="Ir al inicio">
          <img className="brand-mark" src="/Logo.webp" alt="Logo de la Intendencia de Lavalleja" />
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-primary">Intendencia de Lavalleja</span>
            <span className="block text-sm font-medium text-base-content/75">Dirección General de Servicios Sociales</span>
          </span>
        </Link>
        <span className="hidden text-xs font-medium text-base-content/50 sm:block">Convocatoria {APPLICATION_YEAR}</span>
      </div>
    </nav>
  )
}
