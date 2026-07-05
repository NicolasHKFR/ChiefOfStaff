import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { OrgChartTeamNode } from "../types";

interface Props {
  data: OrgChartTeamNode[];
  onWorkerClick?: (id: number) => void;
}

const COLORS = ["#228be6", "#40c057", "#fab005", "#fd7e14", "#7950f2", "#e64980", "#15aabf"];

function nodeColor(index: number) {
  return COLORS[index % COLORS.length];
}

export default function OrgChart({ data, onWorkerClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const width = 1400;
    const height = 900;
    const margin = { top: 80, right: 120, bottom: 80, left: 120 };

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

    const root = d3.hierarchy<OrgChartTeamNode>({ id: 0, name: "root", manager: null, members: [], children: data } as OrgChartTeamNode);
    const treeLayout = d3.tree<OrgChartTeamNode>().size([
      width - margin.left - margin.right,
      height - margin.top - margin.bottom,
    ]);
    treeLayout(root);

    g.append("g")
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
      .data(root.descendants().filter((d) => d.data.id !== 0))
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    node.append("rect")
      .attr("x", -70)
      .attr("y", -20)
      .attr("width", 140)
      .attr("height", (d) => 40 + Math.max(0, d.data.members.length) * 22 + 10)
      .attr("rx", 8)
      .attr("fill", (_d, i) => nodeColor(i))
      .attr("opacity", 0.15)
      .attr("stroke", (_d, i) => nodeColor(i))
      .attr("stroke-width", 2);

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 5)
      .attr("font-size", "13px")
      .attr("font-weight", "bold")
      .text((d) => d.data.name);

    const managerLabel = node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 22)
      .attr("font-size", "10px")
      .attr("fill", "#666");

    managerLabel.text((d) => d.data.manager ? `Mgr: ${d.data.manager.first_name} ${d.data.manager.last_name}` : "No manager");

    node.each(function (d) {
      const el = d3.select(this);
      d.data.members.forEach((m, i) => {
        el.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", 38 + i * 22)
          .attr("font-size", "10px")
          .attr("fill", "#333")
          .style("cursor", "pointer")
          .text(`${m.first_name} ${m.last_name}`)
          .on("click", (event) => {
            event.stopPropagation();
            onWorkerClick?.(m.id);
          });
      });
    });
  }, [data, onWorkerClick]);

  return (
    <div style={{ overflow: "auto", border: "1px solid #eee", borderRadius: 8 }}>
      <svg ref={svgRef} />
    </div>
  );
}
