/**
 * @license MIT
 * ============================================================================
 * src/app/bands/page.tsx — Engine Room Records Bands & Artists Encyclopedia
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT THIS FILE IS: In Next.js 16 App Router, placing `page.tsx` inside
 *     `src/app/bands/` creates the `/bands` URL (`https://lore.raggiesoft.com/bands`).
 *   - WHEN IT RUNS: Build-time **React Server Component** (no `"use client"`).
 *     During `next build`, this function runs in Node.js to pre-render all 8
 *     Engine Room Records artist cards directly into `out/bands.html` (or
 *     `out/bands/index.html`).
 *   - WHAT DATA FEEDS INTO IT: Calls `getBands()` from `src/lib/encyclopedia.ts`,
 *     reading the pre-compiled roster from `src/generated/encyclopedia.json`.
 *   - WHAT UI IT PRODUCES: Breadcrumb navigation, an accessible page `<header>`,
 *     and our progressive-enhancement `<DirectoryFilter />` grid—letting visitors
 *     browse every band in static HTML and filter live by name, genre, or hometown
 *     in the browser, with direct links to stream in The Listening Room.
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  buildSeoDescription,
  buildSeoTitle,
  getBands,
} from "@/lib/encyclopedia";
import DirectoryFilter, {
  type DirectoryCardItem,
} from "@/components/DirectoryFilter";

// Compute clamped SEO `<title>` (<= 60 chars) and `<meta name="description">` (<= 155 chars)
// once at module evaluation time during `next build`.
const title = buildSeoTitle("Bands & Musical Ensembles");
const description = buildSeoDescription(
  "Explore all 8 fictional bands and ensembles on the Engine Room Records roster, their members, story origins, and complete 40-album discography."
);

// Next.js reads `export const metadata` to populate `<head>` tags and OpenGraph / Twitter cards.
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/bands" },
  openGraph: {
    title,
    description,
    url: "https://lore.raggiesoft.com/bands",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function BandsIndexPage() {
  // Load all 8 Engine Room Records artist entries synchronously at build time.
  const bands = getBands();

  // Transform each `BandEntry` (`b`) into the uniform `DirectoryCardItem` shape
  // expected by `<DirectoryFilter />` using `Array.prototype.map()`.
  // Notice the JavaScript ternary operator `b.albums.length === 1 ? "Release" : "Releases"`:
  // that inline `condition ? ifTrue : ifFalse` expression keeps grammar accurate ("1 Release" vs "5 Releases").
  const items: DirectoryCardItem[] = bands.map((b) => ({
    slug: b.slug,
    href: `/bands/${b.slug}`,
    title: b.name,
    badgeSymbol: "◆",
    badgeText: `${b.albums.length} ${b.albums.length === 1 ? "Release" : "Releases"}`,
    subtitle: `${b.primaryGenre} • ${b.origin}`,
    description: b.summary,
    externalUrl: b.listeningRoomUrl,
    externalLabel: "Stream in Listening Room",
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Breadcrumb Landmark (`<ol>` ordered list + `aria-current="page"` on active item) */}
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-2 list-none p-0 m-0">
          <li>
            <Link href="/" className="lore-link">
              Lore Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold">
            Bands &amp; Music
          </li>
        </ol>
      </nav>

      {/* Page Hero Header with single `<h1>` */}
      <header className="space-y-3">
        <span className="lore-pill">
          <span aria-hidden="true">◆</span>
          <span>Engine Room Records Roster • {bands.length} Artists</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Bands, Ensembles &amp; Discography Lore
        </h1>
        <p
          className="text-base max-w-3xl leading-relaxed"
          style={{ color: "var(--lore-text-muted)" }}
        >
          Every band and ensemble in the RaggieSoft universe pairs a rich
          in-universe story history with real-world albums you can stream with
          synchronized lyrics in{" "}
          <a href="https://music.raggiesoft.com" className="lore-link font-semibold">
            The Listening Room
          </a>
          .
        </p>
      </header>

      {/* Client Component Island: pre-renders all 8 band cards in static HTML at build time,
          then enables instant `<search>` filtering in the visitor's browser. */}
      <DirectoryFilter
        label="Search Bands by Name, Genre, Hometown, or Member"
        placeholder="e.g., The Stardust Engine, Fractured Prisms, Synth-Rock, Blacksburg…"
        items={items}
        nounPlural="band profiles"
      />
    </div>
  );
}
