/**
 * @license MIT
 * ============================================================================
 * src/app/characters/page.tsx — Static Character Encyclopedia Directory
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT THIS FILE IS: File-based Next.js App Router page for `/characters`
 *     (`https://lore.raggiesoft.com/characters`).
 *   - WHEN IT RUNS: Build-time **React Server Component** (`next build` renders
 *     all protagonist, twin, musician, and chosen-family cards directly into
 *     static HTML).
 *   - WHAT DATA FEEDS INTO IT: Calls `getCharacters()` from `src/lib/encyclopedia.ts`,
 *     reading spoiler-safe `debutSummary` introductions and debut Book Reader links.
 *   - WHAT UI IT PRODUCES: Breadcrumb navigation, accessible `<header>`, and
 *     `<DirectoryFilter />` so visitors can browse every character profile in
 *     static HTML or search instantaneously in the browser.
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  buildSeoDescription,
  buildSeoTitle,
  getCharacters,
} from "@/lib/encyclopedia";
import DirectoryFilter, {
  type DirectoryCardItem,
} from "@/components/DirectoryFilter";

// Prepare SEO `<title>` (<= 60 chars) and `<meta name="description">` (<= 155 chars).
const title = buildSeoTitle("Characters & Protagonists");
const description = buildSeoDescription(
  "Meet the protagonists, twins, musicians, and chosen families across Ocean View Archives novels and Engine Room Records bands."
);

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/characters" },
  openGraph: {
    title,
    description,
    url: "https://lore.raggiesoft.com/characters",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function CharactersIndexPage() {
  // Read all compiled `CharacterEntry` profiles synchronously at build time.
  const characters = getCharacters();

  // Convert each `CharacterEntry` (`c`) into a uniform `DirectoryCardItem` object.
  // Notice the JavaScript `||` ("logical OR fallback") operator:
  // `c.firstAppearanceUrl || c.primaryBookUrl` picks `firstAppearanceUrl` if present,
  // or falls back to `primaryBookUrl` if `firstAppearanceUrl` is `null` or empty.
  const items: DirectoryCardItem[] = characters.map((c) => ({
    slug: c.slug,
    href: `/characters/${c.slug}`,
    title: c.name,
    badgeSymbol: "●",
    badgeText: c.primaryBookTitle || "Universe Character",
    subtitle: c.role,
    description: c.debutSummary,
    externalUrl: c.firstAppearanceUrl || c.primaryBookUrl,
    externalLabel: "Read Debut",
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Breadcrumb Trail */}
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-2 list-none p-0 m-0">
          <li>
            <Link href="/" className="lore-link">
              Lore Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold">
            Characters
          </li>
        </ol>
      </nav>

      {/* Page Hero Header with single `<h1>` */}
      <header className="space-y-3">
        <span className="lore-pill">
          <span aria-hidden="true">●</span>
          <span>Character Directory • {characters.length} Profiles</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Characters &amp; Chosen Families
        </h1>
        <p
          className="text-base max-w-3xl leading-relaxed"
          style={{ color: "var(--lore-text-muted)" }}
        >
          Every profile below opens with a spoiler-safe debut introduction so you
          can meet each protagonist, sibling pair, or band member at the start of
          their journey before opening later storyline milestones.
        </p>
      </header>

      {/* Progressive-enhancement `<search>` bar + static HTML card grid */}
      <DirectoryFilter
        label="Search Characters by Name, Series, Band, or Role"
        placeholder="e.g., Ryan O'Connell, Katie Prairie, Claire Manning, Jordan…"
        items={items}
        nounPlural="character profiles"
      />
    </div>
  );
}
