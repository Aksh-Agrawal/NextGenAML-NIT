# NextGenAML – Complete Project Information Document

### Next-Generation AML Fund Flow Tracking System

**Union Bank of India | Problem Statement 3 | Hackathon 2026**

---

## 1. PROJECT OVERVIEW

### Problem Statement

Union Bank of India needs an intelligent system to detect money laundering by tracking
end-to-end fund flows across thousands of accounts. Specifically, the system must identify:

| AML Typology                 | Description                                                   |
| ---------------------------- | ------------------------------------------------------------- |
| **Rapid Layering**           | Funds moved through multiple accounts within minutes          |
| **Circular Transactions**    | Round-trip flows: A→B→C→A to obscure origin                   |
| **Structuring (Smurfing)**   | Multiple transactions just below ₹10 lakh reporting threshold |
| **Dormant Activation**       | Inactive accounts suddenly receiving large transfers          |
| **KYC-Transaction Mismatch** | Customer profile doesn't match actual transaction behavior    |

### Solution

NextGenAML is a **microservices-based Graph Neural Network system** that:

1. Ingests raw bank transaction CSVs into an in-memory property graph (Memgraph)
2. Trains a custom **LineMVGNN** model treating transactions as first-class graph entities
3. Exposes all intelligence via a **FastAPI backend**
4. Presents findings via an interactive **Streamlit dashboard** with fund-flow visualization
5. Auto-generates **FIU-IND ARF/TRF XML** compliance reports using Google Gemini AI

---

## 2. TECHNOLOGY STACK

### Graph Database

| Component      | Technology     | Version | Purpose                             |
| -------------- | -------------- | ------- | ----------------------------------- |
| Graph DB       | **Memgraph**   | Latest  | In-memory Cypher query engine       |
| Python ORM     | **GQLAlchemy** | 1.4.1   | Python ↔ Memgraph bridge            |
| Query Language | **Cypher**     | —       | Graph traversal & pattern detection |

### Machine Learning

| Component       | Technology            | Version      | Purpose                               |
| --------------- | --------------------- | ------------ | ------------------------------------- |
| DL Framework    | **PyTorch**           | 2.1.0        | Core neural network engine            |
| GNN Library     | **PyTorch Geometric** | 2.5.x        | Graph convolution operations          |
| Custom Module   | **LineMVGNN**         | v2.0         | Line graph + bidirectional MP (novel) |
| Inductive Model | **GraphSAGE**         | via SAGEConv | Dormant account inference             |
| Training        | **NeighborLoader**    | PyG          | Memory-bounded subgraph sampling      |

### Backend

| Component     | Technology            | Version | Purpose                            |
| ------------- | --------------------- | ------- | ---------------------------------- |
| API Framework | **FastAPI**           | 0.111.0 | Async REST microservice            |
| ASGI Server   | **uvicorn**           | 0.29.0  | Production ASGI runner             |
| Validation    | **Pydantic**          | 2.7.1   | Request/response schema validation |
| Logging       | **Loguru**            | 0.7.2   | Structured logging                 |
| Monitoring    | **Prometheus-client** | 0.20.0  | Metrics scraping                   |

### Frontend

| Component | Technology    | Version | Purpose                           |
| --------- | ------------- | ------- | --------------------------------- |
| Dashboard | **Streamlit** | 1.35.0  | Analyst workbench UI              |
| Graph Viz | **Pyvis**     | 0.3.2   | Physics-based fund flow rendering |
| Charts    | **Plotly**    | 5.22.0  | Statistical visualizations        |
| Network   | **NetworkX**  | 3.3     | Graph data manipulation           |

### AI / Compliance Gateway

| Component         | Technology                  | Version | Purpose                             |
| ----------------- | --------------------------- | ------- | ----------------------------------- |
| LLM Orchestration | **LangChain**               | 0.2.1   | Prompt chaining & chain composition |
| LLM Model         | **Google Gemini 2.0 Flash** | —       | SAR narrative + XML generation      |
| Integration       | **langchain-google-genai**  | 1.0.4   | Gemini API connector                |

### Infrastructure

| Component        | Technology                  | Purpose                      |
| ---------------- | --------------------------- | ---------------------------- |
| Containerization | **Docker + Docker Compose** | Memgraph + API orchestration |
| GPU              | **NVIDIA RTX 4050 (8 GB)**  | CUDA 11.8 FP16 training      |
| CPU              | **Intel i7-14th Gen HX**    | NeighborLoader workers       |

