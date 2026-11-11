import { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Product } from "@/data/database";
import { discountPercent, whatsappLink } from "@/lib/db";
import { ArrowRight, Star, WhatsApp } from "./IconsNew";
import { Glyph } from "./Glyph";

const EASE: [number, number, number, number] = [0.22, 0.8, 0.28, 1];

const badgeStyles: Record<string, string> = {
  "Best Seller": "bg-[#D6A446] text-[#221603] shadow-[0_6px_18px_-6px_rgba(245,183,61,0.65)]",
  Popular: "bg-[#1DB86A] text-[#04150C] shadow-[0_6px_18px_-6px_rgba(29,184,106,0.65)]",
  New: "bg-[#6F58C9] text-white shadow-[0_6px_18px_-6px_rgba(139,92,246,0.7)]",
  Limited: "bg-[#C94141] text-white shadow-[0_6px_18px_-6px_rgba(239,68,68,0.7)]",
  "Hot Deal": "bg-[#D0682A] text-white shadow-[0_6px_18px_-6px_rgba(249,115,22,0.7)]",
};

function formatPKR(n: number) {
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

export function ProductCard({
  product,
  index,
  whatsappNumber,
  categoryLabel,
  onView,
}: {
  product: Product;
  index: number;
  whatsappNumber: string;
  categoryLabel?: string;
  onView?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const disc = discountPercent(product.price, product.oldPrice);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dx * 5, y: -dy * 5 });
  };
  const reset = () => setTilt({ x: 0, y: 0 });

  const waHref = whatsappLink(product.title, product.price, whatsappNumber, categoryLabel, {
    id: product.id,
    oldPrice: product.oldPrice,
    deliveryTime: product.deliveryTime,
    slug: product.slug,
  });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.06, ease: EASE }}
      className="group perspective-[1000px]"
      style={{ perspective: "1200px" }}
    >
      <article
        className="relative flex h-full flex-col overflow-hidden rounded-[22px] liquid-glass border border-white/[0.07] glass-edge transition-[border-color,box-shadow] duration-300 hover:border-neon/45 hover:shadow-[0_28px_60px_-30px_rgba(29,184,106,0.45)]"
        style={{
          transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.25s ease-out",
        }}
      >
        {/* liquid glass glare following the 3D tilt */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `radial-gradient(420px circle at ${50 + tilt.x * 7}% ${50 - tilt.y * 7}%, rgba(255,255,255,0.09), transparent 45%)` }}
        />
        {/* top image */}
        <div className="relative h-[192px] overflow-hidden bg-black/40 sm:h-[210px]">
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover transition-[transform,filter] duration-[700ms] group-hover:scale-[1.06] group-hover:brightness-[1.08]"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {/* gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(5,11,8,0.55)_85%,rgba(5,11,8,0.92)_100%)]" />
          {/* 3D inner glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-neon/15 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />

          {/* badge row */}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            {product.badge && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold leading-none tracking-wide ${badgeStyles[product.badge] || badgeStyles["Popular"]}`}
              >
                {product.badge}
              </span>
            )}
            {disc > 0 && (
              <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-black tracking-wide text-[#0A1210]">
                {disc}% OFF
              </span>
            )}
            {(product.gallery?.length ?? 0) > 0 && (
              <span className="inline-flex items-center rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                📷 {(product.gallery?.length ?? 0) + 1}
              </span>
            )}
          </div>

          {/* bottom meta on image */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md border border-white/10">
              <span
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ background: product.inStock === false ? "#EF4444" : "#1DB86A" }}
              />
              {product.inStock === false ? "Out of stock" : product.deliveryTime || "Fast delivery"}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-neon/15 border border-neon/20 px-2.5 py-1 text-[11px] font-bold text-neon-lite backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse" />
              {categoryLabel || product.category}
            </span>
          </div>

          {/* icon tile floating */}
          <div
            className="absolute right-3 top-12 grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md sm:h-12 sm:w-12"
            style={{
              transform: "translateZ(24px)",
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 24px -12px ${product.accent}80`,
            }}
          >
            <span style={{ color: product.accent }}>
              <Glyph name={product.icon as never} className="h-6 w-6 sm:h-6 sm:w-6" />
            </span>
          </div>
        </div>

        {/* body */}
        <div className="flex flex-1 flex-col p-4 sm:p-5" style={{ transform: "translateZ(12px)" }}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-[19px] font-extrabold leading-[1.15] tracking-[-0.02em] text-paper sm:text-[20px] line-clamp-2">
              {product.title}
            </h3>
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.05] border border-white/[0.07] px-2.5 py-1">
              <Star className="h-3.5 w-3.5 text-amber" />
              <span className="text-[12.5px] font-bold text-paper tabular">{product.rating.toFixed(1)}</span>
              <span className="text-[11px] text-mist">({product.reviews})</span>
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-[13.5px] leading-[1.6] text-mist">{product.description}</p>

          {/* tags */}
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {product.tags.slice(0, 3).map((t) => (
              <li
                key={t}
                className="rounded-full border border-line-bright/60 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-mist"
              >
                {t}
              </li>
            ))}
            {product.tags.length > 3 && (
              <li className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-mist-dim">+{product.tags.length - 3}</li>
            )}
          </ul>

          {/* price */}
          <div className="mt-4 flex items-end justify-between gap-3 border-t border-line/70 pt-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[22px] font-black tracking-[-0.02em] text-paper tabular sm:text-[24px]">
                  {formatPKR(product.price)}
                </span>
                {product.oldPrice && product.oldPrice > product.price && (
                  <span className="text-[13px] font-semibold text-mist-dim line-through tabular">{formatPKR(product.oldPrice)}</span>
                )}
              </div>
              {disc > 0 && product.oldPrice && (
                <p className="text-[11px] font-bold text-neon">You save {formatPKR(product.oldPrice - product.price)} 🎉</p>
              )}
            </div>
            <span className="hidden sm:inline-flex text-[11px] font-semibold text-mist-dim">
              {product.stock ? `${product.stock} left` : ""}
            </span>
          </div>

          {/* actions */}
          <div className="mt-4 grid grid-cols-[1.1fr_1.6fr] gap-2.5">
            <button
              type="button"
              onClick={onView}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line-bright bg-white/[0.03] px-3 py-3 text-[13px] font-bold text-chalk transition hover:border-neon/40 hover:bg-neon/10 hover:text-neon-lite active:scale-[0.98]"
            >
              Details <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-neon px-3 py-3 text-[13px] font-extrabold text-[#04150C] shadow-[0_10px_26px_-10px_rgba(29,184,106,0.45)] transition hover:bg-neon-lite hover:shadow-[0_16px_32px_-10px_rgba(29,184,106,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            >
              <WhatsApp className="h-[16px] w-[16px]" />
              Buy on WhatsApp
            </a>
          </div>
        </div>

        {/* hover green hairline */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-neon/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      </article>
    </motion.div>
  );
}
