"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, ShieldAlert } from "lucide-react";
import type { SimulatorHistoryItem } from "@/lib/api";
import { formatAmount, formatTimestamp, getRiskColor } from "@/lib/utils";
import { RiskBadge } from "@/components/ui";

interface LiveTimelineProps {
  txns: SimulatorHistoryItem[];
  height?: number;
}

export function LiveTimeline({ txns, height = 320 }: LiveTimelineProps) {
  return (
    <div
      className="w-full overflow-y-auto"
      style={{ height, fontFamily: "JetBrains Mono, monospace" }}
    >
      {txns.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 h-full"
          style={{ color: "var(--text-muted)" }}
        >
          <Zap size={20} style={{ opacity: 0.4 }} />
          <span style={{ fontSize: 11 }}>Waiting for live transactions...</span>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {txns.slice(0, 60).map((t) => {
            const color = getRiskColor(t.risk_level);
            const flagged = t.risk_score >= 50;
            return (
              <motion.div
                key={t.transaction_id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  padding: "7px 12px",
                  borderBottom: "1px solid var(--border)",
                  borderLeft: `3px solid ${color}`,
                  background: t.risk_level === "critical"
                    ? "rgba(255,61,87,0.05)"
                    : t.risk_level === "high"
                      ? "rgba(255,181,71,0.03)"
                      : "transparent",
                  fontSize: 11,
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    style={{ color: "var(--text-muted)", minWidth: 70, fontSize: 10 }}
                  >
                    {formatTimestamp(t.timestamp)}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>{t.sender}</span>
                  <span style={{ color: "var(--text-muted)" }}>→</span>
                  <span style={{ color: "var(--text-secondary)" }}>{t.receiver}</span>
                  <span
                    style={{
                      color: flagged ? "var(--accent-red)" : "var(--accent-amber)",
                      marginLeft: "auto",
                      fontWeight: 700,
                    }}
                  >
                    {formatAmount(t.amount)}
                  </span>
                  <RiskBadge level={t.risk_level} size="sm" />
                  {flagged && (
                    <ShieldAlert size={11} style={{ color: "var(--accent-red)" }} />
                  )}
                </div>
                {t.flags.length > 0 && (
                  <div
                    className="flex gap-1 flex-wrap mt-1"
                    style={{ paddingLeft: 82 }}
                  >
                    {t.flags.map((f) => (
                      <span
                        key={f}
                        style={{
                          fontSize: 9,
                          color: "var(--accent-amber)",
                          background: "rgba(255,181,71,0.08)",
                          border: "1px solid rgba(255,181,71,0.2)",
                          borderRadius: 6,
                          padding: "1px 6px",
                          textTransform: "uppercase",
                          letterSpacing: "0.4px",
                        }}
                      >
                        {f.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
