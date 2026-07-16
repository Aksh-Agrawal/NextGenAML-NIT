"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Bell, Search, Activity, Sliders, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const BREADCRUMBS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/fund-flow": "Fund Flow Analysis",
  "/alerts": "Alert Triage",
  "/patterns": "Pattern Detector",
  "/sar-report": "SAR Report Generator",
  "/monitor": "Real-Time Monitor",
};

export function Topbar() {
  const pathname = usePathname();
  const [showAlerts, setShowAlerts] = useState(false);
  const [threshold, setThreshold] = useState(0.7);
  const [showThreshold, setShowThreshold] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const title =
    BREADCRUMBS[pathname ?? ""] ??
    (pathname?.startsWith("/fund-flow") ? "Fund Flow Analysis" : "NextGenAML");

  const segments = title.split(" / ");

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts", threshold],
    queryFn: () => api.alerts(threshold, 20),
    refetchInterval: 5_000,
    staleTime: 0,
  });

  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    refetchInterval: 30_000,
  });

  const criticalCount = alerts.filter((a) => a.risk_score >= 75).length;

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) {
        setShowAlerts(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <header
      className="topbar-blur flex items-center justify-between px-6 flex-shrink-0"
      style={{ height: 56, position: "sticky", top: 0, zIndex: 15 }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          NextGenAML
        </span>
        <ChevronRight size={13} style={{ color: "var(--text-muted)" }} />
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
            fontFamily:
              "var(--font-heading), 'Plus Jakarta Sans', 'Inter', sans-serif",
          }}
        >
          {title}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* System Health */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="status-dot"
            style={{
              background:
                health?.status === "ok"
                  ? "var(--accent-green)"
                  : "var(--accent-red)",
              boxShadow:
                health?.status === "ok"
                  ? "0 0 6px var(--accent-green)"
                  : "0 0 6px var(--accent-red)",
              animation: "dot-blink 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: 11,
              color:
                health?.status === "ok"
                  ? "var(--accent-green)"
                  : "var(--accent-red)",
              fontFamily: "Roboto Mono, JetBrains Mono, monospace",
            }}
          >
            {health?.status === "ok" ? "SYSTEM ONLINE" : "CHECKING..."}
          </span>
        </div>

        {/* Threshold Slider */}
        <div style={{ position: "relative" }}>
          <button
            id="threshold-btn"
            className="btn-ghost"
            style={{
              padding: "6px 10px",
              gap: 6,
              fontSize: 12,
              background: "rgba(255,255,255,0.05)",
              color: "#FFFFFF",
            }}
            onClick={() => setShowThreshold(!showThreshold)}
          >
            <Sliders size={13} color="#FFFFFF" />
            <span
              style={{ fontFamily: "Roboto Mono, JetBrains Mono, monospace" }}
            >
              {(threshold * 100).toFixed(0)}%
            </span>
          </button>
          <AnimatePresence>
            {showThreshold && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 8,
                  padding: 16,
                  background: "var(--bg-overlay)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  width: 220,
                  zIndex: 100,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  Alert Threshold
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.99}
                  step={0.01}
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent-purple)" }}
                />
                <div
                  className="flex justify-between"
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 4,
                    fontFamily: "Roboto Mono, JetBrains Mono, monospace",
                  }}
                >
                  <span>10%</span>
                  <span
                    style={{ color: "var(--accent-purple)", fontWeight: 600 }}
                  >
                    {(threshold * 100).toFixed(0)}%
                  </span>
                  <span>99%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Alert Bell */}
        <div style={{ position: "relative" }} ref={alertRef}>
          <button
            id="alert-bell-btn"
            onClick={() => setShowAlerts(!showAlerts)}
            className="btn-icon"
            style={{
              position: "relative",
              padding: 8,
              background: "rgba(255,255,255,0.05)",
              color: "#FFFFFF",
            }}
          >
            <Bell size={16} color="#FFFFFF" />
            {alerts.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  background: "var(--accent-red)",
                  color: "white",
                  fontSize: 9,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 3px",
                  fontFamily: "Roboto Mono, JetBrains Mono, monospace",
                }}
              >
                {alerts.length > 99 ? "99+" : alerts.length}
              </span>
            )}
          </button>

          {/* Alert Dropdown */}
          <AnimatePresence>
            {showAlerts && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 8,
                  width: 360,
                  maxHeight: 400,
                  background: "var(--bg-overlay)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  overflow: "hidden",
                  zIndex: 100,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      Live Alerts
                    </span>
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        color: "var(--text-muted)",
                        fontFamily: "Roboto Mono, JetBrains Mono, monospace",
                      }}
                    >
                      {criticalCount} CRITICAL
                    </span>
                  </div>
                  <button
                    className="btn-icon"
                    style={{ padding: 4 }}
                    onClick={() => setShowAlerts(false)}
                  >
                    <X size={13} />
                  </button>
                </div>
                <div style={{ overflowY: "auto", maxHeight: 340 }}>
                  {alerts.slice(0, 10).map((alert, i) => (
                    <div
                      key={alert.account_id + i}
                      className={`alert-entry ${i === 0 ? "slide-in-row" : ""}`}
                    >
                      <div
                        className="status-dot"
                        style={{
                          background:
                            alert.risk_score >= 75
                              ? "var(--accent-red)"
                              : alert.risk_score >= 50
                                ? "var(--accent-amber)"
                                : "var(--accent-blue)",
                          flexShrink: 0,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          style={{
                            fontSize: 12,
                            fontFamily: "JetBrains Mono, monospace",
                            color: "var(--text-primary)",
                          }}
                        >
                          {alert.account_id}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {alert.pattern_detected}
                        </div>
                      </div>
                      <span
                        className={`soft-tag ${
                          alert.risk_score >= 75
                            ? "soft-tag-high"
                            : alert.risk_score >= 50
                              ? "soft-tag-medium"
                              : "soft-tag-low"
                        }`}
                      >
                        {alert.risk_score.toFixed(0)}
                      </span>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div
                      className="flex flex-col items-center justify-center py-10"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Activity
                        size={28}
                        style={{ marginBottom: 8, opacity: 0.4 }}
                      />
                      <span style={{ fontSize: 13 }}>
                        No alerts at current threshold
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* User Avatar */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #00e5ff, #2979ff)",
            border: "1px solid rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 700,
            marginLeft: 8,
          }}
        >
          UB
        </div>
      </div>
    </header>
  );
}
