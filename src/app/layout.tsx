/**
 * @license MIT
 * ============================================================================
 * src/app/layout.tsx — Root Layout, Schema.org Graph, Nav & Fictitious Footer
 * ============================================================================
 * Architectural Overview:
 * Shared shell for `https://lore.raggiesoft.com`. Provides:
 *   - `<meta name="color-scheme" content="light dark" />` for instant OS theme parity
 *   - Keyboard `.skip-link` targeting `<main id="content" tabIndex={-1}>`
 *   - RaggieSoft Ecosystem Network Bar + Lore Encyclopedia Section Header
 *   - Unified GA4 (`G-P9RG9JVYB6`) & Schema.org `WebSite` / `Organization` JSON-LD
 *   - Mandatory Global Fictitious Persons & Entities Disclaimer + CC BY-SA 4.0 / MIT
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
        <meta name="color-scheme" content="light dark" />
        {/* Google Analytics 4 (GA4) Unified Ecosystem Property */}
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
        <link
          rel="stylesheet"
          href="https://assets.raggiesoft.com/common/css/raggiesoft-network.css?v=20261118a"
        />
        <script
          src="https://assets.raggiesoft.com/common/js/raggiesoft-network.js?v=20261118a"
          defer
        ></script>
      </head>
      <body className="min-h-screen flex flex-col">
        <a href="#content" className="skip-link">
          Skip to main content
        </a>

        {/* Global RaggieSoft Ecosystem Network Bar */}
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

        {/* Lore Encyclopedia Section Navigation */}
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

        <main id="content" tabIndex={-1} className="flex-1">
          {children}
        </main>

        {/* Global Fictitious Persons & Entities Disclaimer + Licensing Footer */}
        <footer
          className="border-t mt-16"
          style={{
            backgroundColor: "var(--lore-surface)",
            borderColor: "var(--lore-border-subtle)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-5 text-sm">
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
