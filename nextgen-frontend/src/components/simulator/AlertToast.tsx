"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";
import type { SimulatorAlert } from "@/lib/api";
import { formatAmount, formatTimestamp } from "@/lib/utils";

interface AlertToastProps {
  alert: SimulatorAlert | null;
  onDismiss: () => void;
}

export function AlertToast({ alert, onDismiss }: AlertToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!alert) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [alert, onDismiss]);

  if (!alert) return null;

  const critical = alert.severity === "critical";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="card p-4"
          style={{
            position: "fixed",
            top: 20,
            right: 24,
            zIndex: 60,
            width: 340,
            borderLeft: `4px solid ${
              critical ? "var(--accent-red)" : "var(--accent-amber)"
            }`,
            background: critical
              ? "rgba(255,61,87,0.08)"
              : "rgba(255,181,71,0.06)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: critical
                  ? "rgba(255,61,87,0.15)"
                  : "rgba(255,181,71,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: critical ? "var(--accent-red)" : "var(--accent-amber)",
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span
                  style={{
                    fontSize: 10,
                    color: critical ? "var(--accent-red)" : "var(--accent-amber)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  {alert.severity} alert · {alert.id}
                </span>
                <button
                  className="btn-icon"
                  onClick={() => {
                    setVisible(false);
                    onDismiss();
                  }}
                  style={{ width: 20, height: 20, padding: 0 }}
                >
                  <X size={11} />
                </button>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "JetBrains Mono, monospace",
                  margin: "6px 0 2px",
                  color: "var(--text-primary)",
                }}
              >
                {alert.sender} → {alert.receiver}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  marginBottom: 4,
                }}
              >
                {alert.reason}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {formatAmount(alert.amount)} · {formatTimestamp(alert.created_at)}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
