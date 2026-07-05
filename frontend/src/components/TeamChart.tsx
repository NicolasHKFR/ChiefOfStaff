import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { OrgChartTeamNode } from "../types";

interface Props {
  data: OrgChartTeamNode[];
  onTeamClick?: (id: number) => void;
  onWorkerClick?: (id: number) => void;
}

const DEPTH_COLORS = ["#228be6", "#40c057", "#fab005", "#fd7e14", "#7950f2", "#e64980", "#15aabf"];

function nodeColor(depth: number) {
  return DEPTH_COLORS[depth % DEPTH_COLORS.length];
}

const BOX_WIDTH = 170;
const HEADER_HEIGHT = 52;
const STAFF_ROW = 22;
const VERTICAL_SPACING = 100;
const HORIZONTAL_SPACING = 30;

function boxHeight(node: OrgChartTeamNode): number {
  if (node.children && node.children.length > 0) {
    return HEADER_HEIGHT;
  }
  return HEADER_HEIGHT + 10 + node.members.length * STAFF_ROW;
}

function flattenForTree(nodes: OrgChartTeamNode[]): OrgChartTeamNode {
  return {
    id: 0,
    name: "__root__",
    manager: null,
    members: [],
    children: nodes,
  };
}

export default function TeamChart({ data, onTeamClick, onWorkerClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const width = 1600;
    const height = 1000;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const root = d3.hierarchy(flattenForTree(data)).sort((a, b) => {
      const aLeaf = a.data.children && a.data.children.length > 0 ? 0 : 1;
      const bLeaf = b.data.children && b.data.children.length > 0 ? 0 : 1;
      return bLeaf - aLeaf;
    });

    const layout = d3.tree<OrgChartTeamNode>()
      .nodeSize([BOX_WIDTH + HORIZONTAL_SPACING, VERTICAL_SPACING])
      .separation((a, b) => a.parent === b.parent ? 1 : 1.5);

    layout(root);

    const descent = root.descendants().filter((d) => d.data.id !== 0);

    const maxLeafHeight = Math.max(
      ...descent.map((d) => boxHeight(d.data)),
      HEADER_HEIGHT
    );

    const minY = Math.min(...descent.map((d) => d.y ?? 0));
    const offsetY = Math.abs(minY) + 60;

    g.append("g")
      .selectAll("line")
      .data(root.links())
      .join("line")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2)
      .attr("x1", (d) => d.source.x ?? 0)
      .attr("y1", (d) => (d.source.y ?? 0) + offsetY + boxHeight(d.source.data) / 2)
      .attr("x2", (d) => d.target.x ?? 0)
      .attr("y2", (d) => (d.target.y ?? 0) + offsetY - VERTICAL_SPACING / 2 + 10);

    const node = g.append("g")
      .selectAll("g")
      .data(descent)
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${(d.y ?? 0) + offsetY})`)
      .style("cursor", "pointer");

    node.append("rect")
      .attr("x", -BOX_WIDTH / 2)
      .attr("y", 0)
      .attr("width", BOX_WIDTH)
      .attr("height", (d) => boxHeight(d.data))
      .attr("rx", 8)
      .attr("fill", (d) => {
        const c = nodeColor(d.depth - 1);
        return c;
      })
      .attr("fill-opacity", 0.12)
      .attr("stroke", (d) => nodeColor(d.depth - 1))
      .attr("stroke-width", 2);

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("x", 0)
      .attr("y", 20)
      .attr("font-size", "13px")
      .attr("font-weight", "bold")
      .attr("fill", (d) => nodeColor(d.depth - 1))
      .text((d) => d.data.name);

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("x", 0)
      .attr("y", 37)
      .attr("font-size", "10px")
      .attr("fill", "#666")
      .text((d) => d.data.manager
        ? `${d.data.manager.first_name} ${d.data.manager.last_name}`
        : "No manager");

    node.each(function (d) {
      if (d.data.children && d.data.children.length > 0) return;
      const el = d3.select(this);
      d.data.members.forEach((m, i) => {
        el.append("text")
          .attr("text-anchor", "middle")
          .attr("x", 0)
          .attr("y", 58 + i * STAFF_ROW)
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

    node.on("click", (_event, d) => {
      onTeamClick?.(d.data.id);
    });
  }, [data, onTeamClick, onWorkerClick]);

  return (
    <div style={{ overflow: "auto", border: "1px solid #eee", borderRadius: 8 }}>
      <svg ref={svgRef} />
    </div>
  );
}
