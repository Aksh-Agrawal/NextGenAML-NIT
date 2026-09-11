"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Ban,
  Check,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import { api, type VoiceConfirmation } from "@/lib/api";
import { formatAmount, formatTimestamp } from "@/lib/utils";
import { LoadingState, StatPill } from "@/components/ui";

export function VoiceAuthDashboard() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const {
    data: pending = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["voicePending"],
    queryFn: api.voicePending,
    refetchInterval: 5_000,
  });
  const { data: stats } = useQuery({
    queryKey: ["voiceStats"],
    queryFn: api.voiceStats,
    refetchInterval: 5_000,
  });

  const resolve = async (item: VoiceConfirmation, confirmed: boolean) => {
    setBusyId(item.confirmation_id);
    try {
      await api.voiceConfirm(
        item.confirmation_id,
        confirmed,
        confirmed
          ? "Analyst override: customer confirmed transaction."
          : "Analyst override: customer denied or could not verify transaction.",
      );
      await refetch();
    } finally {
      setBusyId(null);
    }
  };

  const retry = async (item: VoiceConfirmation) => {
    setBusyId(item.confirmation_id);
    try {
      await api.voiceRetryCall(item.confirmation_id);
      await refetch();
    } finally {
      setBusyId(null);
    }
  };

  const active = pending.filter((item) => !item.outcome);

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <PhoneCall size={14} style={{ color: "var(--accent-blue)" }} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            Sarvam Voice Queue
          </span>
        </div>
        <button
          className="btn-icon"
          title="Refresh voice queue"
          onClick={() => refetch()}
          style={{ padding: 5 }}
        >
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-3 flex-wrap">
          <StatPill label="Pending" value={stats?.pending ?? 0} color="var(--accent-amber)" />
          <StatPill label="Confirmed" value={stats?.confirmed ?? 0} color="var(--accent-green)" />
          <StatPill label="Denied" value={stats?.denied ?? 0} color="var(--accent-red)" />
          <StatPill label="No Answer" value={stats?.no_answer ?? 0} color="var(--accent-purple)" />
        </div>

        {isLoading ? (
          <LoadingState variant="skeleton" lines={4} />
        ) : active.length === 0 ? (
          <div
            className="flex items-center justify-center gap-2"
            style={{
              minHeight: 72,
              color: "var(--text-muted)",
              fontSize: 12,
              border: "1px dashed var(--border)",
              borderRadius: 8,
            }}
          >
            <ShieldCheck size={14} />
            No pending voice confirmations
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table-dark">
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Customer</th>
                  <th>Transaction</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {active.map((item) => (
                  <tr key={item.confirmation_id}>
                    <td style={{ fontSize: 10, whiteSpace: "nowrap" }}>
                      {formatTimestamp(item.created_at)}
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>
                        {item.customer_name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {item.customer_phone}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: "JetBrains Mono, monospace",
                          color: "var(--accent-amber)",
                        }}
                      >
                        {formatAmount(item.transaction.amount)}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        {item.transaction.sender} to {item.transaction.receiver}
                      </div>
                    </td>
                    <td
                      style={{
                        fontSize: 12,
                        fontFamily: "JetBrains Mono, monospace",
                        color:
                          item.tx_risk.score >= 80
                            ? "var(--accent-red)"
                            : "var(--accent-amber)",
                      }}
                    >
                      {item.tx_risk.score.toFixed(1)}%
                    </td>
                    <td>
                      <span className="soft-tag soft-tag-medium">
                        {item.status.split("_").join(" ")}
                      </span>
                    </td>
                    <td
                      style={{
                        fontSize: 11,
                        color: "var(--text-secondary)",
                        maxWidth: 260,
                      }}
                    >
                      {item.notes}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn-icon"
                          title="Retry call"
                          disabled={busyId === item.confirmation_id}
                          onClick={() => retry(item)}
                        >
                          <TimerReset size={12} />
                        </button>
                        <button
                          className="btn-icon"
                          title="Withdraw transaction"
                          disabled={busyId === item.confirmation_id}
                          onClick={() => resolve(item, false)}
                          style={{ color: "var(--accent-red)" }}
                        >
                          <Ban size={12} />
                        </button>
                        <button
                          className="btn-icon"
                          title="Approve transaction"
                          disabled={busyId === item.confirmation_id}
                          onClick={() => resolve(item, true)}
                          style={{ color: "var(--accent-green)" }}
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
