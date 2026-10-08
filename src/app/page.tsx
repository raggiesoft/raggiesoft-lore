import { getLoreGraphData } from "@/lib/parser";
import LoreGraph from "@/components/LoreGraph";

export default function Home() {
  // This runs entirely on the server during the Next.js build step!
  // It reads all your Markdown files and generates the JSON data.
  const graphData = getLoreGraphData();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      {/* 
        We pass the pre-parsed JSON graph data down into the Client Component.
        The browser never has to download or parse the markdown files itself.
      */}
      <LoreGraph data={graphData} />
    </main>
  );
}
