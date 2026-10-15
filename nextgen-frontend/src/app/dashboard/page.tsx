"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, Variants } from "framer-motion";
import CountUp from "react-countup";
import {
  Users,
  ArrowLeftRight,
  AlertTriangle,
  Cpu,
  TrendingUp,
  Upload,
  FileUp,
  Database,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { formatAmount, formatNumber, getRiskFromScore } from "@/lib/utils";
import {
  RiskBadge,
  ProbabilityBar,
  LoadingState,
  ErrorCard,
} from "@/components/ui";
import { MiniGraph } from "@/components/MiniGraph";
import { useEffect, useRef, useState } from "react";

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<string | null>(null);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["graphStats"],
    queryFn: api.graphStats,
    refetchInterval: 30_000,
  });

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard,
    refetchInterval: 30_000,
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["alerts", 0.5],
    queryFn: () => api.alerts(0.5, 50),
    refetchInterval: 5_000,
    staleTime: 0,
  });

  const {
    data: uploadStatus,
    isLoading: uploadStatusLoading,
    refetch: refetchUploadStatus,
  } = useQuery({
    queryKey: ["uploadStatus"],
    queryFn: api.uploadStatus,
    refetchInterval: 30_000,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      api.uploadTransactions(file, ({ percent, message }) => {
        setUploadProgress(percent);
        setUploadStage(message);
      }),
    onMutate: () => {
      setUploadProgress(4);
      setUploadStage("Preparing upload...");
    },
    onSuccess: async (response) => {
      setUploadError(null);
      setUploadProgress(100);
      setUploadStage("Update complete");
      setUploadNotice(
        `Loaded ${response.filename} (${response.rows.toLocaleString()} rows)`,
      );
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["graphStats"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["alerts"] }),
        queryClient.invalidateQueries({ queryKey: ["health"] }),
        refetchStats(),
        refetchUploadStatus(),
      ]);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Upload failed";
      setUploadError(message);
      setUploadNotice(null);
      setUploadStage("Upload failed");
    },
  });

  const alertFeedRef = useRef<HTMLDivElement>(null);
  const [latestAlerts, setLatestAlerts] = useState<typeof alerts>([]);

  useEffect(() => {
    if (alerts.length > 0) {
      setLatestAlerts(alerts);
    }
  }, [alerts]);

  useEffect(() => {
    if (!uploadMutation.isPending || uploadProgress < 90) {
      return;
    }

    const timer = window.setInterval(() => {
      setUploadProgress((current) => (current < 96 ? current + 1 : current));
    }, 1500);

    return () => window.clearInterval(timer);
  }, [uploadMutation.isPending, uploadProgress]);

  // Build trend data for spark chart
  const trendData = dashboard?.trends
    ? Object.entries(dashboard.trends)
        .slice(-8)
        .map(([month, value]) => ({
          month,
          value: value as number,
        }))
    : Array.from({ length: 8 }, (_, i) => ({
        month: `W${i + 1}`,
        value: Math.random() * 100000,
      }));

  const auc = dashboard?.system_risk_score
    ? Number(dashboard.system_risk_score.toFixed(1))
    : 82.4;
  const aucGaugeData = [
    { name: "AUC", value: auc, fill: "var(--accent-purple)" },
  ];

  const alertRate = stats
    ? (stats.flagged_accounts / Math.max(stats.total_accounts, 1)) * 100
    : 0;
  const alertRateData = Array.from({ length: 12 }, (_, i) => ({
    t: i,
    v: Math.max(0, alertRate + (Math.random() - 0.5) * 5),
  }));

  if (statsError) {
    return (
      <div className="flex items-center justify-center h-full">
        <ErrorCard
          message="Failed to connect to backend API. Is the server running?"
          onRetry={() => refetchStats()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            System Overview
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Real-time AML monitoring · X-Bank of India
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="live-dot" />
          <span
            style={{
              fontSize: 11,
              color: "var(--accent-green)",
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 600,
            }}
          >
            LIVE
          </span>
        </div>
      </div>

      {/* CSV Upload Banner */}
      <div
        className="card p-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,229,255,0.07), rgba(139,92,246,0.08))",
        }}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3 min-w-0">
            <div className="flex items-center gap-2">
              <div
                style={{
                  padding: 8,
                  borderRadius: 10,
                  background: "rgba(0,229,255,0.12)",
                }}
              >
                <Database size={16} style={{ color: "var(--accent-blue)" }} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Upload your transaction CSV
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Replace the demo dataset with your own file. The graph,
                  alerts, and risk scores refresh after upload.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                <CheckCircle2
                  size={12}
                  style={{
                    color: uploadStatus?.loaded
                      ? "var(--accent-green)"
                      : "var(--text-muted)",
                  }}
                />
                {uploadStatusLoading
                  ? "Checking dataset..."
                  : uploadStatus?.loaded
                    ? `${uploadStatus.rows.toLocaleString()} rows loaded`
                    : "No uploaded dataset yet"}
              </span>
              {uploadStatus?.accounts != null && (
                <span
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {uploadStatus.accounts.toLocaleString()} accounts ·{" "}
                  {uploadStatus.edges.toLocaleString()} edges
                </span>
              )}
              {uploadStatus?.columns?.length ? (
                <span
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {uploadStatus.columns.join(", ")}
                </span>
              ) : null}
            </div>

            {uploadNotice && (
              <div
                className="flex items-center gap-2 text-[12px]"
                style={{ color: "var(--accent-green)" }}
              >
                <CheckCircle2 size={14} />
                {uploadNotice}
              </div>
            )}
            {uploadError && (
              <div
                className="flex items-center gap-2 text-[12px]"
                style={{ color: "var(--accent-red)" }}
              >
                <AlertCircle size={14} />
                {uploadError}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 shrink-0 min-w-[280px]">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setSelectedFile(file);
                setUploadError(null);
                setUploadNotice(null);
                setUploadProgress(0);
                setUploadStage(null);
              }}
              className="block w-full text-[12px] text-[var(--text-secondary)] file:mr-4 file:rounded-lg file:border-0 file:bg-[rgba(255,255,255,0.08)] file:px-4 file:py-2 file:text-[12px] file:font-semibold file:text-white hover:file:bg-[rgba(255,255,255,0.12)]"
            />

            <div className="flex items-center gap-2">
              <button
                className="btn-ghost flex items-center gap-2"
                style={{ padding: "8px 12px", fontSize: 12, minWidth: 132 }}
                onClick={() => uploadMutation.mutate(selectedFile as File)}
                disabled={!selectedFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin-slow" />
                ) : (
                  <Upload size={14} />
                )}
                {uploadMutation.isPending ? "Uploading..." : "Upload CSV"}
              </button>
              {selectedFile ? (
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedFile.name}
                </span>
              ) : (
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Select a transaction file
                </span>
              )}
            </div>

            {(uploadMutation.isPending || uploadProgress > 0) && (
              <div
                className="space-y-2"
                role="status"
                aria-live="polite"
                aria-label="Upload progress"
              >
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span style={{ color: "var(--text-secondary)" }}>
                    {uploadStage ?? "Waiting to upload..."}
                  </span>
                  <span
                    className="font-mono"
                    style={{ color: "var(--accent-blue)" }}
                  >
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <div
                  className="progress-track"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(uploadProgress)}
                  role="progressbar"
                >
                  <div
                    className="progress-fill"
                    style={{
                      width: `${uploadProgress}%`,
                      background:
                        uploadError != null
                          ? "var(--accent-red)"
                          : "linear-gradient(90deg, var(--accent-blue), var(--accent-green))",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        {/* 1: Total Accounts */}
        <motion.div
          className="card p-5"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div className="flex items-start justify-between mb-3">
            <div
              style={{
                padding: 8,
                borderRadius: 8,
                background: "rgba(34,197,94,0.1)",
              }}
            >
              <Users size={16} style={{ color: "var(--accent-green)" }} />
            </div>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Accounts
            </span>
          </div>
          <div
            className="num-display"
            style={{ color: "var(--accent-green)", marginBottom: 4 }}
          >
            {statsLoading ? (
              <div className="skeleton" style={{ height: 32, width: 80 }} />
            ) : (
              <CountUp
                end={stats?.total_accounts ?? 0}
                duration={1.5}
                separator=","
              />
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Total accounts monitored
          </div>
        </motion.div>

        {/* 2: Transactions */}
        <motion.div
          className="card p-5"
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div className="flex items-start justify-between mb-3">
            <div
              style={{
                padding: 8,
                borderRadius: 8,
                background: "rgba(77,142,255,0.1)",
              }}
            >
              <ArrowLeftRight
                size={16}
                style={{ color: "var(--accent-blue)" }}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Volume
            </span>
          </div>
          <div
            className="num-display"
            style={{ color: "var(--accent-blue)", marginBottom: 4 }}
          >
            {statsLoading ? (
              <div className="skeleton" style={{ height: 32, width: 80 }} />
            ) : (
              <CountUp
                end={stats?.total_transactions ?? 0}
                duration={1.8}
                separator=","
              />
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Total: {stats ? formatAmount(stats.total_volume) : "—"}
          </div>
        </motion.div>

        {/* 3: Flagged */}
        <motion.div
          className={`card p-5 ${stats && stats.flagged_accounts > 0 ? "glow-red" : ""}`}
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          style={{
            borderColor:
              stats && stats.flagged_accounts > 0
                ? "rgba(255,61,87,0.3)"
                : undefined,
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div
              style={{
                padding: 8,
                borderRadius: 8,
                background: "rgba(255,61,87,0.1)",
              }}
            >
              <AlertTriangle size={16} style={{ color: "var(--accent-red)" }} />
            </div>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Flagged
            </span>
          </div>
          <div
            className="num-display"
            style={{ color: "var(--accent-red)", marginBottom: 4 }}
          >
            {statsLoading ? (
              <div className="skeleton" style={{ height: 32, width: 60 }} />
            ) : (
              <CountUp end={stats?.flagged_accounts ?? 0} duration={1.2} />
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {formatAmount(stats?.suspicious_volume ?? 0)} suspicious vol.
          </div>
        </motion.div>

        {/* 4: Model AUC Gauge */}
        <motion.div
          className="card p-5"
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div className="flex items-start justify-between mb-1">
            <div
              style={{
                padding: 8,
                borderRadius: 8,
                background: "rgba(167,139,250,0.1)",
              }}
            >
              <Cpu size={16} style={{ color: "var(--accent-purple)" }} />
            </div>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Model
            </span>
          </div>
          <div style={{ height: 64 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="100%"
                innerRadius="60%"
                outerRadius="100%"
                startAngle={180}
                endAngle={0}
                data={aucGaugeData}
              >
                <RadialBar
                  background={{ fill: "rgba(255,255,255,0.05)" }}
                  dataKey="value"
                  cornerRadius={4}
                  max={100}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ textAlign: "center", marginTop: -8 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "JetBrains Mono, monospace",
                color: "var(--accent-purple)",
              }}
            >
              {auc.toFixed(1)}%
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
              Model AUC Score
            </div>
          </div>
        </motion.div>

        {/* 5: Alert Rate Spark */}
        <motion.div
          className="card p-5"
          custom={4}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div className="flex items-start justify-between mb-2">
            <div
              style={{
                padding: 8,
                borderRadius: 8,
                background: "rgba(255,181,71,0.1)",
              }}
            >
              <TrendingUp size={16} style={{ color: "var(--accent-amber)" }} />
            </div>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Alert Rate
            </span>
          </div>
          <div
            className="num-display-sm"
            style={{ color: "var(--accent-amber)", marginBottom: 6 }}
          >
            <CountUp end={alertRate} duration={1.5} decimals={1} suffix="%" />
          </div>
          <div style={{ height: 40, marginBottom: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={alertRateData}
                margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
              >
                <defs>
                  <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFB547" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FFB547" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#FFB547"
                  strokeWidth={1.5}
                  fill="url(#amberGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Flagged / Total ratio
          </div>
        </motion.div>
      </div>

      {/* Main Content: Alert Feed + Graph */}
      <div className="grid grid-cols-5 gap-4" style={{ minHeight: 500 }}>
        {/* Alert Feed — 3 cols */}
        <motion.div
          className="card col-span-3 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <div className="live-dot" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                Real-Time Alert Feed
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {latestAlerts.length} alerts
            </span>
          </div>

          {/* Column Headers */}
          <div
            className="flex items-center px-5 py-2 border-b"
            style={{
              borderColor: "var(--border)",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            <span
              style={{
                flex: 2,
                fontSize: 10,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Account ID
            </span>
            <span
              style={{
                flex: 1,
                fontSize: 10,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Risk Score
            </span>
            <span
              style={{
                flex: 1,
                fontSize: 10,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Probability
            </span>
            <span
              style={{
                flex: 2,
                fontSize: 10,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Pattern
            </span>
            <span
              style={{
                flex: 1,
                fontSize: 10,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Level
            </span>
          </div>

          <div
            ref={alertFeedRef}
            style={{ flex: 1, overflowY: "auto", maxHeight: 400 }}
          >
            {alertsLoading ? (
              <LoadingState variant="skeleton" lines={6} />
            ) : latestAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <AlertTriangle
                  size={32}
                  style={{ color: "var(--text-muted)", opacity: 0.4 }}
                />
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  No alerts detected
                </span>
              </div>
            ) : (
              latestAlerts.map((alert, i) => {
                const level = getRiskFromScore(alert.risk_score);
                return (
                  <motion.div
                    key={`${alert.account_id}-${i}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i < 5 ? i * 0.04 : 0, duration: 0.25 }}
                    className="flex items-center px-5 py-3 border-b hover:bg-white hover:bg-opacity-5 cursor-pointer"
                    style={{
                      borderColor: "var(--border)",
                      borderLeft:
                        level === "critical"
                          ? "2px solid var(--accent-red)"
                          : undefined,
                      background:
                        level === "critical"
                          ? "rgba(255,61,87,0.03)"
                          : undefined,
                    }}
                  >
                    <span
                      style={{
                        flex: 2,
                        fontSize: 12,
                        fontFamily: "JetBrains Mono, monospace",
                        color: "var(--text-primary)",
                      }}
                    >
                      {alert.account_id}
                    </span>
                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          fontFamily: "JetBrains Mono, monospace",
                          color:
                            alert.risk_score >= 75
                              ? "var(--accent-red)"
                              : alert.risk_score >= 50
                                ? "var(--accent-amber)"
                                : "var(--accent-blue)",
                        }}
                      >
                        {alert.risk_score.toFixed(1)}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <ProbabilityBar value={alert.risk_score / 100} />
                    </div>
                    <span
                      style={{
                        flex: 2,
                        fontSize: 11,
                        color: "var(--text-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {alert.pattern_detected}
                    </span>
                    <div style={{ flex: 1 }}>
                      <RiskBadge level={level} size="sm" />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Mini Graph + Stats — 2 cols */}
        <div className="col-span-2 flex flex-col gap-4">
          <motion.div
            className="card flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                Network Risk Topology
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                Top 20 flagged
              </span>
            </div>
            <MiniGraph alerts={latestAlerts.slice(0, 20)} />
          </motion.div>

          {/* Risk Distribution */}
          <motion.div
            className="card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              Risk Distribution
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: "CRITICAL",
                  key: "critical",
                  color: "var(--accent-red)",
                },
                { label: "HIGH", key: "high", color: "var(--accent-amber)" },
                { label: "MEDIUM", key: "medium", color: "var(--accent-blue)" },
                { label: "LOW", key: "low", color: "var(--accent-green)" },
              ].map(({ label, key, color }) => {
                const count = stats?.risk_distribution?.[key] ?? 0;
                const total = stats?.total_accounts ?? 1;
                const pct = (count / total) * 100;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        fontFamily: "JetBrains Mono, monospace",
                        width: 52,
                      }}
                    >
                      {label}
                    </span>
                    <div className="progress-track flex-1">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "JetBrains Mono, monospace",
                        color,
                        minWidth: 24,
                        textAlign: "right",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Recent Suspicious Activity */}
      {dashboard?.recent_activity && dashboard.recent_activity.length > 0 && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              Recent Suspicious Transactions
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table-dark">
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Amount</th>
                  <th>Timestamp</th>
                  <th>Pattern</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recent_activity.slice(0, 5).map((tx) => (
                  <tr key={tx.id}>
                    <td
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 12,
                      }}
                    >
                      {tx.sender}
                    </td>
                    <td
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 12,
                      }}
                    >
                      {tx.receiver}
                    </td>
                    <td
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 12,
                        color: "var(--accent-amber)",
                      }}
                    >
                      {formatAmount(tx.amount)}
                    </td>
                    <td
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 11,
                        color: "var(--text-muted)",
                      }}
                    >
                      {new Date(tx.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td
                      style={{ fontSize: 12, color: "var(--text-secondary)" }}
                    >
                      {tx.pattern}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
