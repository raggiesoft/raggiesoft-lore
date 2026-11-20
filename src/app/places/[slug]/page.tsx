/**
 * @license MIT
 * ============================================================================
 * src/app/places/[slug]/page.tsx — Static Gazetteer & Transit Guide
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT `[slug]` MEANS: Next.js App Router **Dynamic Route Segment** generating
 *     one static HTML page per setting (`/places/commonwealth-polytechnic-institute`,
 *     `/places/coastal-virginia-transit-cvta`, `/places/uscss-ad-astra-and-caelum-iv`,
 *     etc.) at build time (`output: "export"`).
 *   - WHEN IT RUNS: Build-time **React Server Component** (`next build` pre-renders
 *     all gazetteer guides into `out/places/` with zero client-side JS).
 *   - WHAT DATA FEEDS INTO IT: Looks up `getPlaceBySlug(slug)` and resolves
 *     cross-references to every Book Series (`getBookBySlug`), Band (`getBandBySlug`),
 *     and Character (`getCharacters`) anchored in that setting.
 *   - WHAT UI & METADATA IT PRODUCES: Schema.org `BreadcrumbList` + `Place`
 *     JSON-LD, setting & region pills, cross-linked Book/Character/Band cards,
 *     and sanitized worldbuilding Markdown rendered via `<MarkdownProse />`.
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildSeoDescription,
  buildSeoTitle,
  getBandBySlug,
  getBookBySlug,
  getCharacters,
  getPlaceBySlug,
  getPlaces,
} from "@/lib/encyclopedia";
import MarkdownProse from "@/components/MarkdownProse";

// Only serve slugs returned by `generateStaticParams()` (404 on unknown slugs).
export const dynamicParams = false;

/**
 * Supplies every compiled place `{ slug }` to `next build` for static export.
 */
export function generateStaticParams() {
  return getPlaces().map((p) => ({ slug: p.slug }));
}

/**
 * Builds per-place `<title>`, `<meta name="description">`, canonical URL,
 * and OpenGraph (`type: "article"`) / Twitter social preview tags.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const place = getPlaceBySlug(slug);
  if (!place) return { title: "Place Not Found | RaggieSoft Lore" };

  const title = buildSeoTitle(place.name);
  const description = buildSeoDescription(place.shortDescription);
  const canonicalUrl = `https://lore.raggiesoft.com/places/${place.slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/places/${place.slug}` },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // 1. Unwrap asynchronous `params` and look up the place entry (404 if missing).
  const { slug } = await params;
  const place = getPlaceBySlug(slug);
  if (!place) notFound();

  // 2. Resolve related Books, Bands, and Characters connected to this location.
  const relatedBooks = place.relatedBookSlugs
    .map((s) => getBookBySlug(s))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));
  const relatedBands = place.relatedBandSlugs
    .map((s) => getBandBySlug(s))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));
  const relatedCharacters = getCharacters().filter((c) =>
    c.placeSlugs.includes(place.slug)
  );

  // 3. Build Schema.org `BreadcrumbList` + `Place` structured data for search crawlers.
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
            name: "Places & Transit",
            item: "https://lore.raggiesoft.com/places",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: place.name,
            item: `https://lore.raggiesoft.com/places/${place.slug}`,
          },
        ],
      },
      {
        "@type": "Place",
        "@id": `https://lore.raggiesoft.com/places/${place.slug}#place`,
        name: place.name,
        url: `https://lore.raggiesoft.com/places/${place.slug}`,
        description: place.debutNote,
        address: place.region,
      },
    ],
  };

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Trail (`Lore Home / Places & Transit / <Place Name>`) */}
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-2 list-none p-0 m-0">
          <li>
            <Link href="/" className="lore-link">
              Lore Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/places" className="lore-link">
              Places &amp; Transit
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold">
            {place.name}
          </li>
        </ol>
      </nav>

      {/* Place Hero Card */}
      <header className="lore-card p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="lore-pill">
            <span aria-hidden="true">▲</span>
            <span>{place.kind} (In-Universe Setting)</span>
          </span>
          <span className="lore-pill">
            <span>{place.region}</span>
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {place.name}
        </h1>
        <p className="text-base leading-relaxed">{place.debutNote}</p>

        {place.backstageUrl && (
          <div className="pt-2">
            <a href={place.backstageUrl} className="lore-btn-primary text-sm">
              🎟️ Open Full Backstage Archival Dossier ↗
            </a>
          </div>
        )}
      </header>

      {/* Cross-Linked Books, Characters & Bands Anchored in This Setting */}
      {(relatedBooks.length > 0 ||
        relatedCharacters.length > 0 ||
        relatedBands.length > 0) && (
        <section
          aria-labelledby="place-connections-heading"
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          <h2 id="place-connections-heading" className="sr-only">
            Stories, Characters &amp; Bands Set Here
          </h2>

          {relatedBooks.length > 0 && (
            <div className="lore-card p-5 space-y-2.5">
              <h3 className="text-base font-bold">■ Featured In Book Series</h3>
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
              <h3 className="text-base font-bold">● Connected Characters</h3>
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

          {relatedBands.length > 0 && (
            <div className="lore-card p-5 space-y-2.5">
              <h3 className="text-base font-bold">◆ Associated Bands</h3>
              <ul role="list" className="space-y-2 text-sm list-none p-0 m-0">
                {relatedBands.map((b) => (
                  <li key={b.slug}>
                    <Link href={`/bands/${b.slug}`} className="lore-link font-semibold">
                      {b.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Sanitized Gazetteer & Worldbuilding Markdown Body rendered at build time */}
      <section aria-labelledby="gazetteer-notes-heading" className="lore-card p-6 sm:p-8 space-y-4">
        <h2 id="gazetteer-notes-heading" className="text-2xl font-bold">
          Gazetteer &amp; Worldbuilding Notes
        </h2>
        <MarkdownProse content={place.bodyMarkdown} />
      </section>
    </article>
  );
}
