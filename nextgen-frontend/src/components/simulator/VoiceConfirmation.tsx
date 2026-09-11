"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Ban,
  Check,
  Mic,
  Phone,
  PhoneCall,
  ShieldAlert,
  Volume2,
  X,
} from "lucide-react";
import type { VoiceConfirmation } from "@/lib/api";
import { formatAmount } from "@/lib/utils";

interface VoiceConfirmationProps {
  confirmation: VoiceConfirmation;
  busy?: boolean;
  onDecision: (confirmed: boolean, transcript: string) => void | Promise<void>;
  onDismiss?: () => void;
}

export function VoiceConfirmation({
  confirmation,
  busy,
  onDecision,
  onDismiss,
}: VoiceConfirmationProps) {
  const [answered, setAnswered] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");

  const tx = confirmation.transaction;
  const prompt = confirmation.prompt;
  const isMock = !confirmation.call_sid || confirmation.call_sid.startsWith("MOCK-");

  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(prompt);
    utterance.lang = "hi-IN";
    utterance.rate = 0.95;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (answered) speak();
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 25,
        background:
          "linear-gradient(180deg, rgba(11,15,25,0.98), rgba(17,24,39,0.98))",
        padding: "54px 16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {onDismiss && (
        <button
          className="btn-icon"
          onClick={onDismiss}
          title="Close"
          style={{ position: "absolute", right: 14, top: 36, padding: 5 }}
        >
          <X size={12} />
        </button>
      )}

      <div style={{ textAlign: "center" }}>
        <motion.div
          className="animate-ring-pulse-blue"
          style={{
            width: 62,
            height: 62,
            margin: "0 auto 10px",
            borderRadius: "50%",
            background: "rgba(0,229,255,0.12)",
            border: "1px solid rgba(0,229,255,0.32)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-blue)",
          }}
        >
          {answered ? <PhoneCall size={24} /> : <Phone size={24} />}
        </motion.div>
        <div style={{ fontSize: 13, fontWeight: 800 }}>Bank Verification Call</div>
        <div
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            fontFamily: "JetBrains Mono, monospace",
            marginTop: 2,
          }}
        >
          {confirmation.customer_name} · attempt {confirmation.attempts || 1}
        </div>
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 10,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div className="flex items-center gap-2" style={{ marginBottom: 7 }}>
          <ShieldAlert size={13} style={{ color: "var(--accent-amber)" }} />
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
            Fraud probability {confirmation.tx_risk.score.toFixed(1)}%
          </span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent-amber)" }}>
          {formatAmount(tx.amount)}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          {tx.sender} to {tx.receiver}
        </div>
      </div>

      {!isMock ? (
        <div style={{ marginTop: "auto", textAlign: "center", color: "var(--accent-blue)", fontSize: 13 }}>
          <div style={{ marginBottom: 16 }}>Calling {confirmation.customer_phone}...</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>
            Please check your phone and answer the call to authorize this transaction.
          </div>
          {onDismiss && (
            <button className="btn-ghost" onClick={onDismiss} style={{ width: "100%", justifyContent: "center" }}>
              Dismiss
            </button>
          )}
        </div>
      ) : !answered ? (
        <div className="grid grid-cols-2 gap-2" style={{ marginTop: "auto" }}>
          <button
            className="btn-danger"
            style={{ justifyContent: "center", borderRadius: 999, padding: "10px 0" }}
            onClick={() => onDecision(false, "Customer declined the verification call.")}
            disabled={busy}
          >
            <Ban size={14} />
          </button>
          <button
            className="btn-primary"
            style={{ justifyContent: "center", borderRadius: 999, padding: "10px 0" }}
            onClick={() => setAnswered(true)}
            disabled={busy}
          >
            <PhoneCall size={14} />
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 10,
              minHeight: 74,
              color: "var(--text-secondary)",
              fontSize: 10,
              lineHeight: 1.45,
              background: "rgba(0,229,255,0.05)",
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
              {speaking ? <Volume2 size={12} /> : <Mic size={12} />}
              <span style={{ color: "var(--accent-blue)", fontWeight: 700 }}>
                Sarvam AI
              </span>
            </div>
            {prompt}
          </div>
          <textarea
            className="input-dark"
            placeholder="Customer response"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            style={{ minHeight: 58, resize: "none", fontSize: 11 }}
          />
          <div className="grid grid-cols-2 gap-2" style={{ marginTop: "auto" }}>
            <button
              className="btn-danger"
              style={{ justifyContent: "center", padding: "9px 0" }}
              onClick={() => onDecision(false, transcript || "No, hold this transaction.")}
              disabled={busy}
            >
              <Ban size={13} />
              Hold
            </button>
            <button
              className="btn-primary"
              style={{ justifyContent: "center", padding: "9px 0" }}
              onClick={() => onDecision(true, transcript || "Yes, continue this transaction.")}
              disabled={busy}
            >
              <Check size={13} />
              Proceed
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
