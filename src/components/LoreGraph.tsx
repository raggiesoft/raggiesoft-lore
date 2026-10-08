"use client";

import React, { useRef, useState, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { GraphData, GraphNode, GraphLink } from "@/lib/parser";

export default function LoreGraph({ data }: { data: GraphData }) {
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Auto-resize canvas to fill container
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 64, // Subtract header height if any
      });
    };
    window.addEventListener("resize", updateDimensions);
    updateDimensions();
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // When a user Tabs to a hidden semantic node, pan the camera to it
  const handleNodeFocus = (nodeId: string) => {
    setFocusedNodeId(nodeId);
    const node = data.nodes.find((n) => n.id === nodeId);
    if (node && fgRef.current) {
      // @ts-ignore - The react-force-graph ref type doesn't expose this perfectly but it exists
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(2, 1000);
    }
  };

  const handleNodeBlur = () => {
    setFocusedNodeId(null);
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-gray-50 dark:bg-zinc-900 overflow-hidden">
      
      {/* 
        LAYER 1: The Visual Canvas 
        Hidden from screen readers using aria-hidden="true" 
      */}
      <div aria-hidden="true" className="absolute inset-0">
        <ForceGraph2D
          ref={fgRef}
          graphData={data}
          width={dimensions.width}
          height={dimensions.height}
          nodeLabel="name"
          nodeVal={(node: any) => (node.id === focusedNodeId ? 10 : 5)} // Node size
          nodeColor={(node: any) => {
            if (node.id === focusedNodeId) return "#facc15"; // yellow-400 for focused
            switch (node.group) {
              case "character": return "#3b82f6"; // blue-500
              case "location": return "#10b981"; // emerald-500
              case "event": return "#ef4444"; // red-500
              case "organization": return "#8b5cf6"; // violet-500
              default: return "#9ca3af"; // gray-400
            }
          }}
          linkColor={() => "rgba(150, 150, 150, 0.4)"}
          linkWidth={(link: any) => {
            const sId = typeof link.source === 'object' ? link.source.id : link.source;
            const tId = typeof link.target === 'object' ? link.target.id : link.target;
            return (sId === focusedNodeId || tId === focusedNodeId) ? 2 : 1;
          }}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          onNodeClick={(node) => {
            // Visual click pans camera and sets focus
            setFocusedNodeId(node.id as string);
            fgRef.current.centerAt(node.x, node.y, 1000);
            fgRef.current.zoom(2, 1000);
          }}
        />
      </div>

      {/* 
        LAYER 2: The Semantic Accessibility Layer
        sr-only tailwind class visually hides this from sighted users
        but keeps it in the DOM for screen readers and keyboard tabbing
      */}
      <div className="sr-only">
        <h1>RaggieSoft Lore Knowledge Graph</h1>
        <p>This is an interactive graph of characters, locations, and events.</p>
        
        <ul aria-label="List of all Lore Nodes">
          {data.nodes.map((node) => {
            // Find edges connected to this node
            const relatedEdges = data.links.filter(
              (l) => l.source === node.id || (typeof l.source === "object" && (l.source as any).id === node.id)
            );

            return (
              <li key={node.id}>
                {/* 
                  tabIndex={0} makes it focusable by keyboard 
                  onFocus triggers the canvas camera to pan!
                */}
                <div
                  tabIndex={0}
                  onFocus={() => handleNodeFocus(node.id)}
                  onBlur={handleNodeBlur}
                  aria-label={`${node.name}, a ${node.group}.`}
                >
                  <h2>{node.name} ({node.group})</h2>
                  {relatedEdges.length > 0 && (
                    <ul aria-label={`Connections for ${node.name}`}>
                      {relatedEdges.map((edge, idx) => {
                        // In react-force-graph, after initialization, source/target become full node objects
                        const targetId = typeof edge.target === "object" ? (edge.target as any).id : edge.target;
                        const targetNode = data.nodes.find((n) => n.id === targetId);
                        
                        return (
                          <li key={idx}>
                            Connected to {targetNode?.name || targetId} as {edge.type}. 
                            Context: {edge.context}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

    </div>
  );
}

