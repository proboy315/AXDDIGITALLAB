"use client";

import { loadGithubConfig, pushImageToRepo } from "@/lib/github";

const RESIZABLE = ["image/jpeg", "image/png", "image/webp"];
const MAX_DIM = 1800;
/** GitHub contents API caps writes at 1MB — keep a safe margin. */
const MAX_BYTES = 950_000;

async function shrink(file: File): Promise<File> {
  if (!RESIZABLE.includes(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 600_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, type === "image/png" ? ".png" : ".jpg"), { type });
  } catch {
    return file;
  }
}

function extFor(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Upload photos straight into the GitHub repo (public/uploads/…).
 * The URLs are stored in the JSON (database.ts) on Publish, and the
 * built Vercel site serves them from the repo.
 */
export async function uploadImages(files: FileList | File[]): Promise<{ urls: string[]; errors: string[] }> {
  const cfg = loadGithubConfig();
  if (!cfg) return { urls: [], errors: ["Connect GitHub in Settings first"] };
  const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
  if (!list.length) return { urls: [], errors: ["Please choose image files"] };

  const urls: string[] = [];
  const errors: string[] = [];
  for (const f of list) {
    try {
      const file = await shrink(f);
      if (file.size > MAX_BYTES) {
        errors.push(`${f.name}: still too large after compression — use a smaller photo`);
        continue;
      }
      const b64 = bufToBase64(await file.arrayBuffer());
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const name = `${id}.${extFor(file.type)}`;
      urls.push(await pushImageToRepo(cfg, name, b64));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : `${f.name}: upload failed`);
    }
  }
  return { urls, errors };
}
