"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  Smartphone,
  PhoneCall,
  Radio,
  PlayCircle,
  ScrollText,
  UserPlus,
} from "lucide-react";
import { api, type SimulatorStreamState, type VoiceConfirmation } from "@/lib/api";
import { useLiveTransactions } from "@/lib/useLiveTransactions";
import { LoadingState, ErrorCard } from "@/components/ui";
import { UpiPhone, type PayResult } from "@/components/simulator/UpiPhone";
import { LiveStats } from "@/components/simulator/LiveStats";
import { LiveGraph } from "@/components/simulator/LiveGraph";
import { LiveTimeline } from "@/components/simulator/LiveTimeline";
import { StreamControls } from "@/components/simulator/StreamControls";
import { PresetPicker } from "@/components/simulator/PresetPicker";
import { HistoryTable } from "@/components/simulator/HistoryTable";
import { AlertToast } from "@/components/simulator/AlertToast";

export default function SimulatorPage() {
  const {
    txns,
    stats,
    connected,
    latestAlert,
    delta,
    consumeLatestAlert,
  } = useLiveTransactions();

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["simulatorAccounts"],
    queryFn: api.simulatorAccounts,
    staleTime: 60_000,
  });

  const { data: presetsData, isLoading: loadingPresets } = useQuery({
    queryKey: ["simulatorPresets"],
    queryFn: api.simulatorPresets,
    staleTime: 60_000,
  });

  const [selectedId, setSelectedId] = useState<string>("");
  const [recipientId, setRecipientId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [payResult, setPayResult] = useState<PayResult | null>(null);
  const [activeVoice, setActiveVoice] = useState<VoiceConfirmation | null>(null);
  const [voiceTestId, setVoiceTestId] = useState<string>("");
  const [streamStatus, setStreamStatus] = useState<SimulatorStreamState | null>(
    null,
  );

  // Live balances: seeded once from the accounts fetch, then updated locally
  // from the transaction stream (WS push + history fallback) – no polling.
  const [balances, setBalances] = useState<Record<string, number>>({});
  const appliedTxns = useRef(new Set<string>());

  useEffect(() => {
    if (accounts.length > 0) {
      setBalances((prev) => {
        const next = { ...prev };
        for (const a of accounts) {
          if (next[a.account_id] === undefined) next[a.account_id] = a.balance;
        }
        return next;
      });
    }
  }, [accounts]);

  useEffect(() => {
    for (const t of txns) {
      const key = `${t.transaction_id}_${t.status}`;
      if (appliedTxns.current.has(key)) continue;
      appliedTxns.current.add(key);

      // Auto-dismiss Voice Auth UI if a real call resolution comes through the stream
      if (activeVoice && activeVoice.transaction_id === t.transaction_id) {
        if (t.status === "success" || t.status === "failed" || t.status === "withdrawn") {
          setActiveVoice(null);
          setPayResult({
            ok: t.status === "success",
            message:
              t.status === "success"
                ? `Voice confirmed. ₹${t.amount.toLocaleString("en-IN")} sent to ${t.receiver}`
                : t.failure_reason || "Transaction withdrawn after voice check",
          });
        }
      }

      if (t.status !== "success") continue;
      setBalances((prev) => {
        const next = { ...prev };
        if (next[t.sender] !== undefined) {
          next[t.sender] = Math.round((next[t.sender] - t.amount) * 100) / 100;
        }
        if (next[t.receiver] !== undefined) {
          next[t.receiver] = Math.round((next[t.receiver] + t.amount) * 100) / 100;
        }
        return next;
      });
    }
  }, [txns, activeVoice]);

  const displayAccounts = useMemo(
    () =>
      accounts.map((a) => ({
        ...a,
        balance: balances[a.account_id] ?? a.balance,
      })),
    [accounts, balances],
  );

  useEffect(() => {
    if (accounts.length > 0) {
      setSelectedId((cur) => cur || accounts[0].account_id);
      setRecipientId((cur) => {
        if (cur && cur !== selectedId && accounts.some((a) => a.account_id === cur)) {
          return cur;
        }
        const other = accounts.find((a) => a.account_id !== selectedId);
        return other?.account_id ?? "";
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, selectedId]);

  useEffect(() => {
    if (stats?.stream && stats.stream.state !== streamStatus?.state) {
      setStreamStatus(stats.stream);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats?.stream]);

  const selected = useMemo(
    () => displayAccounts.find((a) => a.account_id === selectedId) ?? null,
    [displayAccounts, selectedId],
  );
  const recipients = displayAccounts.filter((a) => a.account_id !== selectedId);

  const handlePay = async (amount: number) => {
    if (!selected || !recipientId) return;
    setBusy(true);
    setPayResult(null);
    try {
      const env = await api.simulatorPay({
        sender: selected.account_id,
        receiver: recipientId,
        amount,
        remark: "Phone pay",
        channel: "UPI",
      });
      if (env.transaction.status === "pending_voice_confirmation" && env.transaction.confirmation_id) {
        const confirmation = await api.voiceConfirmation(env.transaction.confirmation_id);
        setActiveVoice(confirmation);
        setPayResult({
          ok: false,
          message: `Verification call required for ₹${amount.toLocaleString("en-IN")}`,
        });
        return;
      }
      const ok = env.transaction.status === "success";
      setPayResult({
        ok,
        message: ok
          ? `₹${amount.toLocaleString("en-IN")} sent to ${recipientId}`
          : env.transaction.failure_reason || "Payment failed",
      });
    } catch (e) {
      setPayResult({ ok: false, message: `Payment error: ${String(e)}` });
    } finally {
      setBusy(false);
    }
  };


  const handleVoiceDecision = async (confirmed: boolean, transcript: string) => {
    if (!activeVoice) return;
    setBusy(true);
    try {
      const env = await api.voiceConfirm(activeVoice.confirmation_id, confirmed, transcript);
      const ok = env.transaction.status === "success";
      setPayResult({
        ok,
        message: ok
          ? `Voice confirmed. ₹${env.transaction.amount.toLocaleString("en-IN")} sent to ${env.transaction.receiver}`
          : env.transaction.failure_reason || "Transaction withdrawn after voice check",
      });
      if (ok) {
        appliedTxns.current.add(`${env.transaction.transaction_id}_${env.transaction.status}`);
        setBalances((prev) => {
          const next = { ...prev };
          if (next[env.transaction.sender] !== undefined) {
            next[env.transaction.sender] =
              Math.round((next[env.transaction.sender] - env.transaction.amount) * 100) / 100;
          }
          if (next[env.transaction.receiver] !== undefined) {
            next[env.transaction.receiver] =
              Math.round((next[env.transaction.receiver] + env.transaction.amount) * 100) / 100;
          }
          return next;
        });
      }
      setActiveVoice(null);
    } catch (e) {
      setPayResult({ ok: false, message: `Voice verification error: ${String(e)}` });
    } finally {
      setBusy(false);
    }
  };

  const handleVoiceTest = async () => {
    const senderId = voiceTestId || (accounts.length > 0 ? accounts[0].account_id : "");
    if (!senderId) return;
    const testRecipient = accounts.find((a) => a.account_id !== senderId)?.account_id;
    if (!testRecipient) return;
    setBusy(true);
    setPayResult(null);
    try {
      const env = await api.simulatorPay({
        sender: senderId,
        receiver: testRecipient,
        amount: 95001,
        remark: "Voice Test Trigger",
        channel: "UPI",
      });
      if (env.transaction.status === "pending_voice_confirmation" && env.transaction.confirmation_id) {
        const confirmation = await api.voiceConfirmation(env.transaction.confirmation_id);
        setActiveVoice(confirmation);
        setPayResult({
          ok: false,
          message: `Verification call required for ₹95,001`,
        });
      }
    } catch (e) {
      setPayResult({ ok: false, message: `Payment error: ${String(e)}` });
    } finally {
      setBusy(false);
    }
  };

  const handlePresetRun = async (preset: string) => {
    setBusy(true);
    try {
      await api.simulatorSimulate({ preset });
    } catch {
      /* ignore – stream / toast will reflect failures */
    } finally {
      setBusy(false);
    }
  };

  const handleStreamAction = async (
    action: "start" | "pause" | "resume" | "stop",
    tps: number,
    preset: string,
  ) => {
    try {
      const res = preset
        ? await api.simulatorPreset(preset, action, tps)
        : await api.simulatorStream(action, tps, preset || undefined);
      setStreamStatus(res);
    } catch {
      /* ignore */
    }
  };

  if (loadingAccounts && accounts.length === 0) {
    return <LoadingState variant="skeleton" lines={10} className="p-6" />;
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>
            UPI Transaction Simulator
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Real-time dummy payments · live fraud-scoring pipeline · WebSocket push
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="live-dot"
            style={
              connected
                ? { background: "var(--accent-green)", boxShadow: "0 0 8px var(--accent-green)" }
                : { background: "var(--accent-amber)", boxShadow: "0 0 8px var(--accent-amber)" }
            }
          />
          <span
            style={{
              fontSize: 11,
              color: connected ? "var(--accent-green)" : "var(--accent-amber)",
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 600,
            }}
          >
            {connected ? "LIVE · STREAMING" : "CONNECTING..."}
          </span>
        </div>
      </div>

      {/* Live stats */}
      <LiveStats stats={stats} />

      <div className="grid grid-cols-3 gap-4">
        {/* Left column – phone + stream */}
        <div className="space-y-4">
          <motion.div
            className="card p-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Smartphone size={14} style={{ color: "var(--accent-purple)" }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                UPI Phone
              </span>
            </div>

            {/* Sender selector */}
            <div className="mb-3">
              <label
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                }}
              >
                Paying from
              </label>
              <select
                className="select-dark"
                style={{ width: "100%" }}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {displayAccounts.length === 0 && <option value="">No accounts</option>}
                {displayAccounts.map((a) => (
                  <option key={a.account_id} value={a.account_id}>
                    {a.name} (ID: {a.account_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient selector */}
            <div className="mb-3">
              <label
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                }}
              >
                Paying to
              </label>
              <select
                className="select-dark"
                style={{ width: "100%" }}
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
              >
                {recipients.length === 0 && <option value="">No recipients</option>}
                {recipients.map((a) => (
                  <option key={a.account_id} value={a.account_id}>
                    {a.name} (ID: {a.account_id})
                  </option>
                ))}
              </select>
            </div>

            <UpiPhone
              account={selected}
              connected={connected}
              busy={busy}
              lastResult={payResult}
              voiceConfirmation={activeVoice}
              onPay={handlePay}
              onVoiceDecision={handleVoiceDecision}
              onDismissVoice={() => setActiveVoice(null)}
            />
          </motion.div>

          <motion.div
            className="card p-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Radio size={14} style={{ color: "var(--accent-blue)" }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                Stream Engine
              </span>
            </div>
            <StreamControls
              status={streamStatus ?? stats?.stream ?? null}
              tpsOptions={presetsData?.tps_options ?? [1, 5, 10, 50, 100]}
              presets={presetsData?.presets ?? []}
              onAction={handleStreamAction}
              busy={busy}
            />
          </motion.div>
        </div>

        {/* Right column – graph + timeline */}
        <div className="col-span-2 space-y-4">
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <Activity size={14} style={{ color: "var(--accent-blue)" }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Live Transaction Network
                </span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                grows with every payment
              </span>
            </div>
            <LiveGraph accounts={displayAccounts} txns={txns} delta={delta} height={360} />
          </motion.div>

          <motion.div
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <ScrollText size={14} style={{ color: "var(--accent-purple)" }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Live Timeline
                </span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {txns.length} recent
              </span>
            </div>
            <LiveTimeline txns={txns} height={280} />
          </motion.div>
        </div>
      </div>

      {/* Preset picker */}
      <motion.div
        className="card p-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <PlayCircle size={14} style={{ color: "var(--accent-amber)" }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            Inject Fraud Scenario
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              marginLeft: "auto",
            }}
          >
            fire a single preset-driven transaction through the pipeline
          </span>
        </div>
        {loadingPresets ? (
          <LoadingState variant="pulse" />
        ) : (
          <PresetPicker presets={presetsData?.presets ?? []} busy={busy} onRun={handlePresetRun} />
        )}
      </motion.div>


      {/* Voice Auth Test node */}
      <motion.div
        className="card p-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <PhoneCall size={14} style={{ color: "var(--accent-purple)" }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            Trigger Voice Call
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              marginLeft: "auto",
            }}
          >
            force a high-value transaction to test voice auth
          </span>
        </div>
        <div className="flex items-center gap-4">
          <select
            className="select-dark"
            style={{ width: "200px" }}
            value={voiceTestId || (accounts.length > 0 ? accounts[0].account_id : "")}
            onChange={(e) => setVoiceTestId(e.target.value)}
          >
            {displayAccounts.map((a) => (
              <option key={a.account_id} value={a.account_id}>
                {a.name} (ID: {a.account_id})
              </option>
            ))}
          </select>
          <button
            className="btn-primary"
            onClick={handleVoiceTest}
            disabled={busy}
          >
            Trigger Call
          </button>
        </div>
      </motion.div>

      {/* History table */}
      <motion.div
        className="card p-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <UserPlus size={14} style={{ color: "var(--accent-green)" }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            Simulator Ledger
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              marginLeft: "auto",
            }}
          >
            full history with filters + pagination
          </span>
        </div>
        <HistoryTable />
      </motion.div>

      {/* Alert toast */}
      <AlertToast alert={latestAlert} onDismiss={consumeLatestAlert} />
    </div>
  );
}
