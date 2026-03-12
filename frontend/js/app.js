/* ══════════════════════════════════════════════════════
   NextGenAML — Application Entry Point
   ══════════════════════════════════════════════════════ */

// ── Clock ────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById("topbar-clock");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "short",
  });
}
setInterval(updateClock, 1000);
updateClock();

// ── Health Check ─────────────────────────────────────
async function checkHealth() {
  try {
    const d = await apiFetch("/health");
    const dot = document.querySelector(".health-dot");
    dot.classList.add("online");
    dot.classList.remove("offline");
    document.getElementById("health-text").textContent = `${d.total_accounts} accounts`;
    document.getElementById("topbar-accounts").textContent = `${d.total_accounts} accounts · ${d.total_transactions} txns`;
  } catch {
    const dot = document.querySelector(".health-dot");
    dot.classList.add("offline");
    dot.classList.remove("online");
    document.getElementById("health-text").textContent = "Offline";
  }
}
setInterval(checkHealth, 30000);
checkHealth();

// ── Data Loaded Check ────────────────────────────────
async function checkDataLoaded() {
  try {
    const d = await apiFetch("/upload/status");
    if (!d.loaded) {
      document.getElementById("upload-overlay").style.display = "flex";
    } else {
      document.getElementById("upload-overlay").style.display = "none";
    }
  } catch {
    document.getElementById("upload-overlay").style.display = "flex";
  }
}

// ── Restore saved theme/accent from settings ─────────
function restoreSavedPreferences() {
  const theme = localStorage.getItem("aml-theme");
  if (theme) applyTheme(theme);
  const accent = localStorage.getItem("aml-accent");
  if (accent) setAccentColor(accent, null);
}

// ── Register Routes ──────────────────────────────────
Router.register("dashboard", {
  template: "/static/pages/dashboard.html",
  init: loadDashboard,
});

Router.register("analytics", {
  template: "/static/pages/analytics.html",
  init: loadAnalytics,
});

Router.register("accounts", {
  template: "/static/pages/accounts.html",
  init: loadAccounts,
});

Router.register("predictions", {
  template: "/static/pages/predictions.html",
  init: () => {},
});

Router.register("alerts", {
  template: "/static/pages/alerts.html",
  init: () => {},
});

Router.register("patterns", {
  template: "/static/pages/patterns.html",
  init: () => loadPatterns("all"),
});

Router.register("graph", {
  template: "/static/pages/graph.html",
  init: () => setTimeout(loadFullGraph, 50),
});

Router.register("timeline", {
  template: "/static/pages/timeline.html",
  init: () => {},
});

Router.register("reports", {
  template: "/static/pages/reports.html",
  init: loadReportsList,
});

Router.register("model", {
  template: "/static/pages/model.html",
  init: loadModelInfo,
});

Router.register("upload", {
  template: "/static/pages/upload.html",
  init: initUploadPage,
});

Router.register("settings", {
  template: "/static/pages/settings.html",
  init: initSettingsPage,
});

// ── Bootstrap ────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Setup overlay upload
  setupUpload(
    "overlay-drop-zone",
    "overlay-file-input",
    "overlay-progress",
    "overlay-progress-fill",
    "overlay-progress-text",
    () => {
      document.getElementById("upload-overlay").style.display = "none";
      checkHealth();
      Router.navigate("dashboard");
    },
  );

  restoreSavedPreferences();
  checkDataLoaded();
  Router.init();

  // Re-init lucide icons after page changes
  if (window.lucide) {
    const observer = new MutationObserver(() => { lucide.createIcons(); });
    observer.observe(document.getElementById("page-container"), { childList: true, subtree: true });
    lucide.createIcons();
  }
});
