import { motion, useReducedMotion } from "framer-motion";
import type { Database } from "@/data/database";
import { ArrowRight, WhatsApp } from "./IconsNew";
import { HeroEmblem3D } from "./HeroEmblem3D";

const EASE: [number, number, number, number] = [0.22, 0.8, 0.28, 1];

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.06 + i * 0.08, ease: EASE },
  }),
};

export function HeroAXD({ db }: { db: Database }) {
  const reducedMotion = useReducedMotion();
  const [firstName, ...remainingName] = (db.site.name.trim() || db.site.shortName || "AXD").split(/\s+/);


  const whatsappGeneral = `https://wa.me/${db.site.whatsappNumber}?text=${encodeURIComponent(
    `Hello ${db.site.name}! I would like to discuss a digital service for my project.`
  )}`;


  return (
    <section id="home" className="cyber-hero relative isolate overflow-hidden bg-transparent">
      {/* Pure CSS + SVG lightweight cybersecurity backdrop (no hero photos) */}
      <div aria-hidden="true" className="cyber-hero-shade pointer-events-none absolute inset-0 -z-20" />
      <div aria-hidden="true" className="cyber-hero-grid pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden="true" className="cyber-hero-scan pointer-events-none absolute inset-0 -z-10" />

      {/* Subtle SVG cyber topology circuit accent */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 -z-10 h-full w-full max-w-[920px] text-neon opacity-[0.08]"
        viewBox="0 0 900 700"
        fill="none"
      >
        <path
          d="M900 120 H660 L610 170 H470 M860 280 H690 L635 225 H520 M900 470 H720 L660 410 H540"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeDasharray="6 6"
        />
        <circle cx="470" cy="170" r="4" fill="currentColor" />
        <circle cx="520" cy="225" r="3.5" fill="currentColor" />
        <circle cx="540" cy="410" r="4" fill="currentColor" />
        <circle cx="690" cy="280" r="24" stroke="currentColor" strokeOpacity="0.25" />
      </svg>

      <div className="cyber-hero-content relative mx-auto flex min-h-inherit max-w-[1360px] items-center px-4 sm:px-8">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          {/* Left: Command Typography & CTAs */}
          <div className="w-full max-w-[680px]">
            <motion.div
              variants={rise}
              custom={0}
              initial={reducedMotion ? false : "hidden"}
              animate="show"
              className="inline-flex flex-wrap items-center gap-2 rounded-full border border-neon/25 bg-neon/[0.07] px-3.5 py-1.5 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neon-lite sm:text-[11px]">
                {db.site.hero.eyebrow} · TLS 1.3 Verified
              </span>
            </motion.div>

            <motion.h1
              variants={rise}
              custom={1}
              initial={reducedMotion ? false : "hidden"}
              animate="show"
              className="mt-5 break-words font-display font-black uppercase leading-[0.92] tracking-[-0.045em] text-paper"
              style={{ fontSize: "clamp(2.5rem, 6.2vw, 5.15rem)" }}
              aria-label={db.site.name}
            >
              <span className="block">{firstName}</span>
              {remainingName.length > 0 && (
                <span className="block text-neon neon-text">{remainingName.join(" ")}</span>
              )}
            </motion.h1>

            <motion.p
              variants={rise}
              custom={2}
              initial={reducedMotion ? false : "hidden"}
              animate="show"
              className="mt-5 max-w-[580px] font-display text-[21px] font-bold leading-[1.2] tracking-[-0.02em] text-white sm:text-[29px]"
            >
              <span>{db.site.hero.titleLine1} — </span>
              <span>
                {db.site.hero.titleLine2}{" "}
                <span className="text-neon-lite underline decoration-neon/40 decoration-2 underline-offset-4">
                  {db.site.hero.highlight}
                </span>
              </span>
            </motion.p>

            <motion.p
              variants={rise}
              custom={3}
              initial={reducedMotion ? false : "hidden"}
              animate="show"
              className="mt-4 max-w-[52ch] text-[14px] leading-[1.7] text-mist sm:text-[15.5px]"
            >
              {db.site.hero.subtitle}
            </motion.p>

            <motion.div
              variants={rise}
              custom={4}
              initial={reducedMotion ? false : "hidden"}
              animate="show"
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              <a
                href="#services"
                className="group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-neon px-5 py-3 text-[13px] font-extrabold text-[#04150c] shadow-[0_12px_32px_-12px_rgba(29,184,106,0.45)] transition duration-300 hover:-translate-y-0.5 hover:bg-neon-lite hover:shadow-[0_16px_38px_-12px_rgba(29,184,106,0.45)] sm:px-6 sm:text-[14px]"
              >
                {db.site.hero.ctaSecondary}
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href={whatsappGeneral}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl liquid-glass liquid-pill px-5 py-3 text-[13px] font-bold text-paper transition duration-300 hover:-translate-y-0.5 hover:border-neon/60 hover:bg-neon/10 sm:px-6 sm:text-[14px]"
              >
                <WhatsApp aria-hidden="true" className="h-4 w-4 text-neon" />
                {db.site.hero.ctaPrimary}
              </a>
            </motion.div>

            {/* Quick WhatsApp Channel & Community badges */}
            {(db.site.whatsappChannelUrl || db.site.whatsappCommunityUrl) && (
              <motion.div
                variants={rise}
                custom={4}
                initial={reducedMotion ? false : "hidden"}
                animate="show"
                className="mt-4 flex flex-wrap items-center gap-2"
              >
                {db.site.whatsappChannelUrl && (
                  <a
                    href={db.site.whatsappChannelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line-bright/80 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] font-semibold text-mist transition hover:border-neon/45 hover:bg-neon/[0.08] hover:text-neon-lite"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-neon" />
                    WhatsApp Channel ↗
                  </a>
                )}
                {db.site.whatsappCommunityUrl && (
                  <a
                    href={db.site.whatsappCommunityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line-bright/80 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] font-semibold text-mist transition hover:border-neon/45 hover:bg-neon/[0.08] hover:text-neon-lite"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4FC3F7]" />
                    WhatsApp Community ↗
                  </a>
                )}
              </motion.div>
            )}

            {/* Mini security & speed telemetry */}
            <motion.div
              variants={rise}
              custom={5}
              initial={reducedMotion ? false : "hidden"}
              animate="show"
              className="mt-7 grid max-w-[540px] grid-cols-3 gap-2.5 border-t border-line/80 pt-5 font-mono"
            >
              <div>
                <p className="text-[15px] font-black text-neon sm:text-[17px]">AES-256</p>
                <p className="text-[10.5px] text-mist-dim">Hardened Delivery</p>
              </div>
              <div>
                <p className="text-[15px] font-black text-paper sm:text-[17px]">&lt; 5 MIN</p>
                <p className="text-[10.5px] text-mist-dim">Operator Reply</p>
              </div>
              <div>
                <p className="text-[15px] font-black text-paper sm:text-[17px]">99.98%</p>
                <p className="text-[10.5px] text-mist-dim">Lab Uptime SLA</p>
              </div>
            </motion.div>
          </div>

          {/* Right: light 3D liquid-glass emblem */}
          <motion.div
            variants={rise}
            custom={2}
            initial={reducedMotion ? false : "hidden"}
            animate="show"
            className="relative hidden lg:block"
          >
            <HeroEmblem3D />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
