# NextGenAML – End-to-End Example Walkthrough

## 🏦 Scenario: "The Hawala Network"

A money launderer is using **5 shell accounts** to move ₹50 lakh in circular transactions
at X-Bank of India, deliberately keeping each transfer below the ₹10 lakh (≈ $10,000)
mandatory reporting threshold.

---

## Step 1 — User Action: Data Ingestion

The compliance officer drops the bank's monthly CSV into `data/` and runs:

```bash
python ingestion/ingest_amlsim.py --csv_path data/HI-Small_Trans.csv
```

**Input CSV:**

| Timestamp        | From Account | To Account | Amount Paid | Currency | Is Laundering |
| ---------------- | ------------ | ---------- | ----------- | -------- | ------------- |
| 2025-01-15 02:30 | ACCT-8921    | ACCT-4512  | 9,800       | USD      | 1             |
| 2025-01-15 02:45 | ACCT-4512    | ACCT-9910  | 9,500       | USD      | 1             |
| 2025-01-15 03:00 | ACCT-9910    | ACCT-7731  | 9,200       | USD      | 1             |
| 2025-01-15 03:15 | ACCT-7731    | ACCT-8921  | 8,900       | USD      | 1             |

**What the program does:**

1. **Feature Engineering** – log-normalizes amounts, encodes `02:30 AM` as `(sin=−0.97, cos=0.26)`,
   flags `is_round_amount=0.0`, computes `velocity_24h=0.84`
2. **Memgraph Ingestion** – creates 5 `Account` nodes + `TRANSACTION` edges with all features
3. **O(1) Index** – `CREATE INDEX ON :Account(id)` for instant lookup

**Console output:**

```
✅ Memgraph is ready.
✅ Schema and indices created.
✅ Ingestion complete | Accounts: 5 | Transactions: 4 | Laundering edges: 4
```

---

## Step 2 — Analyst Opens Streamlit Dashboard

URL: `http://localhost:8501`

The sidebar pings FastAPI (`GET /ping`) → `✅ Backend: Connected`.
Graph stats show **5 accounts, 4 transactions, 4 laundering edges**.

The analyst selects **`ACCT-8921`** from the dropdown.

---

## Step 3 — Fund Flow Graph Rendering

Dashboard calls:

```
GET http://localhost:8089/subgraph/ACCT-8921?hops=2&limit=120
```

**Memgraph Cypher Query (inside FastAPI):**

```cypher
MATCH path = (center:Account {id: "ACCT-8921"})-[:TRANSACTION*1..2]-(neighbor)
UNWIND relationships(path) AS e
RETURN startNode(e).id AS src_id, endNode(e).id AS dst_id,
       e.amount, e.timestamp, e.is_laundering, e.amount_norm ...
```

**LineMVGNN Forward Pass:**

```
Input:
  x          = [5 nodes × 16 features]
  edge_index = [[0,1,2,3], [1,2,3,0]]   ← circular ring
  edge_attr  = [4 edges × 6 features]    ← amount_norm=0.98, ts_sin=−0.97 ...

LineMVGNN Steps:
  1. AMLEdgeProjector  → 6-dim raw → 64-dim latent edge embedding
  2. build_line_graph() → edges become NODES in L(G)
                          (8921→4512) connected to (4512→9910) via shared node 4512
  3. LineGraphPropagator → edge-to-edge messages across L(G)
                           "relay" pattern is explicitly encoded
  4. BidirectionalConv (×2 layers, SHARED weights)
     → each account aggregates both senders and receivers equally
     → shared weight forces "gather-scatter" smurfing recognition
  5. Edge Head  → edge_pred  = [0.97, 0.95, 0.94, 0.96]
  6. Node Head  → node_pred[ACCT-8921] = 0.93
```

**Attention weights returned to Streamlit:**

```json
{
  "ACCT-8921->ACCT-4512": 0.931,
  "ACCT-4512->ACCT-9910": 0.914,
  "ACCT-9910->ACCT-7731": 0.908,
  "ACCT-7731->ACCT-8921": 0.921
}
```

**Pyvis graph:** All 4 edges are **🔴 RED** (attention > 0.7, width=5), forming a visible closed loop.
Center node `ACCT-8921` shown as a ⭐ blue star.

**Dashboard KPIs:**

```
Risk Score:    93.0%   [CRITICAL]
Confidence:    86.0%
Inference:     12 ms
```

---

## Step 4 — Pattern Detector Tab

Analyst clicks **"🔁 Circular Transactions"**:

```
GET http://localhost:8089/patterns/circular
```

**Cypher inside Memgraph:**

