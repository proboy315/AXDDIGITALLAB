import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { LogoMark, ArrowRight, ArrowLeft, Check, ShieldCheck } from "./IconsNew";
import { saveGithubConfig, type GithubConfig } from "@/lib/db";
import { testGithubConnection } from "@/lib/github";
import {
  buildTotpUri,
  clearSealedVault,
  decryptAccessKey,
  generateTotpSecret,
  getSealedVaultMeta,
  isPinRequiredForKey,
  isValidAccessKeyFormat,
  sealDeviceVault,
  unlockSealedVaultWithTotp,
  verifyTotpCode,
  type DelegatedPayload,
} from "@/lib/crypto";

export interface AdminSession {
  role: "owner" | "delegate";
  label: string;
  githubConfig: GithubConfig;
}

// Clipboard helper with a fallback for browsers that block the async Clipboard API
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy copy
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

const ownerSteps = [
  {
    key: "username" as const,
    title: "GitHub Username",
    sub: "Enter the GitHub account username where your store repository is hosted.",
    placeholder: "e.g. proboy315",
    badge: "STEP 01 // IDENTITY",
  },
  {
    key: "repo" as const,
    title: "Repository Name",
    sub: "Enter the target repository name used to persist catalog updates.",
    placeholder: "e.g. AXDDIGITALLAB",
    badge: "STEP 02 // TARGET",
  },
  {
    key: "token" as const,
    title: "Personal Access Token (PAT)",
    sub: "GitHub PAT with repo scope. Stored locally in browser cookies & storage — never uploaded to the repository.",
    placeholder: "ghp_xxxxxxxxxxxxxxxx",
    badge: "STEP 03 // UPLINK",
  },
];

