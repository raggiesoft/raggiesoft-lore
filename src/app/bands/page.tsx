/**
 * @license MIT
 * ============================================================================
 * src/app/bands/page.tsx — Engine Room Records Bands & Artists Encyclopedia
 * ============================================================================
 * Architectural Overview:
 * Pre-rendered directory of all 8 Engine Room Records artists and ensembles,
 * linking directly to their Lore Encyclopedia profiles and The Listening Room.
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

const title = buildSeoTitle("Bands & Musical Ensembles");
const description = buildSeoDescription(
  "Explore all 8 fictional bands and ensembles on the Engine Room Records roster, their members, story origins, and complete 40-album discography."
);

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
  const bands = getBands();

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

      <DirectoryFilter
        label="Search Bands by Name, Genre, Hometown, or Member"
        placeholder="e.g., The Stardust Engine, Fractured Prisms, Synth-Rock, Blacksburg…"
        items={items}
        nounPlural="band profiles"
      />
    </div>
  );
}
