#!/usr/bin/env node
/**
 * @license MIT
 * ============================================================================
 * scripts/compile-lore-encyclopedia.mjs — RaggieSoft Lore Encyclopedia Compiler
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - LINE 1 (`#!/usr/bin/env node`): A Unix "shebang" line telling macOS/Linux
 *     to execute this file with Node.js whenever invoked directly.
 *   - WHAT THIS FILE IS: This is the automated build-time data pipeline ("compiler")
 *     for `https://lore.raggiesoft.com`. Instead of querying a live SQL database
 *     every time a reader clicks a character or band, this Node.js script reads
 *     all of RaggieSoft's canonical books, albums, corporate trees, and worldbuilding
 *     Markdown files across the monorepo, sanitizes them for everyday readers,
 *     connects every cross-reference, and writes one unified JSON file:
 *     `src/generated/encyclopedia.json`.
 *   - WHEN IT RUNS: Exclusively at **build time** (or before `next dev`) in Node.js!
 *     In `package.json`, `"prebuild": "node scripts/compile-lore-encyclopedia.mjs"`
 *     uses npm's automatic `"prebuild"` lifecycle hook—so running `npm run build`
 *     ALWAYS runs this script FIRST before Next.js renders a single HTML page.
 *   - WHAT DATA FEEDS INTO IT:
 *       1. Public Book Allowlist & Sitemaps: `subdomains/books/sitemaps/{books,chapters,parts}.xml`
 *       2. Paige Compiled Book Metadata & TOCs: `raggiesoft-assets/raggiesoft-books/books/<slug>/toc.json`
 *       3. Narrative Chapter Frontmatter (POV): `raggiesoft-narratives/books/<slug>/eXXX/cXXX/pXXX.md`
 *       4. Engine Room Records Catalog & Lore: `raggiesoft-assets/engine-room-records/catalog.json`
 *          + `subdomains/engineroom/src/data/artistLore.mjs`
 *       5. In-Universe Corporate Hierarchy: `raggiesoft-assets/engine-room-records/json/corporate-structure.json`
 *       6. Public Backstage Archival Dossiers: `raggiesoft-narratives/backstage/` (all `.md` files)
 *       7. Sanitized Worldbuilding Gazetteer: `raggiesoft-narratives/universal-lore/` (root & `locations/` `.md` files)
 *       8. Curated Character Vault Overrides: `subdomains/lore/vault/characters/` (`.md` files)
 *   - WHAT OUTPUT IT PRODUCES: `src/generated/encyclopedia.json`, which powers:
 *       1. All pre-rendered static Next.js 16 encyclopedia routes (`/characters/[slug]`,
 *          `/bands/[slug]`, `/books/[slug]`, `/places/[slug]`,
 *          `/organizations/[slug]`, and `/timeline`), and
 *       2. The accessible 2D Universe Constellation Graph (`<LoreGraph />`) on `/`.
 *
 * Safety, Spoiler, & Copyright Guarantees:
 *   1. Zero Crystal Balls / Spoiler Horizon: Every book and character entry
 *      anchors its visible top-of-page introduction strictly to Era 1 / debut
 *      context while placing full multi-era arcs inside collapsible `<details>`
 *      milestone disclosures.
 *   2. Consumer-Friendly Language: Zero engineering/compiler/file-format jargon.
 *   3. Automated Copyright, Landmark, Domain, & Trauma-Trigger Sanitizer +
 *      Hard Post-Compile Validator (`0` violations permitted).
 * ============================================================================
 */

// Node.js standard library modules (`fs` for reading/writing files, `path` for
// cross-platform folder paths, `url` for converting ES Module URLs <-> paths)
// plus `gray-matter` (a popular npm library that splits Markdown files into
// `{ data: <YAML frontmatter object>, content: <Markdown body string> }`).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import matter from "gray-matter";

// Compute absolute folder paths relative to this script's own location on disk
// so the script works identically no matter which working directory you run it from:
// - `__dirname`   -> `.../raggiesoft-servers/raggiesoft.com/subdomains/lore/scripts`
// - `LORE_ROOT`   -> `.../raggiesoft-servers/raggiesoft.com/subdomains/lore`
// - `SERVERS_ROOT`-> `.../raggiesoft-servers`
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LORE_ROOT = path.resolve(__dirname, "..");
const SERVERS_ROOT = path.resolve(LORE_ROOT, "../../..");

// Central dictionary of every input directory/file across `raggiesoft-servers/`
// and the single generated output file (`src/generated/encyclopedia.json`).
const PATHS = {
  booksSitemapsDir: path.join(SERVERS_ROOT, "raggiesoft.com/subdomains/books/sitemaps"),
  musicBuildDir: path.join(SERVERS_ROOT, "raggiesoft.com/subdomains/music/build"),
  backstageSitemap: path.join(SERVERS_ROOT, "raggiesoft.com/subdomains/backstage/dist/sitemap.xml"),
  artistLoreMjs: path.join(SERVERS_ROOT, "raggiesoft.com/subdomains/engineroom/src/data/artistLore.mjs"),
  booksAssetsDir: path.join(SERVERS_ROOT, "raggiesoft-assets/raggiesoft-books/books"),
  libraryStatsJson: path.join(SERVERS_ROOT, "raggiesoft-assets/raggiesoft-books/json/library-stats.json"),
  narrativesBooksDir: path.join(SERVERS_ROOT, "raggiesoft-narratives/books"),
  backstageNarrativesDir: path.join(SERVERS_ROOT, "raggiesoft-narratives/backstage"),
  universalLoreDir: path.join(SERVERS_ROOT, "raggiesoft-narratives/universal-lore"),
  errCatalogJson: path.join(SERVERS_ROOT, "raggiesoft-assets/engine-room-records/catalog.json"),
  corporateJson: path.join(SERVERS_ROOT, "raggiesoft-assets/engine-room-records/json/corporate-structure.json"),
  localVaultCharactersDir: path.join(LORE_ROOT, "vault/characters"),
  outputJson: path.join(LORE_ROOT, "src/generated/encyclopedia.json"),
};

// ============================================================================
// 1. Canonical Copyright, Landmark, Privacy, & Consumer Sanitizer
// ============================================================================

/**
 * Direct in-universe replacements applied across ingested lore prose so no
 * real-world brand, transit agency, Virginia Tech landmark, or legacy vessel
 * name leaks onto `lore.raggiesoft.com`.
 *
 * JavaScript Regular Expression (`RegExp`) Quick Primer:
 *   - `/pattern/gi` : `/` delimiters wrap a pattern; `g` = replace ALL matches
 *                     ("global"), `i` = ignore uppercase/lowercase ("case-insensitive").
 *   - `\b`          : "word boundary" so `\bSNES\b` matches the standalone word
 *                     `"SNES"` without accidentally matching letters inside another word.
 *   - `\s+`         : matches one or more spaces/tabs.
 *   - `(?:...)`     : groups alternatives together without capturing a numbered match.
 */
