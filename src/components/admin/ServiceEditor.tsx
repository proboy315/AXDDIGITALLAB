"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { BadgeType, Category, Product } from "@/data/database";
import { discountPercent } from "@/lib/db";
import { GalleryManager } from "./GalleryManager";
import { Field, NumberInput, Select, TextArea, TextInput, Toggle, btnDanger, btnPrimary, inputCls } from "./ui";

const BADGES: { value: string; label: string }[] = [
  { value: "", label: "No badge" },
  { value: "Best Seller", label: "Best Seller" },
  { value: "Popular", label: "Popular" },
  { value: "New", label: "New" },
  { value: "Limited", label: "Limited" },
  { value: "Hot Deal", label: "Hot Deal" },
];

const ICONS = ["sparkle", "code", "whatsapp", "shopify", "palette", "chart", "robot", "rocket", "plane", "chat", "bolt", "grid"];

export function ServiceEditor({
  product,
  categories,
  onChange,
  onClose,
  onDelete,
}: {
  product: Product;
  categories: Category[];
  onChange: (p: Product) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [tagDraft, setTagDraft] = useState("");
  const set = <K extends keyof Product>(k: K, v: Product[K]) => onChange({ ...product, [k]: v });
  const images = [product.image, ...(product.gallery || [])].filter(Boolean);
  const disc = discountPercent(product.price, product.oldPrice);

  const addTag = () => {
    const parts = tagDraft.split(",").map((t) => t.trim()).filter(Boolean);
    if (!parts.length) return;
    set("tags", Array.from(new Set([...product.tags, ...parts])));
    setTagDraft("");
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="fixed right-0 top-0 z-[61] flex h-[100dvh] w-full max-w-[640px] flex-col border-l border-white/[0.08] bg-[#060908]/90 backdrop-blur-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-neon">Editing service</p>
            <h2 className="truncate font-display text-[19px] font-extrabold text-paper">{product.title || "Untitled service"}</h2>
          </div>
          <button type="button" onClick={onClose} className={btnPrimary}>
            Done
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <section>
            <h4 className="mb-3 text-[13px] font-extrabold text-paper">📷 Photos</h4>
            <GalleryManager
              images={images}
              onChange={(next) => onChange({ ...product, image: next[0] || "", gallery: next.slice(1) })}
            />
          </section>

          <section className="grid gap-4">
            <h4 className="text-[13px] font-extrabold text-paper">📝 Basics</h4>
            <Field label="Title">
              <TextInput value={product.title} onChange={(v) => set("title", v)} placeholder="e.g. Business Website" />
            </Field>
            <Field label="Short description" hint="Shown on the card">
              <TextArea rows={2} value={product.description} onChange={(v) => set("description", v)} />
            </Field>
            <Field label="Full description" hint="Shown in the details panel">
              <TextArea rows={4} value={product.longDescription} onChange={(v) => set("longDescription", v)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Select
                  value={product.category}
                  onChange={(v) => set("category", v)}
                  options={categories.filter((c) => c.id !== "all").map((c) => ({ value: c.id, label: c.label }))}
                />
              </Field>
              <Field label="Badge">
                <Select value={product.badge || ""} onChange={(v) => set("badge", (v || null) as BadgeType)} options={BADGES} />
              </Field>
            </div>
            <Field label="What's included (tags)">
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/[0.08] bg-black/30 p-2">
                {product.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-lg bg-white/[0.07] px-2 py-1 text-[12px] text-chalk">
                    {t}
                    <button type="button" onClick={() => set("tags", product.tags.filter((x) => x !== t))} className="text-mist hover:text-red-300 cursor-pointer">
                      ✕
                    </button>
                  </span>
                ))}
                <input
                  className="min-w-[140px] flex-1 bg-transparent px-1.5 py-1 text-[13px] text-paper outline-none placeholder:text-mist-dim/70"
                  placeholder="Type & press Enter"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  onBlur={addTag}
                />
              </div>
            </Field>
          </section>

          <section className="grid gap-4">
            <h4 className="text-[13px] font-extrabold text-paper">💰 Pricing</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price (Rs.)">
                <NumberInput value={product.price} onChange={(v) => set("price", v ?? 0)} />
              </Field>
              <Field label="Old price (Rs.)" hint={disc > 0 ? `${disc}% OFF shown` : "Optional"}>
                <NumberInput value={product.oldPrice} onChange={(v) => set("oldPrice", v)} />
              </Field>
            </div>
          </section>

          <section className="grid gap-4">
            <h4 className="text-[13px] font-extrabold text-paper">⚙️ Details</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Delivery time">
                <TextInput value={product.deliveryTime} onChange={(v) => set("deliveryTime", v)} placeholder="24-48 Hours" />
              </Field>
              <Field label="Stock left" hint="Optional">
                <NumberInput value={product.stock} onChange={(v) => set("stock", v)} />
              </Field>
              <Field label="Rating (0–5)">
                <NumberInput step={0.1} value={product.rating} onChange={(v) => set("rating", Math.max(0, Math.min(5, v ?? 0)))} />
              </Field>
              <Field label="Reviews label">
                <TextInput value={product.reviews} onChange={(v) => set("reviews", v)} placeholder="1.2k+" />
              </Field>
              <Field label="Sort priority" hint="Higher = first">
                <NumberInput value={product.popularity} onChange={(v) => set("popularity", v ?? 0)} />
              </Field>
              <Field label="Icon">
                <Select value={product.icon} onChange={(v) => set("icon", v)} options={ICONS.map((i) => ({ value: i, label: i }))} />
              </Field>
              <Field label="Accent color">
                <div className="flex gap-2">
                  <input type="color" value={product.accent || "#1DB86A"} onChange={(e) => set("accent", e.target.value)} className="h-[42px] w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
                  <input className={inputCls} value={product.accent} onChange={(e) => set("accent", e.target.value)} />
                </div>
              </Field>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Toggle label="In stock" checked={product.inStock !== false} onChange={(v) => set("inStock", v)} />
              <Toggle label="Featured" checked={!!product.featured} onChange={(v) => set("featured", v)} />
            </div>
          </section>

          <div className="border-t border-white/[0.07] pt-5">
            <button
              type="button"
              className={btnDanger}
              onClick={() => {
                if (confirm(`Delete "${product.title}"? (Takes effect after you Publish)`)) onDelete();
              }}
            >
              Delete this service
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
