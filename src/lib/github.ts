import type { Database } from "@/data/database";
import { normalizeDatabase } from "./db";

export interface GithubConfig {
  username: string;
  repo: string;
  token: string;
  branch?: string;
}

const GITHUB_KEY = "axd_github_config";

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function saveGithubConfig(cfg: GithubConfig) {
  localStorage.setItem(GITHUB_KEY, JSON.stringify(cfg));
  setCookie("axd_github_user", cfg.username);
  setCookie("axd_github_repo", cfg.repo);
  setCookie("axd_github_token", cfg.token);
}

export function loadGithubConfig(): GithubConfig | null {
  try {
    const raw = localStorage.getItem(GITHUB_KEY);
    if (raw) return JSON.parse(raw);
    const u = getCookie("axd_github_user");
    const r = getCookie("axd_github_repo");
    const t = getCookie("axd_github_token");
    if (u && r && t) return { username: u, repo: r, token: t };
    return null;
  } catch {
    return null;
  }
}

export function clearGithubConfig() {
  localStorage.removeItem(GITHUB_KEY);
  document.cookie = "axd_github_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "axd_github_repo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "axd_github_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function b64Encode(str: string) {
  return btoa(unescape(encodeURIComponent(str)));
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  } as Record<string, string>;
}

export async function pushToGithub(db: Database, cfg: GithubConfig): Promise<{ ok: boolean; message: string }> {
  const { username, repo, token, branch = "main" } = cfg;
  if (!username || !repo || !token) return { ok: false, message: "Missing GitHub config" };

  const path = "src/data/database.ts";
  const apiBase = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;

  try {
    let sha: string | undefined;
    const getRes = await fetch(`${apiBase}?ref=${branch}`, { headers: headers(token), cache: "no-store" });
    if (getRes.ok) {
      const j = await getRes.json();
      sha = j.sha;
    }

    const content = b64Encode(generateDatabaseTs(db));

    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify({
        message: `chore: publish AXD DIGITAL LAB site ${new Date().toLocaleString()}`,
        content,
        branch,
        sha,
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      return { ok: false, message: `GitHub push failed: ${putRes.status} ${err.slice(0, 300)}` };
    }

    return { ok: true, message: "Pushed to GitHub! Vercel will rebuild your site — the new version goes live in about 1–2 minutes." };
  } catch (e: unknown) {
    return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Upload an image into the repo's public/uploads folder so the built site can serve it. */
export async function pushImageToRepo(cfg: GithubConfig, fileName: string, base64: string): Promise<string> {
  const { username, repo, token, branch = "main" } = cfg;
  const path = `public/uploads/${fileName}`;
  const apiBase = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;

  let sha: string | undefined;
  const tryPut = async () =>
    fetch(apiBase, {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify({
        message: `chore: upload ${fileName}`,
        content: base64,
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

  let putRes = await tryPut();
  if (!putRes.ok && putRes.status === 422) {
    // file already exists — fetch its sha and retry
    const getRes = await fetch(`${apiBase}?ref=${branch}`, { headers: headers(token), cache: "no-store" });
    if (getRes.ok) {
      const j = await getRes.json();
      sha = j.sha;
      putRes = await tryPut();
    }
  }
  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error(`${fileName}: ${putRes.status} ${err.slice(0, 200)}`);
  }
  return `/uploads/${fileName}`;
}

/** Pull the JSON object assigned to `defaultDatabase` out of the database.ts source text. */
function parseDatabaseSource(text: string): Database | null {
  const marker = "defaultDatabase: Database = ";
  const start = text.indexOf(marker);
  if (start < 0) return null;
  const objStart = text.indexOf("{", start);
  if (objStart < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;
  for (let i = objStart; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
  }
  if (end < 0) return null;
  try {
    return normalizeDatabase(JSON.parse(text.slice(objStart, end + 1)) as unknown);
  } catch {
    return null;
  }
}

/**
 * Read the currently published database.ts from the repo.
 * Uses the GitHub API first: it always returns the newest commit, while the
 * raw.githubusercontent.com CDN can keep serving the previous version for a
 * few minutes after a publish (editing on top of that would undo the publish).
 */
export async function fetchLatestDatabase(cfg: GithubConfig): Promise<Database | null> {
  const { username, repo, token, branch = "main" } = cfg;
  const path = "src/data/database.ts";

  try {
    const res = await fetch(
      `https://api.github.com/repos/${username}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.raw+json" },
        cache: "no-store",
      }
    );
    if (res.ok) {
      const parsed = parseDatabaseSource(await res.text());
      if (parsed) return parsed;
    }
  } catch {
    /* fall through to the raw file */
  }

  try {
    const res = await fetch(`https://raw.githubusercontent.com/${username}/${repo}/${branch}/${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return parseDatabaseSource(await res.text());
  } catch {
    return null;
  }
}

export async function testGithubConnection(cfg: GithubConfig) {
  try {
    const res = await fetch(`https://api.github.com/repos/${cfg.username}/${cfg.repo}`, {
      headers: headers(cfg.token),
    });
    if (!res.ok) return { ok: false, message: `Repo not found or token invalid (${res.status})` };
    const j = await res.json();
    return { ok: true, message: `Connected to ${j.full_name} • ${j.private ? "Private" : "Public"} • Default branch: ${j.default_branch}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Connection failed" };
  }
}

export function generateDatabaseTs(db: Database): string {
  return `export type BadgeType = "Best Seller" | "Popular" | "New" | "Limited" | "Hot Deal" | null;

export interface Category {
  id: string;
  label: string;
  slug: string;
  icon: string;
  description?: string;
  color?: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: string;
  image: string;
  gallery?: string[];
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: string;
  reviewsCount?: number;
  badge?: BadgeType;
  tags: string[];
  accent: string;
  icon: string;
  popularity: number;
  stock?: number;
  deliveryTime?: string;
  featured?: boolean;
  inStock?: boolean;
}

export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  keywords: string[];
  whatsappNumber: string;
  whatsappChannelUrl?: string;
  whatsappCommunityUrl?: string;
  phoneDisplay: string;
  email: string;
  address: string;
  hero: { eyebrow: string; titleLine1: string; titleLine2: string; highlight: string; subtitle: string; ctaPrimary: string; ctaSecondary: string; };
  footer: { about: string; copyright: string; links: { label: string; href: string }[]; socials: { label: string; href: string; icon: string }[]; };
  seo: { title: string; description: string; keywords: string; ogImage: string; canonical: string; twitterHandle: string; schemaType: string; };
  trust: { title: string; copy: string; icon: string; }[];
}

export interface Database { version: number; lastUpdated: string; site: SiteConfig; categories: Category[]; products: Product[]; }

export const defaultDatabase: Database = ${JSON.stringify(db, null, 2)};

export const sortOptions = [
  { id: "popular", label: "Popular First" },
  { id: "rating", label: "Highest Rated" },
  { id: "low", label: "Price: Low to High" },
  { id: "high", label: "Price: High to Low" },
  { id: "discount", label: "Biggest Discount" },
] as const;
`;
}
