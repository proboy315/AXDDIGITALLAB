"use client";

import { useState } from "react";
import { LogoMark } from "../IconsNew";
import { Backdrop } from "../Backdrop";
import { testGithubConnection, type GithubConfig } from "@/lib/github";
import { btnGhost, btnPrimary, Field, inputCls } from "./ui";

/**
 * The admin "door": enter your GitHub credentials. This is the same
 * mechanism as your original app — the token is what lets the Publish
 * button write files to your repo.
 */
export function AdminLogin({ initial, onConnect }: { initial: GithubConfig | null; onConnect: (cfg: GithubConfig) => void }) {
  const [form, setForm] = useState<GithubConfig>({
    username: initial?.username || "",
    repo: initial?.repo || "",
    token: initial?.token || "",
    branch: initial?.branch || "main",
  });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!form.username || !form.repo || !form.token) return setStatus({ ok: false, text: "Fill in all fields" });
    setBusy(true);
    const res = await testGithubConnection(form);
    setBusy(false);
    if (!res.ok) return setStatus({ ok: false, text: res.message });
    setStatus({ ok: true, text: res.message });
    setTimeout(() => onConnect({ ...form, branch: form.branch || "main" }), 350);
  };

  return (
    <div className="relative isolate grid min-h-screen place-items-center px-4 py-10">
      <Backdrop />
      <form onSubmit={connect} className="liquid-glass liquid-strong w-full max-w-[460px] rounded-[28px] p-7 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <LogoMark className="h-7 w-7" />
          </span>
          <div>
            <p className="font-display text-[20px] font-black text-paper">Admin Studio</p>
            <p className="text-[12.5px] text-mist">Connect GitHub to edit & publish your site</p>
          </div>
        </div>

        <p className="mt-4 rounded-xl border border-neon/20 bg-neon/[0.07] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-mist">
          Publishing writes your content as <b className="text-paper">src/data/database.ts</b> and your photos to{" "}
          <b className="text-paper">public/uploads/</b> in this repo — then Vercel rebuilds the site. Use a GitHub{" "}
          <b className="text-paper">fine-grained or classic token</b> with <i>contents: read/write</i> on this repo.
        </p>

        <div className="mt-5 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="GitHub username / org">
              <input className={inputCls} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="proboy315" />
            </Field>
            <Field label="Repository">
              <input className={inputCls} value={form.repo} onChange={(e) => setForm({ ...form, repo: e.target.value })} placeholder="AXDDIGITALLAB" />
            </Field>
          </div>
          <Field label="Branch">
            <input className={inputCls} value={form.branch || "main"} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="main" />
          </Field>
          <Field label="Personal access token">
            <input type="password" className={inputCls} value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} placeholder="ghp_…" />
          </Field>
        </div>

        {status && (
          <p className={`mt-3 rounded-xl border px-3 py-2 text-[12.5px] ${status.ok ? "border-neon/25 bg-neon/10 text-neon-lite" : "border-red-400/20 bg-red-500/10 text-red-300"}`}>
            {status.text}
          </p>
        )}

        <button type="submit" disabled={busy} className={`${btnPrimary} mt-5 w-full py-3 text-[14px]`}>
          {busy ? "Testing connection…" : "Test connection & continue"}
        </button>
      </form>
    </div>
  );
}
