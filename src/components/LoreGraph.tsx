"use client";

/**
 * @license MIT
 * ============================================================================
 * src/components/LoreGraph.tsx — Accessible 2D Constellation Knowledge Graph
 * ============================================================================
 * Architectural Overview:
 * Interactive 2D force-directed constellation map connecting all 5 RaggieSoft
 * universe pillars (`character`, `band`, `book`, `place`, `organization`).
 *
 * Accessibility & Theme Engineering:
 * 1. Live System Theme Tracking (`matchMedia("(prefers-color-scheme: dark)")`):
 *    Reads the active OS scheme AND listens to its `change` event so the HTML5
 *    `<canvas>` updates background, link contrast, and node colors live.
 * 2. Shape + Symbol + Color Encoding (Never Color Alone):
 *    Draws distinct geometric shapes per entity category (circle, diamond,
 *    rounded square, triangle, hexagon) paired with text + symbol legend pills.
 * 3. Dual-Layer Screen Reader & Keyboard Architecture:
 *    Maintains a synchronized keyboard-focusable semantic list (`sr-only`) that
 *    pans the camera and opens the detail drawer on focus or click.
 * ============================================================================
 */

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ForceGraph2D from "react-force-graph-2d";
import type { GraphData, GraphNode } from "@/lib/parser";
import type { NodeGroup } from "@/lib/encyclopedia";

const GROUP_META: Record<
  NodeGroup,
  {
    label: string;
    plural: string;
    symbol: string;
    lightColor: string;
    darkColor: string;
  }
> = {
  character: {
    label: "Character",
    plural: "Characters",
    symbol: "●",
    lightColor: "#1d4ed8",
    darkColor: "#60a5fa",
  },
  band: {
    label: "Band",
    plural: "Bands",
    symbol: "◆",
    lightColor: "#b45309",
    darkColor: "#fbbf24",
  },
  book: {
    label: "Book Series",
    plural: "Books",
    symbol: "■",
    lightColor: "#047857",
    darkColor: "#34d399",
  },
  place: {
    label: "Place & Transit",
    plural: "Places",
    symbol: "▲",
    lightColor: "#be123c",
    darkColor: "#fb7185",
  },
  organization: {
    label: "Organization",
    plural: "Organizations",
    symbol: "⬡",
    lightColor: "#6d28d9",
    darkColor: "#c084fc",
  },
};

