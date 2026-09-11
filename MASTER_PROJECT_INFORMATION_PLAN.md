# NextGenAML Master Project Information Plan

Last updated: 2026-09-09

## 1. Executive Summary

NextGenAML is a full-stack Anti-Money Laundering (AML) fund-flow tracking
platform built for the X-Bank of India Problem Statement 3 hackathon. The
project combines transaction ingestion, graph analytics, machine-learning risk
scoring, pattern detection, real-time UPI simulation, alerting, explainability,
and SAR-style report generation.

The main idea is simple: financial transactions are more useful when modeled as
a graph. Accounts become nodes, transfers become directed edges, and laundering
behavior can be detected by looking at graph structure, time, amount, velocity,
and known AML typologies.

Current implementation status:

| Area | Current state |
| --- | --- |
| Backend | FastAPI app with REST APIs, WebSocket live simulator, startup pipeline, CORS, static frontend fallback |
| Frontend | Next.js 14 app with dashboard, alerts, fund-flow graph, monitor, patterns, SAR report, simulator, and landing page |
| Graph store | NetworkX DiGraph as the active in-process graph, with optional Memgraph sync over Bolt |
| ML | PyTorch/PyG model support when available, scikit-learn fallback classifier in normal lightweight runtime |
| Risk scoring | Composite scoring from ML probability, graph pattern membership, and anomaly heuristics |
| Simulator | Seeded UPI wallet accounts, payment execution, TPS stream engine, fraud presets, JSONL ledger, alerts, WebSocket broadcast |
| Data | CSV transaction datasets plus append-only simulator ledger and simulator alerts |
| Deployment | Docker API container, docker-compose Memgraph/API stack, Render backend/frontend config |
| Tests | Pytest suite for graph mutation, simulator service, wallet behavior, and simulator API |

## 2. Product Goal

The project aims to help analysts identify suspicious fund flows faster than
manual review or rules-only systems. It is designed to show:

- Which accounts are high risk.
- Why an account was flagged.
- How money moved through connected accounts.
- Which AML typology is likely involved.
- What activity happened over time.
- Whether real-time transactions create immediate risk.
- How a suspicious account can be turned into a SAR-style report.

Primary users:

- AML analysts investigating suspicious accounts.
- Compliance officers reviewing alerts and reports.
- Bank risk teams monitoring live transaction streams.
- Hackathon judges evaluating end-to-end technical depth.

## 3. AML Typologies Covered

| Typology | Meaning | Current detection approach |
| --- | --- | --- |
| Rapid layering | Money moves quickly through several accounts | Velocity signals, high out-degree, simulator presets, risk heuristics |
| Circular flow | Funds return to the originator through a cycle | NetworkX simple cycle detection with configurable min/max cycle length |
| Structuring / smurfing | Repeated near-threshold transfers | Sender-side transactions just below common thresholds inside a time window |
| Dormant activation | Inactive account suddenly becomes active | Large transaction gap detection using transaction timestamp history |
| KYC / behavior mismatch | Activity differs from expected account profile | Represented through risk features, labels, volume, anomaly, and graph behavior |

## 4. Repository Map

```text
NextGenAML/
  api/                         FastAPI app, config, schemas, routers
  api/routers/                 REST and WebSocket route modules
  graph_db/                    NetworkX graph manager and optional Memgraph sync
  ingestion/                   Standalone CSV ingestion command
  ml/                          Model definitions, inference, risk engine, fusion gate
  simulator/                   UPI wallet simulator, stream engine, presets, ledger, alerts
  training/                    Standalone model training command
  tests/                       Pytest coverage for graph and simulator behavior
  data/                        Active uploaded CSV and simulator JSONL data
  logs/                        Runtime logs
  saved_models/                Serialized model artifacts
  nextgen-frontend/            Next.js frontend application
  paper/                       Reference research PDF
  Dockerfile.api               Backend container definition
  docker-compose.yml           Memgraph plus API local stack
  render.yaml                  Render deployment configuration
  requirements.txt             Python dependencies
  start.bat                    Windows convenience launcher
```

