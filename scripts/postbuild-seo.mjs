#!/usr/bin/env node
/**
 * @license MIT
 * ============================================================================
 * scripts/postbuild-seo.mjs — Post-Export Sitemap, 404, IndexNow & Safety Gate
 * ============================================================================
 * Architectural Overview:
 * Executes automatically after `next build` (`output: "export"`) for
 * `https://lore.raggiesoft.com`:
 *   1. Guarantees `out/404.html` exists and carries `<meta name="robots" content="noindex, follow">`.
 *   2. Guarantees `out/robots.txt` and `out/726167676965736f6674696e6465786e.txt` exist.
 *   3. Walks `out/` to discover every canonical pre-rendered route and writes
 *      single-host `out/sitemap.xml` (and mirrors to `public/sitemap.xml`) with
 *      `<lastmod>` timestamps for Google Search Console, Bing, and IndexNow.
 *   4. Audits every exported HTML page in `out/` to guarantee zero trauma-trigger
 *      terms, real-world campus landmarks, or technical consumer-UI jargon.
 * ============================================================================
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LORE_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(LORE_ROOT, "out");
const PUBLIC_DIR = path.join(LORE_ROOT, "public");
const ORIGIN = "https://lore.raggiesoft.com";
const INDEXNOW_KEY = "726167676965736f6674696e6465786e";
const TODAY = new Date().toISOString().slice(0, 10);

if (!fs.existsSync(OUT_DIR)) {
  console.error(`❌ [postbuild-seo] Missing Next.js static export directory: ${OUT_DIR}`);
  process.exit(1);
}

// ----------------------------------------------------------------------------
// 1. Ensure genuine static `out/404.html` with `noindex, follow`
// ----------------------------------------------------------------------------
const out404 = path.join(OUT_DIR, "404.html");
const candidates404 = [
  out404,
  path.join(OUT_DIR, "404", "index.html"),
  path.join(OUT_DIR, "_not-found.html"),
  path.join(OUT_DIR, "_not-found", "index.html"),
];

if (!fs.existsSync(out404)) {
  const found = candidates404.find((p) => fs.existsSync(p));
  if (found) {
    fs.copyFileSync(found, out404);
  }
}

if (!fs.existsSync(out404)) {
  console.error("❌ [postbuild-seo] Could not locate exported 404 page in out/.");
  process.exit(1);
}

let html404 = fs.readFileSync(out404, "utf8");
if (!/noindex/i.test(html404)) {
  html404 = html404.replace(
    /<head>/i,
    '<head><meta name="robots" content="noindex, follow"/>'
  );
  fs.writeFileSync(out404, html404, "utf8");
}

// ----------------------------------------------------------------------------
// 2. Ensure `robots.txt` and IndexNow key file exist in `public/` and `out/`
// ----------------------------------------------------------------------------
const robotsContent = [
  "User-agent: *",
  "Allow: /",
  "",
  `Sitemap: ${ORIGIN}/sitemap.xml`,
  "",
].join("\n");

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.writeFileSync(path.join(PUBLIC_DIR, "robots.txt"), robotsContent, "utf8");
fs.writeFileSync(path.join(OUT_DIR, "robots.txt"), robotsContent, "utf8");

fs.writeFileSync(path.join(PUBLIC_DIR, `${INDEXNOW_KEY}.txt`), `${INDEXNOW_KEY}\n`, "utf8");
fs.writeFileSync(path.join(OUT_DIR, `${INDEXNOW_KEY}.txt`), `${INDEXNOW_KEY}\n`, "utf8");

// ----------------------------------------------------------------------------
// 3. Walk `out/` for canonical HTML routes & audit exported HTML
// ----------------------------------------------------------------------------
function walkHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "_next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      results.push(full);
    }
  }
  return results;
}

const htmlFiles = walkHtmlFiles(OUT_DIR);
const routeSet = new Set();

const HTML_SAFETY_CHECKS = [
  { label: "Trauma-trigger surname block", regex: /\bouellette\b/i, stripAssets: false },
  { label: "Real-world VT landmark", regex: /\b(?:drillfield|torgersen|hokies?|burruss|lane\s+stadium|cassell\s+coliseum)\b/i, stripAssets: true },
  { label: "Progress Street house number", regex: /\b\d+\s+progress\s+street\b/i, stripAssets: true },
  { label: "Technical consumer-UI jargon", regex: /\b(?:HUMAN_VERIFIED|WebVTT|Inno\s+Setup|Zero-Database|Flat-File)\b/, stripAssets: true },
];

for (const file of htmlFiles) {
  const rel = path.relative(OUT_DIR, file).replace(/\\/g, "/");

  // Run safety check on every exported HTML document
  const rawHtml = fs.readFileSync(file, "utf8");
  const assetCleanHtml = rawHtml.replace(
    /https:\/\/assets\.raggiesoft\.com\/[^\s"'<>]+/g,
    "https://assets.raggiesoft.com/_asset"
  );
  for (const rule of HTML_SAFETY_CHECKS) {
    const target = rule.stripAssets ? assetCleanHtml : rawHtml;
    const m = target.match(rule.regex);
    if (m) {
      console.error(`❌ [postbuild-seo] Safety violation (${rule.label}: "${m[0]}") in out/${rel}`);
      process.exit(1);
    }
  }

  // Exclude non-canonical error/internal templates from sitemap.xml
  if (
    rel === "404.html" ||
    rel === "404/index.html" ||
    rel.startsWith("_not-found")
  ) {
    continue;
  }

  let routePath = "/";
  if (rel === "index.html") {
    routePath = "/";
  } else if (rel.endsWith("/index.html")) {
    routePath = "/" + rel.slice(0, -"/index.html".length);
  } else {
    routePath = "/" + rel.slice(0, -".html".length);
  }
  routeSet.add(routePath);
}

const sortedRoutes = [...routeSet].sort((a, b) => {
  if (a === "/") return -1;
  if (b === "/") return 1;
  return a.localeCompare(b);
});

function priorityForRoute(routePath) {
  if (routePath === "/") return "1.0";
  const depth = routePath.split("/").filter(Boolean).length;
  return depth === 1 ? "0.9" : "0.8";
}

const sitemapXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sortedRoutes.map((routePath) => {
    const loc = routePath === "/" ? `${ORIGIN}/` : `${ORIGIN}${routePath}`;
    return [
      "  <url>",
      `    <loc>${loc}</loc>`,
      `    <lastmod>${TODAY}</lastmod>`,
      "    <changefreq>weekly</changefreq>",
      `    <priority>${priorityForRoute(routePath)}</priority>`,
      "  </url>",
    ].join("\n");
  }),
  "</urlset>",
  "",
].join("\n");

fs.writeFileSync(path.join(OUT_DIR, "sitemap.xml"), sitemapXml, "utf8");
fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), sitemapXml, "utf8");

console.log(
  `✅ [postbuild-seo] Generated sitemap.xml (${sortedRoutes.length} canonical routes), verified 404.html (noindex), IndexNow key, and HTML safety guard.`
);
