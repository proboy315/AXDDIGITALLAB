"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { NavbarAXD } from "./components/NavbarAXD";
import { HeroAXD } from "./components/HeroAXD";
import { ProductCard } from "./components/ProductCard";
import { FilterBarAXD, PaginationAXD } from "./components/FilterBarAXD";
import { ProductDrawer } from "./components/ProductDrawer";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { SeoHead } from "./components/SeoHead";
import { AdminPanel } from "./components/AdminPanel";
import { Backdrop } from "./components/Backdrop";
import { LogoMark, WhatsApp, Bolt, ShieldCheck, Headset, ThumbUp, ArrowRight } from "./components/IconsNew";
import { useStore } from "./hooks/useStore";
import { discountPercent } from "./lib/db";
import type { Database, Product } from "./data/database";

const PAGE_SIZE = 6;

function isAdminPath() {
  return window.location.pathname.endsWith("/admin") || window.location.hash === "#admin" || window.location.pathname.includes("/admin");
}

function useAdminRoute(initialAdmin: boolean) {
  const [isAdmin, setIsAdmin] = useState(initialAdmin);
  useEffect(() => {
    const check = () => setIsAdmin(isAdminPath());
    check();
    window.addEventListener("popstate", check);
    window.addEventListener("hashchange", check);
    return () => {
      window.removeEventListener("popstate", check);
      window.removeEventListener("hashchange", check);
    };
  }, []);
  const enter = () => {
    history.pushState(null, "", "/admin");
    setIsAdmin(true);
  };
  const exit = () => {
    history.pushState(null, "", "/");
    setIsAdmin(false);
  };
  return { isAdmin, enter, exit };
}

