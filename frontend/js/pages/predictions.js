/* Predictions page */
async function singlePredict() {
  const accountId = document.getElementById("predict-account-id").value.trim();
  if (!accountId) return;
  const box = document.getElementById("predict-result");
  box.innerHTML = '<p class="muted">Analyzing…</p>';
  try {
    const d = await apiFetch("/predict?account_id=" + encodeURIComponent(accountId), { method: "POST" });
    box.innerHTML = `<div class="detail-box">
      <strong>Account:</strong> ${escapeHtml(d.account_id)}<br>
      <strong>Fraud Probability:</strong> <span style="color:${riskColor(d.fraud_probability * 100)}">${(d.fraud_probability * 100).toFixed(2)}%</span><br>
      <strong>Risk Level:</strong> ${risklevelBadge(d.risk_level)}<br>
      <strong>Confidence:</strong> ${(d.confidence * 100).toFixed(1)}%
    </div>`;
  } catch (e) {
    box.innerHTML = `<p class="muted" style="color:var(--red)">Error: ${escapeHtml(e.message)}</p>`;
  }
}

async function batchPredict() {
  const ids = document.getElementById("batch-account-ids").value.split(",").map((s) => s.trim()).filter(Boolean);
  if (!ids.length) return;
  const box = document.getElementById("batch-result");
  box.innerHTML = '<p class="muted">Processing batch…</p>';
  try {
    const data = await apiFetch("/predict/batch", {
      method: "POST",
      body: JSON.stringify({ account_ids: ids }),
    });
    let html = `<table><thead><tr><th>Account</th><th>Fraud Prob</th><th>Risk Level</th><th>Confidence</th></tr></thead><tbody>`;
    data.forEach((d) => {
      html += `<tr>
        <td>${escapeHtml(d.account_id)}</td>
        <td style="color:${riskColor(d.fraud_probability * 100)}">${(d.fraud_probability * 100).toFixed(2)}%</td>
        <td>${risklevelBadge(d.risk_level)}</td>
        <td>${(d.confidence * 100).toFixed(1)}%</td>
      </tr>`;
    });
    box.innerHTML = html + "</tbody></table>";
  } catch (e) {
    box.innerHTML = `<p class="muted" style="color:var(--red)">Error: ${escapeHtml(e.message)}</p>`;
  }
}

async function monitorTransaction() {
  const sender = document.getElementById("mon-sender").value.trim();
  const receiver = document.getElementById("mon-receiver").value.trim();
  const amount = parseFloat(document.getElementById("mon-amount").value);
  const txType = document.getElementById("mon-type").value.trim() || "wire_transfer";
  if (!sender || !receiver || isNaN(amount)) return;

  const box = document.getElementById("monitor-result");
  box.innerHTML = '<p class="muted">Monitoring…</p>';
  try {
    const d = await apiFetch("/monitor/transaction", {
      method: "POST",
      body: JSON.stringify({
        sender_account: sender,
        receiver_account: receiver,
        amount,
        transaction_type: txType,
      }),
    });
    box.innerHTML = `<div class="detail-box">
      <strong>Transaction ID:</strong> ${escapeHtml(d.transaction_id)}<br>
      <strong>Status:</strong> ${risklevelBadge(d.status)}<br>
      <strong>Risk Score:</strong> <span style="color:${riskColor(d.risk_score)}">${d.risk_score?.toFixed(1)}%</span><br>
      <strong>Flags:</strong> ${(d.flags || []).map((f) => escapeHtml(f)).join(", ") || "None"}
    </div>`;
  } catch (e) {
    box.innerHTML = `<p class="muted" style="color:var(--red)">Error: ${escapeHtml(e.message)}</p>`;
  }
}
