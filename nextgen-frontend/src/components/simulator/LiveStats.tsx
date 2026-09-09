"use client";

import { motion } from "framer-motion";
import { Zap, Activity, AlertTriangle, Users, Wallet, Gauge } from "lucide-react";
import type { SimulatorStats } from "@/lib/api";
import { formatAmount, formatNumber } from "@/lib/utils";

interface LiveStatsProps {
  stats: SimulatorStats | null;
}

export function LiveStats({ stats }: LiveStatsProps) {
  const items = [
    {
      label: "Throughput",
      value: stats ? `${stats.tps.toFixed(1)} tx/s` : "—",
      icon: Zap,
      color: "var(--accent-blue)",
    },
    {
      label: "Today",
      value: stats ? formatNumber(stats.today_transactions) : "—",
      icon: Activity,
      color: "var(--accent-purple)",
    },
    {
      label: "Volume",
      value: stats ? formatAmount(stats.total_volume) : "—",
      icon: Wallet,
      color: "var(--accent-green)",
    },
    {
      label: "Alerts",
      value: stats ? formatNumber(stats.risk_alerts) : "—",
      icon: AlertTriangle,
      color: "var(--accent-red)",
    },
    {
      label: "High Risk",
      value: stats ? formatNumber(stats.high_risk_accounts) : "—",
      icon: Users,
      color: "var(--accent-amber)",
    },
    {
      label: "Avg Risk",
      value: stats ? `${stats.avg_risk_score.toFixed(1)}` : "—",
      icon: Gauge,
      color: "var(--accent-cyan)",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ label, value, icon: Icon, color }, i) => (
        <motion.div
          key={label}
          className="card p-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon size={13} style={{ color }} />
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
              }}
            >
              {label}
            </span>
          </div>
          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              fontFamily: "JetBrains Mono, monospace",
              color,
            }}
          >
            {value}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