const CANONICAL_TEXT_REPLACEMENTS = [
  [/\bU\.S\.S\.\s*Aethelgard\b/gi, "USCSS Ad Astra"],
  [/\bUSS\s+Aethelgard\b/gi, "USCSS Ad Astra"],
  [/\bGreyhound\b/gi, "Pathfinder"],
  [/\bSuper\s+Famicom\s*\/\s*SNES\b/gi, "16-bit Super Kinoka"],
  [/\bSuper\s+Famicom\b/gi, "16-bit Super Kinoka"],
  [/\bSuper\s+Nintendo\b/gi, "Super Kinoka"],
  [/\bSNES\b/g, "Super Kinoka"],
  [/\bNintendo\b/gi, "Kinoka"],
  [/\bTrans-Siberian(?:-scale)?\b/gi, "arena-scale"],
  [/\bLimahl's\s+iconic\s+(?:1984\s+)?(?:NeverEnding\s+Story\s+theme\s+song|theme\s+song\s+to\s+The\s+NeverEnding\s+Story)\b/gi, "classic 1984 widescreen fantasy cinema synth-pop themes"],
  [/\bLimahl's\s+"NeverEnding\s+Story"\b/gi, "1980s Widescreen Fantasy Theme Songs"],
  [/\bLimahl-inspired\b/gi, "shimmering 1980s"],
  [/\bThe\s+NeverEnding\s+Story\b/gi, "classic 1980s fantasy cinema"],
  [/\bPolaroid\b/gi, "instant photograph"],
  [/\biPad\b/g, "MagnaPad"],
  [/\biPhone\b/g, "mPhone"],
  [/\bGoogle\b/gi, "OmniSearch"],
  [/\bTicketmaster\b/gi, "TicketSphere"],
  [/\bStubHub\b/gi, "SphereHub"],
  [/\bVirginia\s+Tech\b/gi, "Commonwealth Polytechnic Institute (CPI)"],
  [/\bDrillfield\b/gi, "Commonwealth Green"],
  [/\bTorgersen\s+Hall\b/gi, "Keystone Hall"],
  [/\bTorgersen\s+Bridge\b/gi, "The Keystone Bridge"],
  [/\bTorgersen\b/gi, "Keystone"],
  [/\bHokie\s+Stone\b/gi, "Ironstone"],
  [/\bHokie\s+Passport\b/gi, "Poly Pass"],
  [/\bHokies\b/gi, "Forgers"],
  [/\bBurruss\s+Hall\b/gi, "Preston Hall"],
  [/\bAlumni\s+Mall\b/gi, "Commonwealth Mall"],
  [/\bNewman\s+Library\b/gi, "Pendleton Library"],
  [/\bSquires(?:\s+Student\s+Center)?\b/gi, "Kincaid Hall"],
  [/\bLane\s+Stadium\b/gi, "The Crucible"],
  [/\bCassell\s+Coliseum\b/gi, "The Furnace"],
  [/\bOwens(?:\s+Food\s+Court|\s+Hall)?\b/gi, "Kincaid Commons"],
  [/\bDietrick(?:\s+Hall)?\b/gi, "The Foundry"],
  [/\bPrevost\b/gi, "Sainte-Claire"],
  [/\bNew\s+Flyer\b/gi, "Prairie Coachworks"],
  [/\bGillig\b/gi, "Stalwart"],
  [/\bAmtrak\b/gi, "American Rail Transit System (ARTS)"],
  [/\bThe\s+Episcopal\s+Church\b/gi, "The Diocesan Church"],
  [/\bEpiscopalians?\b/gi, "Diocesans"],
  [/\bEpiscopal\b/gi, "Diocesan"],
  [/\bAnglican\s+Communion\b/gi, "Albion Communion"],
  [/\bAnglican\b/gi, "Albion"],
  [/\bChurch\s+of\s+England\b/gi, "Church of Albion"],
  [/\b1091\s+Daniel\s+Maloney(?:\s+Dr(?:ive)?)?(?:,\s*Virginia\s+Beach,\s*VA\s*\d*)?/gi, "Virginia Beach, VA"],
  [/\b\d+\s+Progress\s+Street(?:\s+NE)?\b/gi, "Progress Street NE"],
];

/**
 * Lines inside `universal-lore/*.md` that exist strictly as internal author
 * notes (real-world comparisons, rule enforcement callouts, file paths) are
 * stripped automatically before consumer compilation.
 */
const INTERNAL_AUTHOR_LINE_PATTERNS = [
  /real[- ]world\s+(?:equivalent|location|counterpart|inspiration|baseline|brand)/i,
  /1:1\s+(?:equivalent|counterpart)/i,
  /in-universe\s+(?:equivalent|counterpart|stand-in)\s+(?:of|to|for)\s+(?:the\s+)?real/i,
  /fictional\s+amalgam\s+of/i,
  /roughly\s+the\s+geographical\s+equivalent\s+of/i,
  /canonical\s+lore\s+reference\s+for\s+narrative\s+writing/i,
  /critical\s+continuity\s+rule/i,
  /strict\s+(?:visual|separation)\s+rule/i,
  /never\s+(?:use|depict|mention|output|publish)/i,
  /\/Users\/michael/i,
  /raggiesoft-narratives\//i,
  /llms-[a-z-]+\.txt/i,
  /daniels-finegold/i,
  /\b(?:MBTA|WMATA|BART|SEPTA|Sound\s+Transit|King\s+County\s+Metro|Washington\s+State\s+Ferries|Kitsap\s+Transit|Hampton\s+Roads\s+Transit|Blacksburg\s+Transit|Woodrow\s+Wilson\s+Rehabilitation|Old\s+Dominion\s+University|University\s+of\s+Washington)\b/i,
  /\bouellette\b/i,
];

/**
 * Hard post-compile blocklist: if ANY of these patterns survive into the
 * compiled public JSON, the build aborts immediately with a diagnostic error.
 */
const HARD_BLOCKLIST_PATTERNS = [
  { label: "Trauma-trigger surname block", regex: /\bouellette\b/i },
  { label: "Real-world VT landmark (Drillfield)", regex: /\bdrillfield\b/i },
  { label: "Real-world VT landmark (Torgersen)", regex: /\btorgersen\b/i },
  { label: "Real-world VT term (Hokie)", regex: /\bhokies?\b/i },
  { label: "Real-world VT landmark (Burruss)", regex: /\bburruss\b/i },
  { label: "Real-world VT landmark (Squires)", regex: /\bsquires\s+student\b/i },
  { label: "Real-world VT landmark (Lane Stadium)", regex: /\blane\s+stadium\b/i },
  { label: "Real-world VT landmark (Cassell)", regex: /\bcassell\s+coliseum\b/i },
  { label: "Progress Street house number", regex: /\b\d+\s+progress\s+street\b/i },
  { label: "Famous band trademark", regex: /\b(?:van\s+halen|def\s+leppard|pink\s+floyd)\b/i },
  { label: "Famous gear/transit trademark", regex: /\b(?:stratocaster|telecaster|les\s+paul|minimoog|jupiter-8|juno-106|linndrum|prevost|new\s+flyer|gillig|polaroid|ticketmaster|stubhub)\b/i },
  { label: "Technical consumer-UI jargon", regex: /\b(?:HUMAN_VERIFIED|WebVTT|Inno\s+Setup|Zero-Database|Flat-File)\b/ },
];

// Allowlist of the 9 official domains owned directly by Michael P. Ragsdale.
// Storing them in a JavaScript `Set` makes `OWNED_DOMAINS.has(h)` an instant
// O(1) hash lookup rather than scanning an array every time a URL is checked.
const OWNED_DOMAINS = new Set([
  "aethelsaga.com",
  "engineroom-records.com",
  "fracturedprisms.com",
  "michaelpragsdale.com",
  "raggiesoft.com",
  "raggiesoftknox.com",
  "raggiesoftmedia.com",
  "stardustenginecms.com",
  "thestardustengine.com",
]);

/**
 * Checks whether a URL's hostname belongs to one of our 9 owned domains or any
 * `*.raggiesoft.com` subdomain (such as `books.raggiesoft.com` or `music.raggiesoft.com`).
 */
function isOwnedHost(hostname) {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  if (OWNED_DOMAINS.has(h)) return true;
  if (h.endsWith(".raggiesoft.com")) return true;
  return false;
}

/**
 * Cleans raw prose from books, catalogs, or lore files so it is 100% safe and
 * friendly for everyday readers:
 *   1. Expands `{{CDN}}` / `{{cms}}` template placeholders to `https://assets.raggiesoft.com`.
 *   2. Removes HTML comments (`<!-- ... -->`) and converts LaTeX arrows to clean Unicode (`→`, `↔`).
 *   3. Unwraps custom narrative XML tags (`<aac>`, `<sgn>`, `<asl>`, `<sms>`) into plain text
 *      (`$1` inserts the text captured inside `(.*?)`).
 *   4. Applies every `[pattern, replacement]` pair in `CANONICAL_TEXT_REPLACEMENTS`.
 *   5. Strips any unowned external URLs while keeping official RaggieSoft URLs intact.
 */
function sanitizeConsumerText(raw) {
  if (!raw) return "";
  let text = String(raw)
    .replace(/\{\{CDN\}\}/g, "https://assets.raggiesoft.com")
    .replace(/\{\{cms\}\}/g, "https://assets.raggiesoft.com")
    // Strip HTML comments and internal `[Note to the AI: ...]` annotations
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\\?\[Note to the AI:[\s\S]*?\\?\]/gi, "")
    // Convert LaTeX arrows / math tokens into clean Unicode for consumer prose
    .replace(/\\?\$\\rightarrow\\?\$/g, "→")
    .replace(/\\?\$\\leftarrow\\?\$/g, "←")
    .replace(/\\?\$\\leftrightarrow\\?\$/g, "↔")
    .replace(/\\?\$\\updownarrow\\?\$/g, "↕")
    .replace(/\\?\$\\uparrow\\?\$/g, "↑")
    .replace(/\\?\$\\downarrow\\?\$/g, "↓")
    .replace(/\\?\$\\to\\?\$/g, "→")
    .replace(/\\rightarrow\b/g, "→")
    .replace(/\\leftarrow\b/g, "←")
    .replace(/\\leftrightarrow\b/g, "↔")
    .replace(/\\updownarrow\b/g, "↕")
    .replace(/\\uparrow\b/g, "↑")
    .replace(/\\downarrow\b/g, "↓")
    // Unescape CommonMark ASCII punctuation escapes (`\$` -> `$`, `\#` -> `#`, `\'` -> `'`, `\"` -> `"`, `\&` -> `&`, etc.)
    .replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, "$1")
    // Convert custom narrative tags
    .replace(/<aac>(.*?)<\/aac>/gi, "$1")
    .replace(/<sgn>(.*?)<\/sgn>/gi, "$1")
    .replace(/<asl>(.*?)<\/asl>/gi, "$1")
    .replace(/<sms>(.*?)<\/sms>/gi, "$1");

  for (const [pattern, replacement] of CANONICAL_TEXT_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  // Strip unowned bare URLs/domains in prose while keeping owned RaggieSoft URLs
  text = text.replace(/https?:\/\/([a-z0-9.-]+)(\/[^\s)"'>]*)?/gi, (full, host) => {
    return isOwnedHost(host) ? full : "";
  });

  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Parses a raw `universal-lore/*.md` worldbuilding file with `gray-matter` and
 * filters out internal writer-room notes line by line:
 *   - Uses a boolean toggle (`inCodeFence = !inCodeFence`) as a tiny state machine
 *     to skip fenced code blocks (` ``` ... ``` `).
 *   - Skips comparison table rows and lines matching `INTERNAL_AUTHOR_LINE_PATTERNS`.
 *   - Removes inline backticks (`` `term` `` -> `term`) so prose reads like an encyclopedia.
 */
function sanitizeUniversalLoreMarkdown(rawMd) {
  const { data, content } = matter(rawMd);
  const lines = content.split(/\r?\n/);
  const kept = [];
  let inCodeFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    // Skip markdown table rows that compare Real-World vs In-Universe
    if (/^\s*\|/.test(line) && /real[- ]world|virginia\s+tech|hokie|mbta|wmata|bart|wsf|old\s+name/i.test(line)) {
      continue;
    }
    if (INTERNAL_AUTHOR_LINE_PATTERNS.some((re) => re.test(line))) {
      continue;
    }
    // Strip inline parentheticals that reference real-world equivalents
    const cleanedLine = line
      .replace(/\((?:[^()]*?(?:real[- ]world|in-universe\s+counterpart|equivalent\s+of|amalgam\s+of)[^()]*?)\)/gi, "")
      .replace(/`([^`]+)`/g, "$1");
    kept.push(cleanedLine);
  }

  const sanitizedBody = sanitizeConsumerText(kept.join("\n"));
  return { frontmatter: data || {}, body: sanitizedBody };
}

/**
 * Converts a display title like `"Engine Room Records, LLC"` into a clean,
 * lowercase URL slug like `"engine-room-records-llc"`.
 */
function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Removes Markdown syntax (`#` headings, `**bold**`, `*italics*`, `[label](url)`
 * links, and list bullets) to produce plain text suitable for `<meta name="description">`
 * and directory preview cards.
 */
function stripMarkdownFormatting(md) {
  return sanitizeConsumerText(md)
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*>]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Shortens `str` to at most `maxLen` characters on a clean word boundary
 * (`lastIndexOf(" ")`) and appends an ellipsis (`…`) if truncated.
 */
function truncateClean(str, maxLen = 152) {
  const clean = stripMarkdownFormatting(str);
  if (clean.length <= maxLen) return clean;
  const sliced = clean.slice(0, maxLen - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  return (lastSpace > 60 ? sliced.slice(0, lastSpace) : sliced).replace(/[.,;:—-]+$/, "") + "…";
}

/**
 * Reads an XML sitemap file (like `books.xml`) and extracts every `<loc>...</loc>`
 * URL into a deduplicated `Set` using `String.prototype.matchAll()`.
 */
function extractXmlLocs(xmlPath) {
  if (!fs.existsSync(xmlPath)) return new Set();
  const xml = fs.readFileSync(xmlPath, "utf8");
  return new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
}

/**
 * Ensures every cover/social image URL is an absolute `https://assets.raggiesoft.com/...`
 * URL (falling back to our default OpenGraph card if missing).
 */
function normalizeAssetUrl(rawUrl) {
  if (!rawUrl) return "https://assets.raggiesoft.com/raggiesoft-lore/images/og/default-og.jpg";
  const cleaned = String(rawUrl).replace(/\{\{CDN\}\}/g, "https://assets.raggiesoft.com");
  if (cleaned.startsWith("https://")) return cleaned;
  if (cleaned.startsWith("/")) return `https://assets.raggiesoft.com${cleaned}`;
  return cleaned;
}

// ============================================================================
// 2. Load Canonical Sitemap Allowlists (Zero Broken Cross-Site Links!)
// ============================================================================
// By loading the actual published XML sitemaps from `books.raggiesoft.com` and
// `backstage.raggiesoft.com` into `Set`s, we guarantee that `lore.raggiesoft.com`
// ONLY links to public, live pages—never to unpublished drafts or broken 404 URLs!

const validBookUrls = new Set([
  ...extractXmlLocs(path.join(PATHS.booksSitemapsDir, "books.xml")),
  ...extractXmlLocs(path.join(PATHS.booksSitemapsDir, "chapters.xml")),
  ...extractXmlLocs(path.join(PATHS.booksSitemapsDir, "parts.xml")),
  ...extractXmlLocs(path.join(PATHS.booksSitemapsDir, "editorial.xml")),
]);

const validBackstageUrls = extractXmlLocs(PATHS.backstageSitemap);

// Extract the sorted list of all 30 public book series slugs (e.g., `"ad-astra"`, `"katie"`).
const publicBookSlugs = [...extractXmlLocs(path.join(PATHS.booksSitemapsDir, "books.xml"))]
  .map((u) => {
    const m = u.match(/^https:\/\/books\.raggiesoft\.com\/([a-z0-9-]+)$/);
    return m ? m[1] : null;
  })
  .filter(Boolean)
  .sort();

/**
 * Normalizes a relative or legacy book path into a verified `https://books.raggiesoft.com/...`
 * URL, checking `validBookUrls.has(candidate)` and gracefully falling back if needed.
 */
function toCanonicalBookUrl(rawPath, fallbackBookSlug) {
  if (!rawPath) return `https://books.raggiesoft.com/${fallbackBookSlug}`;
  const clean = String(rawPath)
    .replace(/^https:\/\/books\.raggiesoft\.com/, "")
    .replace(/^\/raggiesoft-books\/books/, "")
    .replace(/\/+$/, "");
  const candidate = `https://books.raggiesoft.com${clean.startsWith("/") ? clean : "/" + clean}`;
  if (validBookUrls.has(candidate)) return candidate;
  const fallback = `https://books.raggiesoft.com/${fallbackBookSlug}`;
  return validBookUrls.has(fallback) ? fallback : "https://books.raggiesoft.com";
}

// ============================================================================
// 3. Compile All 8 Bands & 40 Albums (`/bands/[slug]`)
// ============================================================================

// Top-level `await import(...)` dynamically loads the ES Module `artistLore.mjs`
// from our sibling `engineroom` subdomain (`pathToFileURL` turns a disk path into `file:///...`).
const { ARTIST_LORE_PROFILES } = await import(pathToFileURL(PATHS.artistLoreMjs).href);
const rawCatalog = JSON.parse(fs.readFileSync(PATHS.errCatalogJson, "utf8"));

// Group all 40 catalog albums by `artistSlug` inside a JavaScript `Map`
// (`artistSlug` -> Array of sanitized album summary objects).
const albumsByArtist = new Map();
for (const album of rawCatalog) {
  if (!album.artistSlug) continue;
  if (!albumsByArtist.has(album.artistSlug)) albumsByArtist.set(album.artistSlug, []);
  albumsByArtist.get(album.artistSlug).push({
    slug: album.slug,
    title: sanitizeConsumerText(album.title),
    subtitle: sanitizeConsumerText(album.subtitle || ""),
    releaseDate: album.releaseDate || "",
    year: (album.releaseDate || album.slug || "").slice(0, 4),
    genre: sanitizeConsumerText(album.genre || ""),
    trackCount: Array.isArray(album.tracks) ? album.tracks.length : (album.trackCount || 0),
    coverUrl: normalizeAssetUrl(album.coverArt || album.cover || album.artistSocialPreview),
    listeningRoomUrl: `https://music.raggiesoft.com/${album.artistSlug}/${album.slug}`,
  });
}

const BAND_BOOK_SLUG_MAP = {
  "the-stardust-engine": ["stardust-engine", "ad-astra", "erin"],
  "fractured-prisms": ["fractured-prisms"],
  "the-paper-wall": ["luna-leo"],
  "the-arctic-symphony-project": ["julian"],
  "crimson-node": ["crimson-node"],
  "mana-canvas": ["runebreaker"],
  "firelight": ["aethel"],
  "the-hoshizora-ensemble": ["aubrie", "stardust-engine"],
};

const BAND_PLACE_SLUGS = {
  "the-stardust-engine": ["commonwealth-polytechnic-institute", "blacksburg-soundstage", "uscss-ad-astra-and-caelum-iv"],
  "fractured-prisms": ["colonial-theatre-hagerstown"],
  "the-paper-wall": ["commonwealth-polytechnic-institute", "puget-sound-transit-taps"],
  "the-arctic-symphony-project": ["coastal-virginia-transit-cvta"],
  "crimson-node": ["northwood-high-school"],
  "mana-canvas": ["commonwealth-polytechnic-institute"],
  "firelight": [],
  "the-hoshizora-ensemble": ["commonwealth-polytechnic-institute"],
};

// Transform `ARTIST_LORE_PROFILES` (an object keyed by artist slug) into our
// clean `bands` array using `Object.values(...)` + `.map(...)`, attaching each
// band's chronologically sorted albums and verified companion book/place slugs.
const bands = Object.values(ARTIST_LORE_PROFILES).map((p) => {
  const albums = (albumsByArtist.get(p.slug) || []).sort((a, b) =>
    String(a.year).localeCompare(String(b.year))
  );
  const relatedBookSlugs = (BAND_BOOK_SLUG_MAP[p.slug] || []).filter((s) =>
    publicBookSlugs.includes(s)
  );
  return {
    slug: p.slug,
    errId: p.errId,
    name: sanitizeConsumerText(p.name),
    tagline: sanitizeConsumerText(p.tagline),
    origin: sanitizeConsumerText(p.origin),
    yearsActive: sanitizeConsumerText(p.yearsActive),
    primaryGenre: sanitizeConsumerText(p.primaryGenre),
    summary: sanitizeConsumerText(p.summary),
    shortDescription: truncateClean(p.summary, 150),
    musicalStyle: sanitizeConsumerText(p.whatKindOfMusic),
    listeningRoomUrl: p.listeningRoomUrl,
    imprintUrl: p.dedicatedSiteUrl,
    bookReaderUrl: p.bookReaderUrl ? toCanonicalBookUrl(p.bookReaderUrl, relatedBookSlugs[0] || "") : null,
    image: normalizeAssetUrl(p.ogImage || p.heroImage),
    members: (p.members || []).map((m) => ({
      name: sanitizeConsumerText(m.name),
      role: sanitizeConsumerText(m.role),
      notes: sanitizeConsumerText(m.notes),
    })),
    lorePillars: (p.lorePillars || []).map((lp) => ({
      title: sanitizeConsumerText(lp.title),
      body: sanitizeConsumerText(lp.body),
    })),
    albums,
    relatedBookSlugs,
    relatedPlaceSlugs: BAND_PLACE_SLUGS[p.slug] || [],
  };
});

// ============================================================================
// 4. Compile All 30 Public Book Series (`/books/[slug]`) + Scan Chapter POVs
// ============================================================================

const books = [];
// Lookup map indexing every chapter Part by `${bookSlug}::${povCharacterLower}`
// so Character pages (`/characters/[slug]`) can automatically list every Part
// narrated from that protagonist's Point of View (`pov:` YAML frontmatter)!
const partAppearancesByBookAndPov = new Map(); // key: `${bookSlug}::${povLower}` -> array of part refs
const backstageByBook = new Map();

/**
 * Recursively walks a folder (`dir`) and returns the full path of every `.md` file.
 */
function walkMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkMarkdownFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) results.push(full);
  }
  return results;
}

