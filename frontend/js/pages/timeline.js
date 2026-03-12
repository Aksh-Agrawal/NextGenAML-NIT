/* Timeline page */
async function loadTimeline() {
  const id = document.getElementById("timeline-account-id").value.trim();
  if (!id) return;
  const box = document.getElementById("timeline-content");
  box.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const data = await apiFetch("/timeline/" + encodeURIComponent(id));
    if (!data.length) {
      box.innerHTML = '<p class="muted">No transactions found for this account.</p>';
      return;
    }
    let html = '<div class="timeline">';
    data.forEach((e) => {
      const isSus = e.status === "suspicious" || e.status === "flagged";
      html += `
        <div class="timeline-item ${isSus ? "suspicious" : ""}">
          <div class="timeline-date">${escapeHtml(e.date || e.time || "")}</div>
          <div class="timeline-title">${escapeHtml(e.title || e.type || "Transaction")}</div>
          <div class="timeline-desc">
            ${escapeHtml(e.description || "")}
            ${e.amount ? ` — <span class="timeline-amount">₹${fmt(e.amount)}</span>` : ""}
          </div>
        </div>`;
    });
    html += "</div>";
    box.innerHTML = html;
  } catch (e) {
    box.innerHTML = `<p class="muted" style="color:var(--red)">Error: ${escapeHtml(e.message)}</p>`;
  }
}
