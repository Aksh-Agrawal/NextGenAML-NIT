"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatAmount, formatNumber, getRiskFromScore } from "@/lib/utils";
import {
  RiskBadge,
  ProbabilityBar,
  LoadingState,
  ErrorCard,
  StatPill,
} from "@/components/ui";
import { VoiceAuthDashboard } from "@/components/VoiceAuthDashboard";

type SortKey = "account_id" | "risk_score" | "volume_30d" | "transaction_count";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

export default function AlertsPage() {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("risk_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [threshold, setThreshold] = useState(0.3);

  const {
    data: alerts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["alerts", threshold],
    queryFn: () => api.alerts(threshold, 200),
    refetchInterval: 10_000,
    staleTime: 0,
  });

  const visible = alerts.filter((a) => !clearedIds.has(a.account_id));

  const filtered = visible.filter((a) => {
    if (filterLevel === "all") return true;
    const level = getRiskFromScore(a.risk_score);
    return level === filterLevel;
  });

  const sorted = [...filtered].sort((a, b) => {
    const mult = sortDir === "asc" ? 1 : -1;
    if (sortKey === "account_id")
      return mult * a.account_id.localeCompare(b.account_id);
    return mult * ((a as any)[sortKey] - (b as any)[sortKey]);
  });

  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const criticalCount = visible.filter((a) => a.risk_score >= 75).length;
  const highCount = visible.filter(
    (a) => a.risk_score >= 50 && a.risk_score < 75,
  ).length;
  const clearedCount = clearedIds.size;

  const toggleSelect = (id: string) => {
    const s = new Set(selectedIds);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedIds(s);
  };

  const clearSelected = () => {
    setClearedIds((prev) => new Set([...prev, ...selectedIds]));
    setSelectedIds(new Set());
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? (
        <ChevronUp size={12} style={{ color: "var(--accent-blue)" }} />
      ) : (
        <ChevronDown size={12} style={{ color: "var(--accent-blue)" }} />
      )
    ) : null;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Alert Triage</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Investigation queue — {visible.length} active alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="live-dot" />
          <span
            style={{
              fontSize: 11,
              color: "var(--accent-green)",
              fontFamily: "Roboto Mono, JetBrains Mono, monospace",
              fontWeight: 600,
            }}
          >
            AUTO-REFRESH 10s
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-3">
        <StatPill
          label="CRITICAL"
          value={criticalCount}
          color="var(--accent-red)"
        />
        <StatPill label="HIGH" value={highCount} color="var(--accent-amber)" />
        <StatPill
          label="Cleared"
          value={clearedCount}
          color="var(--accent-green)"
        />
        <StatPill label="Total Active" value={visible.length} />
        <StatPill
          label="Threshold"
          value={`${(threshold * 100).toFixed(0)}%`}
          color="var(--accent-purple)"
        />
      </div>

      {/* Filters + Bulk Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Risk Filter Pills */}
        {["all", "critical", "high", "medium", "low"].map((level) => (
          <button
            key={level}
            onClick={() => {
              setFilterLevel(level);
              setPage(0);
            }}
            className="btn-ghost"
            style={{
              padding: "5px 12px",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              background:
                filterLevel === level
                  ? `${level === "all" ? "rgba(77,142,255,0.15)" : `rgba(${level === "critical" ? "255,61,87" : level === "high" ? "255,181,71" : level === "medium" ? "77,142,255" : "34,197,94"},0.15)`}`
                  : undefined,
              color:
                filterLevel === level
                  ? level === "critical"
                    ? "var(--accent-red)"
                    : level === "high"
                      ? "var(--accent-amber)"
                      : level === "medium"
                        ? "var(--accent-blue)"
                        : level === "low"
                          ? "var(--accent-green)"
                          : "var(--accent-blue)"
                  : undefined,
            }}
          >
            {level === "all" ? "All" : level}
          </button>
        ))}

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          {selectedIds.size > 0 && (
            <button
              className="btn-ghost"
              style={{
                fontSize: 12,
                padding: "5px 12px",
                color: "var(--accent-green)",
                borderColor: "rgba(34,197,94,0.3)",
              }}
              onClick={clearSelected}
            >
              <CheckSquare size={13} />
              Clear {selectedIds.size} selected
            </button>
          )}
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Threshold:
            </span>
            <input
              type="range"
              min={0.1}
              max={0.99}
              step={0.05}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              style={{ width: 80, accentColor: "var(--accent-purple)" }}
            />
            <span
              style={{
                fontSize: 11,
                fontFamily: "JetBrains Mono, monospace",
                color: "var(--accent-purple)",
                minWidth: 28,
              }}
            >
              {(threshold * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <VoiceAuthDashboard />

      {/* Table */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ overflow: "hidden" }}
      >
        {isLoading ? (
          <LoadingState variant="skeleton" lines={8} />
        ) : error ? (
          <ErrorCard
            message="Failed to load alerts"
            onRetry={() => refetch()}
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table-dark">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onClick={() => {
                        if (selectedIds.size === paginated.length)
                          setSelectedIds(new Set());
                        else
                          setSelectedIds(
                            new Set(paginated.map((a) => a.account_id)),
                          );
                      }}
                    >
                      {selectedIds.size === paginated.length &&
                      paginated.length > 0 ? (
                        <CheckSquare
                          size={14}
                          style={{ color: "var(--accent-blue)" }}
                        />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                  </th>
                  <th
                    onClick={() => handleSort("account_id")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex items-center gap-1">
                      Account ID <SortIcon k="account_id" />
                    </div>
                  </th>
                  <th>Risk Level</th>
                  <th
                    onClick={() => handleSort("risk_score")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex items-center gap-1">
                      Risk Score <SortIcon k="risk_score" />
                    </div>
                  </th>
                  <th>Probability</th>
                  <th
                    onClick={() => handleSort("volume_30d")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex items-center gap-1">
                      Volume 30d <SortIcon k="volume_30d" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("transaction_count")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex items-center gap-1">
                      Txn Count <SortIcon k="transaction_count" />
                    </div>
                  </th>
                  <th>Pattern</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((alert, i) => {
                  const level = getRiskFromScore(alert.risk_score);
                  const isSelected = selectedIds.has(alert.account_id);
                  return (
                    <motion.tr
                      key={alert.account_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={level === "critical" ? "critical-row" : ""}
                      style={{
                        background: isSelected
                          ? "rgba(77,142,255,0.06)"
                          : undefined,
                      }}
                    >
                      <td>
                        <button
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                          }}
                          onClick={() => toggleSelect(alert.account_id)}
                        >
                          {isSelected ? (
                            <CheckSquare
                              size={14}
                              style={{ color: "var(--accent-blue)" }}
                            />
                          ) : (
                            <Square size={14} />
                          )}
                        </button>
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily:
                              "Roboto Mono, JetBrains Mono, monospace",
                            fontSize: 12,
                            color: "var(--text-primary)",
                            fontWeight: 500,
                          }}
                        >
                          {alert.account_id}
                        </span>
                      </td>
                      <td>
                        <RiskBadge level={level} size="sm" />
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily:
                              "Roboto Mono, JetBrains Mono, monospace",
                            fontSize: 14,
                            fontWeight: 700,
                            color:
                              level === "critical"
                                ? "var(--accent-red)"
                                : level === "high"
                                  ? "var(--accent-amber)"
                                  : level === "medium"
                                    ? "var(--accent-blue)"
                                    : "var(--accent-green)",
                          }}
                        >
                          {alert.risk_score.toFixed(1)}
                        </span>
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <ProbabilityBar
                          value={alert.risk_score / 100}
                          showLabel
                        />
                      </td>
                      <td
                        style={{
                          fontFamily: "Roboto Mono, JetBrains Mono, monospace",
                          fontSize: 12,
                          color: "var(--accent-amber)",
                        }}
                      >
                        {formatAmount(alert.volume_30d)}
                      </td>
                      <td
                        style={{
                          fontFamily: "Roboto Mono, JetBrains Mono, monospace",
                          fontSize: 12,
                        }}
                      >
                        {formatNumber(alert.transaction_count)}
                      </td>
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {alert.pattern_detected}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background:
                              alert.status === "Critical"
                                ? "rgba(255,61,113,0.12)"
                                : alert.status === "Flagged"
                                  ? "rgba(255,170,0,0.12)"
                                  : "rgba(255,255,255,0.04)",
                            color:
                              alert.status === "Critical"
                                ? "var(--accent-red)"
                                : alert.status === "Flagged"
                                  ? "var(--accent-amber)"
                                  : "var(--text-muted)",
                            fontFamily:
                              "Roboto Mono, JetBrains Mono, monospace",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {alert.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/fund-flow?account=${encodeURIComponent(alert.account_id)}`}
                            className="btn-ghost"
                            style={{ padding: "4px 8px", fontSize: 11, gap: 4 }}
                          >
                            <ExternalLink size={11} />
                            Investigate
                          </Link>
                          <Link
                            href={`/sar-report?accountId=${encodeURIComponent(alert.account_id)}`}
                            className="btn-ghost"
                            style={{ padding: "4px 8px", fontSize: 11, gap: 4 }}
                          >
                            <FileText size={11} />
                          </Link>
                          <button
                            className="btn-icon"
                            style={{ padding: 5, color: "var(--accent-green)" }}
                            onClick={() =>
                              setClearedIds(
                                (prev) => new Set([...prev, alert.account_id]),
                              )
                            }
                            title="Clear alert"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={10}>
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <AlertTriangle
                          size={32}
                          style={{ color: "var(--text-muted)", opacity: 0.4 }}
                        />
                        <span
                          style={{ fontSize: 13, color: "var(--text-muted)" }}
                        >
                          No alerts match the current filter
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-5 py-3 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontFamily: "Roboto Mono, JetBrains Mono, monospace",
              }}
            >
              {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, sorted.length)} of{" "}
              {sorted.length}
            </span>
            <div className="flex gap-2">
              <button
                className="btn-ghost"
                style={{ padding: "5px 12px", fontSize: 12 }}
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Prev
              </button>
              {Array.from(
                { length: Math.min(totalPages, 5) },
                (_, i) => i + Math.max(0, page - 2),
              )
                .slice(0, 5)
                .map((p) => (
                  <button
                    key={p}
                    className="btn-ghost"
                    style={{
                      padding: "5px 10px",
                      fontSize: 12,
                      background:
                        p === page ? "rgba(0,229,255,0.15)" : undefined,
                      borderColor:
                        p === page ? "rgba(0,229,255,0.3)" : undefined,
                      color: p === page ? "var(--accent-blue)" : undefined,
                      fontFamily: "Roboto Mono, JetBrains Mono, monospace",
                    }}
                    onClick={() => setPage(p)}
                  >
                    {p + 1}
                  </button>
                ))}
              <button
                className="btn-ghost"
                style={{ padding: "5px 12px", fontSize: 12 }}
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