```cypher
MATCH p=(a:Account)-[:TRANSACTION*3..6]->(a)
WHERE ALL(r IN relationships(p) WHERE r.amount > 0)
RETURN [n IN nodes(p) | n.id] AS account_chain,
       REDUCE(total=0.0, r IN relationships(p) | total + r.amount) AS total_flow,
       LENGTH(p) AS cycle_length
```

**Dashboard output:**

```
Cycle #1 | Length: 4 nodes | Total Flow: $37,400
🔴 ACCT-8921 → ACCT-4512 → ACCT-9910 → ACCT-7731 → ACCT-8921
```

---

## Step 5 — FIU-IND SAR Generation

Analyst clicks **"📄 Generate FIU-IND SAR Report"** in the sidebar.

**LangChain sends to Gemini 2.0 Flash:**

```json
{
  "subject_account": {
    "account_id": "ACCT-8921",
    "risk_level": "CRITICAL",
    "fraud_prob": 0.93
  },
  "transaction_summary": {
    "flagged_edges": 4,
    "total_flagged_amount_usd": 37400
  },
  "circular_patterns": [
    {
      "accounts": [
        "ACCT-8921",
        "ACCT-4512",
        "ACCT-9910",
        "ACCT-7731",
        "ACCT-8921"
      ],
      "total_flow": 37400
    }
  ],
  "aml_typologies": ["Rapid Layering", "Circular Round-Trip", "Structuring"]
}
```

**Gemini Output — SAR Narrative:**

> _"Account ACCT-8921 has been flagged by the LineMVGNN model with a fraud probability of 93.0%
> (CRITICAL). The GNN analysis identified a closed circular transaction loop involving 4 accounts
> with a total fund flow of USD 37,400. All transactions occurred between 02:30–03:15 AM IST,
> consistent with off-hours structuring. Individual transaction amounts ($8,900–$9,800) are
> deliberately maintained below the $10,000 mandatory reporting threshold.
> Recommend immediate account freeze and STR filing with FIU-IND within 7 days."_

**Gemini Output — FIU-IND ARF/TRF XML:**

```xml
<FINGateCTRData>
  <ReportingEntity>
    <BankName>X-Bank of India</BankName>
    <FIUReg>FIIIND20250001</FIUReg>
  </ReportingEntity>
  <AlertDetails>
    <ReportID>ARF-ACCT-8921-20250115</ReportID>
    <FilingDate>2025-01-15</FilingDate>
    <RiskScore>0.93</RiskScore>
  </AlertDetails>
  <SubjectAccount>
    <AccountID>ACCT-8921</AccountID>
    <RiskLevel>CRITICAL</RiskLevel>
    <KYCStatus>HIGH_RISK</KYCStatus>
  </SubjectAccount>
  <TransactionSummary>
    <FlaggedTransactions>4</FlaggedTransactions>
    <TotalAmount currency="USD">37400.00</TotalAmount>
  </TransactionSummary>
  <LLEDTypology>CIRCULAR_ROUND_TRIP + STRUCTURING</LLEDTypology>
</FINGateCTRData>
```

Analyst clicks **"⬇️ Download ARF/TRF XML"** → submits to FIU-IND.
Analyst clicks **"👍 Confirm Alert"** → logged to `logs/feedback_log.csv` for model retraining.

---

## Complete Flow Diagram

```
 CSV File (HI-Small_Trans.csv)
       ↓
 [ingest_amlsim.py]
   Feature Engineering (log-norm, cyclic time, structuring flags)
   → Memgraph: 5 Account nodes + 4 TRANSACTION edges + O(1) indices
       ↓
 [Streamlit Dashboard]  ←→  [FastAPI :8089]
   Analyst selects ACCT-8921
   GET /subgraph/ACCT-8921 → Cypher ego-subgraph
       ↓
 [LineMVGNN] (FP16 AMP, RTX 4050, 12ms)
   Line Graph → Bidirectional MP → Attention weights
   edge_pred: [0.97, 0.95, 0.94, 0.96]   node_pred: 0.93
       ↓
 [Pyvis Graph]  🔴 RED circular edges rendered in browser
       ↓
 [Pattern Detector]
   Cypher MATCH p=(a)-[:TRANSACTION*3..6]->(a)
   → Cycle #1: ACCT-8921→4512→9910→7731→8921 | $37,400
       ↓
 [LangChain + Gemini 2.0 Flash]
   SAR Narrative + FIU-IND ARF/TRF XML generated
       ↓
 [Analyst] downloads XML → submits to FIU-IND
           clicks 👍 → feedback_log.csv for retraining
```

**Total time: raw CSV → FIU-IND XML evidence package ≈ < 30 seconds**
