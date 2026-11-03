import type { ReactNode } from "react";
import { ArrowDown } from "lucide-react";
import { HERO, HERO_TICKER } from "../../data/content";
import HouseO from "../ui/HouseO";
import Marquee from "../ui/Marquee";

export default function Hero({ actions }: { actions: ReactNode }) {
  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-ochre"
    >
      <div
        className="pointer-events-none absolute -right-32 top-[16%] h-80 w-80 rounded-full border-2 border-ink/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-[12%] h-64 w-64 rounded-full bg-ochre-deep/50 blur-3xl"
        aria-hidden="true"
      />

      <div className="shell relative flex min-h-[calc(100svh-6.6rem)] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-ink/15 py-4">
          <p className="eyebrow text-[0.56rem] tracking-[0.14em] text-ink/70 sm:text-[0.68rem] sm:tracking-[0.18em]">
            <span className="eyebrow-dot" aria-hidden="true" />
            {HERO.eyebrow}
          </p>
          <p className="eyebrow hidden text-ink/80 sm:block">{HERO.locations}</p>
        </div>

        <div className="flex flex-1 flex-col justify-center py-10 md:py-12">
          <h1 id="hero-title" className="relative">
            <span className="sr-only">
              Hogares Estudiantiles de la Intendencia de Lavalleja
            </span>

            <span
              aria-hidden="true"
              className="display hero-line-1 block text-center"
            >
              H<HouseO />GARES
            </span>

            <span className="marquee-pill my-3 sm:my-4">
              <Marquee
                items={HERO_TICKER}
                duration={36}
                itemClassName="whitespace-nowrap font-mono text-[0.6rem] font-medium uppercase tracking-[0.2em] text-ochre sm:text-[0.7rem]"
                separatorClassName="text-ochre/70 text-[0.7rem]"
              />
            </span>

            <span
              aria-hidden="true"
              className="display hero-line-2 block text-center"
            >
              Estudiantiles
            </span>
          </h1>

          <div className="mx-auto mt-9 max-w-2xl text-center sm:mt-11">
            <p className="serif-accent text-[clamp(1.8rem,3vw,2.9rem)] leading-[1.03] text-ink">
              {HERO.lead}
            </p>
            <p className="mx-auto mt-4 max-w-xl text-[0.92rem] leading-relaxed text-ink/70 sm:text-base">
              {HERO.description}
            </p>

            {actions}
          </div>
        </div>

        <div className="flex justify-center pb-5 pt-2">
          <a
            href="#contacto"
            aria-label="Ir a la información de contacto"
            className="animate-nudge inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink/25 text-ink/60 transition-colors hover:border-ink hover:text-ink"
          >
            <ArrowDown size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
