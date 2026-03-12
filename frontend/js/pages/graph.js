/* Graph Explorer page */
let graphSim = null;
let _graphDragCleanup = null;
let _graphState = null;
let _graphZoomFns = null;

function nodeColor(risk) {
  if (risk >= 75) return "#d63031";
  if (risk >= 50) return "#e17055";
  if (risk >= 25) return "#fdcb6e";
  return "#00b894";
}

function nodeRadius(risk, nodeCount) {
  const base = nodeCount > 200 ? 4 : nodeCount > 100 ? 6 : 8;
  const scale = nodeCount > 200 ? 10 : nodeCount > 100 ? 14 : 18;
  return base + (risk / 100) * scale;
}

async function loadSubgraph() {
  const id = document.getElementById("graph-account-id").value.trim();
  if (!id) return;
  try {
    const d = await apiFetch("/graph/subgraph/" + encodeURIComponent(id));
    _graphState = { nodes: d.nodes || [], links: d.links || [], centerId: d.center_account };
    renderGraphFiltered();
  } catch (e) {
    alert("Error: " + e.message);
  }
}

async function loadFullGraph() {
  try {
    const limitSel = document.getElementById("graph-limit");
    const limit = limitSel ? +limitSel.value : 100;
    const d = await apiFetch("/graph/full?limit=" + limit);
    if (d.truncated) {
      console.info(`Graph truncated: showing ${d.nodes.length} of ${d.total_in_graph} accounts (highest risk)`);
    }
    _graphState = { nodes: d.nodes || [], links: d.links || [] };
    renderGraphFiltered();
  } catch (e) {
    alert("Error loading graph: " + e.message);
  }
}

function renderGraphFiltered() {
  if (!_graphState) return;
  const minRisk = +(document.getElementById("graph-risk-filter")?.value || 0);
  const filtered = _graphState.nodes.filter((n) => (n.risk ?? n.risk_score ?? 0) >= minRisk);
  const ids = new Set(filtered.map((n) => n.id));
  const filteredLinks = _graphState.links.filter((l) => {
    const s = l.source?.id ?? l.source ?? l.from;
    const t = l.target?.id ?? l.target ?? l.to;
    return ids.has(s) && ids.has(t);
  });
  renderGraph(filtered, filteredLinks, _graphState.centerId);
}

function applyGraphRiskFilter() {
  const v = document.getElementById("graph-risk-filter").value;
  document.getElementById("graph-risk-val").textContent = v + "%";
  renderGraphFiltered();
}

function applyGraphEdgeFilter() {
  if (!_graphState) return;
  const mode = document.getElementById("graph-edge-mode").value;
  const svg = document.getElementById("graph-svg");
  const lines = svg.querySelectorAll("line");
  const annots = svg.querySelectorAll(".edge-annotation");
  lines.forEach((l, i) => {
    const tier = l.dataset.tier;
    let visible;
    if (mode === "none") visible = false;
    else if (mode === "all") visible = true;
    else if (mode === "suspicious") visible = tier === "suspicious" || tier === "warning";
    else if (mode === "safe") visible = tier === "safe" || tier === "normal";
    else visible = true;
    l.style.display = visible ? "" : "none";
    if (annots[i]) annots[i].style.display = visible ? "" : "none";
  });
}

function reLayoutGraph() { renderGraphFiltered(); }
function toggleGraphAnnotations() { renderGraphFiltered(); }

function graphZoom(factor) { if (_graphZoomFns) _graphZoomFns.zoom(factor); }
function graphResetView() { if (_graphZoomFns) _graphZoomFns.reset(); }

async function loadGraphStats() {
  const panel = document.getElementById("graph-stats-panel");
  const box = document.getElementById("graph-stats-content");
  panel.style.display = "";
  box.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const d = await apiFetch("/graph/stats");
    box.innerHTML = `
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Total Accounts</span><span class="info-value">${fmt(d.total_accounts)}</span></div>
        <div class="info-item"><span class="info-label">Total Transactions</span><span class="info-value">${fmt(d.total_transactions)}</span></div>
        <div class="info-item"><span class="info-label">Flagged Accounts</span><span class="info-value">${fmt(d.flagged_accounts)}</span></div>
        <div class="info-item"><span class="info-label">Total Volume</span><span class="info-value">₹${fmt(d.total_volume)}</span></div>
        <div class="info-item"><span class="info-label">Avg Transaction</span><span class="info-value">₹${fmt(d.avg_transaction)}</span></div>
        <div class="info-item"><span class="info-label">Suspicious Volume</span><span class="info-value">₹${fmt(d.suspicious_volume)}</span></div>
      </div>`;
  } catch (e) {
    box.innerHTML = `<p class="muted" style="color:var(--red)">Error: ${escapeHtml(e.message)}</p>`;
  }
}

