/**
 * @license MIT
 * ============================================================================
 * src/lib/encyclopedia.ts — Typed Build-Time Accessors for Lore Encyclopedia
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT THIS FILE IS: This is the central data dictionary and lookup library
 *     for the entire `lore.raggiesoft.com` application. It defines exact
 *     TypeScript data shapes ("interfaces") for Characters, Bands, Books,
 *     Places, Organizations, Timeline Events, and Constellation Graph nodes,
 *     and exports clean helper functions (`getCharacters()`, `getBookBySlug()`,
 *     `buildSeoTitle()`, etc.) used by every page.
 *   - WHEN IT RUNS: Runs at **build time** inside Next.js Server Components
 *     during `next build`. Because all pages call these helpers while generating
 *     static HTML, visitors' browsers never have to wait for a database query
 *     or network API fetch to read an encyclopedia article.
 *   - WHAT DATA FEEDS INTO IT: `src/generated/encyclopedia.json`, which is
 *     automatically compiled right before the build by
 *     `scripts/compile-lore-encyclopedia.mjs` (`"prebuild"` in `package.json`).
 *   - WHAT OUTPUT IT PRODUCES: Strongly typed JavaScript arrays/objects and
 *     search-engine-friendly `<title>` / `<meta name="description">` strings.
 * ============================================================================
 */

// The `@/` prefix is a "path alias" configured in `tsconfig.json` that always
// points to our `src/` folder—saving us from brittle relative paths like `../../../`.
// Modern TypeScript & bundlers allow importing `.json` files directly as JavaScript objects!
import rawEncyclopedia from "@/generated/encyclopedia.json";

// ============================================================================
// 1. TypeScript Types & Interfaces (Compile-Time Blueprints)
// ============================================================================
// Beginner Tip: Every `export type` and `export interface` block below exists
// PURELY at compile time to help humans and TypeScript catch mistakes (like
// writing `band.titel` instead of `band.title`). When TypeScript compiles to
// browser JavaScript, 100% of these interfaces vanish—adding zero bytes to the site!

/**
 * A TypeScript "Union Type" (`|` means "OR").
 * A `NodeGroup` variable is strictly restricted to one of these 5 exact strings;
 * any typo like `"charcter"` causes an immediate red underline in your editor.
 */
export type NodeGroup = "character" | "band" | "book" | "place" | "organization";

/**
 * One interactive star/point ("node" or "vertex") on the 2D Constellation Map.
 */
export interface LoreGraphNode {
  id: string; // Unique prefixed key (e.g., `"char:katie-prairie"`, `"band:firelight"`)
  slug: string; // URL-friendly identifier (e.g., `"katie-prairie"`)
  name: string; // Human-readable display title
  group: NodeGroup; // Which of the 5 universe categories this node belongs to
  val: number; // Relative visual weight/importance used by the force-graph layout
  href: string; // Internal Lore Encyclopedia route (e.g., `"/characters/katie-prairie"`)
  externalUrl: string | null; // Optional cross-property URL (`string | null` means either text OR `null`)
  externalLabel: string | null; // Button text for `externalUrl` (e.g., `"Listen in The Listening Room"`)
  summary: string; // Spoiler-safe description shown in the slide-over inspector drawer
  subtitle: string; // Secondary role/genre/region badge line
}

/**
 * One connecting line ("edge" or "link") between two `LoreGraphNode` items.
 */
export interface LoreGraphLink {
  source: string; // `id` of the starting node (e.g., `"char:ryan-oconnell"`)
  target: string; // `id` of the connected node (e.g., `"band:the-stardust-engine"`)
  type: string; // Relationship kind (`"protagonist"`, `"member"`, `"setting"`, `"bond"`, etc.)
  context: string; // Plain-English explanation of how the two entries connect
}

/**
 * Complete graph payload passed into `<LoreGraph />` (`nodes` array + `links` array).
 * In TypeScript, `LoreGraphNode[]` (`Type[]`) means "an Array of `LoreGraphNode` objects."
 */
