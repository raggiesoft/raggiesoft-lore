/**
 * @license MIT
 * ============================================================================
 * src/app/places/page.tsx — Places, Campuses, Starships & Transit Gazetteer
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT THIS FILE IS: File-based Next.js App Router page for `/places`
 *     (`https://lore.raggiesoft.com/places`).
 *   - WHEN IT RUNS: Build-time **React Server Component** (`next build` renders
 *     all canonical campus, city, public transit agency, theatre, and deep-space
 *     gazetteer cards directly into static HTML).
 *   - WHAT DATA FEEDS INTO IT: Calls `getPlaces()` from `src/lib/encyclopedia.ts`,
 *     reading sanitized worldbuilding entries compiled from `universal-lore/*.md`
 *     and curated space/sanctuary profiles.
 *   - WHAT UI IT PRODUCES: Breadcrumb navigation, accessible `<header>`, and
 *     `<DirectoryFilter />` for instant browser search across names, regions,
 *     and transit systems.
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  buildSeoDescription,
  buildSeoTitle,
  getPlaces,
} from "@/lib/encyclopedia";
import DirectoryFilter, {
  type DirectoryCardItem,
} from "@/components/DirectoryFilter";

// Format clamped `<title>` (<= 60 chars) and `<meta name="description">` (<= 155 chars).
const title = buildSeoTitle("Places, Campuses & Transit Networks");
const description = buildSeoDescription(
  "Explore the universities, accessible public transit agencies, sanctuaries, theatres, and deep-space moon Caelum-IV across the RaggieSoft universe."
);

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/places" },
  openGraph: {
    title,
    description,
    url: "https://lore.raggiesoft.com/places",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function PlacesIndexPage() {
  // Fetch all compiled `PlaceEntry` items synchronously at build time.
  const places = getPlaces();

  // Map each `PlaceEntry` (`pl`) into the uniform `DirectoryCardItem` shape for `<DirectoryFilter />`.
  const items: DirectoryCardItem[] = places.map((pl) => ({
    slug: pl.slug,
    href: `/places/${pl.slug}`,
    title: pl.name,
    badgeSymbol: "▲",
    badgeText: pl.kind,
    subtitle: pl.region,
    description: pl.debutNote,
    externalUrl: pl.backstageUrl,
    externalLabel: pl.backstageUrl ? "Backstage Dossier" : null,
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
            Places &amp; Transit
          </li>
        </ol>
      </nav>

      {/* Page Header with single `<h1>` */}
      <header className="space-y-3">
        <span className="lore-pill">
          <span aria-hidden="true">▲</span>
          <span>Universe Gazetteer • {places.length} Locations &amp; Corridors</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Places, Campuses, Starships &amp; Transit Networks
        </h1>
        <p
          className="text-base max-w-3xl leading-relaxed"
          style={{ color: "var(--lore-text-muted)" }}
        >
          From Ironstone walkways at Commonwealth Polytechnic Institute and
          wheelchair-accessible CVTA and Blue Ridge Transit bus routes to the
          purple seas of Caelum-IV, explore the lived-in geography of the
          RaggieSoft universe.
        </p>
      </header>

      {/* Progressive-enhancement `<search>` bar + static HTML card grid */}
      <DirectoryFilter
        label="Search Places by Name, Region, Campus, or Transit System"
        placeholder="e.g., CPI, CVTA, Blue Ridge Transit, Caelum-IV, Colonial Theatre…"
        items={items}
        nounPlural="place guides"
      />
    </div>
  );
}
