# NextGenAML V2 – Complete Project Information Document

### Next-Generation Anti-Money Laundering Fund Flow Tracking System

**X-Bank of India | Problem Statement 3 | Hackathon 2026**

---

## 1. PROJECT OVERVIEW

### Problem Statement

X-Bank of India needs an intelligent system to detect money laundering by tracking end-to-end fund flows across thousands of accounts. The system must identify:

| AML Typology                 | Description                                                   |
| ---------------------------- | ------------------------------------------------------------- |
| **Rapid Layering**           | Funds moved through multiple accounts within minutes          |
| **Circular Transactions**    | Round-trip flows: A→B→C→A to obscure origin                   |
| **Structuring (Smurfing)**   | Multiple transactions just below ₹10 lakh reporting threshold |
| **Dormant Activation**       | Inactive accounts suddenly receiving large transfers          |
| **KYC-Transaction Mismatch** | Customer profile doesn't match actual transaction behavior    |

### Solution

NextGenAML is a **microservices-based Graph Neural Network system** with:

1. **In-memory property graph** (NetworkX) built from raw CSV transactions
2. **Graph Neural Network** models (LineMVGNN, GraphSAGE) for fraud detection
3. **FastAPI backend** serving REST endpoints for predictions, patterns, and analytics
4. **Next.js 14 frontend** with D3.js force-directed graph visualization
5. **FIU-IND XML compliance reports** auto-generated via Google Gemini AI
6. **Composite risk scoring** fusing ML, pattern detection, and anomaly signals

---

## 2. TECHNOLOGY STACK

### Backend (Python 3.11+)

| Component     | Technology   | Version | Purpose                            |
| ------------- | ------------ | ------- | ---------------------------------- |
| API Framework | **FastAPI**  | 0.135.1 | Async REST microservice            |
| ASGI Server   | **Uvicorn**  | 0.41.0  | Production ASGI runner             |
| Validation    | **Pydantic** | 2.12.5  | Request/response schema validation |
| Logging       | **Loguru**   | 0.7.3   | Structured logging                 |
| HTTP Client   | **httpx**    | 0.28.1  | Async HTTP requests                |

### Machine Learning

| Component       | Technology                           | Version       | Purpose                                    |
| --------------- | ------------------------------------ | ------------- | ------------------------------------------ |
| DL Framework    | **PyTorch**                          | 2.1.0         | Core neural network engine                 |
| GNN Library     | **PyTorch Geometric**                | 2.5.x         | Graph convolution operations               |
| Custom Model    | **LineMVGNN**                        | v2.0          | Line graph + bidirectional message passing |
| Inductive Model | **GraphSAGE**                        | via SAGEConv  | Dormant account inference                  |
| Fallback        | **Gradient Boosting** (scikit-learn) | 1.8.0         | Classifier when GPU unavailable            |
| Data            | **NumPy** / **Pandas**               | 2.4.3 / 3.0.1 | Numerical computation / data manipulation  |

### Graph Database

| Component       | Technology       | Version         | Purpose                                   |
| --------------- | ---------------- | --------------- | ----------------------------------------- |
| In-memory Graph | **NetworkX**     | 3.6.1           | Primary directed graph (always available) |
| Graph DB (opt)  | **Memgraph**     | Latest (Docker) | Optional Cypher graph DB                  |
| Driver          | **Neo4j driver** | 6.1.0           | Memgraph/Neo4j connectivity               |

### Frontend (TypeScript / Node.js)

| Component           | Technology                | Version | Purpose                                     |
| ------------------- | ------------------------- | ------- | ------------------------------------------- |
| Framework           | **Next.js**               | 14.2.35 | React framework (App Router, static export) |
| UI Library          | **React**                 | 18      | Component-based UI                          |
| Language            | **TypeScript**            | 5       | Type safety                                 |
| Styling             | **Tailwind CSS**          | 3.4.1   | Utility-first CSS framework                 |
| State Management    | **@tanstack/react-query** | 5.90.21 | Server state caching & refetching           |
| Graph Visualization | **D3.js**                 | 7.9.0   | Force-directed graph rendering              |
| Animations          | **Framer Motion**         | 12.36.0 | UI transitions & panel animations           |
| Charts              | **Recharts**              | 3.8.0   | Area, bar, scatter, radial bar charts       |
| Icons               | **Lucide React**          | 0.577.0 | Icon library                                |
| Counters            | **React CountUp**         | 6.5.3   | Animated number counters                    |

### AI / Compliance

