"use client";

/**
 * @license MIT
 * ============================================================================
 * src/components/LoreGraphWrapper.tsx — Browser-Only Dynamic Loader for `<canvas>`
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - LINE 1 (`"use client";`): In Next.js 16 App Router, components run on the
 *     build server by default ("Server Components"). Writing `"use client";` as
 *     the very first statement marks this file as a **Client Component**, telling
 *     Next.js to include this code in the JavaScript bundle sent to the visitor's
 *     web browser so interactive features work.
 *   - WHY THIS WRAPPER FILE EXISTS (THE `<canvas>` & `window` PROBLEM):
 *     Even Client Components normally get an initial HTML preview ("Server-Side
 *     Rendering" / static pre-render) inside Node.js during `next build`.
 *     However, `<LoreGraph />` uses `react-force-graph-2d`, which immediately
 *     reaches for browser-only APIs like `window`, `document`, and the HTML5
 *     2D `<canvas>` graphics engine—none of which exist inside Node.js on a
 *     build server! Without this wrapper, `next build` would crash with:
 *       `ReferenceError: window is not defined`
 *   - HOW `dynamic(..., { ssr: false })` SOLVES IT:
 *     Next.js's `dynamic()` helper with `{ ssr: false }` ("Server-Side Rendering:
 *     off") tells Next.js: "Skip running `LoreGraph.tsx` completely in Node.js
 *     during `next build`. Instead, download and mount `<LoreGraph />` ONLY after
 *     the page opens inside a real web browser where `window` and `<canvas>` exist."
 *     (Next.js 16 requires `{ ssr: false }` to be called inside a `"use client"`
 *     file rather than a Server Component like `src/app/page.tsx`, which is why
 *     this clean 2-step handoff exists!)
 *   - DATA FLOW: `src/app/page.tsx` (Server) -> `<LoreGraphWrapper data={graph} />`
 *     -> `<LoreGraph data={data} />` (Browser).
 * ============================================================================
 */

// Import Next.js's code-splitting / lazy-loading helper (`dynamic`) and the
// TypeScript `GraphData` shape (`{ nodes, links }`) from our graph parser library.
import dynamic from "next/dynamic";
import { GraphData } from "@/lib/parser";

// Create a browser-only version of `<LoreGraph />`.
// - `() => import("./LoreGraph")` is a standard JavaScript "dynamic import":
//   instead of loading `LoreGraph.tsx` immediately when Node.js starts, it splits
//   the heavy 2D physics graph engine into its own separate `.js` chunk so the
//   rest of the home page loads instantaneously!
// - `{ ssr: false }` guarantees `LoreGraph` never executes on the server.
const LoreGraphNoSSR = dynamic(() => import("./LoreGraph"), { ssr: false });

/**
 * Thin Client Component bridge rendered by `src/app/page.tsx`.
 * Accepts `{ data }` (using JavaScript object destructuring on the `props` object)
 * and forwards it straight into `<LoreGraphNoSSR />` in the visitor's browser.
 */
export default function LoreGraphWrapper({ data }: { data: GraphData }) {
  return <LoreGraphNoSSR data={data} />;
}
