/**
 * @license MIT
 * ============================================================================
 * eslint.config.mjs — ESLint v9 Code Quality & Accessibility Linter Config
 * ============================================================================
 * Plain-English Overview (Read-Along Guide):
 *   - WHAT THIS FILE IS: ESLint is a "linter"—an automated proofreader for
 *     JavaScript, TypeScript, and React JSX. Just like spell-check underlines
 *     typos in an essay, ESLint catches bugs, unused variables, broken React
 *     Hooks rules, and missing accessibility attributes before code ever ships.
 *   - WHY `.mjs`?: The `.mjs` extension stands for "Module JavaScript" (ES
 *     Modules), telling Node.js that this file uses modern `import` and
 *     `export` statements instead of legacy `require()`.
 *   - WHEN IT RUNS: Runs only during development (`npm run lint` or live inside
 *     your code editor). It never runs in the visitor's browser.
 *   - WHAT OUTPUT IT PRODUCES: Exports an array of linting rule objects read by
 *     the `eslint` CLI (`exit code 0` when clean, diagnostic warnings/errors if
 *     a rule is violated).
 * ============================================================================
 */

// Named imports pull specific helper functions out of ESLint v9's "Flat Config" package:
// - `defineConfig`: wraps our array of rules with editor autocomplete support.
// - `globalIgnores`: tells ESLint which auto-generated folders to skip completely.
import { defineConfig, globalIgnores } from "eslint/config";

// Official Next.js rule presets:
// - `nextVitals`: checks Core Web Vitals (fast page loading), React Hooks rules,
//   and `eslint-plugin-jsx-a11y` (WAI-ARIA accessibility checks on HTML/JSX tags).
import nextVitals from "eslint-config-next/core-web-vitals";

// - `nextTs`: adds TypeScript-specific checks (such as catching unsafe `any` types).
import nextTs from "eslint-config-next/typescript";

// Build the combined configuration list.
// Notice `...nextVitals` and `...nextTs`: those three dots (`...`) are the
// JavaScript "spread operator." Because `nextVitals` and `nextTs` are already
// arrays of rule objects, `...` unpacks all of their items flat into our single
// top-level array `[ ... ]`.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next so ESLint only checks our
  // hand-written source code and never wastes time linting machine-built output.
  // In glob patterns, `**` means "match any file inside any nested subfolder."
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**", // Temporary build cache created by `next dev` / `next build`
    "out/**", // Final static HTML/CSS/JS export served by Nginx
    "build/**", // Generic build output folder convention
    "next-env.d.ts", // Auto-generated Next.js TypeScript ambient types file
  ]),
]);

// Export the finished configuration as the module's default export for ESLint.
export default eslintConfig;
