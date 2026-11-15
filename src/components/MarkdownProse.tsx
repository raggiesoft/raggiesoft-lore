/**
 * @license MIT
 * ============================================================================
 * src/components/MarkdownProse.tsx — Accessible Consumer Markdown Renderer
 * ============================================================================
 * Architectural Overview:
 * Renders sanitized lore markdown into clean semantic HTML during static
 * Server Component generation. Automatically demotes top-level `#` headings
 * inside body fragments to `<h2>` so every route maintains a single `<h1>`.
 * ============================================================================
 */

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownProse({ content }: { content: string }) {
  if (!content || !content.trim()) return null;

  return (
    <div className="prose max-w-none lore-prose">
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
