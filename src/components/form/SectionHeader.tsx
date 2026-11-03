export function SectionHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return <div className="mb-7"><div className="section-rule" />{eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}<h1 className="text-2xl font-semibold tracking-tight text-base-content sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-base-content/65">{description}</p>}</div>
}
