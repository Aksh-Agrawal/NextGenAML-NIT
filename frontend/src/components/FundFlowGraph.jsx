import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const FundFlowGraph = () => {
    const svgRef = useRef();

    useEffect(() => {
        if (!svgRef.current) return;

        // Dummy data for visualization
        const data = {
            nodes: [
                { id: "A1", type: "bank", label: "Central Bank", risk: 0 },
                { id: "N1", type: "entity", label: "Global Holdings", risk: 85 },
                { id: "N2", type: "entity", label: "Shell Corp Ltd", risk: 92 },
                { id: "N3", type: "entity", label: "Pacific Trade", risk: 45 },
                { id: "N4", type: "entity", label: "Apex Inv", risk: 20 },
                { id: "N5", type: "entity", label: "Retail X", risk: 10 },
                { id: "N6", type: "entity", label: "Unknown Source", risk: 98 },
                { id: "B1", type: "bank", label: "Offshore Bank", risk: 70 },
            ],
            links: [
                { source: "A1", target: "N4", value: 5000000 },
                { source: "N4", target: "N3", value: 2000000 },
                { source: "N3", target: "N2", value: 1500000 },
                { source: "N6", target: "B1", value: 8000000 },
                { source: "B1", target: "N2", value: 4000000 },
                { source: "N2", target: "N1", value: 5500000 },
                { source: "N1", target: "N5", value: 500000 },
                { source: "N2", target: "N5", value: 1000000 },
            ]
        };

        const width = svgRef.current.clientWidth;
        const height = 600;

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height]);

        svg.selectAll("*").remove();

        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links).id(d => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-1000))
            .force("center", d3.forceCenter(width / 2, height / 2));

        // Defs for gradients and filters
        const defs = svg.append("defs");

        // Glow filter
        const filter = defs.append("filter")
            .attr("id", "glow");
        filter.append("feGaussianBlur")
            .attr("stdDeviation", "3.5")
            .attr("result", "coloredBlur");
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // Links
        const link = svg.append("g")
            .selectAll("path")
            .data(data.links)
            .join("path")
            .attr("stroke", d => d.source.risk > 80 || d.target.risk > 80 ? "#FF4C4C" : "#D4AF37")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", d => Math.sqrt(d.value) / 500)
            .attr("fill", "none")
            .attr("class", "link-path");

        // Nodes
        const node = svg.append("g")
            .selectAll("g")
            .data(data.nodes)
            .join("g")
            .call(d3.drag()
                .on("start", (event) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    event.subject.fx = event.subject.x;
                    event.subject.fy = event.subject.y;
                })
                .on("drag", (event) => {
                    event.subject.fx = event.x;
                    event.subject.fy = event.y;
                })
                .on("end", (event) => {
                    if (!event.active) simulation.alphaTarget(0);
                    event.subject.fx = null;
                    event.subject.fy = null;
                }));

        node.append("circle")
            .attr("r", d => d.type === 'bank' ? 25 : 18)
            .attr("fill", d => {
                if (d.risk > 80) return "#FF4C4C";
                if (d.risk > 50) return "#D4AF37";
                return "#4FA3FF";
            })
            .attr("stroke", "#0A0F1F")
            .attr("stroke-width", 3)
            .attr("filter", d => d.risk > 80 ? "url(#glow)" : "")
            .style("cursor", "pointer");

        node.append("text")
            .attr("dy", 35)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "10px")
            .attr("font-weight", "bold")
            .attr("class", "pointer-events-none")
            .text(d => d.label);

        simulation.on("tick", () => {
            link.attr("d", d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dr = Math.sqrt(dx * dx + dy * dy);
                return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
            });

            node.attr("transform", d => `translate(${d.x},${d.y})`);
        });

        return () => simulation.stop();
    }, []);

    return (
        <div className="w-full h-full glass-morphism rounded-2xl overflow-hidden relative">
            <div className="absolute top-6 left-6 z-10">
                <h3 className="text-xl font-bold gold-text-shimmer">Live Fund Flow</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Cross-entity Transaction Graph</p>
            </div>
            <div className="absolute top-6 right-6 z-10 flex space-x-4">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-fraud-red glow-red"></div>
                    <span className="text-[10px] text-slate-300 uppercase font-bold">High Risk</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-royal-gold"></div>
                    <span className="text-[10px] text-slate-300 uppercase font-bold">Institutional</span>
                </div>
            </div>
            <svg ref={svgRef} className="w-full h-[600px]"></svg>
        </div>
    );
};

export default FundFlowGraph;
