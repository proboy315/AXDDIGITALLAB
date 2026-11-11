import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

export interface TermLine {
  text: string;
  tone?: "cmd" | "ok" | "info" | "warn" | "dim";
}

interface TerminalProps {
  title?: string;
  /** One or more "screens"; each screen is typed line-by-line, then we advance. */
  script: TermLine[][];
  holdMs?: number;
  loop?: boolean;
  footer?: string[];
  className?: string;
}

const toneClass: Record<NonNullable<TermLine["tone"]>, string> = {
  cmd: "text-paper",
  ok: "text-neon",
  info: "text-chalk",
  warn: "text-amber",
  dim: "text-mist-dim",
};

/**
 * Hacker-style terminal window with a live typing effect.
 * Pure CSS/SVG — no images.
 */
export function Terminal({
  title = "root@axd",
  script,
  holdMs = 2600,
  loop = true,
  footer,
  className = "",
}: TerminalProps) {
  const reduced = useReducedMotion();
  const [screen, setScreen] = useState(0);
  const [li, setLi] = useState(0);
  const [chars, setChars] = useState(0);

  const safeScript = script.length > 0 ? script : [[{ text: "", tone: "dim" as const }]];
  const lines = safeScript[screen % safeScript.length];

  useEffect(() => {
    setScreen(0);
    setLi(0);
    setChars(0);
  }, [script]);

  useEffect(() => {
    if (reduced) return;
    const cur = lines[li];
    if (!cur) {
      if (!loop && screen >= safeScript.length - 1) return;
      const t = setTimeout(() => {
        setScreen((s) => s + 1);
        setLi(0);
        setChars(0);
      }, holdMs);
      return () => clearTimeout(t);
    }
    if (chars < cur.text.length) {
      const t = setTimeout(() => setChars((c) => c + 1), cur.tone === "cmd" ? 30 : 9);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => {
        setLi((l) => l + 1);
        setChars(0);
      },
      cur.tone === "cmd" ? 260 : 420,
    );
    return () => clearTimeout(t);
  }, [screen, li, chars, lines, holdMs, loop, reduced, safeScript.length]);

  const visible: TermLine[] = reduced
    ? lines
    : [...lines.slice(0, li), ...(lines[li] ? [{ ...lines[li], text: lines[li].text.slice(0, chars) }] : [])];

  return (
    <div
      className={`term-panel relative overflow-hidden rounded-[20px] border border-neon/25 bg-[#030a06]/95 shadow-[0_0_0_1px_rgba(34,224,124,0.08),0_30px_80px_-30px_rgba(34,224,124,0.35),0_30px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl ${className}`}
    >
      {/* title bar */}
      <div className="flex items-center gap-2 border-b border-neon/12 bg-white/[0.02] px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>
          <i className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <i className="h-2.5 w-2.5 rounded-full bg-neon" />
        </span>
        <span className="ml-2 truncate font-terminal text-[11px] font-semibold tracking-wide text-mist">
          {title}
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-neon/25 bg-neon/10 px-2.5 py-1 font-terminal text-[10px] font-bold tracking-widest text-neon">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon" /> LIVE
        </span>
      </div>

      {/* body */}
      <div className="relative min-h-[218px] p-4 font-terminal text-[12.5px] leading-[1.75] sm:min-h-[228px] sm:text-[13px]">
        {visible.map((l, i) => {
          const isLast = i === visible.length - 1;
          const typing = !reduced && lines[li] !== undefined && i === li;
          return (
            <div key={`${screen}-${i}`} className="whitespace-pre-wrap break-words">
              {l.tone === "cmd" ? (
                <span>
                  <span className="mr-2 select-none font-bold text-neon">$</span>
                  <span className={toneClass.cmd}>{l.text}</span>
                  {isLast && typing && <span className="term-caret" aria-hidden />}
                </span>
              ) : (
                <span className={toneClass[l.tone || "info"]}>
                  {l.tone === "ok" ? (
                    <>
                      <span className="mr-2 select-none font-bold">[OK]</span>
                      {l.text}
                    </>
                  ) : (
                    l.text
                  )}
                  {isLast && typing && <span className="term-caret" aria-hidden />}
                </span>
              )}
            </div>
          );
        })}
        {reduced || (!lines[li] && visible.length === lines.length) ? (
          <div>
            <span className="mr-2 select-none font-bold text-neon">$</span>
            <span className="term-caret" aria-hidden />
          </div>
        ) : null}
        <div aria-hidden className="scanlines pointer-events-none absolute inset-0" />
      </div>

      {/* status bar */}
      {footer && footer.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-neon/12 bg-white/[0.02] px-4 py-2.5 font-terminal text-[10px] font-semibold tracking-[0.14em] text-mist-dim">
          {footer.map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-neon/70" aria-hidden />
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
