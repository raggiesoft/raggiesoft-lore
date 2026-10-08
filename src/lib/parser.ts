import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface GraphNode {
  id: string;
  name: string;
  group: string; // e.g., 'character', 'location', 'event'
  val: number; // visual size of node
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  context: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function getLoreGraphData(): GraphData {
  const vaultDirectory = path.join(process.cwd(), 'vault');
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const existingNodeIds = new Set<string>();

  // Helper to recursively read all markdown files
  function readDirectory(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        readDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data } = matter(fileContents);

        if (data.id) {
          existingNodeIds.add(data.id);
          nodes.push({
            id: data.id,
            name: data.name || data.id,
            group: data.type || 'unknown',
            val: 10, // Base size
          });

          // Process relations (edges)
          if (Array.isArray(data.relations)) {
            data.relations.forEach((rel: any) => {
              if (rel.target) {
                links.push({
                  source: data.id,
                  target: rel.target,
                  type: rel.type || 'related',
                  context: rel.context || '',
                });
              }
            });
          }
        }
      }
    }
  }

  // Scan the vault
  readDirectory(vaultDirectory);

  // Filter out links pointing to non-existent nodes (prevents graph crashing)
  const validLinks = links.filter((link) => existingNodeIds.has(link.target));

  return {
    nodes,
    links: validLinks,
  };
}

