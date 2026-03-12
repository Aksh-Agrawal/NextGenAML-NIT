/* Settings page */
function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.style.setProperty("--bg", "#f0f2f5");
    document.documentElement.style.setProperty("--bg-surface", "#ffffff");
    document.documentElement.style.setProperty("--bg-card", "#ffffff");
    document.documentElement.style.setProperty("--bg-card-hover", "#f8f9fa");
    document.documentElement.style.setProperty("--bg-input", "#f0f2f5");
    document.documentElement.style.setProperty("--border", "#e0e0e0");
    document.documentElement.style.setProperty("--border-light", "#d0d0d0");
    document.documentElement.style.setProperty("--text", "#1a1a2e");
    document.documentElement.style.setProperty("--text-muted", "#5a6a85");
    document.documentElement.style.setProperty("--text-dim", "#8492a6");
    document.documentElement.style.setProperty("--shadow", "0 4px 24px rgba(0,0,0,0.08)");
    document.documentElement.style.setProperty("--shadow-sm", "0 2px 8px rgba(0,0,0,0.05)");
  } else {
    document.documentElement.style.setProperty("--bg", "#0a0e1a");
    document.documentElement.style.setProperty("--bg-surface", "#111827");
    document.documentElement.style.setProperty("--bg-card", "#1a2236");
    document.documentElement.style.setProperty("--bg-card-hover", "#1f2a42");
    document.documentElement.style.setProperty("--bg-input", "#0f1724");
    document.documentElement.style.setProperty("--border", "#1e2d4a");
    document.documentElement.style.setProperty("--border-light", "#2a3a5c");
    document.documentElement.style.setProperty("--text", "#e2e8f0");
    document.documentElement.style.setProperty("--text-muted", "#8492a6");
    document.documentElement.style.setProperty("--text-dim", "#5a6a85");
    document.documentElement.style.setProperty("--shadow", "0 4px 24px rgba(0,0,0,0.3)");
    document.documentElement.style.setProperty("--shadow-sm", "0 2px 8px rgba(0,0,0,0.2)");
  }
  localStorage.setItem("aml-theme", theme);
}

function setAccentColor(color, btn) {
  document.documentElement.style.setProperty("--accent", color);
  document.documentElement.style.setProperty("--accent-hover", color + "cc");
  document.documentElement.style.setProperty("--accent-glow", color + "26");
  document.querySelectorAll(".color-swatch").forEach((s) => s.classList.remove("active"));
  if (btn) btn.classList.add("active");
  localStorage.setItem("aml-accent", color);
}

function toggleAutoRefresh(enabled) {
  localStorage.setItem("aml-autorefresh", enabled);
}

function setRefreshInterval(seconds) {
  localStorage.setItem("aml-refresh-interval", seconds);
}

function setDefaultGraphLimit(limit) {
  localStorage.setItem("aml-graph-limit", limit);
}

function setDefaultAlertThreshold(threshold) {
  localStorage.setItem("aml-alert-threshold", threshold);
}

function initSettingsPage() {
  // Restore saved settings into UI
  const theme = localStorage.getItem("aml-theme") || "dark";
  const accent = localStorage.getItem("aml-accent");
  const autoRefresh = localStorage.getItem("aml-autorefresh");
  const refreshInterval = localStorage.getItem("aml-refresh-interval");
  const graphLimit = localStorage.getItem("aml-graph-limit");
  const alertThreshold = localStorage.getItem("aml-alert-threshold");

  const themeEl = document.getElementById("setting-theme");
  if (themeEl) themeEl.value = theme;

  if (accent) {
    const swatch = document.querySelector(`.color-swatch[data-color="${accent}"]`);
    if (swatch) {
      document.querySelectorAll(".color-swatch").forEach((s) => s.classList.remove("active"));
      swatch.classList.add("active");
    }
  }

  const arEl = document.getElementById("setting-autorefresh");
  if (arEl && autoRefresh !== null) arEl.checked = autoRefresh === "true";

  const riEl = document.getElementById("setting-refresh-interval");
  if (riEl && refreshInterval) riEl.value = refreshInterval;

  const glEl = document.getElementById("setting-graph-limit");
  if (glEl && graphLimit) glEl.value = graphLimit;

  const atEl = document.getElementById("setting-alert-threshold");
  if (atEl && alertThreshold) atEl.value = alertThreshold;
}
