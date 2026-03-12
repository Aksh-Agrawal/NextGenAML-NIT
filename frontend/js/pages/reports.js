/* Reports page */
async function generateReport() {
  const id = document.getElementById("report-account-id").value.trim();
  if (!id) return;
  const box = document.getElementById("report-result");
  box.innerHTML = '<p class="muted">Generating report…</p>';
  try {
    const d = await apiFetch("/reports/generate", {
      method: "POST",
      body: JSON.stringify({ account_id: id, include_graph: true }),
    });
    box.innerHTML = `<div class="detail-box">
      <strong>Report ID:</strong> ${escapeHtml(d.report_id)}<br>
      <strong>Account:</strong> ${escapeHtml(d.account_id)}<br>
      <strong>Risk Score:</strong> <span style="color:${riskColor(d.risk_score)}">${d.risk_score?.toFixed(1)}%</span><br>
      <strong>Status:</strong> ${risklevelBadge(d.status)}<br><br>
      <strong>Report:</strong><br>
      <pre style="white-space:pre-wrap;color:var(--text-muted);font-size:0.82rem;margin-top:0.5rem">${escapeHtml(d.report_text)}</pre>
    </div>`;
    loadReportsList();
  } catch (e) {
    box.innerHTML = `<p class="muted" style="color:var(--red)">Error: ${escapeHtml(e.message)}</p>`;
  }
}

async function loadReportsList() {
  const listBox = document.getElementById("reports-list");
  const statsBox = document.getElementById("report-stats");

  try {
    const [reports, stats] = await Promise.all([
      apiFetch("/reports/"),
      apiFetch("/reports/stats"),
    ]);

    statsBox.innerHTML = `
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Verified Reports</span><span class="info-value">${stats.verified_reports}</span></div>
        <div class="info-item"><span class="info-label">Generated (30d)</span><span class="info-value">${stats.generated_30d}</span></div>
        <div class="info-item"><span class="info-label">Awaiting Review</span><span class="info-value">${stats.awaiting_review}</span></div>
      </div>`;

    if (!reports.length) {
      listBox.innerHTML = '<p class="muted">No reports generated yet.</p>';
      return;
    }
    let html = `<table><thead><tr><th>ID</th><th>Title</th><th>Type</th><th>Date</th><th>Status</th></tr></thead><tbody>`;
    reports.forEach((r) => {
      html += `<tr>
        <td>${escapeHtml(r.id)}</td>
        <td>${escapeHtml(r.title)}</td>
        <td>${escapeHtml(r.type)}</td>
        <td>${escapeHtml(r.date)}</td>
        <td>${risklevelBadge(r.status)}</td>
      </tr>`;
    });
    listBox.innerHTML = html + "</tbody></table>";
  } catch (e) {
    listBox.innerHTML = `<p class="muted" style="color:var(--red)">Error: ${escapeHtml(e.message)}</p>`;
  }
}
