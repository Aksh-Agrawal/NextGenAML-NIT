/* Alerts page */
async function loadAlerts() {
  const minRisk = parseInt(document.getElementById("alert-min-risk").value) / 100;
  const limit = parseInt(document.getElementById("alert-limit").value);
  const box = document.getElementById("alerts-table");
  box.innerHTML = '<p class="muted">Generating alerts…</p>';
  try {
    const data = await apiFetch("/alert", {
      method: "POST",
      body: JSON.stringify({ min_risk: minRisk, limit }),
    });
    if (!data.length) {
      box.innerHTML = '<p class="muted">No alerts at this threshold.</p>';
      return;
    }
    let html = `<table><thead><tr><th>Account</th><th>Risk Score</th><th>Pattern</th><th>Status</th><th>Volume</th></tr></thead><tbody>`;
    data.forEach((a) => {
      html += `<tr>
        <td><strong>${escapeHtml(a.account_id)}</strong></td>
        <td>
          <div class="risk-meter">
            <span style="color:${riskColor(a.risk_score)}">${a.risk_score?.toFixed(1)}</span>
            <div class="risk-bar-bg"><div class="risk-bar-fill" style="width:${a.risk_score}%;background:${riskColor(a.risk_score)}"></div></div>
          </div>
        </td>
        <td>${escapeHtml(a.pattern_detected || "—")}</td>
        <td>${risklevelBadge(a.status)}</td>
        <td>₹${fmt(a.volume_30d)}</td>
      </tr>`;
    });
    box.innerHTML = html + "</tbody></table>";
  } catch (e) {
    box.innerHTML = `<p class="muted" style="color:var(--red)">Error: ${escapeHtml(e.message)}</p>`;
  }
}
