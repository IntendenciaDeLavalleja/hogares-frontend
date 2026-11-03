export default function Logo({ className = "", inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <a href="#inicio" className={`group inline-flex items-center gap-3 ${className}`}>
      <img
        src="/Logo.webp"
        alt=""
        width="31"
        height="40"
        className="h-10 w-auto shrink-0 transition-transform duration-300 group-hover:-rotate-3 sm:h-11"
      />
      <span className="flex min-w-0 flex-col">
        <span
          className={`font-display text-[0.82rem] font-black uppercase leading-none tracking-[-0.02em] sm:text-[0.95rem] ${inverted ? "text-paper" : "text-ink"}`}
        >
          Hogares Estudiantiles
        </span>
        <span
          className={`mt-1.5 font-mono text-[0.5rem] uppercase tracking-[0.17em] sm:text-[0.55rem] ${inverted ? "text-paper/75" : "text-ink/80"}`}
        >
          Intendencia de Lavalleja
        </span>
      </span>
    </a>
  );
}
