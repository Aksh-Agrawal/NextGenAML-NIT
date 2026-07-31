"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import * as d3 from "d3";
import { useRouter } from "next/navigation";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Filter,
  ChevronRight,
  X,
  ExternalLink,
  FileText,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Timer,
} from "lucide-react";
import { api, type GraphNode, type GraphEdge, type FlowTransaction } from "@/lib/api";
import {
  formatAmount,
  getRiskColor,
  getRiskFromScore,
  getRiskFromProb,
} from "@/lib/utils";
import {
  RiskBadge,
  ProbabilityBar,
  LoadingState,
  ErrorCard,
} from "@/components/ui";
import CountUp from "react-countup";

interface FundFlowGraphProps {
  accountId?: string;
}

type Layout = "force" | "circular" | "hierarchical";

function isHighFraudProbability(score?: number) {
  const normalized = (score ?? 0) <= 1 ? (score ?? 0) * 100 : (score ?? 0);
  return normalized >= 50;
}

interface ReplayState {
  sim: d3.Simulation<any, any> | null;
  nodes: any[];
  links: any[];
  nodeMap: Map<string, any>;
  linkMap: Map<string, any>;
  edgeElMap: Map<string, SVGLineElement>;
  nodeSel: d3.Selection<SVGGElement, any, any, any> | null;
  edgeSel: d3.Selection<SVGLineElement, any, any, any> | null;
  container: d3.Selection<SVGGElement, any, any, any>;
  W: number;
  H: number;
  centerAccount: string;
  appliedCount: number;
}

const SPEED_PRESETS: { label: string; value: number }[] = [
  { label: "0.5x", value: 2000 },
  { label: "1x", value: 1000 },
  { label: "2x", value: 500 },
  { label: "4x", value: 250 },
];

