"use client";

import { useRef, useState } from "react";
import { LogoMark } from "./IconsNew";

/**
 * Light, decorative 3D liquid-glass emblem for the hero.
 * Pure CSS 3D transforms — gently follows the pointer.
 */
export function HeroEmblem3D() {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    setTilt({ x: dx * 10, y: -dy * 10 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className="relative mx-auto aspect-square w-full max-w-[480px] select-none"
      style={{ perspective: "1100px" }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transition: "transform 0.5s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        {/* soft glow floor */}
        <div className="absolute left-1/2 top-[78%] h-24 w-[70%] -translate-x-1/2 rounded-[50%] bg-neon/10 blur-3xl" style={{ transform: "translateZ(-80px)" }} />

        {/* orbit rings */}
        <div className="emblem-ring absolute inset-[6%] rounded-full border border-white/[0.07]" style={{ transform: "translateZ(-40px) rotateX(68deg)" }} />
        <div className="emblem-ring-rev absolute inset-[16%] rounded-full border border-neon/15" style={{ transform: "translateZ(-20px) rotateX(68deg) rotateY(18deg)" }} />

        {/* main glass disc */}
        <div className="absolute inset-[22%] float-slow" style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
          <div className="liquid-glass liquid-strong grid h-full w-full place-items-center rounded-[38%]">
            <div className="grid h-[46%] w-[46%] place-items-center rounded-[30%] border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_20px_40px_-18px_rgba(0,0,0,0.9)]" style={{ transform: "translateZ(40px)" }}>
              <LogoMark className="h-[58%] w-[58%] opacity-90 drop-shadow-[0_0_18px_rgba(29,184,106,0.35)]" />
            </div>
          </div>
        </div>

        {/* floating glass chips */}
        <div className="liquid-glass liquid-pill absolute left-[2%] top-[18%] px-4 py-2.5 float-med" style={{ transform: "translateZ(90px)" }}>
          <p className="font-display text-[15px] font-black text-paper">4.9★</p>
          <p className="text-[10px] text-mist-dim">Avg rating</p>
        </div>
        <div className="liquid-glass liquid-pill absolute right-[0%] top-[34%] px-4 py-2.5 float-fast" style={{ transform: "translateZ(120px)" }}>
          <p className="font-display text-[15px] font-black text-paper">24/7</p>
          <p className="text-[10px] text-mist-dim">WhatsApp support</p>
        </div>
        <div className="liquid-glass liquid-pill absolute bottom-[14%] left-[12%] px-4 py-2.5 float-slow" style={{ transform: "translateZ(70px)" }}>
          <p className="font-display text-[15px] font-black text-paper">12–48h</p>
          <p className="text-[10px] text-mist-dim">Fast delivery</p>
        </div>

        {/* small glass orbs */}
        <span className="glass-orb absolute right-[16%] top-[10%] h-10 w-10 float-med" style={{ transform: "translateZ(60px)" }} />
        <span className="glass-orb absolute bottom-[22%] right-[10%] h-6 w-6 float-fast" style={{ transform: "translateZ(140px)" }} />
        <span className="glass-orb absolute left-[8%] bottom-[38%] h-4 w-4 float-slow" style={{ transform: "translateZ(100px)" }} />
      </div>
    </div>
  );
}
