/**
 * @license MIT
 * ============================================================================
 * src/app/bands/[slug]/page.tsx — Static Band Lore Profile & Album Guide
 * ============================================================================
 * Architectural Overview:
 * Pre-rendered band encyclopedia entry (`output: "export"`) emitting rich
 * Schema.org `MusicGroup` + `MusicAlbum` structured data, member roster cards,
 * canonical lore pillars, connected novel guides, and direct deep links into
 * `https://music.raggiesoft.com/<artist>/<album>`.
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

export const dynamicParams = false;

export function generateStaticParams() {
  return getBands().map((b) => ({ slug: b.slug }));
}

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
  const { slug } = await params;
  const band = getBandBySlug(slug);
  if (!band) notFound();

  const relatedBooks = band.relatedBookSlugs
    .map((s) => getBookBySlug(s))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));
  const relatedPlaces = band.relatedPlaceSlugs
    .map((s) => getPlaceBySlug(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const relatedCharacters = getCharacters().filter((c) =>
    c.bandSlugs.includes(band.slug)
  );

  const sameAsLinks = [
    band.listeningRoomUrl,
    band.imprintUrl,
    band.bookReaderUrl,
  ].filter((u): u is string => Boolean(u));

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

      {/* Band Hero Card */}
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

      {/* Musical Identity */}
      {band.musicalStyle && (
        <section aria-labelledby="musical-sound-heading" className="lore-card p-6 space-y-2">
          <h2 id="musical-sound-heading" className="text-xl font-bold">
            Signature Sound &amp; Studio Craft
          </h2>
          <p className="text-sm sm:text-base leading-relaxed">{band.musicalStyle}</p>
        </section>
      )}

      {/* Band Members */}
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

      {/* Lore Pillars */}
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

      {/* Complete Discography Deep Links */}
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

      {/* Connected Books, Characters, and Places */}
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