export function FundFlowGraph({ accountId }: FundFlowGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const panelContentRef = useRef<HTMLDivElement>(null);
  const replayRef = useRef<ReplayState | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout>("force");
  const [showSuspiciousOnly, setShowSuspiciousOnly] = useState(false);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const [replayMode, setReplayMode] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [step, setStep] = useState(0);
  const [minRisk, setMinRisk] = useState(0);
  const router = useRouter();

  const {
    data: subgraphData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: accountId ? ["subgraph", accountId] : ["fullGraph"],
    queryFn: () => accountId ? api.subgraph(accountId) : api.fullGraph(200),
    enabled: true,
  });

  const subgraph = useMemo(
    () =>
      subgraphData
        ? { ...subgraphData, center_account: subgraphData.center_account ?? accountId ?? "" }
        : undefined,
    [subgraphData, accountId],
  );

  const { data: prediction } = useQuery({
    queryKey: ["predict", selectedNode],
    queryFn: () => api.predictQuery(selectedNode!),
    enabled: !!selectedNode,
  });

  // Replay transaction stream – paginated so playback can complete every row.
  const [allTxns, setAllTxns] = useState<FlowTransaction[]>([]);
  const [flowTotal, setFlowTotal] = useState(0);
  const [fetchOffset, setFetchOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [flowLoading, setFlowLoading] = useState(false);

  const loadFlowPage = useCallback(
    async (offset: number) => {
      setFlowLoading(true);
      try {
        const res = await api.transactionFlow(accountId, 200, offset);
        setAllTxns((prev) => {
          const merged = [...prev];
          for (const t of res.transactions) {
            if (!merged.some((m) => m.index === t.index)) merged.push(t);
          }
          merged.sort((a, b) => a.index - b.index);
          return merged;
        });
        setFlowTotal(res.total);
        setFetchOffset(offset + res.transactions.length);
        setHasMore(offset + res.transactions.length < res.total);
        setFlowError(null);
      } catch (e) {
        setFlowError(String(e));
      } finally {
        setFlowLoading(false);
      }
    },
    [accountId],
  );

  useEffect(() => {
    if (!replayMode) return;
    setAllTxns([]);
    setFlowTotal(0);
    setFetchOffset(0);
    setHasMore(false);
    setFlowError(null);
    setStep(0);
    loadFlowPage(0);
  }, [replayMode, accountId, loadFlowPage]);

  const currentTxn: FlowTransaction | undefined =
    replayMode && allTxns.length > 0 ? allTxns[step] : undefined;

  const { data: explain } = useQuery({
    queryKey: ["explain", selectedNode],
    queryFn: () => api.explain(selectedNode!),
    enabled: !!selectedNode,
  });

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const check = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10) {
        setReady(true);
      }
    };
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 10 && height > 10) {
          setReady(true);
        }
      }
    });
    observer.observe(containerRef.current);
    check();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setSelectedNode(accountId ?? null);
  }, [accountId]);

  useEffect(() => {
    if (panelContentRef.current) {
      panelContentRef.current.scrollTop = 0;
    }
  }, [selectedNode]);

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomRef.current.scaleBy, 1.4);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomRef.current.scaleBy, 1 / 1.4);
  }, []);

  const handleFit = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  }, []);

  const initDepsRef = useRef("");

  useEffect(() => {
    if (!svgRef.current || !subgraph || !ready) return;

    const deps = JSON.stringify([
      subgraph.nodes.length,
      subgraph.links.length,
      layout,
      showSuspiciousOnly,
      accountId,
      replayMode,
      minRisk,
    ]);
    if (initDepsRef.current === deps) return;
    initDepsRef.current = deps;

    // Replay mode is animated by a dedicated effect below.
    if (replayMode) return;

    const svg = d3.select(svgRef.current);

    // Clear previous SVG contents to prevent duplication/overlapping
    svg.selectAll('*').remove();

    // Use actual container dimensions
    const rect = containerRef.current!.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;

    // Grid background
    const defs = svg.append("defs");
    const pattern = defs
      .append("pattern")
      .attr("id", "grid")
      .attr("width", 40)
      .attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse");
    pattern
      .append("path")
      .attr("d", "M 40 0 L 0 0 0 40")
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.05)")
      .attr("stroke-width", 1);
    svg
      .append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "url(#grid)");

    // Arrow marker
    defs
      .append("marker")
      .attr("id", "arrow-normal")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "var(--text-muted)")
      .attr("opacity", 0.5);

    defs
      .append("marker")
      .attr("id", "arrow-red")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "var(--accent-red)");

    // Glow filter
    const filter = defs
      .append("filter")
      .attr("id", "node-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", 4)
      .attr("result", "blur");
    filter
      .append("feComposite")
      .attr("in", "SourceGraphic")
      .attr("in2", "blur")
      .attr("operator", "over");

    const container = svg.append("g").attr("class", "container");

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (e) => container.attr("transform", e.transform));
    svg.call(zoom);
    zoomRef.current = zoom;

    let links = showSuspiciousOnly
      ? subgraph.links.filter((l) => l.is_suspicious)
      : subgraph.links;

    const linkedIds = new Set(
      links.flatMap((l) => [l.source as string, l.target as string]),
    );
    let nodes = showSuspiciousOnly
      ? subgraph.nodes.filter((n) => linkedIds.has(n.id) || n.id === accountId)
      : subgraph.nodes;

    // Custom risk threshold (1–100%): only show accounts at/above the slider.
    // Risk is stored on a 0–100 scale in the node payload.
    if (minRisk > 0) {
      nodes = nodes.filter(
        (n) => n.id === accountId || (n.risk ?? 0) >= minRisk,
      );
      const visible = new Set(nodes.map((n) => n.id));
      // Keep edges where at least one endpoint is above the threshold, so
      // high-risk accounts still show their connections to filtered nodes.
      links = links.filter(
        (l) =>
          visible.has(l.source as string) || visible.has(l.target as string),
      );
    }

    // Calculate positions based on layout
    let startPos: Map<string, { x: number; y: number }> = new Map();
    if (layout === "circular") {
      nodes.forEach((n, i) => {
        const angle = (2 * Math.PI * i) / nodes.length;
        const r = Math.min(W, H) * 0.35;
        startPos.set(n.id, {
          x: W / 2 + r * Math.cos(angle),
          y: H / 2 + r * Math.sin(angle),
        });
      });
    } else if (layout === "hierarchical") {
      const center = nodes.find((n) => n.id === accountId);
      const others = accountId ? nodes.filter((n) => n.id !== accountId) : nodes;
      if (accountId) startPos.set(accountId, { x: W / 2, y: H * 0.2 });
      others.forEach((n, i) => {
        const cols = Math.ceil(Math.sqrt(others.length));
        const row = Math.floor(i / cols);
        const col = i % cols;
        startPos.set(n.id, {
          x: W * 0.15 + (col / Math.max(cols - 1, 1)) * W * 0.7,
          y: H * 0.4 + row * 100,
        });
      });
    }

    const simNodes = nodes.map((n) => ({
      ...n,
      x: startPos.get(n.id)?.x ?? W / 2 + (Math.random() - 0.5) * 100,
      y: startPos.get(n.id)?.y ?? H / 2 + (Math.random() - 0.5) * 100,
      fx: layout !== "force" ? (startPos.get(n.id)?.x ?? undefined) : undefined,
      fy: layout !== "force" ? (startPos.get(n.id)?.y ?? undefined) : undefined,
    }));

    const simLinks = links.map((l) => ({ ...l }));

    const sim = d3
      .forceSimulation(simNodes)
      .alphaDecay(0.05)
      .velocityDecay(0.5)
      .alphaMin(0.001)
      .force(
        "link",
        d3
          .forceLink(simLinks)
          .id((d: any) => d.id)
          .distance(100)
          .strength(0.5),
      )
      .force(
        "charge",
        d3.forceManyBody().strength(layout === "force" ? -300 : -50),
      )
      .force("center", layout === "force" ? d3.forceCenter(W / 2, H / 2) : null)
      .force("collision", d3.forceCollide(30));

    simulationRef.current = sim;

    const settleTimer = setTimeout(() => {
      sim.stop();
    }, 2500);

    // Edges
    const edgeEl = container
      .append("g")
      .selectAll("line")
      .data(simLinks)
      .enter()
      .append("line")
      .attr("stroke", (d: any) => {
        const weight = d.value ?? 0.3;
        const maxVal = Math.max(...links.map((l) => l.value || 1));
        const norm = (d.value || 0) / maxVal;
        if (d.is_suspicious || norm > 0.7) return "var(--accent-red)";
        if (norm > 0.4) return "rgba(0,229,255,0.55)";
        return "rgba(183,194,214,0.36)";
      })
      .attr("stroke-width", (d: any) => {
        const maxVal = Math.max(...links.map((l) => l.value || 1));
        const norm = (d.value || 0) / maxVal;
        if (d.is_suspicious || norm > 0.7) return 2.5;
        if (norm > 0.4) return 1.5;
        return 1;
      })
      .attr("stroke-opacity", (d: any) => (d.is_suspicious ? 0.92 : 0.45))
      .attr("marker-end", (d: any) =>
        d.is_suspicious ? "url(#arrow-red)" : "url(#arrow-normal)",
      )
      .attr("stroke-dasharray", (d: any) => (d.is_suspicious ? "7,5" : null))
      .attr("stroke-linecap", "round")
      .on("mouseover", function (e, d: any) {
        setTooltip({
          x: e.pageX,
          y: e.pageY,
          text: `₹${(d.value || 0).toLocaleString("en-IN")}`,
        });
      })
      .on("mousemove", function (e) {
        setTooltip((prev) =>
          prev ? { ...prev, x: e.pageX, y: e.pageY } : null,
        );
      })
      .on("mouseout", () => setTooltip(null));

    edgeEl
      .filter((d: any) => d.is_suspicious)
      .style("animation", "flow-dash 0.9s linear infinite");

    // Node groups
    const nodeGroup = container
      .append("g")
      .selectAll(".node")
      .data(simNodes)
      .enter()
      .append("g")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, any>()
          .clickDistance(4)
          .on("start", () => {})
          .on("drag", (e, d) => {
            if (!e.active) sim.alphaTarget(0.3).restart();
            d.fx = e.x;
            d.fy = e.y;
          })
          .on("end", (e, d) => {
            if (!e.active) sim.alphaTarget(0);
            if (Math.abs(e.dx) < 4 && Math.abs(e.dy) < 4) {
              d.fx = d.x;
              d.fy = d.y;
              setSelectedNode(d.id);
            }
          }),
      )

    // Node outer ring (glow for selected/flagged)
    nodeGroup
      .append("circle")
      .attr("r", (d) => (d.id === accountId ? 20 : 14))
      .attr("fill", "none")
      .attr("stroke", (d) => {
        if (d.id === accountId) return "var(--accent-blue)";
        return isHighFraudProbability(d.risk) ? "var(--accent-red)" : "transparent";
      })
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6)
      .attr("class", (d) =>
        d.id === accountId ? "animate-ring-pulse-purple" : "",
      );

    // Node circles
    nodeGroup
      .append("circle")
      .attr("r", 0)
      .attr("class", "node-circle")
      .attr("fill", (d) => {
        if (d.id === accountId) return "var(--accent-blue)";
        return isHighFraudProbability(d.risk)
          ? "var(--accent-red)"
          : "rgba(0,229,255,0.85)";
      })
      .attr("fill-opacity", (d) => (d.id === accountId ? 1 : 0.75))
      .attr("stroke", (d) => {
        if (d.id === accountId) return "rgba(0,229,255,0.6)";
        return "rgba(255,255,255,0.1)";
      })
      .attr("stroke-width", 1.5)
      .attr("filter", (d) => {
        return isHighFraudProbability(d.risk) || d.id === accountId
          ? "url(#node-glow)"
          : "";
      })
      .transition()
      .duration(600)
      .delay((_, i) => i * 30)
      .attr("r", (d) => (d.id === accountId ? 16 : 10));

    // Labels
    nodeGroup
      .append("text")
      .text((d) => (d.id.length > 8 ? d.id.slice(-8) : d.id))
      .attr("dy", (d) => (d.id === accountId ? 30 : 22))
      .attr("text-anchor", "middle")
      .style("fill", (d) =>
        d.id === accountId ? "var(--accent-blue)" : "var(--text-secondary)",
      )
      .style("font-size", (d) => (d.id === accountId ? "11px" : "9px"))
      .style("font-weight", (d) => (d.id === accountId ? "600" : "400"));

    sim.on("tick", () => {
      edgeEl
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      clearTimeout(settleTimer);
      sim.stop();
    };
  }, [subgraph, layout, showSuspiciousOnly, accountId, ready, replayMode, minRisk]);

  // ── Replay mode: build the fund flow one transaction at a time ──────

  const renderReplayGraph = useCallback((r: ReplayState) => {
    const { sim, nodes, links, container } = r;
    if (!sim) return;

    // Edges (keyed by "sender->receiver" so existing edges update in place)
    let edgeSel = container
      .select<SVGGElement>(".edge-layer")
      .selectAll<SVGLineElement, any>("line")
      .data(links, (d: any) => d.key);
    const edgeEnter = edgeSel.enter().append("line");
    edgeEnter
      .attr("marker-end", (d: any) =>
        d.is_suspicious ? "url(#arrow-red)" : "url(#arrow-normal)",
      )
      .attr("stroke-dasharray", (d: any) => (d.is_suspicious ? "7,5" : null))
      .attr("stroke-linecap", "round");
    edgeEnter.each(function (d: any) {
      r.edgeElMap.set(d.key, this as SVGLineElement);
    });
    edgeSel = edgeEnter.merge(edgeSel);
    const maxVal = Math.max(...links.map((l) => l.value || 1), 1);
    edgeSel
      .attr("stroke", (d: any) => {
        const norm = (d.value || 0) / maxVal;
        if (d.is_suspicious || norm > 0.7) return "var(--accent-red)";
        if (norm > 0.4) return "rgba(0,229,255,0.55)";
        return "rgba(183,194,214,0.36)";
      })
      .attr("stroke-width", (d: any) => {
        const norm = (d.value || 0) / maxVal;
        if (d.is_suspicious || norm > 0.7) return 2.5;
        if (norm > 0.4) return 1.5;
        return 1;
      })
      .attr("stroke-opacity", (d: any) => (d.is_suspicious ? 0.92 : 0.45));
    // Position edges immediately so new links render before the next tick
    edgeSel
      .attr("x1", (d: any) => (typeof d.source === "object" ? d.source.x : 0))
      .attr("y1", (d: any) => (typeof d.source === "object" ? d.source.y : 0))
      .attr("x2", (d: any) => (typeof d.target === "object" ? d.target.x : 0))
      .attr("y2", (d: any) => (typeof d.target === "object" ? d.target.y : 0));
    edgeSel.exit().remove();
    r.edgeSel = edgeSel;

    // Nodes
    let nodeSel = container
      .select<SVGGElement>(".node-layer")
      .selectAll<SVGGElement, any>(".node")
      .data(nodes, (d: any) => d.id);
    const nodeEnter = nodeSel
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer");

    nodeEnter
      .append("circle")
      .attr("class", "ring")
      .attr("r", (d: any) => (d.id === r.centerAccount ? 20 : 14))
      .attr("fill", "none")
      .attr("stroke", (d: any) =>
        d.id === r.centerAccount
          ? "var(--accent-blue)"
          : isHighFraudProbability(d.risk)
            ? "var(--accent-red)"
            : "transparent",
      )
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6)
      .attr("class", (d: any) =>
        d.id === r.centerAccount ? "ring animate-ring-pulse-purple" : "ring",
      );

    nodeEnter
      .append("circle")
      .attr("class", "dot")
      .attr("r", (d: any) => (d.id === r.centerAccount ? 16 : 10))
      .attr("fill", (d: any) =>
        d.id === r.centerAccount
          ? "var(--accent-blue)"
          : isHighFraudProbability(d.risk)
            ? "var(--accent-red)"
            : "rgba(0,229,255,0.85)",
      )
      .attr("fill-opacity", (d: any) => (d.id === r.centerAccount ? 1 : 0.75))
      .attr("stroke", "rgba(255,255,255,0.1)")
      .attr("stroke-width", 1.5)
      .attr("filter", (d: any) =>
        isHighFraudProbability(d.risk) || d.id === r.centerAccount
          ? "url(#node-glow)"
          : "",
      );

    nodeEnter
      .append("text")
      .text((d: any) => (d.id.length > 8 ? d.id.slice(-8) : d.id))
      .attr("dy", (d: any) => (d.id === r.centerAccount ? 30 : 22))
      .attr("text-anchor", "middle")
      .style("fill", (d: any) =>
        d.id === r.centerAccount ? "var(--accent-blue)" : "var(--text-secondary)",
      )
      .style("font-size", (d: any) => (d.id === r.centerAccount ? "11px" : "9px"))
      .style("font-weight", (d: any) => (d.id === r.centerAccount ? "600" : "400"));

    nodeEnter.call(
      d3
        .drag<SVGGElement, any>()
        .clickDistance(4)
        .on("start", () => {})
        .on("drag", (e, d) => {
          if (!e.active) sim.alphaTarget(0.3).restart();
          d.fx = e.x;
          d.fy = e.y;
        })
        .on("end", (e, d) => {
          if (!e.active) sim.alphaTarget(0);
          if (Math.abs(e.dx) < 4 && Math.abs(e.dy) < 4) {
            d.fx = d.x;
            d.fy = d.y;
            setSelectedNode(d.id);
          }
        }),
    );

    nodeSel = nodeEnter.merge(nodeSel);
    nodeSel.attr("transform", (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    r.nodeSel = nodeSel;

    sim.nodes(nodes);
    (sim.force("link") as d3.ForceLink<any, any>).links(links);
  }, []);

  const addTransactionToReplay = useCallback(
    (r: ReplayState, txn: FlowTransaction, flash = true) => {
      // Spawn new nodes near the existing counterpart of this transaction,
      // so the layout flows naturally instead of jumping from the center.
      const partner =
        r.nodeMap.get(txn.sender) ?? r.nodeMap.get(txn.receiver) ?? undefined;
      const baseX = partner ? partner.x : r.W / 2;
      const baseY = partner ? partner.y : r.H / 2;

      for (const acc of [txn.sender, txn.receiver]) {
        if (!r.nodeMap.has(acc)) {
          const node = {
            id: acc,
            risk: txn.label ? 70 : 20,
            x: baseX + (Math.random() - 0.5) * 140,
            y: baseY + (Math.random() - 0.5) * 140,
          };
          r.nodeMap.set(acc, node);
          r.nodes.push(node);
        }
      }

      const key = `${txn.sender}->${txn.receiver}`;
      let link = r.linkMap.get(key);
      if (link) {
        link.value += txn.amount;
        link.tx_count += 1;
        link.is_suspicious = link.is_suspicious || !!txn.label;
      } else {
        link = {
          key,
          source: txn.sender,
          target: txn.receiver,
          value: txn.amount,
          tx_count: 1,
          is_suspicious: !!txn.label,
        };
        r.linkMap.set(key, link);
        r.links.push(link);
      }

      renderReplayGraph(r);

      // Flash the freshly animated edge so the flow step is obvious.
      if (flash) {
        const el = r.edgeElMap.get(key);
        if (el) {
          d3.select(el)
            .attr("stroke", "var(--accent-red)")
            .attr("stroke-width", 3.5)
            .style("filter", "drop-shadow(0 0 8px rgba(255,61,113,0.8))");
          window.setTimeout(() => renderReplayGraph(r), 700);
        }
      }
    },
    [renderReplayGraph],
  );

  // Initialize the replay canvas + force simulation
  useEffect(() => {
    if (!svgRef.current || !replayMode || !ready) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Grid background
    const defs = svg.append("defs");
    const pattern = defs
      .append("pattern")
      .attr("id", "grid")
      .attr("width", 40)
      .attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse");
    pattern
      .append("path")
      .attr("d", "M 40 0 L 0 0 0 40")
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.05)")
      .attr("stroke-width", 1);
    svg
      .append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "url(#grid)");

    defs
      .append("marker")
      .attr("id", "arrow-normal")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "var(--text-muted)")
      .attr("opacity", 0.5);

    defs
      .append("marker")
      .attr("id", "arrow-red")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "var(--accent-red)");

    const filter = defs
      .append("filter")
      .attr("id", "node-glow")
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

    const rect = containerRef.current!.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;

    const container = svg.append("g").attr("class", "container");
    container.append("g").attr("class", "edge-layer");
    container.append("g").attr("class", "node-layer");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (e) => container.attr("transform", e.transform));
    svg.call(zoom);
    zoomRef.current = zoom;

    const nodes: any[] = [];
    const links: any[] = [];
    const sim = d3
      .forceSimulation(nodes)
      .alphaDecay(0.02)
      .velocityDecay(0.4)
      .alphaMin(0.0005)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(100)
          .strength(0.5),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(30));
    simulationRef.current = sim;

    const r: ReplayState = {
      sim,
      nodes,
      links,
      nodeMap: new Map(),
      linkMap: new Map(),
      edgeElMap: new Map(),
      nodeSel: null,
      edgeSel: null,
      container,
      W,
      H,
      centerAccount: accountId ?? "",
      appliedCount: 0,
    };
    replayRef.current = r;

    sim.on("tick", () => {
      if (r.edgeSel) {
        r.edgeSel
          .attr("x1", (d: any) =>
            typeof d.source === "object" && d.source ? d.source.x : 0,
          )
          .attr("y1", (d: any) =>
            typeof d.source === "object" && d.source ? d.source.y : 0,
          )
          .attr("x2", (d: any) =>
            typeof d.target === "object" && d.target ? d.target.x : 0,
          )
          .attr("y2", (d: any) =>
            typeof d.target === "object" && d.target ? d.target.y : 0,
          );
      }
      if (r.nodeSel) {
        r.nodeSel.attr("transform", (d: any) =>
          `translate(${d.x ?? 0},${d.y ?? 0})`,
        );
      }
    });

    setStep(0);
    setPlaying(true);

    return () => {
      sim.stop();
      replayRef.current = null;
    };
  }, [replayMode, ready, accountId]);

  // Apply the transaction at the current step (forward/back/reset safe)
  useEffect(() => {
    const r = replayRef.current;
    if (!replayMode || !r || allTxns.length === 0) return;
    const target = Math.min(step, allTxns.length - 1);
    if (target < 0) return;

    // Stepping backwards / reset → rebuild from scratch
    if (target + 1 < (r.appliedCount ?? 0)) {
      r.nodes.length = 0;
      r.links.length = 0;
      r.nodeMap.clear();
      r.linkMap.clear();
      r.edgeElMap.clear();
      r.container.selectAll(".node").remove();
      r.container.selectAll("line").remove();
      r.nodeSel = null;
      r.edgeSel = null;
    }

    for (let i = r.appliedCount ?? 0; i <= target; i++) {
      addTransactionToReplay(r, allTxns[i], i === target);
    }
    r.appliedCount = target + 1;
    r.sim?.alpha(0.8).restart();
  }, [step, replayMode, allTxns, addTransactionToReplay]);

  // Auto-advance while playing – loads the next page before the end of the
  // current window so playback continues to the very last transaction.
  useEffect(() => {
    if (!playing || !replayMode) return;
    if (allTxns.length === 0) return;
    if (step >= allTxns.length - 1) {
      if (hasMore && !flowLoading) {
        loadFlowPage(fetchOffset);
      }
      return;
    }
    const t = window.setTimeout(() => setStep((s) => s + 1), speed);
    return () => window.clearTimeout(t);
  }, [
    playing,
    step,
    allTxns,
    hasMore,
    flowLoading,
    fetchOffset,
    speed,
    replayMode,
    loadFlowPage,
  ]);

  const resetReplay = useCallback(() => {
    const r = replayRef.current;
    if (r) {
      r.nodes.length = 0;
      r.links.length = 0;
      r.nodeMap.clear();
      r.linkMap.clear();
      r.edgeElMap.clear();
      r.container.selectAll(".node").remove();
      r.container.selectAll("line").remove();
      r.nodeSel = null;
      r.edgeSel = null;
      r.appliedCount = 0;
    }
    setStep(0);
    setPlaying(true);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        overflow: "hidden",
        height: "100%",
        minHeight: 500,
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          background: "rgba(11,15,25,0.82)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          backdropFilter: "blur(10px)",
        }}
      >
        {!replayMode &&
          (["force", "circular", "hierarchical"] as Layout[]).map((l) => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              className="btn-ghost"
              style={{
                padding: "4px 10px",
                fontSize: 11,
                textTransform: "capitalize",
                background: layout === l ? "rgba(0,229,255,0.2)" : undefined,
                borderColor: layout === l ? "rgba(0,229,255,0.36)" : undefined,
                color: layout === l ? "var(--accent-blue)" : undefined,
              }}
            >
              {l}
            </button>
          ))}
        <div style={{ width: 1, height: 20, background: "var(--border)" }} />
        {!replayMode && (
          <button
            onClick={() => setShowSuspiciousOnly(!showSuspiciousOnly)}
            className="btn-ghost"
            style={{
              padding: "4px 10px",
              fontSize: 11,
              background: showSuspiciousOnly
                ? "rgba(255,61,113,0.14)"
                : undefined,
              borderColor: showSuspiciousOnly
                ? "rgba(255,61,113,0.3)"
                : undefined,
              color: showSuspiciousOnly ? "var(--accent-red)" : undefined,
            }}
          >
            <Filter size={11} />
            Suspicious only
          </button>
        )}
        {!replayMode && (
          <>
            <div style={{ width: 1, height: 20, background: "var(--border)" }} />
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                whiteSpace: "nowrap",
              }}
            >
              Risk ≥
            </span>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={minRisk}
              onChange={(e) => setMinRisk(Number(e.target.value))}
              style={{ width: 110 }}
              title="Custom risk threshold (1–100%)"
            />
            <span
              style={{
                fontSize: 11,
                fontFamily: "JetBrains Mono, monospace",
                color: minRisk > 0 ? "var(--accent-red)" : "var(--text-muted)",
                minWidth: 32,
              }}
            >
              {minRisk}%
            </span>
            {minRisk > 0 && (
              <button
                className="btn-ghost"
                onClick={() => setMinRisk(0)}
                title="Reset threshold"
                style={{ padding: "3px 8px", fontSize: 10 }}
              >
                Reset
              </button>
            )}
          </>
        )}
        <button
          onClick={() => setReplayMode((m) => !m)}
          className="btn-ghost"
          title="Play the fund flow one transaction at a time"
          style={{
            padding: "4px 10px",
            fontSize: 11,
            background: replayMode ? "rgba(0,229,255,0.2)" : undefined,
            borderColor: replayMode ? "rgba(0,229,255,0.36)" : undefined,
            color: replayMode ? "var(--accent-blue)" : undefined,
          }}
        >
          {replayMode ? <Pause size={11} /> : <Play size={11} />}
          {replayMode ? "Static" : "Replay"}
        </button>
        {replayMode && (
          <>
            <div style={{ width: 1, height: 20, background: "var(--border)" }} />
            <span
              style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}
            >
              Speed
            </span>
            {SPEED_PRESETS.map((p) => (
              <button
                key={p.label}
                className="btn-ghost"
                onClick={() => setSpeed(p.value)}
                title={`${p.label} speed (${p.value}ms per transaction)`}
                style={{
                  padding: "3px 8px",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                  background:
                    speed === p.value ? "rgba(0,229,255,0.2)" : undefined,
                  borderColor:
                    speed === p.value ? "rgba(0,229,255,0.36)" : undefined,
                  color: speed === p.value ? "var(--accent-blue)" : undefined,
                }}
              >
                {p.label}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Zoom Controls */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: selectedNode ? 344 : 12,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          transition: "right 0.35s ease",
        }}
      >
        <button className="btn-icon" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={14} />
        </button>
        <button className="btn-icon" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={14} />
        </button>
        <button className="btn-icon" onClick={handleFit} title="Fit to screen">
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Main SVG */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingState variant="pulse" message={accountId ? "Loading subgraph..." : "Loading full graph..."} />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <ErrorCard
            message={`Failed to load ${accountId ? `subgraph for ${accountId}` : "full graph"}`}
            onRetry={() => refetch()}
          />
        </div>
      ) : (
        <svg
          ref={svgRef}
          className="graph-canvas"
          style={{
            flex: 1,
            width: "100%",
            height: "100%",
            minHeight: 500,
            display: "block",
          }}
        />
      )}

      {/* Flow loading overlay (replay mode) */}
      {replayMode && flowLoading && allTxns.length === 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(11,15,25,0.6)",
          }}
        >
          <LoadingState variant="pulse" message="Loading transaction stream..." />
        </div>
      )}

      {/* Replay playback controls */}
      {replayMode && allTxns.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 14px",
            background: "rgba(11,15,25,0.9)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
          }}
        >
          <button className="btn-icon" onClick={resetReplay} title="Reset replay">
            <RotateCcw size={13} />
          </button>
          <button
            className="btn-icon"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            title="Previous transaction"
          >
            <SkipBack size={13} />
          </button>
          <button
            className="btn-icon"
            onClick={() => {
              if (playing) {
                setPlaying(false);
              } else if (step >= allTxns.length - 1 && !hasMore) {
                resetReplay();
              } else {
                setPlaying(true);
              }
            }}
            title={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <button
            className="btn-icon"
            onClick={() => {
              if (step >= allTxns.length - 1) {
                if (hasMore) loadFlowPage(fetchOffset);
              } else {
                setStep((s) => Math.min(allTxns.length - 1, s + 1));
              }
            }}
            disabled={step >= allTxns.length - 1 && !hasMore}
            title="Next transaction"
          >
            <SkipForward size={13} />
          </button>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <Timer size={12} style={{ color: "var(--text-muted)" }} />
          {SPEED_PRESETS.map((p) => (
            <button
              key={p.label}
              className="btn-ghost"
              onClick={() => setSpeed(p.value)}
              title={`${p.label} speed (${p.value}ms per transaction)`}
              style={{
                padding: "3px 8px",
                fontSize: 10,
                fontFamily: "JetBrains Mono, monospace",
                background:
                  speed === p.value ? "rgba(0,229,255,0.2)" : undefined,
                borderColor:
                  speed === p.value ? "rgba(0,229,255,0.36)" : undefined,
                color: speed === p.value ? "var(--accent-blue)" : undefined,
              }}
            >
              {p.label}
            </button>
          ))}
          <input
            type="range"
            min={250}
            max={2000}
            step={50}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{ width: 90 }}
            title="Custom speed"
          />
          <span
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              minWidth: 42,
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {speed}ms
          </span>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <span
            style={{
              fontSize: 11,
              fontFamily: "JetBrains Mono, monospace",
              color: "var(--accent-purple)",
              minWidth: 72,
            }}
          >
            {Math.min(step + 1, allTxns.length)} / {flowTotal}
            {hasMore && flowLoading ? " (loading…)" : ""}
          </span>
        </div>
      )}

      {/* Current transaction info panel */}
      {replayMode && currentTxn && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            zIndex: 10,
            maxWidth: 320,
            padding: "10px 14px",
            background: "rgba(11,15,25,0.9)",
            border: "1px solid var(--border)",
            borderLeft: `3px solid ${
              currentTxn.label ? "var(--accent-red)" : "var(--accent-green)"
            }`,
            borderRadius: 10,
            backdropFilter: "blur(10px)",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: 4,
            }}
          >
            Transaction {step + 1} ·{" "}
            {currentTxn.label ? "SUSPICIOUS" : "Normal"}
          </div>
          <div
            style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}
          >
            {currentTxn.sender}
            <span style={{ color: "var(--accent-blue)", margin: "0 6px" }}>→</span>
            {currentTxn.receiver}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: currentTxn.label ? "var(--accent-red)" : "var(--text-primary)",
            }}
          >
            {formatAmount(currentTxn.amount)}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
            {currentTxn.timestamp} · {currentTxn.transaction_type}
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="tooltip"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 28,
            position: "fixed",
          }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Right Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 320,
              height: "100%",
              background: "rgba(11, 15, 25, 0.72)",
              borderLeft: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              zIndex: 5,
            }}
          >
            {/* Panel Header */}
            <div
              className="flex items-center justify-between px-4 py-4 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                Node Intelligence
              </span>
              <button
                className="btn-icon"
                style={{ padding: 4 }}
                onClick={() => setSelectedNode(null)}
              >
                <X size={13} />
              </button>
            </div>

            <div ref={panelContentRef} className="p-4 space-y-5" style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", paddingBottom: 80 }}>
              {/* Account ID */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  ACCOUNT ID
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: "JetBrains Mono, monospace",
                    color: prediction
                      ? getRiskColor(getRiskFromProb(prediction.fraud_probability))
                      : "var(--accent-blue)",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedNode}
                </div>
              </div>

              {/* Risk Gauge */}
              {explain && (
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      marginBottom: 8,
                    }}
                  >
                    RISK SCORE
                  </div>
                  <SemicircleGauge value={explain.risk_score} max={100} />
                </div>
              )}

              {/* Fraud Probability */}
              {prediction && (
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      marginBottom: 6,
                    }}
                  >
                    FRAUD PROBABILITY
                  </div>
                  <div
                    style={{
                      fontSize: 42,
                      fontWeight: 800,
                      fontFamily: "Roboto Mono, JetBrains Mono, monospace",
                      color: getRiskColor(getRiskFromProb(prediction.fraud_probability)),
                      lineHeight: 1,
                      filter:
                        prediction.fraud_probability > 0.75
                          ? `drop-shadow(0 0 12px ${getRiskColor(getRiskFromProb(prediction.fraud_probability))}60)`
                          : "none",
                    }}
                  >
                    <CountUp
                      end={prediction.fraud_probability * 100}
                      duration={1.2}
                      decimals={1}
                      suffix="%"
                    />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <RiskBadge level={getRiskFromProb(prediction.fraud_probability)} />
                  </div>
                </div>
              )}

              {/* Risk Factors */}
              {explain && explain.risk_factors.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      marginBottom: 8,
                    }}
                  >
                    RISK FACTORS
                  </div>
                  <div className="space-y-3">
                    {explain.risk_factors.map((rf) => (
                      <div key={rf.factor}>
                        <div className="flex justify-between mb-1">
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {rf.factor}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontFamily:
                                "Roboto Mono, JetBrains Mono, monospace",
                              color: getRiskColor(getRiskFromProb(rf.score)),
                            }}
                          >
                            {(rf.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <ProbabilityBar value={rf.score} height={4} />
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--text-muted)",
                            marginTop: 3,
                          }}
                        >
                          {rf.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pattern Scores */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    marginBottom: 8,
                  }}
                >
                  PATTERN ANALYSIS
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Structuring", value: 0.35 },
                    {
                      label: "Velocity",
                      value: prediction
                        ? prediction.fraud_probability * 0.8
                        : 0.2,
                    },
                    {
                      label: "Temporal Anomaly",
                      value: explain ? explain.risk_score / 200 : 0.15,
                    },
                  ].map((p) => (
                    <div key={p.label} className="flex items-center gap-2">
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-secondary)",
                          minWidth: 110,
                        }}
                      >
                        {p.label}
                      </span>
                      <ProbabilityBar
                        value={p.value}
                        height={4}
                        showLabel
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Suspicious Edges */}
              {explain && explain.top_suspicious_edges.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      marginBottom: 8,
                    }}
                  >
                    SUSPICIOUS EDGES
                  </div>
                  <div className="space-y-2">
                    {explain.top_suspicious_edges.slice(0, 4).map((e, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "6px 10px",
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              fontFamily: "JetBrains Mono, monospace",
                              color: "var(--text-secondary)",
                            }}
                          >
                            → {e.target}
                          </div>
                          <div
                            style={{ fontSize: 10, color: "var(--text-muted)" }}
                          >
                            {e.tx_count} txns
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily:
                              "Roboto Mono, JetBrains Mono, monospace",
                            color: "var(--accent-amber)",
                          }}
                        >
                          {formatAmount(e.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {explain && (
                <div
                  style={{
                    padding: 12,
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    borderLeft: "3px solid var(--accent-blue)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--accent-blue)",
                      marginBottom: 4,
                      fontWeight: 600,
                    }}
                  >
                    RECOMMENDATION
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {explain.recommendation}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  className="btn-purple flex-1"
                  style={{ fontSize: 12, padding: "8px 10px" }}
                  onClick={() =>
                    router.push(
                      `/sar-report?accountId=${encodeURIComponent(selectedNode)}`,
                    )
                  }
                >
                  <FileText size={13} />
                  Generate SAR
                </button>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: "8px 10px" }}
                  onClick={() =>
                    router.push(
                       `/fund-flow?account=${encodeURIComponent(selectedNode)}`,
                    )
                  }
                >
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Map */}
      <div className="mini-map">
        <svg width="100%" height="100%" style={{ opacity: 0.7 }}>
          {subgraph?.nodes.slice(0, 30).map((n, i) => (
            <circle
              key={n.id}
              cx={8 + (i % 8) * 18 + Math.random() * 4}
              cy={8 + Math.floor(i / 8) * 18 + Math.random() * 4}
              r={3 + (n.risk ?? 0.5) * 4}
                fill={isHighFraudProbability(n.risk)
                  ? "var(--accent-red)"
                  : "rgba(0,229,255,0.85)"}
              opacity={0.7}
            />
          ))}
        </svg>
        <div
          style={{
            position: "absolute",
            bottom: 4,
            right: 4,
            fontSize: 9,
            color: "var(--text-muted)",
            fontFamily: "Roboto Mono, JetBrains Mono, monospace",
          }}
        >
          MINIMAP
        </div>
      </div>
    </div>
  );
}