function TrustStrip({ db }: { db: Database }) {
  const icons = [ShieldCheck, Headset, Bolt, ThumbUp];
  return (
    <section className="mx-auto mt-10 max-w-[1180px] px-4 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[26px] liquid-glass border border-white/[0.07] px-5 py-7 glass-edge sm:px-8"
      >
        <span aria-hidden className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-neon/55 to-transparent" />
        <ul className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-y-7 lg:grid-cols-4">
          {db.site.trust.map((t, i) => {
            const Icon = icons[i] || ShieldCheck;
            return (
              <li
                key={t.title}
                className={`flex items-center gap-3.5 ${i > 0 ? "lg:border-l lg:border-line-bright/70 lg:pl-8" : ""} ${i === 1 || i === 3 ? "sm:border-l sm:border-line-bright/70 sm:pl-8 lg:pl-8" : ""}`}
              >
                <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-neon/25 bg-neon/10 text-neon shadow-[0_12px_28px_-14px_rgba(29,184,106,0.45)]">
                  <Icon className="h-[21px] w-[21px]" />
                </span>
                <span className="leading-tight">
                  <span className="block font-display text-[15.5px] font-extrabold tracking-[-0.01em] text-paper">{t.title}</span>
                  <span className="mt-0.5 block text-[12.5px] text-mist">{t.copy}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </section>
  );
}

export default function App({ initialDb, initialAdmin = false }: { initialDb: Database; initialAdmin?: boolean }) {
  const { isAdmin, exit } = useAdminRoute(initialAdmin);
  const { db } = useStore(initialDb);
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<string>("popular");
  const [page, setPage] = useState<number>(1);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // reset page when filters change
  const handleCategory = (id: string) => {
    setCategory(id);
    setPage(1);
  };
  const handleSort = (id: string) => {
    setSort(id);
    setPage(1);
  };
  const handleSearch = (q: string) => {
    setQuery(q);
    setPage(1);
  };

  const filtered = useMemo(() => {
    let list = db.products.filter((p) => {
      const matchesCategory = category === "all" || p.category === category;
      const matchesQuery =
        !query ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        p.tags.join(" ").toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
    const sorted = [...list];
    switch (sort) {
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating || b.popularity - a.popularity);
        break;
      case "low":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "high":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "discount":
        sorted.sort((a, b) => discountPercent(b.price, b.oldPrice) - discountPercent(a.price, a.oldPrice));
        break;
      default:
        sorted.sort((a, b) => b.popularity - a.popularity);
    }
    return sorted;
  }, [db.products, category, sort, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const openDrawer = (p: Product) => {
    setSelected(p);
    setDrawerOpen(true);
  };

  // keyboard ESC
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  // lock scroll when drawer open
  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  if (isAdmin) {
    return <AdminPanel initialDb={db} onExit={exit} />;
  }

  return (
    <div className="relative isolate min-h-screen bg-transparent">
      <Backdrop />
      <SeoHead db={db} />

      {/* page-wide atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[520px] -z-10 h-[1100px] bg-[radial-gradient(60%_45%_at_50%_20%,rgba(29,184,106,0.06),transparent_72%)]" />

      <NavbarAXD db={db} onSearch={handleSearch} />

      <main className="pb-20 lg:pb-0">
        <HeroAXD db={db} />

        {/* feature bar */}
        <section id="about" className="mx-auto max-w-[1360px] px-4 sm:px-8 -mt-2">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 rounded-[20px] liquid-glass border border-white/[0.06] p-2">
            {[
              { k: "15+", v: "Services Live", c: "Ready to order" },
              { k: "4.9★", v: "Avg Rating", c: "1.2K+ reviews" },
              { k: "24/7", v: "WhatsApp Support", c: "Avg 5 min reply" },
            ].map((f) => (
              <div key={f.v} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition duration-300 hover:-translate-y-0.5 sm:p-4">
                <p className="font-display text-[18px] font-black text-neon sm:text-[20px]">{f.k}</p>
                <p className="text-[11px] font-extrabold text-paper sm:text-[12px]">{f.v}</p>
                <p className="text-[10px] text-mist-dim hidden sm:block">{f.c}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="services" className="relative">
          <FilterBarAXD categories={db.categories} active={category} onChange={handleCategory} sort={sort} onSortChange={handleSort} count={filtered.length} />

          <div className="mx-auto max-w-[1360px] px-3 pb-6 pt-6 sm:px-8 sm:pt-8">
            {/* search result info */}
            {query && (
              <div className="mb-4 flex items-center justify-between rounded-full border border-neon/20 bg-neon/10 px-4 py-2">
                <p className="text-[13px] text-neon-lite">
                  Search: <span className="font-bold">“{query}”</span> • {filtered.length} found
                </p>
                <button onClick={() => setQuery("")} className="rounded-full bg-neon px-3 py-1 text-[11px] font-bold text-[#04150C] cursor-pointer">Clear</button>
              </div>
            )}

            {visible.length > 0 ? (
              <motion.div
                key={`${category}-${sort}-${current}-${query}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3"
              >
                {visible.map((p, i) => {
                  const cat = db.categories.find((c) => c.id === p.category);
                  return (
                    <ProductCard
                      key={p.id}
                      product={p}
                      index={i}
                      whatsappNumber={db.site.whatsappNumber}
                      categoryLabel={cat?.label}
                      onView={() => openDrawer(p)}
                    />
                  );
                })}
              </motion.div>
            ) : (
              <div className="mx-auto flex max-w-[520px] flex-col items-center rounded-[24px] border border-dashed border-line-bright/80 liquid-glass px-8 py-16 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-neon/25 bg-neon/10 text-neon">
                  <LogoMark className="h-7 w-7" />
                </span>
                <h3 className="mt-5 font-display text-[21px] font-extrabold text-paper">Nothing here yet</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-mist">
                  No services matched your filter. Try another section or search term — we can still build it custom for you.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleCategory("all");
                    setQuery("");
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-neon px-5 py-3 text-[13px] font-extrabold text-[#04150C] hover:bg-neon-lite cursor-pointer"
                >
                  <WhatsApp className="h-[17px] w-[17px]" /> Browse all services
                </button>
              </div>
            )}

            <PaginationAXD page={current} pages={pages} onChange={setPage} />
          </div>
        </section>

        <TrustStrip db={db} />

        {/* FAQ / SEO section for ranking */}
        <section className="mx-auto mt-10 max-w-[1360px] px-4 sm:px-8">
          <div className="liquid-glass rounded-[24px] border border-white/[0.07] p-5 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-[640px]">
                <span className="inline-flex items-center gap-2 rounded-full border border-neon/20 bg-neon/10 px-3 py-1 font-mono text-[11px] font-bold tracking-widest text-neon uppercase">Why AXD DIGITAL LAB?</span>
                <h2 className="mt-3 font-display text-[26px] font-black leading-tight tracking-tight text-paper sm:text-[30px]">Security-first digital engineering — <span className="text-neon">built for growth</span></h2>
                <p className="mt-3 text-[14px] leading-relaxed text-mist">AXD DIGITAL LAB is more than a service catalog — it is a complete digital growth engine. WhatsApp bots that close orders around the clock, blazing-fast websites, conversion-tuned Shopify stores, and AI automation. Every delivery includes a complete video walkthrough and 7-day post-launch support.</p>
              </div>
              <div className="grid w-full max-w-[520px] shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  { q: "How fast is service delivery?", a: "Most digital services deploy within 12–48 hours. Custom web & e-commerce builds ship in 3–7 days with daily WhatsApp updates." },
                  { q: "What payment methods are accepted?", a: "JazzCash, EasyPaisa, Bank Transfer, Payoneer & Credit/Debit Cards. 50% upfront, 50% after preview approval." },
                  { q: "Do you provide ongoing support?", a: "Yes — 24/7 WhatsApp support, free revisions, and step-by-step video training are included with every order." },
                ].map((f) => (
                  <div key={f.q} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <p className="text-[13px] font-extrabold text-paper">{f.q}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-mist">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {db.products.slice(0, 4).map((p) => (
                <div key={p.id} className="rounded-2xl bg-black/25 border border-white/[0.05] p-3 transition duration-300 hover:-translate-y-0.5 hover:border-white/10">
                  <p className="text-[11px] font-bold tracking-widest text-neon uppercase">{p.category}</p>
                  <p className="mt-1 line-clamp-2 text-[12px] font-bold leading-tight text-paper">{p.title}</p>
                  <p className="mt-1 text-[11px] text-mist line-clamp-2">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Official WhatsApp Channel & Community Network */}
        {(db.site.whatsappChannelUrl || db.site.whatsappCommunityUrl) && (
          <section className="mx-auto mt-10 max-w-[1360px] px-4 sm:px-8">
            <div className="relative overflow-hidden rounded-[26px] border border-neon/25 bg-gradient-to-br from-[#07160F] via-[#06100B] to-[#081512] p-6 glass-edge sm:p-8">
              <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-neon/10 blur-3xl" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-[560px]">
                  <span className="inline-flex items-center gap-2 rounded-full border border-neon/25 bg-neon/10 px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-widest text-neon">
                    <span className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse" />
                    Official WhatsApp Network
                  </span>
                  <h2 className="mt-3 font-display text-[24px] font-black tracking-tight text-paper sm:text-[28px]">
                    Join our <span className="text-neon">WhatsApp Channel &amp; Community</span>
                  </h2>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-mist">
                    Get instant tool drops, live cybersecurity &amp; automation updates, flash discounts, and peer support directly on WhatsApp.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
                  {db.site.whatsappChannelUrl && (
                    <a
                      href={db.site.whatsappChannelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-neon/35 bg-neon/10 px-5 py-4 transition hover:-translate-y-0.5 hover:bg-neon hover:text-[#04150C]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neon text-[#04150C] group-hover:bg-[#04150C] group-hover:text-neon">
                          <WhatsApp className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-[13.5px] font-extrabold text-paper group-hover:text-[#04150C]">
                            WhatsApp Channel
                          </p>
                          <p className="text-[11px] text-mist group-hover:text-[#04150C]/80">
                            Releases &amp; announcements
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-neon group-hover:text-[#04150C]" />
                    </a>
                  )}

                  {db.site.whatsappCommunityUrl && (
                    <a
                      href={db.site.whatsappCommunityUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-line-bright bg-white/[0.04] px-5 py-4 transition hover:-translate-y-0.5 hover:border-neon/50 hover:bg-neon/10"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-neon/25 bg-neon/15 text-neon">
                          <WhatsApp className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-[13.5px] font-extrabold text-paper">
                            WhatsApp Community
                          </p>
                          <p className="text-[11px] text-mist">
                            Group discussions &amp; help
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-mist group-hover:text-neon" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer id="contact" className="mt-10 border-t border-white/[0.06] bg-black/40 backdrop-blur-xl pb-[72px] lg:pb-0">
        <div className="mx-auto max-w-[1360px] px-5 py-10 sm:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.3fr_0.9fr_0.9fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <LogoMark className="h-8 w-8" />
                <span className="font-display text-[19px] font-black tracking-[-0.02em]">
                  <span className="text-paper">{db.site.name.split(" ")[0]}</span>
                  <span className="text-neon"> {db.site.name.split(" ").slice(1).join(" ")}</span>
                </span>
              </div>
              <p className="mt-3 max-w-[42ch] text-[13px] leading-relaxed text-mist">{db.site.footer.about}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {db.site.footer.socials.map((s) => (
                  <a key={s.label} href={s.href} className="rounded-full border border-line-bright bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-mist hover:text-neon hover:border-neon/30">{s.label}</a>
                ))}
                {db.site.whatsappChannelUrl && (
                  <a href={db.site.whatsappChannelUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-neon/30 bg-neon/10 px-3 py-1.5 text-[11px] font-bold text-neon hover:bg-neon hover:text-[#04150C]">WA Channel</a>
                )}
                {db.site.whatsappCommunityUrl && (
                  <a href={db.site.whatsappCommunityUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-neon/30 bg-neon/10 px-3 py-1.5 text-[11px] font-bold text-neon hover:bg-neon hover:text-[#04150C]">WA Community</a>
                )}
              </div>
            </div>
            <div>
              <p className="text-[12px] font-extrabold tracking-widest text-paper uppercase">Quick Links</p>
              <ul className="mt-3 space-y-2">
                {db.site.footer.links.map((l) => (
                  <li key={l.label}><a href={l.href} className="text-[13px] font-semibold text-mist hover:text-neon-lite">{l.label}</a></li>
                ))}
                <li><a href="/admin" onClick={(e) => { e.preventDefault(); history.pushState(null,"","/admin"); window.dispatchEvent(new Event("popstate")); }} className="text-[11px] font-semibold text-mist-dim hover:text-neon">Admin</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[12px] font-extrabold tracking-widest text-paper uppercase">Contact</p>
              <ul className="mt-3 space-y-2 text-[13px] text-mist">
                <li className="flex items-center gap-2"><WhatsApp className="h-4 w-4 text-neon" /> {db.site.phoneDisplay}</li>
                <li>{db.site.email}</li>
                <li>{db.site.address}</li>
              </ul>
              <a href={`https://wa.me/${db.site.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-neon px-4 py-2.5 text-[13px] font-extrabold text-[#04150C] hover:bg-neon-lite">
                <WhatsApp className="h-4 w-4" /> Chat on WhatsApp
              </a>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-line/60 pt-6 sm:flex-row">
            <p className="text-[12px] text-mist-dim">© {new Date().getFullYear()} {db.site.footer.copyright} • Built with ❤️ for Pakistan</p>
            <p className="text-[11px] font-semibold text-mist-dim text-center">AXD DIGITAL LAB ranks #1 for <span className="text-neon">AXD DIGITAL LAB</span> • WhatsApp Bots • Web Dev • Shopify • SEO Optimized</p>
          </div>
        </div>
      </footer>

      <MobileBottomNav db={db} />

      {/* product drawer */}
      <ProductDrawer
        product={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        whatsappNumber={db.site.whatsappNumber}
        categoryLabel={selected ? db.categories.find((c) => c.id === selected.category)?.label : undefined}
      />

      {/* JSON-LD visible for SEO */}
      <div className="sr-only" aria-hidden>
        {db.site.keywords.join(", ")}
      </div>
    </div>
  );
}