Important existing documentation:

| File | Purpose |
| --- | --- |
| `README.md` | Original project overview and quick start |
| `PROJECT_INFO.md` | Existing project information document |
| `PROJECT_INFO_V2.md` | Expanded project information document |
| `PROJECT_SUMMARY.md` | Summary plus future integration roadmap |
| `TECH_STACK.md` | Detailed technology stack |
| `SCORING_SYSTEM.md` | Scoring-related explanation |
| `EXAMPLE_WALKTHROUGH.md` | Demo walkthrough |
| `PPT_CONTENT.md` | Presentation content |

This file is intended to be the master handoff document that consolidates the
project's operational and planning information.

## 5. High-Level Architecture

```text
CSV datasets / simulator payments
        |
        v
GraphManager
  - loads CSV
  - builds NetworkX DiGraph
  - aggregates transfers
  - computes account features
  - optionally syncs to Memgraph
        |
        v
InferenceEngine
  - builds account feature matrix
  - trains or loads model
  - predicts account fraud probability
        |
        v
RiskEngine
  - computes AML patterns
  - computes anomaly score
  - fuses ML, pattern, anomaly signals
  - creates final account risk score
        |
        v
FastAPI Routers
  - dashboard
  - graph
  - predictions
  - alerts
  - explainability
  - reports
  - simulator
        |
        v
Next.js Frontend
  - analyst dashboard
  - fund-flow visualization
  - alerts
  - real-time monitor
  - pattern pages
  - SAR report UI
  - UPI simulator
```

## 6. Backend Application

Backend entry point:

```text
api/main.py
```

The backend creates global service singletons:

| Object | Source | Responsibility |
| --- | --- | --- |
| `graph_manager` | `graph_db.manager.GraphManager` | Central graph and transaction data access |
| `inference_engine` | `ml.inference.InferenceEngine` | ML feature construction, model load/train, prediction |
| `risk_engine` | `ml.risk_engine.RiskEngine` | Composite risk scoring and AML pattern membership |
| `simulator_service` | `simulator.service.SimulatorService` | UPI payments, stream, ledger, alerts, live envelopes |

Startup lifecycle:

1. Load `data/uploaded_transactions.csv` if it exists.
2. Build the directed account graph.
3. Try to connect to Memgraph at configured host and port.
4. Sync graph to Memgraph when available.
5. Load `saved_models/aml_model.pt` if present.
6. If no model loads, initialize and train a lightweight model from current data.
7. Compute graph patterns.
8. Refresh risk scores.
9. Optionally replay simulator ledger if `SIMULATOR_REPLAY_LEDGER=true`.

Shutdown lifecycle:

1. Log backend shutdown.
2. Stop simulator service and streaming resources.

## 7. Configuration

Configuration source:

```text
api/config.py
```

Environment file:

```text
.env
.env.example
```

Core environment variables:

| Variable | Default / example | Purpose |
| --- | --- | --- |
| `MEMGRAPH_HOST` | `127.0.0.1` | Host for optional Memgraph Bolt connection |
| `MEMGRAPH_PORT` | `7687` | Memgraph Bolt port |
| `API_HOST` | `0.0.0.0` | API bind host |
| `API_PORT` | `8089` in app config, `8000` in old env example | API port |
| `API_SECRET_TOKEN` | `changeme_in_production` | Placeholder secret for future protected APIs |
| `GNN_MODEL_TYPE` | `graphsage` | Model type passed to inference engine |
| `GNN_FRAUD_THRESHOLD` | `0.75` | Fraud threshold used in model metadata and decisions |
| `USE_ADAPTIVE_FUSION` | `true` | Enables learned fusion gate if checkpoint exists |
| `BATCH_SIZE` | `64` | Training batch size |
| `NUM_EPOCHS` | `50` | Training epochs |
| `LEARNING_RATE` | `0.001` | Training learning rate |
| `GOOGLE_API_KEY` | empty | Reserved for Gemini/report generation integration |
| `SIMULATOR_REPLAY_LEDGER` | `false` | Replays JSONL simulator ledger into graph at startup |
| `SIMULATOR_MAX_TPS` | `100` | Maximum simulator transactions per second |
| `FRONTEND_ORIGINS` | local and Render URLs | CORS allow-list |

