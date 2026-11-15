/**
 * @license MIT
 * ============================================================================
 * src/app/books/page.tsx — Ocean View Archives Book Series Encyclopedia
 * ============================================================================
 * Architectural Overview:
 * Pre-rendered directory of all 30 public Ocean View Archives novel series,
 * opening with spoiler-safe Era 1 premises and linking directly to RaggieSoft
 * Book Reader (`https://books.raggiesoft.com/<slug>`).
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
  const books = getBooks();

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

      <DirectoryFilter
        label="Search Book Series by Title, Setting, or Opening Premise"
        placeholder="e.g., Katie & Nathaniel, The Stardust Engine, Ad Astra, Aubrie…"
        items={items}
        nounPlural="book series guides"
      />
    </div>
  );
}
