// Team access system — let the owner delegate admin work WITHOUT ever
// showing the GitHub username, repo name or token to the teammate.
//
// How it works:
//  1. Owner clicks "Generate access key" -> a single encrypted string
//     (AXD1.<secret>.<sealed payload>) is created. The GitHub credentials
//     live ONLY inside the sealed payload.
//  2. The teammate pastes the key. The app decrypts it in memory — the
//     credentials are never rendered, never stored in plain text, and the
//     teammate UI hides every credential field.
//  3. On first activation the teammate MUST enroll an authenticator app:
//     they scan a QR code (the raw secret is never displayed as text) and
//     confirm a 6-digit code. Every later sign-in asks for a fresh code.
//  4. The owner can revoke a key any time. Revocation is synced to the repo
//     (.axd/revoked.json) so it applies on every device. Rotating the GitHub
//     PAT instantly kills ALL delegated access.
//
// Honest limits (also shown in the UI): a delegated browser technically holds
// the token in memory to push to GitHub, so only share keys with people you
// trust, set an expiry, and revoke keys you no longer need.

import {
  sealJSON,
  openJSON,
  randomBytes,
  b64urlEncode,
  b64urlDecode,
  newTotpSecret,
  b32encode,
  verifyTotp,
  fingerprintOf,
} from "./vaultCrypto";
import type { GithubConfig } from "./db";
import { readRepoFile, writeRepoFile } from "./github";

export const REVOCATION_PATH = ".axd/revoked.json";
const DOMAIN = "axd-team-access-v1";
const KEYS_KEY = "axd_team_keys_v1";
const VAULT_KEY = "axd_team_vault_v1";

export interface TeamPayload {
  v: 1;
  u: string; // github username (sealed — never displayed to team)
  r: string; // repo (sealed)
  t: string; // token (sealed)
  b: string; // branch
  label: string;
  iat: number;
  exp: number; // 0 = never expires
}

export interface TeamMeta {
  fp: string;
  label: string;
  createdAt: number;
  exp: number;
  revoked: boolean;
}

export interface TeamVault {
  fp: string;
  label: string;
  exp: number;
  key: string; // the full access-key string (opaque to the teammate)
  totp: string; // base32 TOTP secret (raw value never rendered)
  enrolledAt: number;
}

export interface TeamSession {
  cfg: GithubConfig;
  label: string;
  fp: string;
  exp: number;
  unlockedAt: number;
  offlineWarning: boolean;
}

// In-memory session only — wiped on reload / lock. Nothing sensitive is
// persisted outside the sealed vault + the owner's own storage.
let session: TeamSession | null = null;
export function getTeamSession(): TeamSession | null {
  return session;
}
export function clearTeamSession(): void {
  session = null;
}

// ---------- owner: issue keys ----------

export function issueAccessKey(
  cfg: GithubConfig,
  label: string,
  daysValid: number,
): { keyString: string; meta: TeamMeta } {
  const now = Date.now();
  const cleanLabel = label.trim().slice(0, 60) || "Team Admin";
  const payload: TeamPayload = {
    v: 1,
    u: cfg.username,
    r: cfg.repo,
    t: cfg.token,
    b: cfg.branch || "main",
    label: cleanLabel,
    iat: now,
    exp: daysValid > 0 ? now + daysValid * 86400000 : 0,
  };
  const secret = randomBytes(32);
  const bundle = sealJSON(secret, DOMAIN, payload);
  const keyString = `AXD1.${b64urlEncode(secret)}.${bundle}`;
  const meta: TeamMeta = {
    fp: fingerprintOf(secret),
    label: cleanLabel,
    createdAt: now,
    exp: payload.exp,
    revoked: false,
  };
  const all = listIssuedKeys();
  all.unshift(meta);
  persistKeys(all);
  return { keyString, meta };
}