function renderGraph(nodes, links, centerId) {
  if (graphSim) { graphSim.stop = true; graphSim = null; }
  if (_graphDragCleanup) { _graphDragCleanup(); _graphDragCleanup = null; }

  const svg = document.getElementById("graph-svg");
  const tooltip = document.getElementById("graph-tooltip");
  svg.innerHTML = "";

  const rect = svg.getBoundingClientRect();
  const W = Math.max(rect.width, 900);
  const H = Math.max(rect.height, 620);
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  const countEl = document.getElementById("graph-node-count");
  if (countEl) countEl.textContent = nodes.length ? `${nodes.length} nodes • ${links.length} edges` : "";

  if (!nodes.length) {
    svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#5a6a85" font-size="14">No graph data — click Full Graph or adjust filters</text>';
    return;
  }

  const N = nodes.length;
  const showLabels = N <= 120;

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <marker id="arrow" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
      <path d="M0,0 L6,2.5 L0,5 Z" fill="rgba(255,255,255,0.1)"/>
    </marker>
    <marker id="arrow-warn" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
      <path d="M0,0 L6,2.5 L0,5 Z" fill="rgba(251,191,36,0.5)"/>
    </marker>
    <marker id="arrow-sus" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
      <path d="M0,0 L6,2.5 L0,5 Z" fill="rgba(239,68,68,0.5)"/>
    </marker>
    <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
  svg.appendChild(defs);

  const layoutMode = document.getElementById("graph-layout")?.value || "force";
  const nodeMap = {};
  const cx = W / 2, cy = H / 2;
  const spread = Math.min(W, H) * 0.42;

  if (layoutMode === "radial") {
    const sorted = [...nodes].sort((a, b) => (b.risk ?? b.risk_score ?? 0) - (a.risk ?? a.risk_score ?? 0));
    sorted.forEach((n, i) => {
      const ring = Math.floor(i / Math.max(8, N * 0.15));
      const ringCount = Math.min(Math.max(8, N * 0.15), N - ring * Math.max(8, N * 0.15));
      const posInRing = i % Math.max(8, Math.ceil(N * 0.15));
      const angle = (posInRing / ringCount) * Math.PI * 2;
      const radius = 50 + ring * (spread / Math.ceil(N / Math.max(8, N * 0.15)));
      n._x = cx + Math.cos(angle) * radius;
      n._y = cy + Math.sin(angle) * radius;
      n._vx = 0; n._vy = 0;
      nodeMap[n.id] = n;
    });
  } else if (layoutMode === "grid") {
    const cols = Math.ceil(Math.sqrt(N * (W / H)));
    const cellW = W / (cols + 1);
    const rows = Math.ceil(N / cols);
    const cellH = H / (rows + 1);
    nodes.forEach((n, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      n._x = cellW * (col + 1);
      n._y = cellH * (row + 1);
      n._vx = 0; n._vy = 0;
      nodeMap[n.id] = n;
    });
  } else {
    nodes.forEach((n, i) => {
      const angle = (i / N) * Math.PI * 2;
      const radius = spread * (0.3 + 0.7 * Math.random());
      n._x = cx + Math.cos(angle) * radius;
      n._y = cy + Math.sin(angle) * radius;
      n._vx = 0; n._vy = 0;
      nodeMap[n.id] = n;
    });
  }

  const resolvedLinks = links.map((l) => {
    const score = l.suspicious_score ?? (l.is_suspicious ? 1 : 0);
    let tier;
    if (score >= 0.7) tier = "suspicious";
    else if (score >= 0.3) tier = "warning";
    else if (score > 0) tier = "normal";
    else tier = "safe";
    return {
      source: nodeMap[l.source?.id ?? l.source] || nodeMap[l.from],
      target: nodeMap[l.target?.id ?? l.target] || nodeMap[l.to],
      amount: l.value || l.amount || l.total_amount || 0,
      is_suspicious: l.is_suspicious || false,
      suspicious_score: score,
      tier,
      tx_count: l.tx_count || 1,
    };
  }).filter((l) => l.source && l.target);

  const edgeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const edgeAnnotGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const labelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(edgeGroup);
  svg.appendChild(edgeAnnotGroup);
  svg.appendChild(nodeGroup);
  svg.appendChild(labelGroup);

  const edgeMode = document.getElementById("graph-edge-mode")?.value || "suspicious";

  const lineEls = resolvedLinks.map((l) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.classList.add("edge-" + l.tier);
    line.dataset.tier = l.tier;
    if (l.tier === "suspicious") line.setAttribute("marker-end", "url(#arrow-sus)");
    else if (l.tier === "warning") line.setAttribute("marker-end", "url(#arrow-warn)");
    else line.setAttribute("marker-end", "url(#arrow)");
    if (edgeMode === "none") line.style.display = "none";
    else if (edgeMode === "suspicious" && l.tier !== "suspicious" && l.tier !== "warning") line.style.display = "none";
    else if (edgeMode === "safe" && l.tier !== "safe" && l.tier !== "normal") line.style.display = "none";
    edgeGroup.appendChild(line);

    line.style.cursor = "pointer";
    line.addEventListener("mouseenter", () => {
      const tierLabel = l.tier.charAt(0).toUpperCase() + l.tier.slice(1);
      const tierColors = { safe: "#10b981", normal: "#94a3b8", warning: "#fbbf24", suspicious: "#ef4444" };
      tooltip.style.display = "block";
      tooltip.innerHTML =
        `<strong style="color:${tierColors[l.tier]}">${tierLabel}</strong><br>` +
        `${escapeHtml(l.source.id)} → ${escapeHtml(l.target.id)}<br>` +
        `Amount: ₹${fmt(l.amount)}<br>` +
        `Transactions: ${l.tx_count}<br>` +
        `Suspicious Score: ${(l.suspicious_score * 100).toFixed(0)}%`;
    });
    line.addEventListener("mousemove", (e) => {
      const cr = svg.getBoundingClientRect();
      tooltip.style.left = e.clientX - cr.left + 12 + "px";
      tooltip.style.top = e.clientY - cr.top - 10 + "px";
    });
    line.addEventListener("mouseleave", () => { tooltip.style.display = "none"; });
    return line;
  });

  const annotMode = document.getElementById("graph-annotations")?.value || "off";
  const showEdgeAnnot = annotMode === "edges" || annotMode === "all";
  const showRiskAnnot = annotMode === "risk" || annotMode === "all";
  const tierColors = { safe: "#10b981", normal: "#94a3b8", warning: "#fbbf24", suspicious: "#ef4444" };

  const edgeAnnotEls = showEdgeAnnot ? resolvedLinks.map((l) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.classList.add("edge-annotation");
    const tierText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const tierLabel = l.tier.charAt(0).toUpperCase() + l.tier.slice(1);
    tierText.textContent = tierLabel + " · ₹" + fmt(l.amount);
    tierText.setAttribute("text-anchor", "middle");
    tierText.setAttribute("dy", "-4");
    tierText.setAttribute("fill", tierColors[l.tier]);
    tierText.classList.add("edge-annot-text");
    g.appendChild(tierText);
    const scoreText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    scoreText.textContent = (l.suspicious_score * 100).toFixed(0) + "% sus · " + l.tx_count + " tx";
    scoreText.setAttribute("text-anchor", "middle");
    scoreText.setAttribute("dy", "8");
    scoreText.setAttribute("fill", "rgba(180,190,210,0.6)");
    scoreText.classList.add("edge-annot-sub");
    g.appendChild(scoreText);
    if (edgeMode === "none") g.style.display = "none";
    else if (edgeMode === "suspicious" && l.tier !== "suspicious" && l.tier !== "warning") g.style.display = "none";
    else if (edgeMode === "safe" && l.tier !== "safe" && l.tier !== "normal") g.style.display = "none";
    edgeAnnotGroup.appendChild(g);
    return g;
  }) : [];

  let dragNode = null;
  function onDocMouseMove(e) {
    if (!dragNode) return;
    const cr = svg.getBoundingClientRect();
    const scaleX = W / cr.width;
    const scaleY = H / cr.height;
    dragNode._x = (e.clientX - cr.left) * scaleX;
    dragNode._y = (e.clientY - cr.top) * scaleY;
    dragNode._vx = 0; dragNode._vy = 0;
  }
  function onDocMouseUp() { dragNode = null; }
  document.addEventListener("mousemove", onDocMouseMove);
  document.addEventListener("mouseup", onDocMouseUp);
  _graphDragCleanup = () => {
    document.removeEventListener("mousemove", onDocMouseMove);
    document.removeEventListener("mouseup", onDocMouseUp);
  };

  const circleEls = nodes.map((n) => {
    const risk = n.risk ?? n.risk_score ?? 0;
    const r = nodeRadius(risk, N);
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", r);
    circle.setAttribute("fill", nodeColor(risk));
    if (risk >= 75) circle.setAttribute("filter", "url(#glow)");
    if (n.id === centerId) { circle.style.stroke = "#6366f1"; circle.style.strokeWidth = "3"; }
    circle.addEventListener("mouseenter", () => {
      tooltip.style.display = "block";
      tooltip.innerHTML = `<strong>${escapeHtml(n.id)}</strong><br>Risk: ${risk.toFixed(1)}%<br>Type: ${escapeHtml(n.type || "account")}`;
    });
    circle.addEventListener("mousemove", (e) => {
      const cr = svg.getBoundingClientRect();
      tooltip.style.left = e.clientX - cr.left + 12 + "px";
      tooltip.style.top = e.clientY - cr.top - 10 + "px";
    });
    circle.addEventListener("mouseleave", () => { tooltip.style.display = "none"; });
    circle.addEventListener("mousedown", (e) => { dragNode = n; e.preventDefault(); });
    circle.addEventListener("dblclick", () => {
      document.getElementById("graph-account-id").value = n.id;
      loadSubgraph();
    });
    nodeGroup.appendChild(circle);
    return circle;
  });

  const textEls = (showLabels || showRiskAnnot) ? nodes.map((n) => {
    const risk = n.risk ?? n.risk_score ?? 0;
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    if (showRiskAnnot) {
      text.textContent = n.id + " (" + risk.toFixed(0) + "%)";
      text.setAttribute("fill", nodeColor(risk));
    } else {
      text.textContent = n.id;
    }
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dy", "-12");
    labelGroup.appendChild(text);
    return text;
  }) : [];

  let zoomLevel = 1, panX = 0, panY = 0;
  function applyTransform() {
    const t = `translate(${panX},${panY}) scale(${zoomLevel})`;
    edgeGroup.setAttribute("transform", t);
    edgeAnnotGroup.setAttribute("transform", t);
    nodeGroup.setAttribute("transform", t);
    labelGroup.setAttribute("transform", t);
  }
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoomLevel = Math.max(0.1, Math.min(8, zoomLevel * delta));
    applyTransform();
  });
  let panning = false, panStartX, panStartY;
  svg.addEventListener("mousedown", (e) => {
    if (e.target === svg) { panning = true; panStartX = e.clientX - panX; panStartY = e.clientY - panY; }
  });
  svg.addEventListener("mousemove", (e) => {
    if (!panning) return;
    panX = e.clientX - panStartX; panY = e.clientY - panStartY;
    applyTransform();
  });
  svg.addEventListener("mouseup", () => { panning = false; });
  svg.addEventListener("mouseleave", () => { panning = false; });

  _graphZoomFns = {
    zoom(factor) { zoomLevel = Math.max(0.1, Math.min(8, zoomLevel * factor)); applyTransform(); },
    reset() { zoomLevel = 1; panX = 0; panY = 0; applyTransform(); },
  };

  function fitViewBox() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach((n) => {
      const r = nodeRadius(n.risk ?? n.risk_score ?? 0, N) + 5;
      if (n._x - r < minX) minX = n._x - r;
      if (n._y - r < minY) minY = n._y - r;
      if (n._x + r > maxX) maxX = n._x + r;
      if (n._y + r > maxY) maxY = n._y + r;
    });
    const pad = 40;
    const vw = maxX - minX + pad * 2;
    const vh = maxY - minY + pad * 2;
    svg.setAttribute("viewBox", `${minX - pad} ${minY - pad} ${vw} ${vh}`);
  }

  const sim = { stop: false };
  graphSim = sim;

  if (layoutMode !== "force") {
    lineEls.forEach((el, i) => {
      el.setAttribute("x1", resolvedLinks[i].source._x); el.setAttribute("y1", resolvedLinks[i].source._y);
      el.setAttribute("x2", resolvedLinks[i].target._x); el.setAttribute("y2", resolvedLinks[i].target._y);
    });
    circleEls.forEach((el, i) => { el.setAttribute("cx", nodes[i]._x); el.setAttribute("cy", nodes[i]._y); });
    textEls.forEach((el, i) => { el.setAttribute("x", nodes[i]._x); el.setAttribute("y", nodes[i]._y); });
    edgeAnnotEls.forEach((el, i) => {
      const l = resolvedLinks[i];
      const mx = (l.source._x + l.target._x) / 2;
      const my = (l.source._y + l.target._y) / 2;
      el.setAttribute("transform", `translate(${mx},${my})`);
    });
    fitViewBox();
    return;
  }

  const idealDist = 30 + Math.sqrt(N) * 12;
  const repulsionStrength = idealDist * idealDist * 0.8;
  const springK = 0.003;
  const decay = 0.996;
  const alpha0 = 0.5;
  let currentAlpha = alpha0;

  function tick() {
    if (sim.stop || currentAlpha < 0.001) return;
    currentAlpha *= decay;

    if (N <= 200) {
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          let dx = nodes[j]._x - nodes[i]._x;
          let dy = nodes[j]._y - nodes[i]._y;
          let d2 = dx * dx + dy * dy;
          let dist = Math.sqrt(d2) || 1;
          let force = (repulsionStrength / d2) * currentAlpha;
          let fx = (dx / dist) * force;
          let fy = (dy / dist) * force;
          nodes[i]._vx -= fx; nodes[i]._vy -= fy;
          nodes[j]._vx += fx; nodes[j]._vy += fy;
        }
      }
    } else {
      const cellSize = idealDist * 1.5;
      const grid = {};
      for (let i = 0; i < N; i++) {
        const gx = Math.floor(nodes[i]._x / cellSize);
        const gy = Math.floor(nodes[i]._y / cellSize);
        const key = gx + "," + gy;
        if (!grid[key]) grid[key] = { items: [], mx: 0, my: 0 };
        grid[key].items.push(i);
        grid[key].mx += nodes[i]._x;
        grid[key].my += nodes[i]._y;
      }
      for (const key in grid) {
        const c = grid[key]; c.mx /= c.items.length; c.my /= c.items.length;
      }
      for (let i = 0; i < N; i++) {
        const gx = Math.floor(nodes[i]._x / cellSize);
        const gy = Math.floor(nodes[i]._y / cellSize);
        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const cell = grid[(gx + ox) + "," + (gy + oy)];
            if (!cell) continue;
            for (let k = 0; k < cell.items.length; k++) {
              const j = cell.items[k];
              if (j <= i) continue;
              let dx = nodes[j]._x - nodes[i]._x;
              let dy = nodes[j]._y - nodes[i]._y;
              let d2 = dx * dx + dy * dy;
              let dist = Math.sqrt(d2) || 1;
              let force = (repulsionStrength / d2) * currentAlpha;
              let fx = (dx / dist) * force;
              let fy = (dy / dist) * force;
              nodes[i]._vx -= fx; nodes[i]._vy -= fy;
              nodes[j]._vx += fx; nodes[j]._vy += fy;
            }
          }
        }
        for (const key in grid) {
          const c = grid[key];
          const parts = key.split(",");
          const cgx = +parts[0], cgy = +parts[1];
          if (Math.abs(cgx - gx) <= 1 && Math.abs(cgy - gy) <= 1) continue;
          let dx = c.mx - nodes[i]._x;
          let dy = c.my - nodes[i]._y;
          let d2 = dx * dx + dy * dy;
          let dist = Math.sqrt(d2) || 1;
          let force = ((repulsionStrength * c.items.length) / d2) * currentAlpha;
          nodes[i]._vx -= (dx / dist) * force;
          nodes[i]._vy -= (dy / dist) * force;
        }
      }
    }

    resolvedLinks.forEach((l) => {
      let dx = l.target._x - l.source._x;
      let dy = l.target._y - l.source._y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 1;
      let force = (dist - idealDist) * springK * currentAlpha;
      let fx = (dx / dist) * force;
      let fy = (dy / dist) * force;
      l.source._vx += fx; l.source._vy += fy;
      l.target._vx -= fx; l.target._vy -= fy;
    });

    const gravity = 0.0008;
    nodes.forEach((n) => {
      n._vx += (cx - n._x) * gravity * currentAlpha;
      n._vy += (cy - n._y) * gravity * currentAlpha;
      n._vx *= 0.82; n._vy *= 0.82;
      n._x += n._vx; n._y += n._vy;
    });

    lineEls.forEach((el, i) => {
      el.setAttribute("x1", resolvedLinks[i].source._x); el.setAttribute("y1", resolvedLinks[i].source._y);
      el.setAttribute("x2", resolvedLinks[i].target._x); el.setAttribute("y2", resolvedLinks[i].target._y);
    });
    circleEls.forEach((el, i) => { el.setAttribute("cx", nodes[i]._x); el.setAttribute("cy", nodes[i]._y); });
    textEls.forEach((el, i) => { el.setAttribute("x", nodes[i]._x); el.setAttribute("y", nodes[i]._y); });
    edgeAnnotEls.forEach((el, i) => {
      const l = resolvedLinks[i];
      const mx = (l.source._x + l.target._x) / 2;
      const my = (l.source._y + l.target._y) / 2;
      el.setAttribute("transform", `translate(${mx},${my})`);
    });

    fitViewBox();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
