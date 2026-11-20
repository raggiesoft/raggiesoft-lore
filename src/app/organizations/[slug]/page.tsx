/**
 * @license MIT
 * ============================================================================
 * src/app/organizations/[slug]/page.tsx — In-Universe Organization Guide
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT `[slug]` MEANS: Next.js App Router **Dynamic Route Segment** generating
 *     one static HTML page per fictional organization (`/organizations/quantum-corporation`,
 *     `/organizations/vectron-electronics`, `/organizations/engine-room-records-llc`, etc.)
 *     at build time (`output: "export"`).
 *   - WHEN IT RUNS: Build-time **React Server Component** (`next build` pre-renders
 *     all organization dossiers into `out/organizations/` with zero client-side JS).
 *   - WHAT DATA FEEDS INTO IT: Looks up `getOrganizationBySlug(slug)` and resolves
 *     its parent organization (`org.parentSlug`), child divisions (`childOrgs`),
 *     featured Books (`getBookBySlug`), and associated Bands (`getBandBySlug`).
 *   - WHAT UI & METADATA IT PRODUCES: Schema.org `BreadcrumbList` + `Article`
 *     JSON-LD, a "Fictional In-Universe Entity" badge header, parent/subsidiary
 *     hierarchy cards, and sanitized Markdown prose rendered via `<MarkdownProse />`.
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
  getOrganizationBySlug,
  getOrganizations,
} from "@/lib/encyclopedia";
import MarkdownProse from "@/components/MarkdownProse";

// Reject any URL slug not enumerated by `generateStaticParams()` with a 404.
export const dynamicParams = false;

/**
 * Supplies every compiled organization `{ slug }` to `next build` for static export.
 */
export function generateStaticParams() {
  return getOrganizations().map((o) => ({ slug: o.slug }));
}

/**
 * Generates per-organization `<title>`, `<meta name="description">`, canonical
 * URL, and OpenGraph (`type: "article"`) / Twitter social preview tags.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = getOrganizationBySlug(slug);
  if (!org) return { title: "Organization Not Found | RaggieSoft Lore" };

  const title = buildSeoTitle(org.name);
  const description = buildSeoDescription(org.shortDescription);
  const canonicalUrl = `https://lore.raggiesoft.com/organizations/${org.slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/organizations/${org.slug}` },
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

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // 1. Unwrap asynchronous `params` and look up the organization (404 if missing).
  const { slug } = await params;
  const org = getOrganizationBySlug(slug);
  if (!org) notFound();

  // 2. Reconstruct parent <-> subsidiary hierarchy links plus related Books & Bands.
  //    - `parentOrg`: looks up `org.parentSlug` if this entity is a subsidiary division.
  //    - `childOrgs`: filters `allOrgs` to find any divisions whose `parentSlug` points here!
  const allOrgs = getOrganizations();
  const parentOrg = org.parentSlug ? getOrganizationBySlug(org.parentSlug) : null;
  const childOrgs = allOrgs.filter((o) => o.parentSlug === org.slug);
  const relatedBooks = org.relatedBookSlugs
    .map((s) => getBookBySlug(s))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));
  const relatedBands = org.relatedBandSlugs
    .map((s) => getBandBySlug(s))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  // 3. Build Schema.org `BreadcrumbList` + `Article` JSON-LD (deliberately using
  //    `Article` rather than `Corporation` so search engines clearly index this
  //    page as a fictional lore encyclopedia article!).
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
            name: "Organizations",
            item: "https://lore.raggiesoft.com/organizations",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: org.name,
            item: `https://lore.raggiesoft.com/organizations/${org.slug}`,
          },
        ],
      },
      {
        "@type": "Article",
        "@id": `https://lore.raggiesoft.com/organizations/${org.slug}#article`,
        headline: `${org.name} — In-Universe Organization Guide`,
        url: `https://lore.raggiesoft.com/organizations/${org.slug}`,
        description: org.shortDescription,
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

      {/* Breadcrumb Trail (`Lore Home / Organizations / <Organization Name>`) */}
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-2 list-none p-0 m-0">
          <li>
            <Link href="/" className="lore-link">
              Lore Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/organizations" className="lore-link">
              Organizations
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold">
            {org.name}
          </li>
        </ol>
      </nav>

      {/* Organization Hero Card (prominently badged "Fictional In-Universe Entity") */}
      <header className="lore-card p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="lore-pill">
            <span aria-hidden="true">⬡</span>
            <span>Fictional In-Universe Entity</span>
          </span>
          {org.meta && (
            <span className="lore-pill">
              <span>{org.meta}</span>
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {org.name}
          </h1>
          <p
            className="text-base font-semibold"
            style={{ color: "var(--lore-text-muted)" }}
          >
            {org.role}
          </p>
        </div>

        <p className="text-base leading-relaxed">{org.summary}</p>

        {org.externalUrl && (
          <div className="pt-2">
            <a href={org.externalUrl} className="lore-btn-primary text-sm">
              🏢 Open Companion Lore Portal ↗
            </a>
          </div>
        )}
      </header>

      {/* In-Universe Corporate/Trust Hierarchy + Related Books & Bands */}
      {(parentOrg ||
        childOrgs.length > 0 ||
        relatedBooks.length > 0 ||
        relatedBands.length > 0) && (
        <section
          aria-labelledby="org-connections-heading"
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <h2 id="org-connections-heading" className="sr-only">
            Related Entities, Stories &amp; Bands
          </h2>

          {(parentOrg || childOrgs.length > 0) && (
            <div className="lore-card p-5 space-y-3">
              <h3 className="text-base font-bold">⬡ In-Universe Structure</h3>
              {parentOrg && (
                <p className="text-sm">
                  Parent Entity:{" "}
                  <Link
                    href={`/organizations/${parentOrg.slug}`}
                    className="lore-link font-semibold"
                  >
                    {parentOrg.name}
                  </Link>
                </p>
              )}
              {childOrgs.length > 0 && (
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-1.5"
                    style={{ color: "var(--lore-text-muted)" }}
                  >
                    Affiliated Divisions &amp; Subsidiaries
                  </p>
                  <ul role="list" className="space-y-1.5 text-sm list-none p-0 m-0">
                    {childOrgs.map((ch) => (
                      <li key={ch.slug}>
                        <Link
                          href={`/organizations/${ch.slug}`}
                          className="lore-link font-semibold"
                        >
                          {ch.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

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

      {/* Sanitized Markdown Archival Dossier Body rendered at build time */}
      <section aria-labelledby="org-dossier-heading" className="lore-card p-6 sm:p-8 space-y-4">
        <h2 id="org-dossier-heading" className="text-2xl font-bold">
          Archival Overview
        </h2>
        <MarkdownProse content={org.bodyMarkdown} />
      </section>
    </article>
  );
}
