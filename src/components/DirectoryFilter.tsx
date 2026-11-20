"use client";

/**
 * @license MIT
 * ============================================================================
 * src/components/DirectoryFilter.tsx — Progressive-Enhancement Directory Grid
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - LINE 1 (`"use client";`): Marks this component as an interactive React
 *     **Client Component** so visitors can type into the search input and filter
 *     cards instantaneously in their browser without reloading the page.
 *   - HOW PROGRESSIVE ENHANCEMENT WORKS HERE:
 *     Unlike `<LoreGraph />` (which sets `ssr: false` because Node.js has no
 *     `<canvas>`), `<DirectoryFilter />` uses plain HTML tags (`<search>`, `<ul>`,
 *     `<li>`, `<a href>`). During `next build`, Next.js pre-renders this component's
 *     initial state (`query = ""`) directly into the static `.html` files of
 *     `/characters`, `/bands`, `/books`, `/places`, and `/organizations`!
 *     Result:
 *       1. Search engines and readers without JavaScript immediately see 100% of
 *          all cards and `<a href>` links in raw HTML.
 *       2. As soon as the page opens in a browser, React "hydrates" (wires up)
 *          the `<input type="search">` box for zero-latency live filtering!
 *   - WHAT DATA FEEDS INTO IT: Receives `label`, `placeholder`, `nounPlural`,
 *     and an array of `DirectoryCardItem` objects prepared by each directory's
 *     Server Component (`page.tsx`).
 *   - WHAT UI IT PRODUCES: A native HTML5 `<search>` bar with a polite screen-reader
 *     result counter (`aria-live="polite"`) and a responsive 1/2/3-column CSS Grid
 *     of encyclopedia cards (`<ul role="list">`).
 * ============================================================================
 */

import React, { useId, useState } from "react";
import Link from "next/link";

/**
 * Reusable TypeScript shape for any card rendered inside `<DirectoryFilter />`,
 * allowing Characters, Bands, Books, Places, and Organizations to share one
 * accessible grid component.
 * (Properties with `?` like `metaLine?: string` are optional—callers may omit them.)
 */
export interface DirectoryCardItem {
  slug: string;
  href: string;
  title: string;
  badgeText: string;
  badgeSymbol: string;
  subtitle: string;
  description: string;
  metaLine?: string;
  externalUrl?: string | null;
  externalLabel?: string | null;
}

export default function DirectoryFilter({
  label,
  placeholder,
  items,
  nounPlural,
}: {
  label: string;
  placeholder: string;
  items: DirectoryCardItem[];
  nounPlural: string;
}) {
  // Generate a unique HTML `id` connecting `<label htmlFor={inputId}>` and `<input id={inputId}>`.
  const inputId = useId();

  // Store the current search box text in React state (starts empty `""` so all cards show).
  const [query, setQuery] = useState("");

  // Normalize user input by trimming leading/trailing spaces and lowercasing once per render.
  const normalized = query.trim().toLowerCase();

  /**
   * Returns `true` if `item` matches the user's search text across its title,
   * badge, subtitle, description, or optional metadata line.
   */
  const matchesItem = (item: DirectoryCardItem) => {
    if (!normalized) return true;
    const haystack = `${item.title} ${item.badgeText} ${item.subtitle} ${item.description} ${item.metaLine || ""}`.toLowerCase();
    return haystack.includes(normalized);
  };

  // Count how many cards remain visible so we can display and announce the live total.
  const visibleCount = normalized ? items.filter(matchesItem).length : items.length;

  return (
    <div className="space-y-6">
      {/* Native HTML5 `<search>` landmark (modern HTML provides `<search>` built-in,
          so adding `role="search"` is unnecessary). */}
      <search className="lore-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
          <div className="flex-1">
            <label htmlFor={inputId} className="block text-sm font-semibold mb-1.5">
              {label}
            </label>
            {/* Controlled `<input type="search">`: every keystroke fires `onChange`, updating `query` */}
            <input
              id={inputId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="lore-input"
              autoComplete="off"
            />
          </div>
          {/* Conditional Reset Button: `{query && (...)}` only shows "Clear Filter" when text is entered */}
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="lore-btn-secondary text-sm"
            >
              Clear Filter
            </button>
          )}
        </div>
        {/* `aria-live="polite"` announces updated match counts to JAWS, NVDA, and VoiceOver */}
        <p
          aria-live="polite"
          className="mt-2.5 text-sm"
          style={{ color: "var(--lore-text-muted)" }}
        >
          Showing {visibleCount} of {items.length} {nounPlural}
          {normalized ? ` matching "${query.trim()}"` : ""}.
        </p>
      </search>

      {/* Accessibility Detail — Why explicit `role="list"` on a `<ul>`?
          When CSS `list-style: none` (`list-none` in Tailwind) is applied to a `<ul>`,
          Apple Safari / WebKit removes its implicit list role unless `role="list"` is
          explicitly set—adding `role="list"` guarantees VoiceOver still announces
          "list, N items" cleanly! */}
      <ul
        role="list"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0"
      >
        {items.map((item) => {
          const isMatch = matchesItem(item);
          return (
            <li
              key={item.slug}
              hidden={!isMatch}
              className="lore-card p-5 flex flex-col justify-between"
            >
              {/* Note on `hidden={!isMatch}` above: using the native HTML `hidden` attribute
                  toggles visibility cleanly in both the visual layout and accessibility tree
                  while keeping every card pre-rendered in the initial static HTML! */}
              <div>
                <div className="mb-2.5">
                  <span className="lore-pill">
                    {/* Hide the decorative shape symbol from screen-reader speech */}
                    <span aria-hidden="true">{item.badgeSymbol}</span>
                    <span>{item.badgeText}</span>
                  </span>
                </div>
                <h2 className="text-lg font-bold leading-snug mb-1">
                  <Link href={item.href} className="lore-link">
                    {item.title}
                  </Link>
                </h2>
                {item.subtitle && (
                  <p
                    className="text-sm font-medium mb-2"
                    style={{ color: "var(--lore-text-muted)" }}
                  >
                    {item.subtitle}
                  </p>
                )}
                <p className="text-sm leading-relaxed mb-3">{item.description}</p>
              </div>

              {/* Card Footer: Internal Lore Guide `<Link>` + optional cross-site `<a>` link */}
              <div
                className="pt-3 mt-2 border-t flex flex-wrap items-center justify-between gap-2 text-sm"
                style={{ borderColor: "var(--lore-border-subtle)" }}
              >
                <Link href={item.href} className="lore-link font-semibold">
                  Explore Entry →
                </Link>
                {item.externalUrl && item.externalLabel && (
                  <a
                    href={item.externalUrl}
                    className="lore-link text-xs font-medium"
                  >
                    {item.externalLabel} ↗
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
