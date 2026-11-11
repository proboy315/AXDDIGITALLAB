"use client";

import { useRef, useState } from "react";
import { uploadImages } from "./upload";
import { btnGhost, inputCls } from "./ui";

/**
 * Manage multiple photos. images[0] is the cover shown on cards.
 */
export function GalleryManager({ images, onChange, max = 12 }: { images: string[]; onChange: (next: string[]) => void; max?: number }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const add = async (files: FileList | File[]) => {
    const room = max - images.length;
    if (room <= 0) return setMsg(`Maximum ${max} photos`);
    setBusy(true);
    setMsg(null);
    const { urls, errors } = await uploadImages(Array.from(files).slice(0, room));
    setBusy(false);
    if (urls.length) onChange([...images, ...urls]);
    if (errors.length) setMsg(errors.join(" • "));
    else if (urls.length) setMsg(`${urls.length} photo${urls.length > 1 ? "s" : ""} added`);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {images.map((src, i) => (
          <div
            key={src + i}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIdx !== null) move(dragIdx, i);
              setDragIdx(null);
            }}
            className={`group relative aspect-[4/3] overflow-hidden rounded-xl border bg-black/40 ${i === 0 ? "border-neon/60" : "border-white/10"} ${dragIdx === i ? "opacity-40" : ""}`}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-md bg-neon px-1.5 py-0.5 text-[10px] font-black text-[#04150C]">COVER</span>}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/85 to-transparent p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <div className="flex gap-1">
                <button type="button" title="Move left" onClick={() => move(i, i - 1)} className="grid h-6 w-6 place-items-center rounded-md bg-white/15 text-[12px] text-white hover:bg-white/25 cursor-pointer">‹</button>
                <button type="button" title="Move right" onClick={() => move(i, i + 1)} className="grid h-6 w-6 place-items-center rounded-md bg-white/15 text-[12px] text-white hover:bg-white/25 cursor-pointer">›</button>
              </div>
              <div className="flex gap-1">
                {i !== 0 && (
                  <button type="button" title="Make cover" onClick={() => move(i, 0)} className="grid h-6 place-items-center rounded-md bg-white/15 px-1.5 text-[10px] font-bold text-white hover:bg-neon hover:text-[#04150C] cursor-pointer">★</button>
                )}
                <button type="button" title="Remove" onClick={() => onChange(images.filter((_, j) => j !== i))} className="grid h-6 w-6 place-items-center rounded-md bg-red-500/70 text-[12px] text-white hover:bg-red-500 cursor-pointer">✕</button>
              </div>
            </div>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (e.dataTransfer.files?.length) add(e.dataTransfer.files);
            }}
            className={`flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-center transition cursor-pointer ${drag ? "border-neon bg-neon/10" : "border-white/15 bg-white/[0.02] hover:border-neon/50 hover:bg-white/[0.04]"}`}
          >
            {busy ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-neon border-t-transparent" />
            ) : (
              <>
                <span className="text-[22px] leading-none text-neon">＋</span>
                <span className="px-1 text-[11px] font-bold text-mist">Add photos</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) add(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="mt-3 flex gap-2">
        <input className={inputCls} placeholder="…or paste an image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button
          type="button"
          className={btnGhost}
          disabled={!url.trim()}
          onClick={() => {
            onChange([...images, url.trim()]);
            setUrl("");
          }}
        >
          Add
        </button>
      </div>
      <p className="mt-2 text-[11.5px] text-mist-dim">
        {msg ? <span className="text-neon-lite">{msg}</span> : "Select multiple files at once or drag & drop. Drag thumbnails to reorder — the first photo is the cover."}
      </p>
    </div>
  );
}
