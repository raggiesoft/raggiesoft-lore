/**
 * @license MIT
 * ============================================================================
 * src/app/bands/[slug]/page.tsx — Static Band Lore Profile & Album Guide
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT `[slug]` IN THE FOLDER NAME MEANS: In Next.js App Router, wrapping a
 *     folder name in square brackets (`[slug]`) creates a **Dynamic Route Segment**!
 *     Instead of hand-writing 8 separate files for 8 bands, this single template
 *     generates `/bands/the-stardust-engine`, `/bands/fractured-prisms`,
 *     `/bands/firelight`, and all other band pages automatically.
 *   - WHEN IT RUNS: Build-time **React Server Component** (`output: "export"`).
 *     During `next build`, Next.js calls `generateStaticParams()` to get the list
 *     of all 8 band slugs, then runs `generateMetadata()` and `BandDetailPage()`
 *     once for each slug to write 8 finished static `.html` files into `out/bands/`.
 *   - WHAT DATA FEEDS INTO IT: Looks up the band via `getBandBySlug(slug)` and
 *     resolves cross-references to companion Books (`getBookBySlug`), Characters
 *     (`getCharacters`), and Sanctuary Places (`getPlaceBySlug`).
 *   - WHAT UI & STRUCTURED DATA IT PRODUCES:
 *       1. Schema.org `BreadcrumbList` + `MusicGroup` + `MusicAlbum` JSON-LD
 *       2. Band Hero Card with semantic `<dl>` (Description List) stats & stream buttons
 *       3. Signature Sound, Member Roster cards, Lore Pillars, Complete Discography
 *          deep links into `https://music.raggiesoft.com/<artist>/<album>`, and
 *          cross-linked Books, Characters, and Places.
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildSeoDescription,
  buildSeoTitle,
  getBandBySlug,
  getBands,
  getBookBySlug,
  getCharacters,
  getPlaceBySlug,
} from "@/lib/encyclopedia";

// `dynamicParams = false` locks this route strictly to the slugs returned by
// `generateStaticParams()` below—any unknown `/bands/xyz` URL serves a clean 404.
export const dynamicParams = false;

/**
 * Next.js Static Export Hook #1 (`generateStaticParams`):
 * Tells `next build` every `{ slug }` parameter value it must pre-render into
 * static HTML (e.g., `[{ slug: "the-stardust-engine" }, { slug: "fractured-prisms" }, ...]`).
 */
export function generateStaticParams() {
  return getBands().map((b) => ({ slug: b.slug }));
}

