// Post-build prerender: one static HTML snapshot per route for crawlers and
// AI-agent fetchers (dynamic rendering — same content the SPA shows, so humans
// and bots see identical titles, summaries, and links).
// Run: npx tsx scripts/prerender.ts (wired into `npm run build`).
import fs from "fs";
import path from "path";
import { CANONICAL_HOST, ROUTE_META, jsonLdFor } from "../shared/seo";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const slugFor = (routePath: string) =>
  routePath === "/" ? "index" : routePath.replace(/^\//, "").replace(/\//g, "-");

function snapshot(meta: (typeof ROUTE_META)[number]): string {
  const url = `${CANONICAL_HOST}${meta.path}`;
  const nav = ROUTE_META.map(
    (r) => `<li><a href="${CANONICAL_HOST}${r.path}">${esc(r.h1)}</a></li>`
  ).join("\n");
  const steps = (meta.steps ?? []).map((s) => `<li>${esc(s)}</li>`).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}" />
<meta property="og:title" content="${esc(meta.title)}" />
<meta property="og:description" content="${esc(meta.description)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${url}" />
<meta name="twitter:card" content="summary" />
<link rel="canonical" href="${url}" />
<script type="application/ld+json">${JSON.stringify(jsonLdFor(meta))}</script>
</head>
<body>
<header><nav aria-label="HIT tools"><ul>
${nav}
</ul></nav></header>
<main>
<h1>${esc(meta.h1)}</h1>
<p>${esc(meta.summary)}</p>
${steps ? `<h2>How it works</h2>\n<ol>\n${steps}\n</ol>` : ""}
<p><a href="${url}">Open the interactive tool</a></p>
</main>
</body>
</html>
`;
}

const outDir = path.resolve(import.meta.dirname, "..", "dist", "public", "__snapshots");
fs.mkdirSync(outDir, { recursive: true });
for (const meta of ROUTE_META) {
  fs.writeFileSync(path.join(outDir, `${slugFor(meta.path)}.html`), snapshot(meta));
}
console.log(`prerendered ${ROUTE_META.length} snapshots -> ${outDir}`);
