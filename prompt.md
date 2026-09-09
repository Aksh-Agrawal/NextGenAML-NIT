# Prompt: Real-Time UPI Transaction Simulator for NextGenAML

You are a senior Full-Stack Engineer, AI Engineer, and Graph ML researcher working on the **NextGenAML** repository at `C:\folder\NextGenAML`.

## Existing Application (facts you MUST know before writing any code)

The app is a working AML (Anti-Money Laundering) platform. Study these files first:

### Backend (FastAPI)
| File | What it does |
|---|---|
| `api/main.py` | FastAPI app. Global singletons `graph_manager` (`GraphManager`), `inference_engine` (`InferenceEngine`), `risk_engine` (`RiskEngine`). Registers routers from `api/routers/*`. Serves the Next.js static export. Loguru logging → `logs/api.log`. |
| `api/config.py` | `Settings` via env (`.env`). `GNN_MODEL_TYPE` default `"graphsage"`, `USE_ADAPTIVE_FUSION`, `DATA_DIR`, `TRANSACTION_CSV`, `LOGS_DIR`, `FRONTEND_ORIGINS`. |
| `api/schemas.py` | Pydantic request/response models. |
| `api/routers/` | `health, predictions, patterns, graph, accounts, alerts, explain, analytics, model_info, reports, timeline, upload`. Endpoints use **no `/api` prefix** (e.g. `/graph/stats`, `/alert`, `/monitor/transaction`). |
| `graph_db/manager.py` | `GraphManager`: in-memory `networkx.DiGraph G`, raw ledger DataFrame `self._df`, `self._account_features` dict. Core methods: `load_from_csv`, `_build_graph`, `_compute_account_features`, `get_subgraph`, `get_full_graph`, `get_transaction_flow`, `detect_circular_patterns`, `detect_structuring`, `detect_dormant_activations`, `get_stats`, `connect_memgraph`, `sync_to_memgraph`, `get_dataframe`. Pattern caches (`_circular_cache`, `_structuring_cache`, `_dormant_cache`) are cleared on reload. |
| `ml/model.py` | `AMLGraphSAGE`, `LineMVGNN`, `FallbackClassifier`. Selected by `get_model_class(model_type)`. **The app does not hardcode "LineMVGNN"** — the default is GraphSAGE. |
| `ml/inference.py` | `InferenceEngine.predict(account_id)` returns `{fraud_probability, risk_level, confidence, attention_weights}`. Wraps whichever model is loaded. `_account_index` maps account id → row. |
| `ml/risk_engine.py` | `RiskEngine.score_account(account_id)` → `{risk_score (0–100), ml_score, pattern_score, anomaly_score, pattern_detected, status (Verified/Under Review/Flagged/Critical), volume_30d, transaction_count, fusion_weights}`. Caches results in `_all_scores_cache`; `score_all()` returns it. |
| `api/routers/predictions.py` | `POST /monitor/transaction` already scores a one-off transaction (`TransactionInput`) but **does not store it or update the graph**. |
| `api/routers/upload.py` | `POST /upload/csv` reloads CSV → rebuilds graph → retrains model → recomputes patterns/scores. This is the **full reload** path — do not reuse it for per-transaction updates. |

### Frontend (Next.js 14, App Router, TypeScript, static export)
| File | What it does |
|---|---|
| `nextgen-frontend/package.json` | Next 14.2, React 18, `@tanstack/react-query`, `framer-motion`, `d3`, `recharts`, `react-countup`, `lucide-react`, tailwind. |
| `nextgen-frontend/src/app/` | Pages: `(landing)`, `dashboard`, `alerts`, `fund-flow/[accountId]`, `patterns`, `sar-report`, `monitor`. Each page has `layout.tsx` (sidebar shell) + `page.tsx`. |
| `nextgen-frontend/src/components/Sidebar.tsx` | `NAV_ITEMS` array — **add your new page here**. |
| `nextgen-frontend/src/lib/api.ts` | Single API client. `API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://nextaml-iim-api.onrender.com"`. All types + `api.*` functions. **Add new functions here.** |
| `nextgen-frontend/src/lib/utils.ts` | `formatAmount`, `getRiskColor`, `getRiskFromScore`, `getRiskFromProb`, `cn`, `formatTimestamp`. |
| `nextgen-frontend/src/components/ui.tsx` | Shared `RiskBadge`, `ProbabilityBar`, `LoadingState`, `ErrorCard`. Reuse these — do not reinvent. |
| `nextgen-frontend/src/components/FundFlowGraph.tsx` | d3 force-directed graph with replay mode, animated edges, node glow, risk coloring, `flow-dash` animation, tooltips, right-hand "Node Intelligence" panel. Study the replay effect (`addTransactionToReplay`) — it is the pattern to follow for live edge insertion. |
| `nextgen-frontend/src/app/monitor/page.tsx` | Existing live feed + `Manual Transaction Scorer` calling `/monitor/transaction`. This is the closest existing UI. |

