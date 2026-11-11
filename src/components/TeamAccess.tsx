import { useEffect, useState } from "react";
import { KeyIcon, CopyIcon, Check, Trash, FingerprintIcon, EyeOffIcon } from "./IconsNew";
import type { GithubConfig } from "@/lib/db";
import {
  issueAccessKey,
  listIssuedKeys,
  deleteKeyRecord,
  revokeKey,
  formatExpiry,
  keyExpired,
  type TeamMeta,
} from "@/lib/teamAccess";

async function copyText(t: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

const validityOptions = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 0, label: "No expiry" },
];

/**
 * Owner-only: generate encrypted team access keys, list issued keys,
 * revoke them (synced to the repo), and delete local records.
 */
export function TeamAccess({ cfg, log }: { cfg: GithubConfig | null; log: (msg: string) => void }) {
  const [label, setLabel] = useState("");
  const [days, setDays] = useState(30);
  const [result, setResult] = useState<{ keyString: string; meta: TeamMeta } | null>(null);
  const [keys, setKeys] = useState<TeamMeta[]>(() => listIssuedKeys());
  const [busyGen, setBusyGen] = useState(false);
  const [busyFp, setBusyFp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => setKeys(listIssuedKeys());
  useEffect(() => {
    refresh();
  }, []);

  const generate = () => {
    if (!cfg) {
      setError("Connect GitHub in the sidebar first — keys are sealed against your repo credentials.");
      return;
    }
    setError(null);
    setBusyGen(true);
    try {
      const out = issueAccessKey(cfg, label.trim() || "Team Admin", days);
      setResult(out);
      setCopied(false);
      refresh();
      log(`[team] access key issued for "${out.meta.label}" · fp ${out.meta.fp}`);
    } catch {
      setError("Could not generate a key. Please try again.");
    }
    setBusyGen(false);
  };

  const revoke = async (fp: string) => {
    if (!confirm("Revoke this access key? The teammate will be signed out everywhere.")) return;
    setBusyFp(fp);
    const res = await revokeKey(cfg, fp);
    refresh();
    log(`[team] key revoked · fp ${fp} · ${res.ok ? "synced" : "local only"}`);
    setBusyFp(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-[22px] font-black text-paper">Team Access</h2>
        <p className="mt-1 max-w-[70ch] text-[12.5px] leading-relaxed text-mist">
          Generate an encrypted access key for a teammate. They can manage products, sections, settings and
          publish — but they will <span className="font-bold text-paper">never see</span> your GitHub
          username, repo name or token.
        </p>
      </div>

      {/* generate */}
      <div className="rounded-2xl border border-neon/20 bg-neon/[0.04] p-5">
        <h3 className="flex items-center gap-2 font-display text-[14px] font-extrabold text-paper">
          <KeyIcon className="h-4 w-4 text-neon" /> Generate access key
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_170px_auto]">
          <label className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-mist">Teammate label</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Ali — content editor"
              maxLength={60}
              className="w-full rounded-xl border border-line-bright bg-[#0A1410] px-3 py-3 text-[13px] text-paper placeholder:text-mist-dim focus:border-neon/50 focus:outline-none"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-mist">Valid for</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full rounded-xl border border-line-bright bg-[#0A1410] px-3 py-3 text-[13px] text-paper focus:border-neon/50 focus:outline-none"
            >
              {validityOptions.map((o) => (
                <option key={o.label} value={o.days}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              onClick={generate}
              disabled={busyGen}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-neon px-6 py-3 text-[13px] font-extrabold text-[#04150C] hover:bg-neon-lite disabled:opacity-50 sm:w-auto"
            >
              <KeyIcon className="h-4 w-4" /> {busyGen ? "Sealing…" : "Generate Key"}
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[12px] text-red-300">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-4 rounded-2xl border border-neon/30 bg-[#04120B] p-4">
            <p className="flex items-center gap-2 text-[12px] font-extrabold text-neon">
              <Check className="h-4 w-4" /> Key generated — shown ONCE. Send it now, it will not appear again.
            </p>
            <div className="mt-3 flex items-start gap-2">
              <code className="min-w-0 flex-1 break-all rounded-xl border border-line-bright bg-black/40 p-3 font-terminal text-[11.5px] leading-relaxed text-neon-lite">
                {result.keyString}
              </code>
              <button
                onClick={async () => {
                  const ok = await copyText(result.keyString);
                  setCopied(ok);
                  if (ok) {
                    log(`[team] key copied to clipboard · fp ${result.meta.fp}`);
                    setTimeout(() => setCopied(false), 2500);
                  }
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-neon px-4 py-2.5 text-[12px] font-extrabold text-[#04150C] hover:bg-neon-lite"
              >
                <CopyIcon className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 font-terminal text-[11px] text-mist">
              Fingerprint: <span className="font-bold text-paper">{result.meta.fp}</span> ·{" "}
              {formatExpiry(result.meta.exp)}
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-mist">
              Share it over a private channel (e.g. WhatsApp). On first use your teammate scans an
              authenticator code — after that, every sign-in asks for a fresh 6-digit code.
            </p>
          </div>
        )}
      </div>

      {/* issued keys */}
      <div className="rounded-2xl border border-line/70 bg-panel/60 p-5">
        <h3 className="flex items-center gap-2 font-display text-[14px] font-extrabold text-paper">
          <FingerprintIcon className="h-4 w-4 text-neon" /> Issued keys ({keys.length})
        </h3>
        {keys.length === 0 ? (
          <p className="mt-2 text-[12px] text-mist">No keys issued yet. Generated keys appear here with their fingerprint and validity.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line/60">
            {keys.map((k) => {
              const expired = keyExpired(k.exp);
              const dead = k.revoked || expired;
              return (
                <li key={k.fp} className="flex flex-wrap items-center gap-3 py-3">
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${
                      dead ? "border-line-bright text-mist-dim" : "border-neon/25 bg-neon/10 text-neon"
                    }`}
                  >
                    <KeyIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-paper">{k.label}</p>
                    <p className="font-terminal text-[11px] text-mist-dim">
                      fp {k.fp} · {k.revoked ? "revoked" : formatExpiry(k.exp)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                      k.revoked
                        ? "bg-red-500/15 text-red-300"
                        : expired
                          ? "bg-amber/15 text-amber"
                          : "bg-neon/15 text-neon"
                    }`}
                  >
                    {k.revoked ? "Revoked" : expired ? "Expired" : "Active"}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {!k.revoked && (
                      <button
                        onClick={() => revoke(k.fp)}
                        disabled={busyFp === k.fp}
                        className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {busyFp === k.fp ? "…" : "Revoke"}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        deleteKeyRecord(k.fp);
                        refresh();
                        log(`[team] local key record removed · fp ${k.fp}`);
                      }}
                      title="Remove record from this device"
                      className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.05] text-mist hover:text-paper"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* security notes */}
      <div className="rounded-2xl border border-line/70 bg-[#0A1410] p-5">
        <p className="flex items-center gap-2 text-[12px] font-extrabold text-paper">
          <EyeOffIcon className="h-4 w-4 text-neon" /> How teammate privacy is enforced
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[12px] leading-relaxed text-mist">
          <li>Credentials live only inside the sealed key and are decrypted in memory — the teammate UI has no username, repo or token fields at all.</li>
          <li>Revoking syncs a revocation file to the repo, so the key dies on every device. Teammates are re-checked on each sign-in.</li>
          <li>For an instant global kill (all keys, all devices), rotate the GitHub token itself in GitHub settings.</li>
          <li>Only share keys with people you trust, and prefer short expiries. Browsers can technically inspect their own network traffic.</li>
        </ul>
      </div>
    </div>
  );
}
