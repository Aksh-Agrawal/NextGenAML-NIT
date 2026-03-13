/**
 * NextGenAML API Client
 * All data fetching functions connecting to the FastAPI backend.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088";

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
  center_account: string;
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

// ── Fetch Helpers ──────────────────────────────────────

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }
  return response.json();
}

// ── API Functions ──────────────────────────────────────

export const api = {
  health: () => fetchAPI<HealthResponse>("/health"),

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
};