**Critical architectural constraints**
- The frontend is a **static export** (`next build` → `nextgen-frontend/out`, served by FastAPI). There is no Next.js server. The browser talks directly to the FastAPI backend. Any WebSocket/SSE URL must be derived client-side from `API_BASE` (replace `http(s)` → `ws(s)`).
- The graph is **in-memory (NetworkX)** with optional Memgraph sync. There is **no SQL database**. Do not introduce a heavy DB stack; lightweight persistence (JSON ledger / appended CSV / SQLite via stdlib) is acceptable if it cannot break existing behavior.
- Existing "real-time" is **react-query polling** (`refetchInterval`). Keep it as a fallback; add a real push channel.
- No WebSocket/Socket.IO/Redis/Celery exists today. `websockets==16.0` is in `requirements.txt`, so **Starlette-native WebSocket** (`@app.websocket`) is the lowest-risk choice. Do not add socket.io unless you add its client dependency to `package.json` and backend.

## IMPORTANT REQUIREMENTS (non-negotiable)

1. **Do NOT modify or break any existing functionality.** Existing pages, layouts, `NAV_ITEMS`, routers, schemas, the inference pipeline, graph visualization, alerts, and analytics must keep working unchanged.
2. **Add only.** New backend router, new frontend page, new API client functions, new components. Register the new router in `api/main.py` (one import + one `include_router` line). Add the new nav item to `NAV_ITEMS`.
3. **Reuse the existing pipeline.** Do not write a second GNN or risk engine. Route scoring through `risk_engine.score_account(...)` / `inference_engine.predict(...)`. Extend `GraphManager` with an incremental `add_transaction(...)` method rather than reloading the CSV.
4. Keep the existing endpoint naming convention: **no `/api` prefix**. Use a `/simulator/*` namespace.

## Goal

Build a **Real-Time UPI Transaction Simulator** module that lets a user perform a dummy **mobile-to-mobile UPI-style payment** (from the phone, like Google Pay / PhonePe) which registers on the web app **instantly, without refreshing the page**, and flows through the full existing pipeline:

```
Phone (UPI pay screen)
  → POST /simulator/pay            (captures sender, receiver, amount, remark,
                                     device id, ip, location, channel, status)
  → GraphManager.add_transaction() (append to ledger, update DiGraph edge aggregates,
                                     recompute ONLY affected account features, invalidate
                                     pattern caches + RiskEngine score cache, sync Memgraph)
  → RiskEngine incremental rescore (sender, receiver + their 1-hop neighbors)
  → Alert engine                   (if score crosses threshold → alert entry)
  → WebSocket broadcast "NEW_TRANSACTION" (full payload: tx + risk + alerts + updated graph delta)
  → All open web dashboards update live: Fund Flow graph animates, Dashboard cards
     tick, Timeline gets an entry, Alert panel flashes, Monitor feed gets a row
```

## What the Module Must Contain

### 1. Dummy UPI Accounts (seeded in-memory registry)
Create a seed registry (new backend module, e.g. `simulator/seed_accounts.py`) with 8+ dummy users. Each has: name, mobile number (10-digit), UPI ID (`name@demo`), wallet balance (₹), base risk score, account id (keep `account_id` consistent with the existing string-based account model).

