"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Download,
  Copy,
  FileText,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import xml from "react-syntax-highlighter/dist/esm/languages/hljs/xml";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { api } from "@/lib/api";
import { RiskBadge } from "@/components/ui";
import { getRiskFromScore } from "@/lib/utils";

SyntaxHighlighter.registerLanguage("xml", xml);

const TYPOLOGIES = [
  "Rapid Layering",
  "Circular Flows",
  "Structuring / Smurfing",
  "Dormant Account Activation",
  "KYC Mismatch",
  "Cross-Border Transfers",
  "Shell Account Network",
];

function generateXML(
  report: {
    report_id: string;
    account_id: string;
    risk_score: number;
    report_text: string;
  },
  typologies: string[],
): string {
  const now = new Date();
  return `<?xml version="1.0" encoding="UTF-8"?>
<FIUINDReport xmlns="http://www.fiuindia.gov.in/ARF/1.0"
              version="1.0"
              reportingDate="${now.toISOString().split("T")[0]}">
  
  <ReportHeader>
    <ReportId>${report.report_id}</ReportId>
    <ReportType>STR</ReportType>
    <ReportingDate>${now.toISOString()}</ReportingDate>
    <ReportingEntity>X-Bank of India</ReportingEntity>
    <FIURegNo>FIU-IND-UBOI-2024</FIURegNo>
    <SystemVersion>NextGenAML v1.0</SystemVersion>
  </ReportHeader>

  <SubjectInformation>
    <AccountId>${report.account_id}</AccountId>
    <RiskScore>${report.risk_score.toFixed(2)}</RiskScore>
    <RiskLevel>${getRiskFromScore(report.risk_score).toUpperCase()}</RiskLevel>
  </SubjectInformation>

  <SuspiciousActivity>
    <DetectedTypologies>
${typologies.map((t) => `      <Typology>${t}</Typology>`).join("\n")}
    </DetectedTypologies>
    <DetectionMethod>Graph Neural Network + Rule-Based Engine</DetectionMethod>
    <ModelVersion>GraphSAGE v2.0</ModelVersion>
    <Confidence>${(100 - report.risk_score).toFixed(1)}%</Confidence>
  </SuspiciousActivity>

  <Narrative>
    <![CDATA[
${report.report_text}
    ]]>
  </Narrative>

  <ReportFooter>
    <GeneratedBy>NextGenAML Automated System</GeneratedBy>
    <GeneratedAt>${now.toISOString()}</GeneratedAt>
    <Signature>AUTO-GENERATED</Signature>
  </ReportFooter>

</FIUINDReport>`;
}

