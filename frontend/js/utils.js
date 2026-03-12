/* ══════════════════════════════════════════════════════
   NextGenAML — Shared Utilities
   ══════════════════════════════════════════════════════ */

const API = "";

async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

function fmt(n) {
  if (n == null) return "—";
  const num = Number(n);
  if (isNaN(num)) return String(n);
  if (Math.abs(num) >= 1e7) return (num / 1e7).toFixed(2) + " Cr";
  if (Math.abs(num) >= 1e5) return (num / 1e5).toFixed(2) + " L";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K";
  if (Number.isInteger(num)) return num.toLocaleString("en-IN");
  return num.toFixed(2);
}

function risklevelBadge(level) {
  if (!level) return "";
  const cls = level.toLowerCase().replace(/\s+/g, "-");
  return `<span class="badge badge-${cls}">${escapeHtml(level)}</span>`;
}

function riskColor(score) {
  if (score >= 75) return "var(--red)";
  if (score >= 50) return "var(--orange)";
  if (score >= 30) return "var(--yellow)";
  return "var(--green)";
}

function chartOpts(yLabel) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "#8492a6", font: { size: 11, family: "Inter" } },
      },
    },
    scales: {
      x: {
        ticks: { color: "#5a6a85", font: { size: 10 } },
        grid: { color: "rgba(30,45,74,0.4)" },
      },
      y: {
        title: { display: !!yLabel, text: yLabel, color: "#8492a6" },
        ticks: { color: "#5a6a85", font: { size: 10 } },
        grid: { color: "rgba(30,45,74,0.4)" },
      },
    },
  };
}

function setupUpload(dropZoneId, inputId, progressId, fillId, textId, onSuccess) {
  const zone = document.getElementById(dropZoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;

  zone.addEventListener("click", () => input.click());
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("drag-over");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("drag-over");
    if (e.dataTransfer.files.length) uploadFile(e.dataTransfer.files[0]);
  });
  input.addEventListener("change", () => {
    if (input.files.length) uploadFile(input.files[0]);
  });

  async function uploadFile(file) {
    const prog = document.getElementById(progressId);
    const fill = document.getElementById(fillId);
    const text = document.getElementById(textId);
    prog.style.display = "block";
    fill.style.width = "20%";
    text.textContent = "Uploading " + file.name + "…";

    const formData = new FormData();
    formData.append("file", file);

    try {
      fill.style.width = "60%";
      const res = await fetch(API + "/upload/csv", {
        method: "POST",
        body: formData,
      });
      fill.style.width = "90%";
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Upload failed");
      }
      const data = await res.json();
      fill.style.width = "100%";
      text.textContent = `✓ Loaded ${data.rows} transactions, ${data.accounts} accounts`;
      if (onSuccess) onSuccess(data);
    } catch (e) {
      fill.style.width = "0%";
      text.textContent = "✗ " + e.message;
    }
  }
}
