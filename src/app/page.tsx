/**
 * @license MIT
 * ============================================================================
 * src/app/page.tsx — RaggieSoft Lore Encyclopedia Hub & Constellation Map
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT THIS FILE IS: In Next.js App Router, `src/app/page.tsx` maps directly
 *     to the home page URL `/` (`https://lore.raggiesoft.com/`), wrapped inside
 *     `src/app/layout.tsx`.
 *   - WHEN IT RUNS: Build-time **React Server Component** (`next build` executes
 *     `Home()` in Node.js and writes the resulting HTML into `out/index.html`).
 *   - WHAT DATA FEEDS INTO IT: Calls `getEncyclopedia()` from `src/lib/encyclopedia.ts`
 *     to read universe counts (`stats`), top bands/characters/books, and the
 *     full `graph` (`nodes` + `links`).
 *   - HOW SERVER & CLIENT COMPONENTS COOPERATE HERE:
 *       1. The Hero Banner, 6 Category Pillar Cards, and Featured Starting Points
 *          render as 100% zero-JavaScript static HTML—giving instant page load
 *          and direct `<a href>` crawlability for search engines.
 *       2. In the middle section, `<LoreGraphWrapper data={graph} />` hands the
 *          serializable `graph` JSON across the Server -> Client boundary so the
 *          browser can mount the interactive 2D Constellation `<canvas>`.
 * ============================================================================
 */

import Link from "next/link";
import { getEncyclopedia } from "@/lib/encyclopedia";
import LoreGraphWrapper from "@/components/LoreGraphWrapper";

