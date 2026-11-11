"use client";

import type { Category, Database, SiteConfig } from "@/data/database";
import { GalleryManager } from "./GalleryManager";
import { Card, Field, Select, TextArea, TextInput, btnGhost } from "./ui";

type SetSite = (fn: (s: SiteConfig) => SiteConfig) => void;

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `cat-${Date.now().toString(36)}`;
}

const CAT_ICONS = ["grid", "code", "whatsapp", "palette", "chart", "robot", "shopify", "sparkle", "rocket", "bolt", "chat", "plane"];

export function CategoriesEditor({ db, setDraft }: { db: Database; setDraft: (fn: (d: Database) => Database) => void }) {
  const setCats = (fn: (c: Category[]) => Category[]) => setDraft((d) => ({ ...d, categories: fn(d.categories) }));
  const count = (id: string) => db.products.filter((p) => p.category === id).length;
  return (
    <Card
      title="Categories"
      description="The filter tabs above your services. Rename, reorder or add new ones."
      action={
        <button
          type="button"
          className={btnGhost}
          onClick={() => {
            const label = "New Category";
            const id = `${slugify(label)}-${Date.now().toString(36).slice(-4)}`;
            setCats((c) => [...c, { id, label, slug: id, icon: "sparkle" }]);
          }}
        >
          ＋ Add category
        </button>
      }
    >
      <div className="space-y-2.5">
        {db.categories.map((c, i) => (
          <div key={c.id} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-2xl border border-white/[0.06] bg-black/20 p-2.5 sm:grid-cols-[1fr_150px_auto]">
            <input
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-[14px] font-semibold text-paper outline-none focus:border-neon/50"
              value={c.label}
              onChange={(e) => setCats((list) => list.map((x) => (x.id === c.id ? { ...x, label: e.target.value } : x)))}
            />
            <div className="hidden sm:block">
              <Select value={c.icon} onChange={(v) => setCats((list) => list.map((x) => (x.id === c.id ? { ...x, icon: v } : x)))} options={CAT_ICONS.map((v) => ({ value: v, label: v }))} />
            </div>
            <div className="flex items-center gap-1">
              <span className="mr-1 hidden text-[11px] text-mist-dim sm:inline">{c.id === "all" ? "All" : `${count(c.id)} items`}</span>
              <button type="button" disabled={i === 0} onClick={() => setCats((l) => { const n = [...l]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05] text-mist hover:text-paper disabled:opacity-30 cursor-pointer">↑</button>
              <button type="button" disabled={i === db.categories.length - 1} onClick={() => setCats((l) => { const n = [...l]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05] text-mist hover:text-paper disabled:opacity-30 cursor-pointer">↓</button>
              {c.id !== "all" && (
                <button
                  type="button"
                  onClick={() => {
                    if (count(c.id) > 0 && !confirm(`${count(c.id)} services use "${c.label}". Delete anyway?`)) return;
                    setCats((l) => l.filter((x) => x.id !== c.id));
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function BrandEditor({ site, setSite }: { site: SiteConfig; setSite: SetSite }) {
  const hero = (k: keyof SiteConfig["hero"], v: string) => setSite((s) => ({ ...s, hero: { ...s.hero, [k]: v } }));
  return (
    <div className="space-y-5">
      <Card title="Brand" description="Your business name and main description.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name"><TextInput value={site.name} onChange={(v) => setSite((s) => ({ ...s, name: v }))} /></Field>
          <Field label="Short name"><TextInput value={site.shortName} onChange={(v) => setSite((s) => ({ ...s, shortName: v }))} /></Field>
          <Field label="Tagline" className="sm:col-span-2"><TextInput value={site.tagline} onChange={(v) => setSite((s) => ({ ...s, tagline: v }))} /></Field>
          <Field label="Description" className="sm:col-span-2"><TextArea value={site.description} onChange={(v) => setSite((s) => ({ ...s, description: v }))} /></Field>
        </div>
      </Card>
      <Card title="Hero section" description="The first thing visitors see at the top of the page.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Small label (eyebrow)" className="sm:col-span-2"><TextInput value={site.hero.eyebrow} onChange={(v) => hero("eyebrow", v)} /></Field>
          <Field label="Headline part 1"><TextInput value={site.hero.titleLine1} onChange={(v) => hero("titleLine1", v)} /></Field>
          <Field label="Headline part 2"><TextInput value={site.hero.titleLine2} onChange={(v) => hero("titleLine2", v)} /></Field>
          <Field label="Highlighted words" className="sm:col-span-2"><TextInput value={site.hero.highlight} onChange={(v) => hero("highlight", v)} /></Field>
          <Field label="Subtitle" className="sm:col-span-2"><TextArea value={site.hero.subtitle} onChange={(v) => hero("subtitle", v)} /></Field>
          <Field label="WhatsApp button text"><TextInput value={site.hero.ctaPrimary} onChange={(v) => hero("ctaPrimary", v)} /></Field>
          <Field label="Browse button text"><TextInput value={site.hero.ctaSecondary} onChange={(v) => hero("ctaSecondary", v)} /></Field>
        </div>
      </Card>
      <Card title="Trust highlights" description="The four short promises shown below the services.">
        <div className="grid gap-3 sm:grid-cols-2">
          {site.trust.map((t, i) => (
            <div key={i} className="space-y-2 rounded-2xl border border-white/[0.06] bg-black/20 p-3">
              <TextInput value={t.title} onChange={(v) => setSite((s) => ({ ...s, trust: s.trust.map((x, j) => (j === i ? { ...x, title: v } : x)) }))} />
              <TextInput value={t.copy} onChange={(v) => setSite((s) => ({ ...s, trust: s.trust.map((x, j) => (j === i ? { ...x, copy: v } : x)) }))} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function ContactEditor({ site, setSite }: { site: SiteConfig; setSite: SetSite }) {
  const footer = site.footer;
  return (
    <div className="space-y-5">
      <Card title="Contact & WhatsApp" description="Order buttons open WhatsApp with this number.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp number" hint="Digits only, with country code"><TextInput value={site.whatsappNumber} onChange={(v) => setSite((s) => ({ ...s, whatsappNumber: v.replace(/[^\d]/g, "") }))} placeholder="923001234567" /></Field>
          <Field label="Phone (display)"><TextInput value={site.phoneDisplay} onChange={(v) => setSite((s) => ({ ...s, phoneDisplay: v }))} /></Field>
          <Field label="Email"><TextInput value={site.email} onChange={(v) => setSite((s) => ({ ...s, email: v }))} /></Field>
          <Field label="Address"><TextInput value={site.address} onChange={(v) => setSite((s) => ({ ...s, address: v }))} /></Field>
          <Field label="WhatsApp Channel URL"><TextInput value={site.whatsappChannelUrl} onChange={(v) => setSite((s) => ({ ...s, whatsappChannelUrl: v }))} /></Field>
          <Field label="WhatsApp Community URL"><TextInput value={site.whatsappCommunityUrl} onChange={(v) => setSite((s) => ({ ...s, whatsappCommunityUrl: v }))} /></Field>
        </div>
      </Card>
      <Card title="Footer">
        <div className="grid gap-4">
          <Field label="About text"><TextArea value={footer.about} onChange={(v) => setSite((s) => ({ ...s, footer: { ...s.footer, about: v } }))} /></Field>
          <Field label="Copyright"><TextInput value={footer.copyright} onChange={(v) => setSite((s) => ({ ...s, footer: { ...s.footer, copyright: v } }))} /></Field>
          <Field label="Social links">
            <div className="space-y-2">
              {footer.socials.map((so, i) => (
                <div key={i} className="grid grid-cols-[120px_1fr_auto] gap-2">
                  <TextInput value={so.label} onChange={(v) => setSite((s) => ({ ...s, footer: { ...s.footer, socials: s.footer.socials.map((x, j) => (j === i ? { ...x, label: v } : x)) } }))} />
                  <TextInput value={so.href} onChange={(v) => setSite((s) => ({ ...s, footer: { ...s.footer, socials: s.footer.socials.map((x, j) => (j === i ? { ...x, href: v } : x)) } }))} />
                  <button type="button" className="grid w-10 place-items-center rounded-xl bg-red-500/10 text-red-300 cursor-pointer" onClick={() => setSite((s) => ({ ...s, footer: { ...s.footer, socials: s.footer.socials.filter((_, j) => j !== i) } }))}>✕</button>
                </div>
              ))}
              <button type="button" className={btnGhost} onClick={() => setSite((s) => ({ ...s, footer: { ...s.footer, socials: [...s.footer.socials, { label: "Instagram", href: "https://", icon: "instagram" }] } }))}>＋ Add social link</button>
            </div>
          </Field>
        </div>
      </Card>
    </div>
  );
}

export function SeoEditor({ site, setSite }: { site: SiteConfig; setSite: SetSite }) {
  const seo = (k: keyof SiteConfig["seo"], v: string) => setSite((s) => ({ ...s, seo: { ...s.seo, [k]: v } }));
  return (
    <Card title="SEO & sharing" description="How your site appears on Google and when shared on WhatsApp / social media.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Page title" hint={`${site.seo.title.length}/60`} className="sm:col-span-2"><TextInput value={site.seo.title} onChange={(v) => seo("title", v)} /></Field>
        <Field label="Meta description" hint={`${site.seo.description.length}/160`} className="sm:col-span-2"><TextArea value={site.seo.description} onChange={(v) => seo("description", v)} /></Field>
        <Field label="Keywords" hint="Comma separated" className="sm:col-span-2"><TextArea rows={2} value={site.seo.keywords} onChange={(v) => seo("keywords", v)} /></Field>
        <Field label="Canonical URL"><TextInput value={site.seo.canonical} onChange={(v) => seo("canonical", v)} /></Field>
        <Field label="Twitter handle"><TextInput value={site.seo.twitterHandle} onChange={(v) => seo("twitterHandle", v)} /></Field>
        <Field label="Share image" className="sm:col-span-2">
          <GalleryManager max={1} images={site.seo.ogImage ? [site.seo.ogImage] : []} onChange={(next) => seo("ogImage", next[0] || "")} />
        </Field>
      </div>
    </Card>
  );
}
