/* Analytics page */
let riskDistChart = null, patternFreqChart = null, analyticsTrendChart = null;

async function loadAnalytics() {
  try {
    const d = await apiFetch("/analytics");

    // Risk distribution (doughnut)
    if (d.risk_distribution) {
      const labels = Object.keys(d.risk_distribution);
      const values = Object.values(d.risk_distribution);
      const colors = ["#10b981", "#eab308", "#f59e0b", "#ef4444"];
      const ctx = document.getElementById("riskDistChart").getContext("2d");
      if (riskDistChart) riskDistChart.destroy();
      riskDistChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels,
          datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#8492a6", font: { size: 11 } },
            },
          },
        },
      });
    }

    // Pattern frequency (bar)
    if (d.pattern_frequency) {
      const labels = Object.keys(d.pattern_frequency);
      const values = Object.values(d.pattern_frequency);
      const ctx = document.getElementById("patternFreqChart").getContext("2d");
      if (patternFreqChart) patternFreqChart.destroy();
      patternFreqChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Count",
            data: values,
            backgroundColor: "rgba(168,85,247,0.5)",
            borderColor: "#a855f7",
            borderWidth: 1,
            borderRadius: 6,
          }],
        },
        options: chartOpts("Count"),
      });
    }

    // Transaction trends (line)
    if (d.transaction_trends) {
      const labels = Object.keys(d.transaction_trends);
      const values = Object.values(d.transaction_trends);
      const ctx = document.getElementById("analyticsTrendChart").getContext("2d");
      if (analyticsTrendChart) analyticsTrendChart.destroy();
      analyticsTrendChart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Volume",
            data: values,
            borderColor: "#6366f1",
            backgroundColor: "rgba(99,102,241,0.1)",
            fill: true,
            tension: 0.4,
          }],
        },
        options: chartOpts("Volume (₹)"),
      });
    }

    // Volume summary
    const volBox = document.getElementById("analytics-volume-summary");
    volBox.innerHTML = `
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Total Volume</span><span class="info-value">₹${fmt(d.total_volume)}</span></div>
        <div class="info-item"><span class="info-label">Flagged Amount</span><span class="info-value" style="color:var(--red)">₹${fmt(d.flagged_amount)}</span></div>
      </div>`;

    // Flagged breakdown
    const flagBox = document.getElementById("analytics-flagged-summary");
    const pct = d.total_volume ? ((d.flagged_amount / d.total_volume) * 100).toFixed(1) : 0;
    flagBox.innerHTML = `
      <div style="text-align:center;padding:1rem 0">
        <div style="font-size:2.5rem;font-weight:700;color:var(--red)">${pct}%</div>
        <div style="color:var(--text-muted);font-size:0.85rem;margin-top:0.25rem">of total volume flagged as suspicious</div>
        <div class="risk-meter" style="margin-top:1rem;max-width:300px;margin-inline:auto">
          <div class="risk-bar-bg" style="height:8px"><div class="risk-bar-fill" style="width:${pct}%;background:var(--red);height:100%"></div></div>
        </div>
      </div>`;
  } catch (e) {
    document.getElementById("analytics-volume-summary").innerHTML =
      `<p class="muted" style="color:var(--red)">Error: ${escapeHtml(e.message)}</p>`;
  }
}
