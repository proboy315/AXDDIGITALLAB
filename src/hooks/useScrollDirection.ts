import { useEffect, useRef, useState } from "react";

export function useScrollDirection(threshold = 10) {
  const [scrollY, setScrollY] = useState(0);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;
    setScrollY(window.scrollY);

    const update = () => {
      const y = window.scrollY;
      const diff = y - lastY.current;

      if (y <= 16) {
        setDirection("up");
        lastY.current = y;
      } else if (Math.abs(diff) >= threshold) {
        setDirection(diff > 0 ? "down" : "up");
        lastY.current = y;
      }
      setScrollY(y);
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(update);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return {
    scrollY,
    direction,
    isScrollingDown: direction === "down",
  };
}