export default function LoreGraph({ data }: { data: GraphData }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const searchInputId = useId();

  const [dimensions, setDimensions] = useState({ width: 960, height: 560 });
  const [isDark, setIsDark] = useState(false);
  const [activeGroup, setActiveGroup] = useState<NodeGroup | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Measure graph container responsively
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({
        width: Math.max(320, Math.floor(rect.width)),
        height: Math.max(460, Math.floor(rect.height)),
      });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Track prefers-color-scheme AND subscribe to its `change` event for <canvas>
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mql.matches);
    const onSchemeChange = (ev: MediaQueryListEvent) => {
      setIsDark(ev.matches);
    };
    mql.addEventListener("change", onSchemeChange);
    return () => mql.removeEventListener("change", onSchemeChange);
  }, []);

  const filteredGraph = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const allowedNodes = data.nodes.filter((n) => {
      if (activeGroup !== "all" && n.group !== activeGroup) return false;
      if (!q) return true;
      return (
        n.name.toLowerCase().includes(q) ||
        n.subtitle.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q)
      );
    });
    const allowedSet = new Set(allowedNodes.map((n) => n.id));
    const allowedLinks = data.links
      .filter((l) => {
        const s = typeof l.source === "object" ? (l.source as GraphNode).id : l.source;
        const t = typeof l.target === "object" ? (l.target as GraphNode).id : l.target;
        return allowedSet.has(s) && allowedSet.has(t);
      })
      .map((l) => ({
        ...l,
        source: typeof l.source === "object" ? (l.source as GraphNode).id : l.source,
        target: typeof l.target === "object" ? (l.target as GraphNode).id : l.target,
      }));

    return {
      nodes: allowedNodes.map((n) => ({ ...n })),
      links: allowedLinks,
    };
  }, [data, activeGroup, searchQuery]);

  const focusedNode = useMemo(
    () => data.nodes.find((n) => n.id === focusedNodeId) || null,
    [data.nodes, focusedNodeId]
  );

  const connectedEdges = useMemo(() => {
    if (!focusedNodeId) return [];
    return data.links
      .map((l) => {
        const s = typeof l.source === "object" ? (l.source as GraphNode).id : l.source;
        const t = typeof l.target === "object" ? (l.target as GraphNode).id : l.target;
        if (s !== focusedNodeId && t !== focusedNodeId) return null;
        const otherId = s === focusedNodeId ? t : s;
        const otherNode = data.nodes.find((n) => n.id === otherId);
        return otherNode ? { node: otherNode, type: l.type, context: l.context } : null;
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [data.links, data.nodes, focusedNodeId]);

  const centerOnNode = (nodeId: string) => {
    setFocusedNodeId(nodeId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const liveNode = filteredGraph.nodes.find((n) => n.id === nodeId) as any;
    if (liveNode && fgRef.current && typeof liveNode.x === "number") {
      fgRef.current.centerAt(liveNode.x, liveNode.y, 600);
      fgRef.current.zoom(2.1, 600);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: <search> filter + Shape/Symbol Category Filter Pills */}
      <div className="lore-card p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end justify-between">
          <search className="flex-1 max-w-md">
            <label htmlFor={searchInputId} className="block text-sm font-semibold mb-1">
              Find a Character, Band, Book, Place, or Organization on the Map
            </label>
            <input
              id={searchInputId}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., Stardust Engine, Katie, Caelum-IV, CVTA…"
              className="lore-input text-sm"
              autoComplete="off"
            />
          </search>

          <div
            role="group"
            aria-label="Filter constellation nodes by category"
            className="flex flex-wrap gap-2"
          >
            <button
              type="button"
              aria-pressed={activeGroup === "all"}
              onClick={() => setActiveGroup("all")}
              className={activeGroup === "all" ? "lore-btn-primary text-xs" : "lore-btn-secondary text-xs"}
            >
              ✦ All ({data.nodes.length})
            </button>
            {(Object.keys(GROUP_META) as NodeGroup[]).map((groupKey) => {
              const meta = GROUP_META[groupKey];
              const count = data.nodes.filter((n) => n.group === groupKey).length;
              const isSelected = activeGroup === groupKey;
              return (
                <button
                  key={groupKey}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setActiveGroup(groupKey)}
                  className={isSelected ? "lore-btn-primary text-xs" : "lore-btn-secondary text-xs"}
                >
                  <span aria-hidden="true">{meta.symbol}</span>
                  <span>
                    {meta.plural} ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-xs" style={{ color: "var(--lore-text-muted)" }} aria-live="polite">
          Displaying {filteredGraph.nodes.length} entries and {filteredGraph.links.length} story/music connections. Click or Tab to any entry to inspect its connections and open its full guide.
        </p>
      </div>

      {/* Interactive Constellation Stage */}
      <div
        ref={containerRef}
        className="relative w-full h-[540px] sm:h-[600px] lore-card overflow-hidden"
      >
        {/* LAYER 1: 2D Force Canvas (hidden from screen readers; paired with Layer 2) */}
        <div aria-hidden="true" className="absolute inset-0">
          <ForceGraph2D
            ref={fgRef}
            graphData={filteredGraph}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor={isDark ? "#0b1120" : "#f8fafc"}
            nodeLabel={(n: unknown) => {
              const node = n as GraphNode;
              const meta = GROUP_META[node.group] || GROUP_META.character;
              return `${meta.symbol} ${node.name} (${meta.label})`;
            }}
            linkColor={() =>
              isDark ? "rgba(148, 163, 184, 0.35)" : "rgba(71, 85, 105, 0.32)"
            }
            linkWidth={(link: unknown) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const l = link as any;
              const sId = typeof l.source === "object" ? l.source.id : l.source;
              const tId = typeof l.target === "object" ? l.target.id : l.target;
              return sId === focusedNodeId || tId === focusedNodeId ? 2.5 : 1;
            }}
            nodeCanvasObject={(n: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const node = n as GraphNode & { x?: number; y?: number };
              const x = node.x ?? 0;
              const y = node.y ?? 0;
              const meta = GROUP_META[node.group] || GROUP_META.character;
              const isFocused = node.id === focusedNodeId;
              const fill = isFocused
                ? isDark
                  ? "#facc15"
                  : "#1e3a8a"
                : isDark
                  ? meta.darkColor
                  : meta.lightColor;
              const r = isFocused ? 7.5 : node.group === "band" ? 6.5 : 5.2;

              // Draw distinct shape per group so category is never conveyed by color alone
              ctx.save();
              ctx.beginPath();
              if (node.group === "band") {
                // Diamond
                ctx.moveTo(x, y - r * 1.25);
                ctx.lineTo(x + r * 1.25, y);
                ctx.lineTo(x, y + r * 1.25);
                ctx.lineTo(x - r * 1.25, y);
                ctx.closePath();
              } else if (node.group === "book") {
                // Square
                ctx.rect(x - r, y - r, r * 2, r * 2);
              } else if (node.group === "place") {
                // Triangle
                ctx.moveTo(x, y - r * 1.25);
                ctx.lineTo(x + r * 1.2, y + r);
                ctx.lineTo(x - r * 1.2, y + r);
                ctx.closePath();
              } else if (node.group === "organization") {
                // Hexagon
                for (let i = 0; i < 6; i++) {
                  const angle = (Math.PI / 3) * i;
                  const px = x + r * 1.15 * Math.cos(angle);
                  const py = y + r * 1.15 * Math.sin(angle);
                  if (i === 0) ctx.moveTo(px, py);
                  else ctx.lineTo(px, py);
                }
                ctx.closePath();
              } else {
                // Character: Circle
                ctx.arc(x, y, r, 0, 2 * Math.PI, false);
              }

              ctx.fillStyle = fill;
              ctx.fill();
              ctx.lineWidth = isFocused ? 2.4 / globalScale : 1.2 / globalScale;
              ctx.strokeStyle = isDark ? "#f8fafc" : "#0f172a";
              ctx.stroke();

              // Render readable text labels when zoomed in or focused
              if (globalScale >= 1.35 || isFocused || node.group === "band") {
                const fontSize = Math.max(10 / globalScale, 3.2);
                ctx.font = `${isFocused ? "700" : "600"} ${fontSize}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
                ctx.fillText(node.name, x, y + r + 2 / globalScale);
              }
              ctx.restore();
            }}
            onNodeClick={(node: unknown) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const n = node as any;
              setFocusedNodeId(n.id as string);
              if (fgRef.current && typeof n.x === "number") {
                fgRef.current.centerAt(n.x, n.y, 600);
                fgRef.current.zoom(2.1, 600);
              }
            }}
          />
        </div>

        {/* LAYER 2: Keyboard & Screen-Reader Semantic Node List */}
        <div className="sr-only">
          <h2>Interactive Universe Entries List</h2>
          <ul aria-label="Filtered Constellation Entries">
            {filteredGraph.nodes.map((node) => {
              const meta = GROUP_META[node.group] || GROUP_META.character;
              return (
                <li key={node.id}>
                  <button
                    type="button"
                    onFocus={() => centerOnNode(node.id)}
                    onClick={() => centerOnNode(node.id)}
                  >
                    {node.name} ({meta.label}) — {node.subtitle}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* LAYER 3: Slide-Over Inspector Drawer */}
        {focusedNode && (
          <aside
            aria-label={`Selected entry details: ${focusedNode.name}`}
            className="absolute inset-y-0 right-0 w-full sm:w-96 z-20 shadow-2xl border-l flex flex-col"
            style={{
              backgroundColor: "var(--lore-surface)",
              borderColor: "var(--lore-border)",
            }}
          >
            <div
              className="flex items-start justify-between gap-3 p-4 border-b"
              style={{ borderColor: "var(--lore-border-subtle)" }}
            >
              <div>
                <span className="lore-pill mb-2">
                  <span aria-hidden="true">
                    {GROUP_META[focusedNode.group]?.symbol || "✦"}
                  </span>
                  <span>{GROUP_META[focusedNode.group]?.label || focusedNode.group}</span>
                </span>
                <h2 className="text-lg font-bold leading-snug">{focusedNode.name}</h2>
                {focusedNode.subtitle && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--lore-text-muted)" }}>
                    {focusedNode.subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFocusedNodeId(null)}
                className="lore-btn-secondary text-sm px-3 py-1.5"
                aria-label="Close details panel"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4 text-sm">
              <p className="leading-relaxed">{focusedNode.summary}</p>

              <div className="flex flex-wrap gap-2.5">
                <Link href={focusedNode.href} className="lore-btn-primary text-xs">
                  Open Lore Guide →
                </Link>
                {focusedNode.externalUrl && focusedNode.externalLabel && (
                  <a
                    href={focusedNode.externalUrl}
                    className="lore-btn-secondary text-xs"
                  >
                    {focusedNode.externalLabel} ↗
                  </a>
                )}
              </div>

              {connectedEdges.length > 0 && (
                <div
                  className="pt-3 border-t"
                  style={{ borderColor: "var(--lore-border-subtle)" }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2">
                    Connected Across the Universe ({connectedEdges.length})
                  </h3>
                  <ul role="list" className="space-y-2 list-none p-0 m-0">
                    {connectedEdges.slice(0, 14).map((edge) => {
                      const edgeMeta = GROUP_META[edge.node.group] || GROUP_META.character;
                      return (
                        <li
                          key={edge.node.id}
                          className="p-2.5 rounded-lg border flex items-center justify-between gap-2"
                          style={{ borderColor: "var(--lore-border-subtle)" }}
                        >
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => centerOnNode(edge.node.id)}
                              className="lore-link font-semibold text-left truncate block"
                            >
                              <span aria-hidden="true">{edgeMeta.symbol} </span>
                              {edge.node.name}
                            </button>
                            <span
                              className="text-xs block truncate"
                              style={{ color: "var(--lore-text-muted)" }}
                            >
                              {edgeMeta.label}
                            </span>
                          </div>
                          <Link
                            href={edge.node.href}
                            className="lore-link text-xs font-semibold shrink-0"
                          >
                            Guide →
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
