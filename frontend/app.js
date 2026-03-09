/* ============================================================
   NextGenAML – Frontend Application Logic
   ============================================================ */

const API = ""; // same origin – served by FastAPI

// ── Navigation ───────────────────────────────────────
document.querySelectorAll(".nav-item").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const page = link.dataset.page;
    document
      .querySelectorAll(".nav-item")
      .forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.remove("active"));
    document.getElementById("page-" + page).classList.add("active");
    document.getElementById("pageTitle").textContent = link.textContent.trim();
    // Auto-load data for certain pages
    if (page === "dashboard") loadDashboard();
    if (page === "graph") setTimeout(loadFullGraph, 50);
    if (page === "patterns") loadPatterns("all");
    if (page === "analytics") loadAnalytics();
    if (page === "model") loadModelInfo();
    if (page === "reports") loadReportsList();
    if (page === "upload") loadUploadStatus();
  });
});

// ── Clock ────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleString();
}
setInterval(updateClock, 1000);
updateClock();

// ── API Helpers ──────────────────────────────────────
async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(API + path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || res.statusText);
    }
    return await res.json();
  } catch (e) {
    console.error("API Error:", e);
    throw e;
  }
}

function risklevelBadge(level) {
  const l = (level || "").toLowerCase();
  return `<span class="badge badge-${l}">${level}</span>`;
}

function fmt(n) {
  if (n == null) return "—";
  if (typeof n === "number") {
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return n % 1 === 0 ? n.toLocaleString() : n.toFixed(4);
  }
  return String(n);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── Health Check ─────────────────────────────────────
async function checkHealth() {
  try {
    const d = await apiFetch("/health");
    document.getElementById("healthDot").className = "health-dot ok";
    document.getElementById("healthStatus").textContent =
      `v${d.version} • ${d.total_accounts} accts`;
  } catch {
    document.getElementById("healthDot").className = "health-dot err";
    document.getElementById("healthStatus").textContent = "Offline";
  }
}

// ── Dashboard ────────────────────────────────────────
let dashTrendChart = null;

async function loadDashboard() {
  try {
    const d = await apiFetch("/dashboard");
    document.getElementById("kpi-transactions").textContent = fmt(
      d.total_transactions,
    );
    document.getElementById("kpi-volume").textContent =
      "₹" + fmt(d.total_volume);
    document.getElementById("kpi-flagged").textContent =
      "₹" + fmt(d.flagged_amount);
    document.getElementById("kpi-highrisk").textContent = fmt(
      d.high_risk_entities,
    );
    document.getElementById("kpi-active-cases").textContent = fmt(
      d.active_cases,
    );
    document.getElementById("kpi-risk-score").textContent =
      d.system_risk_score != null ? d.system_risk_score.toFixed(1) + "%" : "—";

    // Recent activity
    const box = document.getElementById("recent-activity");
    if (d.recent_activity && d.recent_activity.length) {
      let html =
        "<table><thead><tr><th>Sender</th><th>Receiver</th><th>Amount</th><th>Pattern</th><th>Time</th></tr></thead><tbody>";
      d.recent_activity.forEach((a) => {
        html += `<tr>
          <td>${escapeHtml(a.sender || "")}</td>
          <td>${escapeHtml(a.receiver || "")}</td>
          <td>₹${fmt(a.amount || 0)}</td>
          <td>${escapeHtml(a.pattern || "-")}</td>
          <td>${escapeHtml(a.timestamp || "")}</td>
        </tr>`;
      });
      html += "</tbody></table>";
      box.innerHTML = html;
    } else {
      box.innerHTML = '<p class="muted">No recent activity.</p>';
    }

    // Trends chart (API returns dict like {"Jan": 5321600, "Feb": ...})
    if (d.trends && Object.keys(d.trends).length) {
      const labels = Object.keys(d.trends);
      const values = Object.values(d.trends);
      const ctx = document.getElementById("dashTrendChart").getContext("2d");
      if (dashTrendChart) dashTrendChart.destroy();
      dashTrendChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Volume (₹)",
              data: values,
              backgroundColor: "rgba(108,92,231,0.6)",
              borderColor: "#6c5ce7",
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: chartOpts("Volume (₹)"),
      });
    }
  } catch (e) {
    document.getElementById("kpi-transactions").textContent = "Error";
  }
}