---

## 3. SYSTEM ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────┐
│                     DATA LAYER (Memgraph)                           │
│  Accounts (nodes) ←──:TRANSACTION──→ Accounts (nodes)               │
│  Properties: id, bank, risk_score, is_flagged                       │
│  Edge Props: amount, currency, timestamp, is_laundering, features   │
│  Indices: O(1) on Account.id, Transaction.timestamp                 │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ GQLAlchemy / Cypher
┌────────────────────────▼─────────────────────────────────────────────┐
│                   ML INFERENCE LAYER (PyTorch)                      │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────────┐│
│  │ EdgeEncoder  │  │   LineMVGNN      │  │  GraphSAGE Inductive   ││
│  │ - Amount     │  │ - Line Graph L(G)│  │  - SAGEConv × 3        ││
│  │ - Currency   │  │ - Bidir MP       │  │  - Dormant accounts     ││
│  │ - Timestamp  │  │ - Shared weights │  │  - Zero-shot inference  ││
│  │ - Patterns   │  │ - Edge classify  │  │                         ││
│  └──────────────┘  └──────────────────┘  └────────────────────────┘│
└────────────────────────┬─────────────────────────────────────────────┘
                         │ HTTP REST (JSON)
┌────────────────────────▼─────────────────────────────────────────────┐
│                  FASTAPI MICROSERVICE (:8089)                        │
│  /ping  /health  /subgraph/{id}  /predict  /predict/batch           │
│  /alert  /explain/{id}  /monitor/transaction  /monitor/statistics   │
│  /patterns/circular  /patterns/dormant  /patterns/structuring       │
│  /metrics (Prometheus)  /model/info  /model/update-threshold        │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ requests library (HTTP)
┌────────────────────────▼─────────────────────────────────────────────┐
│              STREAMLIT FRONTEND (:8501)                              │
│  Tab 1: Fund Flow Graph (Pyvis + attention weights → edge colors)   │
│  Tab 2: Alert Triage (real-time flagged account dashboard)          │
│  Tab 3: Pattern Detector (circular, structuring, dormant)           │
│  Tab 4: SAR Report (LangChain + Gemini → FIU-IND XML)              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. MACHINE LEARNING ALGORITHMS

### 4.1 LineMVGNN (Primary Model – Novel Contribution)

**Motivation:** Standard node-centric GATs discard critical transaction-level features.
LineMVGNN elevates edges (transactions) to first-class entities.

**Architecture Stack:**

```
Step 1: AMLEdgeProjector
  - Input: 6 raw transaction features
    [amount_norm, currency_id, ts_sin, ts_cos, is_round_amount, velocity_24h]
  - Currency embedded via nn.Embedding(20, 8)
  - Output: 64-dim latent edge embedding via 2-layer MLP + LayerNorm + GELU

Step 2: build_line_graph(edge_index, num_nodes)
  - Constructs L(G) where each edge e_ij becomes a node n_e in L(G)
  - L(G) connects n_{(a→b)} ↔ n_{(b→c)} for shared intermediate node b
  - This explicit relay encoding is why the model catches layering

Step 3: LineGraphPropagator
  - Gated GRU-like message passing on L(G)
  - gate = sigmoid(Linear(concat(edge_emb, aggregated_msg)))
  - Allows each transaction to "see" what its predecessor and successor transactions look like

Step 4: BidirectionalConv (×2 layers)
  - In-aggregation:  W_shared × concat(h_src, edge_emb) for each incoming edge
  - Out-aggregation: W_shared × concat(h_src, edge_emb) for each outgoing edge
  - SAME weight matrix W_shared for both directions → forces symmetric understanding
  - Multi-head attention (4 heads) with per-node softmax normalization
  - This is the key design: shared weights make the model detect gather-scatter

Step 5: Edge Classification Head
  - Input: concat(h_src, h_dst, e_updated) → 3 × 64 = 192 dims
  - Output: sigmoid → P(is_laundering) per transaction

Step 6: Node Risk Scoring Head
  - Max-pool incident edge predictions onto account nodes
  - P(account_is_fraudulent) = max over all incident edge risk scores
```

**Loss Function:**

