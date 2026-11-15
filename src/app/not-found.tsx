/**
 * @license MIT
 * ============================================================================
 * src/app/not-found.tsx — Genuine HTTP 404 Page (`noindex, follow`)
 * ============================================================================
 * Architectural Overview:
 * Exported as `/404.html` by Next.js static export and served with a genuine
 * HTTP 404 status by Nginx (`error_page 404 /404.html;`). Marked `noindex, follow`
 * so unknown URLs never pollute search indexes while passing link equity cleanly.
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found | RaggieSoft Lore",
  description:
    "We couldn't find that RaggieSoft Lore guide. Explore characters, bands, books, places, and the interactive constellation map.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-6">
      <span className="lore-pill">
        <span aria-hidden="true">✦</span>
        <span>404 • Guide Not Found</span>
      </span>
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
