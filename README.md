# RaggieSoft Lore Graph

The **RaggieSoft Lore Graph** is a statically generated, interactive semantic knowledge web mapping out the characters, events, locations, and organizations within the RaggieSoft universe.

## 🏗️ Architecture

Because the site is hosted on a pure Nginx/PHP server without Node.js, this application is built as a **Static Next.js Export**. 
- The markdown files in `/vault/` are parsed during the **build step** (not at runtime).
- A static `index.html` is generated alongside a pre-computed JSON payload of all graph nodes and edges.
- The compiled `/out/` folder is committed directly to GitHub, allowing the production server to simply pull the repository and serve the static files.

## ♿ Dual-Layer Accessibility

Accessibility is a first-class citizen in the RaggieSoft ecosystem. Because `<canvas>` elements are invisible to screen readers, this project implements a **Dual-Layer Architecture**:

1. **The Visual Layer**: `react-force-graph-2d` renders the physics-based graph for sighted users on an HTML5 `<canvas>`.
2. **The Semantic Layer**: A visually hidden (but DOM-present) `<ul>` list maps out every node and its connections using semantic HTML. 
   - `tabIndex={0}` allows keyboard users to tab through the nodes.
   - When a hidden semantic node receives focus, it triggers the visual canvas camera to automatically pan and zoom to that specific node.

## 📝 Markdown Frontmatter Schema

To add a new entity to the graph, create a markdown file in `/vault/` with the following YAML frontmatter schema:

```yaml
---
id: "unique-id"
name: "Display Name"
type: "character | location | event | organization"
tags: ["tag-1", "tag-2"]
relations:
  - target: "target-id"
    type: "cousin | friend | enemy | located_in | etc"
    context: "A brief description of how these two nodes are related."
---

# Display Name
Your markdown content goes here...
```

## 🚀 Deployment Pipeline

This repository is governed by the RaggieSoft automated deployment ecosystem.

1. **Local Build**: Run `npm run build` locally to update the static `/out/` directory.
2. **Jenna Sync**: Use `./jenna-sync.sh --push -m "..."` from the workspace root to push the codebase (including the `/out/` folder) to GitHub.
3. **Sarah Deploy**: On the production server, run `./sarah-deploy.sh` (or let the cron job catch it). Sarah will pull the GitHub updates and gracefully `rsync` the `/out/` directory into `/var/www/lore.raggiesoft.com`.

## 📄 Licensing
- **Code**: MIT License
- **Creative Content (Lore)**: CC BY-SA 4.0