// ── Accounts ─────────────────────────────────────────
async function loadAccounts() {
  const search = document.getElementById("account-search").value;
  const status = document.getElementById("account-status-filter").value;
  let url = "/accounts/?limit=50";
  if (search) url += "&search=" + encodeURIComponent(search);
  if (status) url += "&status=" + encodeURIComponent(status);

  const box = document.getElementById("accounts-table");
  box.innerHTML = '<p class="muted">Loading...</p>';
  try {
    const data = await apiFetch(url);
    if (!data.length) {
      box.innerHTML = '<p class="muted">No accounts found.</p>';
      return;
    }
    let html =
      "<table><thead><tr><th>Account</th><th>Risk Score</th><th>Pattern</th><th>Status</th><th>Volume 30d</th><th>Tx Count</th><th>Actions</th></tr></thead><tbody>";
    data.forEach((a) => {
      html += `<tr>
        <td>${escapeHtml(a.account_id)}</td>
        <td>${fmt(a.risk_score)}</td>
        <td>${escapeHtml(a.pattern_detected || "-")}</td>
        <td>${risklevelBadge(a.status)}</td>
        <td>₹${fmt(a.volume_30d)}</td>
        <td>${a.transaction_count}</td>
        <td>
          <button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem" onclick="quickPredict('${escapeHtml(a.account_id)}')">Predict</button>
          <button class="btn btn-outline" style="padding:0.25rem 0.5rem;font-size:0.75rem" onclick="quickExplain('${escapeHtml(a.account_id)}')">Explain</button>
        </td>
      </tr>`;
    });
    html += "</tbody></table>";
    box.innerHTML = html;
  } catch (e) {
    box.innerHTML = `<p class="muted" style="color:var(--danger)">Error: ${escapeHtml(e.message)}</p>`;
  }
}

function quickPredict(id) {
  document.getElementById("predict-account-id").value = id;
  document.querySelector('[data-page="predictions"]').click();
  setTimeout(predictSingle, 200);
}

function quickExplain(id) {
  navigateToPage("predictions");
  apiFetch("/explain/" + encodeURIComponent(id))
    .then((d) => {
      document.getElementById("prediction-result").textContent = JSON.stringify(
        d,
        null,
        2,
      );
    })
    .catch((e) => {
      document.getElementById("prediction-result").textContent =
        "Error: " + e.message;
    });
}

function navigateToPage(page) {
  document.querySelector(`[data-page="${page}"]`).click();
}

// ── Predictions ──────────────────────────────────────
async function predictSingle() {
  const id = document.getElementById("predict-account-id").value.trim();
  if (!id) return;
  const box = document.getElementById("prediction-result");
  box.textContent = "Predicting...";
  try {
    const d = await apiFetch("/predict?account_id=" + encodeURIComponent(id), {
      method: "POST",
    });
    box.innerHTML = `
      <strong>Account:</strong> ${escapeHtml(d.account_id)}<br>
      <strong>Fraud Probability:</strong> ${(d.fraud_probability * 100).toFixed(2)}%<br>
      <strong>Risk Level:</strong> ${risklevelBadge(d.risk_level)}<br>
      <strong>Confidence:</strong> ${(d.confidence * 100).toFixed(1)}%<br>
      <strong>Attention Weights:</strong> [${(d.attention_weights || []).map((w) => w.toFixed(4)).join(", ")}]
    `;
  } catch (e) {
    box.textContent = "Error: " + e.message;
  }
}

async function predictBatch() {
  const raw = document.getElementById("predict-batch-ids").value.trim();
  if (!raw) return;
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const box = document.getElementById("batch-result");
  box.innerHTML = '<p class="muted">Predicting...</p>';
  try {
    const data = await apiFetch("/predict/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_ids: ids }),
    });
    let html =
      "<table><thead><tr><th>Account</th><th>Fraud Prob</th><th>Risk</th><th>Confidence</th></tr></thead><tbody>";
    data.forEach((d) => {
      html += `<tr>
        <td>${escapeHtml(d.account_id)}</td>
        <td>${(d.fraud_probability * 100).toFixed(2)}%</td>
        <td>${risklevelBadge(d.risk_level)}</td>
        <td>${(d.confidence * 100).toFixed(1)}%</td>
      </tr>`;
    });
    html += "</tbody></table>";
    box.innerHTML = html;
  } catch (e) {
    box.innerHTML = `<p class="muted" style="color:var(--danger)">Error: ${escapeHtml(e.message)}</p>`;
  }
}

