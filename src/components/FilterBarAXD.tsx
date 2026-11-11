import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, SortList } from "./IconsNew";
import { Glyph } from "./Glyph";
import type { Category } from "@/data/database";
import { sortOptions } from "@/data/database";
import { useScrollDirection } from "@/hooks/useScrollDirection";

export function FilterBarAXD({
  categories,
  active,
  onChange,
  sort,
  onSortChange,
  count,
}: {
  categories: Category[];
  active: string;
  onChange: (id: string) => void;
  sort: string;
  onSortChange: (id: string) => void;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [inStickyZone, setInStickyZone] = useState(false);
  const { scrollY, isScrollingDown } = useScrollDirection(8);

  useEffect(() => {
    if (!anchorRef.current) return;
    const top = anchorRef.current.getBoundingClientRect().top;
    setInStickyZone(top <= 96);
  }, [scrollY]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = sortOptions.find((s) => s.id === sort) ?? sortOptions[0];
  const hideBar = inStickyZone && isScrollingDown && !open;

  return (
    <>
      <div ref={anchorRef} className="h-px w-full pointer-events-none" aria-hidden />
      <div
        className={`sticky top-[76px] z-20 mt-6 sm:top-[86px] sm:mt-8 transition-all duration-300 ease-out ${
          hideBar ? "-translate-y-[150%] opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
      >
        <div className="mx-auto max-w-[1360px] px-3 sm:px-8">
        <div className="flex flex-col gap-3 rounded-[22px] liquid-glass liquid-dark border border-white/[0.07] p-3 glass-edge shadow-[0_20px_50px_-24px_rgba(0,0,0,0.9)] lg:flex-row lg:items-center lg:justify-between lg:rounded-full lg:py-2.5 lg:pl-3 lg:pr-3.5">
          {/* pills - horizontal scroll on mobile */}
          <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 lg:flex-wrap lg:overflow-visible -mx-1 px-1 lg:mx-0">
            {categories.map((c) => {
              const isActive = active === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChange(c.id)}
                  aria-pressed={isActive}
                  className={`relative shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-bold transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? "text-[#04150C]"
                      : "border border-line-bright/70 bg-white/[0.028] text-mist hover:border-neon/45 hover:bg-neon/[0.08] hover:text-chalk"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="filter-pill-axd"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-neon shadow-[0_12px_30px_-12px_rgba(29,184,106,0.45)]"
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Glyph name={c.icon as never} className="h-[17px] w-[17px]" />
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <span className="hidden h-8 w-px bg-line-bright lg:block" />
            <span className="hidden sm:inline text-[13px] font-semibold text-mist">Sort:</span>
            <div ref={wrap} className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="flex items-center gap-2.5 rounded-full border border-line-bright/80 bg-white/[0.035] py-2.5 pl-3.5 pr-3 text-[13px] font-semibold text-chalk transition-colors hover:border-neon/50 hover:bg-neon/[0.07] cursor-pointer"
              >
                <SortList className="h-[18px] w-[18px] text-neon" />
                <span className="whitespace-nowrap">{current.label}</span>
                <ChevronDown className={`h-4 w-4 text-mist transition-transform ${open ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {open && (
                  <motion.ul
                    role="listbox"
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-[calc(100%+10px)] z-40 w-[212px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#060908]/90 p-1.5 shadow-[0_30px_70px_-24px_rgba(0,0,0,0.95)] backdrop-blur-xl"
                  >
                    {sortOptions.map((o) => (
                      <li key={o.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={o.id === sort}
                          onClick={() => {
                            onSortChange(o.id);
                            setOpen(false);
                          }}
                          className={`w-full rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold transition-colors cursor-pointer ${o.id === sort ? "bg-neon/15 text-neon-lite" : "text-mist hover:bg-white/[0.05] hover:text-chalk"}`}
                        >
                          {o.label}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
            <span className="whitespace-nowrap text-[12px] font-semibold text-mist">{count} services</span>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

export function PaginationAXD({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1);
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} className="grid h-11 w-11 place-items-center rounded-full border border-line-bright/80 bg-white/[0.03] text-chalk disabled:opacity-35 hover:border-neon/55 hover:bg-neon/12 hover:text-neon-lite cursor-pointer">
        ←
      </button>
      {nums.map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-current={n === page ? "page" : undefined} className={`tabular grid h-11 w-11 place-items-center rounded-full text-[14px] font-bold transition cursor-pointer ${n === page ? "bg-neon text-[#04150C] shadow-[0_12px_30px_-12px_rgba(29,184,106,0.45)]" : "border border-line-bright/80 bg-white/[0.03] text-mist hover:border-neon/55 hover:bg-neon/12 hover:text-neon-lite"}`}>
          {n}
        </button>
      ))}
      <button type="button" onClick={() => onChange(Math.min(pages, page + 1))} disabled={page === pages} className="grid h-11 w-11 place-items-center rounded-full border border-line-bright/80 bg-white/[0.03] text-chalk disabled:opacity-35 hover:border-neon/55 hover:bg-neon/12 hover:text-neon-lite cursor-pointer">
        →
      </button>
    </nav>
  );
}
