import type { SVGProps } from "react";

type I = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* ------------------------------------------------------------------ */
/*  Brand mark — PROBOY "A" monogram                                    */
/* ------------------------------------------------------------------ */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="PROBOY">
      <defs>
        <linearGradient id="pb-a" x1="24" y1="2" x2="24" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7CFFC0" />
          <stop offset="0.45" stopColor="#22E07C" />
          <stop offset="1" stopColor="#0F9B52" />
        </linearGradient>
      </defs>
      <path
        fill="url(#pb-a)"
        d="M24 3.4a2.1 2.1 0 0 1 1.8 1.03l19.4 35.1a2.1 2.1 0 0 1-1.8 3.15h-9.9a2.1 2.1 0 0 1-1.9-1.17L24 22.9l-7.6 18.6a2.1 2.1 0 0 1-1.9 1.17H4.6a2.1 2.1 0 0 1-1.8-3.15l19.4-35.1A2.1 2.1 0 0 1 24 3.4Z"
      />
      <path
        fill="url(#pb-a)"
        d="M15.4 30.2h17.2a1.95 1.95 0 0 1 0 3.9H15.4a1.95 1.95 0 0 1 0-3.9Z"
      />
      <path
        fill="#B6FFDD"
        d="M40.2 3.2c.35 1.9 1.1 2.9 2.8 3.4-1.7.5-2.45 1.5-2.8 3.4-.35-1.9-1.1-2.9-2.8-3.4 1.7-.5 2.45-1.5 2.8-3.4Z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  UI icons                                                            */
/* ------------------------------------------------------------------ */
export const Search = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.4-3.4" />
  </svg>
);

export const ChevronDown = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ArrowRight = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 12h15" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

export const ArrowLeft = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M20 12H5" />
    <path d="m11 6-6 6 6 6" />
  </svg>
);

export const Bolt = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M13.6 2 4.5 13.2h6.1L10 22l9.4-11.6h-6.3L13.6 2Z" />
  </svg>
);

export const ShieldCheck = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 2.4 20 5.6v5.9c0 4.6-3.2 8.2-8 10.1-4.8-1.9-8-5.5-8-10.1V5.6L12 2.4Z" />
    <path d="m8.6 11.8 2.4 2.4 4.4-4.4" />
  </svg>
);

export const Code = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="m8.6 6.5-5.4 5.5 5.4 5.5" />
    <path d="m15.4 6.5 5.4 5.5-5.4 5.5" />
    <path d="m13.4 4-2.8 16" />
  </svg>
);

export const Grid = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <rect x="3" y="3" width="7.4" height="7.4" rx="2.2" />
    <rect x="13.6" y="3" width="7.4" height="7.4" rx="2.2" />
    <rect x="3" y="13.6" width="7.4" height="7.4" rx="2.2" />
    <rect x="13.6" y="13.6" width="7.4" height="7.4" rx="2.2" />
  </svg>
);

export const Palette = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 2.6a9.4 9.4 0 0 0 0 18.8c1.3 0 1.9-.9 1.9-1.8 0-1.2-1-1.6-1-2.6 0-.8.7-1.5 1.6-1.5h1.7a5 5 0 0 0 5-5c0-4.4-4-7.9-9.2-7.9Z" />
    <circle cx="7.4" cy="11.4" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="10.2" cy="7.3" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="15.2" cy="7.6" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="17.9" cy="11.6" r="1.15" fill="currentColor" stroke="none" />
  </svg>
);

export const Chart = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M3.4 20.2h17.2" />
    <rect x="5" y="12" width="3.6" height="6" rx="1.4" />
    <rect x="10.2" y="8.4" width="3.6" height="9.6" rx="1.4" />
    <rect x="15.4" y="4.6" width="3.6" height="13.4" rx="1.4" />
  </svg>
);

export const Sparkle = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 2.8c.9 4.3 2.5 5.9 6.8 6.8-4.3.9-5.9 2.5-6.8 6.8-.9-4.3-2.5-5.9-6.8-6.8 4.3-.9 5.9-2.5 6.8-6.8Z" />
    <path d="M18.4 15.6c.4 1.9 1.1 2.6 3 3-1.9.4-2.6 1.1-3 3-.4-1.9-1.1-2.6-3-3 1.9-.4 2.6-1.1 3-3Z" />
  </svg>
);

export const Dots = (p: I) => (
  <svg viewBox="0 0 24 24" {...p}>
    <circle cx="5.5" cy="12" r="1.9" fill="currentColor" />
    <circle cx="12" cy="12" r="1.9" fill="currentColor" />
    <circle cx="18.5" cy="12" r="1.9" fill="currentColor" />
  </svg>
);

