/* Accounts page */
async function loadAccounts() {
  const box = document.getElementById("accounts-table");
  box.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const search = document.getElementById("acc-search").value.trim();
    const status = document.getElementById("acc-status-filter").value;
    let url = "/accounts/?limit=50";
    if (search) url += "&search=" + encodeURIComponent(search);
    if (status) url += "&status=" + encodeURIComponent(status);
    const data = await apiFetch(url);
    if (!data.length) {
      box.innerHTML = '<p class="muted">No accounts found.</p>';
      return;
    }
    let html = `<table><thead><tr>
      <th>Account</th><th>Risk Score</th><th>Pattern</th><th>Status</th><th>Volume 30d</th><th>Tx Count</th><th>Actions</th>
    </tr></thead><tbody>`;
    data.forEach((a) => {
      html += `<tr>
        <td><strong>${escapeHtml(a.account_id)}</strong></td>
        <td>
          <div class="risk-meter">
            <span>${a.risk_score.toFixed(1)}</span>
            <div class="risk-bar-bg"><div class="risk-bar-fill" style="width:${a.risk_score}%;background:${riskColor(a.risk_score)}"></div></div>
          </div>
        </td>
        <td>${escapeHtml(a.pattern_detected || "—")}</td>
        <td>${risklevelBadge(a.status)}</td>
        <td>₹${fmt(a.volume_30d)}</td>
        <td>${a.transaction_count}</td>
        <td>
          <button class="btn btn-primary" style="padding:0.25rem 0.5rem;font-size:0.72rem" onclick="quickPredict('${escapeHtml(a.account_id)}')">Predict</button>
          <button class="btn btn-outline" style="padding:0.25rem 0.5rem;font-size:0.72rem" onclick="quickExplain('${escapeHtml(a.account_id)}')">Explain</button>
        </td>
      </tr>`;
    });
    box.innerHTML = html + "</tbody></table>";
  } catch (e) {
    box.innerHTML = `<p class="muted" style="color:var(--red)">Error: ${escapeHtml(e.message)}</p>`;
  }
}

function quickPredict(accountId) {
  location.hash = "#predictions";
  // Wait for page load then fill in account
  setTimeout(() => {
    const el = document.getElementById("predict-account-id");
    if (el) { el.value = accountId; singlePredict(); }
  }, 100);
}

function quickExplain(accountId) {
  location.hash = "#predictions";
  setTimeout(async () => {
    const box = document.getElementById("predict-result");
    if (!box) return;
    box.innerHTML = '<p class="muted">Loading explanation…</p>';
    try {
      const d = await apiFetch("/explain/" + encodeURIComponent(accountId));
      let html = `<div class="detail-box">
        <strong>Account:</strong> ${escapeHtml(d.account_id)}<br>
        <strong>Risk Score:</strong> ${d.risk_score?.toFixed(1)}%<br>
        <strong>Recommendation:</strong> ${escapeHtml(d.recommendation)}<br><br>
        <strong>Risk Factors:</strong><br>`;
      (d.risk_factors || []).forEach((f) => {
        html += `• <strong>${escapeHtml(f.factor || f.name || "")}</strong>: ${escapeHtml(f.description || f.detail || JSON.stringify(f))}<br>`;
      });
      html += "<br><strong>Suspicious Edges:</strong><br>";
      (d.top_suspicious_edges || []).forEach((e) => {
        html += `• ${escapeHtml(e.source || e.from)} → ${escapeHtml(e.target || e.to)}: ₹${fmt(e.amount || e.total_amount)}<br>`;
      });
      html += "</div>";
      box.innerHTML = html;
    } catch (e) {
      box.innerHTML = `<p class="muted" style="color:var(--red)">Error: ${escapeHtml(e.message)}</p>`;
    }
  }, 100);
}
