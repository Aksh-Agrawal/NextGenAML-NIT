/* Dashboard page */
let dashTrendChart = null;

async function loadDashboard() {
  try {
    const d = await apiFetch("/dashboard");
    document.getElementById("kpi-transactions").textContent = fmt(d.total_transactions);
    document.getElementById("kpi-volume").textContent = "₹" + fmt(d.total_volume);
    document.getElementById("kpi-flagged").textContent = "₹" + fmt(d.flagged_amount);
    document.getElementById("kpi-highrisk").textContent = fmt(d.high_risk_entities);
    document.getElementById("kpi-active-cases").textContent = fmt(d.active_cases);
    document.getElementById("kpi-risk-score").textContent =
      d.system_risk_score != null ? d.system_risk_score.toFixed(1) + "%" : "—";

    // Recent activity
    const box = document.getElementById("recent-activity");
    if (d.recent_activity && d.recent_activity.length) {
      let html = "<table><thead><tr><th>Sender</th><th>Receiver</th><th>Amount</th><th>Pattern</th><th>Time</th></tr></thead><tbody>";
      d.recent_activity.forEach((a) => {
        html += `<tr>
          <td>${escapeHtml(a.sender)}</td>
          <td>${escapeHtml(a.receiver)}</td>
          <td>₹${fmt(a.amount)}</td>
          <td><span class="badge badge-flagged">${escapeHtml(a.pattern || "—")}</span></td>
          <td>${escapeHtml(a.timestamp)}</td>
        </tr>`;
      });
      box.innerHTML = html + "</tbody></table>";
    } else {
      box.innerHTML = '<p class="muted">No recent activity.</p>';
    }

    // Trends chart
    if (d.trends && Object.keys(d.trends).length) {
      const labels = Object.keys(d.trends);
      const values = Object.values(d.trends);
      const ctx = document.getElementById("dashTrendChart").getContext("2d");
      if (dashTrendChart) dashTrendChart.destroy();
      dashTrendChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Volume (₹)",
            data: values,
            backgroundColor: "rgba(99, 102, 241, 0.5)",
            borderColor: "#6366f1",
            borderWidth: 1,
            borderRadius: 6,
          }],
        },
        options: chartOpts("Volume (₹)"),
      });
    }
  } catch (e) {
    document.getElementById("kpi-transactions").textContent = "Error";
  }
}
