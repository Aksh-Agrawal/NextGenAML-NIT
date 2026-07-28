# NextGenAML — Risk Scoring & Detection System

A detailed breakdown of every model, algorithm, and threshold used by
NextGenAML to determine whether an account or transaction is at risk.

---

## Table of Contents

1. [Pipeline Overview](#1-pipeline-overview)
2. [Feature Engineering](#2-feature-engineering)
3. [Model 1 — Graph Neural Network (GraphSAGE)](#3-model-1--graph-neural-network-graphsage)
4. [Model 2 — Line-graph Multi-View GNN (LineMVGNN)](#4-model-2--line-graph-multi-view-gnn-linemvgnn)
5. [Model 3 — Gradient Boosting Fallback (sklearn)](#5-model-3--gradient-boosting-fallback-sklearn)
6. [Model 4 — Pattern Detection](#6-model-4--pattern-detection)
7. [Model 5 — Statistical Anomaly Detection](#7-model-5--statistical-anomaly-detection)
8. [Model 6 — Edge Suspicious Scoring](#8-model-6--edge-suspicious-scoring)
9. [Composite Risk Score (Weighted Fusion)](#9-composite-risk-score-weighted-fusion)
10. [Risk Levels & Thresholds](#10-risk-levels--thresholds)
11. [Confidence Calculation](#11-confidence-calculation)

---

## 1. Pipeline Overview

Every account in the system goes through a **6-model pipeline** before a
final risk score is assigned.

```
CSV Transactions
  │
  ├─► GraphManager          Build directed transaction graph + per-account features
  │
  ├─► InferenceEngine       ML prediction  (GraphSAGE / LineMVGNN / GBDT fallback)
  │      │
  │      └─► combined = 0.6 × ml_prob + 0.4 × label_ratio
  │
  ├─► Pattern Detection     Circular flows, structuring, dormant activations
  │
  ├─► Anomaly Detection     Velocity, volume, fan-out, off-hours signals
  │
  └─► RiskEngine            Weighted fusion → final risk_score (0–100)
         │
         └─► 0.5 × ml_score + 0.3 × pattern_score + 0.2 × anomaly_score
```

---

## 2. Feature Engineering

Every account receives **12 computed features** from its transaction
history and graph position.

| # | Feature | How It Is Computed |
|---|---------|-------------------|
| 1 | `total_sent` | Sum of amounts where account is the sender |
| 2 | `total_received` | Sum of amounts where account is the receiver |
| 3 | `tx_count` | Total number of transactions (sent + received) |
| 4 | `avg_amount` | Mean transaction amount across all txns |
| 5 | `log_amount` | `log₁ₐ(total_sent + total_received)` |
| 6 | `avg_velocity_sec` | Mean time gap between consecutive transactions (seconds) |
| 7 | `min_velocity_sec` | Minimum time gap between consecutive transactions |
| 8 | `sin_time` | `sin(2π × avg_hour / 24)` — encodes time-of-day |
| 9 | `cos_time` | `cos(2π × avg_hour / 24)` — encodes time-of-day |
| 10 | `label_ratio` | Fraction of transactions flagged as suspicious (0.0–1.0) |
| 11 | `in_degree` | Number of unique senders to this account |
| 12 | `out_degree` | Number of unique receivers from this account |

The ML models use **8 of these** after Z-score normalization:

```
X_normalized = (X - mean) / std
```

| Input # | Feature | What It Captures |
|---------|---------|-----------------|
| 1 | `log_amount` | Transaction volume (compressed scale) |
| 2 | `total_sent` | Outbound money flow |
| 3 | `total_received` | Inbound money flow |
| 4 | `avg_velocity_sec` | How fast transactions occur |
| 5 | `sin_time` | Time-of-day pattern (sinusoidal encoding) |
| 6 | `cos_time` | Time-of-day pattern (cosine encoding) |
| 7 | `in_degree` | Network centrality (receiving side) |
| 8 | `out_degree` | Network centrality (sending side) |

---

## 3. Model 1 — Graph Neural Network (GraphSAGE)

**Architecture:** 3-layer GraphSAGE (Graph Sample and Aggregate)

```
Input (8 features)
  → SAGEConv(8, 32) → ReLU → Dropout(0.3)
  → SAGEConv(32, 32) → ReLU → Dropout(0.3)
  → SAGEConv(32, 2) → LogSoftmax
```

| Property | Value |
|----------|-------|
| Library | PyTorch Geometric |
| Layers | 3 (`SAGEConv`) |
| Hidden dim | 32 |
| Output | 2 classes (benign / fraud) |
| Dropout | 0.3 between layers |
| Activation | ReLU |
| Optimizer | Adam (lr=0.01, weight_decay=5e-4) |
| Loss | Negative Log-Likelihood (`nll_loss`) |
| Epochs | 50 |

**How it works:**

GraphSAGE aggregates neighbor information for each node. Each layer
collects features from the node's 1-hop neighbors and combines them
with the node's own features. After 3 layers, each node has a
representation that encodes its **3-hop neighborhood** — meaning the
model considers not just the account itself, but also who it transacts
with, who *they* transact with, and so on.

**Label assignment:** An account is labeled `1` (fraud) if its
`label_ratio > 0.5`, otherwise `0` (benign).

**Inference:** Forward pass through the full graph produces log-softmax
probabilities for every node simultaneously. The probability of class 1
(fraud) is `exp(output[node, 1])`.

---

## 4. Model 2 — Line-graph Multi-View GNN (LineMVGNN)

**Architecture:** 2-layer GraphSAGE + edge-level MLP

```
Node pathway:
  Input (8) → SAGEConv(8, 32) → BatchNorm → ReLU → Dropout(0.3)
           → SAGEConv(32, 32) → BatchNorm → ReLU → Dropout(0.3)

Edge pathway:
  edge_emb = concat(src_node_embedding, tgt_node_embedding)  → [N_edges, 64]
  → Linear(64, 32) → ReLU → Dropout(0.3)
  → Linear(32, 2) → LogSoftmax
```

| Property | Value |
|----------|-------|
| Library | PyTorch Geometric |
| Node layers | 2 (`SAGEConv` + `BatchNorm1d`) |
| Edge layers | 2 (`Linear`) |
| Hidden dim | 32 |
| Edge input | Concatenation of source + target embeddings (64-dim) |
| Output | 2 classes per edge (benign / suspicious) |

**How it differs from GraphSAGE:**

LineMVGNN classifies **edges** (transactions) rather than nodes
(accounts). For each directed edge (A → B), it concatenates A's learned
embedding with B's embedding and runs an MLP to decide if that specific
transaction link is suspicious.

**Inference for account-level prediction:** When used for account risk,
the system averages the fraud probabilities of all edges touching that
account (both incoming and outgoing).

---

## 5. Model 3 — Gradient Boosting Fallback (sklearn)

Used when PyTorch / PyTorch Geometric is not available.

```python
GradientBoostingClassifier(
    n_estimators=100,
    max_depth=4,
    random_state=42
)
```

| Property | Value |
|----------|-------|
| Library | scikit-learn |
| Algorithm | Gradient Boosted Decision Trees |
| Estimators | 100 |
| Max depth | 4 |
| Input | 8 Z-score-normalized features (tabular, no graph) |
| Output | 2-class probabilities via `predict_proba()` |

**Limitation:** Does not use graph topology — only tabular features.
Accuracy is slightly lower than the GNN models.

**Unfitted fallback:** If the model has not been trained yet, it returns
random probabilities in range `[0, 0.3]` for class 1, ensuring no
account gets a false high-risk label before training.

---

## 6. Model 4 — Pattern Detection

Three independent pattern detectors scan the transaction graph. An
account flagged by **any** detector gets `pattern_score = 1.0`.

### 6A. Circular Flow Detection

**What it catches:** Money laundering through round-trip transfers
(A → B → C → A).

| Parameter | Value |
|-----------|-------|
| Algorithm | `nx.simple_cycles()` (DFS enumeration) |
| Min cycle length | 3 nodes |
| Max cycle length | 6 nodes |
| Max cycles checked | 200,000 |
| Max cycles returned | 50 |

**How it works:**
1. Enumerate all simple cycles in the directed graph
2. Filter to cycles with 3–6 nodes
3. For each cycle, sum the `total_amount` of every edge in the loop
4. Every account in the cycle chain is flagged

**Example:** If A sends to B, B sends to C, and C sends back to A, all
three accounts are flagged as participating in a "Circular Flow".

### 6B. Structuring Detection

**What it catches:** Deliberate splitting of large amounts just below
reporting thresholds to evade detection (smurfing).

| Parameter | Value |
|-----------|-------|
| Thresholds (₹) | 10,000 / 50,000 / 200,000 / 500,000 / 1,000,000 |
| Detection window | 60 minutes |
| Match range | 90%–100% of each threshold |
| Minimum transactions | 2 within the window |

**How it works:**
1. For each unique sender, sort their outgoing transactions by time
2. For each threshold (₹10K, ₹50K, ₹200K, ₹500K, ₹10L):
   - Find transactions in the range `[threshold × 0.9, threshold]`
   - If ≥ 2 such transactions occur within 60 minutes → flag the sender
3. Only the **sender** is flagged (not the receiver)

**Example:** Sender makes two transactions of ₹9,500 each within 30
minutes (both in the 90–100% range of the ₹10,000 threshold) → flagged.

### 6C. Dormant Activation Detection

**What it catches:** Accounts that go inactive for a long period and
then suddenly resume high-value activity.

| Parameter | Value |
|-----------|-------|
| Dormant threshold | 30 days without any transactions |
| Detection method | Max gap between consecutive transactions |

**How it works:**
1. For each account, collect all transactions (sent + received) sorted
   by timestamp
2. Compute gaps between consecutive transactions
3. If the maximum gap ≥ 30 days, flag the account
4. Record the "activation" transaction (first tx after the gap)

**Example:** Account has transactions on Jan 1 and Feb 15 (45-day gap)
→ flagged as "Dormant Activation" with the Feb 15 transaction as the
activation event.

### Pattern Priority

If an account matches multiple patterns, the first match wins:

1. Circular Flow
2. Structuring
3. Dormant Activation
4. Rapid Movement (fallback: `out_degree > 5`)
5. Abnormal Transfer (fallback: `label_ratio > 0.5`)
6. Normal

---

## 7. Model 5 — Statistical Anomaly Detection

A heuristic scoring system that adds up to **4 independent signals**,
capped at 1.0 total.

| Signal | Condition | Score Added |
|--------|-----------|-------------|
| **Rapid velocity** | `min_velocity_sec < 300` (< 5 min) | +0.40 |
| **Moderate velocity** | `avg_velocity_sec < 600` (< 10 min) | +0.20 |
| **High volume** | `total_sent + total_received > ₹50,00,000` | +0.30 |
| **Elevated volume** | `total_sent + total_received > ₹10,00,000` | +0.15 |
| **High fan-out** | `out_degree > 5` (sends to 6+ accounts) | +0.20 |
| **Off-hours activity** | `abs(sin_time) > 0.9` (late night) | +0.10 |

**Maximum anomaly score:** 0.4 + 0.3 + 0.2 + 0.1 = **1.0**

**Interpretation:** An account that transacts rapidly, in high volume, to
many recipients, during off-hours will receive the maximum anomaly score.

---

## 8. Model 6 — Edge Suspicious Scoring

Each edge (transaction link between two accounts) receives a suspicious
score from 4 weighted signals.

| Signal | Weight | How It Is Computed |
|--------|--------|-------------------|
| **Flag ratio** | 0.40 | Fraction of transactions on this edge that are labeled suspicious |
| **Endpoint risk** | 0.30 | Average `label_ratio` of both sender and receiver |
| **Amount anomaly** | 0.15 | `min(ratio / (ratio + 3), 1)` where `ratio = edge_avg / global_avg` |
| **Tx frequency** | 0.15 | `min(tx_count / 20, 1)` — saturates at 20+ transactions |

**Formula:**
```
score = 0.40 × flag_ratio + 0.30 × endpoint_risk + 0.15 × amount_signal + 0.15 × tx_signal
```

**Amount anomaly interpretation:**

| Edge avg / Global avg | amount_signal |
|-----------------------|--------------|
| 1× | 0.25 |
| 3× | 0.50 |
| 10× | 0.77 |
| 20× | 0.87 |
| 50× | 0.94 |

---

## 9. Composite Risk Score (Weighted Fusion)

The **RiskEngine** combines all signals into one final score.

```
final_score = 0.50 × ml_score
            + 0.30 × pattern_score
            + 0.20 × anomaly_score
```

| Component | Weight | Source | Range |
|-----------|--------|--------|-------|
| `ml_score` | 50% | `InferenceEngine.predict()` → combined = `0.6×ml_prob + 0.4×label_ratio` | 0.0 – 1.0 |
| `pattern_score` | 30% | `1.0` if account appears in any detected pattern, else `0.0` | 0.0 or 1.0 |
| `anomaly_score` | 20% | `_compute_anomaly()` velocity + volume + fan-out + off-hours | 0.0 – 1.0 |

The final score is clamped to `[0, 1]` and then multiplied by 100 for
the API response:

```
risk_score = round(final_score × 100, 1)    # 0 – 100 scale
```

### How ml_score Is Itself a Blend

The ML component is not a raw model output — it is already blended:

```
ml_score (combined) = 0.6 × raw_ml_probability + 0.4 × label_ratio
```

Where:
- `raw_ml_probability` = GraphSAGE / LineMVGNN / GBDT output (0–1)
- `label_ratio` = historical fraction of flagged transactions for this
  account (0–1)

This means the full formula is actually:

```
risk_score = 0.5 × (0.6 × ml_prob + 0.4 × label_ratio)
           + 0.3 × pattern_flag
           + 0.2 × anomaly_heuristic
```

Expanding:

```
risk_score = 0.30 × ml_prob
           + 0.20 × label_ratio
           + 0.30 × pattern_flag
           + 0.20 × anomaly_heuristic
```

---

## 10. Risk Levels & Thresholds

All components use the same 4-level classification, mapped from the
composite score.

| Score Range | Risk Level | Badge Color | Status |
|-------------|-----------|-------------|--------|
| ≥ 75 | **CRITICAL** | Red (`#FF3D57`) | Immediate investigation |
| ≥ 50 | **HIGH** | Amber (`#FFB547`) | Enhanced due diligence |
| ≥ 25 | **MEDIUM** | Blue (`#4D8EFF`) | Periodic review |
| < 25 | **LOW** | Green (`#22C55E`) | Standard monitoring |

These thresholds are consistent across:
- Backend API (`/predict`, `/explain`, `/alert`)
- Frontend utilities (`getRiskFromScore`, `getRiskFromProb`)
- Graph node coloring (`isHighFraudProbability`)
- Dashboard badges and gauges

---

## 11. Confidence Calculation

The confidence score indicates how certain the system is about its
prediction.

```
confidence = min(0.95, 0.5 + |combined_score − 0.5|)
```

| Combined Score | Confidence |
|----------------|-----------|
| 0.0 (definitely benign) | 0.50 |
| 0.25 | 0.75 |
| 0.50 (uncertain) | 0.50 |
| 0.75 | 0.75 |
| 1.0 (definitely fraud) | 0.95 (capped) |

**Interpretation:** The further the score is from 0.5 (the "uncertain"
zone), the higher the confidence. A score near 0.5 means the system is
uncertain and the confidence stays low (~0.5). A score near 0 or 1 means
high confidence (up to 0.95 max).

---

## Appendix: Training Details

| Parameter | GNN | Fallback (sklearn) |
|-----------|-----|-------------------|
| Model | `AMLGraphSAGE` or `LineMVGNN` | `GradientBoostingClassifier` |
| Epochs / Iterations | 50 | 100 (n_estimators) |
| Optimizer | Adam (lr=0.01) | — |
| Weight decay | 5e-4 | — |
| Loss function | NLL Loss | Log loss (default) |
| Label threshold | `label_ratio > 0.5` → fraud | Same |
| Reported accuracy | 94% | 92% |
| Reported precision | 91% | 89% |
| Reported recall | 88% | 85% |
| Reported F1 | 89% | 87% |
