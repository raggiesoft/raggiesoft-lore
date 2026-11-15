/**
 * @license MIT
 * ============================================================================
 * src/lib/parser.ts — Constellation Graph Data Accessor
 * ============================================================================
 * Architectural Overview:
 * Bridges the pre-compiled Full-Universe Constellation Graph from
 * `src/generated/encyclopedia.json` to `<LoreGraph />` and `<LoreGraphWrapper />`.
 * ============================================================================
 */

import {
  getEncyclopedia,
  type LoreGraphData,
  type LoreGraphNode,
  type LoreGraphLink,
} from "@/lib/encyclopedia";

export type GraphNode = LoreGraphNode;
export type GraphLink = LoreGraphLink;
export type GraphData = LoreGraphData;

export function getLoreGraphData(): GraphData {
  return getEncyclopedia().graph;
}
