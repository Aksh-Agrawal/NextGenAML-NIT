// ─── All static content for NextGenAML landing page ─────────────────────────

export const NAV_LINKS = [
  { label: 'Solution', href: '#typologies' },
  { label: 'Technology', href: '#tech-stack' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Demo', href: '#demo' },
]

export const HERO_STATS = [
  { value: '93%', label: 'Precision', color: '#FF3D57' },
  { value: '12ms', label: 'Inference', color: '#4D8EFF' },
  { value: '5', label: 'AML Typologies', color: '#A78BFA' },
]

export const TYPOLOGIES = [
  {
    id: 'layering',
    title: 'Rapid Layering',
    body: 'Funds moved through accounts in minutes. Traced via velocity burst detection and temporal edge analysis.',
    tag: 'velocity_24h feature',
    accent: '#FFB547',
    accentDim: 'rgba(255,181,71,0.12)',
  },
  {
    id: 'circular',
    title: 'Circular Round-Trip',
    body: 'A→B→C→A round-trip flows detected via Cypher path matching (3–6 hop cycles) in the property graph.',
    tag: 'MATCH p=(a)-[:TXN*3..6]->(a)',
    accent: '#FF3D57',
    accentDim: 'rgba(255,61,87,0.12)',
  },
  {
    id: 'structuring',
    title: 'Structuring / Smurfing',
    body: 'Transactions clustered ₹9,000–9,999 to stay below ₹10 lakh reporting threshold. Automated cluster detection.',
    tag: 'StructuringDetector',
    accent: '#4D8EFF',
    accentDim: 'rgba(77,142,255,0.12)',
  },
  {
    id: 'dormant',
    title: 'Dormant Activation',
    body: '180+ day inactive accounts suddenly receiving large transfers. GraphSAGE inductive inference on unseen nodes.',
    tag: 'GraphSAGE zero-shot',
    accent: '#2DD4BF',
    accentDim: 'rgba(45,212,191,0.12)',
  },
  {
    id: 'kyc',
    title: 'KYC–Transaction Mismatch',
    body: 'Customer risk profile vs. actual behavioral pattern discrepancy — caught at edge classification layer.',
    tag: 'PatternAwareEncoder',
    accent: '#A78BFA',
    accentDim: 'rgba(167,139,250,0.12)',
  },
]

export const ARCH_LAYERS = [
  {
    id: 'data',
    name: 'DATA LAYER',
    tech: 'Memgraph',
    specs: ['500K+ transactions', 'Cypher queries', 'Property graph'],
    color: '#4D8EFF',
  },
  {
    id: 'ml',
    name: 'ML INFERENCE',
    tech: 'LineMVGNN v2.0',
    specs: ['GraphSAGE', 'PatternEncoder', 'FP16 precision'],
    color: '#A78BFA',
  },
  {
    id: 'api',
    name: 'FASTAPI BACKEND',
    tech: 'REST API',
    specs: ['17 endpoints', 'Prometheus metrics', 'Real-time monitor'],
    color: '#2DD4BF',
  },
  {
    id: 'dashboard',
    name: 'DASHBOARD',
    tech: 'Next.js Frontend',
    specs: ['Pyvis graphs', 'SAR XML gen', 'Alert triage'],
    color: '#22C55E',
  },
]

export const ARCH_STATS = [
  { value: '~12ms', label: 'inference latency', accent: '#4D8EFF' },
  { value: '8 GB', label: 'RTX 4050 VRAM', accent: '#A78BFA' },
  { value: 'FP16', label: 'mixed precision', accent: '#22C55E' },
]

export const TECH_ROWS = [
  {
    label: 'Graph',
    items: [
      { name: 'Memgraph', color: '#4D8EFF' },
      { name: 'GQLAlchemy', color: '#4D8EFF' },
      { name: 'Cypher', color: '#2DD4BF' },
    ],
  },
  {
    label: 'ML',
    items: [
      { name: 'PyTorch', color: '#FF3D57' },
      { name: 'PyG', color: '#A78BFA' },
      { name: 'LineMVGNN', color: '#A78BFA' },
      { name: 'GraphSAGE', color: '#A78BFA' },
    ],
  },
  {
    label: 'Backend',
    items: [
      { name: 'FastAPI', color: '#22C55E' },
      { name: 'uvicorn', color: '#22C55E' },
      { name: 'Pydantic', color: '#4D8EFF' },
      { name: 'Prometheus', color: '#FFB547' },
    ],
  },
  {
    label: 'AI',
    items: [
      { name: 'Gemini 2.0 Flash', color: '#4D8EFF' },
      { name: 'LangChain', color: '#22C55E' },
      { name: 'FIU-IND XML', color: '#FFB547' },
    ],
  },
]

export const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    title: 'Ingest raw transactions',
    body: 'AMLSim CSV data ingested into Memgraph via GQLAlchemy. 500K+ transactions stored as property graph with O(1) account lookup.',
    code: 'python ingestion/ingest_amlsim.py --csv_path data/HI-Small_Trans.csv',
    accent: '#4D8EFF',
  },
  {
    number: '02',
    title: 'Train LineMVGNN',
    body: 'Novel line-graph architecture elevates transactions to first-class entities. 50 epochs on RTX 4050 with FP16 mixed precision training.',
    code: 'python training/train.py --model line_mvgnn --epochs 50 --fp16',
    accent: '#A78BFA',
  },
  {
    number: '03',
    title: 'Detect patterns via Cypher',
    body: 'Real-time graph traversal queries detect circular flows (3–6 hop cycles), structuring clusters, and dormant activations.',
    code: "MATCH p=(a:Account)-[:TRANSACTION*3..6]->(a) WHERE a.risk > 0.7 RETURN p",
    accent: '#FFB547',
  },
  {
    number: '04',
    title: 'Generate SAR report',
    body: 'LangChain + Gemini 2.0 Flash auto-generates FIU-IND compliant ARF/TRF XML for direct regulatory submission.',
    code: "chain = prompt | ChatGoogleGenerativeAI(model='gemini-2.0-flash')",
    accent: '#FF3D57',
  },
]

export const METRICS = [
  { value: 93, suffix: '%', label: 'Model Precision', accent: '#4D8EFF' },
  { value: 12, suffix: 'ms', label: 'Inference Latency', accent: '#FFB547' },
  { value: 5, suffix: '', label: 'AML Typologies', accent: '#A78BFA' },
  { value: 0, suffix: '', label: 'FIU-IND Compliant', special: 'FIU', accent: '#22C55E' },
]

export const DEMO_ALERTS = [
  {
    id: 'ACCT-8921',
    risk: 'CRITICAL',
    prob: 93,
    patterns: ['Circular', 'Layering'],
    amount: '₹37,400',
    probColor: '#FF3D57',
  },
  {
    id: 'ACCT-4512',
    risk: 'HIGH',
    prob: 76,
    patterns: ['Structuring'],
    amount: '₹28,800',
    probColor: '#FFB547',
  },
  {
    id: 'ACCT-2247',
    risk: 'HIGH',
    prob: 68,
    patterns: ['Dormant', 'Layering'],
    amount: '₹15,200',
    probColor: '#FFB547',
  },
  {
    id: 'ACCT-7703',
    risk: 'MEDIUM',
    prob: 44,
    patterns: ['KYC Mismatch'],
    amount: '₹8,750',
    probColor: '#4D8EFF',
  },
  {
    id: 'ACCT-1138',
    risk: 'LOW',
    prob: 21,
    patterns: ['Velocity'],
    amount: '₹3,100',
    probColor: '#22C55E',
  },
]
