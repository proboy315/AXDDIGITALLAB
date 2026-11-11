"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Database, Product, SiteConfig } from "@/data/database";
import { discountPercent } from "@/lib/db";
import {
  clearGithubConfig,
  fetchLatestDatabase,
  loadGithubConfig,
  pushToGithub,
  saveGithubConfig,
  testGithubConnection,
  type GithubConfig,
} from "@/lib/github";
import { LogoMark } from "./IconsNew";
import { Backdrop } from "./Backdrop";
import { AdminLogin } from "./admin/AdminLogin";
import { ServiceEditor } from "./admin/ServiceEditor";
import { BrandEditor, CategoriesEditor, ContactEditor, SeoEditor } from "./admin/SiteEditors";
import { Card, Field, btnGhost, btnPrimary, inputCls } from "./admin/ui";

type Tab = "services" | "categories" | "brand" | "contact" | "seo" | "settings";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "services", label: "Services", emoji: "🛍️" },
  { id: "categories", label: "Categories", emoji: "🗂️" },
  { id: "brand", label: "Brand & Hero", emoji: "✨" },
  { id: "contact", label: "Contact & Footer", emoji: "📞" },
  { id: "seo", label: "SEO", emoji: "🔎" },
  { id: "settings", label: "Settings", emoji: "⚙️" },
];

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function countChanges(base: Database, draft: Database) {
  let n = 0;
  const baseById = new Map(base.products.map((p) => [p.id, JSON.stringify(p)]));
  const draftIds = new Set(draft.products.map((p) => p.id));
  for (const p of draft.products) if (baseById.get(p.id) !== JSON.stringify(p)) n++;
  for (const id of baseById.keys()) if (!draftIds.has(id)) n++;
  if (base.products.map((p) => p.id).join() !== draft.products.map((p) => p.id).join() && n === 0) n++;
  if (JSON.stringify(base.categories) !== JSON.stringify(draft.categories)) n++;
  const keys = Object.keys(draft.site) as (keyof SiteConfig)[];
  for (const k of keys) if (JSON.stringify(base.site[k]) !== JSON.stringify(draft.site[k])) n++;
  return n;
}

