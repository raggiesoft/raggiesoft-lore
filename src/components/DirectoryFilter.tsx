"use client";

/**
 * @license MIT
 * ============================================================================
 * src/components/DirectoryFilter.tsx — Progressive-Enhancement Directory Grid
 * ============================================================================
 * Architectural Overview:
 * Renders 100% of encyclopedia directory cards in the initial static HTML so
 * search crawlers index every `<a href>` link without executing JavaScript,
 * while giving readers and listeners instant `<search>` filtering in the
 * browser. Restores list semantics in Safari via explicit `role="list"` on
 * CSS Grid `<ul>` containers.
 * ============================================================================
 */

import React, { useId, useState } from "react";
import Link from "next/link";

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
  const inputId = useId();
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();

  const matchesItem = (item: DirectoryCardItem) => {
    if (!normalized) return true;
    const haystack = `${item.title} ${item.badgeText} ${item.subtitle} ${item.description} ${item.metaLine || ""}`.toLowerCase();
    return haystack.includes(normalized);
  };

  const visibleCount = normalized ? items.filter(matchesItem).length : items.length;

  return (
    <div className="space-y-6">
      {/* Native <search> landmark (no redundant role="search" attribute) */}
      <search className="lore-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
          <div className="flex-1">
            <label htmlFor={inputId} className="block text-sm font-semibold mb-1.5">
              {label}
            </label>
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
        <p
          aria-live="polite"
          className="mt-2.5 text-sm"
          style={{ color: "var(--lore-text-muted)" }}
        >
          Showing {visibleCount} of {items.length} {nounPlural}
          {normalized ? ` matching "${query.trim()}"` : ""}.
        </p>
      </search>

      {/* Explicit role="list" preserves VoiceOver list announcements on grid <ul> */}
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
              <div>
                <div className="mb-2.5">
                  <span className="lore-pill">
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