Example seed:
| Name | Mobile | UPI ID | Balance |
|---|---|---|---|
| Rahul | 9876543210 | rahul@demo | ₹75,000 |
| Priya | 9876543211 | priya@demo | ₹62,000 |
| Akash | 9876543212 | akash@demo | ₹1,20,000 |
| Neha | 9876543213 | neha@demo | ₹48,500 |
| Aman | 9876543214 | aman@demo | ₹90,000 |
| Riya | 9876543215 | riya@demo | ₹33,000 |
| Vikas | 9876543216 | vikas@demo | ₹2,10,000 |
| Sonia | 9876543217 | sonia@demo | ₹56,750 |

Wallet balances must debit sender / credit receiver atomically in memory; a payment that would overdraft should be rejected with a friendly error (still scored/logged).

### 2. Mobile UPI Pay Screen (the headline feature)
On the new simulator page, render a **phone-frame UI** (approx. 380px wide, rounded bezel) that mimics Google Pay / PhonePe:
- From / To pickers (avatar, name, UPI ID, balance)
- Amount with ₹ symbol and a few quick chips (₹500, ₹1,000, ₹2,500, ₹5,000)
- Remark field with suggestions ("Dinner", "Rent", "Salary", "Lending")
- Big "Pay" button with **success / failure animation** (checkmark sweep / shake)
- After success: show a receipt card (transaction id, timestamp, status, risk verdict)

**Phone-accessibility:** the page must be reachable from a phone. Render a **QR code** (a `qrcode.react` or a small client-side QR lib) encoding the simulator URL (same LAN host), so the user can "pay from their mobile" on a real phone browser and watch it appear on the desktop web app. The pay screen must be responsive so it works on an actual phone too.

### 3. Live Graph Update
- Reuse the d3 `FundFlowGraph` rendering approach. On a `NEW_TRANSACTION` event, insert the new sender/receiver nodes and the edge `sender → receiver`, animate the edge (dash flow, flash, show `₹amount` label), color by risk: **green** normal · **yellow** medium · **red** high/critical.
- Do not rebuild the whole d3 simulation; reuse the existing incremental replay insertion pattern (`addTransactionToReplay` in `FundFlowGraph.tsx`).

### 4. Real-Time Transport
- Backend: Starlette `@app.websocket("/ws/live")`. Maintain a set of connected sockets (thread-safe; uvicorn). On every simulated/payed transaction, broadcast a JSON envelope:
  ```json
  {
    "type": "NEW_TRANSACTION",
    "transaction": { "transaction_id", "sender", "receiver", "amount", "currency", "remark", "timestamp", "device_id", "ip", "location", "channel", "status" },
    "risk": { "sender": {...score}, "receiver": {...score} },
    "alert": { "id", "severity", "reason", "created_at" } | null,
    "graph_delta": { "new_nodes": [...], "new_edges": [...], "updated_node_ids": [...] },
    "stats": { "today_transactions", "total_volume", "avg_amount", "risk_alerts", "active_accounts", "tps", "avg_risk_score" }
  }
  ```
- Frontend: a `useLiveTransactions()` hook (new file, e.g. `src/lib/useLiveTransactions.ts`) that opens `ws(s)://<API_BASE host>/ws/live`, reconnects with backoff, and dispatches events. React-query polling remains as a fallback when the socket is closed.

### 5. Incremental Feature Update (no full rebuild)
Extend `GraphManager`:
- `add_transaction(tx: dict) -> dict`: validate, append row to `self._df`, insert/update nodes and the aggregated edge (`total_amount`, `tx_count`, `transactions`, `is_suspicious`), debit/credit wallet balances.
- Recompute `_account_features` **only** for the sender, the receiver, and their 1-hop neighbors.
- Invalidate the affected pattern caches (`_circular_cache`, `_structuring_cache`, `_dormant_cache`) and `RiskEngine._all_scores_cache` (add a `RiskEngine.invalidate()` and `RiskEngine.rescore(accounts)` that recomputes only those accounts).
- Optionally append the row to a JSON/SQLite ledger under `data/` and sync the changed nodes/edge to Memgraph (only if connected — never fail the request if Memgraph is down).
- **Never retrain the model per transaction.**

