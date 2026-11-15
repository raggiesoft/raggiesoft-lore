/**
 * @license MIT
 * ============================================================================
 * src/app/places/page.tsx — Places, Campuses, Starships & Transit Gazetteer
 * ============================================================================
 * Architectural Overview:
 * Pre-rendered directory of all canonical settings, universities, transit
 * networks, recording sanctuaries, and deep-space worlds across RaggieSoft.
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
  const places = getPlaces();

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

      <DirectoryFilter
        label="Search Places by Name, Region, Campus, or Transit System"
        placeholder="e.g., CPI, CVTA, Blue Ridge Transit, Caelum-IV, Colonial Theatre…"
        items={items}
        nounPlural="place guides"
      />
    </div>
  );
}
