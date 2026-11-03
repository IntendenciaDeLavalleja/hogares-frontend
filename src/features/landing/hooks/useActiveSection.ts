import { useEffect, useState } from "react";

/**
 * Marca la sección visible para resaltar el enlace correspondiente del navbar.
 */
export function useActiveSection(hrefs: readonly string[]) {
  const [active, setActive] = useState("");

  useEffect(() => {
    const sections = hrefs
      .map((href) => document.querySelector(href))
      .filter((section): section is Element => section !== null);

    if (!sections.length || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: "-42% 0px -52% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [hrefs]);

  return active;
}
