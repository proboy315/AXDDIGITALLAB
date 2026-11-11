import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoMark, Search, WhatsApp, ArrowRight } from "./IconsNew";
import type { Database } from "@/data/database";
import { useScrollDirection } from "@/hooks/useScrollDirection";

export function NavbarAXD({ db, onSearch }: { db: Database; onSearch?: (q: string) => void }) {
  const [open, setOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [q, setQ] = useState("");
  const { scrollY, isScrollingDown } = useScrollDirection(8);

  const scrolled = scrollY > 20;
  const hidden = isScrollingDown && scrollY > 80 && !open && !searchFocused;

  const waLink = `https://wa.me/${db.site.whatsappNumber}?text=${encodeURIComponent(
    `Hello ${db.site.name}! I would like assistance choosing a service.`
  )}`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4 transition-all duration-300 ease-out ${
        hidden ? "-translate-y-[125%] opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      }`}
    >
      <nav
        aria-label="Primary"
        className={`mx-auto flex max-w-[1360px] items-center gap-3 rounded-[22px] px-3.5 py-2.5 transition-all duration-300 sm:rounded-[26px] sm:px-5 ${
          scrolled
            ? "liquid-glass liquid-dark border border-white/[0.08] shadow-[0_26px_60px_-30px_rgba(0,0,0,0.95)]"
            : "liquid-glass border border-white/[0.07]"
        }`}
      >
        <span aria-hidden className="pointer-events-none absolute inset-x-6 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-neon/45 to-transparent" />

        <a href="#home" className="flex shrink-0 items-center gap-2.5">
          <LogoMark className="h-[34px] w-[34px] drop-shadow-[0_0_14px_rgba(29,184,106,0.55)]" />
          <span className="font-display text-[18px] font-black leading-none tracking-[-0.03em] sm:text-[20px]">
            <span className="text-paper">{db.site.shortName.split(" ")[0] || "AXD"}</span>
            {db.site.name.includes(" ") && (
              <span className="text-neon"> {db.site.name.split(" ").slice(1).join(" ")}</span>
            )}
            {!db.site.name.includes(" ") && <span className="text-neon"> {db.site.shortName}</span>}
          </span>
        </a>

        <ul className="ml-6 hidden items-center gap-1 lg:flex">
          {[
            { label: "Home", href: "#home" },
            { label: "Services", href: "#services", active: true },
            { label: "About", href: "#about" },
            { label: "Contact", href: "#contact" },
          ].map((l) => (
            <li key={l.label} className="relative">
              <a
                href={l.href}
                className={`relative block px-4 py-2 text-[14px] font-semibold transition-colors ${l.active ? "text-neon" : "text-mist hover:text-chalk"}`}
              >
                {l.label}
                {l.active && (
                  <motion.span layoutId="nav-underline" className="absolute -bottom-[7px] left-1/2 h-[3px] w-[26px] -translate-x-1/2 rounded-full bg-neon shadow-[0_0_14px_rgba(29,184,106,0.45)]" />
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2.5">
          <label className="relative hidden items-center md:flex">
            <Search className="pointer-events-none absolute left-4 h-[17px] w-[17px] text-mist-dim" />
            <span className="sr-only">Search services</span>
            <input
              type="search"
              placeholder="Search services..."
              value={q}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={(e) => {
                setQ(e.target.value);
                onSearch?.(e.target.value);
              }}
              className="h-[46px] w-[210px] rounded-full border border-line-bright/80 bg-white/[0.035] pl-11 pr-4 text-[13.5px] text-chalk placeholder:text-mist-dim transition-[width,border-color,background-color] duration-300 focus:w-[250px] focus:border-neon/60 focus:bg-neon/[0.06] focus:outline-none xl:w-[240px]"
            />
          </label>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full border border-neon/55 bg-neon/[0.07] px-4 py-2.5 text-[13px] font-bold text-neon-lite transition-colors hover:border-neon hover:bg-neon hover:text-[#04150C] sm:inline-flex"
          >
            <WhatsApp className="h-[17px] w-[17px]" />
            <span className="whitespace-nowrap">{db.site.hero.ctaPrimary}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-line-bright/80 text-chalk lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="mx-auto mt-2 max-w-[1360px] overflow-hidden rounded-[22px] liquid-glass liquid-dark border border-white/[0.08] p-3 lg:hidden"
          >
            <ul className="flex flex-col">
              {["Home", "Services", "About", "Contact"].map((l) => (
                <li key={l}>
                  <a
                    href={`#${l.toLowerCase()}`}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] font-semibold ${l === "Services" ? "bg-neon/12 text-neon" : "text-mist hover:bg-white/[0.04] hover:text-chalk"}`}
                  >
                    {l} <ArrowRight className="h-4 w-4 opacity-60" />
                  </a>
                </li>
              ))}
            </ul>
            <label className="relative mt-2 flex items-center">
              <Search className="pointer-events-none absolute left-4 h-[17px] w-[17px] text-mist-dim" />
              <span className="sr-only">Search services</span>
              <input
                type="search"
                placeholder="Search services..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  onSearch?.(e.target.value);
                }}
                className="h-[48px] w-full rounded-full border border-line-bright/80 bg-white/[0.035] pl-11 pr-4 text-[14px] text-chalk placeholder:text-mist-dim focus:border-neon/60 focus:outline-none"
              />
            </label>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-neon px-4 py-3.5 text-[14px] font-extrabold text-[#04150C]"
            >
              <WhatsApp className="h-[18px] w-[18px]" /> Chat on WhatsApp
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
