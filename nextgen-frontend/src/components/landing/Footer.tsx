"use client";

import { NAV_LINKS } from "@/lib/landing-data";

const ShieldLogo = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient
        id="footerGrad"
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
    <path
      d="M24 4L8 11V24C8 33.4 15.2 41.6 24 44C32.8 41.6 40 33.4 40 24V11L24 4Z"
      fill="url(#footerGrad)"
      fillOpacity="0.15"
      stroke="url(#footerGrad)"
      strokeWidth="1.5"
    />
    <circle cx="24" cy="14" r="2.5" fill="url(#footerGrad)" />
    <circle cx="16" cy="22" r="2" fill="url(#footerGrad)" />
    <circle cx="32" cy="22" r="2" fill="url(#footerGrad)" />
    <circle cx="20" cy="30" r="2" fill="url(#footerGrad)" />
    <circle cx="28" cy="30" r="2" fill="url(#footerGrad)" />
    <line
      x1="24"
      y1="14"
      x2="16"
      y2="22"
      stroke="url(#footerGrad)"
      strokeWidth="1"
      strokeOpacity="0.7"
    />
    <line
      x1="24"
      y1="14"
      x2="32"
      y2="22"
      stroke="url(#footerGrad)"
      strokeWidth="1"
      strokeOpacity="0.7"
    />
    <line
      x1="16"
      y1="22"
      x2="20"
      y2="30"
      stroke="url(#footerGrad)"
      strokeWidth="1"
      strokeOpacity="0.7"
    />
    <line
      x1="32"
      y1="22"
      x2="28"
      y2="30"
      stroke="url(#footerGrad)"
      strokeWidth="1"
      strokeOpacity="0.7"
    />
  </svg>
);

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-base)",
        borderTop: "1px solid var(--border)",
        padding: "32px",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Row 1 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldLogo />
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              NextGenAML
            </span>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  transition: "color 0.2s ease",
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
          </div>

          {/* Right label */}
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            }}
          >
            Union Bank Hackathon 2026
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "var(--border)" }} />

        {/* Row 2 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            NextGenAML · Problem Statement 3 · All systems operational
            <span
              style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--accent-green)",
                boxShadow: "0 0 6px var(--accent-green)",
                animation: "footerPulse 2s ease-in-out infinite",
              }}
            />
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes footerPulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </footer>
  );
}
