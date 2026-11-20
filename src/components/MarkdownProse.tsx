/**
 * @license MIT
 * ============================================================================
 * src/components/MarkdownProse.tsx — Accessible Build-Time Markdown Renderer
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - NO `"use client";` AT THE TOP!: Because this file does NOT start with
 *     `"use client"`, Next.js 16 treats `<MarkdownProse />` as a **React Server
 *     Component (RSC)**. It runs 100% at **build time** inside Node.js during
 *     `next build`, converting Markdown text (`**bold**`, `## Headings`, lists,
 *     tables, and `[links](url)`) into plain static HTML. Visitors' browsers
 *     download ZERO bytes of Markdown-parsing JavaScript!
 *   - WHAT DATA FEEDS INTO IT: Sanitized `content` Markdown strings from
 *     Character extended notes, Place gazetteer guides, and Organization dossiers.
 *   - WHAT UI IT PRODUCES: Accessible, theme-aware article typography (`prose` +
 *     `lore-prose`) that preserves strict heading hierarchy (only one `<h1>` per
 *     page) and safe external links.
 * ============================================================================
 */

import React from "react";
// `react-markdown` safely parses Markdown into React HTML elements without `innerHTML`.
import ReactMarkdown from "react-markdown";
// `remark-gfm` adds "GitHub Flavored Markdown" features (tables, strikethrough, autolinks).
import remarkGfm from "remark-gfm";

export default function MarkdownProse({ content }: { content: string }) {
  // Guard clause: if `content` is empty or whitespace-only, returning `null`
  // tells React to render nothing at all (no empty `<div>` wrapper in the DOM).
  if (!content || !content.trim()) return null;

  return (
    <div className="prose max-w-none lore-prose">
      {/* `components={{ ... }}` lets us customize how specific Markdown elements
          render into HTML tags:
            1. `h1` -> `<h2>`: Accessibility & SEO best practice requires a web
               page to have only ONE `<h1>` (the main page title in `page.tsx`).
               If an imported Markdown snippet contains a `# Heading`, we demote
               it to `<h2>` automatically so screen-reader heading outlines stay clean!
            2. `a`: Applies our high-contrast underlined `.lore-link` class and adds
               `rel="noopener noreferrer"` on full `http(s)://` links for browser tab privacy. */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="text-xl font-bold mt-6 mb-3">{children}</h2>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="lore-link"
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
