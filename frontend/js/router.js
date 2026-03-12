/* ══════════════════════════════════════════════════════
   NextGenAML — Hash-based Page Router
   ══════════════════════════════════════════════════════ */

const Router = (() => {
  const routes = {};
  const pageCache = {};
  let currentPage = null;

  function register(name, { template, init }) {
    routes[name] = { template, init };
  }

  async function loadTemplate(url) {
    if (pageCache[url]) return pageCache[url];
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load template: ${url}`);
    const html = await res.text();
    pageCache[url] = html;
    return html;
  }

  async function navigate(page) {
    const route = routes[page];
    if (!route) {
      console.warn("Unknown route:", page);
      page = "dashboard";
      return navigate(page);
    }

    // Update hash without triggering hashchange again
    if (location.hash !== "#" + page) {
      history.replaceState(null, "", "#" + page);
    }

    // Update sidebar active state
    document.querySelectorAll(".nav-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.page === page);
    });

    // Update page title
    const activeLink = document.querySelector(`[data-page="${page}"]`);
    const titleEl = document.getElementById("pageTitle");
    if (activeLink && titleEl) {
      titleEl.textContent = activeLink.querySelector("span").textContent.trim();
    }

    // Close mobile sidebar
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("open");

    // Load template into container
    const container = document.getElementById("page-container");
    try {
      const html = await loadTemplate(route.template);
      container.innerHTML = html;
      container.classList.remove("page-enter");
      void container.offsetWidth; // force reflow
      container.classList.add("page-enter");

      currentPage = page;

      // Initialize page-specific JS
      if (route.init) {
        await route.init();
      }
    } catch (e) {
      container.innerHTML = `<div class="card"><div class="card-body"><p class="muted" style="color:var(--red)">Error loading page: ${e.message}</p></div></div>`;
    }
  }

  function getCurrentPage() {
    return currentPage;
  }

  function init() {
    // Listen for hash changes
    window.addEventListener("hashchange", () => {
      const page = location.hash.slice(1) || "dashboard";
      navigate(page);
    });

    // Sidebar nav clicks
    document.querySelectorAll(".nav-item").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        location.hash = "#" + page;
      });
    });

    // Sidebar toggle (mobile)
    const toggleBtn = document.getElementById("sidebar-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("open");
      });
    }

    // Initial navigation
    const startPage = location.hash.slice(1) || "dashboard";
    navigate(startPage);
  }

  return { register, navigate, init, getCurrentPage };
})();
