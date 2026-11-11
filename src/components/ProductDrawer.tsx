import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/data/database";
import { discountPercent, whatsappLink } from "@/lib/db";
import { X, Star, WhatsApp, ShieldCheck, Bolt, Headset } from "./IconsNew";

export function ProductDrawer({ product, open, onClose, whatsappNumber, categoryLabel }: { product: Product | null; open: boolean; onClose: () => void; whatsappNumber: string; categoryLabel?: string }) {
  const [view, setView] = useState<{ id: string; idx: number }>({ id: "", idx: 0 });
  if (!product) return null;
  const images = [product.image, ...(product.gallery || [])].filter(Boolean);
  const activeIdx = view.id === product.id ? Math.min(view.idx, images.length - 1) : 0;
  const go = (i: number) => setView({ id: product.id, idx: (i + images.length) % images.length });
  const disc = discountPercent(product.price, product.oldPrice);
  const wa = whatsappLink(product.title, product.price, whatsappNumber, categoryLabel, {
    id: product.id,
    oldPrice: product.oldPrice,
    deliveryTime: product.deliveryTime,
    slug: product.slug,
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-[520px] flex-col bg-[#060908]/85 backdrop-blur-2xl border-l border-white/[0.07] shadow-[-30px_0_80px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div className="relative h-[260px] shrink-0 sm:h-[300px]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={images[activeIdx]}
                  src={images[activeIdx]}
                  alt={product.title}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="h-full w-full object-cover"
                />
              </AnimatePresence>
              {images.length > 1 && (
                <>
                  <button type="button" aria-label="Previous photo" onClick={() => go(activeIdx - 1)} className="liquid-glass absolute left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-white cursor-pointer">‹</button>
                  <button type="button" aria-label="Next photo" onClick={() => go(activeIdx + 1)} className="liquid-glass absolute right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-white cursor-pointer">›</button>
                  <span className="absolute left-4 top-4 z-10 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">{activeIdx + 1} / {images.length}</span>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#060908] via-[#060908]/30 to-transparent" />
              <button onClick={onClose} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur border border-white/20 hover:bg-black/70 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2">
                  {product.badge && <span className="rounded-full bg-[#D6A446] px-3 py-1 text-[11px] font-black text-[#221603]">{product.badge}</span>}
                  {disc > 0 && <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#0A1410]">{disc}% OFF</span>}
                  <span className="rounded-full bg-neon/20 border border-neon/30 px-3 py-1 text-[11px] font-bold text-neon backdrop-blur">{categoryLabel}</span>
                </div>
                <h2 className="mt-3 font-display text-[28px] font-black leading-tight text-paper">{product.title}</h2>
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur"><Star className="h-3.5 w-3.5 text-amber" /> {product.rating} <span className="text-white/60">({product.reviews})</span></span>
                  <span className="text-[12px] text-white/70">{product.deliveryTime}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-5 sm:p-6 space-y-5">
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-none -mt-1 pb-1">
                  {images.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => go(i)}
                      className={`h-14 w-20 shrink-0 overflow-hidden rounded-xl border transition cursor-pointer ${i === activeIdx ? "border-neon/70 shadow-[0_0_0_2px_rgba(29,184,106,0.25)]" : "border-white/10 opacity-60 hover:opacity-100"}`}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-3">
                <span className="font-display text-[28px] font-black text-paper tabular">Rs. {product.price.toLocaleString("en-PK")}</span>
                {product.oldPrice && product.oldPrice > product.price && <span className="text-[14px] font-semibold text-mist-dim line-through tabular">Rs. {product.oldPrice.toLocaleString("en-PK")}</span>}
                {disc > 0 && <span className="rounded-full bg-neon/15 px-2.5 py-1 text-[12px] font-black text-neon">{disc}% save</span>}
              </div>
              {product.oldPrice && disc > 0 && <p className="text-[12px] font-bold text-neon -mt-3">You save Rs. {(product.oldPrice - product.price).toLocaleString("en-PK")} • Limited time offer 🎉</p>}

              <p className="text-[14px] leading-relaxed text-mist">{product.longDescription || product.description}</p>

              <div>
                <h4 className="text-[11px] font-bold tracking-widest text-mist uppercase">Includes</h4>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {product.tags.map((t) => (
                    <li key={t} className="rounded-full border border-line-bright bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-chalk">{t}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: ShieldCheck, title: "Secure Payment", copy: "JazzCash / EasyPaisa / Card" },
                  { icon: Bolt, title: "Fast Delivery", copy: product.deliveryTime || "12-48 Hours" },
                  { icon: Headset, title: "Premium Support", copy: "24/7 WhatsApp help" },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                      <span className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-neon/10 text-neon border border-neon/20"><Icon className="h-4 w-4" /></span>
                      <p className="mt-2 text-[11px] font-extrabold text-paper leading-tight">{f.title}</p>
                      <p className="text-[10px] text-mist leading-tight">{f.copy}</p>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl bg-neon/10 border border-neon/20 p-4">
                <p className="text-[12px] font-bold text-paper">How to order?</p>
                <p className="mt-1 text-[12px] leading-relaxed text-mist">Click Buy on WhatsApp → chat opens with pre-filled message → we reply in 5-10 minutes with payment & delivery details. No signup needed.</p>
              </div>
            </div>

            <div className="border-t border-white/[0.06] bg-black/30 p-4 sm:p-5">
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 rounded-full border border-line-bright bg-white/[0.04] py-3.5 text-[13px] font-bold text-mist hover:text-paper cursor-pointer">Close</button>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex-[1.5] inline-flex items-center justify-center gap-2 rounded-full bg-neon py-3.5 text-[14px] font-extrabold text-[#04150C] shadow-[0_12px_30px_-12px_rgba(29,184,106,0.45)] hover:bg-neon-lite cursor-pointer">
                  <WhatsApp className="h-5 w-5" /> Buy on WhatsApp — Rs. {product.price.toLocaleString("en-PK")}
                </a>
              </div>
              <p className="mt-2 text-center text-[11px] text-mist-dim">Redirects to WhatsApp • {whatsappNumber} • Instant reply</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
