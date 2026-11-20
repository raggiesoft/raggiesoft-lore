/**
 * @license MIT
 * ============================================================================
 * src/lib/parser.ts — Constellation Graph Data Accessor (Adapter Module)
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT THIS FILE IS: A lightweight "adapter" (or "facade") module dedicated
 *     specifically to the 2D Universe Constellation Map (`<LoreGraph />` and
 *     `<LoreGraphWrapper />`).
 *   - WHEN IT RUNS: Imported for TypeScript types in our Client Components (which
 *     erase at compile time) and callable at build time in Server Components.
 *   - WHAT DATA FEEDS INTO IT: Reads the pre-compiled `.graph` slice (`nodes`
 *     and `links`) from `src/lib/encyclopedia.ts` (`src/generated/encyclopedia.json`).
 *   - WHY KEEP THIS SEPARATE FILE?: Good software architecture separates concerns:
 *     the visual graph components only care about `GraphNode`, `GraphLink`, and
 *     `GraphData`—they don't need to know about book chapters, album track counts,
 *     or SEO title helpers. Re-exporting clean aliases here keeps component imports
 *     short and decoupled.
 * ============================================================================
 */

// Import the runtime `getEncyclopedia` function alongside three compile-time-only
// TypeScript interfaces (`type ...`) from our core encyclopedia module.
import {
  getEncyclopedia,
  type LoreGraphData,
  type LoreGraphNode,
  type LoreGraphLink,
} from "@/lib/encyclopedia";

// Create concise type aliases (`export type NewName = ExistingName`) so graph
// components can write `GraphNode`, `GraphLink`, and `GraphData`.
export type GraphNode = LoreGraphNode;
export type GraphLink = LoreGraphLink;
export type GraphData = LoreGraphData;

/**
 * Returns the complete `{ nodes, links }` Constellation Graph object for the
 * shared RaggieSoft universe.
 */
export function getLoreGraphData(): GraphData {
  return getEncyclopedia().graph;
}
