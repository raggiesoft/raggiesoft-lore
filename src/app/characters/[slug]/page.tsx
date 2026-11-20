/**
 * @license MIT
 * ============================================================================
 * src/app/characters/[slug]/page.tsx — Static Character Profile & Spoiler Guard
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT `[slug]` MEANS: Next.js App Router **Dynamic Route Segment** generating
 *     one static HTML page per character (`/characters/katie-prairie`,
 *     `/characters/ryan-oconnell`, `/characters/claire-manning`, etc.) during
 *     `next build` (`output: "export"`).
 *   - WHEN IT RUNS: Build-time **React Server Component**. Zero client-side
 *     JavaScript is needed to render or expand anything on this page!
 *   - WHAT DATA FEEDS INTO IT: Looks up `getCharacterBySlug(slug)` and resolves
 *     connected Bands (`getBandBySlug`), Places (`getPlaceBySlug`), Chosen-Family
 *     companions (`getCharacterBySlug`), and Era-grouped POV chapter appearances.
 *   - HOW SPOILER PROTECTION WORKS ON CHARACTER PROFILES:
 *       1. Visible Immediately: Spoiler-safe `debutSummary`, debut timeline/setting
 *          anchors, family/band/place cross-links, and **Era 1** opening appearances
 *          (`openingEras`).
 *       2. Behind Native `<details className="lore-spoiler">`: Extended archival
 *          notes (`<MarkdownProse />`) and **Era 2+** storyline milestones
 *          (`spoilerEras`).
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildSeoDescription,
  buildSeoTitle,
  getBandBySlug,
  getCharacterBySlug,
  getCharacters,
  getPlaceBySlug,
} from "@/lib/encyclopedia";
import MarkdownProse from "@/components/MarkdownProse";

// Only serve slugs returned by `generateStaticParams()` (404 on unknown slugs).
export const dynamicParams = false;

/**
 * Supplies every compiled character `{ slug }` to `next build` so each profile
 * is pre-rendered into static HTML inside `out/characters/`.
 */
export function generateStaticParams() {
  return getCharacters().map((c) => ({ slug: c.slug }));
}

