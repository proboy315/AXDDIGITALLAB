"use client";

import { useEffect, useRef } from "react";

/**
 * Page-wide background: deep dark base, slow drifting aurora,
 * a light 3D perspective grid floor, floating glass shapes and grain.
 * Pointer parallax is applied through CSS variables (no re-renders).
 */
export function Backdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      el.style.setProperty("--px", cx.toFixed(4));
      el.style.setProperty("--py", cy.toFixed(4));
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="axd-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,#0b1411_0%,#050807_45%,#020303_100%)]" />

      {/* aurora */}
      <div className="parallax-1 absolute inset-0">
        <div className="aurora aurora-a" />
        <div className="aurora aurora-b" />
        <div className="aurora aurora-c" />
      </div>

      {/* 3D grid floor */}
      <div className="grid-floor-wrap absolute inset-x-0 bottom-0 h-[55vh]">
        <div className="grid-floor" />
      </div>

      {/* floating glass shapes */}
      <div className="parallax-2 absolute inset-0" style={{ perspective: "900px" }}>
        <div className="glass-shape shape-cube left-[6%] top-[22%] h-24 w-24" />
        <div className="glass-shape shape-ring right-[8%] top-[58%] h-40 w-40" />
        <div className="glass-shape shape-cube right-[22%] top-[12%] h-14 w-14 [animation-delay:-6s]" />
        <div className="glass-shape shape-ring left-[14%] top-[72%] h-20 w-20 [animation-delay:-9s]" />
      </div>

      {/* vignette + grain */}
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_40%,transparent_55%,rgba(0,0,0,0.65)_100%)]" />
      <div className="grain absolute inset-0" />
    </div>
  );
}