### 6. Risk & Alert Engine (reuse existing logic, add a live alert registry)
- After a payment, call the existing risk pipeline for `sender`, `receiver`, and neighbors, and compute the **transaction-level** risk from the signals already available in `GraphManager`/`RiskEngine` plus new ones: rapid movement, circular transfer, structuring, layering, smurfing, fan-in, fan-out, velocity, large transaction, repeated receiver, new receiver, dormant account activated, multiple/shared device, shared IP, geo anomaly, round amount, burst.
- New in-memory `AlertRegistry` (new module): each alert = `{id, transaction_id, sender, receiver, amount, severity, reason, timestamp}`. When a score crosses a threshold (align with existing `0.75 critical / 0.5 high` convention), create an alert, broadcast it, and expose `GET /simulator/alerts`. **Do not modify the existing `/alert` endpoint or the Alerts page behavior.**

### 7. Live Transaction Timeline
New "Live Transaction Timeline" panel showing streaming rows, e.g.:
```
09:21  Rahul paid Priya ₹500
09:22  Priya paid Aman ₹500
09:23  Aman paid Neha ₹500
09:24  ⚠ Risk increased
```
Fed from WebSocket events; persisted history served by `GET /simulator/history`.

### 8. Streaming / Load Simulation
Backend streaming engine (new module `simulator/stream_engine.py`) with presets **1 / 5 / 10 / 50 / 100 TPS** and controls `start`, `pause`, `resume`, `stop`. It generates plausible UPI traffic between the dummy accounts (random normal users + seeded risky behavior) at the chosen rate, each going through the exact same `add_transaction` + risk + alert + broadcast path. Implement with an `asyncio` task or a background thread with a queue; must be cancel-safe.

### 9. Fraud Simulation Presets
One-click scenario presets that auto-generate a realistic transaction sequence between the dummy accounts:
- Money Laundering, Structuring (sub-threshold cluster, e.g. ₹9,800–9,999 around the ₹10K threshold), Layering, Circular Flow (A→B→C→A), Rapid Transfers, Normal User, Business Payments, Salary Payments, Cash-Withdrawal Pattern.
Each preset is a small scripted/parameterized generator feeding the same pipeline. Presets should be idempotent (start/pause/resume/stop).

### 10. Transaction History
`GET /simulator/history` with filters: date range, risk level, sender, receiver, min/max amount; pagination. UI table with **Export CSV** and **Export JSON** (client-side generation is fine).

### 11. Live Statistics
Dashboard cards that tick instantly on each event: Today's Transactions, Total Volume, Average Amount, Risk Alerts, High-Risk Accounts, Active Accounts, Transactions Per Second, Average Risk Score.

### 12. API Contract (new endpoints only)
| Method | Path | Purpose |
|---|---|---|
| POST | `/simulator/pay` | Execute one UPI payment (accepts mobile + UPI id or account id; resolves sender/receiver). Returns full transaction + risk + alert. |
| POST | `/simulator/simulate` | Generate one random or preset-driven transaction. |
| POST | `/simulator/preset/{name}` | Run a named fraud preset (`presets: start|pause|resume|stop` via body/query). |
| POST | `/simulator/stream/{action}` | `start | pause | resume | stop`, body `{tps: 1|5|10|50|100, preset?: string}`. |
| GET | `/simulator/accounts` | Dummy accounts (name, mobile, upi_id, balance, risk_score, account_id). |
| GET | `/simulator/history` | Filtered/paginated transaction history. |
| GET | `/simulator/alerts` | Live alert registry. |
| GET | `/simulator/stats` | Live statistics payload. |
| WS | `/ws/live` | Push channel broadcasting `NEW_TRANSACTION` envelopes. |

All Pydantic schemas go in `api/schemas.py` (add only) or a `simulator/schemas.py` module. Register the router in `api/main.py`.

### 13. Persistence
Append-only JSON ledger (or SQLite) under `data/simulator_ledger.jsonl` for transactions and `data/simulator_alerts.jsonl` for alerts, written via a lock. On startup, optionally replay the ledger into `GraphManager` (off by default; a `SIMULATOR_REPLAY_LEDGER` env toggle). Never alter the existing CSV upload flow or `TRANSACTION_CSV`.

### 14. Logging
Use the existing loguru setup. Add `logs/simulator.log`, `logs/alert.log`, `logs/performance.log` (transaction, alert, and timing/inference latency records). Never print secrets.

