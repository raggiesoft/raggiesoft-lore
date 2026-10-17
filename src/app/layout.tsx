import type { Metadata } from "next";
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
  title: "RaggieSoft Lore Graph",
  description: "The interactive semantic knowledge graph for the RaggieSoft universe.",
  openGraph: {
    title: "RaggieSoft Lore Graph",
    description: "The interactive semantic knowledge graph for the RaggieSoft universe.",
    url: "https://lore.raggiesoft.com",
    siteName: "RaggieSoft Lore",
    images: [
      {
        url: "https://assets.raggiesoft.com/raggiesoft-lore/images/og/default-og.jpg",
        width: 1200,
        height: 630,
        alt: "RaggieSoft Lore Knowledge Graph",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RaggieSoft Lore Graph",
    description: "The interactive semantic knowledge graph for the RaggieSoft universe.",
    images: ["https://assets.raggiesoft.com/raggiesoft-lore/images/og/default-og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <head>
        {/*
          =====================================================================
          Google Analytics 4 (GA4) Telemetry Integration (G-P9RG9JVYB6)
          =====================================================================
          Unified RaggieSoft ecosystem measurement property. Injected into the
          static Next.js export head so every knowledge graph route reports to
          the central GA4 property without blocking initial render.
          =====================================================================
        */}
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
              "@type": "WebSite",
              name: "RaggieSoft Lore Graph",
              url: "https://lore.raggiesoft.com",
            }),
          }}
        />
        <link
          rel="stylesheet"
          href="https://assets.raggiesoft.com/common/css/raggiesoft-network.css?v=20261017f"
        />
        <script
          src="https://assets.raggiesoft.com/common/js/raggiesoft-network.js?v=20261017f"
          defer
        ></script>
      </head>
      <body>
        <nav className="rs-network-bar" aria-label="RaggieSoft Ecosystem Network">
          <div className="rs-network-bar-inner">
            <span className="rs-network-label">✦ RaggieSoft Network:</span>
            <ul className="rs-network-links">
              <li><a href="https://raggiesoft.com">🌐 Hub</a></li>
              <li><a href="https://nebulae.raggiesoft.com">🌌 Nebulae</a></li>
              <li><a href="https://music.raggiesoft.com">🎧 Music</a></li>
              <li><a href="https://books.raggiesoft.com">📚 Books</a></li>
              <li><a href="https://stardust.raggiesoft.com">🚀 Stardust</a></li>
              <li><a href="https://engineroom.raggiesoft.com">⚙️ Engine Room</a></li>
              <li><a href="https://lore.raggiesoft.com" aria-current="page" className="is-active">🏛️ Lore</a></li>
              <li><a href="https://corporate.raggiesoft.com">🏢 Corporate</a></li>
              <li><a href="https://storetrainer.raggiesoft.com">💾 StoreTrainer</a></li>
              <li><a href="https://michaelpragsdale.com">👔 Michael P. Ragsdale</a></li>
            </ul>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