Important path settings:

| Setting | Path |
| --- | --- |
| `DATA_DIR` | `data/` |
| `TRANSACTION_CSV` | `data/uploaded_transactions.csv` |
| `SAVED_MODELS_DIR` | `saved_models/` |
| `LOGS_DIR` | `logs/` |
| `CHECKPOINTS_DIR` | `ml/checkpoints/` |
| `SIMULATOR_LEDGER_PATH` | `data/simulator_ledger.jsonl` |
| `SIMULATOR_ALERTS_PATH` | `data/simulator_alerts.jsonl` |

## 8. Data Model

### 8.1 Transaction CSV Contract

Required columns:

| Column | Type | Description |
| --- | --- | --- |
| `sender_account` | string | Source account ID |
| `receiver_account` | string | Destination account ID |
| `amount` | float | Transaction amount |
| `timestamp` | datetime-compatible string | Transaction time |

Optional columns:

| Column | Type | Description |
| --- | --- | --- |
| `label` | int | Fraud/suspicious label, normally `0` or `1` |
| `currency` | string | Currency code, defaults to `INR` |
| `transaction_type` | string | Transaction type, defaults to `transfer` |

Known local datasets:

| File | Rows | Columns |
| --- | ---: | --- |
| `data/uploaded_transactions.csv` | 1125 | sender, receiver, amount, timestamp, currency, transaction_type, label |
| `aml_transactions_large.csv` | 5750 | sender, receiver, amount, timestamp, currency, transaction_type, label |
| `aml_test_dataset_hard.csv` | 710 | sender, receiver, amount, timestamp, currency, transaction_type, label |
| `test.csv` | 22 | sender, receiver, amount, timestamp, currency, transaction_type, label |
| `test2.csv` | 1125 | sender, receiver, amount, timestamp, currency, transaction_type, label |
| `transaction.csv` | 22 | sender, receiver, amount, timestamp, currency, transaction_type, label |

### 8.2 Graph Data Model

Graph implementation:

```text
networkx.DiGraph
```

Node model:

| Field | Meaning |
| --- | --- |
| `id` | Account ID |
| `label` | Display label, usually same as ID |
| `type` | Entity type, currently `entity` |
| `risk` | Risk display value |

Edge model:

| Field | Meaning |
| --- | --- |
| `source` | Sender account |
| `target` | Receiver account |
| `total_amount` | Sum of all transfers between source and target |
| `tx_count` | Number of transfers between source and target |
| `transactions` | Raw transaction row dictionaries |
| `is_suspicious` | True if any edge transaction has suspicious label |

### 8.3 Account Feature Model

`GraphManager` computes these features per account:

| Feature | Description |
| --- | --- |
| `total_sent` | Total outgoing amount |
| `total_received` | Total incoming amount |
| `tx_count` | Count of incoming plus outgoing transactions |
| `avg_amount` | Average amount across account transactions |
| `log_amount` | Log-scaled total volume |
| `avg_velocity_sec` | Average seconds between transactions |
| `min_velocity_sec` | Minimum seconds between consecutive transactions |
| `sin_time` | Cyclic time-of-day sine encoding |
| `cos_time` | Cyclic time-of-day cosine encoding |
| `label_ratio` | Mean suspicious label across account transactions |
| `in_degree` | Number of unique incoming counterparties |
| `out_degree` | Number of unique outgoing counterparties |

## 9. Graph Manager

Main file:

```text
graph_db/manager.py
```

Key responsibilities:

- Load transaction CSV files with pandas.
- Normalize timestamp, amount, and label fields.
- Build the directed account graph.
- Aggregate multiple transfers between the same sender and receiver.
- Compute account-level ML features.
- Add new live transactions incrementally.
- Recompute only affected account features for live transaction updates.
- Detect circular flows, structuring, and dormant activations.
- Return subgraphs, full graph views, graph stats, and transaction flow windows.
- Optionally connect to Memgraph using the Neo4j driver.
- Optionally sync the in-memory graph to Memgraph.

