"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, RefreshCw } from "lucide-react";
import { api, type SimulatorHistoryItem } from "@/lib/api";
import { formatAmount, formatTimestamp, getRiskColor } from "@/lib/utils";
import { RiskBadge, LoadingState, ErrorCard } from "@/components/ui";

const PAGE_SIZE = 20;

interface Filters {
  risk_level: string;
  sender: string;
  receiver: string;
  min_amount: string;
  max_amount: string;
}

const EMPTY: Filters = {
  risk_level: "",
  sender: "",
  receiver: "",
  min_amount: "",
  max_amount: "",
};

export function HistoryTable() {
  const [items, setItems] = useState<SimulatorHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async (p: number, f: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { limit: PAGE_SIZE, page: p };
      if (f.risk_level) params.risk_level = f.risk_level;
      if (f.sender) params.sender = f.sender;
      if (f.receiver) params.receiver = f.receiver;
      if (f.min_amount) params.min_amount = f.min_amount;
      if (f.max_amount) params.max_amount = f.max_amount;
      const res = await api.simulatorHistory(params);
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const applyFilters = () => {
    setPage(1);
    load(1, filters);
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost"
            style={{ padding: "6px 12px", fontSize: 11 }}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={12} />
            Filters
          </button>
          <button
            className="btn-ghost"
            style={{ padding: "6px 12px", fontSize: 11 }}
            onClick={() => {
              setFilters(EMPTY);
              setPage(1);
              load(1, EMPTY);
            }}
          >
            <RefreshCw size={12} />
            Reset
          </button>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {total} transactions
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="btn-icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={13} />
          </button>
          <span
            style={{
              fontSize: 11,
              fontFamily: "JetBrains Mono, monospace",
              color: "var(--text-secondary)",
              minWidth: 48,
              textAlign: "center",
            }}
          >
            {page} / {pages}
          </span>
          <button
            className="btn-icon"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card p-3 grid grid-cols-5 gap-2">
          <input
            className="input-dark"
            placeholder="Risk level (low/medium/high/critical)"
            value={filters.risk_level}
            onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
          />
          <input
            className="input-dark"
            placeholder="Sender"
            value={filters.sender}
            onChange={(e) => setFilters({ ...filters, sender: e.target.value })}
          />
          <input
            className="input-dark"
            placeholder="Receiver"
            value={filters.receiver}
            onChange={(e) => setFilters({ ...filters, receiver: e.target.value })}
          />
          <input
            className="input-dark"
            type="number"
            placeholder="Min ₹"
            value={filters.min_amount}
            onChange={(e) => setFilters({ ...filters, min_amount: e.target.value })}
          />
          <input
            className="input-dark"
            type="number"
            placeholder="Max ₹"
            value={filters.max_amount}
            onChange={(e) => setFilters({ ...filters, max_amount: e.target.value })}
          />
          <button
            className="btn-primary"
            style={{ gridColumn: "1 / -1", justifySelf: "start", padding: "6px 16px", fontSize: 11 }}
            onClick={applyFilters}
          >
            Apply
          </button>
        </div>
      )}

      {loading ? (
        <LoadingState variant="skeleton" lines={8} />
      ) : error ? (
        <ErrorCard message={error} onRetry={() => load(page, filters)} />
      ) : (
        <div className="overflow-x-auto">
          <table className="table-dark w-full">
            <thead>
              <tr>
                <th>Time</th>
                <th>Transaction</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}
                  >
                    No transactions yet – send one from the phone or start the stream.
                  </td>
                </tr>
              )}
              {items.map((t) => {
                const color = getRiskColor(t.risk_level);
                return (
                  <tr
                    key={t.transaction_id}
                    className={t.risk_level === "critical" ? "critical-row" : ""}
                  >
                    <td style={{ fontSize: 10, whiteSpace: "nowrap" }}>
                      {formatTimestamp(t.timestamp)}
                    </td>
                    <td style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>
                      {t.transaction_id}
                    </td>
                    <td style={{ fontSize: 11 }}>{t.sender}</td>
                    <td style={{ fontSize: 11 }}>{t.receiver}</td>
                    <td style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: t.risk_score >= 50 ? "var(--accent-red)" : undefined }}>
                      {formatAmount(t.amount)}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 9,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color:
                            t.status === "success"
                              ? "var(--accent-green)"
                              : "var(--accent-red)",
                        }}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <RiskBadge level={t.risk_level} size="sm" />
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: "JetBrains Mono, monospace",
                            color,
                          }}
                        >
                          {t.risk_score.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td>
                      {t.flags.length > 0 && (
                        <span
                          style={{
                            fontSize: 9,
                            color: "var(--accent-amber)",
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                        >
                          {t.flags.slice(0, 2).join(", ")}
                          {t.flags.length > 2 ? ` +${t.flags.length - 2}` : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
