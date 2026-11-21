/**
 * @license MIT
 * ============================================================================
 * src/app/layout.tsx — Root Layout, Schema.org Graph, Nav & Fictitious Footer
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT THIS FILE IS: In Next.js 16's App Router (`src/app/`), `layout.tsx`
 *     is the master outer shell ("picture frame") wrapping EVERY single page on
 *     `https://lore.raggiesoft.com`. Whatever you put here—`<html>`, `<head>`,
 *     the RaggieSoft Ecosystem top bar, the Lore section header, `<main>`, and
 *     the legal/licensing `<footer>`—surrounds every child `page.tsx` automatically.
 *   - WHEN IT RUNS: Build-time **React Server Component** (no `"use client"`).
 *     Next.js runs this function once per route during `next build` to emit clean,
 *     complete static HTML documents.
 *   - WHAT DATA FEEDS INTO IT: Self-hosted Google Fonts (`Geist` & `Geist_Mono`),
 *     `./globals.css`, default site-wide SEO `metadata`, and the `{ children }`
 *     prop (which represents whichever page route is currently being rendered).
 *   - WHAT UI & METADATA IT PRODUCES:
 *       1. `<meta name="color-scheme" content="light dark" />` for instant OS theme parity
 *       2. Keyboard `.skip-link` targeting `<main id="content" tabIndex={-1}>`
 *       3. RaggieSoft Ecosystem Network Bar + Lore Encyclopedia Section Header
 *       4. Unified GA4 (`G-P9RG9JVYB6`) & Schema.org `WebSite` / `Organization` JSON-LD
 *       5. Mandatory Global Fictitious Persons & Entities Disclaimer + CC BY-SA 4.0 / MIT
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
// `next/font/google` downloads font files at *build time* and self-hosts them
// alongside our static assets—preventing layout jump ("Cumulative Layout Shift")
// and avoiding runtime requests to Google's font servers.
import { Geist, Geist_Mono } from "next/font/google";
// Importing `./globals.css` here applies our Tailwind v4 + theme styles site-wide.
import "./globals.css";

// Configure CSS Custom Property names (`--font-geist-sans` & `--font-geist-mono`)
// that get attached to `<html className={...}>` and referenced in `globals.css`.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Default site-wide SEO & social sharing metadata (`export const metadata`).
 * Next.js automatically reads this exported constant at build time to generate
 * `<title>`, `<meta name="description">`, `<link rel="canonical">`, OpenGraph
 * (`og:*` preview cards for iMessage, Discord, Slack, Facebook, LinkedIn), and
 * Twitter/X summary cards. Individual child pages can override any field with
 * their own `metadata` or `generateMetadata()`.
 */
