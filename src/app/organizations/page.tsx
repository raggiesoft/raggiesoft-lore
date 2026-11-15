/**
 * @license MIT
 * ============================================================================
 * src/app/organizations/page.tsx — In-Universe Organizations & Trusts Directory
 * ============================================================================
 * Architectural Overview:
 * Pre-rendered encyclopedia directory of fictional companies, sanctuary trusts,
 * record labels, coachbuilders, and promotions across RaggieSoft narratives.
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
  const organizations = getOrganizations();

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

      <DirectoryFilter
        label="Search In-Universe Organizations by Name, Role, or Sector"
        placeholder="e.g., Engine Room, Quantum Corporation, Vectron, Prairie Coachworks…"
        items={items}
        nounPlural="in-universe organization profiles"
      />
    </div>
  );
}