export default function Home() {
  // Read the pre-compiled encyclopedia object synchronously at build time
  // and unpack ("destructure") the five properties we need on the home page.
  const enc = getEncyclopedia();
  const { stats, graph, bands, characters, books } = enc;

  // Data-driven UI array for the 6 Encyclopedia Category Pillar cards.
  // Storing structured objects in an array and rendering them with `.map()` below
  // avoids repeating identical card HTML 6 times!
  const hubs = [
    {
      href: "/characters",
      symbol: "●",
      title: `Characters (${stats.characterCount})`,
      description:
        "Spoiler-safe introductions, chosen-family bonds, and chapter milestones across Ocean View Archives and Engine Room Records.",
    },
    {
      href: "/bands",
      symbol: "◆",
      title: `Bands & Music (${stats.bandCount} Artists • ${stats.albumCount} Albums)`,
      description:
        "Band histories, member lineups, and direct links to stream every album in The Listening Room.",
    },
    {
      href: "/books",
      symbol: "■",
      title: `Book Series (${stats.bookCount})`,
      description:
        "Opening-chapter premises, reading guides, and collapsible multi-era outlines linked directly to RaggieSoft Book Reader.",
    },
    {
      href: "/places",
      symbol: "▲",
      title: `Places & Transit (${stats.placeCount})`,
      description:
        "Campuses, sanctuaries, regional bus and ferry networks, and the deep-space moon Caelum-IV.",
    },
    {
      href: "/organizations",
      symbol: "⬡",
      title: `In-Universe Organizations (${stats.organizationCount})`,
      description:
        "Fictional record labels, sanctuary trusts, coachbuilders, and technology companies across the stories.",
    },
    {
      href: "/timeline",
      symbol: "⏳",
      title: "Chronological Timeline",
      description:
        "Follow album releases and opening story eras decade by decade from 1978 through Stardate 49601.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-12">
      {/* Section 1: Hero Banner with single page `<h1>` and primary quick-action buttons */}
      <section className="space-y-4">
        <span className="lore-pill">
          <span aria-hidden="true">✦</span>
          <span>Official RaggieSoft Universe Guide • Spoiler-Safe Introductions</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          RaggieSoft Universe Guide &amp; Constellation Map
        </h1>
        <p
          className="text-base sm:text-lg max-w-3xl leading-relaxed"
          style={{ color: "var(--lore-text-muted)" }}
        >
          Discover how {stats.bookCount} <strong>Ocean View Archives</strong> novel
          series, {stats.bandCount} <strong>Engine Room Records</strong> bands (
          {stats.albumCount} albums), and {stats.placeCount} campuses, transit
          corridors, and cosmic sanctuaries connect across a single shared universe.
          Every guide begins with a spoiler-free opening introduction so new readers
          and listeners can explore safely.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link href="/books" className="lore-btn-primary text-sm">
            ■ Browse All {stats.bookCount} Book Guides
          </Link>
          <Link href="/bands" className="lore-btn-secondary text-sm">
            ◆ Explore All {stats.bandCount} Bands
          </Link>
          <Link href="/characters" className="lore-btn-secondary text-sm">
            ● Meet {stats.characterCount} Characters
          </Link>
          <Link href="/timeline" className="lore-btn-secondary text-sm">
            ⏳ View Universe Timeline
          </Link>
        </div>
      </section>

      {/* Section 2: Six Encyclopedia Pillar Cards
          `aria-labelledby` links this `<section>` landmark directly to its `<h2>` heading
          so screen-reader landmark menus announce "Browse the Encyclopedia by Category, region". */}
      <section aria-labelledby="encyclopedia-pillars-heading" className="space-y-4">
        <h2 id="encyclopedia-pillars-heading" className="text-2xl font-bold">
          Browse the Encyclopedia by Category
        </h2>
        {/* `role="list"` preserves VoiceOver list semantics on CSS Grid `<ul>` elements with `list-none` */}
        <ul
          role="list"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0"
        >
          {/* React `.map()` loop: transforms each `hub` object into an `<li>` card.
              React requires a unique `key={hub.href}` prop on list items to track elements cleanly. */}
          {hubs.map((hub) => (
            <li key={hub.href} className="lore-card p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">
                  <Link href={hub.href} className="lore-link">
                    <span aria-hidden="true">{hub.symbol} </span>
                    {hub.title}
                  </Link>
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--lore-text-muted)" }}
                >
                  {hub.description}
                </p>
              </div>
              <div className="pt-4 mt-2">
                <Link href={hub.href} className="lore-link text-sm font-semibold">
                  Open Directory →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Section 3: Interactive 2D Constellation Map (Client Component island hydrated in browser) */}
      <section aria-labelledby="constellation-map-heading" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h2 id="constellation-map-heading" className="text-2xl font-bold">
            Interactive Constellation Map ({stats.graphNodeCount} Entries •{" "}
            {stats.graphEdgeCount} Connections)
          </h2>
        </div>
        <LoreGraphWrapper data={graph} />
      </section>

      {/* Section 4: Featured Direct Entry Links for Fast Reader & Search Engine Discovery
          (`.slice(0, 10)` displays the first 10 protagonists and flagship book series) */}
      <section aria-labelledby="featured-guides-heading" className="space-y-4">
        <h2 id="featured-guides-heading" className="text-2xl font-bold">
          Featured Starting Points
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="lore-card p-5 space-y-3">
            <h3 className="text-base font-bold">◆ Engine Room Records Bands</h3>
            <ul role="list" className="space-y-1.5 text-sm list-none p-0 m-0">
              {bands.map((b) => (
                <li key={b.slug}>
                  <Link href={`/bands/${b.slug}`} className="lore-link">
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lore-card p-5 space-y-3">
            <h3 className="text-base font-bold">● Signature Protagonists</h3>
            <ul role="list" className="space-y-1.5 text-sm list-none p-0 m-0">
              {characters.slice(0, 10).map((c) => (
                <li key={c.slug}>
                  <Link href={`/characters/${c.slug}`} className="lore-link">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lore-card p-5 space-y-3">
            <h3 className="text-base font-bold">■ Flagship Novel Series</h3>
            <ul role="list" className="space-y-1.5 text-sm list-none p-0 m-0">
              {books.slice(0, 10).map((bk) => (
                <li key={bk.slug}>
                  <Link href={`/books/${bk.slug}`} className="lore-link">
                    {bk.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