Important graph query methods:

| Method | Purpose |
| --- | --- |
| `load_from_csv(csv_path)` | Full CSV load and graph rebuild |
| `add_transaction(tx)` | Incremental transaction insert for live simulator |
| `get_subgraph(account_id, hops)` | Ego graph around one account |
| `get_full_graph(limit)` | Full or top-risk limited graph |
| `get_transaction_flow(account_id, limit, offset)` | Chronological transaction stream |
| `detect_circular_patterns()` | Directed cycle detection |
| `detect_structuring()` | Near-threshold repeated transfer detection |
| `detect_dormant_activations()` | Dormancy gap detection |
| `get_stats()` | Graph summary statistics |
| `connect_memgraph(host, port)` | Optional Bolt connection |
| `sync_to_memgraph()` | Full graph sync to Memgraph |

Important implementation note:

`detect_dormant_activations()` currently caches and returns inside the account
loop. That means it may return after processing the first eligible account
iteration instead of scanning all accounts. This should be reviewed before any
production claim about dormant activation coverage.

## 10. Machine Learning

Main files:

```text
ml/model.py
ml/inference.py
ml/fusion_gate.py
ml/train_fusion_gate.py
training/train.py
```

### 10.1 Feature Keys Used For ML

`InferenceEngine.FEATURE_KEYS`:

| Feature |
| --- |
| `log_amount` |
| `total_sent` |
| `total_received` |
| `avg_velocity_sec` |
| `sin_time` |
| `cos_time` |
| `in_degree` |
| `out_degree` |

The feature matrix is normalized column-by-column before model use.

### 10.2 Model Options

| Model | File | Runtime condition |
| --- | --- | --- |
| GraphSAGE | `ml/model.py` | Used when torch and PyTorch Geometric are available |
| LineMVGNN | `ml/model.py` | Used when torch and PyTorch Geometric are available and selected |
| FallbackClassifier | `ml/model.py` | Used when PyTorch/PyG are unavailable |

The fallback classifier uses scikit-learn and allows the project to run in a
lightweight environment without GPU dependencies.

### 10.3 Inference Flow

1. Build account features from `GraphManager`.
2. Build labels from account `label_ratio`.
3. If torch and PyG are available, train the selected GNN briefly.
4. Otherwise, train the fallback classifier when positive labels exist.
5. For prediction, combine raw model probability with label-ratio heuristic:

```text
fraud_probability = 0.6 * model_probability + 0.4 * label_ratio
```

6. Convert probability into a risk level:

| Probability | Risk level |
| ---: | --- |
| `< 0.30` | low |
| `0.30 - 0.49` | medium |
| `0.50 - 0.74` | high |
| `>= 0.75` | critical |

## 11. Risk Scoring

Main file:

```text
ml/risk_engine.py
```

The final account score is a weighted fusion of:

| Signal | Meaning |
| --- | --- |
| ML score | Model fraud probability from `InferenceEngine` |
| Pattern score | `1.0` if account is in a detected AML pattern, else `0.0` |
| Anomaly score | Heuristic anomaly from velocity, amount, degree, and time-of-day behavior |

Default static formula:

```text
final_score = 0.5 * ml_score + 0.3 * pattern_score + 0.2 * anomaly_score
risk_score = final_score * 100
```

When `USE_ADAPTIVE_FUSION=true` and a fusion checkpoint exists in
`ml/checkpoints/`, the risk engine attempts to load a learned gate and produce
per-account weights for ML, pattern, and anomaly signals.

Risk status mapping:

| Final score | Status |
| ---: | --- |
| `> 0.75` | Critical |
| `> 0.50` | Flagged |
| `> 0.30` | Under Review |
| `<= 0.30` | Verified |

Anomaly scoring inputs:

- Transaction velocity below 5 minutes.
- Average velocity below 10 minutes.
- Total volume above INR 1,000,000 or INR 5,000,000.
- Out-degree greater than 5.
- Off-hours time signal.

## 12. API Surface

