"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { SimulatorAccount, SimulatorGraphDelta } from "@/lib/api";

interface LiveGraphProps {
  accounts: SimulatorAccount[];
  delta: SimulatorGraphDelta | null;
  height?: number;
}

interface NodeDatum {
  id: string;
  label: string;
  risk: number;
  color: string;
  x?: number;
  y?: number;
}

interface LinkDatum {
  key: string;
  source: string | NodeDatum;
  target: string | NodeDatum;
  value: number;
  tx_count: number;
  is_suspicious: boolean;
  risk: number;
}

interface GraphState {
  nodes: NodeDatum[];
  links: LinkDatum[];
  nodeMap: Map<string, NodeDatum>;
  linkMap: Map<string, LinkDatum>;
  edgeElMap: Map<string, SVGLineElement>;
  nodeSel: d3.Selection<SVGGElement, NodeDatum, any, any> | null;
  edgeSel: d3.Selection<SVGLineElement, LinkDatum, any, any> | null;
  container: d3.Selection<SVGGElement, any, any, any>;
  sim: d3.Simulation<NodeDatum, LinkDatum>;
  W: number;
  H: number;
}

function riskColor(risk: number) {
  return risk >= 75
    ? "var(--accent-red)"
    : risk >= 50
      ? "var(--accent-amber)"
      : "rgba(0,229,255,0.85)";
}

