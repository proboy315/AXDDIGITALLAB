// Pure-TypeScript cryptography helpers — zero dependencies, works in any browser.
// Provides: SHA-256 / SHA-1 / HMAC, authenticated encryption (Encrypt-then-MAC
// with a SHA-256 CTR-style keystream), Base64URL + Base32 codecs, and TOTP
// (RFC 6238: SHA-1, 30s step, 6 digits) for authenticator-app 2FA.

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

function rotl(x: number, n: number): number {
  return (x << n) | (x >>> (32 - n));
}

const K256 = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

export function sha256(data: Uint8Array): Uint8Array {
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const ml = data.length;
  const bitHi = Math.floor((ml * 8) / 4294967296);
  const bitLo = (ml * 8) >>> 0;
  const total = ml + 1 + ((64 - ((ml + 1 + 8) % 64)) % 64) + 8;
  const msg = new Uint8Array(total);
  msg.set(data);
  msg[ml] = 0x80;
  const dv = new DataView(msg.buffer);
  dv.setUint32(total - 8, bitHi);
  dv.setUint32(total - 4, bitLo);
  const w = new Uint32Array(64);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K256[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, h0); odv.setUint32(4, h1); odv.setUint32(8, h2); odv.setUint32(12, h3);
  odv.setUint32(16, h4); odv.setUint32(20, h5); odv.setUint32(24, h6); odv.setUint32(28, h7);
  return out;
}

export function sha1(data: Uint8Array): Uint8Array {
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const ml = data.length;
  const bitHi = Math.floor((ml * 8) / 4294967296);
  const bitLo = (ml * 8) >>> 0;
  const total = ml + 1 + ((64 - ((ml + 1 + 8) % 64)) % 64) + 8;
  const msg = new Uint8Array(total);
  msg.set(data);
  msg[ml] = 0x80;
  const dv = new DataView(msg.buffer);
  dv.setUint32(total - 8, bitHi);
  dv.setUint32(total - 4, bitLo);
  const w = new Uint32Array(80);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 80; i++) w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) {
      let f: number, k: number;
      if (i < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }
      const temp = (rotl(a, 5) + f + e + k + w[i]) | 0;
      e = d; d = c; c = rotl(b, 30); b = a; a = temp;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
  }
  const out = new Uint8Array(20);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, h0); odv.setUint32(4, h1); odv.setUint32(8, h2); odv.setUint32(12, h3); odv.setUint32(16, h4);
  return out;
}

function hmac(hash: (d: Uint8Array) => Uint8Array, key: Uint8Array, msg: Uint8Array): Uint8Array {
  const BS = 64;
  let k = key;
  if (k.length > BS) k = hash(k);
  const kb = new Uint8Array(BS);
  kb.set(k);
  const ipad = new Uint8Array(BS);
  const opad = new Uint8Array(BS);
  for (let i = 0; i < BS; i++) { ipad[i] = kb[i] ^ 0x36; opad[i] = kb[i] ^ 0x5c; }
  const inner = new Uint8Array(BS + msg.length);
  inner.set(ipad); inner.set(msg, BS);
  const ih = hash(inner);
  const outer = new Uint8Array(BS + ih.length);
  outer.set(opad); outer.set(ih, BS);
  return hash(outer);
}

export const hmacSha256 = (key: Uint8Array, msg: Uint8Array): Uint8Array => hmac(sha256, key, msg);
export const hmacSha1 = (key: Uint8Array, msg: Uint8Array): Uint8Array => hmac(sha1, key, msg);

// ---------- codecs ----------

const B64U = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    s += B64U[(n >>> 18) & 63] + B64U[(n >>> 12) & 63];
    if (i + 1 < bytes.length) s += B64U[(n >>> 6) & 63];
    if (i + 2 < bytes.length) s += B64U[n & 63];
  }
  return s;
}

export function b64urlDecode(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9\-_]*$/.test(s) || s.length % 4 === 1) return null;
  const out: number[] = [];
  for (let i = 0; i < s.length; i += 4) {
    const c0 = B64U.indexOf(s[i]);
    const c1 = i + 1 < s.length ? B64U.indexOf(s[i + 1]) : 0;
    const c2 = i + 2 < s.length ? B64U.indexOf(s[i + 2]) : 0;
    const c3 = i + 3 < s.length ? B64U.indexOf(s[i + 3]) : 0;
    if (c0 < 0 || c1 < 0 || (i + 2 < s.length && c2 < 0) || (i + 3 < s.length && c3 < 0)) return null;
    const n = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
    out.push((n >>> 16) & 255);
    if (i + 2 < s.length) out.push((n >>> 8) & 255);
    if (i + 3 < s.length) out.push(n & 255);
  }
  return new Uint8Array(out);
}

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function b32encode(bytes: Uint8Array): string {
  let s = "";
  let acc = 0;
  let bits = 0;
  for (let i = 0; i < bytes.length; i++) {
    acc = (acc << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      s += B32[(acc >>> bits) & 31];
    }
  }
  if (bits > 0) s += B32[(acc << (5 - bits)) & 31];
  return s;
}