Backend local base URL:

```text
http://localhost:8089
```

Swagger UI:

```text
http://localhost:8089/docs
```

### 12.1 Health

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/ping` | Lightweight ping |
| GET | `/health` | Backend, graph, model, account, transaction health |

### 12.2 Predictions And Monitoring

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/predict?account_id=...` | Predict fraud probability for one account |
| POST | `/predict/batch` | Predict fraud probability for a list of accounts |
| POST | `/monitor/transaction` | Score a single transaction payload |
| GET | `/monitor/statistics` | Monitoring metrics summary |

### 12.3 Graph

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/graph/subgraph/{account_id}?hops=2` | Account ego graph |
| GET | `/graph/flow` | Chronological transaction flow |
| GET | `/graph/full?limit=500` | Full or limited graph |
| GET | `/graph/stats` | Graph totals and risk distribution |

### 12.4 Accounts And Alerts

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/accounts/` | List risk-scored accounts |
| GET | `/accounts/count` | Account count summary |
| GET | `/accounts/{account_id}` | Account risk detail |
| POST | `/alert` | Return accounts above a minimum risk threshold |

### 12.5 Patterns

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/patterns/circular` | Circular flow patterns |
| GET | `/patterns/structuring` | Structuring patterns |
| GET | `/patterns/dormant` | Dormant activation patterns |
| GET | `/patterns/all` | Combined pattern response |

### 12.6 Analytics, Explainability, Model Info

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/analytics` | Aggregate analytics overview |
| GET | `/dashboard` | Dashboard KPI payload |
| GET | `/explain/{account_id}` | Risk explanation and suspicious edges |
| GET | `/model/info` | Model metadata |
| GET | `/metrics` | Metrics summary payload |

### 12.7 Upload

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/upload/csv` | Upload a transaction CSV, rebuild graph, retrain model, refresh risk |
| GET | `/upload/status` | Show current loaded dataset status |

### 12.8 Reports

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/reports/` | List generated/mock report metadata |
| GET | `/reports/stats` | Report statistics |
| POST | `/reports/generate` | Generate SAR-style report text for an account |

