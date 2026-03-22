"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import CountUp from "react-countup";

const METRICS_DATA = [
  {
    value: 93,
    suffix: "%",
    label: "Model",
    sub: "Precision",
    accent: "#00579C",
  },
  {
    value: 12,
    suffix: "ms",
    label: "Inference",
    sub: "Latency",
    accent: "#FFB547",
  },
  { value: 5, suffix: "", label: "AML", sub: "Typologies", accent: "#003F7A" },
  {
    value: null,
    suffix: "",
    label: "FIU-IND",
    sub: "ARF/TRF XML",
    accent: "#1A7A3C",
    special: "FIU-IND",
  },
];

export function Metrics() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <section
      style={{
        background: "#FFFFFF",
        borderTop: "1px solid #CCCCCC",
        borderBottom: "1px solid #CCCCCC",
        padding: "64px 32px",
      }}
    >
      <div
        ref={ref}
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0,
        }}
        className="metrics-grid"
      >
        {METRICS_DATA.map((m, i) => (
          <div
            key={m.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 32px",
              borderRight:
                i < METRICS_DATA.length - 1 ? "1px solid #CCCCCC" : "none",
              textAlign: "center",
            }}
          >
            {/* Big number */}
            <div
              style={{
                fontSize: "clamp(36px, 4vw, 52px)",
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                color: "#333333",
                lineHeight: 1,
                marginBottom: "6px",
                letterSpacing: "-1px",
              }}
            >
              {m.value !== null ? (
                <>
                  {isInView && (
                    <CountUp start={0} end={m.value} duration={1.5} useEasing />
                  )}
                  {!isInView && "0"}
                  {m.suffix}
                </>
              ) : (
                <span style={{ color: m.accent }}>{m.special}</span>
              )}
            </div>

            {/* Colored underline */}
            <div
              style={{
                width: "32px",
                height: "2px",
                background: m.accent,
                borderRadius: "1px",
                marginBottom: "10px",
                boxShadow: `0 0 8px ${m.accent}60`,
              }}
            />

            {/* Labels */}
            <p
              style={{
                fontSize: "13px",
                color: "#9299AD",
                marginBottom: "2px",
                fontWeight: 500,
              }}
            >
              {m.label}
            </p>
            <p style={{ fontSize: "12px", color: "#4A5068" }}>{m.sub}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 32px 0 !important;
          }
          .metrics-grid > div {
            border-right: none !important;
            border-bottom: 1px solid #cccccc;
            padding: 24px 16px !important;
          }
        }
        @media (max-width: 480px) {
          .metrics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
