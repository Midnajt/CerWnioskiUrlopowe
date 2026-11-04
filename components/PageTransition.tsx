"use client";

import { useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

type Props = { children: React.ReactNode };

export function PageTransition({ children }: Props) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const slotRef = useRef<HTMLDivElement>(null);
  const seen = useRef<string | null>(null);

  // Jedno wejście nowej karty, zanim przeglądarka ją pokaże. Zanik poprzedniej
  // chował już nową treść i puszczał wejście drugi raz.
  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    if (seen.current === pathname) return;
    const first = seen.current === null;
    seen.current = pathname;
    if (first || reduceMotion) return;

    slot.getAnimations().forEach((animation) => animation.cancel());
    slot.animate(
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0px)" },
      ],
      { duration: 180, easing: "ease-out", fill: "backwards" },
    );
  }, [pathname, reduceMotion]);

  return <div ref={slotRef}>{children}</div>;
}
