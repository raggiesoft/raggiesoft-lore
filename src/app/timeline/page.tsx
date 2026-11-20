/**
 * @license MIT
 * ============================================================================
 * src/app/timeline/page.tsx — Chronological Universe Timeline (1978–49601)
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT THIS FILE IS: File-based route in Next.js App Router: placing `page.tsx`
 *     inside `src/app/timeline/` automatically creates the `/timeline` URL
 *     (`https://lore.raggiesoft.com/timeline`).
 *   - WHEN IT RUNS: Build-time **React Server Component** (`next build` pre-renders
 *     all 5 decade sections into static HTML with zero client-side JavaScript!).
 *   - WHAT DATA FEEDS INTO IT: Calls `getTimelineBuckets()` from `src/lib/encyclopedia.ts`,
 *     which returns chronological decade buckets (`1978–1989`, `1990–1999`, `2000–2009`,
 *     `2010–2019`, and `2020–Stardate 49601`).
 *   - HOW SPOILER PROTECTION WORKS ON `/timeline`:
 *       1. `bucket.debutEvents` (all 40 album releases + Book Era 1 opening debuts)
 *          render openly in semantic ordered lists (`<ol role="list">`).
 *       2. `bucket.spoilerEvents` (Book Era 2+ storyline milestones) stay tucked
 *          inside native HTML5 `<details className="lore-spoiler">` disclosures so
 *          new readers never hit involuntary plot spoilers while browsing by year!
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  buildSeoDescription,
  buildSeoTitle,
  getTimelineBuckets,
} from "@/lib/encyclopedia";

// Format page-specific SEO `<title>` (<= 60 chars) and `<meta name="description">` (<= 155 chars).
const title = buildSeoTitle("Chronological Universe Timeline");
const description = buildSeoDescription(
  "Follow the RaggieSoft universe timeline from 1978 through Stardate 49601 across 40 Engine Room Records albums and 30 Ocean View Archives novel series."
);

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/timeline" },
  openGraph: {
    title,
    description,
    url: "https://lore.raggiesoft.com/timeline",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function TimelinePage() {
  // Fetch pre-sorted decade buckets synchronously at build time.
  const buckets = getTimelineBuckets();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      {/* Accessible Breadcrumb Navigation:
          Uses an ordered list (`<ol>`) because breadcrumb steps have a strict hierarchy
          (`Lore Home` -> `Timeline`), with `aria-hidden="true"` on the `/` separator
          and `aria-current="page"` on the active final crumb. */}
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-2 list-none p-0 m-0">
          <li>
            <Link href="/" className="lore-link">
              Lore Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold">
            Timeline
          </li>
        </ol>
      </nav>

      {/* Page Header & Decade Anchor Jump Bar */}
      <header className="space-y-3">
        <span className="lore-pill">
          <span aria-hidden="true">⏳</span>
          <span>Shared Story &amp; Music Chronology • Spoiler-Guarded</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          RaggieSoft Universe Timeline (1978 – Stardate 49601)
        </h1>
        <p
          className="text-base max-w-3xl leading-relaxed"
          style={{ color: "var(--lore-text-muted)" }}
        >
          Music releases and opening story eras are shown directly inside each
          era below, while later storyline milestones (Era 2 and beyond) stay
          tucked inside optional spoiler disclosures. (All in-universe album
          release years reflect story canon; real-world sound recordings are
          published by Engine Room Records.)
        </p>

        {/* Quick In-Page Jump Links: `href="#1990s"` scrolls directly to `<section id="1990s">`.
            `b.label.split(":")[0]` extracts the short prefix like `"1990–1999"` from the full heading. */}
        <nav aria-label="Jump to Timeline Decade" className="pt-2">
          <ul
            role="list"
            className="flex flex-wrap gap-2 list-none p-0 m-0 text-xs font-semibold"
          >
            {buckets.map((b) => (
              <li key={b.id}>
                <a href={`#${b.id}`} className="lore-btn-secondary py-1.5 px-3">
                  {b.label.split(":")[0]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Chronological Decade Sections */}
      <div className="space-y-12">
        {buckets.map((bucket) => (
          <section
            key={bucket.id}
            id={bucket.id}
            aria-labelledby={`${bucket.id}-heading`}
            className="space-y-5"
          >
            <h2 id={`${bucket.id}-heading`} className="text-2xl font-bold">
              {bucket.label}
            </h2>

            {/* Spoiler-Safe Events (`<ol>` = Ordered List because chronological order carries meaning!) */}
            {bucket.debutEvents.length > 0 && (
              <ol role="list" className="space-y-3 list-none p-0 m-0">
                {bucket.debutEvents.map((ev) => (
                  <li key={ev.id} className="lore-card p-5 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="lore-pill">
                        <span>{ev.date}</span>
                      </span>
                      <span className="lore-pill">
                        <span>{ev.kind}</span>
                      </span>
                    </div>
                    <h3 className="text-lg font-bold">
                      <Link href={ev.internalHref} className="lore-link">
                        {ev.title}
                      </Link>
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--lore-text-muted)" }}
                    >
                      {ev.summary}
                    </p>
                    <div className="flex flex-wrap gap-4 pt-1 text-xs font-semibold">
                      <Link href={ev.internalHref} className="lore-link">
                        Open Lore Guide →
                      </Link>
                      <a href={ev.externalUrl} className="lore-link">
                        {ev.externalLabel} ↗
                      </a>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {/* Collapsible Spoiler Horizon Disclosure (`<details>` + `<summary>`):
                Collapsed by default in HTML; expands on click or keyboard `Enter`/`Space`
                without needing any client-side React state! */}
            {bucket.spoilerEvents.length > 0 && (
              <details className="lore-spoiler">
                <summary>
                  Reveal {bucket.spoilerEvents.length} Later Storyline Era{" "}
                  {bucket.spoilerEvents.length === 1 ? "Milestone" : "Milestones"}{" "}
                  in This Period (Contains Spoilers)
                </summary>
                <div className="lore-spoiler-body">
                  <ol role="list" className="space-y-3 list-none p-0 m-0">
                    {bucket.spoilerEvents.map((ev) => (
                      <li
                        key={ev.id}
                        className="p-3.5 rounded-lg border space-y-1"
                        style={{ borderColor: "var(--lore-border-subtle)" }}
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                          <span>{ev.date}</span>
                          <span aria-hidden="true">•</span>
                          <Link href={ev.internalHref} className="lore-link">
                            {ev.title}
                          </Link>
                        </div>
                        <p
                          className="text-xs"
                          style={{ color: "var(--lore-text-muted)" }}
                        >
                          {ev.summary}
                        </p>
                        <a href={ev.externalUrl} className="lore-link text-xs font-semibold">
                          {ev.externalLabel} ↗
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
