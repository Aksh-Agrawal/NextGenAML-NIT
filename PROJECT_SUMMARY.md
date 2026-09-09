# NextGenAML — Project Summary & Future Integration Roadmap

**Next-Generation Anti-Money Laundering (AML) Fund Flow Tracking System**
**X-Bank of India | Problem Statement 3 | Hackathon 2026**

---

## 1. Project Summary

### 1.1 The Problem

X-Bank of India needs an intelligent system to detect money laundering by
tracking end-to-end fund flows across thousands of accounts. Manual review
cannot keep pace with transaction volumes, and rules-only systems miss
sophisticated multi-hop laundering schemes.

The system must identify five AML typologies:

| Typology | Description |
| --- | --- |
| **Rapid Layering** | Funds moved through multiple accounts within minutes |
| **Circular Transactions** | Round-trip flows (A→B→C→A) to obscure origin |
| **Structuring (Smurfing)** | Many transactions just below the ₹10 lakh reporting threshold |
| **Dormant Activation** | Inactive accounts suddenly receiving large transfers |
| **KYC-Transaction Mismatch** | Customer profile contradicts actual behavior |

### 1.2 The Solution

NextGenAML is a **graph-native, ML-driven AML monitoring platform** that:

1. **Builds a property graph** from raw CSV transactions (NetworkX `DiGraph`)
   — accounts as nodes, transfers as edges with aggregated amounts/counts.
2. **Scores risk** with a composite engine:
   `0.5 × ML + 0.3 × Pattern + 0.2 × Anomaly → risk_score [0–100]`,
   enriched with graph-wide `risk_engine.score_all()` recomputation.
3. **Detects patterns** in real time — circular cycles (`nx.simple_cycles`),
   structuring thresholds, dormant gaps, velocity bursts.
4. **Explains every decision** — risk factors, pattern analysis, and suspicious
   edges surfaced per account (`/explain/{id}`).
5. **Streams live UPI transactions** — a full simulated UPI rail (9 fraud/behavior
   presets, TPS 1–100, WebSocket push, instant fraud alerts) proving real-time
   monitoring works.
6. **Produces FIU-IND compliant reports** — SAR narratives and ARF/TRF XML via
   Google Gemini 2.0 Flash.
7. **Visualizes fund flows** — a D3.js force-directed graph with node
   intelligence panels, risk filtering, and 3 layouts.

### 1.3 Current State (What Works Today)

| Area | Status |
| --- | --- |
| Backend API (FastAPI, 14 routers, REST + WebSocket) | ✅ Operational on `:8089` |
| Frontend (Next.js 14, 9 pages + simulator) | ✅ Operational on `:3000` |
| Graph construction + risk enrichment | ✅ 5,760 transactions, 525 accounts; node risk max 97.5 |
| ML inference | ✅ scikit-learn `GradientBoosting` fallback (PyTorch optional, not installed in dev) |
| Pattern detection (circular / structuring / dormant) | ✅ |
| Real-time UPI simulator (stream engine + presets + WS) | ✅ `state`-based control contract, live envelopes |
| Explainability (`/explain/{id}`) | ✅ |
| FIU-IND SAR/XML generation (Gemini) | ✅ (requires API key) |
| Tests | ✅ 36 passing (`pytest tests/ -q`) |
| Container / cloud scaffolding | ✅ `Dockerfile.api`, `docker-compose.yml`, `render.yaml` |

### 1.4 Core Architecture

```
Frontend (Next.js 14, D3.js, Recharts, React Query)
   │  HTTP REST                     │  WebSocket (live stream envelopes)
   ▼                                ▼
FastAPI Backend (:8089)
   ├── Risk Engine (0.5×ML + 0.3×Pattern + 0.2×Anomaly)
   ├── Inference Engine (GNN / GBDT fallback)
   ├── Pattern Detectors (circular, structuring, dormant)
   ├── Simulator (stream_engine, presets, ledger, alert_registry)
   └── Graph Manager (NetworkX DiGraph, optional Memgraph sync)
   │
   ▼
Data: CSV ingestion + JSONL simulator ledger  →  Graph + Risk Scores
   │
   ▼
Gemini 2.0 Flash → SAR narrative + FIU-IND ARF/TRF XML
```

---

## 2. Future Integration Roadmap

Phased, production-oriented. Each phase is independent and can be adopted
individually.

### Phase 1 — Production Data Ingestion (replace CSV + simulator as source)

| Integration | Why | How |
| --- | --- | --- |
| **Core banking / switch feeds** | Real transactions instead of CSV uploads | Consume UPI/IMPS/NEFT/RTGS settlement files (ISO 20022, CAMT.053, MT940/MT942) via a dedicated `ingestion/` pipeline |
| **Message-queue streaming** | Low-latency, reliable, back-pressure-safe | Add **Kafka** (or RabbitMQ) producer/consumer; simulator emits to the same topic as production feeds, so the whole downstream stack stays identical |
| **REST webhook ingestion** | Banks and partners push transactions | `POST /ingest/transaction` webhook with HMAC signature validation, idempotency keys, and replay protection |
| **Faster graph DB** | NetworkX is in-memory only and does not scale past one instance | Promote **Memgraph/Neo4j** from optional to primary via the existing `graph_db/manager.py` Bolt connector; keep NetworkX as a read model |
| **Batch file drop** | Nightly ETL from data warehouses | AWS S3 / GCS bucket watcher + Airflow/Prefect DAG that parses files and calls the ingest API |