/**
 * Builds per-character `<title>`, `<meta name="description">`, canonical URL,
 * and OpenGraph (`type: "profile"`) / Twitter social preview metadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const char = getCharacterBySlug(slug);
  if (!char) return { title: "Character Not Found | RaggieSoft Lore" };

  const title = buildSeoTitle(char.name);
  const description = buildSeoDescription(char.shortDescription);
  const canonicalUrl = `https://lore.raggiesoft.com/characters/${char.slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/characters/${char.slug}` },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "profile",
      images: [{ url: char.image, alt: char.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [char.image],
    },
  };
}

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // 1. Unwrap asynchronous `params` and look up the character (404 if missing).
  const { slug } = await params;
  const char = getCharacterBySlug(slug);
  if (!char) notFound();

  // 2. Resolve related Bands, Places, and Family/Chosen-Family Characters from their slugs.
  const relatedBands = char.bandSlugs
    .map((s) => getBandBySlug(s))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));
  const relatedPlaces = char.placeSlugs
    .map((s) => getPlaceBySlug(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const relatedCharacters = char.relatedCharacterSlugs
    .map((s) => getCharacterBySlug(s))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  // 3. Partition chapter appearances across the Spoiler Horizon (`eraNum === 1` vs `eraNum > 1`).
  const openingEras = char.eraMilestones.filter((e) => e.eraNum === 1);
  const spoilerEras = char.eraMilestones.filter((e) => e.eraNum > 1);

  // 4. Build Schema.org `BreadcrumbList` + `ProfilePage` JSON-LD.
  //    Notice the conditional object spread `...(relatedBands.length > 0 ? { memberOf: ... } : {})`:
  //    if the character belongs to one or more bands, `...` merges `memberOf` into `mainEntity`;
  //    otherwise `{}` spreads nothing!
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
            name: "Characters",
            item: "https://lore.raggiesoft.com/characters",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: char.name,
            item: `https://lore.raggiesoft.com/characters/${char.slug}`,
          },
        ],
      },
      {
        "@type": "ProfilePage",
        "@id": `https://lore.raggiesoft.com/characters/${char.slug}#profile`,
        url: `https://lore.raggiesoft.com/characters/${char.slug}`,
        name: `${char.name} — RaggieSoft Lore Character Guide`,
        description: char.shortDescription,
        mainEntity: {
          "@type": "Person",
          name: char.name,
          description: char.debutSummary,
          jobTitle: char.role,
          image: char.image,
          ...(relatedBands.length > 0
            ? {
                memberOf: relatedBands.map((b) => ({
                  "@type": "MusicGroup",
                  name: b.name,
                  url: `https://lore.raggiesoft.com/bands/${b.slug}`,
                })),
              }
            : {}),
        },
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

      {/* Breadcrumb Trail (`Lore Home / Characters / <Character Name>`) */}
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-2 list-none p-0 m-0">
          <li>
            <Link href="/" className="lore-link">
              Lore Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/characters" className="lore-link">
              Characters
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold">
            {char.name}
          </li>
        </ol>
      </nav>

      {/* Spoiler-Safe Debut Header Card */}
      <header className="lore-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="lore-pill">
            <span aria-hidden="true">●</span>
            <span>Character Guide (Fictional)</span>
          </span>
          {char.primaryBookTitle && char.primaryBookSlug && (
            <Link
              href={`/books/${char.primaryBookSlug}`}
              className="lore-pill no-underline hover:underline"
            >
              <span aria-hidden="true">■</span>
              <span>{char.primaryBookTitle}</span>
            </Link>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {char.name}
          </h1>
          <p
            className="text-base sm:text-lg font-semibold"
            style={{ color: "var(--lore-text-muted)" }}
          >
            {char.role}
          </p>
        </div>

        <p className="text-base leading-relaxed">{char.debutSummary}</p>

        {/* Semantic `<dl>` Description List for Debut Date & Opening Setting */}
        {(char.debutDate || char.debutLocation) && (
          <dl
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t text-sm"
            style={{ borderColor: "var(--lore-border-subtle)" }}
          >
            {char.debutDate && (
              <div>
                <dt
                  className="font-semibold"
                  style={{ color: "var(--lore-text-muted)" }}
                >
                  Story Timeline Anchor
                </dt>
                <dd className="font-bold mt-0.5">{char.debutDate}</dd>
              </div>
            )}
            {char.debutLocation && (
              <div>
                <dt
                  className="font-semibold"
                  style={{ color: "var(--lore-text-muted)" }}
                >
                  Opening Setting
                </dt>
                <dd className="font-bold mt-0.5">{char.debutLocation}</dd>
              </div>
            )}
          </dl>
        )}

        {/* Primary Action Buttons (Book Reader debut chapter, Lore Series Guide, Listening Room) */}
        <div className="flex flex-wrap gap-3 pt-2">
          {char.firstAppearanceUrl && (
            <a href={char.firstAppearanceUrl} className="lore-btn-primary text-sm">
              📖 Read Opening Chapter in Book Reader ↗
            </a>
          )}
          {char.primaryBookSlug && (
            <Link
              href={`/books/${char.primaryBookSlug}`}
              className="lore-btn-secondary text-sm"
            >
              ■ Series Guide: {char.primaryBookTitle}
            </Link>
          )}
          {relatedBands[0] && (
            <a
              href={relatedBands[0].listeningRoomUrl}
              className="lore-btn-secondary text-sm"
            >
              🎧 Listen in The Listening Room ↗
            </a>
          )}
        </div>
      </header>

      {/* Connected Family, Bands, and Settings Grid */}
      {(relatedCharacters.length > 0 ||
        relatedBands.length > 0 ||
        relatedPlaces.length > 0) && (
        <section
          aria-labelledby="connections-heading"
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          <h2 id="connections-heading" className="sr-only">
            Universe Connections
          </h2>

          {relatedCharacters.length > 0 && (
            <div className="lore-card p-5 space-y-3">
              <h3 className="text-base font-bold">
                ● Family &amp; Chosen-Family Circle
              </h3>
              <ul role="list" className="space-y-2 text-sm list-none p-0 m-0">
                {relatedCharacters.map((rc) => (
                  <li key={rc.slug}>
                    <Link href={`/characters/${rc.slug}`} className="lore-link font-semibold">
                      {rc.name}
                    </Link>
                    <span
                      className="block text-xs"
                      style={{ color: "var(--lore-text-muted)" }}
                    >
                      {rc.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {relatedBands.length > 0 && (
            <div className="lore-card p-5 space-y-3">
              <h3 className="text-base font-bold">◆ Associated Bands</h3>
              <ul role="list" className="space-y-2 text-sm list-none p-0 m-0">
                {relatedBands.map((b) => (
                  <li key={b.slug}>
                    <Link href={`/bands/${b.slug}`} className="lore-link font-semibold">
                      {b.name}
                    </Link>
                    <span
                      className="block text-xs"
                      style={{ color: "var(--lore-text-muted)" }}
                    >
                      {b.primaryGenre}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {relatedPlaces.length > 0 && (
            <div className="lore-card p-5 space-y-3">
              <h3 className="text-base font-bold">▲ Key Settings &amp; Corridors</h3>
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
        </section>
      )}

      {/* Era 1 Opening Chapters (Shown Directly — Spoiler-Safe) */}
      {openingEras.length > 0 && (
        <section aria-labelledby="opening-chapters-heading" className="space-y-4">
          <h2 id="opening-chapters-heading" className="text-2xl font-bold">
            Opening Era Appearances (Era 1)
          </h2>
          {openingEras.map((era) => (
            <div key={era.eraTitle} className="lore-card p-5 space-y-3">
              <h3 className="text-lg font-bold">
                Era {era.eraNum}: {era.eraTitle}
              </h3>
              <ul
                role="list"
                className="grid grid-cols-1 md:grid-cols-2 gap-3 list-none p-0 m-0 text-sm"
              >
                {era.items.slice(0, 12).map((item) => (
                  <li
                    key={item.url}
                    className="p-3 rounded-lg border"
                    style={{ borderColor: "var(--lore-border-subtle)" }}
                  >
                    <a href={item.url} className="lore-link font-semibold">
                      {item.title} ↗
                    </a>
                    {(item.date || item.location) && (
                      <span
                        className="block text-xs mt-1"
                        style={{ color: "var(--lore-text-muted)" }}
                      >
                        {[item.date, item.location].filter(Boolean).join(" • ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Spoiler Horizon: Extended Archival Notes & Era 2+ Storyline Milestones
          Wrapped inside native HTML5 `<details className="lore-spoiler">` so readers
          explicitly choose when to expand later-era character developments! */}
      {(spoilerEras.length > 0 || Boolean(char.extendedBioMarkdown)) && (
        <section aria-labelledby="later-milestones-heading" className="space-y-4">
          <h2 id="later-milestones-heading" className="text-2xl font-bold">
            Full Storyline Arc &amp; Later Era Milestones
          </h2>
          <details className="lore-spoiler">
            <summary>
              Reveal Later Storyline Milestones &amp; Archival Character Notes
              (Contains Spoilers Beyond Era 1)
            </summary>
            <div className="lore-spoiler-body space-y-6">
              {char.extendedBioMarkdown && (
                <MarkdownProse content={char.extendedBioMarkdown} />
              )}

              {spoilerEras.map((era) => (
                <div key={`${era.eraNum}-${era.eraTitle}`} className="space-y-2.5">
                  <h3 className="text-base font-bold">
                    Era {era.eraNum}: {era.eraTitle} ({era.items.length} POV Parts)
                  </h3>
                  <ul
                    role="list"
                    className="grid grid-cols-1 md:grid-cols-2 gap-2.5 list-none p-0 m-0 text-sm"
                  >
                    {era.items.slice(0, 16).map((item) => (
                      <li
                        key={item.url}
                        className="p-2.5 rounded-lg border"
                        style={{ borderColor: "var(--lore-border-subtle)" }}
                      >
                        <a href={item.url} className="lore-link font-semibold">
                          {item.title} ↗
                        </a>
                        {(item.date || item.location) && (
                          <span
                            className="block text-xs mt-0.5"
                            style={{ color: "var(--lore-text-muted)" }}
                          >
                            {[item.date, item.location].filter(Boolean).join(" • ")}
                          </span>
                        )}
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
