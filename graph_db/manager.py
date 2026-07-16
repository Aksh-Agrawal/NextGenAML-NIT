"""
Graph manager using NetworkX (always available) with optional Memgraph connector.
Provides the central graph store for the entire AML pipeline.
"""

from __future__ import annotations
import networkx as nx
import pandas as pd
import numpy as np
from datetime import datetime
from loguru import logger
from typing import Optional

# Optional Memgraph via neo4j driver
_MEMGRAPH_AVAILABLE = False
try:
    from neo4j import GraphDatabase
    _MEMGRAPH_AVAILABLE = True
except ImportError:
    pass


class GraphManager:
    """Holds the transaction graph and exposes query helpers."""

    def __init__(self):
        self.G: nx.DiGraph = nx.DiGraph()
        self._df: Optional[pd.DataFrame] = None
        self._account_features: dict[str, dict] = {}
        self._neo4j_driver = None
        self._circular_cache: dict[tuple[int, int, int], list[dict]] = {}
        self._structuring_cache: dict[tuple[float, float], list[dict]] = {}
        self._dormant_cache: dict[int, list[dict]] = {}

    # ── Data Loading ───────────────────────────────────
    def load_from_csv(self, csv_path: str) -> int:
        """Load transactions from CSV, build graph, compute features."""
        df = pd.read_csv(csv_path)
        df.columns = df.columns.str.strip()
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df["amount"] = df["amount"].astype(float)
        if "label" in df.columns:
            df["label"] = df["label"].astype(int)
        else:
            df["label"] = 0
        self._df = df.sort_values("timestamp").reset_index(drop=True)
        self._circular_cache.clear()
        self._structuring_cache.clear()
        self._dormant_cache.clear()
        self._build_graph()
        self._compute_account_features()
        logger.info(
            f"Loaded {len(df)} transactions, {self.G.number_of_nodes()} accounts, "
            f"{self.G.number_of_edges()} edges"
        )
        return len(df)

    def _build_graph(self):
        """Build NetworkX directed graph from DataFrame."""
        self.G.clear()
        for _, row in self._df.iterrows():
            sender = row["sender_account"]
            receiver = row["receiver_account"]
            # Add nodes
            for acc in (sender, receiver):
                if acc not in self.G:
                    self.G.add_node(acc, type="entity", label=acc, risk=0.0)
            # Add edge (aggregate if multiple transactions between same pair)
            if self.G.has_edge(sender, receiver):
                ed = self.G[sender][receiver]
                ed["total_amount"] += row["amount"]
                ed["tx_count"] += 1
                ed["transactions"].append(row.to_dict())
            else:
                self.G.add_edge(
                    sender,
                    receiver,
                    total_amount=row["amount"],
                    tx_count=1,
                    transactions=[row.to_dict()],
                    is_suspicious=bool(row.get("label", 0)),
                )

    def _compute_account_features(self):
        """Compute per-account features for ML and risk scoring."""
        df = self._df
        accounts = set(df["sender_account"]) | set(df["receiver_account"])

        for acc in accounts:
            sent = df[df["sender_account"] == acc]
            received = df[df["receiver_account"] == acc]
            all_tx = pd.concat([sent, received])

            total_sent = sent["amount"].sum()
            total_received = received["amount"].sum()
            tx_count = len(all_tx)
            avg_amount = all_tx["amount"].mean() if tx_count > 0 else 0
            log_amount = float(np.log1p(total_sent + total_received))

            # Time features
            if len(all_tx) > 1:
                times = all_tx["timestamp"].sort_values()
                velocity = times.diff().dt.total_seconds().dropna()
                avg_velocity = velocity.mean() if len(velocity) > 0 else 0
                min_velocity = velocity.min() if len(velocity) > 0 else 0
            else:
                avg_velocity = 0
                min_velocity = 0

            # Hour encoding
            hours = all_tx["timestamp"].dt.hour
            avg_hour = hours.mean() if len(hours) > 0 else 12
            sin_time = float(np.sin(2 * np.pi * avg_hour / 24))
            cos_time = float(np.cos(2 * np.pi * avg_hour / 24))

            # Suspicious label ratio
            label_ratio = float(all_tx["label"].mean()) if "label" in all_tx.columns else 0.0

            # Degree
            in_deg = self.G.in_degree(acc) if acc in self.G else 0
            out_deg = self.G.out_degree(acc) if acc in self.G else 0

            features = {
                "total_sent": float(total_sent),
                "total_received": float(total_received),
                "tx_count": int(tx_count),
                "avg_amount": float(avg_amount),
                "log_amount": log_amount,
                "avg_velocity_sec": float(avg_velocity),
                "min_velocity_sec": float(min_velocity),
                "sin_time": sin_time,
                "cos_time": cos_time,
                "label_ratio": label_ratio,
                "in_degree": in_deg,
                "out_degree": out_deg,
            }
            self._account_features[acc] = features

    def _edge_suspicious_score(self, u: str, v: str, data: dict) -> float:
        """Compute a 0-1 suspicious score for an edge blending multiple signals."""
        # 1. Flag ratio from transactions (0-1)
        txs = data.get("transactions", [])
        if txs:
            flag_ratio = sum(1 for t in txs if t.get("label", 0)) / len(txs)
        else:
            flag_ratio = 1.0 if data.get("is_suspicious") else 0.0

        # 2. Average endpoint risk (0-1)
        u_risk = self._account_features.get(u, {}).get("label_ratio", 0.0)
        v_risk = self._account_features.get(v, {}).get("label_ratio", 0.0)
        endpoint_risk = (u_risk + v_risk) / 2

        # 3. Amount anomaly: how far is this edge's avg tx from the global mean?
        global_avg = self._df["amount"].mean() if len(self._df) > 0 else 1.0
        edge_avg = data.get("total_amount", 0) / max(data.get("tx_count", 1), 1)
        # Sigmoid-like scale: ratio of 3x average → ~0.75, 10x → ~0.95
        amount_ratio = edge_avg / max(global_avg, 1.0)
        amount_signal = min(amount_ratio / (amount_ratio + 3.0), 1.0)

        # 4. Velocity signal: many transactions in short time is suspicious
        tx_count = data.get("tx_count", 1)
        tx_signal = min(tx_count / 20.0, 1.0)  # 20+ txs between same pair → max

        # Blend: flag_ratio dominates, but other signals fill gradient
        score = (
            flag_ratio * 0.40
            + endpoint_risk * 0.30
            + amount_signal * 0.15
            + tx_signal * 0.15
        )
        return round(min(max(score, 0.0), 1.0), 3)

    # ── Queries ────────────────────────────────────────
    def get_all_accounts(self) -> list[str]:
        return list(self.G.nodes())

    def get_account_features(self, account_id: str) -> dict | None:
        return self._account_features.get(account_id)

    def get_subgraph(self, account_id: str, hops: int = 2) -> dict:
        """Return ego-graph around an account (nodes + edges)."""
        if account_id not in self.G:
            return {"nodes": [], "links": [], "center_account": account_id}

        ego = nx.ego_graph(self.G, account_id, radius=hops, undirected=True)
        nodes = []
        for n in ego.nodes():
            risk = self._account_features.get(n, {}).get("label_ratio", 0.0) * 100
            node_data = self.G.nodes[n]
            nodes.append({
                "id": n,
                "label": node_data.get("label", n),
                "type": node_data.get("type", "entity"),
                "risk": round(risk, 1),
            })
        links = []
        for u, v, data in ego.edges(data=True):
            score = self._edge_suspicious_score(u, v, data)
            links.append({
                "source": u,
                "target": v,
                "value": data.get("total_amount", 0),
                "is_suspicious": data.get("is_suspicious", False),
                "suspicious_score": score,
                "tx_count": data.get("tx_count", 1),
            })
        return {"nodes": nodes, "links": links, "center_account": account_id}

    def get_full_graph(self, limit: int = 500) -> dict:
        """Return the graph as nodes + links for visualization.

        When the graph has more nodes than *limit*, the highest-risk
        accounts are returned so the browser stays responsive.
        """
        all_nodes = list(self.G.nodes())
        if len(all_nodes) > limit:
            # Sort by risk (label_ratio) descending, take top-N
            scored = sorted(
                all_nodes,
                key=lambda n: self._account_features.get(n, {}).get("label_ratio", 0.0),
                reverse=True,
            )
            selected = set(scored[:limit])
        else:
            selected = set(all_nodes)

        nodes = []
        for n in selected:
            risk = self._account_features.get(n, {}).get("label_ratio", 0.0) * 100
            nd = self.G.nodes[n]
            nodes.append({
                "id": n,
                "label": nd.get("label", n),
                "type": nd.get("type", "entity"),
                "risk": round(risk, 1),
            })
        links = []
        for u, v, data in self.G.edges(data=True):
            if u in selected and v in selected:
                score = self._edge_suspicious_score(u, v, data)
                links.append({
                    "source": u,
                    "target": v,
                    "value": data.get("total_amount", 0),
                    "is_suspicious": data.get("is_suspicious", False),
                    "suspicious_score": score,
                    "tx_count": data.get("tx_count", 1),
                })
        return {
            "nodes": nodes,
            "links": links,
            "truncated": len(all_nodes) > limit,
            "total_in_graph": len(all_nodes),
        }

    def detect_circular_patterns(self, min_length: int = 3, max_length: int = 6, limit: int = 50) -> list[dict]:
        """Find circular transaction flows (A→B→C→…→A).

        *limit* caps the number of cycles returned to avoid exhaustive
        enumeration on dense graphs.
        """
        cache_key = (min_length, max_length, limit)
        cached = self._circular_cache.get(cache_key)
        if cached is not None:
            return cached

        cycles = []
        checked = 0
        max_checked = 200_000  # stop iterating after this many raw cycles
        try:
            for cycle in nx.simple_cycles(self.G, length_bound=max_length):
                checked += 1
                if checked > max_checked:
                    logger.info(f"Cycle scan capped at {max_checked} iterations, found {len(cycles)} qualifying cycles")
                    break
                if min_length <= len(cycle) <= max_length:
                    total_flow = 0
                    for i in range(len(cycle)):
                        u = cycle[i]
                        v = cycle[(i + 1) % len(cycle)]
                        if self.G.has_edge(u, v):
                            total_flow += self.G[u][v].get("total_amount", 0)
                    cycles.append({
                        "account_chain": cycle,
                        "total_flow": total_flow,
                        "cycle_length": len(cycle),
                    })
                    if len(cycles) >= limit:
                        break
        except Exception as e:
            logger.warning(f"Cycle detection error: {e}")
        self._circular_cache[cache_key] = cycles
        return cycles

    def detect_structuring(self, threshold: float = 0, window_minutes: float = 60) -> list[dict]:
        """Detect structuring: many transactions just below threshold within a time window.

        When *threshold* is 0 (default), common AML reporting thresholds are
        checked automatically (₹10K, ₹50K, ₹200K, ₹500K, ₹10L).
        """
        if self._df is None:
            return []
        df = self._df
        thresholds = (
            [threshold] if threshold > 0
            else [10_000, 50_000, 200_000, 500_000, 1_000_000]
        )
        cache_key = (float(threshold), float(window_minutes))
        cached = self._structuring_cache.get(cache_key)
        if cached is not None:
            return cached

        results = []
        seen: set[str] = set()
        for sender in df["sender_account"].unique():
            sent = df[df["sender_account"] == sender].sort_values("timestamp")
            if len(sent) < 2:
                continue
            for thresh in thresholds:
                below = sent[
                    (sent["amount"] > thresh * 0.9) & (sent["amount"] < thresh)
                ]
                if len(below) >= 2:
                    time_span = (
                        (below["timestamp"].max() - below["timestamp"].min())
                        .total_seconds() / 60
                    )
                    if time_span <= window_minutes and sender not in seen:
                        seen.add(sender)
                        results.append({
                            "sender": sender,
                            "transactions": int(len(below)),
                            "total_amount": float(below["amount"].sum()),
                            "avg_amount": float(below["amount"].mean()),
                            "time_window_minutes": round(time_span, 2),
                        })
        self._structuring_cache[cache_key] = results
        return results

    def detect_dormant_activations(self, dormant_days: int = 30) -> list[dict]:
        """Find accounts that were dormant then suddenly became active."""
        if self._df is None:
            return []
        cached = self._dormant_cache.get(dormant_days)
        if cached is not None:
            return cached

        df = self._df
        results = []
        all_accounts = set(df["sender_account"]) | set(df["receiver_account"])
        for acc in all_accounts:
            txns = df[
                (df["sender_account"] == acc) | (df["receiver_account"] == acc)
            ].sort_values("timestamp")
            if len(txns) < 2:
                continue
            gaps = txns["timestamp"].diff().dt.days.dropna()
            max_gap = gaps.max()
            if max_gap and max_gap >= dormant_days:
                gap_idx = gaps.idxmax()
                activation_row = txns.loc[gap_idx]
                results.append({
                    "account_id": acc,
                    "dormant_days": int(max_gap),
                    "activation_amount": float(activation_row["amount"]),
                    "activation_date": str(activation_row["timestamp"]),
                })
            self._dormant_cache[dormant_days] = results
            return results

    def get_stats(self) -> dict:
        """Return summary statistics about the graph."""
        total_vol = sum(
            d.get("total_amount", 0) for _, _, d in self.G.edges(data=True)
        )
        suspicious_vol = sum(
            d.get("total_amount", 0)
            for _, _, d in self.G.edges(data=True)
            if d.get("is_suspicious")
        )
        flagged = sum(
            1 for acc in self._account_features.values()
            if acc.get("label_ratio", 0) > 0.5
        )
        total_tx = sum(
            d.get("tx_count", 0) for _, _, d in self.G.edges(data=True)
        )
        high = sum(1 for a in self._account_features.values() if a.get("label_ratio", 0) > 0.7)
        medium = sum(1 for a in self._account_features.values() if 0.3 < a.get("label_ratio", 0) <= 0.7)
        low = self.G.number_of_nodes() - high - medium
        return {
            "total_accounts": self.G.number_of_nodes(),
            "total_transactions": total_tx,
            "flagged_accounts": flagged,
            "total_volume": total_vol,
            "avg_transaction": total_vol / max(total_tx, 1),
            "suspicious_volume": suspicious_vol,
            "risk_distribution": {"high": high, "medium": medium, "low": low},
        }

    # ── Optional Memgraph sync ─────────────────────────
    def connect_memgraph(self, host: str, port: int):
        """Optionally connect to Memgraph/Neo4j and sync the graph."""
        if not _MEMGRAPH_AVAILABLE:
            logger.warning("neo4j driver not installed – skipping Memgraph connection")
            return
        try:
            uri = f"bolt://{host}:{port}"
            self._neo4j_driver = GraphDatabase.driver(uri, auth=("", ""))
            with self._neo4j_driver.session() as session:
                session.run("RETURN 1")
            logger.info(f"Connected to Memgraph at {uri}")
        except Exception as e:
            logger.warning(f"Could not connect to Memgraph: {e}")
            self._neo4j_driver = None

    def sync_to_memgraph(self):
        """Push NetworkX graph data into Memgraph via Cypher."""
        if not self._neo4j_driver:
            return
        try:
            with self._neo4j_driver.session() as session:
                session.run("MATCH (n) DETACH DELETE n")
                for node_id, data in self.G.nodes(data=True):
                    session.run(
                        "CREATE (a:Account {id: $id, type: $type, label: $label})",
                        id=node_id,
                        type=data.get("type", "entity"),
                        label=data.get("label", node_id),
                    )
                for u, v, data in self.G.edges(data=True):
                    session.run(
                        """
                        MATCH (a:Account {id: $sender}), (b:Account {id: $receiver})
                        CREATE (a)-[:TRANSFER {amount: $amount, tx_count: $count}]->(b)
                        """,
                        sender=u,
                        receiver=v,
                        amount=data.get("total_amount", 0),
                        count=data.get("tx_count", 0),
                    )
            logger.info("Graph synced to Memgraph")
        except Exception as e:
            logger.error(f"Memgraph sync failed: {e}")

    def get_dataframe(self) -> pd.DataFrame | None:
        return self._df

    @property
    def account_features(self) -> dict[str, dict]:
        return self._account_features
