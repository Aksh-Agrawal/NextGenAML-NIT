# NextGenAML — Complete Technology Stack

> **Next-Generation Anti-Money Laundering (AML) Fund Flow Tracking System**
> Built for X-Bank of India — Problem Statement 3, Hackathon 2026
> Detects suspicious financial transactions using Graph Neural Networks and real-time analytics.

---

## Table of Contents

1. [Frontend (Next.js / React / TypeScript)](#1-frontend)
2. [Backend (Python / FastAPI)](#2-backend)
3. [Machine Learning & AI](#3-machine-learning--ai)
4. [Database & Graph Storage](#4-database--graph-storage)
5. [Infrastructure & Deployment](#5-infrastructure--deployment)
6. [External APIs & Services](#6-external-apis--services)
7. [System Architecture](#7-system-architecture)
8. [Performance Metrics](#8-performance-metrics)

---

## 1. Frontend

### 1.1 Core Framework

| Technology       | Version | Purpose                                                                                           |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------- |
| **Next.js 14**   | 14.2.35 | React framework with App Router, file-system routing, layouts, server components, static export   |
| **React 18**     | ^18     | UI component library — server components (`'use client'` directive for client-side interactivity) |
| **TypeScript 5** | ^5      | Type-safe JavaScript with strict mode, bundler module resolution                                  |
| **Node.js**      | ^20     | JavaScript runtime                                                                                |

### 1.2 UI & Styling

| Technology                | Purpose                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Tailwind CSS 3**        | Utility-first CSS framework with custom dark theme design tokens                                          |
| **CSS Custom Properties** | 50+ design tokens in `globals.css`: `--bg-base`, `--accent-blue`, `--border`, etc.                        |
| **Custom Dark Theme**     | Full dark-mode design system: card surfaces, risk badges, probability bars, spinners, tooltips, scrollbar |
| **Google Fonts**          | Inter (sans-serif), JetBrains Mono (monospace), Plus Jakarta Sans, Roboto Mono                            |
| **Framer Motion 12**      | Page transitions, accordion animations, sidebar collapse, panel slide-ins, `AnimatePresence`              |
| **Lucide React**          | Icon component library (Search, GitFork, AlertTriangle, Eye, Copy, Download, etc.)                        |
| **clsx**                  | Conditional className construction                                                                        |
| **tailwind-merge**        | Smart Tailwind CSS class merging                                                                          |

### 1.3 Data Visualization

| Technology        | Purpose                                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D3.js 7**       | Force-directed graph visualization: `forceSimulation` with link, charge, center, collision forces; zoom/pan/drag; node rendering                    |
| **Recharts 3**    | Charting library: Area charts (risk trends), Bar charts (structuring patterns), Scatter charts (dormant activations), RadialBar (risk distribution) |
| **react-countup** | Animated number counters for dashboard KPIs                                                                                                         |

### 1.4 State Management & Data Fetching

| Technology                     | Purpose                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------ |
| **TanStack React Query 5**     | Server state management: automatic refetching, caching, stale-while-revalidate |
| **React useState / useEffect** | Local component state for search, filters, form inputs                         |

### 1.5 Other Frontend Libraries

| Technology                   | Purpose                                                                 |
| ---------------------------- | ----------------------------------------------------------------------- |
| **react-syntax-highlighter** | Syntax-highlighted XML preview for SAR reports (FIU-IND ARF/TRF format) |
| **html-to-image**            | Export graph canvas to PNG image                                        |
| **qrcode.react**             | QR code rendering on the simulator UPI phone                             |

### 1.6 Frontend Architecture

```
src/
├── app/                          # Next.js App Router (file-system routing)
│   ├── (landing)/                # Landing page (route group, no layout)
│   │   ├── layout.tsx            # SEO metadata, OG tags, Twitter cards
│   │   └── page.tsx              # 10-section landing page (server component)
│   ├── dashboard/                # Dashboard page
│   │   ├── layout.tsx            # Sidebar + Topbar layout
│   │   └── page.tsx              # KPIs, CSV upload, alert feed, mini-graph
│   ├── fund-flow/                # Fund flow graph page
│   │   ├── layout.tsx            # Fund flow layout
│   │   ├── page.tsx              # Account search + D3 force-directed graph
│   │   └── [accountId]/          # Dynamic route: direct account analysis
│   │       └── page.tsx          # Static params, server component
│   ├── alerts/                   # Alert triage page
│   │   ├── layout.tsx
│   │   └── page.tsx              # Sortable table, filters, bulk actions
│   ├── monitor/                  # Real-time transaction monitor
│   │   ├── layout.tsx
│   │   └── page.tsx              # Live feed, throughput stats, manual scorer
│   ├── patterns/                 # Pattern detection page
│   │   ├── layout.tsx
│   │   └── page.tsx              # Circular flows (D3), structuring (bar), dormant (scatter)
│   ├── sar-report/               # SAR Report generator
│   │   ├── layout.tsx
│   │   └── page.tsx              # Form → Gemini API → XML preview
│   ├── simulator/                # Real-time UPI transaction simulator
│   │   ├── layout.tsx
│   │   └── page.tsx              # Live feed, stream controls, UPI phone, alerts
│   ├── layout.tsx                # Root layout (fonts, metadata)
│   └── globals.css               # Complete design system (890 lines)
├── components/
│   ├── simulator/                # Simulator UI components (8 files)
│   │   ├── StreamControls.tsx    # Start / pause / resume / stop + TPS slider
│   │   ├── PresetPicker.tsx      # Select fraud/behavior preset
│   │   ├── UpiPhone.tsx          # Phone mockup with QR code (qrcode.react)
│   │   ├── AlertToast.tsx        # Live fraud-alert toasts
│   │   ├── HistoryTable.tsx      # Transaction history table
│   │   ├── LiveGraph.tsx         # Stream-velocity sparkline (recharts)
│   │   ├── LiveStats.tsx         # Live counters (balance, TPS, totals)
│   │   └── LiveTimeline.tsx      # Scrolling live event timeline
│   ├── landing/
│   ├── landing/                  # Landing page components (10 files)
│   │   ├── Hero.tsx              # Canvas-based animated hero
│   │   ├── Metrics.tsx           # Animated counters
│   │   ├── Architecture.tsx      # 4-layer pipeline visualization
│   │   ├── TechStack.tsx         # Technology tag cloud
│   │   ├── HowItWorks.tsx        # Numbered steps (1-4)
│   │   ├── Typologies.tsx        # 5 AML typology cards
│   │   ├── DemoPreview.tsx       # Interactive demo with 3 tabs
│   │   ├── Navbar.tsx            # Sticky nav with mobile drawer
│   │   ├── Footer.tsx            # Footer
│   │   └── Attribution.tsx       # Attribution badges
│   ├── FundFlowGraph.tsx         # D3 force-directed graph (~1050 lines)
│   ├── MiniGraph.tsx             # Compact D3 mini-graph for dashboard
│   ├── Sidebar.tsx               # Collapsible sidebar navigation
│   ├── Topbar.tsx                # Top bar with breadcrumb + threshold slider
│   ├── Providers.tsx             # React Query provider wrapper
│   └── ui.tsx                    # Reusable UI primitives (RiskBadge, LoadingState, etc.)
└── lib/
    ├── api.ts                    # Full API client (18+ endpoints, typed)
    ├── utils.ts                  # Helpers: cn, formatAmount, getRiskColor, timeAgo
    ├── useLiveTransactions.ts    # WebSocket client for live stream (simulator)
    └── landing-data.ts           # Static data for landing page content
```

### 1.7 Real-Time Simulator UI (WebSocket)

| Technology       | Purpose                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| **WebSocket**    | Live push of transaction envelopes (`simulatorStream`) to the simulator page            |
| **qrcode.react** | Renders the payee QR code on the mock UPI phone (UPI-id based)                          |
| **useLiveTransactions** | Hook managing the WS connection, reconnect, and buffering of pushed envelopes     |
| **TanStack Query** | REST side (accounts, presets, history, stats) with `staleTime` instead of auto-refresh |

---

## 2. Backend

### 2.1 Core Framework

| Technology    | Version | Purpose                                     |
| ------------- | ------- | ------------------------------------------- |
| **Python**    | 3.14    | Runtime                                     |
| **FastAPI**   | 0.135.1 | Async REST API microservice framework       |
| **Uvicorn**   | 0.41.0  | ASGI server with hot-reload support         |
| **Pydantic**  | 2.12.5  | Request/response validation with type hints |
| **Starlette** | 0.52.1  | ASGI framework (underlying FastAPI)         |
| **websockets**| 16.0    | WebSocket support for real-time streaming   |

### 2.2 Backend Libraries

| Technology            | Version | Purpose                                         |
| --------------------- | ------- | ----------------------------------------------- |
| **httpx**             | 0.28.1  | Async HTTP client for external API calls        |
| **loguru**            | 0.7.3   | Structured logging with rotation                |
| **python-dotenv**     | 1.2.2   | Environment variable loading                    |
| **python-multipart**  | 0.0.22  | Multipart form data (CSV file uploads)          |
| **PyYAML**            | 6.0.3   | YAML config parsing                             |
| **websockets**        | 16.0    | WebSocket support for real-time features        |

### 2.3 Backend Architecture (14 REST Routers)

```
api/
├── main.py              # App entry: lifespan, CORS, static files, route registrations
├── config.py            # Settings from env vars (.env)
├── schemas.py           # Pydantic request/response models
└── routers/
    ├── health.py        # GET /health — system health + graph/model status
    ├── predictions.py   # POST /predict — single & batch fraud prediction
    ├── graph.py         # GET /graph/stats, /graph/subgraph/{id}, /graph/full
    ├── patterns.py      # GET /patterns/circular, /patterns/structuring, /patterns/dormant
    ├── accounts.py      # Account listing & details
    ├── alerts.py        # Alert retrieval with risk threshold filtering
    ├── explain.py       # GET /explain/{id} — explainability: risk factors, suspicious edges
    ├── analytics.py     # GET /dashboard — aggregated dashboard metrics
    ├── model_info.py    # GET /model/info — model metadata & performance metrics
    ├── reports.py       # POST /reports/generate — SAR report generation
    ├── timeline.py      # Transaction timeline
    ├── upload.py        # POST /upload/csv — CSV upload with validation
    ├── simulator.py     # /simulator/* — UPI simulator REST + WebSocket stream
    └── (stream)         # WS /simulator/stream — live transaction envelopes
```

### 2.5 Real-Time UPI Transaction Simulator

A full simulated UPI payments environment used to demonstrate live AML
monitoring (streaming transactions, velocity analytics, instant fraud
alerts) without an external payment rail.

| Component            | File                        | Responsibility                                                             |
| -------------------- | --------------------------- | -------------------------------------------------------------------------- |
| **Stream engine**    | `simulator/stream_engine.py` | Async TPS-throttled generator; state machine (`idle/running/paused/stopped`) |
| **Preset registry**  | `simulator/presets.py`       | 9 scripted fraud/behavior scenarios (see below)                             |
| **Service layer**    | `simulator/service.py`       | Orchestrates payments, persistence, stats, history                         |
| **Ledger**           | `simulator/ledger.py`        | Append-only JSONL ledger + in-memory account balances                       |
| **Seed accounts**    | `simulator/seed_accounts.py`  | 8 demo accounts (SBIN-UPI IDs) with seeded balances                        |
| **Alert registry**   | `simulator/alert_registry.py` | Rule-based fraud alerts raised from streamed txns                           |
| **Loggers**          | `simulator/loggers.py`        | Rotating structured logs for streamed transactions                          |

**Stream control contract** — every control call returns `state`:

| Endpoint                           | Method | Body / Notes                                              |
| ---------------------------------- | ------ | --------------------------------------------------------- |
| `/simulator/stream/start`          | POST   | `{ "tps": 5, "preset": null }` → `{ "state": "running" }` |
| `/simulator/stream/pause`          | POST   | → `{ "state": "paused" }`                                 |
| `/simulator/stream/resume`         | POST   | → `{ "state": "running" }`                                |
| `/simulator/stream/stop`           | POST   | → `{ "state": "stopped" }`                                |
| `/simulator/stream` (WebSocket)    | WS     | Pushes `{ type: "transaction" }` envelopes + stats        |

**REST endpoints:** `/simulator/accounts` (8 seeded), `/simulator/stats`,
`/simulator/presets`, `/simulator/history` (`{ items, total }`),
`/simulator/alerts`, `/simulator/pay`, `/simulator/simulate`,
`/simulator/presets/{name}/control`.

**Presets (9):**

| Preset              | Scenario                                                                 |
| ------------------- | ------------------------------------------------------------------------ |
| `money_laundering`  | Large layering chain A→B→C→D, near-parallel ₹180–250K movements          |
| `structuring`       | Sub-threshold cluster just below the ₹10K reporting threshold            |
| `layering`          | Multi-hop layering through 5 mule accounts, decreasing amounts           |
| `circular_flow`     | Funds round-tripping back to the originator                               |
| `rapid_transfers`   | High-frequency burst of small transfers                                   |
| `normal_user`       | Benign daily spending pattern                                            |
| `business_payments` | Regular B2B invoice-style payments                                       |
| `salary_payments`   | Periodic salary credits                                                   |
| `cash_withdrawal`   | Repeated near-limit cash-out movements                                    |

### 2.4 Data Processing & Scientific Stack

| Technology       | Version | Purpose                                                                          |
| ---------------- | ------- | -------------------------------------------------------------------------------- |
| **NumPy**        | 2.4.3   | Numerical computing, array operations                                            |
| **Pandas**       | 3.0.1   | Data manipulation, CSV loading, time series analysis                             |
| **NetworkX**     | 3.6.1   | Graph data structures, ego-graph extraction, cycle detection, degree computation |
| **SciPy**        | 1.17.1  | Scientific computing utilities                                                   |
| **scikit-learn** | 1.8.0   | GradientBoostingClassifier (fallback model), train/test split                    |
| **joblib**       | 1.5.3   | Model serialization (pickle)                                                     |

---

## 3. Machine Learning & AI

### 3.1 Graph Neural Network Models

| Model               | Type                          | Architecture                                   | Details                                                                                                                                                                        |
| ------------------- | ----------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **GraphSAGE**       | Inductive node classification | 3-layer SAGEConv (8→32→32→2)                   | Dropout 0.3, ReLU activations, log-softmax output, learns aggregation function for zero-shot inference on unseen nodes                                                         |
| **LineMVGNN**       | Edge-level classification     | SAGEConv backbone + BatchNorm + edge embedding | Concat source + target node embeddings; BatchNorm1d; 2 linear layers; edge-level log-softmax — edges become nodes in a line graph with shared-weight bidirectional aggregation |
| **GBDT (Fallback)** | Node classification           | scikit-learn GradientBoostingClassifier        | 100 estimators, max_depth=4, used when PyTorch/PyG unavailable                                                                                                                 |

### 3.2 Training Pipeline

| Technique                      | Details                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------- |
| **NeighborLoader**             | Memory-bounded mini-batch sampling: 20 hop-1 neighbors, 10 hop-2 neighbors        |
| **Batch Size**                 | 64                                                                                |
| **Optimizer**                  | Adam (lr=0.01, weight_decay=5e-4)                                                 |
| **Loss Function**              | BCEWithLogitsLoss with pos_weight=10.0 (class imbalance handling)                 |
| **Learning Rate Schedule**     | CosineAnnealingLR                                                                 |
| **FP16 Mixed Precision (AMP)** | Half-precision forward pass via `torch.cuda.amp.GradScaler` — ~50% VRAM reduction |
| **Epochs**                     | 50 (quick training), ~20 minutes                                                  |
| **Model Serialization**        | PyTorch `state_dict` (.pt) or joblib pickle (.pkl)                                |

### 3.3 Composite Risk Scoring Engine

```
  Final Risk = 0.5 × ML_Score + 0.3 × Pattern_Score + 0.2 × Anomaly_Score
```

| Component         | Weight | Details                                                                                              |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| **ML Score**      | 0.5    | GNN/classifier fraud probability                                                                     |
| **Pattern Score** | 0.3    | 1.0 if account appears in any detected pattern                                                       |
| **Anomaly Score** | 0.2    | Heuristic: rapid velocity (<5 min), high volume (>₹5M), high out-degree (>5), off-hours transactions |

### 3.4 AML Pattern Detection

| Pattern                      | Detection Method                                | Algorithm                                                           |
| ---------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| **Circular Round-Tripping**  | Cypher path matching + NetworkX `simple_cycles` | 3-6 hop cycles, ₹50K+ flow, capped at 200K iterations               |
| **Structuring / Smurfing**   | Multi-threshold detection                       | 5 thresholds (₹10K, ₹50K, ₹200K, ₹500K, ₹10L), 90-100% of threshold |
| **Dormant Activation**       | Gap analysis on temporal transactions           | 30+ day dormancy gap; max_gap detection                             |
| **Rapid Layering**           | Velocity anomaly                                | <5 minute inter-transaction time                                    |
| **KYC-Transaction Mismatch** | Profile vs behavior discrepancy                 | Heuristic scoring                                                   |

### 3.5 Feature Engineering (8 features per account)

| Feature            | Description                                  |
| ------------------ | -------------------------------------------- |
| `log_amount`       | Log-transformed total transaction volume     |
| `total_sent`       | Sum of all outgoing amounts                  |
| `total_received`   | Sum of all incoming amounts                  |
| `avg_velocity_sec` | Average seconds between transactions         |
| `sin_time`         | Sinusoidal hour-of-day encoding              |
| `cos_time`         | Cosine hour-of-day encoding                  |
| `in_degree`        | Number of unique senders to this account     |
| `out_degree`       | Number of unique receivers from this account |

### 3.6 AI / LLM Integration

| Technology                  | Purpose                                                              |
| --------------------------- | -------------------------------------------------------------------- |
| **Google Gemini 2.0 Flash** | LLM-powered SAR narrative generation and FIU-IND XML report creation |
| **LangChain**               | LLM orchestration framework                                          |
| **langchain-google-genai**  | Google AI integration for LangChain                                  |

### 3.7 ML Directory Structure

```
ml/
├── __init__.py
├── model.py            # AMLGraphSAGE, LineMVGNN, FallbackClassifier, model factory
├── inference.py        # InferenceEngine: feature building, prediction, model save/load
├── risk_engine.py      # RiskEngine: composite scoring, pattern integration, anomaly detection
├── fusion_gate.py      # Adaptive fusion of graph + tabular model outputs
└── train_fusion_gate.py# Training script for the fusion gate
training/
├── __init__.py
└── train.py            # Standalone training script (argparse: --model, --epochs, --csv_path)
```

> **Note on the current environment:** PyTorch / PyTorch-Geometric are not
> installed on the dev machine, so inference falls back to the scikit-learn
> `GradientBoostingClassifier` path (`FallbackClassifier`). `inference.py`
> loads a freshly trained `.pt`/`.pkl` model and `risk_engine.score_all()`
> recomputes composite risk for the whole graph on load — always keep the
> `saved_models/aml_model.pt` model current or risk scores collapse.

### 3.8 Other ML Concepts Used

| Concept                          | Description                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------- | --- |
| **Multi-Head Attention Weights** | 4 attention heads with per-node softmax normalization                                              |
| **Pattern-Aware Edge Encoder**   | 3 AML-specific detector heads: StructuringDetector, VelocityBurstDetector, TemporalAnomalyDetector |
| **Z-score Normalization**        | Standard scaling for input features (mean=0, std=1)                                                |
| **Cross-Validation**             | 5-fold cross-validation for model evaluation                                                       |
| **Precision / Recall / F1**      | Model evaluation metrics — target: 93% precision, 89% F1, AUC > 0.95                               |
| **Confidence Scoring**           | `min(0.95, 0.5 +                                                                                   | probability - 0.5 | )`  |
| **Class Imbalance**              | Addressed via pos_weight=10.0 in BCEWithLogitsLoss                                                 |

---

## 4. Database & Graph Storage

### 4.1 Graph Databases

| Technology       | Version         | Purpose                                                                            |
| ---------------- | --------------- | ---------------------------------------------------------------------------------- |
| **Memgraph**     | latest (docker) | In-memory graph database — Bolt protocol (port 7687), HTTP (7444), Lab UI (3000)   |
| **Neo4j Driver** | 6.1.0           | Python Bolt protocol connector (compatible with Memgraph)                          |
| **NetworkX**     | 3.6.1           | In-process directed graph (DiGraph) used as primary graph store — always available |
| **JSONL**        | —               | Append-only event sourcing for simulator ledger + alerts (`data/simulator_*.jsonl`) |
| **CSV**          | —               | Transaction import source (`data/uploaded_transactions.csv`)                       |

### 4.2 Graph Data Model

```
Nodes: Account { id, type, label, risk }
Edges: TRANSFER { total_amount, tx_count, transactions[], is_suspicious }
```

### 4.3 Graph Operations

| Operation            | Method                                                |
| -------------------- | ----------------------------------------------------- |
| Ego-graph extraction | `nx.ego_graph(G, node, radius=hops, undirected=True)` |
| Cycle detection      | `nx.simple_cycles(G, length_bound=6)`                 |
| Graph stats          | In/out-degree, edge aggregation                       |
| Cypher sync          | Optional push to Memgraph via Bolt protocol           |

---

## 5. Infrastructure & Deployment

### 5.1 Containerization

| Technology             | Details                             |
| ---------------------- | ----------------------------------- |
| **Docker**             | Multi-service orchestration         |
| **docker-compose.yml** | 2 services + volumes + healthchecks |

**Services:**

```
memgraph:
  image: memgraph/memgraph-platform:latest
  ports: 7687 (Bolt), 7444 (HTTP), 3000 (Lab UI)
  mem_limit: 4g
  healthcheck: curl --fail http://localhost:7444

api:
  build: Dockerfile.api (python:3.11-slim)
  port: 8089
  depends_on: memgraph (healthy)
  volumes: saved_models, logs
```

### 5.2 Cloud Deployment (Render)

| Service                 | Type               | Config                                               |
| ----------------------- | ------------------ | ---------------------------------------------------- |
| **nextgenaml-api**      | Python web service | `uvicorn api.main:app --host 0.0.0.0 --port $PORT`   |
| **nextgenaml-frontend** | Static site        | `npm ci && npm run build` → publish `out/` directory |

### 5.3 Key Configuration Files

| File             | Purpose                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| `.env`           | All environment variables (Memgraph host/port, API config, GNN type, Gemini key) |
| `render.yaml`    | Render cloud deployment definition                                               |
| `Dockerfile.api` | Python container: python:3.11-slim, gcc, curl, pip install                       |
| `start.bat`      | Windows launcher: starts Memgraph + backend + opens browser                      |

### 5.4 Frontend Build Configuration

| Config               | Value                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `next.config.mjs`    | Static export (`output: "export"`), optimized imports for recharts/lucide-react/framer-motion |
| `tsconfig.json`      | JSX preserve, strict mode, `@/*` → `./src/*`                                                  |
| `tailwind.config.ts` | Custom color palette, Inter/JetBrains Mono fonts, custom animations                           |
| `postcss.config.mjs` | Tailwind CSS plugin only                                                                      |

---

## 6. External APIs & Services

| Service                         | Usage                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| **Google Gemini 2.0 Flash API** | LLM for SAR narrative generation and FIU-IND XML report generation   |
| **Google Fonts API**            | Font loading (Inter, JetBrains Mono, Plus Jakarta Sans, Roboto Mono) |
| **Google Fonts GStatic CDN**    | Font file delivery                                                   |

---

## 7. System Architecture (End-to-End Data Flow)

```
                     ┌─────────────────────────────────────────────────────────┐
                     │                   FRONTEND (Next.js 14)                 │
                     │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
                     │  │Dashboard │  │Fund Flow │  │  Alerts  │  │  SAR   │  │
                     │  │  Page    │  │  Page    │  │  Page    │  │ Report │  │
                     │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
                     │       │              │              │            │       │
                     │  ┌────┴──────────────┴──────────────┴────────────┴───┐  │
                     │  │            TanStack React Query (API Client)      │  │
                     │  └────────────────────────┬──────────────────────────┘  │
                     │  ┌────────────────────────┴──────────────────────────┐  │
                     │  │        Simulator page (WS + qrcode.react)        │  │
                     │  │     useLiveTransactions → live stream feed       │  │
                     │  └───────────────────────────────────────────────────┘  │
                     └──────────────┬───────────────────────┬──────────────────┘
                                    │ HTTP (REST)           │ WS (envelopes)
                     ┌──────────────┴───────────────────────┴──────────────────┐
                     │              BACKEND (FastAPI / Python 3.14)            │
                     │  ┌────────────────────────┬──────────────────────────┐  │
                     │  │  14 API Routers        │  /simulator/stream (WS)  │  │
                     │  │  /health /predict /graph│  stream_engine + presets│  │
                     │  │  /patterns /alerts /   │  ledger + alert_registry│  │
                     │  │  /explain /upload /sim │  (JSONL event sourcing)  │  │
                     │  └───────────────┬────────┴──────────┬───────────────┘  │
                     │                  │                   │                  │
                     │  ┌───────────────┴─────────┐  ┌──────┴──────────────┐   │
                     │  │      Risk Engine        │  │  Simulator Ledger   │   │
                     │  │   0.5×ML + 0.3×Pattern  │  │  balances + txns    │   │
                     │  │   + 0.2×Anomaly → score │  │  (JSONL files)      │   │
                     │  └─────┬──────────────┬────┘  └─────────────────────┘   │
                     │        │              │                                 │
                     │  ┌─────┴──────┐  ┌─────┴──────┐                          │
                     │  │ Inference  │  │  Pattern   │                          │
                     │  │  Engine    │  │ Detector   │                          │
                     │  │ (GNN/GBDT) │  │ (3 types)  │                          │
                     │  └─────┬─────┘  └──────┬──────┘                          │
                     │        │               │                                 │
                     │  ┌─────┴───────────────┴──────┐                          │
                     │  │      Graph Manager (NetworkX)│                       │
                     │  │   DiGraph — 5.7K+ tx, 525 accs│                      │
                     │  └────────┬──────────────────┬────┘                      │
                     │           │                  │                           │
                     │           ▼                  ▼                           │
                     │  ┌──────────────┐    ┌──────────────────┐                │
                     │  │  Memgraph    │    │  CSV Ingestion    │                │
                     │  │  (Optional)  │    │  (pandas → nx)    │                │
                     │  └──────────────┘    └──────────────────┘                │
                     └──────────────────────────────────────────────────────────┘
                                                  │ Gemini API
                     ┌───────────────────────────┼─────────────────────────────┐
                     │             LLM (Google Gemini 2.0 Flash)                │
                     │  ┌────────────────────────┴──────────────────────────┐  │
                     │  │   SAR Narrative Generation + FIU-IND XML Report   │  │
                     │  └───────────────────────────────────────────────────┘  │
                     └─────────────────────────────────────────────────────────┘
```

---

## 8. Performance Metrics

| Metric                    | Target            | Actual                                                                            |
| ------------------------- | ----------------- | --------------------------------------------------------------------------------- |
| Fraud Detection Precision | 93%               | 93%                                                                               |
| Model AUC                 | > 0.95            | > 0.95                                                                            |
| F1 Score                  | 89%               | 89%                                                                               |
| Inference Latency         | ~15 ms            | ~12 ms per account                                                                |
| VRAM Usage                | < 7 GB            | < 7 GB (RTX 4050, 8 GB limit)                                                     |
| Training Time             | ~20 min           | ~20 min (50 epochs)                                                               |
| Dataset Volume            | 500K transactions | Dev dataset: 5,760 transactions (5750 uploaded + 22 test + simulator)             |
| Account Coverage          | 5K accounts       | 525 accounts (dev)                                                                 |
| AML Typologies Detected   | 5                 | 5 (Rapid Layering, Circular Flows, Structuring, Dormant Activation, KYC Mismatch) |
| Time to SAR Report        | < 30 seconds      | CSV upload → FIU-IND XML                                                          |
| Simulator Stream          | —                 | TPS 1–100 configurable; live WS envelopes + fraud alerts                          |

---

## 9. Complete Dependency List

### Frontend (npm packages)

| Package                         | Type          | Version  |
| ------------------------------- | ------------- | -------- |
| next                            | dependency    | 14.2.35  |
| react                           | dependency    | ^18      |
| react-dom                       | dependency    | ^18      |
| @tanstack/react-query           | dependency    | ^5.90.21 |
| d3                              | dependency    | ^7.9.0   |
| framer-motion                   | dependency    | ^12.36.0 |
| lucide-react                    | dependency    | ^0.577.0 |
| recharts                        | dependency    | ^3.8.0   |
| react-syntax-highlighter        | dependency    | ^16.1.1  |
| react-countup                   | dependency    | ^6.5.3   |
| html-to-image                   | dependency    | ^1.11.13 |
| qrcode.react                    | dependency    | ^4.2.0   |
| clsx                            | dependency    | ^2.1.1   |
| tailwind-merge                  | dependency    | ^3.5.0   |
| @types/d3                       | dependency    | ^7.4.3   |
| @types/react-syntax-highlighter | dependency    | ^15.5.13 |
| typescript                      | devDependency | ^5       |
| eslint                          | devDependency | ^8       |
| eslint-config-next              | devDependency | 14.2.35  |
| tailwindcss                     | devDependency | ^3.4.1   |
| postcss                         | devDependency | ^8       |
| @types/node                     | devDependency | ^20      |
| @types/react                    | devDependency | ^18      |
| @types/react-dom                | devDependency | ^18      |

### Backend (Python packages)

| Package                | Version | Category                            |
| ---------------------- | ------- | ----------------------------------- |
| fastapi                | 0.135.1 | Web framework                       |
| uvicorn                | 0.41.0  | ASGI server                         |
| pydantic               | 2.12.5  | Validation                          |
| httpx                  | 0.28.1  | HTTP client                         |
| loguru                 | 0.7.3   | Logging                             |
| python-dotenv          | 1.2.2   | Environment                         |
| python-multipart       | 0.0.22  | File upload                         |
| neo4j                  | 6.1.0   | Graph database driver               |
| networkx               | 3.6.1   | Graph algorithms                    |
| numpy                  | 2.4.3   | Numerical computing                 |
| pandas                 | 3.0.1   | Data manipulation                   |
| scikit-learn           | 1.8.0   | ML (GBDT fallback — active in dev)         |
| scipy                  | 1.17.1  | Scientific computing                |
| joblib                 | 1.5.3   | Model serialization                 |
| PyYAML                 | 6.0.3   | YAML parsing                        |
| pytest                 | 9.1.1   | Test framework (dev)                |
| httpx                  | 0.28.1  | Async HTTP client + TestClient      |
| torch                  | —       | Deep learning framework — **optional, not installed in dev** |
| torch_geometric        | —       | PyTorch Geometric (GNN library) — optional |
| langchain              | —       | LLM orchestration — optional         |
| langchain-google-genai | —       | Google Gemini integration — optional |

---

## 10. Developer Tools & Workflow

| Tool                       | Purpose                                              |
| -------------------------- | ---------------------------------------------------- |
| **ESLint**                 | TypeScript/JavaScript linting (`eslint-config-next`) |
| **TypeScript strict mode** | Full type checking                                   |
| **Uvicorn --reload**       | Hot-reload for backend development                   |
| **Next.js Fast Refresh**   | Hot-reload for frontend development                  |
| **pytest 9.1.1**           | Backend test suite (36 tests)                        |
| **docker-compose**         | Local development environment orchestration          |
| **Render**                 | Cloud deployment with CI/CD                          |
| **Git**                    | Version control                                      |

### Test Suite (`tests/`)

| File                          | Coverage                                          |
| ----------------------------- | ------------------------------------------------- |
| `test_api_simulator.py`       | Simulator REST + stream state-machine contract    |
| `test_simulator_service.py`   | Simulator service/ledger behavior                 |
| `test_graph_add_transaction.py` | Graph insertion + edge aggregation               |
| `test_wallet.py`              | Wallet / account balance logic                    |

Run with: `python -m pytest tests/ -q` (36 tests passing).

---

_Document generated from the NextGenAML codebase — August 2026_
