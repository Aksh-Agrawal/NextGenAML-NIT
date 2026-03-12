/* Patterns page */
async function loadPatterns(type, btnEl) {
  if (btnEl) {
    btnEl.closest(".btn-group").querySelectorAll(".btn").forEach((b) => {
      b.classList.remove("btn-primary", "active");
      b.classList.add("btn-outline");
    });
    btnEl.classList.remove("btn-outline");
    btnEl.classList.add("btn-primary", "active");
  }

  document.getElementById("patterns-circular").style.display = "none";
  document.getElementById("patterns-structuring").style.display = "none";
  document.getElementById("patterns-dormant").style.display = "none";

  try {
    const data = await apiFetch("/patterns/" + type);
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
  if (!arr.length) { box.innerHTML = '<p class="muted">No circular patterns detected.</p>'; return; }
  let html = "<table><thead><tr><th>Cycle</th><th>Length</th><th>Total Flow</th></tr></thead><tbody>";
  arr.forEach((c) => {
    html += `<tr><td>${(c.account_chain || []).map(escapeHtml).join(" → ")}</td><td>${c.cycle_length}</td><td>₹${fmt(c.total_flow)}</td></tr>`;
  });
  box.innerHTML = html + "</tbody></table>";
}

function renderStructuring(arr) {
  const box = document.getElementById("structuring-table");
  if (!arr.length) { box.innerHTML = '<p class="muted">No structuring patterns detected.</p>'; return; }
  let html = "<table><thead><tr><th>Sender</th><th>Transactions</th><th>Total Amount</th><th>Avg Amount</th><th>Window (min)</th></tr></thead><tbody>";
  arr.forEach((s) => {
    html += `<tr><td>${escapeHtml(s.sender)}</td><td>${s.transactions}</td><td>₹${fmt(s.total_amount)}</td><td>₹${fmt(s.avg_amount)}</td><td>${fmt(s.time_window_minutes)}</td></tr>`;
  });
  box.innerHTML = html + "</tbody></table>";
}

function renderDormant(arr) {
  const box = document.getElementById("dormant-table");
  if (!arr.length) { box.innerHTML = '<p class="muted">No dormant activations detected.</p>'; return; }
  let html = "<table><thead><tr><th>Account</th><th>Dormant Days</th><th>Activation Amount</th><th>Date</th></tr></thead><tbody>";
  arr.forEach((d) => {
    html += `<tr><td>${escapeHtml(d.account_id)}</td><td>${d.dormant_days}</td><td>₹${fmt(d.activation_amount)}</td><td>${escapeHtml(d.activation_date)}</td></tr>`;
  });
  box.innerHTML = html + "</tbody></table>";
}