export interface LoreGraphData {
  nodes: LoreGraphNode[];
  links: LoreGraphLink[];
}

/**
 * A single narrative chapter/part appearance linked from a Character profile.
 */
export interface CharacterMilestoneItem {
  title: string;
  url: string; // Verified deep link into `https://books.raggiesoft.com/...`
  date: string; // In-universe story date
  location: string; // In-universe setting
}

/**
 * Groups a character's story appearances by Era (`Era 1` is shown openly;
 * `Era 2+` is placed inside a collapsible `<details>` spoiler guard).
 */
export interface CharacterEraMilestone {
  eraNum: number;
  eraTitle: string;
  items: CharacterMilestoneItem[];
}

/**
 * Complete data shape for one Character guide (`/characters/[slug]`).
 */
export interface CharacterEntry {
  slug: string;
  name: string;
  role: string;
  debutSummary: string; // Spoiler-free introduction anchored to the character's debut
  shortDescription: string; // Clamped summary for directory cards & social/SEO previews
  extendedBioMarkdown: string; // Optional archival biography rendered inside the spoiler drawer
  primaryBookSlug: string | null;
  primaryBookTitle: string | null;
  primaryBookUrl: string | null;
  firstAppearanceUrl: string | null;
  debutDate: string;
  debutLocation: string;
  image: string;
  appearanceCount: number;
  bandSlugs: string[];
  placeSlugs: string[];
  relatedCharacterSlugs: string[];
  eraMilestones: CharacterEraMilestone[];
}

/**
 * One album release listed inside a Band's discography section.
 */
export interface AlbumSummary {
  slug: string;
  title: string;
  subtitle: string;
  releaseDate: string;
  year: string;
  genre: string;
  trackCount: number;
  coverUrl: string;
  listeningRoomUrl: string; // Direct stream link on `https://music.raggiesoft.com`
}

/**
 * One musician or ensemble member inside a Band profile.
 */
export interface BandMember {
  name: string;
  role: string;
  notes: string;
}

/**
 * Thematic worldbuilding card ("Lore Pillar") explaining a band's sanctuary or sound.
 */
export interface BandLorePillar {
  title: string;
  body: string;
}

/**
 * Complete data shape for one Engine Room Records Band (`/bands/[slug]`).
 */
export interface BandEntry {
  slug: string;
  errId: string; // Catalog artist code (e.g., `"ERR-ART-001"`)
  name: string;
  tagline: string;
  origin: string;
  yearsActive: string;
  primaryGenre: string;
  summary: string;
  shortDescription: string;
  musicalStyle: string;
  listeningRoomUrl: string;
  imprintUrl: string | null;
  bookReaderUrl: string | null;
  image: string;
  members: BandMember[];
  lorePillars: BandLorePillar[];
  albums: AlbumSummary[];
  relatedBookSlugs: string[];
  relatedPlaceSlugs: string[];
}

/**
 * Metadata for an individual narrative Part (`pXXX.md`) inside a Book chapter.
 */
export interface BookPartSummary {
  partNum: number;
  title: string;
  url: string;
  date: string;
  location: string;
  excerpt: string;
  readingMinutes: number;
  image: string | null;
  imageAlt: string;
  eraNum: number;
  eraTitle: string;
  chapNum: number;
  chapTitle: string;
}

/**
 * Metadata for a Chapter (`cXXX`) containing one or more `BookPartSummary` items.
 */
export interface BookChapterSummary {
  chapNum: number;
  title: string;
  url: string;
  partCount: number;
  parts: BookPartSummary[];
}

/**
 * Metadata for a major story Era (`eXXX`, such as Era 1, Era 2, etc.).
 */
export interface BookEraSummary {
  eraNum: number;
  title: string;
  url: string;
  wordCount: number;
  illustrationCount: number;
  dateSpan: string;
  locations: string[];
  chapters: BookChapterSummary[];
}

/**
 * Cross-link to a companion archival article on `https://backstage.raggiesoft.com`.
 */
export interface BackstageDossierLink {
  title: string;
  subtitle: string;
  date: string;
  url: string;
}

