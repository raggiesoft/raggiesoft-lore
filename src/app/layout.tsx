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
      </head>
      <body>{children}</body>
    </html>
  );
}
