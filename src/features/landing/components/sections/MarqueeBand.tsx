import { MARQUEE_PHRASES } from "../../data/content";
import Marquee from "../ui/Marquee";

export default function MarqueeBand() {
  return (
    <div
      className="relative overflow-hidden border-y-2 border-ink bg-ink py-4 text-paper sm:py-5"
      aria-hidden="true"
    >
      <Marquee
        items={MARQUEE_PHRASES}
        duration={48}
        itemClassName="display whitespace-nowrap text-[clamp(1.4rem,3.6vw,3.2rem)] text-paper"
        separatorClassName="text-[clamp(1.1rem,2.6vw,2.2rem)] text-ochre"
      />
    </div>
  );
}
