"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Wifi,
  WifiOff,
  Wallet,
} from "lucide-react";
import type { SimulatorAccount } from "@/lib/api";
import { formatAmount } from "@/lib/utils";

export interface PayResult {
  ok: boolean;
  message: string;
}

interface UpiPhoneProps {
  account: SimulatorAccount | null;
  connected: boolean;
  busy?: boolean;
  lastResult?: PayResult | null;
  onPay: (amount: number) => void | Promise<void>;
}

export function UpiPhone({
  account,
  connected,
  busy,
  lastResult,
  onPay,
}: UpiPhoneProps) {
  const [amount, setAmount] = useState("");

  const qrValue = useMemo(
    () =>
      account
        ? `upi://pay?pa=${encodeURIComponent(account.upi_id)}&pn=${encodeURIComponent(
            account.name,
          )}&cu=INR`
        : "",
    [account],
  );

  const numeric = parseFloat(amount);

  const submit = async () => {
    if (!account || !numeric || numeric <= 0 || busy) return;
    await onPay(numeric);
    setAmount("");
  };

  return (
    <div
      className="relative mx-auto"
      style={{ width: 292, paddingBottom: 14, perspective: 1200 }}
    >
      {/* Outer bezel */}
      <div
        style={{
          position: "relative",
          borderRadius: 44,
          padding: 10,
          background:
            "linear-gradient(160deg, rgba(139,92,246,0.55), rgba(0,229,255,0.28) 45%, rgba(255,61,113,0.35))",
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        }}
      >
        {/* Screen */}
        <div
          style={{
            borderRadius: 34,
            overflow: "hidden",
            background: "linear-gradient(180deg, #0b0f19 0%, #101523 100%)",
            border: "1px solid var(--border)",
            position: "relative",
          }}
        >
          {/* Notch */}
          <div
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 110,
              height: 22,
              borderRadius: 12,
              background: "#000",
              zIndex: 30,
            }}
          />
          {/* Status bar */}
          <div
            className="flex items-center justify-between px-6 pt-9 pb-2"
            style={{ fontSize: 10, color: "var(--text-muted)" }}
          >
            <span style={{ fontFamily: "JetBrains Mono, monospace" }}>
              9:41
            </span>
            <div className="flex items-center gap-1">
              {connected ? (
                <Wifi size={10} style={{ color: "var(--accent-green)" }} />
              ) : (
                <WifiOff size={10} style={{ color: "var(--accent-amber)" }} />
              )}
              <span style={{ fontFamily: "JetBrains Mono, monospace" }}>
                5G
              </span>
            </div>
          </div>

          <div className="px-4 pt-2 pb-4 space-y-3">
            {/* App header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    background:
                      "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 11,
                  }}
                >
                  P
                </div>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Payz</span>
              </div>
              <div
                className="flex items-center gap-1"
                style={{ fontSize: 9, color: "var(--accent-green)" }}
              >
                <div className="live-dot" />
                LIVE
              </div>
            </div>

            {/* Account card */}
            <div
              className="p-3"
              style={{
                borderRadius: 18,
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.22), rgba(0,229,255,0.10))",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: account?.avatar_color ?? "#333",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 14,
                    color: "#0b0f19",
                    flexShrink: 0,
                  }}
                >
                  {(account?.name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {account?.name ?? "—"}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "var(--text-muted)",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    {account?.upi_id ?? "—"} · {account?.city ?? "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 9,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Balance
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      fontFamily: "JetBrains Mono, monospace",
                      color: "var(--accent-green)",
                    }}
                  >
                    {account ? formatAmount(account.balance) : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* QR code */}
            <div className="flex flex-col items-center gap-2">
              <div
                style={{
                  padding: 12,
                  borderRadius: 18,
                  background: "#ffffff",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                <QRCodeSVG
                  value={qrValue || "upi://pay"}
                  size={150}
                  fgColor="#0b0f19"
                  bgColor="#ffffff"
                  level="M"
                />
              </div>
              <span
                style={{
                  fontSize: 9,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                Scan to pay · {account?.account_id ?? ""}
              </span>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-3 gap-2">
              {[500, 1000, 5000].map((v) => (
                <button
                  key={v}
                  className="btn-ghost"
                  onClick={() => setAmount(String(v))}
                  style={{
                    padding: "6px 0",
                    fontSize: 11,
                    fontFamily: "JetBrains Mono, monospace",
                    background: numeric === v ? "rgba(0,229,255,0.16)" : undefined,
                    borderColor:
                      numeric === v ? "rgba(0,229,255,0.36)" : undefined,
                    color: numeric === v ? "var(--accent-blue)" : undefined,
                  }}
                >
                  ₹{v / 1000}K
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div className="flex items-center gap-2">
              <Wallet size={14} style={{ color: "var(--text-muted)" }} />
              <input
                className="input-dark"
                type="number"
                min={1}
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                style={{ flex: 1, fontFamily: "JetBrains Mono, monospace" }}
              />
            </div>

            {/* Pay button */}
            <button
              className="btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "12px 0",
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 700,
              }}
              onClick={submit}
              disabled={!account || !numeric || busy}
            >
              {busy ? (
                <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
              ) : (
                <ArrowUpRight size={15} />
              )}
              {busy ? "Sending..." : `Pay ${numeric ? `₹${numeric.toLocaleString("en-IN")}` : ""}`}
            </button>

            {/* Result toast */}
            <AnimatePresence>
              {lastResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: 12,
                    fontSize: 11,
                    borderLeft: `3px solid ${
                      lastResult.ok ? "var(--accent-green)" : "var(--accent-red)"
                    }`,
                    background: lastResult.ok
                      ? "rgba(34,197,94,0.08)"
                      : "rgba(255,61,87,0.08)",
                  }}
                >
                  {lastResult.ok ? (
                    <CheckCircle2 size={14} style={{ color: "var(--accent-green)" }} />
                  ) : (
                    <XCircle size={14} style={{ color: "var(--accent-red)" }} />
                  )}
                  <span style={{ color: "var(--text-secondary)" }}>
                    {lastResult.message}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Balance hint */}
            <div
              className="flex items-center justify-center gap-1"
              style={{ fontSize: 9, color: "var(--text-muted)" }}
            >
              <ArrowDownLeft size={10} />
              Receive with {account?.mobile ?? "—"} UPI
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