async function monitorTransaction() {
  const body = {
    sender_account: document.getElementById("mon-sender").value.trim(),
    receiver_account: document.getElementById("mon-receiver").value.trim(),
    amount: parseFloat(document.getElementById("mon-amount").value) || 0,
    currency: document.getElementById("mon-currency").value.trim() || "INR",
  };
  const box = document.getElementById("monitor-result");
  box.textContent = "Scoring...";
  try {
    const d = await apiFetch("/monitor/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    box.innerHTML = `
      <strong>Transaction ID:</strong> ${escapeHtml(d.transaction_id || "-")}<br>
      <strong>Status:</strong> ${escapeHtml(d.status || "-")}<br>
      <strong>Risk Score:</strong> ${fmt(d.risk_score)}<br>
      <strong>Flags:</strong> ${(d.flags || []).map((f) => escapeHtml(f)).join(", ") || "None"}
    `;
  } catch (e) {
    box.textContent = "Error: " + e.message;
  }
}

// ── Alerts ───────────────────────────────────────────
async function loadAlerts() {
  const minRisk =
    parseFloat(document.getElementById("alert-min-risk").value) || 0.5;
  const limit = parseInt(document.getElementById("alert-limit").value) || 20;
  const box = document.getElementById("alerts-table");
  box.innerHTML = '<p class="muted">Loading...</p>';
  try {
    const data = await apiFetch("/alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ min_risk: minRisk, limit }),
    });
    if (!data.length) {
      box.innerHTML = '<p class="muted">No alerts.</p>';
      return;
    }
    let html =
      "<table><thead><tr><th>Account</th><th>Risk Score</th><th>Details</th></tr></thead><tbody>";
    data.forEach((a) => {
      html += `<tr>
        <td>${escapeHtml(a.account_id || a.account || "")}</td>
        <td>${fmt(a.risk_score || a.score)}</td>
        <td>${escapeHtml(a.pattern || a.reason || "-")}</td>
      </tr>`;
    });
    html += "</tbody></table>";
    box.innerHTML = html;
  } catch (e) {
    box.innerHTML = `<p class="muted" style="color:var(--danger)">Error: ${escapeHtml(e.message)}</p>`;
  }
}

// ── Patterns ─────────────────────────────────────────
async function loadPatterns(type) {
  // Hide all cards before loading to avoid stale cards remaining visible
  document.getElementById("patterns-circular").style.display = "none";
  document.getElementById("patterns-structuring").style.display = "none";
  document.getElementById("patterns-dormant").style.display = "none";

  const url = "/patterns/" + type;
  try {
    const data = await apiFetch(url);
    if (type === "all") {
      renderCircular(data.circular || []);
      renderStructuring(data.structuring || []);
      renderDormant(data.dormant || []);
      document.getElementById("patterns-circular").style.display = "";
      document.getElementById("patterns-structuring").style.display = "";
      document.getElementById("patterns-dormant").style.display = "";
    } else if (type === "circular") {
      renderCircular(data);
      document.getElementById("patterns-circular").style.display = "";
    } else if (type === "structuring") {
      renderStructuring(data);
      document.getElementById("patterns-structuring").style.display = "";
    } else if (type === "dormant") {
      renderDormant(data);
      document.getElementById("patterns-dormant").style.display = "";
    }
  } catch (e) {
    alert("Error loading patterns: " + e.message);
  }
}

function renderCircular(arr) {
  const box = document.getElementById("circular-table");
  if (!arr.length) {
    box.innerHTML = '<p class="muted">No circular patterns detected.</p>';
    return;
  }
  let html =
    "<table><thead><tr><th>Cycle</th><th>Length</th><th>Total Flow</th></tr></thead><tbody>";
  arr.forEach((c) => {
    html += `<tr><td>${(c.account_chain || []).map(escapeHtml).join(" → ")}</td><td>${c.cycle_length}</td><td>₹${fmt(c.total_flow)}</td></tr>`;
  });
  box.innerHTML = html + "</tbody></table>";
}

function renderStructuring(arr) {
  const box = document.getElementById("structuring-table");
  if (!arr.length) {
    box.innerHTML = '<p class="muted">No structuring patterns detected.</p>';
    return;
  }
  let html =
    "<table><thead><tr><th>Sender</th><th>Transactions</th><th>Total Amount</th><th>Avg Amount</th><th>Window (min)</th></tr></thead><tbody>";
  arr.forEach((s) => {
    html += `<tr><td>${escapeHtml(s.sender)}</td><td>${s.transactions}</td><td>₹${fmt(s.total_amount)}</td><td>₹${fmt(s.avg_amount)}</td><td>${fmt(s.time_window_minutes)}</td></tr>`;
  });
  box.innerHTML = html + "</tbody></table>";
}

function renderDormant(arr) {
  const box = document.getElementById("dormant-table");
  if (!arr.length) {
    box.innerHTML = '<p class="muted">No dormant activations detected.</p>';
    return;
  }
  let html =
    "<table><thead><tr><th>Account</th><th>Dormant Days</th><th>Activation Amount</th><th>Date</th></tr></thead><tbody>";
  arr.forEach((d) => {
    html += `<tr><td>${escapeHtml(d.account_id)}</td><td>${d.dormant_days}</td><td>₹${fmt(d.activation_amount)}</td><td>${escapeHtml(d.activation_date)}</td></tr>`;
  });
  box.innerHTML = html + "</tbody></table>";
}

// ── Graph Explorer ───────────────────────────────────
let graphSim = null; // force simulation handle

async function loadSubgraph() {
  const id = document.getElementById("graph-account-id").value.trim();
  if (!id) return;
  const hops = document.getElementById("graph-hops").value || 2;
  try {
    const data = await apiFetch(
      `/graph/subgraph/${encodeURIComponent(id)}?hops=${hops}`,
    );
    renderGraph(data.nodes || [], data.links || [], id);
  } catch (e) {
    alert("Error: " + e.message);
  }
}

async function loadFullGraph() {
  try {
    const data = await apiFetch("/graph/full");
    renderGraph(data.nodes || [], data.links || data.edges || []);
  } catch (e) {
    alert("Error: " + e.message);
  }
  // Also load stats
  try {
    const stats = await apiFetch("/graph/stats");
    const card = document.getElementById("graph-stats-card");
    card.style.display = "";
    let html = '<dl class="info-grid">';
    for (const [k, v] of Object.entries(stats)) {
      if (typeof v !== "object") {
        html += `<dt>${escapeHtml(k.replace(/_/g, " "))}</dt><dd>${fmt(v)}</dd>`;
      }
    }
    html += "</dl>";
    if (stats.risk_distribution) {
      html +=
        '<h4 style="margin-top:0.5rem">Risk Distribution</h4><dl class="info-grid">';
      for (const [k, v] of Object.entries(stats.risk_distribution)) {
        html += `<dt>${escapeHtml(k)}</dt><dd>${fmt(v)}</dd>`;
      }
      html += "</dl>";
    }
    document.getElementById("graph-stats-content").innerHTML = html;
  } catch {
    /* stats optional */
  }
}

function nodeColor(risk) {
  if (risk >= 70) return "#ff6b6b";
  if (risk >= 30) return "#feca57";
  return "#00b894";
}

function nodeRadius(risk) {
  return 10 + (risk / 100) * 14; // 10-24px range
}

function renderGraph(nodes, links, centerId) {
  if (graphSim) {
    graphSim.stop();
    graphSim = null;
  }

  const svg = document.getElementById("graph-svg");
  const rect = svg.getBoundingClientRect();
  const W = Math.max(rect.width, 900),
    H = 600;
  svg.innerHTML = "";
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", H);
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  if (!nodes.length) {
    svg.innerHTML =
      '<text x="50%" y="50%" text-anchor="middle" fill="#7a7f9a" font-size="14">No graph data — enter an Account ID above</text>';
    return;
  }

  const tooltip = document.getElementById("graph-tooltip");

  // Build node map
  const nodeMap = {};
  nodes.forEach((n) => {
    n.x = W / 2 + (Math.random() - 0.5) * W * 0.6;
    n.y = H / 2 + (Math.random() - 0.5) * H * 0.6;
    n.vx = 0;
    n.vy = 0;
    nodeMap[n.id] = n;
  });

  // Resolve links to node refs
  const resolvedLinks = links
    .map((l) => ({
      source: nodeMap[l.source] || nodeMap[l.src],
      target: nodeMap[l.target] || nodeMap[l.tgt],
      value: l.value || l.amount || 0,
      is_suspicious: l.is_suspicious || false,
    }))
    .filter((l) => l.source && l.target);

  // SVG defs for arrow markers
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  ["normal", "sus"].forEach((type) => {
    const marker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker",
    );
    marker.setAttribute("id", "arrow-" + type);
    marker.setAttribute("viewBox", "0 0 10 6");
    marker.setAttribute("refX", "10");
    marker.setAttribute("refY", "3");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "6");
    marker.setAttribute("orient", "auto-start-reverse");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M0,0 L10,3 L0,6 Z");
    path.setAttribute(
      "class",
      type === "sus" ? "graph-arrow-sus" : "graph-arrow",
    );
    marker.appendChild(path);
    defs.appendChild(marker);
  });
  svg.appendChild(defs);

  // Zoom/pan group
  const gRoot = document.createElementNS("http://www.w3.org/2000/svg", "g");
  gRoot.setAttribute("id", "graph-root");
  svg.appendChild(gRoot);

  // Draw links
  const linkEls = resolvedLinks.map((l) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute(
      "class",
      l.is_suspicious
        ? "graph-link graph-link-suspicious"
        : "graph-link graph-link-normal",
    );
    line.setAttribute(
      "marker-end",
      l.is_suspicious ? "url(#arrow-sus)" : "url(#arrow-normal)",
    );
    gRoot.appendChild(line);
    return { el: line, data: l };
  });

  // Draw edge labels (amounts)
  const edgeLabelEls = resolvedLinks.map((l) => {
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("class", "graph-amount-label");
    txt.setAttribute("text-anchor", "middle");
    txt.textContent =
      l.value >= 1e6
        ? "₹" + (l.value / 1e6).toFixed(1) + "M"
        : l.value >= 1e3
          ? "₹" + (l.value / 1e3).toFixed(0) + "K"
          : l.value > 0
            ? "₹" + l.value
            : "";
    gRoot.appendChild(txt);
    return { el: txt, data: l };
  });

  // Draw nodes
  const nodeEls = nodes.map((n) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "graph-node");

    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    circle.setAttribute("r", nodeRadius(n.risk || 0));
    circle.setAttribute("fill", nodeColor(n.risk || 0));
    circle.setAttribute("stroke", n.id === centerId ? "#6c5ce7" : "#1a1d27");
    circle.setAttribute("stroke-width", n.id === centerId ? "3" : "2");
    if (n.risk >= 70) circle.setAttribute("filter", "url(#glow)");
    g.appendChild(circle);

    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    label.setAttribute("class", "graph-label");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dy", -(nodeRadius(n.risk || 0) + 5));
    label.textContent = n.label || n.id;
    g.appendChild(label);

    // Tooltip on hover
    g.addEventListener("mouseenter", (e) => {
      tooltip.innerHTML = `<strong>${escapeHtml(n.id)}</strong><br>Risk: ${n.risk ?? 0}%<br>Type: ${escapeHtml(n.type || "-")}`;
      tooltip.classList.add("show");
    });
    g.addEventListener("mousemove", (e) => {
      const svgRect = svg.getBoundingClientRect();
      tooltip.style.left = e.clientX - svgRect.left + 14 + "px";
      tooltip.style.top = e.clientY - svgRect.top - 10 + "px";
    });
    g.addEventListener("mouseleave", () => tooltip.classList.remove("show"));

    // Click to explore
    g.addEventListener("dblclick", () => {
      document.getElementById("graph-account-id").value = n.id;
      loadSubgraph();
    });

    // Drag
    let dragging = false;
    g.addEventListener("mousedown", (e) => {
      dragging = true;
      n.fx = n.x;
      n.fy = n.y;
      e.preventDefault();
    });

    gRoot.appendChild(g);
    return { el: g, data: n };
  });

  // Glow filter for high-risk nodes
  const filter = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "filter",
  );
  filter.setAttribute("id", "glow");
  const blur = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "feGaussianBlur",
  );
  blur.setAttribute("stdDeviation", "3");
  blur.setAttribute("result", "blur");
  const merge = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "feMerge",
  );
  const mn1 = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "feMergeNode",
  );
  mn1.setAttribute("in", "blur");
  const mn2 = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "feMergeNode",
  );
  mn2.setAttribute("in", "SourceGraphic");
  merge.appendChild(mn1);
  merge.appendChild(mn2);
  filter.appendChild(blur);
  filter.appendChild(merge);
  defs.appendChild(filter);

  // ── Zoom & Pan ──────────────────────
  let viewTransform = { x: 0, y: 0, k: 1 };
  let isPanning = false,
    panStart = { x: 0, y: 0 };

  function applyTransform() {
    gRoot.setAttribute(
      "transform",
      `translate(${viewTransform.x},${viewTransform.y}) scale(${viewTransform.k})`,
    );
  }

  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      const factor = 1 + dir * 0.1;
      const newK = Math.max(0.2, Math.min(5, viewTransform.k * factor));
      const svgRect = svg.getBoundingClientRect();
      const mx = e.clientX - svgRect.left;
      const my = e.clientY - svgRect.top;
      viewTransform.x = mx - (mx - viewTransform.x) * (newK / viewTransform.k);
      viewTransform.y = my - (my - viewTransform.y) * (newK / viewTransform.k);
      viewTransform.k = newK;
      applyTransform();
    },
    { passive: false },
  );

  svg.addEventListener("mousedown", (e) => {
    if (e.target === svg || e.target === gRoot) {
      isPanning = true;
      panStart = {
        x: e.clientX - viewTransform.x,
        y: e.clientY - viewTransform.y,
      };
      svg.style.cursor = "grabbing";
    }
  });

  // ── Drag & Pan mouse handlers ───────
  let dragNode = null;
  svg.addEventListener("mousemove", (e) => {
    // Node drag
    if (dragNode) {
      const svgRect = svg.getBoundingClientRect();
      dragNode.fx =
        (e.clientX - svgRect.left - viewTransform.x) / viewTransform.k;
      dragNode.fy =
        (e.clientY - svgRect.top - viewTransform.y) / viewTransform.k;
      dragNode.x = dragNode.fx;
      dragNode.y = dragNode.fy;
      return;
    }
    // Pan
    if (isPanning) {
      viewTransform.x = e.clientX - panStart.x;
      viewTransform.y = e.clientY - panStart.y;
      applyTransform();
    }
  });

  svg.addEventListener("mouseup", () => {
    if (dragNode) {
      dragNode.fx = null;
      dragNode.fy = null;
      dragNode = null;
    }
    isPanning = false;
    svg.style.cursor = "";
  });
  svg.addEventListener("mouseleave", () => {
    if (dragNode) {
      dragNode.fx = null;
      dragNode.fy = null;
      dragNode = null;
    }
    isPanning = false;
  });

  // Wire up drag per node
  nodeEls.forEach((ne) => {
    ne.el.addEventListener("mousedown", (e) => {
      dragNode = ne.data;
      dragNode.fx = ne.data.x;
      dragNode.fy = ne.data.y;
      e.stopPropagation();
      e.preventDefault();
    });
  });

  // ── Force Simulation (simple custom) ──
  const SIM_ITERATIONS = 300;
  const LINK_DIST = 120;
  const REPULSION = 3000;
  const CENTER_STRENGTH = 0.01;
  const DAMPING = 0.92;

  function tick() {
    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i],
          b = nodes[j];
        let dx = b.x - a.x,
          dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = REPULSION / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (!a.fx) {
          a.vx -= fx;
          a.vy -= fy;
        }
        if (!b.fx) {
          b.vx += fx;
          b.vy += fy;
        }
      }
    }
    // Link attraction
    resolvedLinks.forEach((l) => {
      let dx = l.target.x - l.source.x,
        dy = l.target.y - l.source.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - LINK_DIST) * 0.005;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      if (!l.source.fx) {
        l.source.vx += fx;
        l.source.vy += fy;
      }
      if (!l.target.fx) {
        l.target.vx -= fx;
        l.target.vy -= fy;
      }
    });
    // Center gravity
    nodes.forEach((n) => {
      if (n.fx) {
        n.x = n.fx;
        n.y = n.fy;
        return;
      }
      n.vx += (W / 2 - n.x) * CENTER_STRENGTH;
      n.vy += (H / 2 - n.y) * CENTER_STRENGTH;
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x += n.vx;
      n.y += n.vy;
    });
  }

  function updatePositions() {
    nodeEls.forEach((ne) => {
      ne.el.setAttribute("transform", `translate(${ne.data.x},${ne.data.y})`);
    });
    linkEls.forEach((le) => {
      const s = le.data.source,
        t = le.data.target;
      // Shorten line to stop at node edge (arrow tip)
      const dx = t.x - s.x,
        dy = t.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const rTarget = nodeRadius(t.risk || 0);
      const rSource = nodeRadius(s.risk || 0);
      const offsetT = (rTarget + 6) / dist;
      const offsetS = (rSource + 2) / dist;
      le.el.setAttribute("x1", s.x + dx * offsetS);
      le.el.setAttribute("y1", s.y + dy * offsetS);
      le.el.setAttribute("x2", t.x - dx * offsetT);
      le.el.setAttribute("y2", t.y - dy * offsetT);
    });
    edgeLabelEls.forEach((le) => {
      const s = le.data.source,
        t = le.data.target;
      le.el.setAttribute("x", (s.x + t.x) / 2);
      le.el.setAttribute("y", (s.y + t.y) / 2 - 5);
    });
  }

  // Run initial simulation
  for (let i = 0; i < SIM_ITERATIONS; i++) tick();
  updatePositions();

  // Continuous animation for drag
  let animId = null;
  function animate() {
    tick();
    updatePositions();
    animId = requestAnimationFrame(animate);
  }
  animate();

  graphSim = {
    stop() {
      if (animId) cancelAnimationFrame(animId);
    },
  };
}

// ── Analytics ────────────────────────────────────────
let riskDistChart = null,
  patternFreqChart = null,
  trendChart = null;

async function loadAnalytics() {
  try {
    const d = await apiFetch("/analytics");

    // Risk distribution (doughnut)
    if (d.risk_distribution) {
      const ctx = document.getElementById("riskDistChart").getContext("2d");
      if (riskDistChart) riskDistChart.destroy();
      const labels = Object.keys(d.risk_distribution);
      const values = Object.values(d.risk_distribution);
      riskDistChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: ["#00b894", "#feca57", "#ff6b6b", "#ff4757"],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: "#e4e6ef" } } },
        },
      });
    }

    // Pattern frequency (bar)
    if (d.pattern_frequency) {
      const ctx = document.getElementById("patternFreqChart").getContext("2d");
      if (patternFreqChart) patternFreqChart.destroy();
      patternFreqChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: Object.keys(d.pattern_frequency),
          datasets: [
            {
              label: "Count",
              data: Object.values(d.pattern_frequency),
              backgroundColor: "#6c5ce7",
            },
          ],
        },
        options: chartOpts("Patterns"),
      });
    }

    // Trends (line)
    if (d.transaction_trends) {
      const t = d.transaction_trends;
      const ctx = document.getElementById("trendChart").getContext("2d");
      if (trendChart) trendChart.destroy();
      trendChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: t.labels || t.dates,
          datasets: [
            {
              label: "Volume",
              data: t.values || t.volumes,
              borderColor: "#00cec9",
              backgroundColor: "rgba(0,206,201,0.1)",
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: chartOpts("Volume"),
      });
    }
  } catch (e) {
    console.error("Analytics error:", e);
  }
}

function chartOpts(yLabel) {
  return {
    responsive: true,
    plugins: { legend: { labels: { color: "#e4e6ef" } } },
    scales: {
      x: { ticks: { color: "#7a7f9a" }, grid: { color: "#2a2d3a" } },
      y: {
        ticks: { color: "#7a7f9a" },
        grid: { color: "#2a2d3a" },
        title: { display: true, text: yLabel, color: "#7a7f9a" },
      },
    },
  };
}

// ── Reports ──────────────────────────────────────────
async function loadReportsList() {
  const box = document.getElementById("reports-list");
  try {
    const data = await apiFetch("/reports/");
    if (!data.length) {
      box.innerHTML = '<p class="muted">No reports yet.</p>';
      return;
    }
    let html =
      "<table><thead><tr><th>ID</th><th>Title</th><th>Type</th><th>Date</th><th>Status</th></tr></thead><tbody>";
    data.forEach((r) => {
      html += `<tr>
        <td>${escapeHtml(r.id || "")}</td>
        <td>${escapeHtml(r.title || "")}</td>
        <td>${escapeHtml(r.type || "")}</td>
        <td>${escapeHtml(r.date || "")}</td>
        <td>${escapeHtml(r.status || "")}</td>
      </tr>`;
    });
    html += "</tbody></table>";
    box.innerHTML = html;
  } catch (e) {
    box.innerHTML = `<p class="muted">Could not load reports.</p>`;
  }
}

async function generateReport() {
  const id = document.getElementById("report-account-id").value.trim();
  if (!id) return;
  const includeGraph = document.getElementById("report-include-graph").checked;
  const box = document.getElementById("report-generated");
  box.textContent = "Generating report...";
  try {
    const d = await apiFetch("/reports/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_id: id, include_graph: includeGraph }),
    });
    box.innerHTML = `
      <strong>Report ID:</strong> ${escapeHtml(d.report_id || "-")}<br>
      <strong>Account:</strong> ${escapeHtml(d.account_id || "-")}<br>
      <strong>Risk Score:</strong> ${fmt(d.risk_score)}<br>
      <strong>Status:</strong> ${escapeHtml(d.status || "-")}<br>
      <hr style="border-color:var(--border);margin:0.5rem 0">
      <pre style="white-space:pre-wrap">${escapeHtml(d.report_text || "")}</pre>
    `;
    loadReportsList();
  } catch (e) {
    box.textContent = "Error: " + e.message;
  }
}

// ── Timeline ─────────────────────────────────────────
async function loadTimeline() {
  const id = document.getElementById("timeline-account-id").value.trim();
  if (!id) return;
  const box = document.getElementById("timeline-content");
  box.innerHTML = '<p class="muted">Loading...</p>';
  try {
    const data = await apiFetch("/timeline/" + encodeURIComponent(id));
    if (!data.length) {
      box.innerHTML = '<p class="muted">No events found.</p>';
      return;
    }
    let html = '<div class="timeline">';
    data.forEach((ev) => {
      const isSusp =
        (ev.status || "").toLowerCase().includes("suspicious") ||
        (ev.type || "").toLowerCase().includes("suspicious");
      html += `<div class="tl-item ${isSusp ? "suspicious" : ""}">
        <div class="tl-time">${escapeHtml(ev.date || "")} ${escapeHtml(ev.time || "")}</div>
        <div class="tl-title">${escapeHtml(ev.title || ev.type || "")}</div>
        <div class="tl-desc">${escapeHtml(ev.description || "")} ${ev.amount ? "₹" + fmt(ev.amount) : ""}</div>
      </div>`;
    });
    html += "</div>";
    box.innerHTML = html;
  } catch (e) {
    box.innerHTML = `<p class="muted" style="color:var(--danger)">Error: ${escapeHtml(e.message)}</p>`;
  }
}

// ── Model Info ───────────────────────────────────────
async function loadModelInfo() {
  try {
    const [model, metrics] = await Promise.all([
      apiFetch("/model/info"),
      apiFetch("/metrics"),
    ]);

    let html = '<dl class="info-grid">';
    const fields = [
      "model_type",
      "version",
      "num_layers",
      "input_features",
      "fraud_threshold",
      "training_epochs",
      "last_trained",
      "accuracy",
      "precision",
      "recall",
      "f1_score",
    ];
    fields.forEach((f) => {
      if (model[f] != null)
        html += `<dt>${f.replace(/_/g, " ")}</dt><dd>${fmt(model[f])}</dd>`;
    });
    html += "</dl>";
    document.getElementById("model-info-content").innerHTML = html;

    let mhtml = '<dl class="info-grid">';
    Object.entries(metrics).forEach(([k, v]) => {
      mhtml += `<dt>${k.replace(/_/g, " ")}</dt><dd>${fmt(v)}</dd>`;
    });
    mhtml += "</dl>";
    document.getElementById("metrics-content").innerHTML = mhtml;
  } catch (e) {
    document.getElementById("model-info-content").innerHTML =
      '<p class="muted">Could not load model info.</p>';
  }
}

// ── Upload ───────────────────────────────────────────
async function uploadCSV() {
  const fileInput = document.getElementById("csv-file");
  if (!fileInput.files.length) return;
  const box = document.getElementById("upload-result");
  box.textContent = "Uploading...";
  const form = new FormData();
  form.append("file", fileInput.files[0]);
  try {
    const d = await apiFetch("/upload/csv", { method: "POST", body: form });
    box.innerHTML = `
      <strong>Status:</strong> ${escapeHtml(d.status || "OK")}<br>
      <strong>File:</strong> ${escapeHtml(d.filename || "-")}<br>
      <strong>Rows:</strong> ${fmt(d.rows)}<br>
      <strong>Accounts:</strong> ${fmt(d.accounts)}<br>
      <strong>Edges:</strong> ${fmt(d.edges)}
    `;
    dataLoaded = true;
    document.getElementById("upload-overlay").classList.add("hidden");
    loadUploadStatus();
    checkHealth();
  } catch (e) {
    box.textContent = "Error: " + e.message;
  }
}

async function loadUploadStatus() {
  try {
    const d = await apiFetch("/upload/status");
    let html = '<dl class="info-grid">';
    html += `<dt>Loaded</dt><dd>${d.loaded ? "Yes" : "No"}</dd>`;
    html += `<dt>Rows</dt><dd>${fmt(d.rows)}</dd>`;
    html += `<dt>Accounts</dt><dd>${fmt(d.accounts)}</dd>`;
    html += `<dt>Edges</dt><dd>${fmt(d.edges)}</dd>`;
    if (d.columns)
      html += `<dt>Columns</dt><dd>${(d.columns || []).map(escapeHtml).join(", ")}</dd>`;
    html += "</dl>";
    document.getElementById("upload-status").innerHTML = html;
  } catch {
    document.getElementById("upload-status").innerHTML =
      '<p class="muted">No dataset info available.</p>';
  }
}

// ── Upload Overlay ───────────────────────────────────
let dataLoaded = false;

async function checkDataLoaded() {
  try {
    const d = await apiFetch("/upload/status");
    dataLoaded = d.loaded && d.rows > 0;
  } catch {
    dataLoaded = false;
  }
  const overlay = document.getElementById("upload-overlay");
  if (dataLoaded) {
    overlay.classList.add("hidden");
  } else {
    overlay.classList.remove("hidden");
  }
  return dataLoaded;
}

async function overlayUpload() {
  const fileInput = document.getElementById("overlay-csv-file");
  if (!fileInput.files.length) return;
  const progress = document.getElementById("overlay-progress");
  const fill = document.getElementById("overlay-progress-fill");
  const pText = document.getElementById("overlay-progress-text");
  const errBox = document.getElementById("overlay-error");
  errBox.textContent = "";
  progress.style.display = "";
  fill.style.width = "20%";
  pText.textContent = "Uploading CSV...";

  const form = new FormData();
  form.append("file", fileInput.files[0]);
  try {
    fill.style.width = "50%";
    pText.textContent = "Processing data & training model...";
    const d = await apiFetch("/upload/csv", { method: "POST", body: form });
    fill.style.width = "100%";
    pText.textContent = `Done! ${d.rows} transactions, ${d.accounts} accounts loaded.`;
    dataLoaded = true;
    // Also sync the Upload page status
    document.getElementById("csv-file").value = "";
    setTimeout(async () => {
      document.getElementById("upload-overlay").classList.add("hidden");
      await checkHealth();
      loadDashboard();
    }, 800);
  } catch (e) {
    fill.style.width = "0%";
    progress.style.display = "none";
    errBox.textContent = "Upload failed: " + e.message;
  }
}

// ── Init ─────────────────────────────────────────────
(async function init() {
  await checkHealth();
  const hasData = await checkDataLoaded();
  if (hasData) {
    loadDashboard();
  }
  setInterval(checkHealth, 30000);
})();
