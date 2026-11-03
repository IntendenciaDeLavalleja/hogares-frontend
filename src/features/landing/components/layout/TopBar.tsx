import { Phone } from "lucide-react";
import { SITE } from "../../data/content";

export default function TopBar() {
  return (
    <div className="bg-ink text-paper">
      <div className="shell flex h-9 items-center justify-between gap-4">
        <p className="font-mono text-[0.54rem] uppercase tracking-[0.13em] sm:text-[0.6rem]">
          <span
            className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-ochre align-middle"
            aria-hidden="true"
          />
          Programa de becas de alojamiento
          <span className="hidden sm:inline">
            {" "}
            · Minas · Montevideo · Mariscala
          </span>
        </p>

        <a
          href={SITE.phoneHref}
          className="hidden shrink-0 items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] transition-colors hover:text-ochre sm:flex"
        >
          <Phone size={12} aria-hidden="true" />
          {SITE.phone} int. {SITE.phoneExtension}
        </a>
      </div>
    </div>
  );
}
