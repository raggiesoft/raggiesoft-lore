"use client";

/**
 * @license MIT
 * ============================================================================
 * src/components/LoreGraph.tsx — Accessible 2D Constellation Knowledge Graph
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - LINE 1 (`"use client";`): Marks this file as a **React Client Component**
 *     that runs interactively inside the visitor's web browser (loaded lazily
 *     by `LoreGraphWrapper.tsx` with `ssr: false` so it always has access to
 *     `window`, `matchMedia`, and the HTML5 `<canvas>` 2D drawing engine).
 *   - WHAT DATA FEEDS INTO IT: Receives `data` (`GraphData` = `{ nodes, links }`)
 *     pre-compiled at build time into `src/generated/encyclopedia.json`, uniting
 *     all 5 RaggieSoft universe pillars (`character`, `band`, `book`, `place`,
 *     and `organization`).
 *   - WHAT UI IT PRODUCES & HOW THE ACCESSIBLE `<canvas>` ARCHITECTURE WORKS:
 *     An HTML5 `<canvas>` is just a rectangular bitmap of colored pixels—like a
 *     photograph painted 60 times per second by JavaScript. Sighted mouse/touch
 *     users see stars and connecting lines, but screen readers (JAWS, NVDA,
 *     Apple VoiceOver) and keyboard `Tab` users CANNOT see or focus pixels drawn
 *     inside `<canvas>`!
 *
 *     To give 100% equal access to sighted mouse users, colorblind readers,
 *     keyboard-only navigators, and blind screen-reader users, `<LoreGraph />`
 *     coordinates **Three Synchronized Layers** driven by the exact same React state:
 *       1. LAYER 1 — Visual 2D Force `<canvas>` (`aria-hidden="true"`):
 *          Hidden from screen readers so assistive tech doesn't stall on an
 *          unlabeled graphic. Draws 5 distinct geometric shapes (circle, diamond,
 *          square, triangle, hexagon) + high-contrast Light/Dark palettes synced
 *          live to the OS `prefers-color-scheme` setting—never relying on color alone!
 *       2. LAYER 2 — Parallel Semantic DOM Node List (`.sr-only`):
 *          A real HTML `<h2>` + `<ul aria-label="Filtered Constellation Entries">`
 *          containing native `<button>` elements (automatically keyboard-focusable
 *          in the `Tab` order!). Focusing (`onFocus`) or pressing `Enter`/`Space`
 *          (`onClick`) on ANY entry calls `centerOnNode(node.id)`—smoothly panning
 *          and zooming the visual `<canvas>` camera right onto that star AND
 *          opening Layer 3!
 *       3. LAYER 3 — Slide-Over Inspector `<aside>` Drawer:
 *          A semantic HTML landmark panel displaying the selected entry's category
 *          pill, spoiler-safe summary, Lore Guide `<Link>`, external Book Reader /
 *          Listening Room link, and interactive buttons for every connected neighbor
 *          across the universe—paired with an `aria-live="polite"` status banner
 *          above the stage that announces filter changes to screen readers!
 * ============================================================================
 */

// Import React and 5 built-in React Hooks:
// - `useState`: stores values that change as the user interacts (triggers UI re-renders).
// - `useEffect`: runs browser side effects (measuring element width, listening to OS dark mode).
// - `useMemo`: caches ("memoizes") derived filtered arrays so physics doesn't reset unnecessarily.
// - `useRef`: holds a persistent reference to a DOM element (`<div>`) or `<ForceGraph2D>` camera API.
// - `useId`: generates a collision-free HTML `id` string linking `<label>` to `<input>`.
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
// Next.js `<Link>` performs instant client-side navigation between internal Lore pages.
import Link from "next/link";
// Third-party 2D physics simulation (`d3-force`) + HTML5 `<canvas>` renderer.
import ForceGraph2D from "react-force-graph-2d";
// TypeScript-only shapes (`import type` is erased when compiled to browser JS).
import type { GraphData, GraphNode } from "@/lib/parser";
import type { NodeGroup } from "@/lib/encyclopedia";