/**
 * Complete data shape for one Ocean View Archives Book Series (`/books/[slug]`).
 */
export interface BookEntry {
  slug: string;
  title: string;
  coverImage: string;
  heroImage: string;
  heroImageAlt: string;
  debutIntro: string; // Spoiler-free opening premise from Era 1 / Chapter 1 / Part 1
  debutSettingNote: string;
  shortDescription: string;
  fullSeriesSynopsis: string; // Tucked inside `<details class="lore-spoiler">`
  bookReaderUrl: string;
  tocUrl: string;
  firstChapterUrl: string;
  stats: {
    scaleLabel: string;
    readingHours: number;
    storyPages: number;
    eraCount: number;
    chapterCount: number;
    partCount: number;
    illustrationCount: number;
  };
  dateSpan: string;
  debutDate: string;
  primaryLocations: string[];
  // `Array<{ ... }>` is equivalent to `{ ... }[]` — an array of inline objects.
  relatedBands: Array<{ slug: string; name: string; listeningRoomUrl: string }>;
  backstageDossiers: BackstageDossierLink[];
  eras: BookEraSummary[];
}

/**
 * Complete data shape for a Campus, City, Starship, or Transit Network (`/places/[slug]`).
 */
export interface PlaceEntry {
  slug: string;
  name: string;
  kind: string;
  region: string;
  debutNote: string;
  shortDescription: string;
  bodyMarkdown: string;
  relatedBookSlugs: string[];
  relatedBandSlugs: string[];
  backstageUrl: string | null;
}

/**
 * Complete data shape for a Fictional In-Universe Organization (`/organizations/[slug]`).
 */
export interface OrganizationEntry {
  slug: string;
  name: string;
  role: string;
  meta: string;
  summary: string;
  shortDescription: string;
  bodyMarkdown: string;
  parentSlug: string | null; // Links a subsidiary back to its parent organization, if any
  relatedBookSlugs: string[];
  relatedBandSlugs: string[];
  externalUrl: string | null;
}

/**
 * One chronological milestone card on `/timeline` (either an album release or a book era).
 */
export interface TimelineEventItem {
  id: string;
  date: string;
  year: string;
  kind: string;
  title: string;
  summary: string;
  internalHref: string;
  externalUrl: string;
  externalLabel: string;
  isSpoiler: boolean; // `false` for music & Era 1 debuts; `true` for Era 2+ story arcs
}

/**
 * Groups timeline milestones into a decade section (`1978–1989`, `1990–1999`, etc.),
 * separating spoiler-free `debutEvents` from collapsible `spoilerEvents`.
 */
export interface TimelineBucket {
  id: string;
  label: string;
  debutEvents: TimelineEventItem[];
  spoilerEvents: TimelineEventItem[];
}

/**
 * Root structure of `src/generated/encyclopedia.json`.
 */
export interface EncyclopediaPayload {
  generatedAt: string;
  stats: {
    totalEntries: number;
    characterCount: number;
    bandCount: number;
    albumCount: number;
    bookCount: number;
    placeCount: number;
    organizationCount: number;
    graphNodeCount: number;
    graphEdgeCount: number;
  };
  characters: CharacterEntry[];
  bands: BandEntry[];
  books: BookEntry[];
  places: PlaceEntry[];
  organizations: OrganizationEntry[];
  timeline: TimelineBucket[];
  graph: LoreGraphData;
}

// ============================================================================
// 2. Typed Build-Time Data Accessors
// ============================================================================

// TypeScript automatically infers literal types for small JSON files, but on a
// large multi-megabyte generated JSON file, casting via `as unknown as EncyclopediaPayload`
// applies our clean, documented interfaces above without slowing down the compiler.
const encyclopedia = rawEncyclopedia as unknown as EncyclopediaPayload;

/** Returns the entire compiled encyclopedia object (stats, arrays, timeline, and graph). */
export function getEncyclopedia(): EncyclopediaPayload {
  return encyclopedia;
}

/** Returns all compiled Character profiles. */
export function getCharacters(): CharacterEntry[] {
  return encyclopedia.characters;
}