function SemicircleGauge({
  value,
  max = 100,
}: {
  value: number;
  max?: number;
}) {
  const pct = value / max;
  const circumference = Math.PI * 60;
  const dash = pct * circumference;

  const color =
    value >= 75
      ? "var(--accent-red)"
      : value >= 50
        ? "var(--accent-amber)"
        : value >= 25
          ? "var(--accent-blue)"
          : "var(--accent-green)";

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <svg width="160" height="90" viewBox="0 0 160 90">
        {/* Track */}
        <path
          d="M 20 80 A 60 60 0 0 1 140 80"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Value */}
        <path
          d="M 20 80 A 60 60 0 0 1 140 80"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{
            transition: "stroke-dasharray 0.8s ease, stroke 0.3s ease",
            filter: `drop-shadow(0 0 6px ${color}80)`,
          }}
        />
        {/* Value text */}
        <text
          x="80"
          y="72"
          textAnchor="middle"
          style={{
            fill: color,
            fontSize: 20,
            fontFamily: "JetBrains Mono, monospace",
            fontWeight: 700,
          }}
        >
          {value.toFixed(0)}
        </text>
        <text
          x="80"
          y="84"
          textAnchor="middle"
          style={{
            fill: "var(--text-muted)",
            fontSize: 9,
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          / {max}
        </text>
      </svg>
    </div>
  );
}
