"use client";

import { useState, useEffect } from "react";
import { NAV_LINKS } from "@/lib/landing-data";

const ShieldLogo = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient
        id="logoGrad"
        x1="0"
        y1="0"
        x2="48"
        y2="48"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#00E5FF" />
        <stop offset="100%" stopColor="#2979FF" />
      </linearGradient>
    </defs>
    {/* Shield path */}
    <path
      d="M24 4L8 11V24C8 33.4 15.2 41.6 24 44C32.8 41.6 40 33.4 40 24V11L24 4Z"
      fill="url(#logoGrad)"
      fillOpacity="0.15"
      stroke="url(#logoGrad)"
      strokeWidth="1.5"
    />
    {/* Neural nodes */}
    <circle cx="24" cy="14" r="2.5" fill="url(#logoGrad)" />
    <circle cx="16" cy="22" r="2" fill="url(#logoGrad)" />
    <circle cx="32" cy="22" r="2" fill="url(#logoGrad)" />
    <circle cx="20" cy="30" r="2" fill="url(#logoGrad)" />
    <circle cx="28" cy="30" r="2" fill="url(#logoGrad)" />
    {/* Connecting edges */}
    <line
      x1="24"
      y1="14"
      x2="16"
      y2="22"
      stroke="url(#logoGrad)"
      strokeWidth="1"
      strokeOpacity="0.7"
    />
    <line
      x1="24"
      y1="14"
      x2="32"
      y2="22"
      stroke="url(#logoGrad)"
      strokeWidth="1"
      strokeOpacity="0.7"
    />
    <line
      x1="16"
      y1="22"
      x2="20"
      y2="30"
      stroke="url(#logoGrad)"
      strokeWidth="1"
      strokeOpacity="0.7"
    />
    <line
      x1="32"
      y1="22"
      x2="28"
      y2="30"
      stroke="url(#logoGrad)"
      strokeWidth="1"
      strokeOpacity="0.7"
    />
    <line
      x1="16"
      y1="22"
      x2="32"
      y2="22"
      stroke="url(#logoGrad)"
      strokeWidth="0.75"
      strokeOpacity="0.4"
    />
    <line
      x1="20"
      y1="30"
      x2="28"
      y2="30"
      stroke="url(#logoGrad)"
      strokeWidth="0.75"
      strokeOpacity="0.4"
    />
  </svg>
);

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          background: scrolled
            ? "rgba(11, 15, 25, 0.92)"
            : "rgba(11, 15, 25, 0.82)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
          boxShadow: scrolled ? "0 10px 30px rgba(0,0,0,0.25)" : "none",
          transition: "box-shadow 0.3s ease",
        }}
      >
        {/* Logo */}
        <a
          href="#"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <ShieldLogo />
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.3px",
                lineHeight: 1,
                fontFamily:
                  "var(--font-heading), 'Plus Jakarta Sans', 'Inter', sans-serif",
              }}
            >
              NextGenAML
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                letterSpacing: "0.2px",
                lineHeight: 1,
              }}
            ></span>
          </div>
        </a>

        {/* Desktop nav */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "32px" }}
          className="desktop-nav"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.2s ease",
                position: "relative",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-secondary)")
              }
            >
              {link.label}
            </a>
          ))}

          <a
            href="/dashboard"
            style={{
              fontSize: "13px",
              color: "#0B0F19",
              border: "1px solid rgba(0,229,255,0.35)",
              borderRadius: "12px",
              padding: "6px 16px",
              textDecoration: "none",
              transition: "all 0.2s ease",
              background: "linear-gradient(135deg, #00e5ff 0%, #2979ff 100%)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "brightness(1)";
            }}
          >
            View Demo
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="hamburger-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            color: "var(--text-primary)",
            cursor: "pointer",
            padding: "8px",
          }}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            {mobileOpen ? (
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            top: "60px",
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(11, 15, 25, 0.98)",
            backdropFilter: "blur(16px)",
            zIndex: 49,
            display: "flex",
            flexDirection: "column",
            padding: "32px",
            gap: "24px",
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                fontSize: "20px",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 500,
                padding: "12px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            style={{
              fontSize: "16px",
              color: "#0B0F19",
              border: "1px solid rgba(0,229,255,0.35)",
              borderRadius: "12px",
              padding: "12px 20px",
              textDecoration: "none",
              textAlign: "center",
              marginTop: "8px",
              background: "linear-gradient(135deg, #00e5ff 0%, #2979ff 100%)",
            }}
          >
            View Demo
          </a>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .hamburger-btn {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