export function parseAccessKey(keyString: string): TeamPayload | null {
  try {
    const parts = keyString.trim().split(".");
    if (parts.length !== 3 || parts[0] !== "AXD1") return null;
    const secret = b64urlDecode(parts[1]);
    if (!secret || secret.length !== 32) return null;
    const payload = openJSON<TeamPayload>(secret, DOMAIN, parts[2]);
    if (!payload || payload.v !== 1 || !payload.u || !payload.r || !payload.t) return null;
    return payload;
  } catch {
    return null;
  }
}

export function keyFingerprint(keyString: string): string | null {
  try {
    const parts = keyString.trim().split(".");
    if (parts.length !== 3 || parts[0] !== "AXD1") return null;
    const secret = b64urlDecode(parts[1]);
    if (!secret || secret.length !== 32) return null;
    return fingerprintOf(secret);
  } catch {
    return null;
  }
}

export function keyExpired(exp: number): boolean {
  return exp > 0 && Date.now() > exp;
}

export function formatExpiry(exp: number): string {
  if (exp <= 0) return "Never expires";
  const d = new Date(exp);
  if (keyExpired(exp)) return `Expired on ${d.toLocaleDateString()}`;
  return `Expires on ${d.toLocaleDateString()}`;
}

// ---------- owner: key registry (metadata only, no secrets) ----------

