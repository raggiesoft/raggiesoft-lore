/**
 * @license MIT
 * ============================================================================
 * src/app/books/page.tsx — Ocean View Archives Book Series Encyclopedia
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT THIS FILE IS: File-based Next.js App Router page for `/books`
 *     (`https://lore.raggiesoft.com/books`).
 *   - WHEN IT RUNS: Build-time **React Server Component** (`next build` renders
 *     all 30 public Ocean View Archives book series cards directly into static HTML).
 *   - WHAT DATA FEEDS INTO IT: Calls `getBooks()` from `src/lib/encyclopedia.ts`,
 *     reading spoiler-safe `debutIntro` premises and Era/Chapter counts compiled
 *     from each series' `toc.json` and XML sitemaps.
 *   - WHAT UI IT PRODUCES: Breadcrumb navigation, accessible `<header>`, and
 *     `<DirectoryFilter />` so readers can browse or search all 30 novel series
 *     without hitting late-series plot spoilers, with direct links into
 *     RaggieSoft Book Reader (`https://books.raggiesoft.com/<slug>`).
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  buildSeoDescription,
  buildSeoTitle,
  getBooks,
} from "@/lib/encyclopedia";
import DirectoryFilter, {
  type DirectoryCardItem,
} from "@/components/DirectoryFilter";

// Format clamped `<title>` (<= 60 chars) and `<meta name="description">` (<= 155 chars).
const title = buildSeoTitle("Ocean View Archives Book Guides");
const description = buildSeoDescription(
  "Browse spoiler-safe reading guides, Era 1 premises, character links, and chapter outlines for all 30 Ocean View Archives novel series."
);

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/books" },
  openGraph: {
    title,
    description,
    url: "https://lore.raggiesoft.com/books",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function BooksIndexPage() {
  // Fetch all 30 public book series synchronously at build time.
  const books = getBooks();

  // Map each `BookEntry` (`bk`) into a `DirectoryCardItem`.
  // Notice `[ ... ].filter(Boolean).join(" • ")` on `subtitle`:
  // If `bk.dateSpan` is an empty string `""`, `.filter(Boolean)` drops it cleanly
  // so we never end up with a trailing `" • "` separator!
  const items: DirectoryCardItem[] = books.map((bk) => ({
    slug: bk.slug,
    href: `/books/${bk.slug}`,
    title: bk.title,
    badgeSymbol: "■",
    badgeText: bk.stats.scaleLabel,
    subtitle: [
      `${bk.stats.eraCount} ${bk.stats.eraCount === 1 ? "Era" : "Eras"}`,
      `${bk.stats.chapterCount} Chapters`,
      bk.dateSpan || "",
    ]
      .filter(Boolean)
      .join(" • "),
    description: bk.debutIntro,
    externalUrl: bk.bookReaderUrl,
    externalLabel: "Open in Book Reader",
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
            Books
          </li>
        </ol>
      </nav>

      {/* Page Header with single `<h1>` */}
      <header className="space-y-3">
        <span className="lore-pill">
          <span aria-hidden="true">■</span>
          <span>Ocean View Archives • {books.length} Novel Series</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Book Series &amp; Reading Guides
        </h1>
        <p
          className="text-base max-w-3xl leading-relaxed"
          style={{ color: "var(--lore-text-muted)" }}
        >
          Every guide below presents the spoiler-safe opening chapter premise
          first, with full multi-era outlines tucked behind collapsible spoiler
          controls and direct links to read for free in{" "}
          <a href="https://books.raggiesoft.com" className="lore-link font-semibold">
            RaggieSoft Book Reader
          </a>
          .
        </p>
      </header>

      {/* Progressive-enhancement live search + static HTML card grid */}
      <DirectoryFilter
        label="Search Book Series by Title, Setting, or Opening Premise"
        placeholder="e.g., Katie & Nathaniel, The Stardust Engine, Ad Astra, Aubrie…"
        items={items}
        nounPlural="book series guides"
      />
    </div>
  );
}
