/**
 * @license MIT
 * ============================================================================
 * src/app/timeline/page.tsx — Chronological Universe Timeline (1978–49601)
 * ============================================================================
 * Architectural Overview:
 * Pre-rendered decade-by-decade chronology uniting Engine Room Records album
 * releases and Ocean View Archives story eras. Opening story debuts and album
 * releases appear immediately, while Era 2+ storyline milestones are tucked
 * inside per-decade collapsible `<details>` spoiler disclosures.
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  buildSeoDescription,
  buildSeoTitle,
  getTimelineBuckets,
} from "@/lib/encyclopedia";

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
  const buckets = getTimelineBuckets();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
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

        {/* Quick Jump Links */}
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
