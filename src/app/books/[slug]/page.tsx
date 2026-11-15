/**
 * @license MIT
 * ============================================================================
 * src/app/books/[slug]/page.tsx — Static Book Series Guide & Spoiler Horizon
 * ============================================================================
 * Architectural Overview:
 * Pre-rendered Ocean View Archives series guide (`output: "export"`).
 * Enforces the Spoiler Horizon:
 *   - Top of page: Era 1 / Part 1 opening premise, reading stats, protagonists,
 *     companion bands, Backstage archival dossiers, and Era 1 chapters.
 *   - Collapsible `<details>` disclosure: Full multi-era series synopsis and
 *     Era 2+ chapter/part outlines.
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildSeoDescription,
  buildSeoTitle,
  getBookBySlug,
  getBooks,
  getCharacters,
  getPlaces,
} from "@/lib/encyclopedia";

export const dynamicParams = false;

export function generateStaticParams() {
  return getBooks().map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) return { title: "Book Not Found | RaggieSoft Lore" };

  const title = buildSeoTitle(`${book.title} — Lore & Reading Guide`);
  const description = buildSeoDescription(book.shortDescription);
  const canonicalUrl = `https://lore.raggiesoft.com/books/${book.slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "book",
      images: [{ url: book.heroImage, alt: book.heroImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [book.heroImage],
    },
  };
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) notFound();

  const protagonists = getCharacters().filter(
    (c) => c.primaryBookSlug === book.slug
  );
  const relatedPlaces = getPlaces().filter((p) =>
    p.relatedBookSlugs.includes(book.slug)
  );

  const eraOne = book.eras.find((e) => e.eraNum === 1) || book.eras[0] || null;
  const laterEras = book.eras.filter((e) => e !== eraOne);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Lore Home",
            item: "https://lore.raggiesoft.com/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Books",
            item: "https://lore.raggiesoft.com/books",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: book.title,
            item: `https://lore.raggiesoft.com/books/${book.slug}`,
          },
        ],
      },
      {
        "@type": "BookSeries",
        "@id": `https://lore.raggiesoft.com/books/${book.slug}#bookseries`,
        name: book.title,
        url: `https://lore.raggiesoft.com/books/${book.slug}`,
        sameAs: [book.bookReaderUrl, book.tocUrl],
        description: book.shortDescription,
        image: book.coverImage,
        author: {
          "@type": "Person",
          "@id": "https://michaelpragsdale.com/#michael-ragsdale",
          name: "Michael P. Ragsdale",
          url: "https://michaelpragsdale.com",
        },
        publisher: {
          "@type": "Organization",
          name: "Ocean View Archives (RaggieSoft)",
          url: "https://books.raggiesoft.com",
        },
        license: "https://creativecommons.org/licenses/by-sa/4.0/",
      },
    ],
  };

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-2 list-none p-0 m-0">
          <li>
            <Link href="/" className="lore-link">
              Lore Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/books" className="lore-link">
              Books
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold">
            {book.title}
          </li>
        </ol>
      </nav>

      {/* Spoiler-Safe Opening Hero */}
      <header className="lore-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="lore-pill">
            <span aria-hidden="true">■</span>
            <span>Ocean View Archives • {book.stats.scaleLabel}</span>
          </span>
          {book.dateSpan && (
            <span className="lore-pill">
              <span>Timeline: {book.dateSpan}</span>
            </span>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {book.title}
          </h1>
          {book.debutSettingNote && (
            <p
              className="text-sm sm:text-base font-semibold"
              style={{ color: "var(--lore-text-muted)" }}
            >
              {book.debutSettingNote}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Spoiler-Free Opening Premise
          </h2>
          <p className="text-base leading-relaxed">{book.debutIntro}</p>
        </div>

        <dl
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t text-sm"
          style={{ borderColor: "var(--lore-border-subtle)" }}
        >
          <div>
            <dt className="font-semibold" style={{ color: "var(--lore-text-muted)" }}>
              Story Eras
            </dt>
            <dd className="font-bold mt-0.5">{book.stats.eraCount}</dd>
          </div>
          <div>
            <dt className="font-semibold" style={{ color: "var(--lore-text-muted)" }}>
              Chapters / Parts
            </dt>
            <dd className="font-bold mt-0.5">
              {book.stats.chapterCount} / {book.stats.partCount}
            </dd>
          </div>
          <div>
            <dt className="font-semibold" style={{ color: "var(--lore-text-muted)" }}>
              Estimated Reading Time
            </dt>
            <dd className="font-bold mt-0.5">~{book.stats.readingHours} hrs</dd>
          </div>
          <div>
            <dt className="font-semibold" style={{ color: "var(--lore-text-muted)" }}>
              Scene Illustrations
            </dt>
            <dd className="font-bold mt-0.5">{book.stats.illustrationCount}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3 pt-2">
          <a href={book.firstChapterUrl} className="lore-btn-primary text-sm">
            📖 Start Reading Opening Chapter ↗
          </a>
          <a href={book.bookReaderUrl} className="lore-btn-secondary text-sm">
            📚 Series Hub in Book Reader ↗
          </a>
          <a href={book.tocUrl} className="lore-btn-secondary text-sm">
            🗂️ Full Table of Contents ↗
          </a>
        </div>
      </header>

      {/* Connected Characters, Bands, Places & Backstage Dossiers */}
      {(protagonists.length > 0 ||
        book.relatedBands.length > 0 ||
        relatedPlaces.length > 0 ||
        book.backstageDossiers.length > 0) && (
        <section
          aria-labelledby="series-connections-heading"
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <h2 id="series-connections-heading" className="sr-only">
            Characters, Bands, Settings &amp; Backstage Dossiers
          </h2>

          {protagonists.length > 0 && (
            <div className="lore-card p-5 space-y-2.5">
              <h3 className="text-base font-bold">● Central Protagonists</h3>
              <ul role="list" className="space-y-2 text-sm list-none p-0 m-0">
                {protagonists.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/characters/${c.slug}`} className="lore-link font-semibold">
                      {c.name}
                    </Link>
                    <span
                      className="block text-xs"
                      style={{ color: "var(--lore-text-muted)" }}
                    >
                      {c.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {book.relatedBands.length > 0 && (
            <div className="lore-card p-5 space-y-2.5">
              <h3 className="text-base font-bold">◆ Companion Music &amp; Bands</h3>
              <ul role="list" className="space-y-2 text-sm list-none p-0 m-0">
                {book.relatedBands.map((b) => (
                  <li key={b.slug} className="flex items-center justify-between gap-2">
                    <Link href={`/bands/${b.slug}`} className="lore-link font-semibold">
                      {b.name}
                    </Link>
                    <a href={b.listeningRoomUrl} className="lore-link text-xs">
                      Stream ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {relatedPlaces.length > 0 && (
            <div className="lore-card p-5 space-y-2.5">
              <h3 className="text-base font-bold">▲ Featured Settings &amp; Transit</h3>
              <ul role="list" className="space-y-2 text-sm list-none p-0 m-0">
                {relatedPlaces.map((pl) => (
                  <li key={pl.slug}>
                    <Link href={`/places/${pl.slug}`} className="lore-link font-semibold">
                      {pl.name}
                    </Link>
                    <span
                      className="block text-xs"
                      style={{ color: "var(--lore-text-muted)" }}
                    >
                      {pl.region}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {book.backstageDossiers.length > 0 && (
            <div className="lore-card p-5 space-y-2.5">
              <h3 className="text-base font-bold">🎟️ Backstage Archival Dossiers</h3>
              <ul role="list" className="space-y-2 text-sm list-none p-0 m-0">
                {book.backstageDossiers.map((d) => (
                  <li key={d.url}>
                    <a href={d.url} className="lore-link font-semibold">
                      {d.title} ↗
                    </a>
                    {d.subtitle && (
                      <span
                        className="block text-xs"
                        style={{ color: "var(--lore-text-muted)" }}
                      >
                        {d.subtitle}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Era 1 Opening Chapters (Visible Without Spoilers) */}
      {eraOne && (
        <section aria-labelledby="era-one-heading" className="space-y-4">
          <h2 id="era-one-heading" className="text-2xl font-bold">
            Opening Era — Era {eraOne.eraNum}: {eraOne.title}
          </h2>
          <div className="lore-card p-5 space-y-4">
            {eraOne.dateSpan && (
              <p className="text-xs font-semibold" style={{ color: "var(--lore-text-muted)" }}>
                Dates: {eraOne.dateSpan}
              </p>
            )}
            <ul
              role="list"
              className="grid grid-cols-1 md:grid-cols-2 gap-3 list-none p-0 m-0 text-sm"
            >
              {eraOne.chapters.map((ch) => (
                <li
                  key={ch.url}
                  className="p-3.5 rounded-lg border space-y-1"
                  style={{ borderColor: "var(--lore-border-subtle)" }}
                >
                  <a href={ch.url} className="lore-link font-bold block">
                    Chapter {ch.chapNum}: {ch.title} ↗
                  </a>
                  <span
                    className="text-xs block"
                    style={{ color: "var(--lore-text-muted)" }}
                  >
                    {ch.partCount} {ch.partCount === 1 ? "Part" : "Parts"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Spoiler Horizon: Full Multi-Era Synopsis & Era 2+ Outlines */}
      {(laterEras.length > 0 || Boolean(book.fullSeriesSynopsis)) && (
        <section aria-labelledby="spoiler-horizon-heading" className="space-y-4">
          <h2 id="spoiler-horizon-heading" className="text-2xl font-bold">
            Full Multi-Era Series Overview &amp; Later Chapters
          </h2>
          <details className="lore-spoiler">
            <summary>
              Reveal Full Multi-Era Synopsis &amp; Era 2+ Chapter Guide (Contains
              Later Storyline Spoilers)
            </summary>
            <div className="lore-spoiler-body space-y-6">
              {book.fullSeriesSynopsis && (
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">Complete Series Synopsis</h3>
                  <p className="text-sm sm:text-base leading-relaxed">
                    {book.fullSeriesSynopsis}
                  </p>
                </div>
              )}

              {laterEras.map((era) => (
                <div
                  key={era.eraNum}
                  className="pt-4 border-t space-y-3"
                  style={{ borderColor: "var(--lore-border-subtle)" }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-bold">
                      <a href={era.url} className="lore-link">
                        Era {era.eraNum}: {era.title} ↗
                      </a>
                    </h3>
                    {era.dateSpan && (
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "var(--lore-text-muted)" }}
                      >
                        {era.dateSpan}
                      </span>
                    )}
                  </div>
                  <ul
                    role="list"
                    className="grid grid-cols-1 md:grid-cols-2 gap-2.5 list-none p-0 m-0 text-sm"
                  >
                    {era.chapters.map((ch) => (
                      <li
                        key={ch.url}
                        className="p-2.5 rounded-lg border"
                        style={{ borderColor: "var(--lore-border-subtle)" }}
                      >
                        <a href={ch.url} className="lore-link font-semibold">
                          Chapter {ch.chapNum}: {ch.title} ↗
                        </a>
                        <span
                          className="block text-xs"
                          style={{ color: "var(--lore-text-muted)" }}
                        >
                          {ch.partCount} {ch.partCount === 1 ? "Part" : "Parts"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        </section>
      )}
    </article>
  );
}