| Component         | Technology                  | Version | Purpose                                |
| ----------------- | --------------------------- | ------- | -------------------------------------- |
| LLM Orchestration | **LangChain**               | 0.2.1   | Prompt chaining for SAR generation     |
| LLM Model         | **Google Gemini 2.0 Flash** | —       | SAR narrative + FIU-IND XML generation |
| Integration       | **langchain-google-genai**  | 1.0.4   | Gemini API connector                   |

### Infrastructure

| Component        | Technology                             | Purpose                                            |
| ---------------- | -------------------------------------- | -------------------------------------------------- |
| Containerization | **Docker + Docker Compose**            | Memgraph + API orchestration                       |
| Cloud Deploy     | **Render**                             | Backend: Python web service, Frontend: static site |
| Monitoring       | **Prometheus** (via prometheus-client) | Metrics scraping at `/metrics`                     |

---

## 3. SYSTEM ARCHITECTURE

````
┌──────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER (NetworkX DiGraph)                    │
│  Accounts (nodes) ←──TRANSACTION──→ Accounts (nodes)                     │
│  Properties: id, risk_score, pattern_flags                                │
│  Edge Props: amount, timestamp, is_suspicious, features                   │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ┌────────────────────────────▼─────────────────────────────────────────────┐
                             │                      ML INFERENCE LAYER (PyTorch)                        │
                             │  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────────────┐  │
                             │  │ RiskEngine   │  │   LineMVGNN      │  │  GraphSAGE / GBDT          │  │
                             │  │ - ML Score   │  │ - Line Graph L(G)│  │  - Inductive inference     │  │
                             │  │ - Pattern    │  │ - Bidirectional  │  │  - Fallback when GPU busy   │  │
                             │  │ - Anomaly    │  │ - Edge classify  │  │  - Zero-shot for new nodes │  │
                             │  │ - Fusion: 5  │  │                  │  │                            │  │
                             │  │   3 patterns │  │  Attention-based  │  │  Gradient boosting tree    │  │
                             │  │   + 2 stats  │  │  edge weighting  │  │  (85% recall, 89% prec)   │  │
                             │  └──────────────┘  └──────────────────┘  └────────────────────────────┘  │
                             └────────────────────────────┬─────────────────────────────────────────────┘
                                                          │ HTTP REST (JSON)
                                                          ┌────────────────────────────▼─────────────────────────────────────────────┐
                                                          │                      FASTAPI MICROSERVICE (:8089)                        │
                                                          │  /ping  /health  /graph/subgraph/{id}  /graph/full  /graph/stats         │
                                                          │  /predict  /predict/batch  /explain/{id}                                 │
                                                          │  /alert  /accounts  /accounts/{id}  /accounts/count                      │
                                                          │  /patterns/circular  /patterns/structuring  /patterns/dormant  /patterns │
                                                          │  /monitor/transaction  /monitor/statistics  /analytics  /dashboard       │
                                                          │  /reports/generate  /reports  /reports/stats  /timeline/{id}             │
                                                          │  /upload/csv  /upload/status  /model/info  /metrics                      │
                                                          └────────────────────────────┬─────────────────────────────────────────────┘
                                                                                       │ fetch() / React Query
                                                                                       ┌────────────────────────────▼─────────────────────────────────────────────┐
                                                                                       │                   NEXT.JS FRONTEND (:3000)                                │
                                                                                       │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐ ┌───────────────┐  │
                                                                                       │  │ Dashboard│ │Fund Flow  │ │ Alerts   │ │Patterns│ │ SAR Report    │  │
                                                                                       │  │ - KPIs   │ │ - D3.js   │ │ - Triage │ │ - Circ │ │ - Gemini AI   │  │
                                                                                       │  │ - Charts │ │   Force   │ │ - Filter │ │ - Str  │ │ - FIU-IND XML │  │
                                                                                       │  │ - Alerts │ │   Graph   │ │ - Sort   │ │ - Dor  │ │ - Download    │  │
                                                                                       │  │ - Upload │ │ 3 layouts │ │ - Paginat│ │ Charts │ │               │  │
                                                                                       │  └──────────┘ └───────────┘ └──────────┘ └────────┘ └───────────────┘  │
                                                                                       │  ┌─────────────────────────────────────────────────────────────────────┐ │
                                                                                       │  │ Shared App Shell: Sidebar + Topbar + Content Area                   │ │
                                                                                       │  │ Global: Dark theme, responsive, static-export ready                 │ │
                                                                                       │  └─────────────────────────────────────────────────────────────────────┘ │
                                                                                       └──────────────────────────────────────────────────────────────────────────┘
                                                                                       ```

                                                                                       ### Frontend Architecture (Next.js App Router)

                                                                                       ```
                                                                                       nextgen-frontend/src/
                                                                                       ├── app/
                                                                                       │   ├── (landing)/page.tsx          Marketing landing page (10 sections)
                                                                                       │   ├── dashboard/page.tsx          System overview, KPIs, alert feed
                                                                                       │   ├── fund-flow/page.tsx          Fund flow graph search/explore
                                                                                       │   ├── fund-flow/[accountId]/      Direct account fund flow analysis
                                                                                       │   ├── alerts/page.tsx             Alert triage with filters & pagination
                                                                                       │   ├── patterns/page.tsx           Pattern detector (circular, structuring, dormant)
                                                                                       │   ├── sar-report/page.tsx         SAR report generator with FIU-IND XML
                                                                                       │   ├── monitor/page.tsx            Real-time transaction monitor + scorer
                                                                                       │   ├── layout.tsx                  Root layout
                                                                                       │   └── globals.css                 895-line design system (dark theme)
                                                                                       ├── components/
                                                                                       │   ├── FundFlowGraph.tsx           D3.js force-directed graph (1050 lines)
                                                                                       │   ├── MiniGraph.tsx               Compact graph for dashboard
                                                                                       │   ├── Sidebar.tsx                 Collapsible navigation
                                                                                       │   ├── Topbar.tsx                  Breadcrumb, health, alerts
                                                                                       │   ├── ui.tsx                      Reusable: RiskBadge, ProbabilityBar, etc.
                                                                                       │   └── landing/                    10 landing page section components
                                                                                       └── lib/
                                                                                           ├── api.ts                      Full API client (275 lines)
                                                                                               └── utils.ts                    Formatting, risk levels, colors
                                                                                               ```

                                                                                               ### App Shell (Shared Layout)

                                                                                               ```
                                                                                               ┌──────────────────────────────────────────────────┐
                                                                                               │  Sidebar  │  Topbar (breadcrumb, health, bell)   │
                                                                                               │  ───────  │──────────────────────────────────────│
                                                                                               │  ██ Logo  │                                      │
                                                                                               │  ██       │  Main Content Area                    │
                                                                                               │  ██ Nav   │  (page-specific component)            │
                                                                                               │  ██ Items │                                      │
                                                                                               │  ██       │                                      │
                                                                                               │  ██       │                                      │
                                                                                               │  ██       │                                      │
                                                                                               └──────────┴───────────────────────────────────────┘
                                                                                               ```

                                                                                               ---

                                                                                               ## 4. FUND FLOW GRAPH – D3.js Force-Directed Visualization

                                                                                               ### Core Component: `FundFlowGraph.tsx` (~1050 lines)

                                                                                               The fund flow graph is the centerpiece of the application, implemented as a full-featured D3.js force-directed graph inside a React component.

                                                                                               #### Features

                                                                                               | Feature | Details |
                                                                                               |---|---|
                                                                                               | **Layouts** | Force-directed, Circular, Hierarchical |
                                                                                               | **Zoom/Pan** | D3 zoom behavior (0.1x–4x), buttons for zoom in/out/fit |
                                                                                               | **Filter** | "Suspicious Only" toggle to hide non-suspicious edges |
                                                                                               | **Interaction** | Click node → Node Intelligence panel (right sidebar) |
                                                                                               | **Drag** | D3 drag with click-distance tolerance (4px) |
                                                                                               | **Animations** | Staggered node entrance (radius 0→final), pulsing rings (CSS) |
                                                                                               | **Edge Styles** | Color-coded by suspicion, animated dash for suspicious flows |
                                                                                               | **Node Styles** | Glow filter for flagged/center nodes, ring pulse animation |
                                                                                               | **Mini-map** | Preview of all nodes in bottom-right corner |
                                                                                               | **Tooltips** | Edge hover shows transaction amount |
                                                                                               | **Data** | Fetched via React Query from `/graph/subgraph/{id}` or `/graph/full` |

                                                                                               #### D3 Force Simulation Configuration

                                                                                               | Parameter | Value | Purpose |
                                                                                               |---|---|---|
                                                                                               | `alphaDecay` | 0.05 | Simulation cools in ~2.5s |
                                                                                               | `velocityDecay` | 0.5 | Dampens oscillation |
                                                                                               | `alphaMin` | 0.001 | Simulation stops when cool enough |
                                                                                               | Link Distance | 100 | Edge target length |
                                                                                               | Link Strength | 0.5 | Edge pull force |
                                                                                               | Charge (force) | -300 | Node repulsion in force layout |
                                                                                               | Charge (other) | -50 | Weak repulsion in circular/hierarchical |
                                                                                               | Collision Radius | 30 | Prevents node overlap |
                                                                                               | Settle Timer | 2500ms | Explicit `sim.stop()` after layout settles |

                                                                                               #### Drag & Click Handling

                                                                                               The drag/click interaction went through multiple revisions to eliminate jitter and shuffling:

                                                                                               | Mechanism | Behavior |
                                                                                               |---|---|
                                                                                               | **`clickDistance`** | 4px — mouse movements under 4px are treated as clicks, not drags |
                                                                                               | **Drag `start`** | Pins node at current position (`fx = d.x`) |
                                                                                               | **Drag `drag`** | Reheats simulation (`alphaTarget(0.3).restart()`), follows mouse |
                                                                                               | **Drag `end`** | Click: `setSelectedNode(d.id)`, node stays pinned. Drag: node stays pinned at drop position |
                                                                                               | **Simulation restart** | Only on actual `drag` (mousemove > 4px), never on click |

                                                                                               #### Node Intelligence Panel (Right Sidebar)

                                                                                               When a node is clicked, a 320px panel slides in from the right showing:

                                                                                               | Section | Content |
                                                                                               |---|---|
                                                                                               | **Account ID** | Full account identifier with risk-colored text |
                                                                                               | **Risk Score** | Semicircle gauge (0–100) |
                                                                                               | **Fraud Probability** | Animated CountUp percentage + RiskBadge |
                                                                                               | **Risk Factors** | ML prediction, pattern detection, anomaly scores |
                                                                                               | **Pattern Analysis** | Structuring, velocity, temporal anomaly bars |
                                                                                               | **Suspicious Edges** | Up to 5 suspicious outgoing edges with amounts |
                                                                                               | **Recommendation** | Action text based on risk level |
                                                                                               | **Actions** | "Generate SAR" → `/sar-report` page, "Open in Fund Flow" |

                                                                                               ---

                                                                                               ## 5. BACKEND API ENDPOINTS (Complete Reference)

                                                                                               ### Health & Monitoring

                                                                                               | Method | Endpoint | Description |
                                                                                               |---|---|---|
                                                                                               | GET | `/ping` | Simple health check |
                                                                                               | GET | `/health` | Full health (model, graph status) |
                                                                                               | GET | `/metrics` | Prometheus metrics scrape |

                                                                                               ### Graph

                                                                                               | Method | Endpoint | Description |
                                                                                               |---|---|---|
                                                                                               | GET | `/graph/subgraph/{account_id}` | Ego-subgraph (nodes + edges) for visualization |
                                                                                               | GET | `/graph/full` | Full graph with risk-based truncation |
                                                                                               | GET | `/graph/stats` | Graph summary (accounts, transactions, flagged) |

                                                                                               ### Predictions

                                                                                               | Method | Endpoint | Description |
                                                                                               |---|---|---|
                                                                                               | POST | `/predict` | Single account risk prediction |
                                                                                               | POST | `/predict/batch` | Batch prediction for multiple accounts |
                                                                                               | POST | `/monitor/transaction` | Real-time single transaction scoring |
                                                                                               | GET | `/monitor/statistics` | Monitoring stats (throughput, alert rate) |

                                                                                               ### Accounts

                                                                                               | Method | Endpoint | Description |
                                                                                               |---|---|---|
                                                                                               | GET | `/accounts/` | List accounts with filters (risk, pattern, status, search) |
                                                                                               | GET | `/accounts/count` | Account count by status |
                                                                                               | GET | `/accounts/{account_id}` | Single account detail |

                                                                                               ### Alerts

                                                                                               | Method | Endpoint | Description |
                                                                                               |---|---|---|
                                                                                               | POST | `/alert` | Retrieve alerts above threshold |

                                                                                               ### Explainability

                                                                                               | Method | Endpoint | Description |
                                                                                               |---|---|---|
                                                                                               | GET | `/explain/{account_id}` | Risk factors, suspicious edges, recommendations |

                                                                                               ### Patterns

                                                                                               | Method | Endpoint | Description |
                                                                                               |---|---|---|
                                                                                               | GET | `/patterns/circular` | Circular transaction cycles |
                                                                                               | GET | `/patterns/structuring` | Structuring/smurfing patterns |
                                                                                               | GET | `/patterns/dormant` | Dormant account activations |
                                                                                               | GET | `/patterns/all` | All patterns in one call |

                                                                                               ### Analytics

                                                                                               | Method | Endpoint | Description |
                                                                                               |---|---|---|
                                                                                               | GET | `/analytics` | Aggregated analytics for charts |
                                                                                               | GET | `/dashboard` | Main dashboard KPIs |

                                                                                               ### Model

                                                                                               | Method | Endpoint | Description |
                                                                                               |---|---|---|
                                                                                               | GET | `/model/info` | Model metadata (version, metrics) |

                                                                                               ### Reports

                                                                                               | Method | Endpoint | Description |
                                                                                               |---|---|---|
                                                                                               | GET | `/reports/` | List available reports |
                                                                                               | GET | `/reports/stats` | Report statistics |
                                                                                               | POST | `/reports/generate` | Generate SAR-style report |

                                                                                               ### Timeline

                                                                                               | Method | Endpoint | Description |
                                                                                               |---|---|---|
                                                                                               | GET | `/timeline/{account_id}` | Transaction timeline for account |

                                                                                               ### Upload

                                                                                               | Method | Endpoint | Description |
                                                                                               |---|---|---|
                                                                                               | POST | `/upload/csv` | Upload CSV, retrain model, recompute |
                                                                                               | GET | `/upload/status` | Currently loaded dataset info |

                                                                                               ### Root

                                                                                               | Method | Endpoint | Description |
                                                                                               |---|---|---|
                                                                                               | GET | `/` | Serves frontend static files or JSON status |

                                                                                               ---

                                                                                               ## 6. RISK SCORING ENGINE

                                                                                               ### 6-Model Composite Pipeline

                                                                                               ```
                                                                                               ┌──────────────┐    ┌──────────────────┐    ┌─────────────────┐
                                                                                               │  Edge Risk   │───▶│   Pattern Risk   │───▶│  Composite Risk │
                                                                                               │  (4 signals) │    │  (3 detectors)   │    │  (fusion: 5:3:2)│
                                                                                               └──────────────┘    └──────────────────┘    └─────────────────┘
                                                                                                      │                     │                       │
                                                                                                             ▼                     ▼                       ▼
                                                                                                               suspicious_flag      circular/structuring    0.5*ML + 0.3*Pat
                                                                                                                 endpoint_risk       /dormant scores         + 0.2*Anomaly
                                                                                                                   amount_anomaly                              → risk_score [0-100]
                                                                                                                     tx_frequency                                → risk_level [Low-Critical]
                                                                                                                     ```

                                                                                                                     ### Edge Suspiciousness (4-Signal Blend)

                                                                                                                     | Signal | Input | Weight |
                                                                                                                     |---|---|---|
                                                                                                                     | Flag Ratio | `is_suspicious` from edge data | 0.4 |
                                                                                                                     | Endpoint Risk | Max risk of source/target nodes | 0.3 |
                                                                                                                     | Amount Anomaly | Amount vs distribution | 0.2 |
                                                                                                                     | TX Frequency | Transaction count | 0.1 |

                                                                                                                     ### Pattern Detection

                                                                                                                     | Detector | Method | Features |
                                                                                                                     |---|---|---|
                                                                                                                     | **Circular** | NetworkX simple_cycles | 3–6 node cycles |
                                                                                                                     | **Structuring** | Threshold proximity analysis | Transactions near ₹10L |
                                                                                                                     | **Dormant** | Gap analysis | 180+ day inactivity |

                                                                                                                     ---

                                                                                                                     ## 7. MACHINE LEARNING MODELS

                                                                                                                     ### 7.1 LineMVGNN (Primary – Novel)

                                                                                                                     **Architecture:** Line Graph + Bidirectional Message Passing
                                                                                                                     - Converts edges (transactions) to nodes in a line graph L(G)
                                                                                                                     - Shared-weight bidirectional aggregation for symmetric understanding
                                                                                                                     - Multi-head attention (4 heads) on edge embeddings
                                                                                                                     - Output: P(is_laundering) per transaction + P(fraud) per account

                                                                                                                     ### 7.2 AMLGraphSAGE (Inductive)

                                                                                                                     **Architecture:** 3-layer SAGEConv
                                                                                                                     - Zero-shot inference on accounts never seen during training
                                                                                                                     - MEAN aggregation over local neighborhoods
                                                                                                                     - Used primarily for dormant account detection

                                                                                                                     ### 7.3 Fallback Classifier

                                                                                                                     **Model:** GradientBoostingClassifier (scikit-learn)
                                                                                                                     - Activated when PyTorch/PyG is unavailable
                                                                                                                     - 8 hand-engineered features
                                                                                                                     - 87% F1, 92% accuracy

                                                                                                                     ### Model Performance

                                                                                                                     | Metric | GNN (GraphSAGE/LineMVGNN) | Fallback (GBDT) |
                                                                                                                     |---|---|---|
                                                                                                                     | Accuracy | 94% | 92% |
                                                                                                                     | Precision | 91% | 89% |
                                                                                                                     | Recall | 88% | 85% |
                                                                                                                     | F1 Score | 89% | 87% |
                                                                                                                     | Inference | ~12 ms per account | — |

                                                                                                                     ---

                                                                                                                     ## 8. KEY FIXES & OPTIMIZATIONS (V1 → V2)

                                                                                                                     ### FundFlowGraph.tsx – Stability Fixes

                                                                                                                     | Issue | Root Cause | Fix |
                                                                                                                     |---|---|---|
                                                                                                                     | **Nodes jiggling/shaking** | `renderKey` mechanism forced full SVG rebuild 100ms after mount | Replaced with `ResizeObserver` + `ready` state — one-time initialization |
                                                                                                                     | **Simulation oscillation** | No damping on force simulation | Added `alphaDecay(0.05)`, `velocityDecay(0.5)`, `alphaMin(0.001)` |
                                                                                                                     | **Click restarts simulation** | `sim.restart()` in drag `start` fired on every mousedown | Moved to drag `drag` — only fires on actual mouse movement |
                                                                                                                     | **Click suppressed by D3** | `clickDistance(0)` default treated all movement as drag, suppressed click | Added `.clickDistance(4)` — micro-movements don't suppress click |
                                                                                                                     | **Node shuffles on click** | `fx/fy = null` in `end` handler released node back into forces | Removed `fx/fy` changes from `end` — node stays pinned after click/drag |
                                                                                                                     | **Graph resets on state change** | `subgraph` created new object on every render (no `useMemo`) | Wrapped in `useMemo([subgraphData, accountId])` |
                                                                                                                     | **Node reset on hover** | Tooltip re-renders changed `subgraph` reference, re-triggering useEffect | Added `initDepsRef` guard — semantic dep comparison via JSON.stringify |
                                                                                                                     | **Right panel not scrollable** | `overflowY: auto` on wrong container, no `flex: 1` on content | Moved overflow + `flex: 1` to content div, added `overscrollBehavior: contain` |
                                                                                                                     | **Panel auto-scrolls down** | Browser restores scroll position or focuses bottom element | Added `panelContentRef` + `scrollTop = 0` effect on selectedNode change |
                                                                                                                     | **CSS hover causes flicker** | CSS `filter: brightness()` overrode SVG `filter` attribute (glow) | Removed `.node-circle:hover` CSS rule |

                                                                                                                     ### Backend – Explainability Fix

                                                                                                                     | Issue | Root Cause | Fix |
                                                                                                                     |---|---|---|
                                                                                                                     | **Non-suspicious edges in "Suspicious Edges" panel** | `explain.py` took first 5 successors regardless of `is_suspicious` flag | Filtered `is_suspicious` before collecting top edges |

                                                                                                                     ---

                                                                                                                     ## 9. FRONTEND ROUTING & PAGES

                                                                                                                     | Route | Page Component | Purpose |
                                                                                                                     |---|---|---|
                                                                                                                     | `/` | `(landing)/page.tsx` | Marketing landing page (10 sections) |
                                                                                                                     | `/dashboard` | `dashboard/page.tsx` | System overview, KPIs, alert feed, CSV upload |
                                                                                                                     | `/fund-flow` | `fund-flow/page.tsx` | Fund flow graph with search |
                                                                                                                     | `/fund-flow/[accountId]` | `fund-flow/[accountId]/page.tsx` | Direct account fund flow analysis |
                                                                                                                     | `/alerts` | `alerts/page.tsx` | Alert triage table with filters, sorting, pagination |
                                                                                                                     | `/patterns` | `patterns/page.tsx` | Pattern detector with charts |
                                                                                                                     | `/sar-report` | `sar-report/page.tsx` | SAR report generator with FIU-IND XML download |
                                                                                                                     | `/monitor` | `monitor/page.tsx` | Real-time transaction monitor + manual scorer |

                                                                                                                     ---

                                                                                                                     ## 10. COMPLIANCE GATEWAY – FIU-IND REPORTING

                                                                                                                     ### Chain Definition

                                                                                                                     ```python
                                                                                                                     chain = ChatPromptTemplate.from_template(template) | ChatGoogleGenerativeAI(
                                                                                                                         model="gemini-2.0-flash", temperature=0.15
                                                                                                                         ) | StrOutputParser()
                                                                                                                         ```

                                                                                                                         ### Input Metadata (JSON to Gemini)

                                                                                                                         ```json
                                                                                                                         {
                                                                                                                           "report_id": "ARF-ACCT-XXXX-20260115",
                                                                                                                             "reporting_entity": { "bank_name": "X-Bank of India", "fiu_reg_no": "FIIIND20250001" },
                                                                                                                               "subject_account": { "account_id": "ACCT-XXXX", "risk_level": "CRITICAL" },
                                                                                                                                 "gnn_analysis": { "model": "LineMVGNN v2.0", "fraud_probability": 0.93 },
                                                                                                                                   "transaction_summary": { "flagged_edges": 4, "total_flagged_amount_usd": 37400 },
                                                                                                                                     "circular_patterns": [{ "accounts": ["A", "B", "C", "D"], "total_flow": 37400 }],
                                                                                                                                       "aml_typologies": ["Rapid Layering", "Circular Round-Trip", "Structuring"]
                                                                                                                                       }
                                                                                                                                       ```

                                                                                                                                       ### Output
                                                                                                                                       - **SAR Narrative** – Plain English report with typology identification
                                                                                                                                       - **FIU-IND ARF/TRF XML** – FINGate 2.0 compliant XML
                                                                                                                                       - **Downloadable XML** from the SAR Report page

                                                                                                                                       ---

                                                                                                                                       ## 11. EXECUTION GUIDE

                                                                                                                                       ### Prerequisites

                                                                                                                                       ```
                                                                                                                                       ✅ Python 3.11+
                                                                                                                                       ✅ Node.js 18+
                                                                                                                                       ✅ NVIDIA GPU with CUDA 11.8+ (optional, for GNN training)
                                                                                                                                       ✅ Google Gemini API Key (for SAR generation)
                                                                                                                                       ```

                                                                                                                                       ### Backend Setup

                                                                                                                                       ```bash
                                                                                                                                       # 1. Environment
                                                                                                                                       pip install -r requirements.txt

                                                                                                                                       # 2. Start API server
                                                                                                                                       uvicorn api.main:app --host 0.0.0.0 --port 8089 --reload
                                                                                                                                       ```

                                                                                                                                       ### Frontend Setup

                                                                                                                                       ```bash
                                                                                                                                       # 1. Install dependencies
                                                                                                                                       cd nextgen-frontend
                                                                                                                                       npm install

                                                                                                                                       # 2. Start dev server
                                                                                                                                       npm run dev

                                                                                                                                       # 3. Build for production
                                                                                                                                       npm run build
                                                                                                                                       ```

                                                                                                                                       ### Service URLs

                                                                                                                                       | Service | URL | Purpose |
                                                                                                                                       |---|---|---|
                                                                                                                                       | Next.js Frontend | http://localhost:3000 | Main analyst interface |
                                                                                                                                       | FastAPI Backend | http://localhost:8089 | REST API |
                                                                                                                                       | Swagger API Docs | http://localhost:8089/docs | Interactive API explorer |
                                                                                                                                       | Prometheus Metrics | http://localhost:8089/metrics | Monitoring |

                                                                                                                                       ---

                                                                                                                                       ## 12. DATA FLOW

                                                                                                                                       ```
                                                                                                                                       CSV Upload (/upload/csv)
                                                                                                                                           ↓
                                                                                                                                           NetworkX DiGraph construction
                                                                                                                                               ↓
                                                                                                                                               Feature Engineering:
                                                                                                                                                 amount_norm  = log1p(amount) / log1p(max_amount)
                                                                                                                                                   ts_sin       = sin(hour × 2π/24)
                                                                                                                                                     ts_cos       = cos(hour × 2π/24)
                                                                                                                                                       velocity_24h = clip(txn_count_from_sender / 100, 0, 1)
                                                                                                                                                           ↓
                                                                                                                                                           ML Inference (per account):
                                                                                                                                                             GraphSAGE/LineMVGNN → fraud_probability
                                                                                                                                                               Fallback GBDT       → fraud_probability
                                                                                                                                                                   ↓
                                                                                                                                                                   Risk Scoring:
                                                                                                                                                                     composite = 0.5 × ML_score + 0.3 × pattern_score + 0.2 × anomaly_score
                                                                                                                                                                         ↓
                                                                                                                                                                         API Response → React Query Cache → UI Components
                                                                                                                                                                         ```

                                                                                                                                                                         ---

                                                                                                                                                                         ## 13. PROJECT FILE INVENTORY

                                                                                                                                                                         ```
                                                                                                                                                                         C:\folder\NextGenAML\
                                                                                                                                                                         ├── api/                           FastAPI backend
                                                                                                                                                                         │   ├── main.py                    Application entry point (singletons, CORS, routes)
                                                                                                                                                                         │   ├── config.py                  Settings from environment variables
                                                                                                                                                                         │   ├── schemas.py                 Pydantic request/response models
                                                                                                                                                                         │   └── routers/                   Endpoint modules (12 routers)
                                                                                                                                                                         │       ├── accounts.py            Account listing & details
                                                                                                                                                                         │       ├── alerts.py              Alert retrieval
                                                                                                                                                                         │       ├── analytics.py           Dashboard & analytics
                                                                                                                                                                         │       ├── explain.py             Explainability (risk factors, suspicious edges)
                                                                                                                                                                         │       ├── graph.py               Subgraph & full graph endpoints
                                                                                                                                                                         │       ├── health.py              Health check endpoints
                                                                                                                                                                         │       ├── model_info.py          Model metadata & metrics
                                                                                                                                                                         │       ├── patterns.py            Pattern detection (circular, structuring, dormant)
                                                                                                                                                                         │       ├── predictions.py         Single & batch prediction, monitoring
                                                                                                                                                                         │       ├── reports.py             SAR report generation & listing
                                                                                                                                                                         │       ├── timeline.py            Transaction timeline
                                                                                                                                                                         │       └── upload.py              CSV upload & retraining
                                                                                                                                                                         ├── graph_db/
                                                                                                                                                                         │   └── manager.py                 NetworkX graph manager + Memgraph connector
                                                                                                                                                                         ├── ml/
                                                                                                                                                                         │   ├── inference.py               Inference engine (model wrapper)
                                                                                                                                                                         │   ├── model.py                   GNN model definitions (GraphSAGE, LineMVGNN, fallback)
                                                                                                                                                                         │   └── risk_engine.py             Composite risk scoring engine
                                                                                                                                                                         ├── nextgen-frontend/              Next.js 14 frontend
                                                                                                                                                                         │   ├── package.json               Dependencies (D3, Framer Motion, Recharts, etc.)
                                                                                                                                                                         │   ├── next.config.mjs            Static export configuration
                                                                                                                                                                         │   ├── tailwind.config.ts         Custom dark theme
                                                                                                                                                                         │   └── src/
                                                                                                                                                                         │       ├── app/                   App Router pages (8 routes)
                                                                                                                                                                         │       │   └── globals.css        895-line design system CSS
                                                                                                                                                                         │       ├── components/
                                                                                                                                                                         │       │   ├── FundFlowGraph.tsx  D3.js force graph (1050 lines)
                                                                                                                                                                         │       │   ├── MiniGraph.tsx      Compact graph component
                                                                                                                                                                         │       │   ├── Sidebar.tsx        Collapsible navigation
                                                                                                                                                                         │       │   ├── Topbar.tsx         Top bar with health & alerts
                                                                                                                                                                         │       │   ├── ui.tsx             Reusable UI components
                                                                                                                                                                         │       │   └── landing/           Landing page sections
                                                                                                                                                                         │       └── lib/
                                                                                                                                                                         │           ├── api.ts             Full API client
                                                                                                                                                                         │           └── utils.ts           Helper utilities
                                                                                                                                                                         ├── data/                          Uploaded CSVs
                                                                                                                                                                         ├── saved_models/                  Trained model checkpoints
                                                                                                                                                                         ├── logs/                          Runtime logs
                                                                                                                                                                         ├── PROJECT_INFO.md                Original project document (V1)
                                                                                                                                                                         ├── PROJECT_INFO_V2.md             ← This document
                                                                                                                                                                         ├── SCORING_SYSTEM.md              Detailed risk scoring documentation
                                                                                                                                                                         ├── README.md                      Quick start guide
                                                                                                                                                                         └── requirements.txt               Python dependencies
                                                                                                                                                                         ```

                                                                                                                                                                         ---

                                                                                                                                                                         ## 14. VERSION HISTORY

                                                                                                                                                                         | Version | Date | Key Changes |
                                                                                                                                                                         |---|---|---|
                                                                                                                                                                         | **V1** | Hackathon submission | Streamlit frontend, Pyvis graphs, initial GNN models |
                                                                                                                                                                         | **V2** | Post-hackathon | Next.js 14 rewrite, D3.js force graph, Framer Motion UI, React Query data layer, all simulation stability fixes, responsive panels, dark theme design system |

                                                                                                                                                                         ### Current Component Versions

                                                                                                                                                                         | Component | Version |
                                                                                                                                                                         |---|---|
                                                                                                                                                                         | API | 1.0.0 |
                                                                                                                                                                         | Model (GNN) | 2.0.0 (LineMVGNN), 1.0.0 (fallback GBDT) |
                                                                                                                                                                         | Frontend | 0.1.0 |
                                                                                                                                                                         | Next.js | 14.2.35 |
                                                                                                                                                                         | React | 18 |
                                                                                                                                                                         | FastAPI | 0.135.1 |
                                                                                                                                                                         | PyTorch | 2.1.0 |
                                                                                                                                                                         | D3.js | 7.9.0 |

````
