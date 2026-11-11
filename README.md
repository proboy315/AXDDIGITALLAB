# AXD DIGITAL LAB

Digital services storefront with a liquid-glass dark UI, live 3D effects and an in-browser admin studio.
**No database.** Publishing writes `src/data/database.ts` (the JSON content) and uploaded photos
(`public/uploads/`) straight into this repo via the GitHub API — Vercel rebuilds from the repo and
the new version goes live automatically (~1–2 min).

## Vercel deployment

- `vercel.json` sets `"framework": "nextjs"`, so Vercel builds this as a Next.js app even if the
  project was originally created with the **Vite** preset (which looks for a static `dist` folder).
- Recommended once in the dashboard: **Project → Settings → Build and Deployment → Framework Preset = Next.js**,
  and leave the Output Directory override **off**.
- No environment variables and no database are required.
- The sync pushes one commit per file. Only judge the Vercel build of the **last** commit of a sync —
  builds of the in-between commits can fail because half of the files are still the old version.

## Admin (`/admin`)

1. Enter GitHub username, repo, branch and a personal access token (contents: read/write).
2. Edit services, categories, brand, contact, SEO. Each service supports multiple photos
   (multi-upload, drag & drop, reorder, cover selection) — photos are pushed to `public/uploads/`.
3. Edits are a private in-tab draft (never stored on the device).
4. Press **Publish** (or Ctrl+S) → files are pushed to GitHub → Vercel rebuilds → live for everyone.