### 12.9 Simulator

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/simulator/accounts` | Seed UPI accounts and balances |
| POST | `/simulator/pay` | Execute one dummy UPI payment |
| POST | `/simulator/simulate` | Generate one random or preset transaction |
| POST | `/simulator/preset/{name}` | Control a named preset stream |
| POST | `/simulator/stream/{action}` | Start, pause, resume, or stop stream |
| GET | `/simulator/history` | Filtered paginated transaction history |
| GET | `/simulator/alerts` | Live simulator alerts |
| GET | `/simulator/stats` | Simulator stats and stream state |
| GET | `/simulator/presets` | Available presets and TPS options |
| WS | `/ws/live` | WebSocket for live transaction envelopes |

## 13. Real-Time UPI Simulator

Main files:

```text
simulator/service.py
simulator/stream_engine.py
simulator/presets.py
simulator/seed_accounts.py
simulator/ledger.py
simulator/alert_registry.py
simulator/loggers.py
```

Capabilities:

- Seeded demo accounts with mobile numbers, UPI IDs, balances, city, risk, and
  display colors.
- Account resolution by account ID, mobile number, or UPI ID.
- Balance debit and credit.
- Overdraft rejection.
- Device/IP/location metadata.
- Live transaction risk scoring.
- Alert creation for high-risk transactions.
- Append-only JSONL transaction ledger.
- Append-only JSONL alert ledger.
- WebSocket broadcast to connected frontend clients.
- Stream engine with `idle`, `running`, `paused`, and `stopped` states.
- Configurable TPS from 1 to 100.

Fraud and behavior presets:

| Preset | Scenario |
| --- | --- |
| `money_laundering` | Large layering chain |
| `structuring` | Repeated near-threshold transactions |
| `layering` | Multi-hop movement through accounts |
| `circular_flow` | Round-trip account flow |
| `rapid_transfers` | High-frequency transfer burst |
| `normal_user` | Benign daily activity |
| `business_payments` | B2B invoice-style payments |
| `salary_payments` | Salary-like credits |
| `cash_withdrawal` | Repeated cash-out style movement |

Live envelope includes:

- Transaction record.
- Sender and receiver risk details.
- Transaction-level risk score, level, flags, and reason.
- Optional alert.
- Graph delta for newly inserted nodes/edges and changed node IDs.
- Updated simulator stats.

## 14. Frontend Application

Frontend root:

```text
nextgen-frontend/
```

Main stack:

| Technology | Purpose |
| --- | --- |
| Next.js 14 | React framework and App Router |
| React 18 | UI runtime |
| TypeScript | Static typing |
| Tailwind CSS | Styling |
| TanStack React Query | API state and caching |
| D3 | Fund-flow graph visualization |
| Recharts | Charts and metrics |
| Framer Motion | UI transitions |
| Lucide React | Icons |
| qrcode.react | UPI simulator QR display |

Important frontend files:

| File | Purpose |
| --- | --- |
| `nextgen-frontend/src/lib/api.ts` | Typed API client |
| `nextgen-frontend/src/lib/useLiveTransactions.ts` | WebSocket hook for live simulator |
| `nextgen-frontend/src/components/FundFlowGraph.tsx` | Main D3 force graph |
| `nextgen-frontend/src/components/MiniGraph.tsx` | Compact dashboard graph |
| `nextgen-frontend/src/components/Sidebar.tsx` | App navigation |
| `nextgen-frontend/src/components/Topbar.tsx` | Top bar |
| `nextgen-frontend/src/components/ui.tsx` | Shared UI primitives |

Frontend routes:

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/app/(landing)/page.tsx` | Landing page |
| `/dashboard` | `src/app/dashboard/page.tsx` | KPIs, upload, alerts, mini graph |
| `/fund-flow` | `src/app/fund-flow/page.tsx` | Account search and graph analysis |
| `/fund-flow/[accountId]` | `src/app/fund-flow/[accountId]/page.tsx` | Direct account analysis route |
| `/alerts` | `src/app/alerts/page.tsx` | Alert triage |
| `/monitor` | `src/app/monitor/page.tsx` | Transaction monitor and scorer |
| `/patterns` | `src/app/patterns/page.tsx` | Pattern visualizations |
| `/sar-report` | `src/app/sar-report/page.tsx` | SAR-style report generation |
| `/simulator` | `src/app/simulator/page.tsx` | Real-time UPI simulator |

Frontend default API base:

```text
NEXT_PUBLIC_API_URL ?? https://nextaml-iim-api.onrender.com
```

For local development, set:

```text
NEXT_PUBLIC_API_URL=http://localhost:8089
```

## 15. Runbook

### 15.1 Backend Local Development

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
python -m uvicorn api.main:app --host 0.0.0.0 --port 8089 --reload
```

Open:

```text
http://localhost:8089/docs
```

### 15.2 Frontend Local Development

Install frontend dependencies:

```bash
cd nextgen-frontend
npm ci
```

Run the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 15.3 Memgraph Local Development

Start Memgraph:

```bash
docker-compose up -d memgraph
```

Ports:

| Port | Purpose |
| ---: | --- |
| 7687 | Bolt protocol |
| 7444 | HTTP status |
| 3000 | Memgraph Lab UI |

### 15.4 API Container Stack

Start Memgraph plus API:

```bash
docker-compose up -d
```

### 15.5 Windows Convenience Script

```bash
start.bat
```

Note: `start.bat` still references an older Streamlit dashboard path
(`dashboard/app.py`) that is not present in the current file tree. The active
frontend is the Next.js app under `nextgen-frontend/`. The script should be
updated if it is meant to launch the current frontend.

### 15.6 Upload A New Dataset

Use the dashboard upload UI or call:

```bash
curl -X POST http://localhost:8089/upload/csv \
  -F "file=@data/uploaded_transactions.csv"