export function AdminGate({
  onUnlock,
  onExit,
}: {
  onUnlock: (session: AdminSession) => void;
  onExit: () => void;
}) {
  const [vaultMeta, setVaultMeta] = useState(() => getSealedVaultMeta());
  const [mode, setMode] = useState<"totp-unlock" | "access-key" | "totp-enroll" | "owner">(() =>
    getSealedVaultMeta() ? "totp-unlock" : "access-key"
  );

  // Owner 3-step state
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<GithubConfig>({ username: "", repo: "", token: "", branch: "main" });
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Delegate access key activation state
  const [accessKey, setAccessKey] = useState("");
  const [activationPin, setActivationPin] = useState("");
  const [decryptedPayload, setDecryptedPayload] = useState<DelegatedPayload | null>(null);

  // One-time TOTP enrollment state (wiped immediately after verification)
  const [enrollSecret, setEnrollSecret] = useState<string>("");
  const [enrollUri, setEnrollUri] = useState<string>("");
  const [enrollQr, setEnrollQr] = useState<string>("");
  const [enrollCode, setEnrollCode] = useState<string>("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);

  // Returning delegate TOTP login state
  const [totpInput, setTotpInput] = useState("");

  useEffect(() => {
    document.title = "AXD SEC-CONSOLE // Authentication Required";
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow";
  }, []);

  const currentOwnerStep = ownerSteps[step];
  const ownerValue = form[currentOwnerStep.key];
  const canOwnerNext = ownerValue.trim().length > 1;
  const needsPin = isPinRequiredForKey(accessKey);

  // Owner login flow
  const handleOwnerNext = async () => {
    if (!canOwnerNext) return;
    if (step < 2) {
      setStep(step + 1);
      setStatus(null);
      return;
    }
    setBusy(true);
    setStatus({ ok: true, msg: "Verifying GitHub uplink..." });
    saveGithubConfig(form);
    const res = await testGithubConnection(form);
    setBusy(false);
    if (res.ok) {
      setStatus({ ok: true, msg: `Connected: ${res.message}` });
      setTimeout(() => {
        onUnlock({ role: "owner", label: "Master Owner", githubConfig: form });
      }, 500);
    } else {
      setStatus({
        ok: false,
        msg: `${res.message} — Credentials saved locally; you may continue in offline mode and adjust settings inside.`,
      });
    }
  };

  // Step 1 of Delegated Access: Decrypt opaque key string -> initiate one-time 2FA enrollment
  const handleDecryptAccessKey = async () => {
    setStatus(null);
    if (!isValidAccessKeyFormat(accessKey)) {
      setStatus({ ok: false, msg: "Error: Invalid encrypted key format. Expected AXD1.<...>" });
      return;
    }
    setBusy(true);
    try {
      const payload = await decryptAccessKey(accessKey, activationPin);
      const secret = generateTotpSecret(20);
      const uri = buildTotpUri(secret, payload.label || "Operator");
      const qrDataUrl = await QRCode.toDataURL(uri, {
        width: 210,
        margin: 2,
        color: { dark: "#050B08", light: "#F2FBF6" },
      });

      // Keep payload in memory only; never display credentials
      setDecryptedPayload(payload);
      setEnrollSecret(secret);
      setEnrollUri(uri);
      setEnrollQr(qrDataUrl);
      setAccessKey("");
      setActivationPin("");
      setEnrollCode("");
      setMode("totp-enroll");
    } catch (e: unknown) {
      setStatus({
        ok: false,
        msg: e instanceof Error ? `Error: ${e.message}` : "Error: Key decryption failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  // Step 2 of Delegated Access: Verify first 6-digit TOTP -> seal encrypted device vault -> permanently hide TOTP secret
  const handleCompleteEnrollment = async () => {
    if (!decryptedPayload || !enrollSecret) return;
    setStatus(null);
    const clean = enrollCode.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(clean)) {
      setStatus({ ok: false, msg: "Error: Enter a valid 6-digit code from your Authenticator app." });
      return;
    }

    setBusy(true);
    const valid = await verifyTotpCode(enrollSecret, clean);
    if (!valid) {
      setBusy(false);
      setStatus({
        ok: false,
        msg: "Error: Code mismatch. Ensure your device clock is synced and enter the active 6-digit code.",
      });
      return;
    }

    // Seal credentials + TOTP secret into encrypted device vault
    await sealDeviceVault({
      u: decryptedPayload.u,
      r: decryptedPayload.r,
      t: decryptedPayload.t,
      b: decryptedPayload.b,
      totpSecret: enrollSecret,
      label: decryptedPayload.label,
      keyId: decryptedPayload.id,
    });

    const session: AdminSession = {
      role: "delegate",
      label: decryptedPayload.label,
      githubConfig: {
        username: decryptedPayload.u,
        repo: decryptedPayload.r,
        token: decryptedPayload.t,
        branch: decryptedPayload.b,
      },
    };

    // Permanently purge enrollment QR, TOTP secret, and raw payload from UI state
    setEnrollSecret("");
    setEnrollUri("");
    setEnrollQr("");
    setEnrollCode("");
    setCopiedSecret(false);
    setCopiedUri(false);
    setDecryptedPayload(null);
    setVaultMeta(getSealedVaultMeta());
    setBusy(false);
    onUnlock(session);
  };

  // Returning Delegated Operator: Verify 6-digit TOTP code every single open
  const handleTotpUnlock = async () => {
    setStatus(null);
    const clean = totpInput.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(clean)) {
      setStatus({ ok: false, msg: "Error: Enter the 6-digit code from your Authenticator app." });
      return;
    }
    setBusy(true);
    const res = await unlockSealedVaultWithTotp(clean);
    setBusy(false);
    if (!res.ok || !res.secrets) {
      setStatus({ ok: false, msg: `Error: ${res.error || "Verification failed."}` });
      setTotpInput("");
      return;
    }

    const s = res.secrets;
    setTotpInput("");
    onUnlock({
      role: "delegate",
      label: s.label,
      githubConfig: { username: s.u, repo: s.r, token: s.t, branch: s.b },
    });
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-void px-4 py-10">
      {/* Cyber atmosphere */}
      <div aria-hidden className="cyber-hero-grid pointer-events-none absolute inset-0 opacity-20" />
      <div aria-hidden className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-neon/10 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-neon/12 blur-[110px]" />

      <div className="relative w-full max-w-[470px]">
        <div className="mb-5 flex flex-col items-center text-center">
          <LogoMark className="h-14 w-14 drop-shadow-[0_0_22px_rgba(34,224,124,0.6)]" />
          <h1 className="mt-4 font-display text-[24px] font-black tracking-tight text-paper">
            AXD <span className="text-neon">ADMIN ACCESS</span>
          </h1>
          <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-mist">
            <ShieldCheck className="h-3.5 w-3.5 text-neon" />
            AES-256-GCM Vault · Zero-Leak Operator Access
          </p>
        </div>

        {/* Mode Switcher (only shown if not mid-enrollment or locked into vault) */}
        {mode !== "totp-enroll" && (
          <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-2xl border border-line-bright/80 bg-panel/80 p-1.5 font-mono text-[11.5px]">
            {vaultMeta ? (
              <button
                type="button"
                onClick={() => {
                  setMode("totp-unlock");
                  setStatus(null);
                }}
                className={`rounded-xl py-2.5 font-bold transition cursor-pointer ${
                  mode === "totp-unlock"
                    ? "bg-neon text-[#04150C] shadow-[0_6px_18px_-6px_rgba(34,224,124,0.7)]"
                    : "text-mist hover:text-paper"
                }`}
              >
                2FA Authenticator
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode("access-key");
                  setStatus(null);
                }}
                className={`rounded-xl py-2.5 font-bold transition cursor-pointer ${
                  mode === "access-key"
                    ? "bg-neon text-[#04150C] shadow-[0_6px_18px_-6px_rgba(34,224,124,0.7)]"
                    : "text-mist hover:text-paper"
                }`}
              >
                Access Key Login
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setMode("owner");
                setStatus(null);
              }}
              className={`rounded-xl py-2.5 font-bold transition cursor-pointer ${
                mode === "owner"
                  ? "bg-neon text-[#04150C] shadow-[0_6px_18px_-6px_rgba(34,224,124,0.7)]"
                  : "text-mist hover:text-paper"
              }`}
            >
              Master Owner
            </button>
          </div>
        )}

        <div className="rounded-[26px] border border-line-bright/80 bg-panel/88 p-6 glass-edge backdrop-blur-xl sm:p-7">
          {/* RETURNING DELEGATE: 2FA CODE ONLY (ZERO CREDENTIALS OR SECRET SHOWN) */}
          {mode === "totp-unlock" && vaultMeta && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-line/70 pb-3 font-mono text-[11px]">
                <span className="text-neon font-bold">[VAULT_SEALED]</span>
                <span className="text-mist-dim">{vaultMeta.label}</span>
              </div>

              <div>
                <h2 className="font-display text-[20px] font-extrabold text-paper">
                  Authenticator Verification
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-mist">
                  Enter the 6-digit verification code from your Authenticator app to unlock this admin session.
                </p>
              </div>

              <input
                autoFocus
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                value={totpInput}
                onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleTotpUnlock()}
                placeholder="000000"
                className="w-full rounded-2xl border border-line-bright bg-[#050C08] px-4 py-4 text-center font-mono text-[26px] font-black tracking-[0.45em] text-neon placeholder:text-mist-dim/40 focus:border-neon/70 focus:outline-none"
              />

              {status && (
                <p
                  className={`rounded-xl border p-3 font-mono text-[11.5px] leading-relaxed ${
                    status.ok
                      ? "border-neon/25 bg-neon/10 text-neon-lite"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  {status.msg}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onExit}
                  className="rounded-full border border-line-bright bg-white/[0.04] px-4 py-3 text-[13px] font-bold text-mist hover:text-paper cursor-pointer"
                >
                  ← Store
                </button>
                <button
                  type="button"
                  onClick={handleTotpUnlock}
                  disabled={totpInput.length !== 6 || busy}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-neon px-5 py-3 text-[13.5px] font-extrabold text-[#04150C] shadow-[0_12px_28px_-12px_rgba(34,224,124,0.9)] transition hover:bg-neon-lite disabled:opacity-40 cursor-pointer"
                >
                  {busy ? "Verifying…" : "Verify & Enter Console"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="border-t border-line/60 pt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Reset the encrypted vault on this device? You will need a valid Access Key to re-enroll.")) {
                      clearSealedVault();
                      setVaultMeta(null);
                      setTotpInput("");
                      setStatus(null);
                      setMode("access-key");
                    }
                  }}
                  className="font-mono text-[11px] text-mist-dim hover:text-red-300 cursor-pointer"
                >
                  Switch key / Reset device vault
                </button>
              </div>
            </div>
          )}

          {/* DELEGATE STEP 1: PASTE ENCRYPTED ACCESS KEY */}
          {mode === "access-key" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-line/70 pb-3 font-mono text-[11px]">
                <span className="text-neon font-bold">[DELEGATED_ACCESS]</span>
                <span className="text-mist-dim">AES-256-GCM Encrypted</span>
              </div>

              <div>
                <h2 className="font-display text-[20px] font-extrabold text-paper">
                  Activate Encrypted Access Key
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-mist">
                  Paste the encrypted access string provided by the store administrator. Credentials remain hidden and sealed at all times.
                </p>
              </div>

              <label className="block space-y-1.5">
                <span className="font-mono text-[10.5px] font-bold uppercase tracking-widest text-mist-dim">
                  Encrypted Key String
                </span>
                <textarea
                  autoFocus
                  rows={3}
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value.trim())}
                  placeholder="AXD1.S...."
                  className="w-full rounded-2xl border border-line-bright bg-[#050C08] px-3.5 py-3 font-mono text-[12px] text-neon-lite placeholder:text-mist-dim/50 focus:border-neon/60 focus:outline-none"
                />
              </label>

              {needsPin && (
                <label className="block space-y-1.5">
                  <span className="font-mono text-[10.5px] font-bold uppercase tracking-widest text-amber">
                    Activation PIN Required
                  </span>
                  <input
                    type="password"
                    value={activationPin}
                    onChange={(e) => setActivationPin(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDecryptAccessKey()}
                    placeholder="Enter activation PIN"
                    className="w-full rounded-2xl border border-amber/40 bg-[#050C08] px-4 py-3 font-mono text-[13px] text-paper placeholder:text-mist-dim focus:border-amber focus:outline-none"
                  />
                </label>
              )}

              {status && (
                <p
                  className={`rounded-xl border p-3 font-mono text-[11.5px] leading-relaxed ${
                    status.ok
                      ? "border-neon/25 bg-neon/10 text-neon-lite"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  {status.msg}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onExit}
                  className="rounded-full border border-line-bright bg-white/[0.04] px-4 py-3 text-[13px] font-bold text-mist hover:text-paper cursor-pointer"
                >
                  ← Store
                </button>
                <button
                  type="button"
                  onClick={handleDecryptAccessKey}
                  disabled={!accessKey.trim() || busy}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-neon px-5 py-3 text-[13.5px] font-extrabold text-[#04150C] shadow-[0_12px_28px_-12px_rgba(34,224,124,0.9)] transition hover:bg-neon-lite disabled:opacity-40 cursor-pointer"
                >
                  {busy ? "Decrypting…" : "Activate & Setup 2FA"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* DELEGATE STEP 2: ONE-TIME AUTHENTICATOR ENROLLMENT */}
          {mode === "totp-enroll" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-line/70 pb-3 font-mono text-[11px]">
                <span className="text-neon font-bold">[ONE_TIME_2FA_BINDING]</span>
                <span className="text-amber">Setup once only</span>
              </div>

              <div>
                <h2 className="font-display text-[19px] font-extrabold text-paper">
                  Bind Your Authenticator App
                </h2>
                <p className="mt-1 text-[12px] leading-relaxed text-mist">
                  Scan this QR code in Google Authenticator, Authy, or 1Password. Once verified, this setup key is permanently hidden and never displayed again.
                </p>
              </div>

              {enrollQr && (
                <div className="flex flex-col items-center rounded-2xl border border-line-bright bg-[#050C08] p-4">
                  <div className="rounded-xl bg-[#F2FBF6] p-2">
                    <img src={enrollQr} alt="2FA Authenticator QR" className="h-[170px] w-[170px]" />
                  </div>
                  <p className="mt-3 text-center text-[11.5px] font-semibold text-neon-lite">
                    Scan with Google Authenticator, Authy, 2FAS or 1Password
                  </p>
                </div>
              )}

              {/* Manual copy option — essential when no second device is available */}
              <div className="rounded-2xl border border-neon/30 bg-[#06120C] p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
                  <div>
                    <h3 className="text-[13px] font-extrabold text-paper">
                      No second device? Copy the setup key instead
                    </h3>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-mist">
                      Copy this key and paste it into an authenticator app on this same device. Choose “Enter a setup key” / “Manual entry” in your app.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-[#050C08] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-mist-dim">
                    Manual Setup Key
                  </p>
                  <code className="mt-1.5 block select-all break-all font-mono text-[13px] font-bold leading-relaxed text-neon-lite">
                    {enrollSecret}
                  </code>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await copyToClipboard(enrollSecret);
                      if (!ok) {
                        setStatus({ ok: false, msg: "Automatic copy was blocked — select the setup key above and copy it manually." });
                        return;
                      }
                      setCopiedSecret(true);
                      setTimeout(() => setCopiedSecret(false), 2200);
                    }}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[12.5px] font-extrabold transition cursor-pointer ${
                      copiedSecret
                        ? "bg-neon text-[#04150C]"
                        : "border border-neon/50 bg-neon/10 text-neon hover:bg-neon hover:text-[#04150C]"
                    }`}
                  >
                    {copiedSecret ? <Check className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    {copiedSecret ? "Setup Key Copied ✓" : "Copy Setup Key"}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await copyToClipboard(enrollUri);
                      if (!ok) {
                        setStatus({ ok: false, msg: "Automatic copy was blocked — use the Copy Setup Key option instead." });
                        return;
                      }
                      setCopiedUri(true);
                      setTimeout(() => setCopiedUri(false), 2200);
                    }}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[12.5px] font-extrabold transition cursor-pointer ${
                      copiedUri
                        ? "bg-neon text-[#04150C]"
                        : "border border-line-bright bg-white/[0.04] text-chalk hover:border-neon/50 hover:text-neon"
                    }`}
                  >
                    {copiedUri ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                    {copiedUri ? "Setup Link Copied ✓" : "Copy Setup Link"}
                  </button>
                </div>

                <p className="text-[10.5px] leading-relaxed text-mist-dim">
                  “Copy Setup Link” copies the full otpauth:// link — useful for desktop authenticator apps that accept a setup link. This screen appears only once; after verification the key and link are permanently hidden.
                </p>
              </div>

              <label className="block space-y-1.5">
                <span className="font-mono text-[10.5px] font-bold uppercase tracking-widest text-mist">
                  Enter 6-Digit Code to Verify &amp; Seal Vault
                </span>
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={enrollCode}
                  onChange={(e) => setEnrollCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && handleCompleteEnrollment()}
                  placeholder="000000"
                  className="w-full rounded-2xl border border-line-bright bg-[#050C08] px-4 py-3.5 text-center font-mono text-[22px] font-black tracking-[0.4em] text-neon focus:border-neon/70 focus:outline-none"
                />
              </label>

              {status && (
                <p
                  className={`rounded-xl border p-3 font-mono text-[11.5px] leading-relaxed ${
                    status.ok
                      ? "border-neon/25 bg-neon/10 text-neon-lite"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  {status.msg}
                </p>
              )}

              <button
                type="button"
                onClick={handleCompleteEnrollment}
                disabled={enrollCode.length !== 6 || busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-neon px-5 py-3.5 text-[13.5px] font-extrabold text-[#04150C] shadow-[0_12px_28px_-12px_rgba(34,224,124,0.9)] transition hover:bg-neon-lite disabled:opacity-40 cursor-pointer"
              >
                {busy ? "Sealing Vault…" : "Verify Code & Enter Console"}
                <Check className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* MASTER OWNER 3-STEP LOGIN */}
          {mode === "owner" && (
            <>
              <div className="mb-5 flex items-center justify-center gap-2">
                {ownerSteps.map((s, i) => (
                  <div key={s.key} className="flex items-center gap-2">
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-full font-mono text-[12px] font-black transition-all ${
                        i < step
                          ? "bg-neon text-[#04150C]"
                          : i === step
                          ? "border border-neon/50 bg-neon/15 text-neon shadow-[0_0_18px_rgba(34,224,124,0.35)]"
                          : "border border-line-bright bg-white/[0.05] text-mist-dim"
                      }`}
                    >
                      {i < step ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    {i < ownerSteps.length - 1 && (
                      <span className={`h-[2px] w-8 rounded-full ${i < step ? "bg-neon" : "bg-line-bright"}`} />
                    )}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 22 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -22 }}
                  transition={{ duration: 0.22 }}
                >
                  <p className="font-mono text-[11px] font-bold text-neon">{currentOwnerStep.badge}</p>
                  <h2 className="mt-1.5 font-display text-[19px] font-extrabold text-paper">
                    {currentOwnerStep.title}
                  </h2>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-mist">
                    {currentOwnerStep.sub}
                  </p>

                  <input
                    autoFocus
                    type={currentOwnerStep.key === "token" ? "password" : "text"}
                    value={ownerValue}
                    onChange={(e) => setForm({ ...form, [currentOwnerStep.key]: e.target.value.trim() })}
                    onKeyDown={(e) => e.key === "Enter" && handleOwnerNext()}
                    placeholder={currentOwnerStep.placeholder}
                    className="mt-4 w-full rounded-2xl border border-line-bright bg-[#070F0B] px-4 py-3.5 font-mono text-[13.5px] text-paper placeholder:text-mist-dim focus:border-neon/60 focus:bg-neon/[0.04] focus:outline-none"
                  />

                  {currentOwnerStep.key === "token" && (
                    <label className="mt-3 flex items-center gap-2 text-[11.5px] text-mist">
                      <span className="font-mono font-bold text-mist-dim">Branch:</span>
                      <input
                        value={form.branch || "main"}
                        onChange={(e) => setForm({ ...form, branch: e.target.value.trim() || "main" })}
                        className="w-24 rounded-lg border border-line-bright bg-[#070F0B] px-2 py-1 font-mono text-[11.5px] text-paper focus:border-neon/50 focus:outline-none"
                      />
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo&description=AXD%20Admin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto font-bold text-neon hover:text-neon-lite"
                      >
                        Create PAT ↗
                      </a>
                    </label>
                  )}
                </motion.div>
              </AnimatePresence>

              {status && (
                <p
                  className={`mt-4 rounded-xl border p-3 font-mono text-[11.5px] leading-relaxed ${
                    status.ok
                      ? "border-neon/25 bg-neon/10 text-neon-lite"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  {status.msg}
                </p>
              )}

              <div className="mt-5 flex gap-3">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(step - 1);
                      setStatus(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line-bright bg-white/[0.04] px-4 py-3 text-[13px] font-bold text-mist hover:text-paper cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onExit}
                    className="rounded-full border border-line-bright bg-white/[0.04] px-4 py-3 text-[13px] font-bold text-mist hover:text-paper cursor-pointer"
                  >
                    ← Store
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOwnerNext}
                  disabled={!canOwnerNext || busy}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-neon px-5 py-3 text-[13.5px] font-extrabold text-[#04150C] shadow-[0_12px_28px_-12px_rgba(34,224,124,0.9)] transition hover:bg-neon-lite disabled:opacity-40 cursor-pointer"
                >
                  {busy ? "Verifying…" : step === 2 ? "Connect & Enter Console" : "Next"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {status && !status.ok && step === 2 && (
                <button
                  type="button"
                  onClick={() => onUnlock({ role: "owner", label: "Master Owner", githubConfig: form })}
                  className="mt-3 w-full rounded-full border border-line-bright py-2.5 text-[12px] font-bold text-mist hover:text-paper cursor-pointer"
                >
                  Continue anyway (local mode) →
                </button>
              )}
            </>
          )}
        </div>

        <p className="mt-4 text-center font-mono text-[10.5px] leading-relaxed text-mist-dim">
          🔒 Zero-trust client security · Tokens remain strictly on authorized local sessions and are never committed to GitHub.
        </p>
      </div>
    </div>
  );
}
