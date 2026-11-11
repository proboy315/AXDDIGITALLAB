// Cryptographic utilities: AES-256-GCM key delegation, sealed device vault, and RFC 6238 TOTP (HMAC-SHA1)

export interface DelegatedPayload {
  v: 1;
  id: string;
  label: string;
  u: string; // GitHub username
  r: string; // GitHub repo
  t: string; // GitHub PAT
  b: string; // Branch
  ts: string; // Created ISO
  exp?: number; // Optional expiry timestamp (ms)
  pinProtected?: boolean;
}

export interface SealedVault {
  v: 1;
  mode: "delegate";
  label: string;
  keyId: string;
  enrolledAt: string;
  // AES-256-GCM encrypted JSON of { u, r, t, b, totpSecret, label, keyId }
  cipher: string;
  iv: string;
  salt: string;
}

export interface VaultSecrets {
  u: string;
  r: string;
  t: string;
  b: string;
  totpSecret: string;
  label: string;
  keyId: string;
}

export interface IssuedKeyRecord {
  id: string;
  label: string;
  createdAt: string;
  expiresAt?: string;
  pinProtected: boolean;
}

const VAULT_STORAGE_KEY = "axd_sec_vault_v1";
const ISSUED_KEYS_STORAGE = "axd_issued_keys_v1";

// Internal domain wrapping secret (never displayed to user, combined with random per-payload salt + PBKDF2)
const DOMAIN_PEPPER = "AXD::LAB::ZERO_TRUST_ENVELOPE::2026::V1";
const VAULT_PEPPER = "AXD::DEVICE_VAULT::SEAL::2026::V1";

const te = new TextEncoder();
const td = new TextDecoder();

function toB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    te.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts GitHub credentials into an opaque string: AXD1.<flags>.<salt>.<iv>.<ciphertext>
 * Never exposes username, repo, or PAT in plaintext.
 */
export async function generateEncryptedAccessKey(
  creds: { username: string; repo: string; token: string; branch?: string },
  options: { label: string; pin?: string; expiresInDays?: number }
): Promise<{ keyString: string; record: IssuedKeyRecord }> {
  const id = `key_${Date.now().toString(36)}_${toB64Url(crypto.getRandomValues(new Uint8Array(4)))}`;
  const now = new Date();
  const exp =
    options.expiresInDays && options.expiresInDays > 0
      ? now.getTime() + options.expiresInDays * 24 * 60 * 60 * 1000
      : undefined;

  const cleanPin = (options.pin || "").trim();
  const pinProtected = cleanPin.length > 0;

  const payload: DelegatedPayload = {
    v: 1,
    id,
    label: options.label.trim() || "Operator",
    u: creds.username.trim(),
    r: creds.repo.trim(),
    t: creds.token.trim(),
    b: (creds.branch || "main").trim() || "main",
    ts: now.toISOString(),
    exp,
    pinProtected,
  };

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const secretInput = pinProtected ? `${DOMAIN_PEPPER}::PIN::${cleanPin}` : DOMAIN_PEPPER;
  const aesKey = await deriveAesKey(secretInput, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    aesKey,
    te.encode(JSON.stringify(payload))
  );

  const flags = pinProtected ? "P" : "S";
  const keyString = `AXD1.${flags}.${toB64Url(salt)}.${toB64Url(iv)}.${toB64Url(new Uint8Array(encrypted))}`;

  const record: IssuedKeyRecord = {
    id,
    label: payload.label,
    createdAt: payload.ts,
    expiresAt: exp ? new Date(exp).toISOString() : undefined,
    pinProtected,
  };

  saveIssuedKeyRecord(record);
  return { keyString, record };
}

export function isPinRequiredForKey(keyString: string): boolean {
  const parts = keyString.trim().split(".");
  return parts.length === 5 && parts[0] === "AXD1" && parts[1] === "P";
}

export function isValidAccessKeyFormat(keyString: string): boolean {
  const parts = keyString.trim().split(".");
  return parts.length === 5 && parts[0] === "AXD1" && (parts[1] === "P" || parts[1] === "S");
}

export async function decryptAccessKey(
  keyString: string,
  pin?: string
): Promise<DelegatedPayload> {
  const parts = keyString.trim().split(".");
  if (parts.length !== 5 || parts[0] !== "AXD1") {
    throw new Error("Invalid access key format.");
  }
  const [, flags, saltB64, ivB64, cipherB64] = parts;
  const pinProtected = flags === "P";
  const cleanPin = (pin || "").trim();

  if (pinProtected && !cleanPin) {
    throw new Error("Activation PIN is required for this key.");
  }

  const salt = fromB64Url(saltB64);
  const iv = fromB64Url(ivB64);
  const cipher = fromB64Url(cipherB64);

  const secretInput = pinProtected ? `${DOMAIN_PEPPER}::PIN::${cleanPin}` : DOMAIN_PEPPER;
  const aesKey = await deriveAesKey(secretInput, salt);

  let plainBuf: ArrayBuffer;
  try {
    plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
      aesKey,
      cipher.buffer as ArrayBuffer
    );
  } catch {
    throw new Error(
      pinProtected
        ? "Decryption failed — invalid key or incorrect activation PIN."
        : "Decryption failed — corrupted or invalid access key."
    );
  }

  const parsed = JSON.parse(td.decode(plainBuf)) as DelegatedPayload;
  if (parsed.v !== 1 || !parsed.u || !parsed.r || !parsed.t) {
    throw new Error("Malformed access key payload.");
  }
  if (parsed.exp && Date.now() > parsed.exp) {
    throw new Error("This access key has expired. Request a new key from the administrator.");
  }
  return parsed;
}