```
BCEWithLogitsLoss(pos_weight=10.0)   # 10× upweight for rare laundering class
Class weights: [0.2 legit, 0.8 fraud]  # handles ~3% prevalence in AMLSim
```

### 4.2 AMLGraphSAGE (Inductive Model)

**Motivation:** For dormant accounts activated mid-deployment, we cannot retrain.
GraphSAGE learns a _function_ over local neighborhoods, not node embeddings.

```
predict_dormant_account(account_features, neighbor_features):
  1. Build star subgraph on-the-fly: target (node 0) + K neighbors (nodes 1..K)
  2. SAGEConv layer 1:  h = MEAN_AGG(neighbor features)
  3. SAGEConv layer 2:  h = MEAN_AGG(h, self)  + LayerNorm + GELU
  4. SAGEConv layer 3:  → 64-dim embedding
  5. Classifier:        Linear(64→2) → softmax → P(fraud)
```

**Key Property:** Zero-shot — works on accounts never seen during training.

### 4.3 PatternAwareEdgeEncoder

Three AML-specific detector heads fused with the base edge encoder:

| Detector                  | Input Features         | Detects                               |
| ------------------------- | ---------------------- | ------------------------------------- |
| `StructuringDetector`     | amount_norm + is_round | Transactions clustered near $10,000   |
| `VelocityBurstDetector`   | velocity_24h           | Burst of transactions in short window |
| `TemporalAnomalyDetector` | ts_sin + ts_cos        | Off-hours (midnight–4AM) activity     |

Output: `concat(base_emb[64], s_score[1], v_score[1], t_score[1])` → Linear → 64-dim

---

## 5. DATA PIPELINE & WORKFLOW

### 5.1 Ingestion Pipeline

```
AMLSim CSV
    ↓
pandas.read_csv() → column normalization
    ↓
Feature Engineering:
  amount_norm  = log1p(amount) / log1p(max_amount)
  ts_sin       = sin(hour × 2π/24)
  ts_cos       = cos(hour × 2π/24)
  is_round     = 1.0 if amount % 1000 == 0 else 0.0
  velocity_24h = clip(txn_count_from_sender / 100, 0, 1)
  currency_id  = CURRENCY_MAP.get(currency, 19)
    ↓
Batch MERGE Account nodes (chunk_size=5,000)
    ↓
Batch CREATE TRANSACTION edges (chunk_size=5,000)
    ↓
CREATE INDEX ON :Account(id)      ← O(1) lookup
CREATE INDEX ON :Transaction(timestamp)
    ↓
Verification: count(Account), count(TRANSACTION), count(laundering_edges)
```

### 5.2 Training Pipeline

```
Memgraph → GQLAlchemy → PyGTranslator → PyG HeteroData
    ↓
80/20 train/val split (random permutation)
    ↓
NeighborLoader (train):
  num_neighbors = [20, 10]     ← hop 1, hop 2 (VRAM bound)
  batch_size    = 64
  num_workers   = 4            ← i7 HX thread pool
  pin_memory    = True         ← PCIe DMA transfers
    ↓
For each mini-batch:
  1. batch.to(device, non_blocking=True)
  2. with autocast():          ← FP16 on RTX 4050 Tensor Cores
       edge_pred, node_pred, attn = LineMVGNN(x, edge_index, edge_attr)
       loss = BCEWithLogitsLoss(edge_pred, y_edge)
  3. scaler.scale(loss).backward()
  4. clip_grad_norm_(model.parameters(), max_norm=1.0)
  5. scaler.step(optimizer)
  6. scaler.update()
    ↓
Metrics per epoch: Loss, ROC-AUC, F1-Score
CosineAnnealingLR scheduler (T_max=epochs, eta_min=1e-5)
    ↓
Best model saved: saved_models/aml_line_mvgnn_best.pt
```

### 5.3 Inference Pipeline

```
Analyst selects ACCT-8921 on Streamlit
    ↓
GET /subgraph/ACCT-8921 → FastAPI → Memgraph Cypher ego-subgraph
    ↓
AMLInferenceEngine.predict():
  - Build mini star subgraph (node features + edge features)
  - model.forward() under torch.no_grad() + autocast()
  - Returns: fraud_probability, risk_level, recommendations
    ↓
AMLInferenceEngine.get_attention_weights_for_subgraph():
  - Returns dict: "SRC->DST" → scalar attention weight [0,1]
    ↓
Streamlit: Pyvis render with attention-based edge coloring
  att > 0.7  → RED    (illicit)
  att > 0.4  → ORANGE (suspicious)
  otherwise  → GREY
```

