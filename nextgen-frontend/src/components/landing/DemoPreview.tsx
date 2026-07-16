"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DEMO_ALERTS } from "@/lib/landing-data";

const TABS = ["Fund Flow Graph", "Alert Triage", "SAR Report"];

const RISK_COLORS: Record<
  string,
  { bg: string; border: string; color: string }
> = {
  CRITICAL: {
    bg: "rgba(255,61,113,0.12)",
    border: "rgba(255,61,113,0.24)",
    color: "#FF3D71",
  },
  HIGH: {
    bg: "rgba(255,170,0,0.12)",
    border: "rgba(255,170,0,0.24)",
    color: "#FFAA00",
  },
  MEDIUM: {
    bg: "rgba(0,229,255,0.12)",
    border: "rgba(0,229,255,0.24)",
    color: "#00E5FF",
  },
  LOW: {
    bg: "rgba(0,230,118,0.1)",
    border: "rgba(0,230,118,0.22)",
    color: "#00E676",
  },
};

// Simplified SVG graph for fund flow panel
function MiniNetworkGraph() {
  const nodes = [
    { id: 0, x: 80, y: 80, flagged: false },
    { id: 1, x: 200, y: 60, flagged: true },
    { id: 2, x: 310, y: 100, flagged: false },
    { id: 3, x: 270, y: 200, flagged: true },
    { id: 4, x: 150, y: 190, flagged: false },
    { id: 5, x: 60, y: 200, flagged: false },
    { id: 6, x: 380, y: 180, flagged: true },
    { id: 7, x: 220, y: 280, flagged: false },
  ];
  const edges = [
    { a: 0, b: 1, red: false },
    { a: 1, b: 2, red: true },
    { a: 2, b: 3, red: true },
    { a: 3, b: 1, red: true },
    { a: 4, b: 5, red: false },
    { a: 3, b: 6, red: false },
    { a: 4, b: 1, red: false },
    { a: 7, b: 3, red: false },
    { a: 5, b: 0, red: false },
  ];
  return (
    <svg viewBox="0 0 440 310" style={{ width: "100%", height: "100%" }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {edges.map((e, i) => (
        <line
          key={i}
          x1={nodes[e.a].x}
          y1={nodes[e.a].y}
          x2={nodes[e.b].x}
          y2={nodes[e.b].y}
          stroke={e.red ? "#FF3D71" : "rgba(183,194,214,0.42)"}
          strokeOpacity={e.red ? 0.8 : 0.2}
          strokeWidth={e.red ? 1.5 : 1}
          filter={e.red ? "url(#glow)" : undefined}
        />
      ))}
      {nodes.map((n) => (
        <g key={n.id}>
          {n.flagged && (
            <circle
              cx={n.x}
              cy={n.y}
              r="14"
              fill="rgba(255,61,113,0.08)"
              stroke="rgba(255,61,113,0.24)"
              strokeWidth="1"
            />
          )}
          <circle
            cx={n.x}
            cy={n.y}
            r={n.flagged ? 8 : 6}
            fill={n.flagged ? "rgba(255,61,113,0.6)" : "#D6E4FF"}
            stroke={n.flagged ? "#FF3D71" : "rgba(0,229,255,0.32)"}
            strokeWidth="1.5"
            filter={n.flagged ? "url(#glow)" : undefined}
          />
        </g>
      ))}
    </svg>
  );
}

const SAR_XML = `<?xml version="1.0" encoding="UTF-8"?>
<FIU-IND_ARF_Report xmlns="http://fiu.gov.in/schema">
  <ReportHeader>
    <ReportType>ARF</ReportType>
    <ReportDate>2026-03-13</ReportDate>
    <ReportingEntity>Union Bank of India</ReportingEntity>
  </ReportHeader>
  <SuspiciousTransaction>
    <AccountID>ACCT-8921</AccountID>
    <RiskScore>0.93</RiskScore>
    <Typologies>
      <Typology>Circular Round-Trip (3-hop)</Typology>
      <Typology>Rapid Layering</Typology>
    </Typologies>
    <TransactionAmount currency="INR">37400</TransactionAmount>
    <NarrativeReport>
      The account ACCT-8921 exhibits patterns consistent
      with circular money flow through 3-hop cycle involving
      accounts ACCT-4512 and ACCT-9981. LineMVGNN model
      confidence: 93%. Recommended action: Freeze and
      report to FIU-IND within 7 days.
    </NarrativeReport>
  </SuspiciousTransaction>
</FIU-IND_ARF_Report>`;

function FundFlowPanel() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr 220px",
        height: "100%",
        gap: 0,
        background: "var(--bg-base)",
      }}
    >
      {/* Account list */}
      <div
        style={{
          borderRight: "1px solid var(--border)",
          padding: "12px 0",
          overflowY: "auto",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div
          style={{
            padding: "6px 12px",
            fontSize: "9px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono), monospace",
            letterSpacing: "1.5px",
            marginBottom: "4px",
          }}
        >
          ACCOUNTS
        </div>
        {DEMO_ALERTS.map((a) => {
          const rc = RISK_COLORS[a.risk];
          return (
            <div
              key={a.id}
              style={{
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono), monospace",
                  color: "var(--text-primary)",
                }}
              >
                {a.id}
              </span>
              <span
                style={{
                  fontSize: "9px",
                  fontFamily: "monospace",
                  padding: "2px 6px",
                  borderRadius: "999px",
                  background: rc.bg,
                  border: `1px solid ${rc.border}`,
                  color: rc.color,
                }}
              >
                {a.risk}
              </span>
            </div>
          );
        })}
      </div>

      {/* Graph */}
      <div
        style={{
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at center, rgba(0,229,255,0.05), rgba(11,15,25,0.9))",
        }}
      >
        <MiniNetworkGraph />
      </div>

      {/* Detail panel */}
      <div
        style={{
          borderLeft: "1px solid var(--border)",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div
          style={{
            fontSize: "9px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono), monospace",
            letterSpacing: "1px",
          }}
        >
          ACCOUNT DETAIL
        </div>
        <div
          style={{
            fontSize: "14px",
            fontFamily: "var(--font-mono), monospace",
            color: "var(--text-primary)",
            fontWeight: 600,
          }}
        >
          ACCT-8921
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(255,61,113,0.12)",
            border: "1px solid rgba(255,61,113,0.28)",
            borderRadius: "6px",
            padding: "4px 10px",
            fontSize: "11px",
            color: "#FF3D71",
            fontFamily: "var(--font-mono), monospace",
            fontWeight: 600,
            width: "fit-content",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#FF3D71",
              animation: "demoPulse 2s infinite",
            }}
          />
          CRITICAL
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {[
            { label: "Fraud Prob", value: "93%", color: "#FF3D71" },
            { label: "Circular", value: "0.91", color: "#00E5FF" },
            { label: "Layering", value: "0.87", color: "#FFAA00" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                {s.label}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: s.color,
                  fontFamily: "monospace",
                  fontWeight: 600,
                }}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>
        <div style={{ height: "1px", background: "var(--border)" }} />
        <button
          style={{
            background: "rgba(255,61,113,0.12)",
            border: "1px solid rgba(255,61,113,0.28)",
            color: "#FF3D71",
            borderRadius: "8px",
            padding: "7px 12px",
            fontSize: "11px",
            fontFamily: "monospace",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Investigate →
        </button>
      </div>
    </div>
  );
}

function AlertTriagePanel() {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
          minWidth: "600px",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {[
              "Account ID",
              "Risk",
              "Probability",
              "Patterns",
              "Amount",
              "Action",
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontSize: "9px",
                  fontFamily: "monospace",
                  color: "var(--text-muted)",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DEMO_ALERTS.map((a, i) => {
            const rc = RISK_COLORS[a.risk];
            return (
              <tr
                key={a.id}
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: i === 0 ? "rgba(255,61,113,0.04)" : "transparent",
                  borderLeft:
                    i === 0 ? "2px solid #FF3D71" : "2px solid transparent",
                }}
              >
                <td
                  style={{
                    padding: "11px 14px",
                    fontFamily: "var(--font-mono), monospace",
                    color: "var(--text-primary)",
                    fontWeight: 500,
                  }}
                >
                  {a.id}
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <span
                    style={{
                      fontSize: "9px",
                      fontFamily: "var(--font-mono), monospace",
                      padding: "3px 8px",
                      borderRadius: "999px",
                      background: rc.bg,
                      border: `1px solid ${rc.border}`,
                      color: rc.color,
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {a.risk}
                  </span>
                </td>
                <td style={{ padding: "11px 14px", minWidth: "110px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: "4px",
                        background: "rgba(183,194,214,0.16)",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${a.prob}%`,
                          height: "100%",
                          background: a.probColor,
                          borderRadius: "2px",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        color: a.probColor,
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      {a.prob}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <div
                    style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}
                  >
                    {a.patterns.map((p) => (
                      <span
                        key={p}
                        style={{
                          fontSize: "9px",
                          fontFamily: "var(--font-mono), monospace",
                          padding: "2px 6px",
                          borderRadius: "999px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid var(--border)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    fontFamily: "var(--font-mono), monospace",
                    color: "var(--text-primary)",
                  }}
                >
                  {a.amount}
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <button
                    style={{
                      background:
                        a.risk === "CRITICAL" || a.risk === "HIGH"
                          ? rc.bg
                          : "rgba(255,255,255,0.04)",
                      border: `1px solid ${a.risk === "CRITICAL" || a.risk === "HIGH" ? rc.border : "var(--border)"}`,
                      color:
                        a.risk === "CRITICAL" || a.risk === "HIGH"
                          ? rc.color
                          : "var(--text-secondary)",
                      borderRadius: "999px",
                      padding: "5px 10px",
                      fontSize: "10px",
                      fontFamily: "var(--font-mono), monospace",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {a.risk === "CRITICAL" || a.risk === "HIGH"
                      ? "Investigate"
                      : "Review"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SARReportPanel() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        height: "100%",
        gap: 0,
        background: "var(--bg-base)",
      }}
    >
      {/* Form */}
      <div
        style={{
          borderRight: "1px solid var(--border)",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div
          style={{
            fontSize: "9px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono), monospace",
            letterSpacing: "1.5px",
          }}
        >
          SAR REPORT GENERATOR
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label
            style={{
              fontSize: "10px",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            Account ID
          </label>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "7px 10px",
              fontSize: "12px",
              fontFamily: "var(--font-mono), monospace",
              color: "var(--text-primary)",
            }}
          >
            ACCT-8921
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label
            style={{
              fontSize: "10px",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            Typologies
          </label>
          {["Circular Round-Trip", "Rapid Layering"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "11px",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "3px",
                  background: "rgba(0,229,255,0.18)",
                  border: "1px solid rgba(0,229,255,0.32)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "8px", color: "#00E5FF" }}>✓</span>
              </div>
              {t}
            </div>
          ))}
        </div>
        <button
          style={{
            background: "linear-gradient(135deg, #00e5ff, #2979ff)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "9px 14px",
            fontSize: "11px",
            fontFamily: "var(--font-mono), monospace",
            fontWeight: 600,
            cursor: "pointer",
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          ⚡ Generate Report
        </button>
      </div>

      {/* XML Preview */}
      <div
        style={{
          padding: "16px",
          overflowY: "auto",
          background: "rgba(255,255,255,0.02)",
          fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
          fontSize: "11px",
          lineHeight: 1.7,
        }}
      >
        <div
          style={{
            marginBottom: "8px",
            fontSize: "9px",
            color: "var(--text-muted)",
            letterSpacing: "1.5px",
          }}
        >
          FIU-IND ARF XML PREVIEW
        </div>
        <pre
          style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
          {SAR_XML.split("\n").map((line, i) => {
            const tagMatch = line.match(/(<\/?[\w:-]+>?)/g);
            if (!tagMatch)
              return (
                <span key={i} style={{ color: "var(--text-secondary)" }}>
                  {line}
                  {"\n"}
                </span>
              );
            return (
              <span key={i}>
                {line.split(/(<\/?[\w:.-]+[^>]*>)/g).map((part, j) =>
                  part.startsWith("<") ? (
                    <span key={j} style={{ color: "#00E5FF" }}>
                      {part}
                    </span>
                  ) : (
                    <span key={j} style={{ color: "var(--text-secondary)" }}>
                      {part}
                    </span>
                  ),
                )}
                {"\n"}
              </span>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

export function DemoPreview() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section
      id="demo"
      style={{ padding: "100px 32px", maxWidth: "1280px", margin: "0 auto" }}
    >
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", marginBottom: "48px" }}
      >
        <p
          style={{
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
            color: "#00E676",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Live Platform
        </p>
        <h2
          style={{
            fontSize: "clamp(28px, 3.5vw, 42px)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.5px",
            marginBottom: "14px",
          }}
        >
          See it in action
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            lineHeight: 1.65,
          }}
        >
          Fund flow visualization · Alert triage · SAR report generation
        </p>
      </motion.div>

      {/* Browser mockup */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          borderRadius: "20px",
          border: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          overflow: "hidden",
          boxShadow:
            "0 0 80px rgba(0,229,255,0.08), 0 0 200px rgba(0,229,255,0.04)",
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            height: "38px",
            background: "rgba(11,15,25,0.96)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            gap: "10px",
          }}
        >
          {/* Traffic lights */}
          <div style={{ display: "flex", gap: "6px" }}>
            {["#FF3D71", "#FFAA00", "#00E676"].map((c) => (
              <div
                key={c}
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: c,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
          {/* URL bar */}
          <div
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              height: "22px",
              display: "flex",
              alignItems: "center",
              paddingLeft: "10px",
              gap: "6px",
              maxWidth: "380px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#00E676",
                opacity: 0.8,
              }}
            />
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              localhost:3000 — NextGenAML Dashboard
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                padding: "10px 20px",
                fontSize: "11px",
                fontFamily: "var(--font-mono), monospace",
                color:
                  activeTab === i
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                background:
                  activeTab === i ? "rgba(255,255,255,0.03)" : "transparent",
                border: "none",
                borderBottom:
                  activeTab === i
                    ? "2px solid var(--accent-blue)"
                    : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div style={{ height: "360px", overflow: "hidden" }}>
          {activeTab === 0 && <FundFlowPanel />}
          {activeTab === 1 && <AlertTriagePanel />}
          {activeTab === 2 && <SARReportPanel />}
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes demoPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 61, 113, 0.5);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(255, 61, 113, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 61, 113, 0);
          }
        }
      `}</style>
    </section>
  );
}
