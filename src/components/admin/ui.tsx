"use client";

import type { ReactNode } from "react";

export const inputCls =
  "w-full rounded-xl border border-white/[0.08] bg-black/30 px-3.5 py-2.5 text-[14px] text-paper placeholder:text-mist-dim/70 outline-none transition focus:border-neon/50 focus:bg-black/40 focus:shadow-[0_0_0_3px_rgba(29,184,106,0.12)]";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[13px] font-bold text-chalk transition hover:border-white/20 hover:bg-white/[0.07] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-neon px-4 py-2 text-[13px] font-extrabold text-[#04150C] shadow-[0_10px_26px_-12px_rgba(29,184,106,0.6)] transition hover:bg-neon-lite hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0 disabled:cursor-not-allowed cursor-pointer";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3.5 py-2 text-[13px] font-bold text-red-300 transition hover:bg-red-500/20 cursor-pointer";

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-bold uppercase tracking-wider text-mist">{label}</span>
        {hint && <span className="text-[11px] text-mist-dim">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder, type = "text" }: { value: string | undefined; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} className={inputCls} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function TextArea({ value, onChange, rows = 3, placeholder }: { value: string | undefined; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return <textarea rows={rows} className={`${inputCls} resize-y leading-relaxed`} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function NumberInput({ value, onChange, placeholder, step }: { value: number | undefined; onChange: (v: number | undefined) => void; placeholder?: string; step?: number }) {
  return (
    <input
      type="number"
      step={step}
      className={inputCls}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
    />
  );
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select className={`${inputCls} cursor-pointer`} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#0a0f0d]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-black/30 px-3.5 py-2.5 text-left text-[13px] font-semibold text-chalk cursor-pointer"
    >
      {label}
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-neon" : "bg-white/10"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export function Card({ title, description, children, action }: { title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="liquid-glass rounded-[22px] p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[17px] font-extrabold text-paper">{title}</h3>
          {description && <p className="mt-1 text-[13px] text-mist">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