```

The backend will:

1. Validate required columns.
2. Save the file to `data/uploaded_transactions.csv`.
3. Rebuild the graph.
4. Reinitialize the inference engine.
5. Save the model.
6. Recompute patterns and risk scores.

### 15.7 Train Model Manually

```bash
python -m training.train --model graphsage --epochs 50 --csv_path data/uploaded_transactions.csv
```

Output default:

```text
saved_models/aml_model.pt
```

### 15.8 Run Tests

```bash
python -m pytest tests -q
```

The test suite currently covers:

- Wallet account resolution and balances.
- Simulator service payment processing and alerts.
- Simulator API routes and WebSocket ping/push behavior.
- Graph incremental transaction insertion.
- Graph pattern helper behavior.

## 16. Deployment

### 16.1 Docker

Backend container:

```text
Dockerfile.api
```

The Dockerfile uses `python:3.11-slim`, installs core runtime dependencies, and
runs:

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8089 --log-level info
```

docker-compose services:

| Service | Purpose |
| --- | --- |
| `memgraph` | Optional graph database with Bolt and Lab UI |
| `api` | FastAPI backend |

### 16.2 Render

Render config:

```text
render.yaml
```

Configured services:

| Service | Type | Root | Build | Start/publish |
| --- | --- | --- | --- | --- |
| `nextgenaml-api` | Python web | repo root | `pip install -r requirements.txt` | `uvicorn api.main:app --host 0.0.0.0 --port $PORT` |
| `nextgenaml-frontend` | Static web | `nextgen-frontend` | `npm ci && npm run build` | publish `out` |

Deployment note:

The frontend static deployment expects Next.js static export output in
`nextgen-frontend/out`. Confirm that `next.config.mjs` is configured for static
export before deploying.

## 17. Security And Compliance Considerations

Current project state is suitable for demo/hackathon use, not production
banking deployment without additional controls.

Required before production:

- Authentication and authorization.
- Role-based access control for analysts, reviewers, and admins.
- Audit logging for every investigation action.
- Protected upload and report-generation endpoints.
- Request signing or token authentication for ingestion APIs.
- Secrets management outside `.env`.
- Data encryption at rest and in transit.
- PII masking in logs and UI where appropriate.
- Retention policies for transaction data, alerts, and reports.
- Strong validation around uploaded files.
- Operational monitoring and alerting.
- Model governance: versioning, approval, drift monitoring, and explainability.
- Regulatory review of SAR/XML output format before FIU submission.

## 18. Known Gaps And Technical Debt

| Area | Gap | Recommended action |
| --- | --- | --- |
| Startup script | `start.bat` references old Streamlit dashboard | Replace with Next.js frontend startup |
| README architecture | Mentions old folders like `dashboard/` and older ingestion filenames | Update README to match current repo |
| Dormant detection | `detect_dormant_activations()` appears to return inside the loop | Move cache assignment and return after all accounts are scanned |
| API prediction client | `api.predict()` sends no account query; `predictQuery()` is correct | Remove or fix unused broken client helper |
| Gemini integration | Config exists, but current reports endpoint generates local text only | Either wire Gemini fully or document report endpoint as local SAR-style generator |
| Auth | No enforced authentication on current API routes | Add JWT/OAuth2 or bank SSO integration |
| Memgraph | Optional sync only; NetworkX remains primary | Decide whether production graph store should be Memgraph/Neo4j |
| Model artifacts | `aml_model.pt` may store pickle fallback depending on runtime | Use extension and metadata that match model format |
| Frontend API default | Defaults to deployed Render API | Use local `.env.local` for development |
| Dockerfile | Installs hard-coded packages instead of using full `requirements.txt` | Align Dockerfile dependency install with `requirements.txt` |
| Tests | No frontend tests or end-to-end tests | Add Playwright or equivalent for key user flows |
| CI/CD | No visible GitHub Actions workflow | Add lint/test/build workflow |

## 19. Roadmap

### Phase 1: Stabilize Documentation And Developer Experience

- Update `README.md` to match current Next.js frontend.
- Replace old Streamlit references.
- Add `.env.local.example` for frontend.
- Add one command for local backend and frontend startup.
- Add API route summary to README or link to this master plan.
- Add troubleshooting notes for Memgraph and model fallback.

