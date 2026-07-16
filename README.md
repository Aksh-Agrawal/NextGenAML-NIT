# NextGenAML – Next-Generation AML Fund Flow Tracking System

### Union Bank of India – Problem Statement 3

> **End-to-end machine learning pipeline** for detecting money laundering via
> graph-based analysis of financial transaction networks.

---

## Architecture

```
NextGenAML/
├── ingestion/          # CSV → Memgraph property graph ingestion
│   ├── ingest_amlsim.py     Bulk-load AMLSim CSVs into Memgraph
│   └── graph_query.py       Cypher helpers (circular, dormant, structuring)
├── models/             # PyTorch Geometric GNN Models
│   ├── line_mvgnn.py        ★ LineMVGNN – Line Graph + bidirectional MP
│   ├── graphsage_inductive.py  Inductive embedding for dormant accounts
│   └── edge_encoder.py      AML-specific pattern-aware edge encoder
├── training/
│   └── train.py             NeighborLoader + FP16 AMP + GradScaler
├── api/                # FastAPI Microservice Backend
│   ├── main.py              All REST endpoints
│   ├── schemas.py           Pydantic models
│   ├── inference_engine.py  AMLInferenceEngine wrapper
│   ├── monitor.py           RealTimeAMLMonitor
│   └── metrics.py           Prometheus metrics
└── dashboard/
    └── app.py               Streamlit frontend (Pyvis + LangChain + Gemini)
```

## Quick Start

### 1. Prerequisites

- Docker Desktop (running)
- Python 3.11+ with venv (or use the existing `aml_system/venv`)
- NVIDIA GPU with CUDA 11.8+ (RTX 4050 or better)

### 2. Environment Setup

```bash
# Copy env template and fill in your Google API key
copy .env.example .env
# Edit .env -> set GOOGLE_API_KEY=...
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
# PyTorch with CUDA (separate command):
pip install torch==2.1.0 --index-url https://download.pytorch.org/whl/cu118
pip install torch_geometric
```

### 4. Start Everything (Windows)

```bash
start.bat
```

**Or manually:**

```bash
# Terminal 1: Memgraph
docker-compose up -d memgraph

# Terminal 2: FastAPI backend
python -m uvicorn api.main:app --host 0.0.0.0 --port 8089

# Terminal 3: Streamlit dashboard
streamlit run dashboard/app.py
```

### 5. Ingest Data

```bash
# Copy AMLSim CSV files into the data/ folder, then:
python ingestion/ingest_amlsim.py --csv_path data/HI-Small_Trans.csv

# All CSVs:
python ingestion/ingest_amlsim.py --csv_path data/ --all_csvs
```

### 6. Train the Model

```bash
# LineMVGNN (recommended – our custom model):
python training/train.py --model line_mvgnn --epochs 50

# GraphSAGE (inductive, faster):
python training/train.py --model graphsage --epochs 50
```

### 7. Open Dashboard

- **Streamlit:** http://localhost:8501
- **API Swagger:** http://localhost:8089/docs
- **Memgraph Lab:** http://localhost:3000

---

## Core Technology

| Component          | Technology                                   |
| ------------------ | -------------------------------------------- |
| Graph DB           | **Memgraph** (in-memory Cypher) + GQLAlchemy |
| ML Core            | **PyTorch Geometric** – custom LineMVGNN     |
| Inductive Learning | **GraphSAGE** (SAGEConv, 3 layers)           |
| Backend            | **FastAPI** + uvicorn (async microservice)   |
| Frontend           | **Streamlit** + **Pyvis** (physics graph)    |
| GenAI              | **LangChain** + **Google Gemini 2.0 Flash**  |
| GPU Optimization   | FP16 AMP, NeighborLoader [20,10], GradScaler |

## AML Typologies Detected

| Typology                    | Detection Method                                 |
| --------------------------- | ------------------------------------------------ |
| **Rapid Layering**          | LineMVGNN attention weights > 0.7                |
| **Circular Round-Tripping** | Cypher `MATCH p=(a)-[:TRANSACTION*3..6]->(a)`    |
| **Structuring / Smurfing**  | Amount cluster near $10,000 threshold            |
| **Dormant Activation**      | Inactive 180+ days → high-value transfer         |
| **KYC Mismatch**            | Node risk score vs. transaction volume deviation |

## Hardware Constraints (RTX 4050, 8 GB VRAM)

- `NeighborLoader`: max **20 hop-1 neighbors**, **10 hop-2 neighbors**
- `torch.cuda.amp.autocast()`: FP16 forward pass on Tensor Cores
- `GradScaler`: FP16-safe backpropagation
- `num_workers=4`, `pin_memory=True`: PCIe DMA transfers

---

> Built for Union Bank of India Hackathon – Problem Statement 3
