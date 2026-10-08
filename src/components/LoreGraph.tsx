"use client";

import React, { useRef, useState, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

      {/* LAYER 3: The Side Panel */}
      <div
        className={`absolute top-0 right-0 w-full md:w-96 h-full bg-white dark:bg-zinc-800 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
          focusedNodeId ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!focusedNodeId}
      >
        {focusedNodeId && (
          <>
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {data.nodes.find((n) => n.id === focusedNodeId)?.name}
              </h2>
              <button
                onClick={() => setFocusedNodeId(null)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 dark:text-gray-400"
                aria-label="Close panel"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 prose prose-sm dark:prose-invert">
              <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {data.nodes.find((n) => n.id === focusedNodeId)?.group}
              </div>
              
              {/* Metadata mapping */}
              {Object.entries(data.nodes.find((n) => n.id === focusedNodeId)?.metadata || {}).length > 0 && (
                <div className="mb-6 bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2 mt-0">Metadata</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm">
                    {Object.entries(data.nodes.find((n) => n.id === focusedNodeId)?.metadata || {}).map(([key, value]) => (
                      <div key={key} className="sm:col-span-1">
                        <dt className="font-medium text-gray-500 dark:text-gray-400 capitalize">{key.replace(/_/g, ' ')}</dt>
                        <dd className="text-gray-900 dark:text-gray-200 mt-1">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Markdown Content */}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {(() => {
                  let content = data.nodes.find((n) => n.id === focusedNodeId)?.content || "";
                  // Replace {{cms}} with the actual assets CDN
                  content = content.replace(/\{\{cms\}\}/g, 'https://assets.raggiesoft.com');
                  // Map custom communication tags to accessible Markdown representations
                  content = content.replace(/<aac>(.*?)<\/aac>/gi, '_$1_ (AAC)');
                  content = content.replace(/<sgn>(.*?)<\/sgn>/gi, '_$1_ (Signed)');
                  content = content.replace(/<asl>(.*?)<\/asl>/gi, '_$1_ (ASL)');
                  content = content.replace(/<sms>(.*?)<\/sms>/gi, '_$1_ (Text Message)');
                  return content;
                })()}
              </ReactMarkdown>
            </div>
          </>
        )}
      </div>

    </div>
  );
}