### Phase 2: Fix Correctness Gaps

- Fix dormant activation full-scan behavior.
- Fix or remove the incorrect frontend `api.predict()` helper.
- Add tests for `/patterns/dormant` with multiple accounts.
- Add tests for report generation response.
- Add tests for upload CSV validation and pipeline refresh.

### Phase 3: Improve ML And Risk Governance

- Store model metadata beside model artifacts.
- Separate GNN `.pt` files from sklearn `.pkl` files.
- Add model version to `/model/info`.
- Add reproducible training metrics.
- Add drift checks on newly uploaded datasets.
- Add SHAP or simpler feature attribution for fallback model explanations.

### Phase 4: Production Graph And Ingestion

- Promote Memgraph or Neo4j to primary persistent graph store.
- Keep NetworkX as a cache/read model if needed.
- Add ingestion idempotency keys.
- Add webhook ingestion endpoint.
- Add queue-based ingestion path with Kafka, RabbitMQ, or cloud queue.
- Add batch file ingestion from object storage.

### Phase 5: Analyst Workflow

- Add login and roles.
- Add case management: open, assign, comment, escalate, close.
- Add alert disposition and audit trail.
- Add SAR review workflow before final generation/export.
- Add analyst notes and attachments.
- Add exportable case packet.

### Phase 6: Observability And Operations

- Add structured JSON logs.
- Add Prometheus metrics endpoint if needed.
- Add Grafana dashboard for API latency, stream TPS, alert rate, model errors.
- Add CI for backend tests and frontend build.
- Add deployment health checks.
- Add backup and retention procedures.

## 20. Demo Flow

Recommended hackathon demo sequence:

1. Open the landing page and explain graph-native AML monitoring.
2. Go to dashboard and show system KPIs.
3. Upload or reference the active transaction CSV.
4. Open fund-flow graph and search for a suspicious account.
5. Show connected accounts, edge amounts, and suspicious graph structure.
6. Open patterns page and show circular/structuring/dormant detections.
7. Open explain page or account detail to show risk factors.
8. Open simulator.
9. Start a suspicious preset such as `money_laundering` or `circular_flow`.
10. Show WebSocket-driven live transactions and alerts.
11. Generate a SAR-style report for a critical account.
12. Close with roadmap: production ingestion, graph DB, auth, case workflow,
    model governance, FIU integration.

## 21. Quality Checklist

Before presenting or deploying:

- Backend starts successfully on port 8089.
- `/health` reports graph loaded and model loaded.
- Frontend points to the intended API URL.
- `npm run build` succeeds in `nextgen-frontend/`.
- `python -m pytest tests -q` passes.
- `/graph/stats` returns realistic account and transaction counts.
- `/simulator/accounts` returns seeded accounts.
- `/ws/live` accepts WebSocket connections.
- `/reports/generate` returns report text for a known account.
- No real secrets are committed in `.env`.
- Render environment variables match deployed service URLs.

## 22. Ownership Notes

The project is best understood as five connected systems:

1. Data and graph foundation: `data/`, `ingestion/`, `graph_db/`.
2. Intelligence layer: `ml/`, `training/`, `saved_models/`.
3. API layer: `api/`.
4. Live simulation layer: `simulator/`.
5. User experience layer: `nextgen-frontend/`.

For future development, keep these boundaries clean. New features should usually
enter through a service or router, use `GraphManager` or `RiskEngine` rather than
duplicating logic, and expose typed frontend client functions from
`nextgen-frontend/src/lib/api.ts`.

## 23. Immediate Next Actions

Highest value next work:

1. Fix the dormant activation scan bug and add a regression test.
2. Update `start.bat` and `README.md` to launch the Next.js frontend.
3. Fix the frontend prediction helper.
4. Add auth and role-based access for non-demo use.
5. Decide whether Memgraph is production primary storage or demo-only sync.
6. Add CI for `pytest` and `next build`.
7. Add model metadata/version handling.

This master plan should be kept current as the project evolves. When major
features, endpoints, deployment settings, or model behavior change, update this
file in the same pull request as the code.