export function b32decode(s: string): Uint8Array | null {
  const clean = s.trim().toUpperCase().replace(/=+$/, "");
  if (!/^[A-Z2-7]*$/.test(clean) || clean.length === 0) return null;
  const out: number[] = [];
  let acc = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i++) {
    const v = B32.indexOf(clean[i]);
    if (v < 0) return null;
    acc = (acc << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((acc >>> bits) & 255);
    }
  }
  return new Uint8Array(out);
}

// ---------- misc ----------

export function strBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function concatBytes(...arrs: Uint8Array[]): Uint8Array {
  let len = 0;
  for (const a of arrs) len += a.length;
  const out = new Uint8Array(len);
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}

export function randomBytes(n: number): Uint8Array {
  const a = new Uint8Array(n);
  try {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(a);
      return a;
    }
  } catch { /* fall through to Math.random fallback */ }
  for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
  return a;
}

function constTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ---------- authenticated encryption (Encrypt-then-MAC) ----------

function deriveKeys(secret: Uint8Array, domain: string): { encKey: Uint8Array; macKey: Uint8Array } {
  const master = sha256(concatBytes(strBytes(domain + "\u0000key"), secret));
  return {
    encKey: sha256(concatBytes(master, strBytes("\u0000enc"))),
    macKey: sha256(concatBytes(master, strBytes("\u0000mac"))),
  };
}

/** Seal any JSON value. Returns base64url(nonce || ciphertext || tag). */
export function sealJSON(secret: Uint8Array, domain: string, payload: unknown): string {
  const { encKey, macKey } = deriveKeys(secret, domain);
  const nonce = randomBytes(12);
  const plain = strBytes(JSON.stringify(payload));
  const ct = new Uint8Array(plain.length);
  const blocks = Math.ceil(plain.length / 32);
  const ctr = new Uint8Array(4);
  const ctrDv = new DataView(ctr.buffer);
  for (let c = 0; c < blocks; c++) {
    ctrDv.setUint32(0, c);
    const ks = sha256(concatBytes(encKey, nonce, ctr));
    for (let i = 0; i < 32; i++) {
      const j = c * 32 + i;
      if (j >= plain.length) break;
      ct[j] = plain[j] ^ ks[i];
    }
  }
  const tag = hmacSha256(macKey, concatBytes(nonce, ct)).slice(0, 16);
  return b64urlEncode(concatBytes(nonce, ct, tag));
}

/** Open a bundle created by sealJSON. Returns null on any tampering / bad key. */
export function openJSON<T>(secret: Uint8Array, domain: string, bundle: string): T | null {
  try {
    const raw = b64urlDecode(bundle);
    if (!raw || raw.length < 12 + 16 + 1) return null;
    const { encKey, macKey } = deriveKeys(secret, domain);
    const nonce = raw.slice(0, 12);
    const tag = raw.slice(raw.length - 16);
    const ct = raw.slice(12, raw.length - 16);
    const expect = hmacSha256(macKey, concatBytes(nonce, ct)).slice(0, 16);
    if (!constTimeEqual(tag, expect)) return null;
    const plain = new Uint8Array(ct.length);
    const blocks = Math.ceil(ct.length / 32);
    const ctr = new Uint8Array(4);
    const ctrDv = new DataView(ctr.buffer);
    for (let c = 0; c < blocks; c++) {
      ctrDv.setUint32(0, c);
      const ks = sha256(concatBytes(encKey, nonce, ctr));
      for (let i = 0; i < 32; i++) {
        const j = c * 32 + i;
        if (j >= ct.length) break;
        plain[j] = ct[j] ^ ks[i];
      }
    }
    return JSON.parse(new TextDecoder().decode(plain)) as T;
  } catch {
    return null;
  }
}

// ---------- TOTP (RFC 6238) ----------

export function newTotpSecret(): Uint8Array {
  return randomBytes(20);
}

export function hotp(secret: Uint8Array, counter: number): string {
  const msg = new Uint8Array(8);
  const dv = new DataView(msg.buffer);
  dv.setUint32(0, Math.floor(counter / 4294967296));
  dv.setUint32(4, counter >>> 0);
  const h = hmacSha1(secret, msg);
  const o = h[19] & 0x0f;
  const p = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(p % 1000000).padStart(6, "0");
}

export function totpNow(secretB32: string, whenMs = Date.now()): string | null {
  const s = b32decode(secretB32);
  if (!s) return null;
  return hotp(s, Math.floor(whenMs / 30000));
}

export function verifyTotp(secretB32: string, code: string, whenMs = Date.now(), window = 1): boolean {
  const s = b32decode(secretB32);
  if (!s || !/^\d{6}$/.test(code.trim())) return false;
  const c = Math.floor(whenMs / 30000);
  const clean = code.trim();
  for (let d = -window; d <= window; d++) {
    if (hotp(s, c + d) === clean) return true;
  }
  return false;
}

/** Short public fingerprint of a 32-byte access secret (safe to display). */
export function fingerprintOf(secret: Uint8Array): string {
  const h = sha256(concatBytes(strBytes("axd-team-fingerprint-v1"), secret));
  const hex = Array.from(h.slice(0, 6))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`.toUpperCase();
}