function SARReportForm() {
  const searchParams = useSearchParams();
  const prefilledId = searchParams.get("accountId") ?? "";

  const [accountId, setAccountId] = useState(prefilledId);
  const [bankName, setBankName] = useState("X-Bank of India");
  const [fiuReg, setFiuReg] = useState("FIU-IND-UBOI-2024");
  const [selectedTypologies, setSelectedTypologies] = useState<Set<string>>(
    new Set(["Rapid Layering", "Structuring / Smurfing"]),
  );
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{
    report_id: string;
    account_id: string;
    risk_score: number;
    report_text: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showXML, setShowXML] = useState(false);
  const [copied, setCopied] = useState(false);
  const [xmlCopied, setXmlCopied] = useState(false);

  useEffect(() => {
    if (prefilledId) setAccountId(prefilledId);
  }, [prefilledId]);

  const handleGenerate = async () => {
    if (!accountId.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const result = await api.generateReport(accountId.trim());
      setReport(result);
    } catch (err: any) {
      setError(err.message ?? "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const toggleTypology = (t: string) => {
    const s = new Set(selectedTypologies);
    s.has(t) ? s.delete(t) : s.add(t);
    setSelectedTypologies(s);
  };

  const xmlContent = report
    ? generateXML(report, Array.from(selectedTypologies))
    : "";

  const handleCopyNarrative = () => {
    if (report) {
      navigator.clipboard.writeText(report.report_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyXML = () => {
    navigator.clipboard.writeText(xmlContent);
    setXmlCopied(true);
    setTimeout(() => setXmlCopied(false), 2000);
  };

  const handleDownloadXML = () => {
    const blob = new Blob([xmlContent], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SAR-${report?.report_id ?? "report"}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>SAR Report Generator</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
          Automated Suspicious Activity Report — FIU-IND ARF/TRF XML Format
        </p>
      </div>

      <div className="flex gap-5" style={{ alignItems: "flex-start" }}>
        {/* Left: Input Form (40%) */}
        <motion.div
          className="card p-5 space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ flex: "0 0 38%" }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            Report Parameters
          </h3>

          <div>
            <label
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                display: "block",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Account ID *
            </label>
            <input
              className="input-dark"
              style={{ width: "100%" }}
              placeholder="e.g. ACCT001"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                display: "block",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Reporting Bank
            </label>
            <input
              className="input-dark"
              style={{ width: "100%" }}
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                display: "block",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              FIU-IND Registration No.
            </label>
            <input
              className="input-dark"
              style={{ width: "100%", fontFamily: "JetBrains Mono, monospace" }}
              value={fiuReg}
              onChange={(e) => setFiuReg(e.target.value)}
            />
          </div>

          {/* Typology Checkboxes */}
          <div>
            <label
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                display: "block",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Suspected Typologies
            </label>
            <div className="space-y-2">
              {TYPOLOGIES.map((t) => (
                <label
                  key={t}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid",
                    borderColor: selectedTypologies.has(t)
                      ? "rgba(167,139,250,0.4)"
                      : "var(--border)",
                    background: selectedTypologies.has(t)
                      ? "rgba(167,139,250,0.08)"
                      : "transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypologies.has(t)}
                    onChange={() => toggleTypology(t)}
                    style={{
                      accentColor: "var(--accent-purple)",
                      width: 14,
                      height: 14,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: selectedTypologies.has(t)
                        ? "var(--accent-purple)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {t}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(255,61,87,0.1)",
                border: "1px solid rgba(255,61,87,0.3)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--accent-red)",
              }}
            >
              {error}
            </div>
          )}

          <button
            className="btn-purple"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "12px 0",
              fontSize: 14,
            }}
            onClick={handleGenerate}
            disabled={loading || !accountId.trim()}
          >
            {loading ? (
              <>
                <Loader2
                  size={15}
                  style={{ animation: "spin 0.8s linear infinite" }}
                />
                Generating Report...
              </>
            ) : (
              <>
                <FileText size={15} />
                Generate SAR Report
              </>
            )}
          </button>
        </motion.div>

        {/* Right: Report Preview (60%) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card p-6 space-y-4"
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    marginBottom: 8,
                  }}
                >
                  Generating report...
                </div>
                {[100, 80, 60, 40].map((w, i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: 14, width: `${w}%` }}
                  />
                ))}
              </motion.div>
            ) : report ? (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Report Meta */}
                <div className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CheckCircle
                      size={20}
                      style={{ color: "var(--accent-green)" }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        Report Generated Successfully
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontFamily: "JetBrains Mono, monospace",
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {report.report_id}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        Account
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontFamily: "JetBrains Mono, monospace",
                          color: "var(--text-primary)",
                        }}
                      >
                        {report.account_id}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        Risk Score
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontFamily: "JetBrains Mono, monospace",
                          color:
                            getRiskFromScore(report.risk_score) === "critical"
                              ? "var(--accent-red)"
                              : "var(--accent-amber)",
                        }}
                      >
                        {report.risk_score.toFixed(1)}/100
                      </div>
                    </div>
                    <RiskBadge level={getRiskFromScore(report.risk_score)} />
                  </div>
                </div>

                {/* Narrative */}
                <div
                  className="card"
                  style={{ borderLeft: "4px solid var(--accent-purple)" }}
                >
                  <div
                    className="flex items-center justify-between px-5 py-3 border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      SAR Narrative
                    </span>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: 12, padding: "4px 10px" }}
                      onClick={handleCopyNarrative}
                    >
                      {copied ? (
                        <CheckCircle
                          size={13}
                          style={{ color: "var(--accent-green)" }}
                        />
                      ) : (
                        <Copy size={13} />
                      )}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="p-5">
                    <pre className="sar-prose">{report.report_text}</pre>
                  </div>
                </div>

                {/* XML Preview */}
                <div className="card overflow-hidden">
                  <div
                    className="flex items-center justify-between px-5 py-3 border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      FIU-IND XML (ARF/TRF)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 12, padding: "4px 10px" }}
                        onClick={() => setShowXML(!showXML)}
                      >
                        {showXML ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showXML ? "Hide" : "Preview"}
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 12, padding: "4px 10px" }}
                        onClick={handleCopyXML}
                      >
                        {xmlCopied ? (
                          <CheckCircle
                            size={13}
                            style={{ color: "var(--accent-green)" }}
                          />
                        ) : (
                          <Copy size={13} />
                        )}
                        {xmlCopied ? "Copied!" : "Copy XML"}
                      </button>
                      <button
                        className="btn-primary"
                        style={{ fontSize: 12, padding: "5px 12px" }}
                        onClick={handleDownloadXML}
                      >
                        <Download size={13} />
                        Download XML
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showXML && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        style={{ overflow: "hidden" }}
                      >
                        <SyntaxHighlighter
                          language="xml"
                          style={atomOneDark}
                          customStyle={{
                            background: "var(--bg-base)",
                            fontSize: 11,
                            padding: "16px 20px",
                            margin: 0,
                            maxHeight: 400,
                            overflowY: "auto",
                          }}
                          showLineNumbers
                          lineNumberStyle={{
                            color: "var(--text-muted)",
                            fontSize: 10,
                          }}
                        >
                          {xmlContent}
                        </SyntaxHighlighter>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between px-5 py-3 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "JetBrains Mono, monospace",
                        color: "var(--text-muted)",
                      }}
                    >
                      {report.report_id} · Generated{" "}
                      {new Date().toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      NextGenAML v1.0 · Auto-Generated
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card flex flex-col items-center justify-center py-20 gap-5"
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "rgba(167,139,250,0.1)",
                    border: "1px solid rgba(167,139,250,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText
                    size={28}
                    style={{ color: "var(--accent-purple)", opacity: 0.7 }}
                  />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      marginBottom: 6,
                    }}
                  >
                    No Report Generated Yet
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Enter an account ID and click "Generate SAR Report"
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function SARReportPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SARReportForm />
    </Suspense>
  );
}
