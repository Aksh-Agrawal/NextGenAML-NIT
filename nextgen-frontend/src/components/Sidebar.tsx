"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  GitFork,
  Bell,
  Search,
  FileText,
  Activity,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  // Cpu,
  // Circle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/fund-flow", label: "Fund Flow", icon: GitFork },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/patterns", label: "Patterns", icon: Search },
  { href: "/sar-report", label: "SAR Report", icon: FileText },
  { href: "/monitor", label: "Monitor", icon: Activity },
  { href: "/simulator", label: "UPI Simulator", icon: Smartphone },
];

export function SidebarNav() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    refetchInterval: 30_000,
  });

  const modelLoaded = health?.model_loaded ?? false;

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="sidebar flex-shrink-0 flex flex-col h-full relative z-20"
      style={{ overflow: "hidden" }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 px-4 py-5 border-b"
        style={{
          borderColor: "var(--border)",
          textDecoration: "none",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <NeuralShieldIcon />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="sidebar-logo-text min-w-0"
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.3px",
                  fontFamily:
                    "var(--font-heading), 'Plus Jakarta Sans', 'Inter', sans-serif",
                }}
              >
                NextGen
                <span style={{ color: "var(--accent-purple)" }}>AML</span>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                X-Bank of India
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={collapsed ? 22 : 18}
                style={{
                  flexShrink: 0,
                  color: isActive ? "var(--accent-blue)" : undefined,
                  transition: "all 0.2s ease",
                }}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Status */}
      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div
          className="flex items-center gap-2 px-2 py-2 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border)",
          }}
          title={
            collapsed
              ? modelLoaded
                ? "Model Ready"
                : "Model Loading"
              : undefined
          }
        >
          <div
            className="status-dot"
            style={{
              background: modelLoaded
                ? "var(--accent-green)"
                : "var(--accent-amber)",
              boxShadow: modelLoaded
                ? "0 0 6px var(--accent-green)"
                : "0 0 6px var(--accent-amber)",
              animation: "dot-blink 2s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0"
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {modelLoaded ? "GNN Model Ready" : "Loading Model..."}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  v1.0 · GraphSAGE
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="btn-icon"
        style={{
          position: "absolute",
          right: -12,
          top: "50%",
          transform: "translateY(-50%)",
          borderRadius: "50%",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          zIndex: 10,
          width: 24,
          height: 24,
          padding: 0,
        }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}

function NeuralShieldIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
        <linearGradient id="nodeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {/* Shield shape */}
      <path
        d="M16 2L4 7v9c0 5.55 5.16 10.74 12 12 6.84-1.26 12-6.45 12-12V7L16 2z"
        fill="url(#shieldGrad)"
        fillOpacity="0.15"
        stroke="url(#shieldGrad)"
        strokeWidth="1.5"
      />
      {/* Neural network nodes */}
      <circle cx="16" cy="16" r="2.5" fill="url(#nodeGrad)" />
      <circle cx="10" cy="12" r="1.8" fill="url(#nodeGrad)" />
      <circle cx="22" cy="12" r="1.8" fill="url(#nodeGrad)" />
      <circle cx="11" cy="21" r="1.8" fill="url(#nodeGrad)" />
      <circle cx="21" cy="21" r="1.8" fill="url(#nodeGrad)" />
      {/* Edges */}
      <line
        x1="16"
        y1="16"
        x2="10"
        y2="12"
        stroke="url(#shieldGrad)"
        strokeWidth="0.8"
        strokeOpacity="0.7"
      />
      <line
        x1="16"
        y1="16"
        x2="22"
        y2="12"
        stroke="url(#shieldGrad)"
        strokeWidth="0.8"
        strokeOpacity="0.7"
      />
      <line
        x1="16"
        y1="16"
        x2="11"
        y2="21"
        stroke="url(#shieldGrad)"
        strokeWidth="0.8"
        strokeOpacity="0.7"
      />
      <line
        x1="16"
        y1="16"
        x2="21"
        y2="21"
        stroke="url(#shieldGrad)"
        strokeWidth="0.8"
        strokeOpacity="0.7"
      />
      <line
        x1="10"
        y1="12"
        x2="11"
        y2="21"
        stroke="url(#shieldGrad)"
        strokeWidth="0.6"
        strokeOpacity="0.4"
      />
      <line
        x1="22"
        y1="12"
        x2="21"
        y2="21"
        stroke="url(#shieldGrad)"
        strokeWidth="0.6"
        strokeOpacity="0.4"
      />
    </svg>
  );
}
