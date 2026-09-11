/**
 * NextGenAML API Client
 * All data fetching functions connecting to the FastAPI backend.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://nextaml-iim-api.onrender.com";

// ── Types ──────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface GraphStats {
  total_accounts: number;
  total_transactions: number;
  flagged_accounts: number;
  total_volume: number;
  avg_transaction: number;
  suspicious_volume: number;
  risk_distribution: Record<string, number>;
}

export interface AlertItem {
  account_id: string;
  risk_score: number;
  pattern_detected: string;
  status: string;
  volume_30d: number;
  transaction_count: number;
}

export interface PredictionResponse {
  account_id: string;
  fraud_probability: number;
  risk_level: RiskLevel;
  confidence: number;
  attention_weights: number[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  risk: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  value: number;
  is_suspicious: boolean;
}

export interface SubgraphResponse {
  nodes: GraphNode[];
  links: GraphEdge[];
  center_account?: string;
}

export interface FlowTransaction {
  index: number;
  sender: string;
  receiver: string;
  amount: number;
  currency: string;
  timestamp: string;
  transaction_type: string;
  label: number;
}

export interface TransactionFlowResponse {
  account_id: string | null;
  transactions: FlowTransaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface ExplainResponse {
  account_id: string;
  risk_score: number;
  risk_factors: Array<{ factor: string; score: number; description: string }>;
  top_suspicious_edges: Array<{
    source: string;
    target: string;
    amount: number;
    tx_count: number;
    suspicious: boolean;
  }>;
  recommendation: string;
}

export interface PatternCycle {
  account_chain: string[];
  total_flow: number;
  cycle_length: number;
}

export interface StructuringPattern {
  sender: string;
  transactions: number;
  total_amount: number;
  avg_amount: number;
  time_window_minutes: number;
}

export interface DormantActivation {
  account_id: string;
  dormant_days: number;
  activation_amount: number;
  activation_date: string;
}

export interface DashboardMetrics {
  total_transactions: number;
  total_volume: number;
  flagged_amount: number;
  high_risk_entities: number;
  active_cases: number;
  system_risk_score: number;
  recent_activity: Array<{
    id: string;
    sender: string;
    receiver: string;
    amount: number;
    timestamp: string;
    pattern: string;
  }>;
  trends: Record<string, number>;
}

export interface MonitorResponse {
  transaction_id: string;
  status: string;
  risk_score: number;
  flags: string[];
}

export interface MonitorStats {
  total_transactions_processed: number;
  total_alerts_generated: number;
  average_risk_score: number;
  model_inference_latency_ms: number;
  uptime_seconds: number;
}

export interface ModelInfo {
  model_type: string;
  version: string;
  num_layers: number;
  input_features: number;
  fraud_threshold: number;
  training_epochs: number;
  last_trained: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface HealthResponse {
  status: string;
  version: string;
  graph_loaded: boolean;
  model_loaded: boolean;
  total_accounts: number;
  total_transactions: number;
}

// ── Simulator (real-time UPI) ──────────────────────────

export interface SimulatorAccount {
  account_id: string;
  name: string;
  mobile: string;
  upi_id: string;
  balance: number;
  risk_score: number;
  channel: string;
  city: string;
  avatar_color: string;
}

export interface SimulatorTxnRisk {
  score: number;
  level: RiskLevel;
  flags: string[];
  reason: string;
}

export interface SimulatorAlert {
  id: string;
  transaction_id: string;
  sender: string;
  receiver: string;
  amount: number;
  severity: string;
  reason: string;
  created_at: string;
}

export interface SimulatorHistoryItem {
  transaction_id: string;
  sender: string;
  receiver: string;
  amount: number;
  currency: string;
  remark: string;
  timestamp: string;
  device_id: string;
  ip: string;
  location: string;
  channel: string;
  status: string;
  failure_reason?: string | null;
  confirmation_id?: string | null;
  voice_status?: string | null;
  voice_outcome?: string | null;
  voice_notes?: string | null;
  voice_call_sid?: string | null;
  voice_prompt?: string | null;
  voice_transcript?: Array<{ speaker: string; text: string; timestamp: string }>;
  risk_score: number;
  risk_level: RiskLevel;
  flags: string[];
  reason: string;
  sender_risk: number;
  receiver_risk: number;
}

export interface SimulatorStreamState {
  state: string;
  tps: number;
  preset: string | null;
  processed: number;
}

export interface SimulatorStats {
  today_transactions: number;
  total_volume: number;
  avg_amount: number;
  risk_alerts: number;
  high_risk_accounts: number;
  active_accounts: number;
  tps: number;
  avg_risk_score: number;
  total_transactions: number;
  total_traffic_volume: number;
  stream: SimulatorStreamState;
}

export interface SimulatorGraphDelta {
  new_nodes: Array<{ id: string; label: string; risk: number }>;
  new_edges: Array<{
    source: string;
    target: string;
    amount: number;
    tx_count: number;
    is_new: boolean;
    is_suspicious: boolean;
    risk: number;
  }>;
  updated_node_ids: string[];
}

export interface LiveEnvelope {
  type: string;
  transaction: Omit<SimulatorHistoryItem, "risk_score" | "risk_level" | "flags" | "reason" | "sender_risk" | "receiver_risk">;
  risk: {
    sender?: { account_id: string; risk_score: number; status: string } | null;
    receiver?: { account_id: string; risk_score: number; status: string } | null;
  };
  tx_risk: SimulatorTxnRisk;
  alert: SimulatorAlert | null;
  graph_delta: SimulatorGraphDelta;
  stats: SimulatorStats;
}

export interface VoiceConfirmation {
  confirmation_id: string;
  transaction_id: string;
  transaction: {
    sender: string;
    receiver: string;
    amount: number;
    currency: string;
    transaction_id: string;
    timestamp: string;
  };
  tx_risk: SimulatorTxnRisk;
  customer_name: string;
  customer_phone: string;
  status: string;
  attempts: number;
  call_sid?: string | null;
  prompt: string;
  transcript: Array<{ speaker: string; text: string; timestamp: string }>;
  notes: string;
  outcome?: string | null;
  created_at: string;
  updated_at: string;
  next_retry_at?: string | null;
}

export interface VoiceStats {
  total: number;
  pending: number;
  confirmed: number;
  denied: number;
  no_answer: number;
}

export interface SimulatorPresetInfo {
  name: string;
  label: string;
}

export interface SimulatorHistoryResponse {
  items: SimulatorHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

// ── Fetch Helpers ──────────────────────────────────────

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const hasFormDataBody = options?.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(hasFormDataBody ? {} : { "Content-Type": "application/json" }),
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }
  return response.json();
}

export interface UploadStatusResponse {
  loaded: boolean;
  rows: number;
  accounts: number;
  edges: number;
  columns?: string[];
}

export interface UploadCsvResponse {
  status: string;
  filename: string;
  rows: number;
  accounts: number;
  edges: number;
}

// ── API Functions ──────────────────────────────────────

export const api = {
  health: () => fetchAPI<HealthResponse>("/health"),

  uploadStatus: () => fetchAPI<UploadStatusResponse>("/upload/status"),

  uploadTransactions: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return fetchAPI<UploadCsvResponse>("/upload/csv", {
      method: "POST",
      body: formData,
    });
  },

  graphStats: () => fetchAPI<GraphStats>("/graph/stats"),

  dashboard: () => fetchAPI<DashboardMetrics>("/dashboard"),

  alerts: (minRisk = 0.5, limit = 50) =>
    fetchAPI<AlertItem[]>("/alert", {
      method: "POST",
      body: JSON.stringify({ min_risk: minRisk, limit }),
    }),

  predict: (accountId: string) =>
    fetchAPI<PredictionResponse>("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(null), // account_id as query param
    }),

  predictQuery: (accountId: string) =>
    fetchAPI<PredictionResponse>(
      `/predict?account_id=${encodeURIComponent(accountId)}`,
      {
        method: "POST",
      },
    ),

  subgraph: (accountId: string, hops = 2) =>
    fetchAPI<SubgraphResponse>(
      `/graph/subgraph/${encodeURIComponent(accountId)}?hops=${hops}`,
    ),

  transactionFlow: (accountId?: string, limit = 200, offset = 0) => {
    const params = new URLSearchParams();
    if (accountId) params.set("account_id", accountId);
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    return fetchAPI<TransactionFlowResponse>(`/graph/flow?${params.toString()}`);
  },

  explain: (accountId: string) =>
    fetchAPI<ExplainResponse>(`/explain/${encodeURIComponent(accountId)}`),

  patternsCircular: () => fetchAPI<PatternCycle[]>("/patterns/circular"),

  patternsStructuring: () =>
    fetchAPI<StructuringPattern[]>("/patterns/structuring"),

  patternsDormant: () => fetchAPI<DormantActivation[]>("/patterns/dormant"),

  monitorTransaction: (payload: {
    sender_account: string;
    receiver_account: string;
    amount: number;
    currency?: string;
    transaction_type?: string;
  }) =>
    fetchAPI<MonitorResponse>("/monitor/transaction", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  monitorStats: () => fetchAPI<MonitorStats>("/monitor/statistics"),

  generateReport: (accountId: string, includeGraph = true) =>
    fetchAPI<{
      report_id: string;
      account_id: string;
      risk_score: number;
      report_text: string;
      status: string;
    }>("/reports/generate", {
      method: "POST",
      body: JSON.stringify({
        account_id: accountId,
        include_graph: includeGraph,
      }),
    }),

  modelInfo: () => fetchAPI<ModelInfo>("/model/info"),

  fullGraph: (limit = 200) =>
    fetchAPI<SubgraphResponse>(`/graph/full?limit=${limit}`),

  // ── Simulator ────────────────────────────────────────
  simulatorAccounts: () => fetchAPI<SimulatorAccount[]>("/simulator/accounts"),

  simulatorPay: (payload: {
    sender?: string;
    receiver?: string;
    amount: number;
    mobile?: string;
    to_mobile?: string;
    upi_id?: string;
    to_upi_id?: string;
    remark?: string;
    currency?: string;
    device_id?: string;
    ip?: string;
    location?: string;
    channel?: string;
  }) =>
    fetchAPI<LiveEnvelope>("/simulator/pay", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  simulatorSimulate: (payload: { preset?: string; amount?: number }) =>
    fetchAPI<LiveEnvelope>("/simulator/simulate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  simulatorStream: (action: "start" | "pause" | "resume" | "stop", tps = 5, preset?: string) =>
    fetchAPI<SimulatorStreamState>(`/simulator/stream/${action}`, {
      method: "POST",
      body: JSON.stringify({ tps, preset }),
    }),

  simulatorPreset: (name: string, action: "start" | "pause" | "resume" | "stop", tps = 5) =>
    fetchAPI<SimulatorStreamState>(`/simulator/preset/${name}`, {
      method: "POST",
      body: JSON.stringify({ action, tps }),
    }),

  simulatorHistory: (params?: Record<string, string | number>) => {
    const qs = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
      }
    }
    const query = qs.toString();
    return fetchAPI<SimulatorHistoryResponse>(
      `/simulator/history${query ? `?${query}` : ""}`,
    );
  },

  simulatorAlerts: (limit = 50) =>
    fetchAPI<SimulatorAlert[]>(`/simulator/alerts?limit=${limit}`),

  simulatorStats: () => fetchAPI<SimulatorStats>("/simulator/stats"),

  simulatorPresets: () =>
    fetchAPI<{ presets: SimulatorPresetInfo[]; tps_options: number[] }>(
      "/simulator/presets",
    ),

  // ── Voice authentication ────────────────────────────
  voicePending: () => fetchAPI<VoiceConfirmation[]>("/voice/pending"),

  voiceStats: () => fetchAPI<VoiceStats>("/voice/stats"),

  voiceConfirmation: (confirmationId: string) =>
    fetchAPI<VoiceConfirmation>(`/voice/pending/${encodeURIComponent(confirmationId)}`),

  voiceConfirm: (confirmationId: string, confirmed: boolean, transcript = "", notes = "") =>
    fetchAPI<LiveEnvelope>(`/voice/confirm/${encodeURIComponent(confirmationId)}`, {
      method: "POST",
      body: JSON.stringify({ confirmed, transcript, notes }),
    }),

  voiceRetryCall: (confirmationId: string) =>
    fetchAPI<VoiceConfirmation>(`/voice/call/initiate/${encodeURIComponent(confirmationId)}`, {
      method: "POST",
    }),
};