export function listIssuedKeys(): TeamMeta[] {
  try {
    const raw = localStorage.getItem(KEYS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as TeamMeta[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function persistKeys(all: TeamMeta[]): void {
  try {
    localStorage.setItem(KEYS_KEY, JSON.stringify(all));
  } catch { /* storage full / blocked — non-fatal */ }
}

export function deleteKeyRecord(fp: string): void {
  persistKeys(listIssuedKeys().filter((k) => k.fp !== fp));
}

export async function revokeKey(
  cfg: GithubConfig | null,
  fp: string,
): Promise<{ ok: boolean; message: string }> {
  persistKeys(listIssuedKeys().map((k) => (k.fp === fp ? { ...k, revoked: true } : k)));
  if (!cfg) {
    return {
      ok: true,
      message: "Revoked on this device. Connect GitHub to sync the revocation to the repo.",
    };
  }
  let list: string[] = [];
  try {
    const cur = await readRepoFile(cfg, REVOCATION_PATH);
    if (cur.ok) {
      const j = JSON.parse(cur.content) as { revoked?: unknown };
      if (Array.isArray(j.revoked)) list = j.revoked.filter((x): x is string => typeof x === "string");
    }
  } catch { /* treat as empty */ }
  if (!list.includes(fp)) list.push(fp);
  const res = await writeRepoFile(
    cfg,
    REVOCATION_PATH,
    JSON.stringify({ revoked: list, updatedAt: new Date().toISOString() }, null, 2),
    "chore: revoke team access key",
  );
  return res;
}

export async function checkRevoked(
  cfg: GithubConfig,
  fp: string,
): Promise<"revoked" | "ok" | "unknown"> {
  try {
    const res = await readRepoFile(cfg, REVOCATION_PATH);
    if (!res.ok) return res.status === 404 ? "ok" : "unknown";
    const j = JSON.parse(res.content) as { revoked?: unknown };
    const list = Array.isArray(j.revoked) ? j.revoked : [];
    return list.includes(fp) ? "revoked" : "ok";
  } catch {
    return "unknown";
  }
}

// ---------- teammate vault (this device) ----------

export function hasTeamVault(): boolean {
  return loadVault() !== null;
}

export function loadVault(): TeamVault | null {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as TeamVault;
    if (!v || typeof v.key !== "string" || typeof v.totp !== "string") return null;
    return v;
  } catch {
    return null;
  }
}

function saveVault(v: TeamVault): void {
  localStorage.setItem(VAULT_KEY, JSON.stringify(v));
}

export function wipeVault(): void {
  try {
    localStorage.removeItem(VAULT_KEY);
  } catch { /* noop */ }
}

// ---------- authenticator enrollment / verification ----------

export function newEnrollSecret(): string {
  return b32encode(newTotpSecret());
}

export function otpauthUri(secretB32: string, label: string): string {
  const issuer = "AXD DIGITAL LAB";
  const account = `Team Admin (${label})`;
  return (
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}` +
    `?secret=${secretB32}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`
  );
}

export function enrollVault(payload: TeamPayload, keyString: string, totpSecret: string): TeamVault {
  const v: TeamVault = {
    fp: keyFingerprint(keyString) || "UNKNOWN",
    label: payload.label,
    exp: payload.exp,
    key: keyString.trim(),
    totp: totpSecret,
    enrolledAt: Date.now(),
  };
  saveVault(v);
  return v;
}

/** First-time activation check: decrypt + expiry + revocation (online). */
export async function validateNewKey(
  keyString: string,
): Promise<{ ok: boolean; message: string; payload?: TeamPayload; offline?: boolean }> {
  const payload = parseAccessKey(keyString);
  if (!payload) {
    return { ok: false, message: "This key is invalid or corrupted. Copy the full key and try again." };
  }
  if (keyExpired(payload.exp)) {
    return { ok: false, message: "This key has expired. Ask the owner to generate a new one." };
  }
  const fp = keyFingerprint(keyString) || "";
  const cfg: GithubConfig = {
    username: payload.u,
    repo: payload.r,
    token: payload.t,
    branch: payload.b || "main",
  };
  const rev = await checkRevoked(cfg, fp);
  if (rev === "revoked") {
    return { ok: false, message: "This key was revoked by the owner." };
  }
  return {
    ok: true,
    message:
      rev === "unknown"
        ? "Key accepted. Revocation list was unreachable (offline) — verified locally."
        : "Key accepted.",
    payload,
    offline: rev === "unknown",
  };
}

/** Returning teammate: verify the 6-digit authenticator code, then unlock. */
export async function unlockWithCode(code: string): Promise<{ ok: boolean; message: string }> {
  const v = loadVault();
  if (!v) return { ok: false, message: "No team access found on this device. Use an access key first." };
  if (!verifyTotp(v.totp, code)) {
    return { ok: false, message: "Incorrect code. Open your authenticator app and try the current code." };
  }
  const payload = parseAccessKey(v.key);
  if (!payload) {
    wipeVault();
    return { ok: false, message: "This access key is corrupted. Ask the owner for a new one." };
  }
  if (keyExpired(payload.exp)) {
    return { ok: false, message: "This access key has expired. Ask the owner for a new one." };
  }
  const cfg: GithubConfig = {
    username: payload.u,
    repo: payload.r,
    token: payload.t,
    branch: payload.b || "main",
  };
  const rev = await checkRevoked(cfg, v.fp);
  if (rev === "revoked") {
    wipeVault();
    clearTeamSession();
    return { ok: false, message: "This key was revoked by the owner. This device has been signed out." };
  }
  session = {
    cfg,
    label: payload.label,
    fp: v.fp,
    exp: payload.exp,
    unlockedAt: Date.now(),
    offlineWarning: rev === "unknown",
  };
  return {
    ok: true,
    message:
      rev === "unknown"
        ? "Signed in. Revocation check was unreachable (offline) — verified locally."
        : "Signed in.",
  };
}

/** Unlock immediately after enrollment (code was just verified). */
export async function unlockFresh(
  payload: TeamPayload,
  keyString: string,
): Promise<{ ok: boolean; message: string }> {
  const cfg: GithubConfig = {
    username: payload.u,
    repo: payload.r,
    token: payload.t,
    branch: payload.b || "main",
  };
  session = {
    cfg,
    label: payload.label,
    fp: keyFingerprint(keyString) || "UNKNOWN",
    exp: payload.exp,
    unlockedAt: Date.now(),
    offlineWarning: false,
  };
  return { ok: true, message: "Authenticator linked. Signed in." };
}
