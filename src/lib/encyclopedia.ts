/**
 * @license MIT
 * ============================================================================
 * src/lib/encyclopedia.ts — Typed Build-Time Accessors for Lore Encyclopedia
 * ============================================================================
 * Architectural Overview:
 * Provides strongly typed accessors over `src/generated/encyclopedia.json`
 * (generated automatically by `scripts/compile-lore-encyclopedia.mjs` during
 * `prebuild`). All Next.js Server Components consume these pure functions at
 * build time so the exported static site requires zero client-side data fetches.
 * ============================================================================
 */

import rawEncyclopedia from "@/generated/encyclopedia.json";

export type NodeGroup = "character" | "band" | "book" | "place" | "organization";

export interface LoreGraphNode {
  id: string;
  slug: string;
  name: string;
  group: NodeGroup;
  val: number;
  href: string;
  externalUrl: string | null;
  externalLabel: string | null;
  summary: string;
  subtitle: string;
}

export interface LoreGraphLink {
  source: string;
  target: string;
  type: string;
  context: string;
}

export interface LoreGraphData {
  nodes: LoreGraphNode[];
  links: LoreGraphLink[];
}

export interface CharacterMilestoneItem {
  title: string;
  url: string;
  date: string;
  location: string;
}

export interface CharacterEraMilestone {
  eraNum: number;
  eraTitle: string;
  items: CharacterMilestoneItem[];
}

export interface CharacterEntry {
  slug: string;
  name: string;
  role: string;
  debutSummary: string;
  shortDescription: string;
  extendedBioMarkdown: string;
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

export interface AlbumSummary {
  slug: string;
  title: string;
  subtitle: string;
  releaseDate: string;
  year: string;
  genre: string;
  trackCount: number;
  coverUrl: string;
  listeningRoomUrl: string;
}

export interface BandMember {
  name: string;
  role: string;
  notes: string;
}

export interface BandLorePillar {
  title: string;
  body: string;
}

export interface BandEntry {
  slug: string;
  errId: string;
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

export interface BookChapterSummary {
  chapNum: number;
  title: string;
  url: string;
  partCount: number;
  parts: BookPartSummary[];
}

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

export interface BackstageDossierLink {
  title: string;
  subtitle: string;
  date: string;
  url: string;
}

export interface BookEntry {
  slug: string;
  title: string;
  coverImage: string;
  heroImage: string;
  heroImageAlt: string;
  debutIntro: string;
  debutSettingNote: string;
  shortDescription: string;
  fullSeriesSynopsis: string;
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
  relatedBands: Array<{ slug: string; name: string; listeningRoomUrl: string }>;
  backstageDossiers: BackstageDossierLink[];
  eras: BookEraSummary[];
}

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

export interface OrganizationEntry {
  slug: string;
  name: string;
  role: string;
  meta: string;
  summary: string;
  shortDescription: string;
  bodyMarkdown: string;
  parentSlug: string | null;
  relatedBookSlugs: string[];
  relatedBandSlugs: string[];
  externalUrl: string | null;
}

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
  isSpoiler: boolean;
}

export interface TimelineBucket {
  id: string;
  label: string;
  debutEvents: TimelineEventItem[];
  spoilerEvents: TimelineEventItem[];
}

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

const encyclopedia = rawEncyclopedia as unknown as EncyclopediaPayload;

export function getEncyclopedia(): EncyclopediaPayload {
  return encyclopedia;
}

export function getCharacters(): CharacterEntry[] {
  return encyclopedia.characters;
}

export function getCharacterBySlug(slug: string): CharacterEntry | undefined {
  return encyclopedia.characters.find((c) => c.slug === slug);
}

export function getBands(): BandEntry[] {
  return encyclopedia.bands;
}

export function getBandBySlug(slug: string): BandEntry | undefined {
  return encyclopedia.bands.find((b) => b.slug === slug);
}

export function getBooks(): BookEntry[] {
  return encyclopedia.books;
}

export function getBookBySlug(slug: string): BookEntry | undefined {
  return encyclopedia.books.find((b) => b.slug === slug);
}

export function getPlaces(): PlaceEntry[] {
  return encyclopedia.places;
}

export function getPlaceBySlug(slug: string): PlaceEntry | undefined {
  return encyclopedia.places.find((p) => p.slug === slug);
}

export function getOrganizations(): OrganizationEntry[] {
  return encyclopedia.organizations;
}

export function getOrganizationBySlug(slug: string): OrganizationEntry | undefined {
  return encyclopedia.organizations.find((o) => o.slug === slug);
}

export function getTimelineBuckets(): TimelineBucket[] {
  return encyclopedia.timeline;
}

/**
 * Enriches an SEO `<title>` while keeping it strictly <= 60 characters for
 * clean search result display across Google, Bing, and social cards.
 */
export function buildSeoTitle(subject: string, suffix = "RaggieSoft Lore"): string {
  const full = `${subject} | ${suffix}`;
  if (full.length <= 60) return full;
  const shortFull = `${subject} | Lore`;
  if (shortFull.length <= 60) return shortFull;
  return subject.length <= 60 ? subject : `${subject.slice(0, 57).trimEnd()}…`;
}

/**
 * Clamps a meta description cleanly to <= 155 characters on a word boundary.
 */
export function buildSeoDescription(desc: string): string {
  const clean = (desc || "").replace(/\s+/g, " ").trim();
  if (clean.length <= 155) return clean;
  const cut = clean.slice(0, 152);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:—-]+$/, "")}…`;
}