export const metadata: Metadata = {
  // Base origin used to resolve relative URLs like `canonical: "/"` -> `"https://lore.raggiesoft.com/"`
  metadataBase: new URL("https://lore.raggiesoft.com"),
  title: "RaggieSoft Lore | Universe Guide, Characters & Music",
  description:
    "Explore the official RaggieSoft universe encyclopedia and interactive constellation map connecting Ocean View Archives books and Engine Room Records bands.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "RaggieSoft Lore | Universe Guide, Characters & Music",
    description:
      "Explore the official RaggieSoft universe encyclopedia and interactive constellation map connecting Ocean View Archives books and Engine Room Records bands.",
    url: "https://lore.raggiesoft.com",
    siteName: "RaggieSoft Lore",
    images: [
      {
        url: "https://assets.raggiesoft.com/raggiesoft-lore/images/og/default-og.jpg",
        width: 1200,
        height: 630,
        alt: "RaggieSoft Lore Universe Guide & Constellation Map",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RaggieSoft Lore | Universe Guide, Characters & Music",
    description:
      "Explore the official RaggieSoft universe encyclopedia and interactive constellation map connecting Ocean View Archives books and Engine Room Records bands.",
    images: ["https://assets.raggiesoft.com/raggiesoft-lore/images/og/default-og.jpg"],
  },
};

/**
 * Root HTML shell component.
 * - `{ children }`: React's special slot prop containing the active page's JSX.
 * - `Readonly<{ children: React.ReactNode }>`: TypeScript annotation ensuring
 *   `props` is never accidentally mutated (`Readonly`) and accepts any valid
 *   renderable React content (`React.ReactNode`).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        {/* Note on `<html lang="en">` above: declaring the human language ("en" = English)
            tells screen readers which pronunciation dictionary to use! */}
        <meta name="color-scheme" content="light dark" />
        {/* Google Analytics 4 (GA4) Unified Ecosystem Property.
            Why `dangerouslySetInnerHTML`? By default, React escapes `<` and `>` inside text
            to prevent Cross-Site Scripting (XSS) attacks. For trusted, static inline `<script>`
            and JSON-LD blocks written by us at build time, `dangerouslySetInnerHTML={{ __html: ... }}`
            emits the exact raw script content into `<head>`. */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-P9RG9JVYB6"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-P9RG9JVYB6');
            `,
          }}
        />
        {/* Schema.org Structured Data (`application/ld+json`):
            Machine-readable JSON graph telling Google, Bing, and knowledge engines
            how `lore.raggiesoft.com` (`WebSite`), `RaggieSoft` (`Organization`), and
            author `Michael P. Ragsdale` (`Person`) connect, plus CC BY-SA 4.0 licensing. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://raggiesoft.com/#organization",
                  name: "RaggieSoft",
                  url: "https://raggiesoft.com",
                },
                {
                  "@type": "WebSite",
                  "@id": "https://lore.raggiesoft.com/#website",
                  name: "RaggieSoft Lore & Universe Encyclopedia",
                  url: "https://lore.raggiesoft.com",
                  publisher: { "@id": "https://raggiesoft.com/#organization" },
                  author: {
                    "@type": "Person",
                    "@id": "https://michaelpragsdale.com/#michael-ragsdale",
                    name: "Michael P. Ragsdale",
                    url: "https://michaelpragsdale.com",
                  },
                  license: "https://creativecommons.org/licenses/by-sa/4.0/",
                },
              ],
            }),
          }}
        />
        {/* Shared cross-subdomain RaggieSoft Network Bar styles & interactive dropdown script (`defer` runs after HTML parses) */}
        <link
          rel="stylesheet"
          href="https://assets.raggiesoft.com/common/css/raggiesoft-network.css?v=20261120b"
        />
        <script
          src="https://assets.raggiesoft.com/common/js/raggiesoft-network.js?v=20261120b"
          defer
        ></script>
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Keyboard Skip Link: First Tab stop on every page, jumping straight to `<main id="content">` */}
        <a href="#content" className="skip-link">
          Skip to main content
        </a>

        {/* Global RaggieSoft Ecosystem Network Bar (`aria-label` distinguishes this `<nav>`
            from the Lore Section `<nav>` below when screen-reader users list page landmarks) */}
        <nav className="rs-network-bar" aria-label="RaggieSoft Ecosystem Network">
          <div className="rs-network-bar-inner">
            <span className="rs-network-label">✦ RaggieSoft Network:</span>
            <ul className="rs-network-links">
              <li>
                <a href="https://raggiesoft.com">🌐 Hub</a>
              </li>
              <li>
                <a href="https://nebulae.raggiesoft.com">🌌 Nebulae</a>
              </li>
              <li>
                <a href="https://books.raggiesoft.com">📚 Books</a>
              </li>
              <li>
                <a href="https://music.raggiesoft.com">🎧 Music</a>
              </li>
              <li>
                {/* `aria-current="page"` tells assistive tech that Lore is the active ecosystem site */}
                <a href="https://lore.raggiesoft.com" aria-current="page">
                  🗺️ Lore
                </a>
              </li>
              <li>
                <a href="https://backstage.raggiesoft.com">🎟️ Backstage</a>
              </li>
              <li className="rs-network-dropdown">
                <button
                  type="button"
                  className="rs-network-dropdown-toggle"
                  aria-expanded="false"
                  aria-controls="rs-static-err-menu"
                >
                  <span aria-hidden="true">⚙️</span>
                  <span>Engine Room</span>
                  <span className="rs-network-caret" aria-hidden="true">
                    ▾
                  </span>
                </button>
                <ul
                  id="rs-static-err-menu"
                  className="rs-network-dropdown-menu"
                  aria-label="Engine Room Records & Band Roster"
                >
                  <li>
                    <a href="https://engineroom.raggiesoft.com">
                      ⚙️ Engine Room Records Hub
                    </a>
                  </li>
                  <li>
                    <a href="https://music.raggiesoft.com">
                      🎧 The Listening Room
                    </a>
                  </li>
                  <li>
                    <a href="https://engineroom.raggiesoft.com/artists">
                      🎸 All Artists Directory
                    </a>
                  </li>
                  <li>
                    <a href="https://engineroom.raggiesoft.com/isrc">
                      🏷️ Official ISRC Registry (QTAHP)
                    </a>
                  </li>
                  <li>
                    <a href="https://stardust.raggiesoft.com">
                      🚀 The Stardust Engine
                    </a>
                  </li>
                </ul>
              </li>
              <li>
                <a href="https://corporate.raggiesoft.com">🏢 Corporate</a>
              </li>
              <li>
                <a href="https://storetrainer.raggiesoft.com">💾 StoreTrainer</a>
              </li>
              <li>
                <a href="https://michaelpragsdale.com">👔 Portfolio &amp; Resume</a>
              </li>
            </ul>
          </div>
        </nav>

        {/* Lore Encyclopedia Section Navigation: uses Next.js `<Link>` for instant internal routing */}
        <header
          className="border-b"
          style={{
            backgroundColor: "var(--lore-surface)",
            borderColor: "var(--lore-border-subtle)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Link
                href="/"
                className="text-lg font-extrabold tracking-tight no-underline hover:underline"
                style={{ color: "var(--lore-text)" }}
              >
                ✦ RaggieSoft Lore Encyclopedia
              </Link>
            </div>
            <nav aria-label="Lore Encyclopedia Sections">
              <ul className="flex flex-wrap items-center gap-1.5 sm:gap-2 list-none p-0 m-0 text-sm font-semibold">
                <li>
                  <Link href="/" className="lore-btn-secondary text-xs py-1.5 px-3">
                    ✦ Constellation Map
                  </Link>
                </li>
                <li>
                  <Link
                    href="/characters"
                    className="lore-btn-secondary text-xs py-1.5 px-3"
                  >
                    ● Characters
                  </Link>
                </li>
                <li>
                  <Link
                    href="/bands"
                    className="lore-btn-secondary text-xs py-1.5 px-3"
                  >
                    ◆ Bands &amp; Music
                  </Link>
                </li>
                <li>
                  <Link
                    href="/books"
                    className="lore-btn-secondary text-xs py-1.5 px-3"
                  >
                    ■ Books
                  </Link>
                </li>
                <li>
                  <Link
                    href="/places"
                    className="lore-btn-secondary text-xs py-1.5 px-3"
                  >
                    ▲ Places &amp; Transit
                  </Link>
                </li>
                <li>
                  <Link
                    href="/organizations"
                    className="lore-btn-secondary text-xs py-1.5 px-3"
                  >
                    ⬡ Organizations
                  </Link>
                </li>
                <li>
                  <Link
                    href="/timeline"
                    className="lore-btn-secondary text-xs py-1.5 px-3"
                  >
                    ⏳ Timeline
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        {/* Primary Page Content Landmark (`<main id="content" tabIndex={-1}>`):
            - `tabIndex={-1}` lets the `.skip-link` (`href="#content"`) move keyboard &
              screen-reader reading position directly onto `<main>` without making `<main>`
              itself an extra stop when pressing `Tab` normally.
            - `{children}` renders the active route's `page.tsx` output right here! */}
        <main id="content" tabIndex={-1} className="flex-1">
          {children}
        </main>

        {/* Global Fictitious Persons & Entities Disclaimer + Dual Licensing Footer */}
        <footer
          className="border-t mt-16"
          style={{
            backgroundColor: "var(--lore-surface)",
            borderColor: "var(--lore-border-subtle)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-5 text-sm">
            {/* Quick Footer Directory & Cross-Ecosystem Links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 font-semibold">
              <Link href="/" className="lore-link">
                Constellation Map
              </Link>
              <Link href="/characters" className="lore-link">
                Characters
              </Link>
              <Link href="/bands" className="lore-link">
                Bands &amp; Discography
              </Link>
              <Link href="/books" className="lore-link">
                Ocean View Archives Books
              </Link>
              <Link href="/places" className="lore-link">
                Places &amp; Transit
              </Link>
              <Link href="/organizations" className="lore-link">
                In-Universe Organizations
              </Link>
              <Link href="/timeline" className="lore-link">
                Universe Timeline
              </Link>
              <a href="https://books.raggiesoft.com" className="lore-link">
                RaggieSoft Book Reader ↗
              </a>
              <a href="https://music.raggiesoft.com" className="lore-link">
                The Listening Room ↗
              </a>
              <a href="https://backstage.raggiesoft.com" className="lore-link">
                Backstage Archives ↗
              </a>
            </div>

            {/* Mandatory Legal & Worldbuilding Transparency Box:
                Clearly separates fictional in-universe `LLC` / university / transit
                entities from Michael P. Ragsdale's real-world unincorporated creative brands.
                (Note: `{" "}` in JSX inserts an explicit space beside inline `<strong>`/`<em>`/`<a>` tags.) */}
            <div
              className="p-4 rounded-xl border text-xs leading-relaxed space-y-2"
              style={{
                backgroundColor: "var(--lore-surface-alt)",
                borderColor: "var(--lore-border-subtle)",
                color: "var(--lore-text-muted)",
              }}
            >
              <p className="font-bold" style={{ color: "var(--lore-text)" }}>
                Fictitious Persons &amp; Entities Disclaimer
              </p>
              <p>
                All narrative characters, bands, biographies, universities (including
                Commonwealth Polytechnic Institute / CPI, Virginia Dominion University /
                VDU, The Forgers, and The Crucible), corporations and in-universe{" "}
                <strong>LLC</strong> / trust entities (including{" "}
                <em>Engine Room Records, LLC</em>, OmniCorp, Apex Records, Quantum
                Corporation, Vectron, Prairie Coachworks, and Sainte-Claire), public
                transit agencies (including Blue Ridge Transit / BRT and Coastal Virginia
                Transit Authority / CVTA), in-universe filings, and story events depicted
                across RaggieSoft Lore are works of fiction. Any resemblance to actual
                persons, living or dead, or to real-world institutions is purely
                coincidental.
              </p>
              <p>
                In the real world, <strong>RaggieSoft</strong>,{" "}
                <strong>RaggieSoft Media</strong>, <strong>Engine Room Records</strong>{" "}
                (music imprint), and <strong>Ocean View Archives</strong> (book imprint)
                are unincorporated creative brands under which{" "}
                <a href="https://michaelpragsdale.com" className="lore-link">
                  Michael P. Ragsdale
                </a>{" "}
                publishes his creative works.
              </p>
            </div>

            {/* Copyright & Dual Licensing Notice (CC BY-SA 4.0 for creative content, MIT for source code) */}
            <p className="text-xs" style={{ color: "var(--lore-text-muted)" }}>
              © {new Date().getFullYear()} Michael P. Ragsdale (RaggieSoft). Creative
              stories, character profiles, and lore guides are licensed under{" "}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                className="lore-link"
                rel="noopener noreferrer"
              >
                CC BY-SA 4.0
              </a>{" "}
              (commercial licensing information at{" "}
              <a
                href="https://raggiesoft.com/raggiesoft-media/licensing/commercial"
                className="lore-link"
              >
                raggiesoft.com/raggiesoft-media/licensing/commercial
              </a>
              ). Application source code is licensed under the{" "}
              <strong>MIT License</strong>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
