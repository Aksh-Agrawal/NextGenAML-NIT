/* Upload page */
async function loadUploadStatus() {
  const box = document.getElementById("upload-status");
  try {
    const d = await apiFetch("/upload/status");
    if (!d.loaded) {
      box.innerHTML = '<p class="muted">No dataset loaded. Upload a CSV file to begin.</p>';
      return;
    }
    box.innerHTML = `
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Status</span><span class="info-value">${risklevelBadge("Verified")}</span></div>
        <div class="info-item"><span class="info-label">Transactions</span><span class="info-value">${fmt(d.rows)}</span></div>
        <div class="info-item"><span class="info-label">Accounts</span><span class="info-value">${fmt(d.accounts)}</span></div>
        <div class="info-item"><span class="info-label">Edges</span><span class="info-value">${fmt(d.edges)}</span></div>
        ${d.columns ? `<div class="info-item" style="grid-column:1/-1"><span class="info-label">Columns</span><span class="info-value">${d.columns.join(", ")}</span></div>` : ""}
      </div>`;
  } catch (e) {
    box.innerHTML = `<p class="muted" style="color:var(--red)">Error: ${escapeHtml(e.message)}</p>`;
  }
}

function initUploadPage() {
  setupUpload(
    "upload-drop-zone",
    "upload-file-input",
    "upload-progress",
    "upload-progress-fill",
    "upload-progress-text",
    () => {
      checkHealth();
      loadUploadStatus();
    },
  );
  loadUploadStatus();
}