export function LiveGraph({ accounts, delta, height = 320 }: LiveGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const stateRef = useRef<GraphState | null>(null);
  const simRef = useRef<d3.Simulation<NodeDatum, LinkDatum> | null>(null);
  const deltaRef = useRef(delta);
  const [counts, setCounts] = useState({ nodes: 0, edges: 0 });

  // Seed node lookup for labels / colors
  const accountMap = useRef(new Map<string, SimulatorAccount>());
  useEffect(() => {
    const map = new Map<string, SimulatorAccount>();
    for (const a of accounts) map.set(a.account_id, a);
    accountMap.current = map;
  }, [accounts]);

  // Initialize canvas + force simulation once
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const rect = svgRef.current.getBoundingClientRect();
    const W = Math.max(rect.width, 200) || 600;
    const H = rect.height || height;

    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "sim-arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 16)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "rgba(183,194,214,0.6)");

    defs
      .append("marker")
      .attr("id", "sim-arrow-red")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 16)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "var(--accent-red)");

    const filter = defs
      .append("filter")
      .attr("id", "sim-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    filter.append("feGaussianBlur").attr("stdDeviation", 4).attr("result", "blur");
    filter
      .append("feComposite")
      .attr("in", "SourceGraphic")
      .attr("in2", "blur")
      .attr("operator", "over");

    const container = svg.append("g").attr("class", "container");
    container.append("g").attr("class", "edge-layer");
    container.append("g").attr("class", "node-layer");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on("zoom", (e) => container.attr("transform", e.transform));
    svg.call(zoom);

    const nodes: NodeDatum[] = [];
    const links: LinkDatum[] = [];
    const sim = d3
      .forceSimulation<NodeDatum>(nodes)
      .alphaDecay(0.03)
      .velocityDecay(0.4)
      .alphaMin(0.001)
      .force(
        "link",
        d3
          .forceLink<NodeDatum, LinkDatum>(links)
          .id((d) => d.id)
          .distance(120)
          .strength(0.55),
      )
      .force("charge", d3.forceManyBody().strength(-260))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(32));

    simRef.current = sim;

    stateRef.current = {
      nodes,
      links,
      nodeMap: new Map(),
      linkMap: new Map(),
      edgeElMap: new Map(),
      nodeSel: null,
      edgeSel: null,
      container,
      sim,
      W,
      H,
    };

    sim.on("tick", () => {
      const s = stateRef.current;
      if (!s) return;
      if (s.edgeSel) {
        s.edgeSel
          .attr("x1", (d: any) => (d.source as NodeDatum).x ?? 0)
          .attr("y1", (d: any) => (d.source as NodeDatum).y ?? 0)
          .attr("x2", (d: any) => (d.target as NodeDatum).x ?? 0)
          .attr("y2", (d: any) => (d.target as NodeDatum).y ?? 0);
      }
      if (s.nodeSel) {
        s.nodeSel.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      }
    });

    return () => {
      sim.stop();
      stateRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderGraph = (s: GraphState) => {
    if (!simRef.current) return;
    const sim = simRef.current;

    // Edges keyed by "sender->receiver"
    let edgeSel = s.container
      .select<SVGGElement>(".edge-layer")
      .selectAll<SVGLineElement, LinkDatum>("line")
      .data(s.links, (d) => d.key);

    const edgeEnter = edgeSel.enter().append("line");
    edgeEnter
      .attr("marker-end", (d) =>
        d.is_suspicious ? "url(#sim-arrow-red)" : "url(#sim-arrow)",
      )
      .attr("stroke-dasharray", (d) => (d.is_suspicious ? "7,5" : null))
      .attr("stroke-linecap", "round");
    edgeEnter.each(function (d) {
      s.edgeElMap.set(d.key, this as SVGLineElement);
    });
    edgeSel = edgeEnter.merge(edgeSel);

    const maxVal = Math.max(...s.links.map((l) => l.value || 1), 1);
    edgeSel
      .attr("stroke", (d) => {
        const norm = (d.value || 0) / maxVal;
        if (d.is_suspicious || d.risk >= 50) return "var(--accent-red)";
        if (norm > 0.6) return "rgba(0,229,255,0.7)";
        return "rgba(183,194,214,0.4)";
      })
      .attr("stroke-width", (d) => {
        const norm = (d.value || 0) / maxVal;
        if (d.is_suspicious || d.risk >= 50) return 2.4;
        if (norm > 0.6) return 1.8;
        return 1.1;
      })
      .attr("stroke-opacity", (d) => (d.is_suspicious ? 0.92 : 0.5))
      .attr("x1", (d: any) => (d.source as NodeDatum).x ?? 0)
      .attr("y1", (d: any) => (d.source as NodeDatum).y ?? 0)
      .attr("x2", (d: any) => (d.target as NodeDatum).x ?? 0)
      .attr("y2", (d: any) => (d.target as NodeDatum).y ?? 0);
    edgeSel.exit().remove();
    s.edgeSel = edgeSel;

    // Nodes keyed by id
    let nodeSel = s.container
      .select<SVGGElement>(".node-layer")
      .selectAll<SVGGElement, NodeDatum>(".node")
      .data(s.nodes, (d) => d.id);

    const nodeEnter = nodeSel
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer");

    nodeEnter
      .append("circle")
      .attr("r", 7)
      .attr("fill", (d) => d.color)
      .attr("fill-opacity", 0.85)
      .attr("stroke", "rgba(255,255,255,0.15)")
      .attr("stroke-width", 1.2)
      .attr("filter", (d) => (d.risk >= 50 ? "url(#sim-glow)" : ""))
      .transition()
      .duration(400)
      .delay((_, i) => i * 40)
      .attr("r", (d) => (d.risk >= 75 ? 15 : d.risk >= 50 ? 12 : 9));

    nodeEnter
      .append("text")
      .text((d) => d.label)
      .attr("dy", 22)
      .attr("text-anchor", "middle")
      .style("fill", "var(--text-secondary)")
      .style("font-size", "9px");

    nodeSel = nodeEnter.merge(nodeSel);
    nodeSel.select("circle").attr("fill", (d) => d.color);
    nodeSel.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    s.nodeSel = nodeSel;

    sim.nodes(s.nodes);
    (sim.force("link") as d3.ForceLink<NodeDatum, LinkDatum>).links(s.links);
  };

  const mergeDelta = (s: GraphState, d: SimulatorGraphDelta) => {
    // Nodes from the delta override seed risk
    for (const n of d.new_nodes ?? []) {
      const existing = s.nodeMap.get(n.id);
      if (existing) {
        existing.risk = n.risk;
        existing.color = riskColor(n.risk);
      } else {
        const seed = accountMap.current.get(n.id);
        const node: NodeDatum = {
          id: n.id,
          label: n.label || n.id,
          risk: n.risk,
          color: seed?.avatar_color ?? riskColor(n.risk),
          x: s.W / 2 + (Math.random() - 0.5) * 160,
          y: s.H / 2 + (Math.random() - 0.5) * 160,
        };
        s.nodeMap.set(n.id, node);
        s.nodes.push(node);
      }
    }

    for (const e of d.new_edges ?? []) {
      const key = `${e.source}->${e.target}`;
      const existing = s.linkMap.get(key);
      if (existing) {
        existing.value += e.amount;
        existing.tx_count += e.tx_count;
        existing.is_suspicious = existing.is_suspicious || e.is_suspicious;
        existing.risk = Math.max(existing.risk, e.risk);
      } else {
        const link: LinkDatum = {
          key,
          source: e.source,
          target: e.target,
          value: e.amount,
          tx_count: e.tx_count,
          is_suspicious: e.is_suspicious,
          risk: e.risk,
        };
        s.linkMap.set(key, link);
        s.links.push(link);
      }
    }
  };

  // Merge the latest delta whenever it changes
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    if (deltaRef.current === delta) return;
    deltaRef.current = delta;
    if (!delta) return;

    mergeDelta(s, delta);
    renderGraph(s);

    // Flash the newest edge
    const edges = delta.new_edges ?? [];
    if (edges.length > 0) {
      const key = `${edges[edges.length - 1].source}->${edges[edges.length - 1].target}`;
      const el = s.edgeElMap.get(key);
      if (el) {
        d3.select(el)
          .attr("stroke", "var(--accent-purple)")
          .attr("stroke-width", 3.5)
          .style("filter", "drop-shadow(0 0 8px rgba(139,92,246,0.9))");
        window.setTimeout(() => renderGraph(s), 700);
      }
    }
    s.sim?.alpha(0.7).restart();
    setCounts({ nodes: s.nodes.length, edges: s.links.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delta]);

  // Initial render once canvas is ready
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    renderGraph(s);
    s.sim?.alpha(0.5).restart();
    setCounts({ nodes: s.nodes.length, edges: s.links.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full" style={{ height, overflow: "hidden" }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 9,
          color: "var(--text-muted)",
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        <span className="flex items-center gap-1">
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "rgba(0,229,255,0.85)",
              display: "inline-block",
            }}
          />
          {counts.nodes} accounts
        </span>
        <span className="flex items-center gap-1">
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent-red)",
              display: "inline-block",
            }}
          />
          {counts.edges} transfers
        </span>
        <span style={{ color: "var(--accent-red)" }}>
          red = risk ≥ 50
        </span>
      </div>
    </div>
  );
}
