/**
 * @license MIT
 * ============================================================================
 * next.config.ts — Next.js 16 Build & Static Export Configuration
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT THIS FILE IS: This is the master settings file for Next.js, the
 *     framework that builds `https://lore.raggiesoft.com`.
 *   - WHEN IT RUNS: It runs ONLY on the developer's computer (or deployment
 *     server) inside Node.js when you run `npm run dev` or `npm run build`.
 *     None of the code in this file is sent to a visitor's web browser.
 *   - WHAT DATA FEEDS INTO IT: Built-in TypeScript types from `"next"` and our
 *     installed CSS plugin (`"@tailwindcss/turbopack"`).
 *   - WHAT OUTPUT IT PRODUCES: It tells Next.js to pre-build the entire website
 *     into plain, ultra-fast static `.html`, `.css`, and `.js` files inside the
 *     `out/` folder so our Nginx web server can serve pages instantaneously
 *     without needing a live database or Node.js server running in production.
 * ============================================================================
 */

// `import type` is a TypeScript-only feature: it imports the shape ("blueprint")
// of a valid Next.js configuration object so your code editor can catch typos,
// and then completely erases this line when compiling to plain JavaScript.
import type { NextConfig } from "next";

// `const` declares a variable whose reference cannot be reassigned.
// `: NextConfig` is a TypeScript type annotation telling TypeScript to verify
// that every property inside `{ ... }` is a real, supported Next.js setting.
const nextConfig: NextConfig = {
  /*
   * `output: "export"` enables Next.js Static Site Generation (SSG) export mode.
   * Instead of generating pages on-the-fly when a user visits a URL, `next build`
   * visits every route ahead of time and writes finished `.html` files into `out/`.
   */
  output: "export",

  /*
   * `experimental` holds newer Next.js engine flags.
   * `ppr: false` explicitly disables "Partial Prerendering" (a hybrid server-streaming
   * mode) because our site is 100% pre-rendered static HTML (`output: "export"`).
   */
  experimental: {
    ppr: false,
  },

  /*
   * `turbopack` configures Next.js 16's Rust-based bundler (the tool that packages
   * our TypeScript, JSX, and CSS files into browser-ready bundles).
   * Here, the `"*.css"` glob rule tells Turbopack: "Whenever you import any file
   * ending in `.css` (like `src/app/globals.css`), run it through the Tailwind CSS v4
   * loader (`@tailwindcss/turbopack`) and emit standard browser `.css`."
   */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// `export default` makes `nextConfig` the main exported value of this module
// so the `next` command-line tool can automatically load and apply it.
export default nextConfig;
