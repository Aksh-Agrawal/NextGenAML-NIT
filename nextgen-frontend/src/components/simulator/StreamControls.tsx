"use client";

import { useState } from "react";
import { Play, Pause, Square, RotateCcw, Loader2 } from "lucide-react";
import type { SimulatorStreamState } from "@/lib/api";

interface StreamControlsProps {
  status: SimulatorStreamState | null;
  tpsOptions: number[];
  presets: { name: string; label: string }[];
  onAction: (
    action: "start" | "pause" | "resume" | "stop",
    tps: number,
    preset: string,
  ) => void;
  busy?: boolean;
}

export function StreamControls({
  status,
  tpsOptions,
  presets,
  onAction,
  busy,
}: StreamControlsProps) {
  const [tps, setTps] = useState(5);
  const [preset, setPreset] = useState<string>("");

  const state = status?.state ?? "idle";

  const button = (
    action: "start" | "pause" | "resume" | "stop",
    icon: React.ReactNode,
    label: string,
    primary = false,
    disabled = false,
  ) => (
    <button
      key={action}
      className={primary ? "btn-primary" : "btn-ghost"}
      style={{
        padding: "7px 12px",
        fontSize: 11,
        justifyContent: "center",
        opacity: disabled || busy ? 0.5 : 1,
      }}
      disabled={disabled || busy}
      onClick={() => onAction(action, tps, preset)}
    >
      {busy && action === "start" ? (
        <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />
      ) : (
        icon
      )}
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
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
            Preset
          </label>
          <select
            className="select-dark"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            style={{ fontSize: 12 }}
          >
            <option value="">Random</option>
            {presets.map((p) => (
              <option key={p.name} value={p.name}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
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
            TPS
          </label>
          <select
            className="select-dark"
            value={tps}
            onChange={(e) => setTps(Number(e.target.value))}
            style={{ fontSize: 12 }}
          >
            {tpsOptions.map((t) => (
              <option key={t} value={t}>
                {t} tx/s
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {state === "running" || state === "paused" ? (
          <>
            {state === "running" && button("pause", <Pause size={12} />, "Pause")}
            {state === "paused" && button("resume", <Play size={12} />, "Resume")}
            {button("stop", <Square size={12} />, "Stop", false, busy)}
          </>
        ) : (
          <>
            {button("start", <Play size={12} />, "Start", true, busy)}
            {button(
              "stop",
              <RotateCcw size={12} />,
              "Reset",
              false,
              state === "idle",
            )}
          </>
        )}
      </div>

      <div
        className="flex items-center gap-2"
        style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace" }}
      >
        <span
          className="live-dot"
          style={{
            background:
              state === "running" ? "var(--accent-green)" : "var(--text-muted)",
            boxShadow:
              state === "running" ? "0 0 6px var(--accent-green)" : "none",
          }}
        />
        {state.toUpperCase()}
        {status && state === "running" && (
          <>
            <span style={{ color: "var(--border)" }}>·</span>
            tps {status.tps}
            <span style={{ color: "var(--border)" }}>·</span>
            processed {status.processed}
          </>
        )}
        {preset && state === "running" && (
          <>
            <span style={{ color: "var(--border)" }}>·</span>
            {preset}
          </>
        )}
      </div>
    </div>
  );
}
