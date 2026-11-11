import { useEffect, useState } from "react";

/**
 * Returns true while the user is scrolling DOWN past `threshold`.
 * Returns false when scrolling UP or near the top — perfect for
 * hide-on-scroll-down / show-on-scroll-up headers and bars.
 */
export function useHideOnScroll(threshold = 140): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = typeof window !== "undefined" ? window.scrollY : 0;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - last;
        last = y;
        if (y < threshold) setHidden(false);
        else if (dy > 6) setHidden(true);
        else if (dy < -6) setHidden(false);
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return hidden;
}
