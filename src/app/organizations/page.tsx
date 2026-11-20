/**
 * @license MIT
 * ============================================================================
 * src/app/organizations/page.tsx — In-Universe Organizations & Trusts Directory
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT THIS FILE IS: File-based Next.js App Router page for `/organizations`
 *     (`https://lore.raggiesoft.com/organizations`).
 *   - WHEN IT RUNS: Build-time **React Server Component** (`next build` renders
 *     all fictional corporate, sanctuary trust, record imprint, and coachbuilder
 *     cards directly into static HTML).
 *   - WHAT DATA FEEDS INTO IT: Calls `getOrganizations()` from `src/lib/encyclopedia.ts`,
 *     combining entries flattened from `corporate-structure.json` with curated
 *     in-universe organizations (`Quantum Corporation`, `Vectron`, `Prairie Coachworks`, etc.).
 *   - WHAT UI IT PRODUCES: Breadcrumb navigation, an explicit fictitious-entity
 *     explanatory `<header>`, and `<DirectoryFilter />` for instant live search.
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  buildSeoDescription,
  buildSeoTitle,
  getOrganizations,
} from "@/lib/encyclopedia";
import DirectoryFilter, {
  type DirectoryCardItem,
} from "@/components/DirectoryFilter";

// Format clamped `<title>` (<= 60 chars) and `<meta name="description">` (<= 155 chars).
const title = buildSeoTitle("In-Universe Organizations & Trusts");
const description = buildSeoDescription(
  "Explore the fictional record imprints, sanctuary trusts, accessible coachbuilders, and technology companies across the RaggieSoft story universe."
);

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/organizations" },
  openGraph: {
    title,
    description,
    url: "https://lore.raggiesoft.com/organizations",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function OrganizationsIndexPage() {
  // Load all compiled `OrganizationEntry` items synchronously at build time.
  const organizations = getOrganizations();

  // Map each `OrganizationEntry` (`org`) into a `DirectoryCardItem` for `<DirectoryFilter />`.
  const items: DirectoryCardItem[] = organizations.map((org) => ({
    slug: org.slug,
    href: `/organizations/${org.slug}`,
    title: org.name,
    badgeSymbol: "⬡",
    badgeText: "Fictional Organization",
    subtitle: org.role,
    description: org.summary,
    externalUrl: org.externalUrl,
    externalLabel: org.externalUrl ? "Related Portal" : null,
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
            Organizations
          </li>
        </ol>
      </nav>

      {/* Page Header: Highlights the distinction between fictional story `LLC`/trust
          entities and Michael P. Ragsdale's real-world unincorporated creative imprints. */}
      <header className="space-y-3">
        <span className="lore-pill">
          <span aria-hidden="true">⬡</span>
          <span>In-Universe Entities • {organizations.length} Profiles</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          In-Universe Organizations, Trusts &amp; Coachbuilders
        </h1>
        <p
          className="text-base max-w-3xl leading-relaxed"
          style={{ color: "var(--lore-text-muted)" }}
        >
          Every corporation, trust, holding company, and{" "}
          <strong>LLC</strong> listed in this directory (such as{" "}
          <em>Engine Room Records, LLC</em>, founded in-universe by Holly
          O&apos;Connell in 1992) is a fictional story entity. In real life,{" "}
          <strong>RaggieSoft</strong>, <strong>RaggieSoft Media</strong>,{" "}
          <strong>Engine Room Records</strong>, and{" "}
          <strong>Ocean View Archives</strong> are unincorporated creative
          brands operated by Michael P. Ragsdale.
        </p>
      </header>

      {/* Progressive-enhancement `<search>` bar + static HTML card grid */}
      <DirectoryFilter
        label="Search In-Universe Organizations by Name, Role, or Sector"
        placeholder="e.g., Engine Room, Quantum Corporation, Vectron, Prairie Coachworks…"
        items={items}
        nounPlural="in-universe organization profiles"
      />
    </div>
  );
}
