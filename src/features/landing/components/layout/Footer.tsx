import { ArrowUp, ArrowUpRight, Clock, MapPin, Phone } from "lucide-react";
import { FOOTER_LINKS, SITE } from "../../data/content";
import Logo from "../ui/Logo";

export default function Footer() {
  return (
    <footer id="contacto" className="relative overflow-hidden bg-ink text-paper">
      <div className="shell pb-8 pt-16 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_0.8fr_1fr] lg:gap-16">
          <div>
            <Logo inverted />
            <p className="mt-6 max-w-xs font-serif text-2xl italic leading-tight text-paper/85">
              “Tu pueblo te acompaña a donde vayas.”
            </p>
            <a
              href={SITE.officialSite}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 border-b border-paper/30 pb-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-paper/70 transition-colors hover:border-ochre hover:text-ochre"
            >
              lavalleja.gub.uy
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </div>

          <nav aria-label="Navegación del pie de página">
            <h2 className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-paper/70">
              Navegación
            </h2>
            <ul className="mt-5 space-y-3">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-paper/80 transition-colors hover:text-ochre"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-paper/70">
              Información y asesoramiento
            </h2>
            <address className="mt-5 space-y-4 not-italic">
              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 text-sm leading-snug text-paper/80 transition-colors hover:text-ochre"
              >
                <MapPin size={16} className="mt-0.5 shrink-0 text-ochre" aria-hidden="true" />
                <span>
                  {SITE.address}
                  <br />
                  {SITE.addressDetail}
                  <br />
                  {SITE.city}
                </span>
              </a>

              <a
                href={SITE.phoneHref}
                className="flex items-center gap-3 text-sm text-paper/80 transition-colors hover:text-ochre"
              >
                <Phone size={16} className="shrink-0 text-ochre" aria-hidden="true" />
                {SITE.phone} int. {SITE.phoneExtension}
              </a>

              <p className="flex items-center gap-3 text-sm text-paper/80">
                <Clock size={16} className="shrink-0 text-ochre" aria-hidden="true" />
                {SITE.hours}
              </p>
            </address>
          </div>
        </div>

        <div className="mt-14 overflow-hidden" aria-hidden="true">
          <p className="display -mb-2 whitespace-nowrap text-[clamp(3.6rem,13.2vw,12.5rem)] leading-[0.72] text-outline-paper opacity-40">
            Lavalleja
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-paper/15 pt-6 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-paper/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Intendencia de Lavalleja</p>
          <p>Hogares Estudiantiles · Programa de becas</p>
          <a
            href="#inicio"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-ochre"
          >
            Volver arriba
            <ArrowUp size={12} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