/**
 * Next.js Static Export Hook #2 (`generateMetadata`):
 * Runs at build time for each `{ slug }` to generate that band's unique `<title>`,
 * `<meta name="description">`, canonical URL, and OpenGraph / Twitter preview card.
 *
 * Note on `async` / `await` & `params: Promise<{ slug: string }>`:
 * In Next.js 15/16, route `params` is passed as an asynchronous JavaScript `Promise`,
 * so we write `const { slug } = await params;` to unwrap the `slug` string cleanly.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const band = getBandBySlug(slug);
  if (!band) return { title: "Band Not Found | RaggieSoft Lore" };

  const title = buildSeoTitle(`${band.name} — Lore & Discography`);
  const description = buildSeoDescription(band.shortDescription);
  const canonicalUrl = `https://lore.raggiesoft.com/bands/${band.slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/bands/${band.slug}` },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: [{ url: band.image, alt: band.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [band.image],
    },
  };
}

export default async function BandDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // 1. Unwrap the URL's `[slug]` parameter and look up the matching `BandEntry`.
  const { slug } = await params;
  const band = getBandBySlug(slug);
  // If `band` is `undefined`, `notFound()` halts rendering immediately and serves
  // `src/app/not-found.tsx` (and tells TypeScript that `band` is guaranteed non-null below!).
  if (!band) notFound();

  // 2. Resolve relational cross-links from string slugs into full typed objects.
  // The `.filter((b): b is NonNullable<typeof b> => Boolean(b))` pattern removes
  // any `undefined` lookups AND narrows TypeScript's array type cleanly!
  const relatedBooks = band.relatedBookSlugs
    .map((s) => getBookBySlug(s))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));
  const relatedPlaces = band.relatedPlaceSlugs
    .map((s) => getPlaceBySlug(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const relatedCharacters = getCharacters().filter((c) =>
    c.bandSlugs.includes(band.slug)
  );

  // Collect verified external companion URLs for Schema.org `sameAs` entity linking.
  const sameAsLinks = [
    band.listeningRoomUrl,
    band.imprintUrl,
    band.bookReaderUrl,
  ].filter((u): u is string => Boolean(u));

  // 3. Build Schema.org JSON-LD (`BreadcrumbList` + `MusicGroup` with `Person` members & `MusicAlbum`s)
  // so search engines understand the band's lineup and discography relationships.
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
            name: "Bands & Music",
            item: "https://lore.raggiesoft.com/bands",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: band.name,
            item: `https://lore.raggiesoft.com/bands/${band.slug}`,
          },
        ],
      },
      {
        "@type": "MusicGroup",
        "@id": `https://lore.raggiesoft.com/bands/${band.slug}#musicgroup`,
        name: band.name,
        url: `https://lore.raggiesoft.com/bands/${band.slug}`,
        description: band.summary,
        genre: band.primaryGenre,
        image: band.image,
        sameAs: sameAsLinks,
        member: band.members.map((m) => ({
          "@type": "Person",
          name: m.name,
          roleName: m.role,
        })),
        album: band.albums.map((a) => ({
          "@type": "MusicAlbum",
          name: a.title,
          url: a.listeningRoomUrl,
          numTracks: a.trackCount,
        })),
      },
    ],
  };

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      {/* Embed Schema.org JSON-LD inside `<article>` for crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Trail (`Lore Home / Bands & Music / <Band Name>`) */}
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-2 list-none p-0 m-0">
          <li>
            <Link href="/" className="lore-link">
              Lore Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/bands" className="lore-link">
              Bands &amp; Music
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold">
            {band.name}
          </li>
        </ol>
      </nav>

      {/* Band Hero Card: Category Pills + Single Page `<h1>` + `<dl>` Key Facts + Action Links */}
      <header className="lore-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="lore-pill">
            <span aria-hidden="true">◆</span>
            <span>Engine Room Records Artist ({band.errId})</span>
          </span>
          <span className="lore-pill">
            <span>{band.primaryGenre}</span>
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {band.name}
          </h1>
          {band.tagline && (
            <p
              className="text-base sm:text-lg font-semibold"
              style={{ color: "var(--lore-text-muted)" }}
            >
              {band.tagline}
            </p>
          )}
        </div>

        <p className="text-base leading-relaxed">{band.summary}</p>

        {/* HTML `<dl>` ("Description List") pairs `<dt>` (term label) with `<dd>` (value)
            so screen readers announce label-value pairs semantically! */}
        <dl
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t text-sm"
          style={{ borderColor: "var(--lore-border-subtle)" }}
        >
          <div>
            <dt className="font-semibold" style={{ color: "var(--lore-text-muted)" }}>
              Origin &amp; Home Sanctuary
            </dt>
            <dd className="font-bold mt-0.5">{band.origin}</dd>
          </div>
          <div>
            <dt className="font-semibold" style={{ color: "var(--lore-text-muted)" }}>
              Story Era Span
            </dt>
            <dd className="font-bold mt-0.5">{band.yearsActive}</dd>
          </div>
          <div>
            <dt className="font-semibold" style={{ color: "var(--lore-text-muted)" }}>
              Catalog Releases
            </dt>
            <dd className="font-bold mt-0.5">
              {band.albums.length} {band.albums.length === 1 ? "Album" : "Albums"}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3 pt-2">
          <a href={band.listeningRoomUrl} className="lore-btn-primary text-sm">
            🎧 Stream {band.name} in The Listening Room ↗
          </a>
          {band.imprintUrl && (
            <a href={band.imprintUrl} className="lore-btn-secondary text-sm">
              ⚙️ Official Imprint Profile ↗
            </a>
          )}
          {band.bookReaderUrl && (
            <a href={band.bookReaderUrl} className="lore-btn-secondary text-sm">
              📚 Read Companion Novel ↗
            </a>
          )}
        </div>
      </header>

      {/* Musical Identity Section (rendered conditionally when `band.musicalStyle` is non-empty) */}
      {band.musicalStyle && (
        <section aria-labelledby="musical-sound-heading" className="lore-card p-6 space-y-2">
          <h2 id="musical-sound-heading" className="text-xl font-bold">
            Signature Sound &amp; Studio Craft
          </h2>
          <p className="text-sm sm:text-base leading-relaxed">{band.musicalStyle}</p>
        </section>
      )}

      {/* Band Members Grid */}
      {band.members.length > 0 && (
        <section aria-labelledby="band-members-heading" className="space-y-4">
          <h2 id="band-members-heading" className="text-2xl font-bold">
            Lineup &amp; Ensemble Members
          </h2>
          <ul
            role="list"
            className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0"
          >
            {band.members.map((m) => (
              <li key={m.name} className="lore-card p-5 space-y-1.5">
                <h3 className="text-lg font-bold">{m.name}</h3>
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--lore-text-muted)" }}
                >
                  {m.role}
                </p>
                <p className="text-sm leading-relaxed">{m.notes}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Thematic Worldbuilding Lore Pillars */}
      {band.lorePillars.length > 0 && (
        <section aria-labelledby="lore-pillars-heading" className="space-y-4">
          <h2 id="lore-pillars-heading" className="text-2xl font-bold">
            Story Origins &amp; Sanctuary Lore
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {band.lorePillars.map((pillar) => (
              <div key={pillar.title} className="lore-card p-5 space-y-2">
                <h3 className="text-lg font-bold">{pillar.title}</h3>
                <p className="text-sm leading-relaxed">{pillar.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Complete Discography Deep Links (`https://music.raggiesoft.com/<artist>/<album>`) */}
      {band.albums.length > 0 && (
        <section aria-labelledby="discography-heading" className="space-y-4">
          <h2 id="discography-heading" className="text-2xl font-bold">
            Discography ({band.albums.length}{" "}
            {band.albums.length === 1 ? "Release" : "Releases"})
          </h2>
          <ul
            role="list"
            className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0"
          >
            {band.albums.map((album) => (
              <li
                key={album.slug}
                className="lore-card p-5 flex flex-col justify-between gap-3"
              >
                <div>
                  <span className="lore-pill mb-2">
                    <span>{album.year || "Release"}</span>
                    {album.trackCount > 0 && <span>• {album.trackCount} Tracks</span>}
                  </span>
                  <h3 className="text-lg font-bold">
                    <a href={album.listeningRoomUrl} className="lore-link">
                      {album.title} ↗
                    </a>
                  </h3>
                  {album.subtitle && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--lore-text-muted)" }}
                    >
                      {album.subtitle}
                    </p>
                  )}
                </div>
                <div>
                  <a
                    href={album.listeningRoomUrl}
                    className="lore-link text-sm font-semibold"
                  >
                    Listen &amp; Read Lyrics in The Listening Room ↗
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Connected Books, Characters, and Places across the Lore Encyclopedia
          (`.sr-only` `<h2>` names the `<section>` landmark for screen readers while
          keeping `<h3>` column cards visually balanced). */}
      {(relatedBooks.length > 0 ||
        relatedCharacters.length > 0 ||
        relatedPlaces.length > 0) && (
        <section
          aria-labelledby="band-connections-heading"
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          <h2 id="band-connections-heading" className="sr-only">
            Connected Books, Characters &amp; Places
          </h2>

          {relatedBooks.length > 0 && (
            <div className="lore-card p-5 space-y-2.5">
              <h3 className="text-base font-bold">■ Companion Book Series</h3>
              <ul role="list" className="space-y-2 text-sm list-none p-0 m-0">
                {relatedBooks.map((bk) => (
                  <li key={bk.slug}>
                    <Link href={`/books/${bk.slug}`} className="lore-link font-semibold">
                      {bk.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {relatedCharacters.length > 0 && (
            <div className="lore-card p-5 space-y-2.5">
              <h3 className="text-base font-bold">● Character Profiles</h3>
              <ul role="list" className="space-y-2 text-sm list-none p-0 m-0">
                {relatedCharacters.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/characters/${c.slug}`} className="lore-link font-semibold">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {relatedPlaces.length > 0 && (
            <div className="lore-card p-5 space-y-2.5">
              <h3 className="text-base font-bold">▲ Studios &amp; Sanctuaries</h3>
              <ul role="list" className="space-y-2 text-sm list-none p-0 m-0">
                {relatedPlaces.map((pl) => (
                  <li key={pl.slug}>
                    <Link href={`/places/${pl.slug}`} className="lore-link font-semibold">
                      {pl.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </article>
  );
}
