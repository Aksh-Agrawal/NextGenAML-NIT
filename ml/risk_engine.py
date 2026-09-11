"""
Risk scoring engine – combines ML predictions, graph pattern detection,
and statistical anomaly signals into a final risk score.
"""

from __future__ import annotations
import os
import numpy as np
from loguru import logger
from graph_db.manager import GraphManager
from ml.inference import InferenceEngine
from ml.fusion_gate import CHECKPOINT_DIR, load_fusion_gate


class RiskEngine:
    """
    Final risk score = w_ml * ml_score + w_pattern * pattern_score + w_anomaly * anomaly_score

    Where:
        ml_score      = GNN/classifier fraud probability
        pattern_score = 1 if account appears in any detected pattern, 0 otherwise
        anomaly_score = statistical anomaly (velocity, amount outlier, etc.)

    Fusion step:
        USE_ADAPTIVE_FUSION=True (default) + checkpoint present:
            per-account weights from the learned FusionGate
        otherwise: static weights W_ML / W_PATTERN / W_ANOMALY (0.5/0.3/0.2)
    """

    W_ML = 0.5
    W_PATTERN = 0.3
    W_ANOMALY = 0.2

    # Adaptive fusion toggle: env var USE_ADAPTIVE_FUSION in {"1","true","yes","on"}
    USE_ADAPTIVE_FUSION = os.getenv("USE_ADAPTIVE_FUSION", "true").strip().lower() in (
        "1", "true", "yes", "on",
    )

    def __init__(self, graph_manager: GraphManager, inference: InferenceEngine):
        self.gm = graph_manager
        self.inference = inference
        self._pattern_accounts: set[str] = set()
        self._account_pattern_type: dict[str, str] = {}
        self._patterns_computed = False
        self._all_scores_cache: list[dict] | None = None
        self.fusion_gate = None
        self._fusion_meta: dict = {}
        self._load_fusion_gate()

    # ── Incremental scoring (live simulator path) ───────
    def invalidate(self) -> None:
        """Drop cached scores + pattern state; next full scoring recomputes."""
        self._all_scores_cache = None
        self._patterns_computed = False

    def rescore(self, accounts: list[str]) -> dict[str, dict]:
        """Recompute risk for *only* the given accounts (no full rebuild).

        Pattern membership is refreshed incrementally for each account using
        cheap targeted checks instead of re-scanning the whole graph.
        Returns {account_id: score_dict}.
        """
        accounts = list(dict.fromkeys(accounts))
        for acc in accounts:
            self._refresh_pattern_membership(acc)
        self._patterns_computed = True
        self._all_scores_cache = None
        return {acc: self.score_account(acc) for acc in accounts}

    def _refresh_pattern_membership(self, account_id: str) -> None:
        """Update pattern flags for a single account without a full scan."""
        self._pattern_accounts.discard(account_id)
        self._account_pattern_type.pop(account_id, None)
        try:
            if self.gm._in_small_cycle(account_id):
                self._pattern_accounts.add(account_id)
                self._account_pattern_type[account_id] = "Circular Flow"
                return
            if self.gm._sender_structuring(account_id):
                self._pattern_accounts.add(account_id)
                self._account_pattern_type[account_id] = "Structuring"
                return
            if self.gm._is_dormant_activation(account_id):
                self._pattern_accounts.add(account_id)
                self._account_pattern_type[account_id] = "Dormant Activation"
        except Exception as e:
            logger.warning(f"Pattern refresh failed for {account_id}: {e}")

    def _load_fusion_gate(self):
        """Load the learned fusion gate if adaptive fusion is enabled."""
        if not self.USE_ADAPTIVE_FUSION:
            logger.info("Adaptive fusion disabled (USE_ADAPTIVE_FUSION=false) - using static 0.5/0.3/0.2")
            return
        gate, meta = load_fusion_gate(CHECKPOINT_DIR)
        if gate is None:
            logger.warning(
                f"Adaptive fusion enabled but no checkpoint in {CHECKPOINT_DIR} - "
                "falling back to static 0.5/0.3/0.2"
            )
            return
        self.fusion_gate = gate
        self._fusion_meta = meta or {}
        logger.info(f"Adaptive fusion gate loaded ({meta.get('model_format', 'unknown')})")

    def compute_patterns(self):
        """Pre-compute pattern detection results."""
        self._account_pattern_type: dict[str, str] = {}
        self._pattern_accounts = set()
        self._patterns_computed = False

        cycles = self.gm.detect_circular_patterns()
        for c in cycles:
            for acc in c["account_chain"]:
                self._pattern_accounts.add(acc)
                if acc not in self._account_pattern_type:
                    self._account_pattern_type[acc] = "Circular Flow"

        structuring = self.gm.detect_structuring()
        for s in structuring:
            self._pattern_accounts.add(s["sender"])
            if s["sender"] not in self._account_pattern_type:
                self._account_pattern_type[s["sender"]] = "Structuring"

        dormant = self.gm.detect_dormant_activations()
        for d in dormant:
            self._pattern_accounts.add(d["account_id"])
            if d["account_id"] not in self._account_pattern_type:
                self._account_pattern_type[d["account_id"]] = "Dormant Activation"

        self._patterns_computed = True
        self._all_scores_cache = None

    def refresh_scores(self) -> list[dict]:
        """Compute and cache the current score list once."""
        self._all_scores_cache = [self.score_account(acc) for acc in self.gm.get_all_accounts()]
        return self._all_scores_cache

    def score_account(self, account_id: str) -> dict:
        """Compute final risk score for an account."""
        if not self._patterns_computed:
            self.compute_patterns()

        # ML score
        prediction = self.inference.predict(account_id)
        ml_score = prediction["fraud_probability"]

        # Pattern score
        pattern_score = 1.0 if account_id in self._pattern_accounts else 0.0

        # Anomaly score
        anomaly_score = self._compute_anomaly(account_id)

        feat = self.gm.get_account_features(account_id) or {}
        volume = feat.get("total_sent", 0) + feat.get("total_received", 0)

        # ── Fusion step (static or adaptive) ───────────
        if self.fusion_gate is not None:
            w = self._fusion_weights(ml_score, pattern_score, anomaly_score, feat)
            fusion_score = (
                w[0] * ml_score
                + w[1] * pattern_score
                + w[2] * anomaly_score
            )
            fusion_weights = {
                "ml": round(float(w[0]), 4),
                "pattern": round(float(w[1]), 4),
                "anomaly": round(float(w[2]), 4),
            }
        else:
            fusion_score = (
                self.W_ML * ml_score
                + self.W_PATTERN * pattern_score
                + self.W_ANOMALY * anomaly_score
            )
            fusion_weights = {
                "ml": self.W_ML,
                "pattern": self.W_PATTERN,
                "anomaly": self.W_ANOMALY,
            }

        # The overall fraud probability should logically reflect the risk factors smoothly.
        # Since the ML score is often low, static weights max out below 50% even with 
        # strong patterns. We use an additive evidence model that builds upon the ML base.
        static_score = (
            self.W_ML * ml_score
            + self.W_PATTERN * pattern_score
            + self.W_ANOMALY * anomaly_score
        )
        
        # Additive penalty model: ML score is the base.
        # Pattern detection (e.g. structuring, circular) adds up to 50%.
        # Statistical anomaly (velocity, volume) adds up to 40%.
        additive_score = ml_score + (pattern_score * 0.50) + (anomaly_score * 0.40)
        
        final_score = max(fusion_score, static_score, additive_score)
        final_score = min(0.99, max(0.0, final_score))

        # Determine pattern type
        pattern = self._get_pattern_type(account_id)

        # Status
        if final_score > 0.75:
            status = "Critical"
        elif final_score > 0.5:
            status = "Flagged"
        elif final_score > 0.3:
            status = "Under Review"
        else:
            status = "Verified"

        return {
            "account_id": account_id,
            "risk_score": round(final_score * 100, 1),
            "ml_score": round(ml_score, 4),
            "pattern_score": round(pattern_score, 4),
            "anomaly_score": round(anomaly_score, 4),
            "pattern_detected": pattern,
            "status": status,
            "volume_30d": volume,
            "transaction_count": feat.get("tx_count", 0),
            "fusion_weights": fusion_weights,
        }

    def _fusion_weights(self, ml_score, pattern_score, anomaly_score, feat) -> np.ndarray:
        """Run the learned gate to get [w_ml, w_pattern, w_anomaly] for one account."""
        out_deg_max = float(self._fusion_meta.get("out_deg_max", 1) or 1)
        tx_count_max = float(self._fusion_meta.get("tx_count_max", 1) or 1)
        out_deg = float(feat.get("out_degree", 0))
        tx_count = float(feat.get("tx_count", 0))
        x = np.array(
            [[
                ml_score,
                pattern_score,
                anomaly_score,
                min(out_deg / out_deg_max, 1.0),
                min(tx_count / tx_count_max, 1.0),
            ]],
            dtype=np.float64,
        )
        try:
            w = self.fusion_gate.predict_weights(x)[0]
        except Exception as e:
            logger.warning(f"Fusion gate inference failed ({e}) - using static weights")
            return np.array([self.W_ML, self.W_PATTERN, self.W_ANOMALY])
        w = np.clip(w, 0.0, 1.0)
        s = float(w.sum())
        if s <= 0:
            return np.array([self.W_ML, self.W_PATTERN, self.W_ANOMALY])
        return w / s

    def score_all(self) -> list[dict]:
        """Score every account in the graph."""
        if self._all_scores_cache is None:
            return self.refresh_scores()
        return self._all_scores_cache

    def _compute_anomaly(self, account_id: str) -> float:
        """Heuristic anomaly score based on velocity and amount stats."""
        feat = self.gm.get_account_features(account_id)
        if not feat:
            return 0.0

        score = 0.0
        # Rapid velocity (< 5 minutes between transactions)
        if feat.get("min_velocity_sec", 999999) < 300:
            score += 0.4
        elif feat.get("avg_velocity_sec", 999999) < 600:
            score += 0.2

        # High volume
        total = feat.get("total_sent", 0) + feat.get("total_received", 0)
        if total > 5_000_000:
            score += 0.3
        elif total > 1_000_000:
            score += 0.15

        # High out-degree (many receivers)
        if feat.get("out_degree", 0) > 5:
            score += 0.2

        # Off-hours transactions
        sin_t = feat.get("sin_time", 0)
        if abs(sin_t) > 0.9:  # late night / early morning
            score += 0.1

        return min(1.0, score)

    def _get_pattern_type(self, account_id: str) -> str:
        """Determine the primary pattern associated with an account."""
        if not self._patterns_computed:
            self.compute_patterns()

        cached = self._account_pattern_type.get(account_id)
        if cached:
            return cached

        feat = self.gm.get_account_features(account_id)
        if feat:
            if feat.get("out_degree", 0) > 5:
                return "Rapid Movement"
            if feat.get("label_ratio", 0) > 0.5:
                return "Abnormal Transfer"

        return "Normal"