// Pre-scan public Backstage dossiers (`raggiesoft-narratives/backstage/books/<slug>/*.md`),
// verifying each URL against `validBackstageUrls` so Book pages link straight to them.
for (const bsFile of walkMarkdownFiles(PATHS.backstageNarrativesDir)) {
  const rel = path.relative(PATHS.backstageNarrativesDir, bsFile).replace(/\\/g, "/");
  const routePath = rel.endsWith("/index.md")
    ? "/" + rel.slice(0, -"/index.md".length)
    : "/" + rel.slice(0, -".md".length);
  const fullUrl = `https://backstage.raggiesoft.com${routePath}`;
  if (!validBackstageUrls.has(fullUrl)) continue;
  const parsed = matter(fs.readFileSync(bsFile, "utf8"));
  const m = rel.match(/^books\/([a-z0-9-]+)\//);
  if (m && !rel.endsWith("/index.md")) {
    const bSlug = m[1];
    if (!backstageByBook.has(bSlug)) backstageByBook.set(bSlug, []);
    backstageByBook.get(bSlug).push({
      title: sanitizeConsumerText(parsed.data.title || path.basename(bsFile, ".md")),
      subtitle: sanitizeConsumerText(parsed.data.subtitle || ""),
      date: sanitizeConsumerText(parsed.data.date || ""),
      url: fullUrl,
    });
  }
}

// Iterate through every public book series and walk its 3-level hierarchy:
// Series (`toc.json`) -> Eras (`e001`, `e002`...) -> Chapters (`c001`...) -> Parts (`p001.md`...).
for (const bookSlug of publicBookSlugs) {
  const tocPath = path.join(PATHS.booksAssetsDir, bookSlug, "toc.json");
  if (!fs.existsSync(tocPath)) continue;
  const toc = JSON.parse(fs.readFileSync(tocPath, "utf8"));

  const eras = [];
  const allLocations = new Set();
  const allDates = [];
  let firstPart = null;

  for (const era of toc.eras || []) {
    const chapters = [];
    const eraLocations = new Set();
    const eraDates = [];

    for (const chap of era.chapters || []) {
      const parts = [];
      for (const part of chap.parts || []) {
        const partUrl = toCanonicalBookUrl(part.url, bookSlug);
        const loc = sanitizeConsumerText(part.location || "");
        if (loc) {
          allLocations.add(loc);
          eraLocations.add(loc);
        }
        if (part.date && /^\d{4}/.test(part.date)) {
          allDates.push(part.date);
          eraDates.push(part.date);
        }

        // Read `pov:` from the narrative markdown frontmatter if present.
        // Performance trick: `.slice(0, 700)` inspects only the top 700 characters
        // (the YAML frontmatter header) instead of parsing thousands of words of prose!
        let pov = "";
        if (part.file_path) {
          const mdPath = path.join(PATHS.narrativesBooksDir, bookSlug, part.file_path);
          if (fs.existsSync(mdPath)) {
            const head = fs.readFileSync(mdPath, "utf8").slice(0, 700);
            const pm = head.match(/^pov:\s*["']?([^"'\r\n]+)["']?/m);
            if (pm) pov = pm[1].trim();
          }
        }

        const partRecord = {
          partNum: part.part_num,
          title: sanitizeConsumerText(part.part_title),
          url: partUrl,
          date: sanitizeConsumerText(part.date || ""),
          location: loc,
          excerpt: sanitizeConsumerText(part.excerpt || ""),
          readingMinutes: part.reading_minutes || 1,
          image: part.image ? normalizeAssetUrl(part.image) : null,
          imageAlt: sanitizeConsumerText(part.image_alt || ""),
          eraNum: era.era_num,
          eraTitle: sanitizeConsumerText(era.era_title),
          chapNum: chap.chap_num,
          chapTitle: sanitizeConsumerText(chap.chap_title),
        };
        if (!firstPart) firstPart = partRecord;
        parts.push(partRecord);

        if (pov) {
          for (const token of pov.split(/[,&]/).map((s) => s.trim()).filter(Boolean)) {
            const key = `${bookSlug}::${token.toLowerCase()}`;
            if (!partAppearancesByBookAndPov.has(key)) {
              partAppearancesByBookAndPov.set(key, []);
            }
            partAppearancesByBookAndPov.get(key).push(partRecord);
          }
        }
      }

      chapters.push({
        chapNum: chap.chap_num,
        title: sanitizeConsumerText(chap.chap_title),
        url: toCanonicalBookUrl(chap.chap_url, bookSlug),
        partCount: parts.length,
        parts,
      });
    }

    const sortedEraDates = [...eraDates].sort();
    eras.push({
      eraNum: era.era_num,
      title: sanitizeConsumerText(era.era_title),
      url: toCanonicalBookUrl(era.era_url, bookSlug),
      wordCount: era.word_count || 0,
      illustrationCount: era.illustration_count || 0,
      dateSpan:
        sortedEraDates.length > 0
          ? sortedEraDates[0] === sortedEraDates[sortedEraDates.length - 1]
            ? sortedEraDates[0]
            : `${sortedEraDates[0]} to ${sortedEraDates[sortedEraDates.length - 1]}`
          : "",
      locations: [...eraLocations].slice(0, 5),
      chapters,
    });
  }

  const sortedDates = [...allDates].sort();
  const ws = toc.word_stats || {};
  const relatedBands = bands
    .filter((b) => b.relatedBookSlugs.includes(bookSlug))
    .map((b) => ({ slug: b.slug, name: b.name, listeningRoomUrl: b.listeningRoomUrl }));

  // Spoiler-free Debut Premise: strictly anchored to Era 1 / Chapter 1 / Part 1
  const debutIntro =
    firstPart && firstPart.excerpt
      ? firstPart.excerpt
      : sanitizeConsumerText(toc.series_short_description || "");

  const debutSettingNote = firstPart
    ? [
        firstPart.eraTitle ? `Opens in ${firstPart.eraTitle}` : "",
        firstPart.date ? `(${firstPart.date})` : "",
        firstPart.location ? `in ${firstPart.location}` : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  books.push({
    slug: bookSlug,
    title: sanitizeConsumerText(toc.series_title || bookSlug),
    coverImage: normalizeAssetUrl(toc.series_image),
    heroImage: firstPart?.image || normalizeAssetUrl(toc.series_image),
    heroImageAlt: firstPart?.imageAlt || `${sanitizeConsumerText(toc.series_title)} cover artwork`,
    debutIntro,
    debutSettingNote,
    shortDescription: truncateClean(debutIntro || toc.series_short_description, 150),
    // Full series synopsis is tucked inside the collapsible Spoiler Horizon section!
    fullSeriesSynopsis: sanitizeConsumerText(toc.series_description || toc.series_short_description || ""),
    bookReaderUrl: `https://books.raggiesoft.com/${bookSlug}`,
    tocUrl: `https://books.raggiesoft.com/${bookSlug}/toc`,
    firstChapterUrl: firstPart?.url || `https://books.raggiesoft.com/${bookSlug}`,
    stats: {
      scaleLabel: sanitizeConsumerText(ws.scale_badge || "Novel Series"),
      readingHours: ws.reading_hours || 1,
      storyPages: ws.story_page_count || 0,
      eraCount: eras.length,
      chapterCount: ws.chapter_count || 0,
      partCount: ws.part_count || 0,
      illustrationCount: ws.illustration_count || toc.illustration_count || 0,
    },
    dateSpan:
      sortedDates.length > 0
        ? `${sortedDates[0].slice(0, 4)}–${sortedDates[sortedDates.length - 1].slice(0, 4)}`
        : "",
    debutDate: sortedDates[0] || "",
    primaryLocations: [...allLocations].slice(0, 8),
    relatedBands,
    backstageDossiers: backstageByBook.get(bookSlug) || [],
    eras,
  });
}

// ============================================================================
// 5. Compile Places, Campuses, Starships, & Transit Networks (`/places/[slug]`)
// ============================================================================

const CURATED_PLACES_SPEC = [
  {
    slug: "commonwealth-polytechnic-institute",
    name: "Commonwealth Polytechnic Institute (CPI)",
    kind: "University Campus",
    region: "Blacksburg, Virginia",
    debutNote: "Central Virginia polytechnic university in Blacksburg clad in signature gray-and-buff Ironstone around Commonwealth Green.",
    sourceFiles: ["cpi-campus-landmarks.md", "../backstage/locations/cpi.md"],
    relatedBookSlugs: ["stardust-engine", "aubrie", "paige", "erin", "luna-leo", "rachel"],
    relatedBandSlugs: ["the-stardust-engine", "the-paper-wall", "mana-canvas"],
    backstageUrl: "https://backstage.raggiesoft.com/locations/cpi",
  },
  {
    slug: "blue-ridge-transit",
    name: "Blue Ridge Transit (BRT)",
    kind: "Public Transit Agency",
    region: "Blacksburg & Christiansburg, Virginia",
    debutNote: "High-frequency municipal and campus bus network linking Commonwealth Polytechnic Institute, Progress Street NE, and Christiansburg.",
    sourceFiles: ["cpi-blacksburg-and-blue-ridge-transit.md"],
    relatedBookSlugs: ["stardust-engine", "aubrie", "paige", "erin"],
    relatedBandSlugs: ["the-stardust-engine"],
  },
  {
    slug: "christiansburg-transit-center-falling-branch",
    name: "Christiansburg Transit Center at Falling Branch",
    kind: "Regional Transit Hub",
    region: "Christiansburg, Virginia",
    debutNote: "Intermodal New River Valley bus transfer hub connecting Blue Ridge Transit's Two Town Trolley with regional commuter corridors.",
    sourceFiles: ["cpi-falling-branch.md"],
    relatedBookSlugs: ["aubrie", "paige", "erin"],
    relatedBandSlugs: [],
  },
  {
    slug: "coastal-virginia-transit-cvta",
    name: "Coastal Virginia Transit Authority (CVTA)",
    kind: "Public Transit Agency",
    region: "Virginia Beach, Norfolk, Chesapeake, Newport News & Hampton, VA",
    debutNote: "Bi-regional Hampton Roads public transit network formed in October 1999, operating Southside and Peninsula bus routes across the Harbor.",
    sourceFiles: ["cvta.md"],
    relatedBookSlugs: ["katie", "rachel", "luna-leo", "julian"],
    relatedBandSlugs: ["the-arctic-symphony-project"],
  },
  {
    slug: "hampton-roads-regional-malls",
    name: "Emerald Creek Mall & Chesapeake Bay Mall",
    kind: "Regional Landmarks",
    region: "Chesapeake & Norfolk, Virginia",
    debutNote: "Twin 1981 Tidewater shopping centers serving as key CVTA bus transfer hubs and teen gathering landmarks across Southside Hampton Roads.",
    sourceFiles: ["hampton-roads-1981-malls-emerald-creek-and-chesapeake-bay.md"],
    relatedBookSlugs: ["rachel", "katie"],
    relatedBandSlugs: [],
  },
  {
    slug: "fairlawn-recreation-center",
    name: "Fairlawn Recreation Center",
    kind: "Community Landmark",
    region: "Virginia Beach, Virginia",
    debutNote: "Beloved neighborhood recreation center, pool, and accessible community sanctuary off Princess Anne Road in Virginia Beach.",
    sourceFiles: ["locations/fairlawn-recreation-center.md"],
    relatedBookSlugs: ["jack-sarah", "rachel", "katie"],
    relatedBandSlugs: [],
  },
  {
    slug: "801-greenway-court",
    name: "801 Greenway Court",
    kind: "Residential Sanctuary",
    region: "Norfolk, Virginia",
    debutNote: "Historic Norfolk neighborhood anchor and family gathering address in Hampton Roads.",
    sourceFiles: ["locations/801-greenway-court.md"],
    relatedBookSlugs: ["katie", "rachel"],
    relatedBandSlugs: [],
  },
  {
    slug: "northwood-high-school",
    name: "Northwood High School",
    kind: "Secondary School Campus",
    region: "Virginia",
    debutNote: "Public high school campus anchoring key teen, music, and neurodivergent advocacy arcs.",
    sourceFiles: ["locations/northwood-high-school-lore-bible.md"],
    relatedBookSlugs: ["crimson-node", "alex-chloe"],
    relatedBandSlugs: ["crimson-node"],
  },
  {
    slug: "uscss-ad-astra-and-caelum-iv",
    name: "USCSS Ad Astra & Caelum-IV",
    kind: "Deep-Space Vessel & Sanctuary Moon",
    region: "Vespera System (Kepler-442c • Stardate 49601)",
    debutNote: "In-universe deep-space exploration vessel (0.88G deck plating and zero-G central shaft) and the purple-ocean sanctuary moon Caelum-IV pulsing at 120 BPM.",
    sourceFiles: [],
    synthesizedBody:
      "In the cosmic storyline of Escape Velocity: Ad Astra, the five-person crew of The Stardust Engine voyages aboard the deep-space vessel USCSS Ad Astra—engineered with 0.88G artificial-gravity deck plating, stepless corridors, and a zero-gravity central transit shaft—to Caelum-IV (Stardate 49601).\n\nOrbiting the ringed gas giant Vespera in a 48-hour tidal lock, Caelum-IV is a warm, bioluminescent sanctuary moon of basaltic shores, purple seas, singing lava tubes, and acoustic forests whose living biosphere resonates at 120.0 beats per minute. Explore the interactive planetary survey at https://nebulae.raggiesoft.com and read the full expedition in Escape Velocity: Ad Astra at https://books.raggiesoft.com/ad-astra.",
    relatedBookSlugs: ["ad-astra", "stardust-engine"],
    relatedBandSlugs: ["the-stardust-engine"],
  },
  {
    slug: "blacksburg-soundstage",
    name: "The Blacksburg Soundstage & Progress Street NE Sanctuary",
    kind: "Recording Studio & Production Complex",
    region: "Blacksburg, Virginia",
    debutNote: "Home base of The Stardust Engine in Blacksburg—encompassing Aunt Martha's farmhouse on Progress Street NE and the private warehouse soundstage.",
    sourceFiles: [],
    synthesizedBody:
      "From August 1985 onward, siblings Ryan, Cassidy, and Holly O'Connell and identical twin cousins Evan and Tyler Wright made their lifelong home together at Aunt Martha's farmhouse on Progress Street NE in Blacksburg, Virginia—never living in campus dormitories.\n\nFollowing the 1994 emancipation of their master recordings and the founding of Engine Room Records, LLC in-universe, the family established the private Blacksburg Soundstage warehouse complex. Inside its 1G industrial bay—outfitted with scissor-lifts, steel rigging cables, custom stepless wheelchair ramps, and zero-threshold control rooms—The Stardust Engine produced their 1996 short film Escape Velocity (Ad Astra) and recorded their post-emancipation catalog on their own schedule (strictly after Ryan's 10:00 AM daily floor).",
    relatedBookSlugs: ["stardust-engine", "ad-astra"],
    relatedBandSlugs: ["the-stardust-engine"],
  },
  {
    slug: "colonial-theatre-hagerstown",
    name: "The 1914 Colonial Theatre & Williamsport Sanctuary",
    kind: "Historic Theatre & Studio Fortress",
    region: "Hagerstown & Williamsport, Maryland",
    debutNote: "Restored 1914 Downtown Hagerstown theatre and nearby Williamsport ranch studio where Claire and Rhys Manning built Fractured Prisms.",
    sourceFiles: [],
    synthesizedBody:
      "After relocating from Romford, East London to their father's 1960s ranch house in Williamsport, Maryland—served by the Route 441 County Commuter bus—siblings Claire and Rhys Manning recorded Carnaby Street (1983) and 1883 (1984) inside their private 'Fragile Fortress.'\n\nIn 1984, Claire and Rhys purchased Downtown Hagerstown's historic 1914 Colonial Theatre to save it from demolition, reopening it in late 1987 with a stepless sloped auditorium floor, a disguised 1914 mahogany hydraulic elevator, a dry British tea-and-biscuits refreshment room, and a soundproofed subterranean apartment beneath the stage.",
    relatedBookSlugs: ["fractured-prisms"],
    relatedBandSlugs: ["fractured-prisms"],
  },
  {
    slug: "virginia-dominion-university",
    name: "Virginia Dominion University (VDU)",
    kind: "University Campus",
    region: "Norfolk, Virginia",
    debutNote: "Urban Tidewater public university along Hampton Boulevard featuring Dominion Mall, Monarch Commons, and the VDU Fieldhouse.",
    sourceFiles: [],
    synthesizedBody:
      "Located along Hampton Boulevard in Norfolk, Virginia, Virginia Dominion University (home of the Admirals) is an urban mid-century and contemporary campus anchored by wide concrete pedestrian plazas along Dominion Mall, crape myrtles and live oaks, Monarch Commons, the University Library, the VDU Fieldhouse and indoor Natatorium, and the upperclass apartments of Dominion Village (including Harbor House).\n\nAcross Ocean View Archives narratives, VDU hosts childhood summer camps in Katie & Nathaniel as well as undergraduate campus life and statewide student housing delegations in The Rachel Narrative.",
    relatedBookSlugs: ["rachel", "katie"],
    relatedBandSlugs: [],
  },
  {
    slug: "roosevelt-rehabilitation-center",
    name: "Roosevelt Rehabilitation Center (RRC)",
    kind: "Vocational & Medical Campus",
    region: "Fishersville, Virginia (Shenandoah Valley)",
    debutNote: "Wheelchair-accessible residential vocational rehabilitation campus along US-250 between Staunton and Waynesboro, served by Shenandoah Valley Transit.",
    sourceFiles: [],
    synthesizedBody:
      "Situated at 243 Roosevelt Avenue in Fishersville, Virginia in the Shenandoah Valley, Roosevelt Rehabilitation Center (RRC) is a fully wheelchair-accessible residential vocational training and medical rehabilitation campus connected to Staunton and Waynesboro via the Shenandoah Valley Transit (SVT) Route 250 Connector.\n\nKey campus buildings include the Bates-Harding Administration Building, Redmond Hall, Barton Hall, and Cantor Hall, serving as a pivotal setting across Katie & Nathaniel, Nichole, and Paige.",
    relatedBookSlugs: ["katie", "nichole", "paige"],
    relatedBandSlugs: [],
  },
  {
    slug: "braxton-and-ocean-state-transit",
    name: "Braxton, RI & Ocean State Transit Authority (OSTA)",
    kind: "Coastal Metropolis & Transit Grid",
    region: "Braxton, Providence & Newport, Rhode Island",
    debutNote: "Northeastern coastal metropolis and statewide blue-and-white bus network bridging Braxton, Providence, and Newport.",
    sourceFiles: ["braxton-osta-transit.md", "braxton-ri-raw.md"],
    relatedBookSlugs: ["katie", "quantum-directive-3-casey", "meredith"],
    relatedBandSlugs: [],
  },
  {
    slug: "meridian-washington-and-sterling-plaza",
    name: "Meridian, Washington & Sterling Plaza",
    kind: "Pacific Northwest City & Skyscraper",
    region: "Skagit County, Washington",
    debutNote: "Pacific Northwest urban hub anchored by the 135-story Sterling Plaza tower.",
    sourceFiles: ["meridian-wa.md", "sterling-plaza.md"],
    relatedBookSlugs: ["quantum-directive-1-jessica", "quantum-directive-2-kelly", "quantum-directive-3-casey", "meredith"],
    relatedBandSlugs: [],
  },
  {
    slug: "puget-sound-transit-taps",
    name: "Transit Authority of the Puget Sound (TAPS) & Evergreen Marine",
    kind: "Regional Transit & Ferry Network",
    region: "Seattle, Tacoma & Puget Sound, Washington",
    debutNote: "Unified Puget Sound bus, rail, and passenger ferry network connecting Seattle, Redmond, Tacoma, and Kitsap County.",
    sourceFiles: ["taps.md", "evergreen-marine.md", "kcta.md"],
    relatedBookSlugs: ["luna-leo", "quantum-directive-1-jessica", "quantum-directive-2-kelly", "quantum-directive-3-casey"],
    relatedBandSlugs: ["the-paper-wall"],
  },
  {
    slug: "capital-transit-washington-dmv",
    name: "Capital Transit (Washington, D.C., Maryland & Northern Virginia)",
    kind: "Metropolitan Rail & Bus Network",
    region: "Washington, D.C., Maryland & Northern Virginia",
    debutNote: "Accessible subway and regional bus system serving Capitol Hill, Northern Virginia, and suburban Maryland.",
    sourceFiles: ["washington-dc-dmv-transit.md"],
    relatedBookSlugs: ["katie", "rachel"],
    relatedBandSlugs: [],
  },
  {
    slug: "san-francisco-baypass-network",
    name: "San Francisco & The BayPass Transit Network",
    kind: "Coastal City & Regional Transit",
    region: "San Francisco Bay Area, California",
    debutNote: "Fog-swept Bay Area waterfront and unified regional rail, cable car, and ferry card network.",
    sourceFiles: ["san-francisco.md", "san-francisco-bay-area-transit.md"],
    relatedBookSlugs: ["luna-leo", "rachel"],
    relatedBandSlugs: [],
  },
  {
    slug: "pathfinder-cross-country-corridor",
    name: "The Pathfinder Cross-Country Coach Network",
    kind: "Intercity Motorcoach Corridor",
    region: "Norfolk, Virginia to Seattle, Washington",
    debutNote: "Coast-to-coast intercity bus corridor linking Tidewater Virginia, Baltimore, Chicago, and the Pacific Northwest.",
    sourceFiles: ["pathfinder-norfolk-to-seattle-route.md", "chicago-transit.md"],
    relatedBookSlugs: ["luna-leo", "katie", "ashley-tower"],
    relatedBandSlugs: ["the-paper-wall"],
  },
  {
    slug: "highcliff-and-coolidge-hill-estates",
    name: "Highcliff Mansion & The Coolidge Hill Estate",
    kind: "Historic New England Estates",
    region: "Newport, Rhode Island & West Cambridge, Massachusetts",
    debutNote: "Gilded Age coastal Bellevue Avenue estate in Newport and historic residential sanctuary in West Cambridge.",
    sourceFiles: ["highcliff-mansion.md", "coolidge-hill-estate.md"],
    relatedBookSlugs: ["quantum-directive-3-casey", "meredith"],
    relatedBandSlugs: [],
  },
];

// Materialize each `PlaceEntry` by combining optional hand-written `synthesizedBody`
// prose with sanitized Markdown bodies read from `raggiesoft-narratives/universal-lore/`.
const places = CURATED_PLACES_SPEC.map((spec) => {
  const chunks = [];
  if (spec.synthesizedBody) chunks.push(spec.synthesizedBody);
  for (const relFile of spec.sourceFiles) {
    const abs = path.resolve(PATHS.universalLoreDir, relFile);
    if (fs.existsSync(abs)) {
      const { body } = sanitizeUniversalLoreMarkdown(fs.readFileSync(abs, "utf8"));
      if (body) chunks.push(body);
    }
  }
  const fullMarkdown = sanitizeConsumerText(chunks.join("\n\n")).slice(0, 14000);
  return {
    slug: spec.slug,
    name: sanitizeConsumerText(spec.name),
    kind: spec.kind,
    region: sanitizeConsumerText(spec.region),
    debutNote: sanitizeConsumerText(spec.debutNote),
    shortDescription: truncateClean(spec.debutNote, 150),
    bodyMarkdown: fullMarkdown || sanitizeConsumerText(spec.debutNote),
    relatedBookSlugs: spec.relatedBookSlugs.filter((s) => publicBookSlugs.includes(s)),
    relatedBandSlugs: spec.relatedBandSlugs,
    backstageUrl: spec.backstageUrl || null,
  };
});

// ============================================================================
// 6. Compile In-Universe Organizations, Imprints, & Trusts (`/organizations/[slug]`)
// ============================================================================

const rawCorpTree = JSON.parse(fs.readFileSync(PATHS.corporateJson, "utf8"));
const organizations = [];

/**
 * Recursively flattens a nested corporate hierarchy tree (`node.children`) into
 * a flat array of `OrganizationEntry` objects while recording each subsidiary's
 * `parentSlug` so `/organizations/[slug]` can render both Parent and Child links!
 */
function flattenCorporateTree(node, parentSlug = null) {
  const slug = slugify(node.title);
  organizations.push({
    slug,
    name: sanitizeConsumerText(node.title),
    role: sanitizeConsumerText(node.role || "In-Universe Entity"),
    meta: sanitizeConsumerText(node.meta || ""),
    summary: sanitizeConsumerText(node.description || ""),
    shortDescription: truncateClean(node.description || node.role, 150),
    bodyMarkdown: sanitizeConsumerText(
      `${node.description || ""}\n\n*Note: ${node.title} is a fictitious in-universe organization within the RaggieSoft narrative universe.*`
    ),
    parentSlug,
    relatedBookSlugs: ["stardust-engine", "ad-astra"].filter((s) => publicBookSlugs.includes(s)),
    relatedBandSlugs: slug.includes("engine-room")
      ? bands.map((b) => b.slug)
      : ["the-stardust-engine"],
    externalUrl: slug.includes("engine-room")
      ? "https://engineroom.raggiesoft.com"
      : "https://corporate.raggiesoft.com",
  });
  for (const child of node.children || []) {
    flattenCorporateTree(child, slug);
  }
}
flattenCorporateTree(rawCorpTree);

const EXTRA_ORGANIZATIONS = [
  {
    slug: "quantum-corporation",
    name: "Quantum Corporation & The Catalyst Initiative",
    role: "Pacific Northwest Enterprise Technology Corporation",
    meta: "Headquarters: 1 Quantum Way, Redmond, WA",
    sourceFiles: ["quantum-corporation.md", "the-catalyst-initiative.md"],
    relatedBookSlugs: ["quantum-directive-1-jessica", "quantum-directive-2-kelly", "quantum-directive-3-casey", "meredith"],
    relatedBandSlugs: [],
    externalUrl: null,
  },
  {
    slug: "vectron-electronics",
    name: "Vectron",
    role: "In-Universe Personal Computing & Engineering Pioneer",
    meta: "Motto: Question the Rules",
    sourceFiles: ["../backstage/corporations/vectron-question-the-rules.md"],
    relatedBookSlugs: ["paige", "stardust-engine"],
    relatedBandSlugs: [],
    externalUrl: "https://backstage.raggiesoft.com/corporations/vectron-question-the-rules",
  },
  {
    slug: "promenade-retail-properties",
    name: "Promenade Retail Properties",
    role: "Regional Shopping Mall Developer & Operator",
    meta: "Commercial Real Estate",
    sourceFiles: ["promenade-retail-properties.md"],
    relatedBookSlugs: ["rachel", "katie"],
    relatedBandSlugs: [],
    externalUrl: null,
  },
  {
    slug: "all-world-entertainment-awe",
    name: "All-World Entertainment (AWE)",
    role: "In-Universe Sports Entertainment & Arena Touring Promotion",
    meta: "National Broadcast & Arena Promotion",
    sourceFiles: ["awe-professional-wrestling.md"],
    relatedBookSlugs: ["rachel", "paige"],
    relatedBandSlugs: [],
    externalUrl: null,
  },
  {
    slug: "prairie-coachworks-and-sainte-claire",
    name: "Prairie Coachworks & Sainte-Claire Coachbuilders",
    role: "Accessible Transit Bus & Custom Touring Coach Manufacturers",
    meta: "Heavy Transit & Custom Wheelchair-Lift Fleet Engineering",
    sourceFiles: [],
    synthesizedBody:
      "Across the RaggieSoft universe, Prairie Coachworks engineers low-floor accessible urban transit buses (including the 30-foot RLFD30 custom launch unit and 60-foot LF60 articulated coaches) alongside Sainte-Claire Coachbuilders—creators of the custom 45-foot 'Iron Horse' (Sainte-Claire 45H3) accessible touring sanctuary coach operated by The Stardust Engine.",
    relatedBookSlugs: ["stardust-engine", "katie", "aubrie"],
    relatedBandSlugs: ["the-stardust-engine"],
    externalUrl: "https://stardust.raggiesoft.com",
  },
];

for (const extra of EXTRA_ORGANIZATIONS) {
  if (organizations.some((o) => o.slug === extra.slug)) continue;
  const parts = [];
  if (extra.synthesizedBody) parts.push(extra.synthesizedBody);
  for (const rf of extra.sourceFiles || []) {
    const abs = path.resolve(PATHS.universalLoreDir, rf);
    if (fs.existsSync(abs)) {
      const { body } = sanitizeUniversalLoreMarkdown(fs.readFileSync(abs, "utf8"));
      if (body) parts.push(body);
    }
  }
  const md = sanitizeConsumerText(parts.join("\n\n")).slice(0, 12000);
  const firstPara = md.split(/\n\n+/)[0] || extra.role;
  organizations.push({
    slug: extra.slug,
    name: extra.name,
    role: extra.role,
    meta: extra.meta,
    summary: stripMarkdownFormatting(firstPara),
    shortDescription: truncateClean(firstPara, 150),
    bodyMarkdown: md,
    parentSlug: null,
    relatedBookSlugs: extra.relatedBookSlugs.filter((s) => publicBookSlugs.includes(s)),
    relatedBandSlugs: extra.relatedBandSlugs,
    externalUrl: extra.externalUrl,
  });
}

// ============================================================================
// 7. Compile Unified Characters (`/characters/[slug]`) With Spoiler Horizon
// ============================================================================

const CHARACTER_SPECS = [
  {
    slug: "katie-prairie",
    name: "Katie Prairie",
    role: "Co-Protagonist • Fraternal Twin Sister",
    debutSummary:
      "Born April 8, 1985 in Virginia Beach, Virginia alongside her fraternal twin brother Nathaniel ('Nate') Prairie, Katie is an autistic wheelchair user whose lifelong bond with Nate anchors Katie & Nathaniel from their childhood afternoon cartoon sanctuary onward.",
    bookKeys: ["katie::katie", "katie::nathaniel"],
    primaryBookSlug: "katie",
    bandSlugs: [],
    placeSlugs: ["coastal-virginia-transit-cvta", "virginia-dominion-university", "roosevelt-rehabilitation-center"],
    relatedCharacterSlugs: ["nathaniel-prairie", "rachel", "michael"],
  },
  {
    slug: "nathaniel-prairie",
    name: "Nathaniel \"Nate\" Prairie",
    role: "POV Narrator & Co-Protagonist • Fraternal Twin Brother",
    debutSummary:
      "Born April 8, 1985 in Virginia Beach, Virginia, Nathaniel ('Nate') Prairie is Katie's autistic fraternal twin brother, narrator, and inseparable safe person—sharing cartoon passwords, transit routes, and stepless sanctuaries side by side.",
    bookKeys: ["katie::nathaniel"],
    primaryBookSlug: "katie",
    bandSlugs: [],
    placeSlugs: ["coastal-virginia-transit-cvta", "virginia-dominion-university", "roosevelt-rehabilitation-center"],
    relatedCharacterSlugs: ["katie-prairie", "rachel", "michael"],
  },
  {
    slug: "ryan-oconnell",
    name: "Ryan O'Connell",
    role: "Co-Lead Vocalist, Lead Guitarist & Lyricist — The Stardust Engine",
    debutSummary:
      "Born in 1964 and raised in Blacksburg, Virginia alongside his sisters Cassidy and Holly and twin cousins Evan and Tyler Wright, Ryan O'Connell is the co-lead vocalist, electric guitarist, and primary lyricist of The Stardust Engine. An autistic T10 paraplegic manual wheelchair user whose rear push-handles serve as Cassidy's steady walking support, Ryan anchors both The Stardust Engine and Escape Velocity: Ad Astra.",
    bookKeys: ["stardust-engine::ryan", "ad-astra::ryan o"],
    primaryBookSlug: "stardust-engine",
    bandSlugs: ["the-stardust-engine"],
    placeSlugs: ["commonwealth-polytechnic-institute", "blacksburg-soundstage", "uscss-ad-astra-and-caelum-iv"],
    relatedCharacterSlugs: ["cassidy-oconnell", "holly-oconnell", "evan-wright", "tyler-wright"],
  },
  {
    slug: "cassidy-oconnell",
    name: "Cassidy O'Connell",
    role: "Co-Lead Vocalist, Analog Synthesizer Architect & Composer — The Stardust Engine",
    debutSummary:
      "Born in 1967 in Blacksburg, Virginia, Cassidy O'Connell is the co-lead vocalist, analog synthesizer architect, and composer of The Stardust Engine's Cosmic Tidal Lock Sound™ and 'Escape Velocity (Ad Astra).' Living with cerebral palsy and autism, Cassidy walks using the rear push-handles on her brother Ryan's manual wheelchair.",
    bookKeys: ["ad-astra::cassidy o", "stardust-engine::cassidy"],
    primaryBookSlug: "stardust-engine",
    bandSlugs: ["the-stardust-engine"],
    placeSlugs: ["commonwealth-polytechnic-institute", "blacksburg-soundstage", "uscss-ad-astra-and-caelum-iv"],
    relatedCharacterSlugs: ["ryan-oconnell", "holly-oconnell", "evan-wright", "tyler-wright"],
  },
  {
    slug: "holly-oconnell",
    name: "Holly O'Connell, J.D., CFA",
    role: "Band Manager, General Counsel & In-Universe Founder of Engine Room Records, LLC",
    debutSummary:
      "Born in 1969 as the youngest O'Connell sibling on Progress Street NE in Blacksburg, Holly O'Connell serves as The Stardust Engine's fiercely protective day-to-day manager, general counsel, Class A CDL co-driver, and in-universe founder of Engine Room Records, LLC.",
    bookKeys: ["ad-astra::holly o", "stardust-engine::holly"],
    primaryBookSlug: "stardust-engine",
    bandSlugs: ["the-stardust-engine", "the-hoshizora-ensemble"],
    placeSlugs: ["commonwealth-polytechnic-institute", "blacksburg-soundstage", "uscss-ad-astra-and-caelum-iv"],
    relatedCharacterSlugs: ["ryan-oconnell", "cassidy-oconnell", "evan-wright", "tyler-wright"],
  },
  {
    slug: "evan-wright",
    name: "Evan Wright",
    role: "Bassist, Sub-Bass Synth Architect & Systems Engineer — The Stardust Engine",
    debutSummary:
      "Born October 31, 1967, Evan Wright is Tyler Wright's identical twin brother and maternal cousin to Ryan, Cassidy, and Holly O'Connell—anchoring The Stardust Engine's low-end synth-bass architecture and Class A touring logistics from Blacksburg to Caelum-IV.",
    bookKeys: ["stardust-engine::evan"],
    primaryBookSlug: "stardust-engine",
    bandSlugs: ["the-stardust-engine"],
    placeSlugs: ["commonwealth-polytechnic-institute", "blacksburg-soundstage", "uscss-ad-astra-and-caelum-iv"],
    relatedCharacterSlugs: ["tyler-wright", "ryan-oconnell", "cassidy-oconnell", "holly-oconnell"],
  },
  {
    slug: "tyler-wright",
    name: "Tyler Wright",
    role: "Drummer, Percussionist & Lead Fleet Driver — The Stardust Engine",
    debutSummary:
      "Born October 31, 1967, Tyler Wright is Evan Wright's identical twin brother and maternal cousin to the O'Connell siblings—driving both The Stardust Engine's acoustic/electronic rhythm section and their custom accessible touring fleet.",
    bookKeys: ["stardust-engine::tyler"],
    primaryBookSlug: "stardust-engine",
    bandSlugs: ["the-stardust-engine"],
    placeSlugs: ["commonwealth-polytechnic-institute", "blacksburg-soundstage", "uscss-ad-astra-and-caelum-iv"],
    relatedCharacterSlugs: ["evan-wright", "ryan-oconnell", "cassidy-oconnell", "holly-oconnell"],
  },
  {
    slug: "claire-manning",
    name: "Claire Manning",
    role: "Lead Vocalist & Concert Flutist — Fractured Prisms",
    debutSummary:
      "Older sister of Rhys Manning in Fractured Prisms. Born into the British-American Manning Family Orchestra in Romford, East London, Claire is autistic and uses a manual wheelchair due to lifelong cerebral palsy, weaving Cousin Gwen's salvaged wooden concert flute and soaring vocals across Carnaby Street and 1883.",
    bookKeys: ["fractured-prisms::claire"],
    primaryBookSlug: "fractured-prisms",
    bandSlugs: ["fractured-prisms"],
    placeSlugs: ["colonial-theatre-hagerstown"],
    relatedCharacterSlugs: ["rhys-manning", "holly-oconnell"],
  },
  {
    slug: "rhys-manning",
    name: "Rhys Manning",
    role: "Synthesizer Architect, Multi-Instrumentalist & Safe Person — Fractured Prisms",
    debutSummary:
      "Younger brother and lifelong safe person to Claire Manning in Fractured Prisms, engineering their analog synthesizer rock operas in Williamsport, Maryland and restoring Downtown Hagerstown's 1914 Colonial Theatre into a stepless performance sanctuary.",
    bookKeys: ["fractured-prisms::rhys"],
    primaryBookSlug: "fractured-prisms",
    bandSlugs: ["fractured-prisms"],
    placeSlugs: ["colonial-theatre-hagerstown"],
    relatedCharacterSlugs: ["claire-manning", "holly-oconnell"],
  },
  {
    slug: "jordan-fuller",
    name: "Jordan (\"Aubrey\") Fuller",
    role: "Protagonist — The Eleventh Child (Aubrie)",
    debutSummary:
      "Eighteen-year-old non-speaking autistic AAC user who arrives at Commonwealth Polytechnic Institute in Blacksburg, Virginia in August 2014 and builds a fiercely protective chosen family inside Bennett Hall.",
    bookKeys: ["aubrie::jordan", "aubrie::aubrey"],
    primaryBookSlug: "aubrie",
    bandSlugs: ["the-hoshizora-ensemble"],
    placeSlugs: ["commonwealth-polytechnic-institute", "blue-ridge-transit"],
    relatedCharacterSlugs: ["isabel-dawson", "sarah-bennett"],
  },
  {
    slug: "isabel-dawson",
    name: "Isabel Dawson",
    role: "Bennett Hall Residence Life Mentor & OVA Archival Voice — The Eleventh Child",
    debutSummary:
      "Student residence-life leader at Commonwealth Polytechnic Institute's Eleanor Bennett Commonwealth Hall whose steady advocacy and floor documentation help anchor Jordan's freshman sanctuary in Blacksburg.",
    bookKeys: ["aubrie::isabel"],
    primaryBookSlug: "aubrie",
    bandSlugs: [],
    placeSlugs: ["commonwealth-polytechnic-institute"],
    relatedCharacterSlugs: ["jordan-fuller"],
  },
  {
    slug: "rachel",
    name: "Rachel",
    role: "Co-Protagonist — The Rachel Narrative",
    debutSummary:
      "Fiercely courageous younger sister in The Rachel Narrative whose unbreakable bond with her older brother Michael carries them from childhood survival in Tidewater Virginia through adulthood and university life at Virginia Dominion University.",
    vaultFile: "rachel.md",
    bookKeys: ["rachel::rachel"],
    primaryBookSlug: "rachel",
    bandSlugs: [],
    placeSlugs: ["coastal-virginia-transit-cvta", "virginia-dominion-university", "hampton-roads-regional-malls"],
    relatedCharacterSlugs: ["michael", "drew", "katie-prairie", "nathaniel-prairie"],
  },
  {
    slug: "michael",
    name: "Michael (The Rachel Narrative)",
    role: "POV Narrator & Older Brother — The Rachel Narrative",
    debutSummary:
      "Protective older brother and primary first-person narrator of The Rachel Narrative, navigating Hampton Roads transit corridors, family solidarity, and Virginia Dominion University side by side with his sister Rachel.",
    vaultFile: "michael.md",
    bookKeys: ["rachel::michael"],
    primaryBookSlug: "rachel",
    bandSlugs: [],
    placeSlugs: ["coastal-virginia-transit-cvta", "virginia-dominion-university", "hampton-roads-regional-malls"],
    relatedCharacterSlugs: ["rachel", "drew", "katie-prairie", "nathaniel-prairie"],
  },
  {
    slug: "drew",
    name: "Drew",
    role: "Protagonist — The Drew Narrative",
    debutSummary:
      "Resilient survivor and twin brother to Maggie in The Drew Narrative, rebuilding trust, friendship, and sanctuary alongside his family.",
    vaultFile: "drew.md",
    bookKeys: ["drew::drew"],
    primaryBookSlug: "drew",
    bandSlugs: [],
    placeSlugs: ["coastal-virginia-transit-cvta"],
    relatedCharacterSlugs: ["rachel", "michael"],
  },
  {
    slug: "leo-porter",
    name: "Leo Porter & Julian Croft (\"Leo\")",
    role: "Co-Protagonist — Luna & Leo / Lead Vocalist — The Paper Wall",
    debutSummary:
      "Autistic wheelchair user with cerebral palsy at the heart of Luna & Leo—and, in The Paper Wall's musical canon, lead vocalist Julian Croft ('Leo'), turning a cross-country Pathfinder coach escape into multi-volume rock operas.",
    bookKeys: ["luna-leo::leo porter"],
    primaryBookSlug: "luna-leo",
    bandSlugs: ["the-paper-wall"],
    placeSlugs: ["pathfinder-cross-country-corridor", "puget-sound-transit-taps", "commonwealth-polytechnic-institute"],
    relatedCharacterSlugs: ["stella-porter", "ryan-oconnell"],
  },
  {
    slug: "stella-porter",
    name: "Luna & Stella Porter",
    role: "Co-Protagonist & Protective Sister Circle — Luna & Leo",
    debutSummary:
      "Fiercely devoted twin and sister circle in Luna & Leo, anchoring Leo's cross-country North American journey and creative sanctuary.",
    bookKeys: ["luna-leo::stella porter"],
    primaryBookSlug: "luna-leo",
    bandSlugs: ["the-paper-wall"],
    placeSlugs: ["pathfinder-cross-country-corridor", "puget-sound-transit-taps"],
    relatedCharacterSlugs: ["leo-porter"],
  },
  {
    slug: "julian-rowlands",
    name: "Julian \"Julep\" Rowlands & The Rowlands Twins",
    role: "Protagonist Family — Upon This Winter's Night & The Arctic Symphony Project",
    debutSummary:
      "Fourteen-year-old wheelchair user Julian ('Julep') Rowlands of Ewell (Williamsburg), Virginia, whose older twin siblings Gabriel and Gwendolyn Rowlands and twins Maria and Clara Harrison broadcast 'Upon This Winter's Night' across the Appalachians in December 1996.",
    bookKeys: ["julian::gabriel rowlands", "julian::julian rowlands"],
    primaryBookSlug: "julian",
    bandSlugs: ["the-arctic-symphony-project"],
    placeSlugs: ["coastal-virginia-transit-cvta"],
    relatedCharacterSlugs: [],
  },
  {
    slug: "matt-miller",
    name: "Matt Miller & The Albemarle Ensemble",
    role: "Executive Producer & Tactile Command Rig Architect — Crimson Node",
    debutSummary:
      "Functionally non-verbal wheelchair-using producer in Albemarle County, Virginia who directs every Crimson Node session from his custom color-coded Tactile Command Rig alongside vocalists Emily, Rachel, Sarah, Jessica, Chloe, and Shiloh.",
    bookKeys: ["crimson-node::crimson node"],
    primaryBookSlug: "crimson-node",
    bandSlugs: ["crimson-node"],
    placeSlugs: ["northwood-high-school"],
    relatedCharacterSlugs: [],
  },
  {
    slug: "kaelan-and-kaela",
    name: "Kaelan & Kaela",
    role: "Twin Protagonists — The Silver Gauntlet of Aethel",
    debutSummary:
      "Twin brother and sister at the heart of the four-era fantasy saga The Silver Gauntlet of Aethel, scored by Firelight's 1987 and 2017 symphonic synth-rock soundtracks.",
    bookKeys: ["aethel::kaelan", "aethel::kaela"],
    primaryBookSlug: "aethel",
    bandSlugs: ["firelight"],
    placeSlugs: [],
    relatedCharacterSlugs: [],
  },
  {
    slug: "ocea-and-tay",
    name: "Ocea & Tay",
    role: "Twin Protagonists — Runebreaker: The Dream Kingdom",
    debutSummary:
      "Twins pulled through their living-room television in 1992 into the digital realm of Runebreaker: The Dream Kingdom, scored by Mana Canvas.",
    bookKeys: ["runebreaker::ocea", "runebreaker::tay"],
    primaryBookSlug: "runebreaker",
    bandSlugs: ["mana-canvas"],
    placeSlugs: [],
    relatedCharacterSlugs: [],
  },
  {
    slug: "john-and-erin",
    name: "John & Erin",
    role: "Fraternal Twin Protagonists — Before the Distance",
    debutSummary:
      "Fraternal twins who navigate Commonwealth Polytechnic Institute's steep Ironstone hills in their power wheelchairs in Before the Distance: The Story of John & Erin.",
    bookKeys: ["erin::john", "erin::erin"],
    primaryBookSlug: "erin",
    bandSlugs: ["the-stardust-engine"],
    placeSlugs: ["commonwealth-polytechnic-institute", "blue-ridge-transit"],
    relatedCharacterSlugs: ["ryan-oconnell", "cassidy-oconnell"],
  },
  {
    slug: "nichole-bennett",
    name: "Nichole Bennett",
    role: "Protagonist & Systems Pioneer — Nichole",
    debutSummary:
      "Brilliant computing architect and protagonist of Nichole, chronically tracing resilience, family devotion, and assistive technology.",
    bookKeys: ["nichole::nichole"],
    primaryBookSlug: "nichole",
    bandSlugs: [],
    placeSlugs: ["roosevelt-rehabilitation-center"],
    relatedCharacterSlugs: [],
  },
  {
    slug: "sarah-bennett",
    name: "Sarah Bennett",
    role: "Co-Protagonist — Jack & Sarah / Aquatic & Accessibility Advocate",
    debutSummary:
      "Head lifeguard, swim instructor, and accessibility advocate in Virginia Beach's Fairlawn Recreation Center community and co-protagonist of Jack & Sarah.",
    vaultFile: "sarah-bennett.md",
    bookKeys: ["jack-sarah::sarah bennett", "aubrie::sarah"],
    primaryBookSlug: "jack-sarah",
    bandSlugs: [],
    placeSlugs: ["fairlawn-recreation-center"],
    relatedCharacterSlugs: ["jack-bennett", "jordan-fuller"],
  },
  {
    slug: "jack-bennett",
    name: "Jack Bennett",
    role: "Co-Protagonist — Jack & Sarah",
    debutSummary:
      "Co-protagonist of Jack & Sarah, anchored by family connection, second chances, and community sanctuary in Virginia Beach.",
    vaultFile: "jack-bennett.md",
    bookKeys: ["jack-sarah::jack bennett"],
    primaryBookSlug: "jack-sarah",
    bandSlugs: [],
    placeSlugs: ["fairlawn-recreation-center"],
    relatedCharacterSlugs: ["sarah-bennett"],
  },
  {
    slug: "jessica-taylor",
    name: "Jessica Taylor",
    role: "Protagonist — The Quantum Directive: Jessica's Cut",
    debutSummary:
      "Engineering lead at Quantum Corporation in Redmond, Washington who shields her team through intense late-1990s software milestones in The Quantum Directive: Jessica's Cut.",
    bookKeys: ["quantum-directive-1-jessica::jessica"],
    primaryBookSlug: "quantum-directive-1-jessica",
    bandSlugs: [],
    placeSlugs: ["meridian-washington-and-sterling-plaza", "puget-sound-transit-taps"],
    relatedCharacterSlugs: ["kelly-madsen", "david-vance", "cassandra-vance"],
  },
  {
    slug: "kelly-madsen",
    name: "Kelly Madsen",
    role: "Protagonist — The Quantum Directive: Kelly's Cut",
    debutSummary:
      "Software engineer navigating the late-1990s Pacific Northwest tech boom alongside her twin brother in The Quantum Directive: Kelly's Cut.",
    bookKeys: ["quantum-directive-2-kelly::kelly"],
    primaryBookSlug: "quantum-directive-2-kelly",
    bandSlugs: [],
    placeSlugs: ["puget-sound-transit-taps"],
    relatedCharacterSlugs: ["jessica-taylor", "david-vance", "cassandra-vance"],
  },
  {
    slug: "david-vance",
    name: "David Vance",
    role: "POV Protagonist — The Quantum Directive: The Caretakers",
    debutSummary:
      "Central narrator of The Quantum Directive: The Caretakers, navigating chosen-family loyalty across the Vance and Delaney circle.",
    bookKeys: ["quantum-directive-3-casey::david vance", "quantum-directive-3-casey::david"],
    primaryBookSlug: "quantum-directive-3-casey",
    bandSlugs: [],
    placeSlugs: ["braxton-and-ocean-state-transit", "highcliff-and-coolidge-hill-estates"],
    relatedCharacterSlugs: ["cassandra-vance", "jessica-taylor", "kelly-madsen"],
  },
  {
    slug: "cassandra-vance",
    name: "Cassandra Vance",
    role: "Chief Executive Officer (2014+) — Quantum Corporation",
    debutSummary:
      "Executive strategist who ascends to Chief Executive Officer of Quantum Corporation in Redmond, Washington in 2014.",
    ulFile: "cassandra-vance.md",
    bookKeys: [],
    primaryBookSlug: "quantum-directive-3-casey",
    bandSlugs: [],
    placeSlugs: ["meridian-washington-and-sterling-plaza", "puget-sound-transit-taps"],
    relatedCharacterSlugs: ["david-vance", "jessica-taylor", "kelly-madsen"],
  },
  {
    slug: "paige-and-freddie-avery",
    name: "Paige & Freddie Avery",
    role: "Protagonists — Paige",
    debutSummary:
      "Computer science and chosen-family protagonists in Blacksburg, Virginia whose structured weekday evening television ritual—culminating in Stellar Voyage: The New Era at 8:00 PM—inspires their dark-mode software design and cosmic imagination.",
    bookKeys: [],
    primaryBookSlug: "paige",
    bandSlugs: ["the-stardust-engine"],
    placeSlugs: ["commonwealth-polytechnic-institute", "blue-ridge-transit", "roosevelt-rehabilitation-center"],
    relatedCharacterSlugs: ["ryan-oconnell"],
  },
  {
    slug: "alex-and-chloe",
    name: "Alex Miller & Chloe",
    role: "Protagonists — Beyond Words",
    debutSummary:
      "Lifelong companions at the center of Beyond Words, bound by an unbreakable platonic and cousinship anchor from childhood onward.",
    bookKeys: ["alex-chloe::alex miller", "alex-chloe::alex"],
    primaryBookSlug: "alex-chloe",
    bandSlugs: [],
    placeSlugs: ["northwood-high-school"],
    relatedCharacterSlugs: [],
  },
  {
    slug: "bob-and-emily",
    name: "Bob & Emily",
    role: "Cousin Protagonists — The Heart-Hum",
    debutSummary:
      "Fifteen-year-old Emily and her wheelchair-using cousin Bob, who forge a private communication cadence and unbreakable sanctuary in The Heart-Hum.",
    bookKeys: ["bob-emily::bob emily"],
    primaryBookSlug: "bob-emily",
    bandSlugs: [],
    placeSlugs: [],
    relatedCharacterSlugs: [],
  },
];

// Build each `CharacterEntry` from `CHARACTER_SPECS`:
//   1. Collect and deduplicate every chapter Part matching `spec.bookKeys` (keyed by URL in `partMap`).
//   2. Sort appearances chronologically and group them by Era (`Era 1` vs `Era 2+` for Spoiler Horizon).
//   3. Merge any extended character dossier Markdown (`vault/characters/*.md` or `universal-lore/*.md`).
//   4. Resolve debut dates, locations, and fallback cover images using optional chaining (`?.`).
const characters = CHARACTER_SPECS.map((spec) => {
  // Gather chapter/part appearances across matching POV keys
  const partMap = new Map();
  for (const bk of spec.bookKeys) {
    for (const p of partAppearancesByBookAndPov.get(bk) || []) {
      partMap.set(p.url, p);
    }
  }
  const appearances = [...partMap.values()].sort((a, b) =>
    String(a.date || "").localeCompare(String(b.date || ""))
  );

  // Group appearances by Era for collapsible Spoiler Horizon disclosure
  const eraGroupsMap = new Map();
  for (const ap of appearances) {
    const key = `${ap.eraNum}::${ap.eraTitle}`;
    if (!eraGroupsMap.has(key)) {
      eraGroupsMap.set(key, { eraNum: ap.eraNum, eraTitle: ap.eraTitle, items: [] });
    }
    eraGroupsMap.get(key).items.push({
      title: ap.title,
      url: ap.url,
      date: ap.date,
      location: ap.location,
    });
  }
  const eraMilestones = [...eraGroupsMap.values()];

  let extraMarkdown = "";
  if (spec.vaultFile) {
    const vf = path.join(PATHS.localVaultCharactersDir, spec.vaultFile);
    if (fs.existsSync(vf)) {
      const parsed = matter(fs.readFileSync(vf, "utf8"));
      // Strip raw single-word internal vault links like `[Curtis](curtis)` -> `Curtis`
      extraMarkdown = sanitizeConsumerText(
        parsed.content.replace(/^#\s+.*$/m, "").replace(/\[([^\]]+)\]\(([a-z0-9-]+)\)/gi, "$1")
      );
    }
  } else if (spec.ulFile) {
    const uf = path.join(PATHS.universalLoreDir, spec.ulFile);
    if (fs.existsSync(uf)) {
      extraMarkdown = sanitizeUniversalLoreMarkdown(fs.readFileSync(uf, "utf8")).body;
    }
  }

  const primaryBook = books.find((b) => b.slug === spec.primaryBookSlug) || null;
  const debutPart = appearances[0] || null;

  return {
    slug: spec.slug,
    name: spec.name,
    role: spec.role,
    debutSummary: sanitizeConsumerText(spec.debutSummary),
    shortDescription: truncateClean(spec.debutSummary, 150),
    extendedBioMarkdown: extraMarkdown,
    primaryBookSlug: primaryBook ? primaryBook.slug : null,
    primaryBookTitle: primaryBook ? primaryBook.title : null,
    primaryBookUrl: primaryBook ? primaryBook.bookReaderUrl : null,
    firstAppearanceUrl: debutPart?.url || primaryBook?.firstChapterUrl || null,
    debutDate: debutPart?.date || primaryBook?.debutDate || "",
    debutLocation: debutPart?.location || primaryBook?.primaryLocations?.[0] || "",
    image: debutPart?.image || primaryBook?.coverImage || "https://assets.raggiesoft.com/raggiesoft-lore/images/og/default-og.jpg",
    appearanceCount: appearances.length,
    bandSlugs: spec.bandSlugs,
    placeSlugs: spec.placeSlugs,
    relatedCharacterSlugs: spec.relatedCharacterSlugs,
    eraMilestones,
  };
});

// ============================================================================
// 8. Compile Chronological Universe Timeline (`/timeline`)
// ============================================================================
// Combines all 40 Engine Room Records album releases (`isSpoiler: false`) with
// every Ocean View Archives story Era (`Era 1` -> `isSpoiler: false`,
// `Era 2+` -> `isSpoiler: true`), sorts them chronologically by ISO date string,
// and buckets them into 5 historical/cosmic eras (`1978–1989` through `Stardate 49601`).

const timelineEvents = [];

// Add all 40 albums by release year
for (const band of bands) {
  for (const album of band.albums) {
    if (!/^\d{4}/.test(album.year)) continue;
    timelineEvents.push({
      id: `album-${band.slug}-${album.slug}`,
      date: album.releaseDate || `${album.year}-01-01`,
      year: album.year,
      kind: "Music Release",
      title: `${band.name} — ${album.title}`,
      summary: `${band.primaryGenre}${album.trackCount ? ` • ${album.trackCount} tracks` : ""}`,
      internalHref: `/bands/${band.slug}`,
      externalUrl: album.listeningRoomUrl,
      externalLabel: "Listen in The Listening Room",
      isSpoiler: false,
    });
  }
}

// Add Book Era 1 Debuts (visible immediately) and Era 2+ Milestones (spoiler-guarded)
for (const book of books) {
  for (const era of book.eras) {
    const firstDate = era.dateSpan ? era.dateSpan.split(" to ")[0] : "";
    if (!/^\d{4}/.test(firstDate)) continue;
    const isDebut = era.eraNum === 1;
    timelineEvents.push({
      id: `book-${book.slug}-e${era.eraNum}`,
      date: firstDate,
      year: firstDate.slice(0, 4),
      kind: isDebut ? "Series Debut Era" : "Later Storyline Era",
      title: `${book.title} — ${era.title}`,
      summary: isDebut
        ? book.debutIntro
        : `${era.chapters.length} chapters${era.locations.length ? ` set across ${era.locations.slice(0, 3).join(", ")}` : ""}`,
      internalHref: `/books/${book.slug}`,
      externalUrl: era.url,
      externalLabel: isDebut ? "Read Opening Era" : "Open Era in Book Reader",
      isSpoiler: !isDebut,
    });
  }
}

timelineEvents.sort((a, b) => a.date.localeCompare(b.date));

const DECADE_BUCKETS = [
  { id: "1970s-1980s", label: "1978–1989: Seto Inland Sea, CPI Origins & The 1980s Synth-Rock Era", match: (y) => y >= 1970 && y <= 1989 },
  { id: "1990s", label: "1990–1999: The 1992 Emancipation, Childhood Sanctuaries & Ad Astra (1996)", match: (y) => y >= 1990 && y <= 1999 },
  { id: "2000s", label: "2000–2009: Touring Sanctuaries, Cross-Country Routes & Rehabilitation Reckonings", match: (y) => y >= 2000 && y <= 2009 },
  { id: "2010s", label: "2010–2019: Campus Chosen Families, Civic Voices & Reunion Horizons", match: (y) => y >= 2010 && y <= 2019 },
  { id: "2020s-plus", label: "2020–Present & Deep-Space Horizon (Stardate 49601)", match: (y) => y >= 2020 },
];

const timeline = DECADE_BUCKETS.map((bucket) => {
  const matching = timelineEvents.filter((ev) => bucket.match(Number(ev.year)));
  return {
    id: bucket.id,
    label: bucket.label,
    debutEvents: matching.filter((ev) => !ev.isSpoiler),
    spoilerEvents: matching.filter((ev) => ev.isSpoiler),
  };
});

// Add Caelum-IV Stardate 49601 cosmic anchor to the final bucket's debut events
const finalBucket = timeline[timeline.length - 1];
finalBucket.debutEvents.push({
  id: "cosmic-caelum-iv-49601",
  date: "Stardate 49601",
  year: "49601",
  kind: "Cosmic Expedition",
  title: "Escape Velocity: Ad Astra — Arrival at Caelum-IV (Stardate 49601)",
  summary:
    "Aboard the USCSS Ad Astra, Ryan, Cassidy, and Holly O'Connell and twin pilots Evan and Tyler Wright step onto the 0.88G purple-ocean sanctuary moon Caelum-IV.",
  internalHref: "/places/uscss-ad-astra-and-caelum-iv",
  externalUrl: "https://books.raggiesoft.com/ad-astra",
  externalLabel: "Read Escape Velocity: Ad Astra",
  isSpoiler: false,
});

// ============================================================================
// 9. Build Full-Universe 2D Constellation Graph (`nodes` + `links`)
// ============================================================================
// Computer Science Concept — Graph Data Structure:
// A "Graph" models relationships as a network of:
//   - Nodes (also called "vertices"): individual points (`char:katie-prairie`, `band:firelight`, etc.)
//   - Links (also called "edges"): lines connecting two nodes (`source` <-> `target`)
// Below, we add every Character, Band, Book, Place, and Organization as a Node,
// wire their story/music connections as Links, validate that both endpoints exist,
// and deduplicate any parallel `A <-> B` / `B <-> A` pairs.

const graphNodes = [];
const graphLinks = [];
const nodeIds = new Set();

function addNode(node) {
  if (nodeIds.has(node.id)) return;
  nodeIds.add(node.id);
  graphNodes.push(node);
}

function addLink(source, target, type, context) {
  if (!source || !target || source === target) return;
  graphLinks.push({ source, target, type, context: sanitizeConsumerText(context || "") });
}

for (const c of characters) {
  addNode({
    id: `char:${c.slug}`,
    slug: c.slug,
    name: c.name,
    group: "character",
    val: 8,
    href: `/characters/${c.slug}`,
    externalUrl: c.firstAppearanceUrl || c.primaryBookUrl,
    externalLabel: "Read Debut Chapter",
    summary: c.debutSummary,
    subtitle: c.role,
  });
}

for (const b of bands) {
  addNode({
    id: `band:${b.slug}`,
    slug: b.slug,
    name: b.name,
    group: "band",
    val: 11,
    href: `/bands/${b.slug}`,
    externalUrl: b.listeningRoomUrl,
    externalLabel: "Listen in The Listening Room",
    summary: b.summary,
    subtitle: b.primaryGenre,
  });
}

for (const bk of books) {
  addNode({
    id: `book:${bk.slug}`,
    slug: bk.slug,
    name: bk.title,
    group: "book",
    val: 9,
    href: `/books/${bk.slug}`,
    externalUrl: bk.bookReaderUrl,
    externalLabel: "Open in Book Reader",
    summary: bk.debutIntro,
    subtitle: `${bk.stats.scaleLabel} • ${bk.stats.eraCount} Eras`,
  });
}

for (const pl of places) {
  addNode({
    id: `place:${pl.slug}`,
    slug: pl.slug,
    name: pl.name,
    group: "place",
    val: 9,
    href: `/places/${pl.slug}`,
    externalUrl: pl.backstageUrl,
    externalLabel: pl.backstageUrl ? "View Backstage Dossier" : null,
    summary: pl.debutNote,
    subtitle: `${pl.kind} • ${pl.region}`,
  });
}

for (const org of organizations) {
  addNode({
    id: `org:${org.slug}`,
    slug: org.slug,
    name: org.name,
    group: "organization",
    val: 8,
    href: `/organizations/${org.slug}`,
    externalUrl: org.externalUrl,
    externalLabel: org.externalUrl ? "Visit Official Portal" : null,
    summary: org.summary,
    subtitle: org.role,
  });
}

// Wire edges across Characters, Bands, Books, Places, and Organizations
for (const c of characters) {
  if (c.primaryBookSlug) {
    addLink(`char:${c.slug}`, `book:${c.primaryBookSlug}`, "protagonist", `${c.name} anchors ${c.primaryBookTitle}.`);
  }
  for (const bSlug of c.bandSlugs) {
    addLink(`char:${c.slug}`, `band:${bSlug}`, "member", `${c.name} performs with or anchors ${bSlug}.`);
  }
  for (const pSlug of c.placeSlugs) {
    addLink(`char:${c.slug}`, `place:${pSlug}`, "setting", `${c.name}'s journey connects through this setting.`);
  }
  for (const relChar of c.relatedCharacterSlugs) {
    // Alphabetical check (`c.slug < relChar`) avoids pushing the same mutual sibling
    // bond twice (once from Katie -> Nate and again from Nate -> Katie).
    if (c.slug < relChar) {
      addLink(`char:${c.slug}`, `char:${relChar}`, "bond", "Connected family, twin, or chosen-family bond.");
    }
  }
}

for (const b of bands) {
  addLink(`band:${b.slug}`, "org:engine-room-records-llc", "roster", `${b.name} releases music under Engine Room Records.`);
  for (const bkSlug of b.relatedBookSlugs) {
    addLink(`band:${b.slug}`, `book:${bkSlug}`, "soundtrack-canon", `${b.name}'s discography pairs with this narrative series.`);
  }
  for (const pSlug of b.relatedPlaceSlugs) {
    addLink(`band:${b.slug}`, `place:${pSlug}`, "home-base", `${b.name}'s recording or performance sanctuary.`);
  }
}

for (const pl of places) {
  for (const bkSlug of pl.relatedBookSlugs) {
    addLink(`place:${pl.slug}`, `book:${bkSlug}`, "setting", `Featured setting in ${bkSlug}.`);
  }
}

for (const org of organizations) {
  if (org.parentSlug) {
    addLink(`org:${org.parentSlug}`, `org:${org.slug}`, "subsidiary", "In-universe corporate/trust structure.");
  }
  for (const bkSlug of org.relatedBookSlugs) {
    addLink(`org:${org.slug}`, `book:${bkSlug}`, "featured-in", `Appears in ${bkSlug}.`);
  }
}

// Keep only edges where BOTH `source` and `target` exist in `nodeIds` (prevents dangling links).
const validGraphLinks = graphLinks.filter(
  (l) => nodeIds.has(l.source) && nodeIds.has(l.target)
);

// Deduplicate parallel edges by sorting `[source, target]` into a canonical key `"A<->B"`.
const seenEdgeKeys = new Set();
const dedupedGraphLinks = validGraphLinks.filter((l) => {
  const k = [l.source, l.target].sort().join("<->");
  if (seenEdgeKeys.has(k)) return false;
  seenEdgeKeys.add(k);
  return true;
});

// ============================================================================
// 10. Hard Post-Compile Safety, Copyright, & Link Audit
// ============================================================================
// Serialize the entire encyclopedia object to pretty-printed JSON (`null, 2` = 2-space indent),
// run `HARD_BLOCKLIST_PATTERNS` across 100% of the output, and abort (`process.exit(1)`)
// BEFORE writing `src/generated/encyclopedia.json` if even a single violation appears.

const payload = {
  generatedAt: new Date().toISOString().slice(0, 10),
  stats: {
    totalEntries:
      characters.length +
      bands.length +
      books.length +
      places.length +
      organizations.length,
    characterCount: characters.length,
    bandCount: bands.length,
    albumCount: rawCatalog.length,
    bookCount: books.length,
    placeCount: places.length,
    organizationCount: organizations.length,
    graphNodeCount: graphNodes.length,
    graphEdgeCount: dedupedGraphLinks.length,
  },
  characters,
  bands,
  books,
  places,
  organizations,
  timeline,
  graph: {
    nodes: graphNodes,
    links: dedupedGraphLinks,
  },
};

const serialized = JSON.stringify(payload, null, 2);

// Audit 1: Trauma-trigger surname check runs across 100% of serialized output (including URLs/filenames)
// Audit 2: Landmark/brand prose check strips `https://assets.raggiesoft.com/...` CDN asset filenames so existing image paths stay intact
const serializedWithoutAssetPaths = serialized.replace(
  /https:\/\/assets\.raggiesoft\.com\/[^\s"']+/g,
  "https://assets.raggiesoft.com/_asset"
);

const violations = [];
for (const rule of HARD_BLOCKLIST_PATTERNS) {
  const targetText = rule.label.includes("Trauma-trigger") ? serialized : serializedWithoutAssetPaths;
  const m = targetText.match(rule.regex);
  if (m) {
    const idx = m.index || 0;
    const ctx = targetText.slice(Math.max(0, idx - 60), Math.min(targetText.length, idx + 80)).replace(/\s+/g, " ");
    violations.push(`${rule.label}: matched "${m[0]}" near: ${ctx}`);
  }
}

if (violations.length > 0) {
  console.error("🚨 LORE ENCYCLOPEDIA SAFETY AUDIT FAILED:");
  for (const v of violations) console.error("   ❌", v);
  process.exit(1);
}

fs.mkdirSync(path.dirname(PATHS.outputJson), { recursive: true });
fs.writeFileSync(PATHS.outputJson, serialized + "\n", "utf8");

console.log(
  `✅ Compiled RaggieSoft Lore Encyclopedia: ${payload.stats.totalEntries} static entries ` +
    `(${characters.length} characters, ${bands.length} bands / ${rawCatalog.length} albums, ` +
    `${books.length} books, ${places.length} places, ${organizations.length} organizations) ` +
    `+ ${graphNodes.length} constellation nodes & ${dedupedGraphLinks.length} edges -> src/generated/encyclopedia.json`
);