// ==========================================
// RFC 4648 Base32 & RFC 6238 TOTP (SHA-1)
// ==========================================

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(byteLength = 20): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32ToBytes(secret: string): Uint8Array {
  const clean = secret.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

export function buildTotpUri(secret: string, label: string, issuer = "AXD DIGITAL LAB"): string {
  const account = encodeURIComponent(`${issuer}:${label}`);
  const iss = encodeURIComponent(issuer);
  return `otpauth://totp/${account}?secret=${secret}&issuer=${iss}&algorithm=SHA1&digits=6&period=30`;
}

async function generateTotpAtCounter(secret: string, counter: number): Promise<string> {
  const keyBytes = base32ToBytes(secret);
  const counterBytes = new Uint8Array(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = tmp & 0xff;
    tmp = Math.floor(tmp / 256);
  }

  const hmacKey = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", hmacKey, counterBytes.buffer as ArrayBuffer)
  );
  const offset = sig[sig.length - 1] & 0x0f;
  const codeInt =
    ((sig[offset] & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) << 8) |
    (sig[offset + 3] & 0xff);
  return String(codeInt % 1_000_000).padStart(6, "0");
}

export async function verifyTotpCode(secret: string, inputCode: string): Promise<boolean> {
  const clean = inputCode.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  const currentCounter = Math.floor(Date.now() / 1000 / 30);
  // Allow +/- 1 time step (30s) for clock drift
  for (let delta = -1; delta <= 1; delta++) {
    const expected = await generateTotpAtCounter(secret, currentCounter + delta);
    if (expected === clean) return true;
  }
  return false;
}

// ==========================================
// Sealed Device Vault (Encrypted at Rest)
// ==========================================

export async function sealDeviceVault(secrets: VaultSecrets): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveAesKey(`${VAULT_PEPPER}::${secrets.keyId}`, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    aesKey,
    te.encode(JSON.stringify(secrets))
  );

  const vault: SealedVault = {
    v: 1,
    mode: "delegate",
    label: secrets.label,
    keyId: secrets.keyId,
    enrolledAt: new Date().toISOString(),
    cipher: toB64Url(new Uint8Array(encrypted)),
    iv: toB64Url(iv),
    salt: toB64Url(salt),
  };

  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
}

export function getSealedVaultMeta(): { label: string; keyId: string; enrolledAt: string } | null {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SealedVault;
    if (parsed.v !== 1 || !parsed.cipher || !parsed.iv || !parsed.salt) return null;
    return { label: parsed.label, keyId: parsed.keyId, enrolledAt: parsed.enrolledAt };
  } catch {
    return null;
  }
}

export function clearSealedVault(): void {
  localStorage.removeItem(VAULT_STORAGE_KEY);
}

export async function unlockSealedVaultWithTotp(totpCode: string): Promise<{
  ok: boolean;
  error?: string;
  secrets?: VaultSecrets;
}> {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return { ok: false, error: "No enrolled vault found on this device." };
    const vault = JSON.parse(raw) as SealedVault;
    const salt = fromB64Url(vault.salt);
    const iv = fromB64Url(vault.iv);
    const cipher = fromB64Url(vault.cipher);

    const aesKey = await deriveAesKey(`${VAULT_PEPPER}::${vault.keyId}`, salt);
    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
      aesKey,
      cipher.buffer as ArrayBuffer
    );
    const secrets = JSON.parse(td.decode(plainBuf)) as VaultSecrets;

    const valid = await verifyTotpCode(secrets.totpSecret, totpCode);
    if (!valid) {
      return { ok: false, error: "Invalid 6-digit Authenticator code. Please try again." };
    }

    return { ok: true, secrets };
  } catch {
    return { ok: false, error: "Failed to unlock vault. Please re-activate with a valid key." };
  }
}

// ==========================================
// Issued Keys Audit Log (No secrets stored)
// ==========================================

export function loadIssuedKeyRecords(): IssuedKeyRecord[] {
  try {
    const raw = localStorage.getItem(ISSUED_KEYS_STORAGE);
    if (!raw) return [];
    return JSON.parse(raw) as IssuedKeyRecord[];
  } catch {
    return [];
  }
}

export function saveIssuedKeyRecord(rec: IssuedKeyRecord): void {
  const existing = loadIssuedKeyRecords();
  const next = [rec, ...existing].slice(0, 25);
  localStorage.setItem(ISSUED_KEYS_STORAGE, JSON.stringify(next));
}

export function clearIssuedKeyRecords(): void {
  localStorage.removeItem(ISSUED_KEYS_STORAGE);
}