/**
 * Lookup table mapping each of the 5 `NodeGroup` categories to its display labels,
 * geometric Unicode symbol, and accessible Light Mode / Dark Mode hex colors.
 *
 * TypeScript Concept — `Record<KeyType, ValueType>`:
 * Guarantees at compile time that ALL 5 members of `NodeGroup` (`character`, `band`,
 * `book`, `place`, `organization`) are present and have identical property names.
 *
 * Accessibility Concept — Shape + Symbol + Text (WCAG 1.4.1 Use of Color):
 * Pairing `●`, `◆`, `■`, `▲`, `⬡` with custom `<canvas>` polygon geometry means
 * a reader with red-green or total color blindness can distinguish a Band diamond
 * from a Book square or a Place triangle immediately!
 */
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
  // --------------------------------------------------------------------------
  // 1. Refs & Accessible Form IDs (`useRef` and `useId`)
  // --------------------------------------------------------------------------
  // `containerRef` points to the wrapper `<div ref={containerRef}>` around our
  // `<canvas>` so we can measure its exact pixel width & height on phones, tablets,
  // and widescreen monitors. Unlike `useState`, updating `.current` does NOT re-render.
  const containerRef = useRef<HTMLDivElement | null>(null);

  // `fgRef` points to the live `<ForceGraph2D>` instance so we can imperatively
  // command its camera (`fgRef.current.centerAt(...)` and `fgRef.current.zoom(...)`)
  // whenever a keyboard, screen-reader, or mouse user selects a node.
  // (`eslint-disable-next-line` tells ESLint we intentionally use `any` on the next
  // line because `react-force-graph-2d`'s imperative ref methods are dynamically typed.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);

  // Generates a unique HTML ID (like `":r0:"`) linking `<label htmlFor={searchInputId}>`
  // with `<input id={searchInputId}>` so screen readers read the label aloud on focus.
  const searchInputId = useId();

  // --------------------------------------------------------------------------
  // 2. Reactive Component State (`useState`)
  // --------------------------------------------------------------------------
  // Each `useState(initialValue)` call returns a 2-item array `[currentValue, setterFunction]`.
  // Calling a `set...` function schedules a React re-render so the UI updates automatically:
  // - `dimensions`: explicit pixel `{ width, height }` required by HTML5 `<canvas>`.
  const [dimensions, setDimensions] = useState({ width: 960, height: 560 });
  // - `isDark`: `true` when the visitor's OS is in Dark Mode, `false` in Light Mode.
  const [isDark, setIsDark] = useState(false);
  // - `activeGroup`: currently selected category filter pill (`"all"` or one of the 5 `NodeGroup`s).
  const [activeGroup, setActiveGroup] = useState<NodeGroup | "all">("all");
  // - `searchQuery`: live text typed into the `<input type="search">` box.
  const [searchQuery, setSearchQuery] = useState("");
  // - `focusedNodeId`: `id` of the currently inspected node (`null` when the drawer is closed).
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // 3. Browser Side Effects (`useEffect`)
  // --------------------------------------------------------------------------

  // Effect A: Measure the stage `<div>` responsively whenever the page loads or
  // the browser window is resized (`window.addEventListener("resize", ...)`).
  // HTML5 `<canvas>` elements cannot size their internal coordinate grid with CSS
  // percentages alone—passing exact `width` & `height` numbers prevents blurry stretching.
  // Note the empty dependency array `[]` at the end: that tells React "set up this
  // resize listener ONCE on mount, and run the returned `() => removeEventListener(...)`
  // cleanup function if the user navigates away so we never leak memory."
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

  // Effect B: Track `prefers-color-scheme: dark` AND subscribe to its live `change`
  // event! Normal HTML elements automatically update via CSS Custom Properties
  // (`var(--lore-bg)` in `globals.css`), but HTML5 `<canvas>` 2D drawing commands
  // (`ctx.fillStyle = ...`) execute in JavaScript and need real color strings.
  // Subscribing to `mql.addEventListener("change", ...)` means if a reader toggles
  // macOS/Windows/iOS between Light and Dark Mode while viewing the map, `<canvas>`
  // repaints its background, links, and nodes instantaneously!
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mql.matches);
    const onSchemeChange = (ev: MediaQueryListEvent) => {
      setIsDark(ev.matches);
    };
    mql.addEventListener("change", onSchemeChange);
    return () => mql.removeEventListener("change", onSchemeChange);
  }, []);

  // --------------------------------------------------------------------------
  // 4. Memoized Graph Filtering & Neighbor Lookups (`useMemo`)
  // --------------------------------------------------------------------------

  // `useMemo` caches `filteredGraph` and ONLY recalculates it when `data`,
  // `activeGroup`, or `searchQuery` changes! Why is this critical? If clicking a
  // node (`setFocusedNodeId`) built a brand-new `filteredGraph` object, `ForceGraph2D`
  // would restart its physics explosion from scratch instead of smoothly panning!
  const filteredGraph = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    // Step 1: Keep nodes matching BOTH the active category pill AND search query.
    const allowedNodes = data.nodes.filter((n) => {
      if (activeGroup !== "all" && n.group !== activeGroup) return false;
      if (!q) return true;
      return (
        n.name.toLowerCase().includes(q) ||
        n.subtitle.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q)
      );
    });
    // Step 2: Build a fast `Set` of surviving node IDs so we only keep connecting
    // lines (`links`) whose `source` AND `target` are BOTH currently visible.
    // Subtle `d3-force` detail: on its first physics tick, `ForceGraph2D` mutates
    // `l.source` / `l.target` from string IDs (`"band:firelight"`) into live object
    // references (`{ id: "band:firelight", x: 12.4, y: -8.1, ... }`), so we normalize
    // both cases safely via `typeof l.source === "object"`.
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

    // Step 3: Return shallow clones `({ ...n })` so `d3-force` can freely write
    // live `x`/`y` physics coordinates onto each node copy without mutating `data`.
    return {
      nodes: allowedNodes.map((n) => ({ ...n })),
      links: allowedLinks,
    };
  }, [data, activeGroup, searchQuery]);

  // Look up the full `GraphNode` object for whichever node ID is currently focused
  // (`null` when no node is selected, which hides Layer 3's slide-over drawer).
  const focusedNode = useMemo(
    () => data.nodes.find((n) => n.id === focusedNodeId) || null,
    [data.nodes, focusedNodeId]
  );

  // Find every neighbor connected to `focusedNodeId` (whether `focusedNodeId` is
  // the `source` OR the `target` of the link) to populate Layer 3's "Connected
  // Across the Universe" list.
  // TypeScript Concept — Type Predicate `(x): x is NonNullable<typeof x>`:
  // Tells TypeScript that `.filter(Boolean)` has removed every `null` entry, narrowing
  // the resulting array type cleanly so we don't need `edge?.node` null checks later!
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

  /**
   * Unified camera + focus coordinator shared by BOTH Layer 2 (screen-reader /
   * keyboard `Tab` buttons) and Layer 3 (clicking a neighbor inside the drawer):
   *   1. Sets `focusedNodeId` -> opens/updates the semantic `<aside>` inspector drawer.
   *   2. Finds the node's live physics `(x, y)` coordinates on the `<canvas>` and
   *      smoothly pans (`centerAt`) + zooms (`zoom(2.1)`) over `600` milliseconds!
   * (Note for React learners: if this helper were passed as a prop to a `React.memo`
   * child component, you could wrap it in React's `useCallback` hook; here it is
   * called directly inside inline button handlers.)
   */
  const centerOnNode = (nodeId: string) => {
    setFocusedNodeId(nodeId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const liveNode = filteredGraph.nodes.find((n) => n.id === nodeId) as any;
    if (liveNode && fgRef.current && typeof liveNode.x === "number") {
      fgRef.current.centerAt(liveNode.x, liveNode.y, 600);
      fgRef.current.zoom(2.1, 600);
    }
  };

  // --------------------------------------------------------------------------
  // 5. JSX Render Tree (Toolbar + 3-Layer Accessible Constellation Stage)
  // --------------------------------------------------------------------------
  // JSX Tip: Inside HTML-like JSX tags below, comments are written inside curly
  // braces `{/* ... */}` because `{ ... }` switches JSX into JavaScript mode!
  return (
    <div className="space-y-4">
      {/* Toolbar: Semantic HTML5 `<search>` landmark + Category Toggle Pills */}
      <div className="lore-card p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end justify-between">
          {/* `<search>` is a native HTML5 landmark recognized directly by JAWS, NVDA, and VoiceOver */}
          <search className="flex-1 max-w-md">
            <label htmlFor={searchInputId} className="block text-sm font-semibold mb-1">
              Find a Character, Band, Book, Place, or Organization on the Map
            </label>
            {/* Controlled React Input: `value={searchQuery}` + `onChange` keeps React state in lockstep with every keystroke */}
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

          {/* Category Filter Button Group:
              - `role="group"` + `aria-label` groups the 6 filter pills as one named control bar.
              - `aria-pressed={...}` turns each `<button>` into an accessible WAI-ARIA toggle button
                (screen readers announce "Bands (8), toggle button, pressed" or "not pressed"). */}
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
                  {/* `aria-hidden="true"` hides the decorative shape symbol from screen-reader speech
                      so VoiceOver reads cleanly: "Bands (8)" instead of "Black Diamond Suit Bands (8)" */}
                  <span aria-hidden="true">{meta.symbol}</span>
                  <span>
                    {meta.plural} ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Live Screen-Reader Region (`aria-live="polite"`):
            Whenever `filteredGraph.nodes.length` or `links.length` changes in response
            to typing or clicking a filter pill, assistive technologies wait until the
            current speech finishes ("polite") and then automatically read this updated
            count aloud! */}
        <p className="text-xs" style={{ color: "var(--lore-text-muted)" }} aria-live="polite">
          Displaying {filteredGraph.nodes.length} entries and {filteredGraph.links.length} story/music connections. Click or Tab to any entry to inspect its connections and open its full guide.
        </p>
      </div>

      {/* Interactive Constellation Stage (`ref={containerRef}` measures pixel dimensions) */}
      <div
        ref={containerRef}
        className="relative w-full h-[540px] sm:h-[600px] lore-card overflow-hidden"
      >
        {/* ====================================================================
            LAYER 1: 2D Force-Directed HTML5 `<canvas>` (`aria-hidden="true"`)
            ====================================================================
            Why `aria-hidden="true"`? A `<canvas>` has no internal DOM tree—to a
            screen reader it is an opaque image with no focusable items inside it.
            Hiding Layer 1 from the accessibility tree prevents screen readers
            from announcing a dead graphic, delegating keyboard & assistive-tech
            interaction cleanly to Layer 2 right below! */}
        <div aria-hidden="true" className="absolute inset-0">
          <ForceGraph2D
            ref={fgRef}
            graphData={filteredGraph}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor={isDark ? "#0b1120" : "#f8fafc"}
            nodeLabel={(n: unknown) => {
              // Hover tooltip for mouse/trackpad pointers (includes symbol + name + category)
              const node = n as GraphNode;
              const meta = GROUP_META[node.group] || GROUP_META.character;
              return `${meta.symbol} ${node.name} (${meta.label})`;
            }}
            linkColor={() =>
              isDark ? "rgba(148, 163, 184, 0.35)" : "rgba(71, 85, 105, 0.32)"
            }
            linkWidth={(link: unknown) => {
              // Thicken edges (`2.5px` vs `1px`) connected directly to the currently focused node!
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const l = link as any;
              const sId = typeof l.source === "object" ? l.source.id : l.source;
              const tId = typeof l.target === "object" ? l.target.id : l.target;
              return sId === focusedNodeId || tId === focusedNodeId ? 2.5 : 1;
            }}
            nodeCanvasObject={(n: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => {
              // Custom HTML5 2D `<canvas>` Painter (`CanvasRenderingContext2D`):
              // Runs for EVERY visible node on EVERY animation frame!
              // - `n`: the node object with live physics coordinates `(x, y)`
              // - `ctx`: the browser's 2D paintbrush API
              // - `globalScale`: current camera zoom level (`1` = default, `>1` = zoomed in)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const node = n as GraphNode & { x?: number; y?: number };
              const x = node.x ?? 0;
              const y = node.y ?? 0;
              const meta = GROUP_META[node.group] || GROUP_META.character;
              const isFocused = node.id === focusedNodeId;

              // Highlight the focused node in bright gold (dark mode) or deep royal blue (light mode);
              // otherwise use the category's accessible theme color.
              const fill = isFocused
                ? isDark
                  ? "#facc15"
                  : "#1e3a8a"
                : isDark
                  ? meta.darkColor
                  : meta.lightColor;
              const r = isFocused ? 7.5 : node.group === "band" ? 6.5 : 5.2;

              // Draw a unique geometric shape per `node.group` so category identity
              // is NEVER communicated by color alone:
              // `ctx.save()` / `ctx.restore()` isolates paintbrush styles to just this node.
              ctx.save();
              ctx.beginPath();
              if (node.group === "band") {
                // Band = 4-point Diamond (top -> right -> bottom -> left)
                ctx.moveTo(x, y - r * 1.25);
                ctx.lineTo(x + r * 1.25, y);
                ctx.lineTo(x, y + r * 1.25);
                ctx.lineTo(x - r * 1.25, y);
                ctx.closePath();
              } else if (node.group === "book") {
                // Book Series = Square centered on `(x, y)`
                ctx.rect(x - r, y - r, r * 2, r * 2);
              } else if (node.group === "place") {
                // Place & Transit = Upward Triangle
                ctx.moveTo(x, y - r * 1.25);
                ctx.lineTo(x + r * 1.2, y + r);
                ctx.lineTo(x - r * 1.2, y + r);
                ctx.closePath();
              } else if (node.group === "organization") {
                // Organization = 6-sided Hexagon computed via unit-circle trigonometry
                // (`Math.PI / 3` radians = 60 degrees per vertex around `360° = 2π`)
                for (let i = 0; i < 6; i++) {
                  const angle = (Math.PI / 3) * i;
                  const px = x + r * 1.15 * Math.cos(angle);
                  const py = y + r * 1.15 * Math.sin(angle);
                  if (i === 0) ctx.moveTo(px, py);
                  else ctx.lineTo(px, py);
                }
                ctx.closePath();
              } else {
                // Character = Full Circle (`0` to `2 * Math.PI` radians)
                ctx.arc(x, y, r, 0, 2 * Math.PI, false);
              }

              // Paint interior fill + high-contrast outline stroke (dividing `lineWidth`
              // by `globalScale` keeps border thickness visually crisp when zooming in!).
              ctx.fillStyle = fill;
              ctx.fill();
              ctx.lineWidth = isFocused ? 2.4 / globalScale : 1.2 / globalScale;
              ctx.strokeStyle = isDark ? "#f8fafc" : "#0f172a";
              ctx.stroke();

              // Progressive Label Disclosure: always show Band names and the focused node's
              // name, and reveal ALL node names once zoomed in (`globalScale >= 1.35`) so
              // the zoomed-out overview stays clean and readable!
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
              // Mouse / touch tap handler on `<canvas>`: select the clicked star,
              // open Layer 3's drawer, and smoothly center + zoom the camera onto it!
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

        {/* ====================================================================
            LAYER 2: Keyboard & Screen-Reader Semantic Node List (`.sr-only`)
            ====================================================================
            How `.sr-only` works: Unlike `display: none` or `visibility: hidden`
            (which hide elements from screen readers AND keyboard `Tab` too!),
            Tailwind's `.sr-only` keeps this `<ul>` of native `<button>` elements
            100% live in the browser's DOM and Accessibility Tree while clipping
            it visually to `1px × 1px`.
            - JAWS / NVDA / VoiceOver users can jump straight to `<h2>Interactive
              Universe Entries List</h2>` or browse the `<ul>` with list shortcuts.
            - Keyboard `Tab` users step through each `<button>`; `onFocus` fires
              `centerOnNode(node.id)`, panning/zooming Layer 1's `<canvas>` AND
              opening Layer 3's visible `<aside>` drawer for sighted keyboard users! */}
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

        {/* ====================================================================
            LAYER 3: Slide-Over Inspector Drawer (`<aside>`)
            ====================================================================
            Conditional Rendering (`{focusedNode && (...)}`): In JSX, when
            `focusedNode` is `null`, nothing renders; as soon as a mouse, touch,
            keyboard, or screen-reader user selects a node, this semantic `<aside>`
            landmark slides over the right edge of the stage with full details
            and clickable neighbor connections! */}
        {focusedNode && (
          <aside
            aria-label={`Selected entry details: ${focusedNode.name}`}
            className="absolute inset-y-0 right-0 w-full sm:w-96 z-20 shadow-2xl border-l flex flex-col"
            style={{
              backgroundColor: "var(--lore-surface)",
              borderColor: "var(--lore-border)",
            }}
          >
            {/* Drawer Header: Category Pill + Entry Name + Accessible Close Button */}
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
              {/* Icon-only buttons (`✕`) MUST provide an `aria-label` so screen readers announce "Close details panel" */}
              <button
                type="button"
                onClick={() => setFocusedNodeId(null)}
                className="lore-btn-secondary text-sm px-3 py-1.5"
                aria-label="Close details panel"
              >
                ✕
              </button>
            </div>

            {/* Drawer Scrollable Body: Summary + Action Links + Connected Neighbors */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4 text-sm">
              <p className="leading-relaxed">{focusedNode.summary}</p>

              <div className="flex flex-wrap gap-2.5">
                {/* Internal route uses Next.js `<Link>`; cross-subdomain link uses standard `<a>` */}
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

              {/* Neighbor Traversal List: clicking any connected entry's button flies the
                  constellation camera straight to that neighbor so users can hop across the graph! */}
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