---

## 6. HARDWARE OPTIMIZATION CONSTRAINTS

**Target Hardware:** Intel i7-14th Gen HX (5.50 GHz) + NVIDIA RTX 4050 (8 GB VRAM)

### VRAM Management Strategy

| technique                | Implementation                              | VRAM Savings             |
| ------------------------ | ------------------------------------------- | ------------------------ |
| **NeighborLoader**       | [20 hop-1, 10 hop-2] subgraph sampling      | ~60% vs full-batch       |
| **FP16 Mixed Precision** | `torch.cuda.amp.autocast()` on forward pass | ~50% activation memory   |
| **GradScaler**           | FP16-safe backward propagation              | prevents underflow       |
| **gradient clipping**    | `clip_grad_norm_(max_norm=1.0)`             | training stability       |
| **`non_blocking=True`**  | Async H→D memory copy                       | CPU-GPU pipeline overlap |

### CPU Utilization Strategy

```python
NeighborLoader(
    data,
    num_workers = 4,       # i7 HX thread pool for data preprocessing
    pin_memory  = True,    # Pages locked in RAM → DMA transfer over PCIe
)
```

### Memory Budget Breakdown (estimated, 64-node batch)

```
Node features   [64 × 16 × 4 bytes]  =   4 KB
Edge features   [640 × 6 × 4 bytes]  =  15 KB
Activations     [layers × 64 × 64]   = ~512 KB (FP16)
Gradients       [~same as params]    =  ~8 MB
Model params    [LineMVGNN total]     =  ~4 MB
──────────────────────────────────────────────
Total per batch                       ≈ ~25 MB  (well within 8 GB limit)
```

---

## 7. CYPHER PATTERN DETECTION QUERIES

### Circular Transaction Detection

```cypher
MATCH p=(a:Account)-[:TRANSACTION*3..6]->(a)
WHERE ALL(r IN relationships(p) WHERE r.amount > 0)
RETURN [n IN nodes(p) | n.id]             AS account_chain,
       REDUCE(total=0.0, r IN relationships(p) | total + r.amount) AS total_flow,
       LENGTH(p)                            AS cycle_length
LIMIT 50
```

### Structuring Pattern Detection

```cypher
MATCH (a:Account)-[t:TRANSACTION]->(b:Account)
WHERE t.amount >= 9000 AND t.amount < 10000  -- ±10% of $10k threshold
WITH a, count(t) AS txn_count, avg(t.amount) AS avg_amount
WHERE txn_count >= 3
RETURN a.id, txn_count, avg_amount
ORDER BY txn_count DESC
LIMIT 50
```

### Dormant Account Detection

```cypher
MATCH (a:Account)-[latest:TRANSACTION]->(b:Account)
WHERE latest.amount >= 10000
WITH a, latest,
     duration.between(localDatetime(first_activity), localDatetime(latest.timestamp)).days AS gap
WHERE gap >= 180
RETURN a.id AS account_id, latest.amount AS activation_amount, gap AS dormant_days
```

### High-Degree Hub Detection (Smurf Accounts)

```cypher
MATCH (a:Account)
OPTIONAL MATCH (a)-[out:TRANSACTION]->()
OPTIONAL MATCH ()-[in:TRANSACTION]->(a)
WITH a, count(out) AS out_deg, count(in) AS in_deg
RETURN a.id, (out_deg + in_deg) AS total_degree
ORDER BY total_degree DESC LIMIT 20
```

---

## 8. FASTAPI ENDPOINTS (Complete Reference)