### Phase 2 — Machine Learning Upgrade

| Integration | Why | How |
| --- | --- | --- |
| **Enable GNN training** | LineMVGNN/GraphSAGE are defined but PyTorch is not installed in dev | Add `torch` + `torch-geometric` to the runtime; run `training/train.py` on GPU; wire `fusion_gate.py` to combine graph + tabular scores |
| **Continuous / online learning** | Model must adapt as fraud shifts | Scheduled retraining job (weekly / on-demand via `/upload/csv`), model versioning in `saved_models/`, drift monitoring |
| **MLflow / model registry** | Track experiments, metrics, promotions | Log params/metrics/artifacts; compare GNN vs GBDT before promoting |
| **Temporal graph nets** | Laundering is inherently time-ordered | Add temporal/heterogeneous GNN support (time-stamped edges, node types) |
| **Explainability (SHAP/LIME)** | Deeper per-account explanations for regulators | Add SHAP on the tabular fallback and GNN attribution methods |
| **Entity resolution** | Same person across accounts/names | Integrate a matching service (fuzzy name/ID/KYC matching) to merge entity nodes |

### Phase 3 — Compliance & Regulatory Integration

| Integration | Why | How |
| --- | --- | --- |
| **FIU-IND FINGate 2.0** | Submit STR/SAR reports to the regulator | Add a connector that posts generated XML to FINGate with acknowledgement/rejection handling |
| **SAR/case management workflow** | Analysts need a decision trail | Case lifecycle (open → investigate → escalate → file/disposition), audit log, reassignment |
| **Watchlist & PEP screening** | Regulatory requirement | Integrate OFAC / UN / EU / domestic lists + PEP data; flag matches on ingestion |
| **Threshold automation** | Reduce manual report churn | Config-driven auto-reporting rules based on risk score, pattern type, and amount |
| **Retention & audit** | Data governance | Immutable append-only ledger (already JSONL) → archive to object storage with retention policies |

### Phase 4 — Frontend & User Experience

| Integration | Why | How |
| --- | --- | --- |
| **AuthN/AuthZ (RBAC)** | Compliance officers, analysts, admins need different access | Add JWT/OAuth2 (or bank SSO) login; role-based routes and API guards; audit of who saw what |
| **Case management UI** | Track alerts through investigation | Reuse the existing alerts + simulator pages; add case assignment, notes, attachments, disposition |
| **Alerting & notifications** | Analysts shouldn't poll | Email / in-app / webhook alerts on critical-risk accounts and new SAR-ready cases (reuse the WS push already built) |
| **Multi-tenant support** | Multiple branches / banks | Tenant-scoped graph partitions and query isolation |

### Phase 5 — Observability, Security & Infrastructure

| Integration | Why | How |
| --- | --- | --- |
| **Prometheus + Grafana** | Production monitoring | Add `prometheus-client` metrics (request latency, queue depth, stream TPS, alert rate) and dashboards |
| **Structured logs + tracing** | Debugging distributed flows | loguru → JSON logs, add OpenTelemetry tracing across ingestion → scoring → alerting |
| **CI/CD** | Safe, repeatable deploys | GitHub Actions: lint, `pytest`, `next build`, build images, deploy to Render/K8s |
| **API gateway & rate limiting** | Protect the ingest webhook | Enforce per-client quotas, validate JWT, handle retries |
| **Secrets management** | Gemini key, DB creds | Move from `.env` to a vault (Render env / AWS Secrets Manager) |
| **Kubernetes** | Scale beyond one Render service | Containerize backend + frontend + Kafka + Memgraph with autoscaling |

### Integration Priority Matrix

| Phase | Effort | Impact | When |
| --- | --- | --- | --- |
| 1. Live ingestion (Kafka + webhook + graph DB) | Medium | High | Next |
| 2. GNN training + model registry | Medium | High | Next |
| 3. FIU-IND + case management | High | Critical | Before regulatory use |
| 4. AuthN/RBAC + case UI | Medium | High | Before multi-user use |
| 5. Observability + CI/CD | Low–Medium | Medium | Ongoing |

---

## 3. Suggested First Actions

1. **Switch the simulator to Kafka**: emit streamed envelopes to a topic and
   consume them in the same `graph_db` + risk pipeline used today — unblocks
   production ingestion with zero new UI work.
2. **Promote Memgraph**: enable the Bolt connector in `graph_db/manager.py`
   (already scaffolded in `docker-compose.yml`) and benchmark subgraph queries.
3. **Enable PyTorch**: install torch/PyG, run `training/train.py`, and compare
   LineMVGNN vs the current GBDT fallback on the composite risk output.
4. **Add RBAC + JWT**: simplest first production feature that makes the app
   safe for a compliance team.
5. **Instrument metrics**: add `/metrics` + Grafana; alert on stream drop and
   model drift.

---

_Document generated from the NextGenAML codebase — August 2026_