export const SortList = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M9 6.5h12" />
    <path d="M9 12h12" />
    <path d="M9 17.5h12" />
    <path d="M3 6.2h1.4" />
    <path d="M3 12h2.6" />
    <path d="M3 17.5h3.8" />
  </svg>
);

export const Headset = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 15.4v-3.2a8 8 0 0 1 16 0v3.2" />
    <rect x="2.4" y="13.6" width="4.4" height="6.2" rx="2.2" />
    <rect x="17.2" y="13.6" width="4.4" height="6.2" rx="2.2" />
    <path d="M19.4 19.8v.4a2.6 2.6 0 0 1-2.6 2.6H13" />
  </svg>
);

export const ThumbUp = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M7.4 21V10.2l4.2-7a2.4 2.4 0 0 1 2.3 2.9l-1.1 4.1h4.9a2.4 2.4 0 0 1 2.3 3l-1.7 6a2.4 2.4 0 0 1-2.3 1.8H7.4Z" />
    <rect x="2.6" y="10.2" width="4.8" height="10.8" rx="1.5" />
  </svg>
);

export const Star = (p: I) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path
      fill="currentColor"
      d="M12 2.6c.34 0 .65.2.79.51l2.3 5.1 5.55.56c.35.04.64.27.75.6a.82.82 0 0 1-.27.87l-4.15 3.64 1.2 5.45c.08.35-.06.71-.35.92a.83.83 0 0 1-.9.05L12 17.72l-4.92 2.58a.83.83 0 0 1-.9-.05.87.87 0 0 1-.35-.92l1.2-5.45-4.15-3.64a.82.82 0 0 1-.27-.87c.11-.33.4-.56.75-.6l5.55-.56 2.3-5.1c.14-.31.45-.51.79-.51Z"
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Category / service glyphs                                           */
/* ------------------------------------------------------------------ */
export const WhatsApp = (p: I) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path
      fill="currentColor"
      d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.6.14-.14.3-.35.44-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.01-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.7.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35Z"
    />
    <path
      fill="currentColor"
      d="M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88Zm8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42Z"
    />
  </svg>
);

export const ShopifyBag = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M6.2 7.4h11.6l1.3 12.1a1.7 1.7 0 0 1-1.7 1.9H6.6a1.7 1.7 0 0 1-1.7-1.9L6.2 7.4Z" />
    <path d="M9.1 9.6V6.7a2.9 2.9 0 0 1 5.8 0v2.9" />
  </svg>
);

export const Robot = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <rect x="3.2" y="7.6" width="17.6" height="12" rx="3.4" />
    <path d="M12 3.2v4.4" />
    <circle cx="12" cy="2.6" r="1.5" />
    <path d="M1.2 12.6v3.2" />
    <path d="M22.8 12.6v3.2" />
    <circle cx="8.4" cy="13.4" r="1.55" fill="currentColor" stroke="none" />
    <circle cx="15.6" cy="13.4" r="1.55" fill="currentColor" stroke="none" />
    <path d="M9.2 17h5.6" />
  </svg>
);

export const Rocket = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 2.4c3.1 2.2 4.9 5.7 4.9 9.5l-2.2 3.4H9.3l-2.2-3.4c0-3.8 1.8-7.3 4.9-9.5Z" />
    <circle cx="12" cy="10.2" r="1.9" />
    <path d="M9.3 15.3 7 18.7l2.9-.8" />
    <path d="M14.7 15.3 17 18.7l-2.9-.8" />
    <path d="M10.8 18.4c.3 1.6.7 2.6 1.2 3.2.5-.6.9-1.6 1.2-3.2" />
  </svg>
);

export const PaperPlane = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M21.4 2.6 2.6 10.2c-.7.3-.7 1.3 0 1.6l6.8 2.7 2.7 6.8c.3.7 1.3.7 1.6 0l7.6-18.8a.86.86 0 0 0-1.1-1.1Z" />
    <path d="m9.4 14.5 4.7-4.7" />
  </svg>
);

export const ChatBubble = (p: I) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M20.6 12.4c0 4.1-3.8 7.4-8.6 7.4-1 0-2-.15-2.9-.42L3.4 21l1.5-3.7a6.9 6.9 0 0 1-2.3-4.9C2.6 8.3 6.4 5 11.2 5s9.4 3.3 9.4 7.4Z" />
  </svg>
);
