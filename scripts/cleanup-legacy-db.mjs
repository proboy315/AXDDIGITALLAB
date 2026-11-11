/**
 * Removes the leftover database-era files that break the Next.js build
 * on Vercel. Run once from the project root:
 *
 *   node scripts/cleanup-legacy-db.mjs
 *   git add -A && git commit -m "chore: remove legacy database files" && git push
 *
 * Publishing no longer uses a database: the admin panel writes straight to
 * src/data/database.ts + public/uploads/ in this repo.
 */
import { existsSync, rmSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const LEGACY_PATHS = [
  "src/app/api/admin",
  "src/app/api/media",
  "src/app/api/site",
  "src/db",
  "src/lib/server",
  "drizzle.config.json",
  "drizzle.config.ts",
];

let removed = 0;
for (const p of LEGACY_PATHS) {
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
    console.log(`removed  ${p}`);
    removed++;
  }
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const staleImports = [];
for (const file of walk("src").filter((f) => /\.(ts|tsx)$/.test(f))) {
  const text = readFileSync(file, "utf8");
  if (/from\s+["']@\/db["']|from\s+["']@\/lib\/server/.test(text)) staleImports.push(file);
}

if (staleImports.length) {
  console.log("\n⚠️  These files still import the removed database modules:");
  for (const f of staleImports) console.log(`   - ${f}`);
  console.log("Delete or update them, then run the build again.");
} else {
  console.log(removed ? `\n✅ Removed ${removed} legacy path(s). No database imports remain.` : "\n✅ Nothing to clean — no database imports remain.");
}
