"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import type { SimulatorPresetInfo } from "@/lib/api";

interface PresetPickerProps {
  presets: SimulatorPresetInfo[];
  busy?: boolean;
  onRun: (preset: string) => void;
}

export function PresetPicker({ presets, busy, onRun }: PresetPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((p, i) => (
        <motion.button
          key={p.name}
          className="btn-ghost"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          disabled={busy}
          onClick={() => onRun(p.name)}
          title={`Inject a "${p.label}" transaction now`}
          style={{
            padding: "6px 12px",
            fontSize: 11,
            opacity: busy ? 0.6 : 1,
            textTransform: "capitalize",
          }}
        >
          <Zap size={11} style={{ color: "var(--accent-amber)" }} />
          {p.label}
        </motion.button>
      ))}
    </div>
  );
}
