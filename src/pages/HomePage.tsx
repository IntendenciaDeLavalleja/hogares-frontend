import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { TrackingSection } from '../components/TrackingSection'
import { useApplicationStore } from '../store/applicationStore'
import TopBar from '../features/landing/components/layout/TopBar'
import Navbar from '../features/landing/components/layout/Navbar'
import Footer from '../features/landing/components/layout/Footer'
import Hero from '../features/landing/components/sections/Hero'
import MarqueeBand from '../features/landing/components/sections/MarqueeBand'

function EnrollmentActions() {
  const receipt = useApplicationStore((state) => state.submissionReceipt)
  const application = useApplicationStore((state) => state.application)
  const resetApplication = useApplicationStore((state) => state.resetApplication)
  const navigate = useNavigate()
  const hasProgress = Boolean(application.request.home || application.applicant.fullName || application.studies.institution || application.householdMembers.length)

  function startOver() {
    if (window.confirm('¿Querés comenzar nuevamente? Se borrarán las respuestas guardadas en este dispositivo.')) {
      resetApplication()
      navigate('/solicitud')
    }
  }

  return <div className="mt-7 sm:mt-8">
    <Link to={receipt ? '/comprobante' : '/solicitud'} className="landing-enrollment-button group inline-flex max-w-full items-center justify-center gap-2.5 rounded-full border-2 border-ink bg-paper px-5 py-3 font-mono text-[0.64rem] font-medium uppercase tracking-[0.13em] text-ink shadow-hard-sm transition-all hover:-translate-y-0.5 hover:bg-ink hover:text-paper hover:shadow-hard sm:px-6 sm:text-[0.7rem]">
      {receipt ? 'Ver comprobante' : hasProgress ? 'Continuar inscripción' : 'Iniciar inscripción'}
      <ArrowUpRight size={17} aria-hidden="true" />
    </Link>
    {(receipt || hasProgress) && <div className="mt-4">
      <button type="button" onClick={startOver} className="border-b border-ink/40 pb-1 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-ink/75 transition-colors hover:border-ink hover:text-ink">{receipt ? 'Nueva solicitud' : 'Comenzar nuevamente'}</button>
    </div>}
  </div>
}

export function HomePage() {
  const { hash } = useLocation()
  useEffect(() => {
    let active = true
    if (hash) {
      void document.fonts.ready.then(() => {
        if (active) document.getElementById(hash.slice(1))?.scrollIntoView()
      })
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    return () => { active = false }
  }, [hash])

  return <div className="landing-page bg-paper font-sans text-ink antialiased" data-theme="lavalleja">
    <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:border-2 focus:border-ink focus:bg-paper focus:px-5 focus:py-3 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.12em] focus:text-ink">Saltar al contenido</a>
    <TopBar />
    <Navbar />
    <main id="contenido">
      <Hero actions={<EnrollmentActions />} />
      <MarqueeBand />
      <TrackingSection />
    </main>
    <Footer />
  </div>
}
