/**
 * @license MIT
 * ============================================================================
 * src/app/not-found.tsx — Genuine HTTP 404 Page (`noindex, follow`)
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT THIS FILE IS: Next.js App Router has a special reserved filename
 *     convention: `src/app/not-found.tsx` defines the custom "404 Page Not Found"
 *     screen shown whenever a visitor requests a URL that doesn't exist (or when
 *     a dynamic `[slug]/page.tsx` calls `notFound()`).
 *   - WHEN IT RUNS: Build-time **React Server Component**. `next build` exports
 *     this component into `out/404.html` (verified by `scripts/postbuild-seo.mjs`),
 *     and our production Nginx server is configured with `error_page 404 /404.html;`
 *     so browsers and crawlers receive a genuine HTTP `404` status code.
 *   - WHAT METADATA & UI IT PRODUCES:
 *       1. `robots: { index: false, follow: true }` (`noindex, follow`) so
 *          mistyped URLs never appear in Google search results while crawlers
 *          still follow the helpful hub links back into the site.
 *       2. A friendly, cosmic-themed recovery card with one-click buttons into
 *          all major Lore Encyclopedia sections.
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";

// Override the root layout's `<title>`, `<meta name="description">`, and `<meta name="robots">`
// specifically for the 404 error page.
export const metadata: Metadata = {
  title: "Page Not Found | RaggieSoft Lore",
  description:
    "We couldn't find that RaggieSoft Lore guide. Explore characters, bands, books, places, and the interactive constellation map.",
  robots: {
    index: false, // Emits `noindex`: keeps 404 pages out of search indexes
    follow: true, // Emits `follow`: passes link discovery through our recovery buttons
  },
};

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-6">
      {/* Status Pill (`aria-hidden="true"` keeps the decorative star silent for screen readers) */}
      <span className="lore-pill">
        <span aria-hidden="true">✦</span>
        <span>404 • Guide Not Found</span>
      </span>
      {/* Note `&apos;` and `&amp;` below: ESLint's `react/no-unescaped-entities` rule
          encourages writing HTML character entities inside JSX text so quotes/ampersands
          are unambiguous in markup. */}
      <h1 className="text-3xl sm:text-4xl font-extrabold">
        That Lore Entry Isn&apos;t on This Coordinate
      </h1>
      <p
        className="text-base leading-relaxed"
        style={{ color: "var(--lore-text-muted)" }}
      >
        The page you followed may have moved or been renamed. Use any of the
        encyclopedia hubs below to jump back into the RaggieSoft universe.
      </p>
      {/* Recovery Navigation Buttons back to valid canonical routes */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link href="/" className="lore-btn-primary text-sm">
          ✦ Open Constellation Map
        </Link>
        <Link href="/characters" className="lore-btn-secondary text-sm">
          ● Browse Characters
        </Link>
        <Link href="/bands" className="lore-btn-secondary text-sm">
          ◆ Browse Bands
        </Link>
        <Link href="/books" className="lore-btn-secondary text-sm">
          ■ Browse Books
        </Link>
        <Link href="/places" className="lore-btn-secondary text-sm">
          ▲ Places &amp; Transit
        </Link>
        <Link href="/timeline" className="lore-btn-secondary text-sm">
          ⏳ Universe Timeline
        </Link>
      </div>
    </div>
  );
}
