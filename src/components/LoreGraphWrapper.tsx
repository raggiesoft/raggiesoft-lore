"use client";

import dynamic from "next/dynamic";
import { GraphData } from "@/lib/parser";

const LoreGraphNoSSR = dynamic(() => import("./LoreGraph"), { ssr: false });

export default function LoreGraphWrapper({ data }: { data: GraphData }) {
  return <LoreGraphNoSSR data={data} />;
}
