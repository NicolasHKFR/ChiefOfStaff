import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { OrgChartNode } from "../types";

interface Props {
  data: OrgChartNode;
  onNodeClick?: (id: number) => void;
}

export default function OrgChart({ data, onNodeClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const width = 1200;
    const height = 800;
    const margin = { top: 60, right: 60, bottom: 60, left: 60 };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const root = d3.hierarchy(data);
    const treeLayout = d3.tree<OrgChartNode>().size([width - margin.left - margin.right, height - margin.top - margin.bottom]);
    treeLayout(root);

    const link = g.append("g")
      .selectAll("line")
      .data(root.links())
      .join("line")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2)
      .attr("x1", (d) => d.source.x ?? 0)
      .attr("y1", (d) => d.source.y ?? 0)
      .attr("x2", (d) => d.target.x ?? 0)
      .attr("y2", (d) => d.target.y ?? 0);

    const node = g.append("g")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")
      .on("click", (_event, d) => onNodeClick?.(d.data.id));

    node.append("circle")
      .attr("r", 20)
      .attr("fill", "#228be6")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dy", 35)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text((d) => `${d.data.first_name} ${d.data.last_name}`);

    node.append("text")
      .attr("dy", 50)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#888")
      .text((d) => d.data.job_title || "");
  }, [data, onNodeClick]);

  return (
    <div style={{ overflow: "auto", border: "1px solid #eee", borderRadius: 8 }}>
      <svg ref={svgRef} />
    </div>
  );
}
