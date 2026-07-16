"""
Risk scoring engine – combines ML predictions, graph pattern detection,
and statistical anomaly signals into a final risk score.
"""

from __future__ import annotations
import numpy as np
from graph_db.manager import GraphManager
from ml.inference import InferenceEngine


class RiskEngine:
    """
    Final risk score = w_ml * ml_score + w_pattern * pattern_score + w_anomaly * anomaly_score

    Where:
        ml_score      = GNN/classifier fraud probability
        pattern_score = 1 if account appears in any detected pattern, 0 otherwise
        anomaly_score = statistical anomaly (velocity, amount outlier, etc.)
    """

    W_ML = 0.5
    W_PATTERN = 0.3
    W_ANOMALY = 0.2

    def __init__(self, graph_manager: GraphManager, inference: InferenceEngine):
        self.gm = graph_manager
        self.inference = inference
        self._pattern_accounts: set[str] = set()
        self._patterns_computed = False
        self._all_scores_cache: list[dict] | None = None

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

        # Weighted combination
        final_score = (
            self.W_ML * ml_score
            + self.W_PATTERN * pattern_score
            + self.W_ANOMALY * anomaly_score
        )
        final_score = min(1.0, max(0.0, final_score))

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

        feat = self.gm.get_account_features(account_id) or {}
        volume = feat.get("total_sent", 0) + feat.get("total_received", 0)

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
        }

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