| Method | Endpoint                  | Description                                |
| ------ | ------------------------- | ------------------------------------------ |
| GET    | `/ping`                   | Health check (Streamlit polls this)        |
| GET    | `/health`                 | Model status + Memgraph connectivity       |
| GET    | `/graph/stats`            | Account/transaction/laundering counts      |
| GET    | `/subgraph/{account_id}`  | Ego-subgraph + attention weights for Pyvis |
| POST   | `/predict`                | Single account risk prediction             |
| POST   | `/predict/batch`          | Batch inference for multiple accounts      |
| POST   | `/alert`                  | Retrieve alerts above threshold            |
| POST   | `/explain/{account_id}`   | Top suspicious edges + pattern scores      |
| POST   | `/monitor/transaction`    | Real-time single transaction scoring       |
| GET    | `/monitor/statistics`     | Throughput, alert rate, uptime             |
| POST   | `/monitor/clear-alerts`   | Flush alert queue                          |
| GET    | `/patterns/circular`      | Circular transaction cycles                |
| GET    | `/patterns/dormant`       | Dormant account activations                |
| GET    | `/patterns/structuring`   | Structuring pattern accounts               |
| GET    | `/metrics`                | Prometheus metrics scrape                  |
| GET    | `/model/info`             | Model metadata                             |
| POST   | `/model/update-threshold` | Dynamic threshold adjustment               |

---

## 9. COMPLIANCE GATEWAY – FIU-IND REPORTING

### LangChain Chain Definition

```python
chain = ChatPromptTemplate.from_template(template) | ChatGoogleGenerativeAI(
    model="gemini-2.0-flash", temperature=0.15
) | StrOutputParser()
```

### Input Metadata (JSON sent to Gemini)

```json
{
  "report_id": "ARF-ACCT-8921-20250115",
  "reporting_entity": {
    "bank_name": "Union Bank of India",
    "fiu_reg_no": "FIIIND20250001"
  },
  "subject_account": {
    "account_id": "ACCT-8921",
    "risk_level": "CRITICAL",
    "fraud_prob": 0.93
  },
  "gnn_analysis": { "model": "LineMVGNN v2.0", "fraud_probability": 0.93 },
  "transaction_summary": {
    "flagged_edges": 4,
    "total_flagged_amount_usd": 37400
  },
  "circular_patterns": [
    {
      "accounts": ["ACCT-8921", "ACCT-4512", "ACCT-9910", "ACCT-7731"],
      "total_flow": 37400
    }
  ],
  "aml_typologies": ["Rapid Layering", "Circular Round-Trip", "Structuring"]
}
```

### Output

1. **SAR Narrative** – Plain English report with typology identification
2. **FIU-IND ARF/TRF XML** – FINGate 2.0 compliant XML for FIU-IND submission
3. **Downloadable XML** – `⬇️ Download ARF/TRF XML` button in Streamlit

---

## 10. ASSUMPTIONS

| #   | Assumption                                                | Justification                           |
| --- | --------------------------------------------------------- | --------------------------------------- |
| 1   | Input CSVs follow AMLSim / IBM AML format                 | Dataset specified in problem statement  |
| 2   | Memgraph runs in Docker on localhost:7687                 | Specified in tech stack                 |
| 3   | RTX 4050 VRAM ≥ 6 GB for training                         | Specified hardware constraint           |
| 4   | Currency ID maps to 20 known ISO-4217 currencies          | AMLSim dataset has bounded currency set |
| 5   | Laundering prevalence ≈ 3% (AMLSim HI-Small)              | From dataset statistics                 |
| 6   | Off-hours = 00:00–04:00 local time = suspicious indicator | Industry AML standard                   |
| 7   | Structuring threshold = $10,000 ± 10%                     | Bank Secrecy Act / PMLA threshold       |
| 8   | Dormancy = 180+ days without transactions                 | RBI guideline for inoperative accounts  |
| 9   | Google Gemini API key is valid and has quota              | User must provide in .env               |
| 10  | Docker Desktop is installed and running                   | Required for Memgraph container         |

---

## 11. SCALABILITY ANALYSIS

### Current Scale (Hackathon Demo)

- Dataset: HI-Small (~500K transactions, ~5K accounts)
- Inference latency: ~12 ms per account
- Training: ~20 min on RTX 4050 for 50 epochs

### Production Scalability Path

| Dimension          | Current         | Scale-Up Approach                                          |
| ------------------ | --------------- | ---------------------------------------------------------- |
| **Data Volume**    | 500K txns       | Memgraph horizontal sharding, Kafka streaming ingestion    |
| **Model**          | Single GPU      | PyTorch DDP (multi-GPU), TorchScript export                |
| **API Throughput** | ~100 req/s      | Deploy behind NGINX + multiple uvicorn workers             |
| **Graph Size**     | 5K nodes        | Increase NeighborLoader neighbors to [50, 25] with A100    |
| **Real-time**      | Batch inference | Kafka→FastAPI consumer for sub-second streaming scoring    |
| **Retraining**     | Manual          | MLflow + automated retraining pipeline on feedback_log.csv |