### 15. Frontend Deliverables
- New page `nextgen-frontend/src/app/simulator/page.tsx` (+ `layout.tsx` matching existing shells).
- New sidebar entry in `src/components/Sidebar.tsx` `NAV_ITEMS` (icon e.g. `Smartphone`/`Zap`, label **Transaction Simulator**).
- New API client functions + types in `src/lib/api.ts` (mirror existing style).
- New `src/lib/useLiveTransactions.ts` hook.
- New components under `src/components/simulator/`: `UpiPhone.tsx` (pay screen + QR), `LiveTimeline.tsx`, `LiveStats.tsx`, `HistoryTable.tsx`, `StreamControls.tsx`, `PresetPicker.tsx`, `AlertToast.tsx`.
- Reuse `RiskBadge`, `ProbabilityBar`, `LoadingState`, `ErrorCard`, `formatAmount`, `getRiskColor`, `getRiskFromScore`.
- Follow the existing dark theme (CSS variables `--bg-base`, `--accent-green`, `--accent-amber`, `--accent-red`, `--accent-blue`, `--accent-purple`, classes `card`, `btn-primary`, `btn-ghost`, `btn-icon`, `input-dark`, `select-dark`, `live-dot`, `skeleton`, `table-dark`).
- Animations with framer-motion (existing convention), toast notifications on alerts, success/failure payment animations, graph transitions via the d3 pattern already in `FundFlowGraph.tsx`.

### 16. Performance
Target **100+ transactions/sec** with no UI freeze. Use: incremental graph/feature updates, batched WebSocket broadcasts (single message per transaction is fine, but never per-subscriber recompute), React memoization, debounced stat card updates, lazy rendering of the history table (windowed/paginated), and request throttling on the stream engine.

### 17. Testing
- Unit: seed accounts, wallet debit/credit, `GraphManager.add_transaction` invariants, feature recompute scope (only affected nodes), risk/alert threshold.
- Integration: `POST /simulator/pay` → verify ledger row, graph edge aggregate, broadcast received, alert created.
- WebSocket test: connect, pay, assert `NEW_TRANSACTION` envelope.
- Stress: burst 500 transactions through the stream engine; assert < Xms average inference latency and no dropped ledger rows.
- Follow the repo's existing test style (`test_backend.py`, pytest). Place new tests under `tests/`.

### 18. Code Quality
Follow SOLID, TypeScript best practices, reusable components, modular folders (`api/routers/simulator.py` or `api/simulator/`, `nextgen-frontend/src/components/simulator/`), no duplicated logic, no dead code. Comments in the existing concise docstring style (module docstrings + brief section comments; no excessive inline comments).

## Definition of Done / Demo Walkthrough

1. `start.bat` (or the 3 manual commands) boots the app unchanged.
2. Sidebar shows **Transaction Simulator**.
3. On the desktop browser, open the simulator page. A phone-frame UPI screen shows with Rahul's wallet.
4. Scan the QR with a phone → the same pay screen opens on the phone.
5. On the phone, send **Rahul → Priya ₹2,500 "Dinner"** → Pay.
6. On the desktop web app, **without any refresh**:
   - A toast/alert appears; the Fund Flow graph animates a new edge Rahul → Priya showing ₹2,500;
   - Dashboard KPI cards tick (volume, transaction count, avg risk);
   - Timeline shows `Rahul paid Priya ₹2,500`;
   - If the amount/pattern is suspicious (e.g. ₹95,000 rapid movement), a **High Risk Transaction** alert panel flashes with the reason;
   - The Monitor feed gets a scored row.
7. Start **5 TPS** streaming → graph keeps animating, stats keep updating, UI stays smooth.
8. Run the **Structuring** preset → sub-threshold cluster detected; risk scores rise; alerts fire.
9. `GET /simulator/history` returns everything; export CSV and JSON work.
10. All pre-existing pages/routers/tests still pass; `npm run lint` and `npm run build` (static export) succeed.

## Explicit Non-Goals
- Do not replace or wrap the existing ML model, risk engine, or graph store.
- Do not retrain the model at runtime.
- Do not change the existing alert/alerts router semantics.
- Do not introduce a message broker or heavy DB unless it is non-blocking and reversible.
- Do not touch the CSV upload/reload pipeline.
