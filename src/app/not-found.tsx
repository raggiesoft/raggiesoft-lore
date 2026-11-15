/**
 * @license MIT
 * ============================================================================
 * src/app/not-found.tsx — RaggieSoft Lore (lore.raggiesoft.com)
 * ============================================================================
 * Architectural Overview:
 * Compiled by Next.js static export (`output: "export"`) into `/out/404.html`
 * so Nginx (`error_page 404 /404.html;`) returns a genuine HTTP 404 response
 * with `noindex, follow` crawler directives instead of soft-404ing unknown URLs
 * back to the homepage. Uses warm, consumer-friendly navigation and WCAG 2.1 AA
 * adaptive light/dark contrast.
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found | RaggieSoft Lore",
  description: "The requested story entry or universe page could not be found on RaggieSoft Lore.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <main
      id="content"
      className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      <section
        aria-labelledby="lore-404-heading"
        className="max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-lg"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">
          RaggieSoft Lore • Page Not Found
        </p>
        <h1 id="lore-404-heading" className="text-3xl font-bold tracking-tight mb-4">
          We Could Not Find That Lore Entry
        </h1>
        <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
          The character profile, timeline entry, or story connection you followed could not be found at this address. Explore the interactive Lore map below, or jump straight into the books and music across the RaggieSoft universe.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2.5 rounded-lg font-semibold bg-sky-700 text-white hover:bg-sky-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400 transition"
          >
            📜 Open Interactive Lore Map
          </Link>
          <a
            href="https://books.raggiesoft.com"
            className="inline-flex items-center px-4 py-2.5 rounded-lg font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            📚 RaggieSoft Book Reader
          </a>
          <a
            href="https://music.raggiesoft.com"
            className="inline-flex items-center px-4 py-2.5 rounded-lg font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            🎧 The Listening Room
          </a>
        </div>
      </section>
    </main>
  );
}