### NeighborLoader Scalability Formula

```
VRAM per batch ≈ B × H × (1 + F × N₁ × N₂) × sizeof(dtype)
Where:
  B  = batch_size
  H  = hidden_dim
  F  = feature_dim
  N₁ = hop-1 neighbors
  N₂ = hop-2 neighbors
  dtype = float16 (2 bytes with AMP)

For B=64, H=64, F=16, N₁=20, N₂=10:
VRAM ≈ 64 × 64 × (1 + 16 × 20 × 10) × 2 bytes ≈ 420 MB  (safe for 8 GB)
```

---

## 12. EXECUTION GUIDE

### Prerequisites

```
✅ Docker Desktop (running)
✅ Python 3.11+
✅ NVIDIA GPU with CUDA 11.8+
✅ Google Gemini API Key
```

### Step-by-Step Execution

```bash
# 1. Environment setup
copy .env.example .env
# Edit .env: set GOOGLE_API_KEY=your_key_here

# 2. Install Python dependencies
pip install torch==2.1.0 --index-url https://download.pytorch.org/whl/cu118
pip install torch_geometric
pip install -r requirements.txt

# 3. Start all services (Windows one-click)
start.bat

# Manual alternative:
#   docker-compose up -d memgraph
#   uvicorn api.main:app --host 0.0.0.0 --port 8089
#   streamlit run dashboard/app.py

# 4. Copy AMLSim CSVs into data/ folder
# (HI-Small_Trans.csv from the aml_system folder)

# 5. Ingest transaction data into Memgraph
python ingestion/ingest_amlsim.py --csv_path data/HI-Small_Trans.csv

# 6. Train the LineMVGNN model
python training/train.py --model line_mvgnn --epochs 50 --batch_size 64

# 7. Open the dashboard
# http://localhost:8501
```

### Service URLs

| Service             | URL                           | Purpose                  |
| ------------------- | ----------------------------- | ------------------------ |
| Streamlit Dashboard | http://localhost:8501         | Main analyst interface   |
| FastAPI Backend     | http://localhost:8089         | REST API                 |
| Swagger API Docs    | http://localhost:8089/docs    | Interactive API explorer |
| Memgraph Lab        | http://localhost:3000         | Graph visualization      |
| Prometheus Metrics  | http://localhost:8089/metrics | Monitoring               |

---

## 13. PROJECT FILE INVENTORY

```
D:\UNION Bank Hackathon\NextGenAML\
├── README.md                        Project setup guide
├── EXAMPLE_WALKTHROUGH.md           End-to-end worked example
├── PROJECT_INFO.md                  ← This document
├── PPT_CONTENT.md                   9-slide presentation content
├── docker-compose.yml               Container orchestration
├── Dockerfile.api                   FastAPI container image
├── requirements.txt                 Python dependencies
├── .env.example                     Environment config template
├── start.bat                        Windows one-click launcher
│
├── models/
│   ├── __init__.py
│   ├── line_mvgnn.py                ★ Novel: LineMVGNN (17.8 KB)
│   ├── graphsage_inductive.py       Inductive GraphSAGE (6.9 KB)
│   └── edge_encoder.py              Pattern-aware encoder (9.0 KB)
│
├── training/
│   └── train.py                     Full training pipeline
│
├── ingestion/
│   ├── __init__.py
│   ├── ingest_amlsim.py             CSV → Memgraph ingestion
│   └── graph_query.py               Cypher pattern queries
│
├── api/
│   ├── __init__.py
│   ├── main.py                      FastAPI application (17.2 KB)
│   ├── schemas.py                   Pydantic models
│   ├── inference_engine.py          AMLInferenceEngine
│   ├── monitor.py                   RealTimeAMLMonitor
│   └── metrics.py                   Prometheus collector
│
├── dashboard/
│   └── app.py                       Streamlit frontend (500+ lines)
│
├── data/                            ← Place AMLSim CSVs here
├── saved_models/                    ← Trained .pt checkpoints
└── logs/                            ← API + feedback CSVs
```