export function AdminPanel({ initialDb, onExit }: { initialDb: Database; onExit: () => void }) {
  const [ready, setReady] = useState(false);
  const [cfg, setCfg] = useState<GithubConfig | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [base, setBase] = useState<Database>(initialDb);
  const [draft, setDraft] = useState<Database>(initialDb);
  const [tab, setTab] = useState<Tab>("services");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const sync = useCallback(
    async (c: GithubConfig) => {
      setSyncing(true);
      setSyncNote(null);
      const latest = await fetchLatestDatabase(c);
      if (latest) {
        setBase(latest);
        setDraft(latest);
      } else {
        setSyncNote("Could not read the latest files from GitHub — showing the version from the current build.");
      }
      setSyncing(false);
    },
    []
  );

  useEffect(() => {
    const c = loadGithubConfig();
    setCfg(c);
    setReady(true);
    if (c) sync(c);
  }, [sync]);

  const changes = useMemo(() => countChanges(base, draft), [base, draft]);
  const dirty = changes > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const publish = useCallback(async () => {
    if (!dirty || publishing || !cfg) return;
    setPublishing(true);
    const res = await pushToGithub(draft, cfg);
    setPublishing(false);
    if (!res.ok) {
      setToast({ kind: "err", text: res.message });
      return;
    }
    setBase(draft);
    setDraft(draft);
    setToast({ kind: "ok", text: res.message });
  }, [dirty, publishing, cfg, draft]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        publish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [publish]);

  const leave = () => {
    if (dirty && !confirm("You have unpublished changes. Leave without publishing?")) return;
    onExit();
  };

  if (!ready) {
    return (
      <div className="relative isolate grid min-h-screen place-items-center">
        <Backdrop />
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-neon border-t-transparent" />
      </div>
    );
  }

  if (!cfg) {
    return (
      <div>
        <AdminLogin initial={null} onConnect={(c) => { saveGithubConfig(c); setCfg(c); sync(c); }} />
        <button type="button" onClick={onExit} className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[12px] font-bold text-mist backdrop-blur hover:text-paper cursor-pointer">
          ← Back to website
        </button>
      </div>
    );
  }

  const setSite = (fn: (s: SiteConfig) => SiteConfig) => setDraft((d) => ({ ...d, site: fn(d.site) }));
  const updateProduct = (p: Product) => setDraft((d) => ({ ...d, products: d.products.map((x) => (x.id === p.id ? p : x)) }));
  const removeProduct = (id: string) => setDraft((d) => ({ ...d, products: d.products.filter((x) => x.id !== id) }));

  const addProduct = () => {
    const id = `prod-${Date.now()}`;
    const firstCat = draft.categories.find((c) => c.id !== "all")?.id || "other";
    const p: Product = {
      id,
      title: "New Service",
      slug: id,
      description: "Short description of this service.",
      longDescription: "",
      category: catFilter !== "all" ? catFilter : firstCat,
      image: "",
      gallery: [],
      price: 1999,
      oldPrice: 3999,
      rating: 5,
      reviews: "New",
      badge: "New",
      tags: [],
      accent: "#1DB86A",
      icon: "sparkle",
      popularity: Math.max(0, ...draft.products.map((x) => x.popularity || 0)) + 1,
      deliveryTime: "24-48 Hours",
      inStock: true,
    };
    setDraft((d) => ({ ...d, products: [p, ...d.products] }));
    setEditingId(id);
  };

  const duplicate = (p: Product) => {
    const id = `prod-${Date.now()}`;
    const copy = { ...p, id, slug: `${slugify(p.title)}-copy`, title: `${p.title} (copy)` };
    setDraft((d) => {
      const i = d.products.findIndex((x) => x.id === p.id);
      const list = [...d.products];
      list.splice(i + 1, 0, copy);
      return { ...d, products: list };
    });
  };

  const editing = draft.products.find((p) => p.id === editingId) || null;
  const q = search.toLowerCase();
  const list = draft.products.filter(
    (p) => (catFilter === "all" || p.category === catFilter) && (!q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  );
  const isNew = (id: string) => !base.products.some((p) => p.id === id);
  const isChanged = (p: Product) => {
    const b = base.products.find((x) => x.id === p.id);
    return !!b && JSON.stringify(b) !== JSON.stringify(p);
  };

  return (
    <div className="relative isolate min-h-screen pb-28">
      <Backdrop />

      {/* Top bar */}
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
        <div className="liquid-glass liquid-dark mx-auto flex max-w-[1320px] flex-wrap items-center gap-3 rounded-[22px] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <div className="leading-tight">
              <p className="font-display text-[15px] font-black text-paper">Admin Studio</p>
              <p className="text-[11px] text-mist-dim">
                {syncing ? "Syncing with GitHub…" : `${cfg.username}/${cfg.repo}`}
              </p>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold sm:inline-flex ${dirty ? "border-amber/30 bg-amber/10 text-amber" : "border-neon/25 bg-neon/10 text-neon-lite"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dirty ? "bg-amber animate-pulse" : "bg-neon"}`} />
              {dirty ? `${changes} unpublished change${changes > 1 ? "s" : ""}` : "Everything is live"}
            </span>
            <button type="button" className={btnGhost} onClick={leave}>
              View site
            </button>
            <button type="button" className={btnGhost} disabled={!dirty} onClick={() => confirm("Discard all unpublished changes?") && setDraft(base)}>
              Discard
            </button>
            <button type="button" className={`${btnPrimary} px-5`} disabled={!dirty || publishing} onClick={publish} title="Ctrl + S">
              {publishing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#04150C] border-t-transparent" /> Pushing…
                </>
              ) : (
                <>🚀 Publish</>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-5 grid max-w-[1320px] gap-5 px-3 sm:px-5 lg:grid-cols-[230px_1fr]">
        {/* Sidebar */}
        <nav className="liquid-glass flex gap-1.5 overflow-x-auto rounded-[22px] p-2 scrollbar-none lg:sticky lg:top-[96px] lg:h-fit lg:flex-col">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-bold transition cursor-pointer ${
                tab === t.id ? "bg-white/[0.09] text-paper shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" : "text-mist hover:bg-white/[0.04] hover:text-chalk"
              }`}
            >
              <span>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <main className="min-w-0 space-y-5">
          {syncing && (
            <div className="liquid-glass flex items-center gap-3 rounded-2xl px-4 py-3 text-[13px] text-mist">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-neon border-t-transparent" />
              Loading the latest published version from GitHub…
            </div>
          )}
          {syncNote && !syncing && (
            <div className="liquid-glass rounded-2xl border-amber/20 px-4 py-3 text-[13px] text-chalk">
              <span className="font-bold text-amber">Note:</span> {syncNote}
              <button type="button" className="ml-3 font-bold text-neon-lite cursor-pointer" onClick={() => sync(cfg)}>
                Try again
              </button>
            </div>
          )}
          {dirty && (
            <div className="liquid-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border-amber/20 px-4 py-3">
              <p className="text-[13px] text-chalk">
                <span className="font-bold text-amber">Draft mode:</span> nothing is saved anywhere yet — press <b>Publish</b> to push to GitHub.
              </p>
              <button type="button" className={btnPrimary} onClick={publish} disabled={publishing}>
                Publish now
              </button>
            </div>
          )}

          {tab === "services" && (
            <Card
              title={`Services (${draft.products.length})`}
              description="Click any service to edit text, prices and photos. Changes go live after Publish + Vercel rebuild."
              action={
                <button type="button" className={btnPrimary} onClick={addProduct}>
                  ＋ Add service
                </button>
              }
            >
              <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <input className={inputCls} placeholder="Search services…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <select className={`${inputCls} sm:max-w-[220px] cursor-pointer`} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                  {draft.categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0a0f0d]">
                      {c.id === "all" ? "All categories" : c.label}
                    </option>
                  ))}
                </select>
              </div>

              {list.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center">
                  <p className="text-[14px] text-mist">No services here yet.</p>
                  <button type="button" className={`${btnPrimary} mt-4`} onClick={addProduct}>
                    ＋ Add your first service
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((p) => {
                    const photos = [p.image, ...(p.gallery || [])].filter(Boolean).length;
                    const disc = discountPercent(p.price, p.oldPrice);
                    const cat = draft.categories.find((c) => c.id === p.category)?.label || p.category;
                    return (
                      <div key={p.id} className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-black/25 transition hover:-translate-y-0.5 hover:border-white/15">
                        <button type="button" onClick={() => setEditingId(p.id)} className="block w-full text-left cursor-pointer">
                          <div className="relative h-36 bg-black/40">
                            {p.image ? (
                              <img src={p.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="grid h-full place-items-center text-[12px] text-mist-dim">No photo yet — click to add</div>
                            )}
                            <div className="absolute left-2 top-2 flex gap-1.5">
                              {isNew(p.id) && <span className="rounded-md bg-amber px-1.5 py-0.5 text-[10px] font-black text-[#221603]">NEW · UNPUBLISHED</span>}
                              {isChanged(p) && <span className="rounded-md bg-amber/90 px-1.5 py-0.5 text-[10px] font-black text-[#221603]">EDITED</span>}
                              {p.inStock === false && <span className="rounded-md bg-red-500/80 px-1.5 py-0.5 text-[10px] font-black text-white">HIDDEN STOCK</span>}
                            </div>
                            <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10.5px] font-bold text-white backdrop-blur">📷 {photos}</span>
                          </div>
                          <div className="p-3.5">
                            <p className="text-[10.5px] font-bold uppercase tracking-widest text-neon">{cat}</p>
                            <p className="mt-0.5 line-clamp-1 font-display text-[15px] font-extrabold text-paper">{p.title}</p>
                            <p className="mt-1 text-[13px] text-chalk">
                              Rs. {p.price.toLocaleString("en-PK")}
                              {disc > 0 && <span className="ml-2 text-[11px] text-mist-dim line-through">Rs. {p.oldPrice?.toLocaleString("en-PK")}</span>}
                            </p>
                          </div>
                        </button>
                        <div className="flex border-t border-white/[0.06] text-[12px] font-bold">
                          <button type="button" onClick={() => setEditingId(p.id)} className="flex-1 py-2.5 text-neon-lite hover:bg-white/[0.04] cursor-pointer">
                            Edit
                          </button>
                          <button type="button" onClick={() => duplicate(p)} className="flex-1 border-l border-white/[0.06] py-2.5 text-mist hover:bg-white/[0.04] hover:text-paper cursor-pointer">
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => confirm(`Delete "${p.title}"?`) && removeProduct(p.id)}
                            className="flex-1 border-l border-white/[0.06] py-2.5 text-mist hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {tab === "categories" && <CategoriesEditor db={draft} setDraft={setDraft} />}
          {tab === "brand" && <BrandEditor site={draft.site} setSite={setSite} />}
          {tab === "contact" && <ContactEditor site={draft.site} setSite={setSite} />}
          {tab === "seo" && <SeoEditor site={draft.site} setSite={setSite} />}
          {tab === "settings" && <SettingsPanel cfg={cfg} onCfg={setCfg} onSync={sync} base={base} />}
        </main>
      </div>

      <AnimatePresence>
        {editing && (
          <ServiceEditor
            key={editing.id}
            product={editing}
            categories={draft.categories}
            onChange={updateProduct}
            onClose={() => setEditingId(null)}
            onDelete={() => {
              removeProduct(editing.id);
              setEditingId(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating publish bar on mobile */}
      <AnimatePresence>
        {dirty && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed inset-x-3 bottom-3 z-50 sm:hidden">
            <div className="liquid-glass liquid-dark flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
              <span className="text-[12.5px] font-bold text-amber">{changes} unpublished</span>
              <button type="button" className={btnPrimary} onClick={publish} disabled={publishing}>
                {publishing ? "Pushing…" : "🚀 Publish"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className={`liquid-glass fixed left-1/2 top-24 z-[70] w-[min(92vw,560px)] -translate-x-1/2 rounded-2xl px-5 py-3 text-[13.5px] font-bold ${toast.kind === "ok" ? "text-neon-lite" : "text-red-300"}`}
          >
            {toast.kind === "ok" ? "✅ " : "⚠️ "}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsPanel({ cfg, onCfg, onSync, base }: { cfg: GithubConfig; onCfg: (c: GithubConfig) => void; onSync: (c: GithubConfig) => void; base: Database }) {
  const [form, setForm] = useState<GithubConfig>(cfg);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const test = async () => {
    setBusy(true);
    setStatus(null);
    const res = await testGithubConnection(form);
    setBusy(false);
    setStatus({ ok: res.ok, text: res.message });
  };

  const save = async () => {
    setBusy(true);
    setStatus(null);
    const res = await testGithubConnection(form);
    setBusy(false);
    if (!res.ok) return setStatus({ ok: false, text: res.message });
    saveGithubConfig({ ...form, branch: form.branch || "main" });
    onCfg({ ...form, branch: form.branch || "main" });
    onSync({ ...form, branch: form.branch || "main" });
    setStatus({ ok: true, text: "Saved — the admin panel now publishes to this repo." });
  };

  return (
    <div className="space-y-5">
      <Card title="Publishing" description="How your changes reach visitors.">
        <ul className="space-y-2 text-[13.5px] text-mist">
          <li>• Edits stay as a private draft in this tab — <b className="text-paper">nothing is saved on your device</b>.</li>
          <li>
            • Press <b className="text-paper">Publish</b> (or Ctrl + S) → your content is written to{" "}
            <code className="text-paper">src/data/database.ts</code> in{" "}
            <b className="text-paper">
              {cfg.username}/{cfg.repo}
            </b>{" "}
            and photos to <code className="text-paper">public/uploads/</code>.
          </li>
          <li>• Vercel detects the push and rebuilds — the new version is live for everyone in about 1–2 minutes.</li>
          <li>
            • Last published: <b className="text-paper">{new Date(base.lastUpdated).toLocaleString()}</b>
          </li>
        </ul>
      </Card>

      <Card title="GitHub connection" description="Which repo the Publish button writes to.">
        <div className="grid gap-3 sm:max-w-[520px]">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Username / org">
              <input className={inputCls} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Field>
            <Field label="Repository">
              <input className={inputCls} value={form.repo} onChange={(e) => setForm({ ...form, repo: e.target.value })} />
            </Field>
          </div>
          <Field label="Branch">
            <input className={inputCls} value={form.branch || "main"} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
          </Field>
          <Field label="Personal access token">
            <input type="password" className={inputCls} value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
          </Field>
          {status && (
            <p className={`rounded-xl border px-3 py-2 text-[12.5px] ${status.ok ? "border-neon/25 bg-neon/10 text-neon-lite" : "border-red-400/20 bg-red-500/10 text-red-300"}`}>
              {status.text}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnGhost} onClick={test} disabled={busy}>
              Test connection
            </button>
            <button type="button" className={btnPrimary} onClick={save} disabled={busy}>
              Save connection
            </button>
            <button
              type="button"
              className="rounded-xl border border-red-400/20 bg-red-500/10 px-3.5 py-2 text-[13px] font-bold text-red-300 hover:bg-red-500/20 cursor-pointer"
              onClick={() => {
                if (confirm("Disconnect? The next time you open the admin panel you will be asked for credentials again.")) {
                  clearGithubConfig();
                  window.location.href = "/admin";
                }
              }}
            >
              Disconnect
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
