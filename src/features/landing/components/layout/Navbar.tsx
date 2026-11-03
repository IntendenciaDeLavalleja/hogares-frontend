import { useEffect, useRef, useState } from "react";
import { Clock, MapPin, Menu, Phone, X } from "lucide-react";
import { NAV_LINKS, SITE } from "../../data/content";
import { useActiveSection } from "../../hooks/useActiveSection";
import Logo from "../ui/Logo";

const sectionHrefs = NAV_LINKS.map((link) => link.href);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const active = useActiveSection(sectionHrefs);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = triggerRef.current;
    const focusFrame = requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const controls = menuRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      const first = controls?.[0];
      const last = controls?.[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-colors duration-300 ${
          scrolled
            ? "border-b-2 border-ink bg-paper/95 backdrop-blur-md"
            : "border-b-2 border-transparent bg-ochre"
        }`}
      >
        <div className="shell flex h-[4.4rem] items-center justify-between gap-6 lg:h-[4.9rem]">
          <Logo />

          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-8 lg:flex"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-link text-ink/75 transition-colors hover:text-ink"
                data-active={active === link.href}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={SITE.phoneHref}
              className="btn btn-sm hidden rounded-full border-2 border-ink bg-ink px-5 font-mono text-[0.64rem] font-medium uppercase tracking-[0.12em] text-paper shadow-hard-sm transition-all hover:-translate-y-0.5 hover:border-plum hover:bg-plum hover:shadow-hard sm:inline-flex lg:btn-md"
              aria-label={`Llamar al ${SITE.phone}, interno ${SITE.phoneExtension}`}
            >
              <Phone size={14} aria-hidden="true" />
              {SITE.phone}
            </a>

            <button
              type="button"
              className="btn btn-square btn-sm rounded-full border-2 border-ink bg-transparent text-ink hover:bg-ink hover:text-paper lg:hidden"
              aria-label="Abrir menú de navegación"
              ref={triggerRef}
              aria-expanded={open}
              aria-controls="menu-movil"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div
        id="menu-movil"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={`fixed inset-0 z-[60] flex flex-col bg-paper transition-opacity duration-400 lg:hidden ${
          open ? "visible opacity-100 pointer-events-auto" : "invisible opacity-0 pointer-events-none"
        }`}
        inert={!open}
        aria-hidden={!open}
      >
        <div className="shell flex h-[4.4rem] shrink-0 items-center justify-between border-b-2 border-ink">
          <Logo />
          <button
            type="button"
            className="btn btn-square btn-sm rounded-full border-2 border-ink bg-transparent text-ink hover:bg-ink hover:text-paper"
            aria-label="Cerrar menú de navegación"
            ref={closeRef}
            onClick={() => setOpen(false)}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav
          aria-label="Navegación móvil"
          className="shell flex flex-1 flex-col justify-center overflow-y-auto py-8"
        >
          <ul>
            {NAV_LINKS.map((link, index) => (
              <li key={link.href} className="border-b border-ink/15">
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-baseline justify-between gap-4 py-4"
                >
                  <span className="font-display text-[clamp(2rem,9vw,2.8rem)] font-black uppercase leading-none tracking-[-0.04em]">
                    {link.label}
                  </span>
                  <span className="font-mono text-[0.6rem] tracking-[0.14em] text-ink/45" aria-hidden="true">
                    0{index + 1}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <a
            href={SITE.phoneHref}
            className="btn btn-lg mt-8 w-full rounded-full border-2 border-ink bg-ink font-mono text-xs uppercase tracking-[0.12em] text-paper shadow-hard-sm hover:bg-plum"
          >
            <Phone size={16} aria-hidden="true" />
            Llamar a Servicios Sociales
          </a>

          <div className="mt-8 space-y-3 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-ink/65">
            <p className="flex items-center gap-2">
              <MapPin size={13} aria-hidden="true" />
              {SITE.addressDetail}
            </p>
            <p className="flex items-center gap-2">
              <Clock size={13} aria-hidden="true" />
              {SITE.hours}
            </p>
          </div>
        </nav>
      </div>
    </>
  );
}