/**
 * Looks up a single Character by URL `slug` (e.g., `"katie-prairie"`).
 * `Array.prototype.find()` tests each element `c` with the arrow function `(c) => c.slug === slug`
 * and returns the matching `CharacterEntry`, or `undefined` if no match exists
 * (so the calling page can trigger Next.js's `notFound()` 404 handler).
 */
export function getCharacterBySlug(slug: string): CharacterEntry | undefined {
  return encyclopedia.characters.find((c) => c.slug === slug);
}

/** Returns all 8 Engine Room Records Band & Ensemble profiles. */
export function getBands(): BandEntry[] {
  return encyclopedia.bands;
}

/** Looks up a single Band by URL `slug` (e.g., `"the-stardust-engine"`). */
export function getBandBySlug(slug: string): BandEntry | undefined {
  return encyclopedia.bands.find((b) => b.slug === slug);
}

/** Returns all 30 public Ocean View Archives Book Series guides. */
export function getBooks(): BookEntry[] {
  return encyclopedia.books;
}

/** Looks up a single Book Series guide by URL `slug` (e.g., `"ad-astra"`). */
export function getBookBySlug(slug: string): BookEntry | undefined {
  return encyclopedia.books.find((b) => b.slug === slug);
}

/** Returns all canonical Places, Campuses, Starships, and Transit Networks. */
export function getPlaces(): PlaceEntry[] {
  return encyclopedia.places;
}

/** Looks up a single Place guide by URL `slug` (e.g., `"commonwealth-polytechnic-institute"`). */
export function getPlaceBySlug(slug: string): PlaceEntry | undefined {
  return encyclopedia.places.find((p) => p.slug === slug);
}

/** Returns all fictional In-Universe Organizations, Imprints, and Trusts. */
export function getOrganizations(): OrganizationEntry[] {
  return encyclopedia.organizations;
}

/** Looks up a single In-Universe Organization by URL `slug`. */
export function getOrganizationBySlug(slug: string): OrganizationEntry | undefined {
  return encyclopedia.organizations.find((o) => o.slug === slug);
}

/** Returns chronological decade buckets for `/timeline`. */
export function getTimelineBuckets(): TimelineBucket[] {
  return encyclopedia.timeline;
}

// ============================================================================
// 3. Search Engine Optimization (SEO) & Social Card Metadata Helpers
// ============================================================================

/**
 * Enriches an HTML `<title>` and OpenGraph title while keeping it strictly
 * `<= 60` characters so Google, Bing, Discord, and iMessage never chop titles
 * awkwardly mid-phrase.
 *
 * Notice the default parameter `suffix = "RaggieSoft Lore"`: if a caller passes
 * only `buildSeoTitle("Katie Prairie")`, JavaScript automatically uses `"RaggieSoft Lore"`.
 * It tries progressive fallbacks from fullest suffix -> shorter suffix -> bare subject ->
 * 57-char slice + ellipsis (`…`).
 */
export function buildSeoTitle(subject: string, suffix = "RaggieSoft Lore"): string {
  const full = `${subject} | ${suffix}`;
  if (full.length <= 60) return full;
  const shortFull = `${subject} | Lore`;
  if (shortFull.length <= 60) return shortFull;
  return subject.length <= 60 ? subject : `${subject.slice(0, 57).trimEnd()}…`;
}

/**
 * Clamps a `<meta name="description">` string cleanly to `<= 155` characters
 * on a natural word boundary (`lastIndexOf(" ")`) so search result snippets never
 * end on half a word or dangling punctuation.
 */
export function buildSeoDescription(desc: string): string {
  // Collapse any newlines or multiple spaces (`\s+`) into single spaces first.
  const clean = (desc || "").replace(/\s+/g, " ").trim();
  if (clean.length <= 155) return clean;
  const cut = clean.slice(0, 152);
  const lastSpace = cut.lastIndexOf(" ");
  // Strip any trailing comma/semicolon/dash right before adding the single-character `…`.
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:—-]+$/, "")}…`;
}
