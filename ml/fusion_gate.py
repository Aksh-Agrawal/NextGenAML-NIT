"""
Adaptive Fusion Gate – learns per-account fusion weights for the risk engine.

Replaces the fixed static ensemble weights (0.5 / 0.3 / 0.2) with a small network
that maps [ml_score, pattern_score, anomaly_score, out_degree, tx_count] onto
[W_ml, W_pattern, W_anomaly]. A softmax guarantees the weights sum to 1.

Two implementations share the same interface:
  - FusionGate        : PyTorch MLP (used when torch is available)
  - SklearnFusionGate : gradient-boosted fallback (works without torch)

Checkpoint layout in ml/checkpoints/:
  fusion_gate_meta.json  -> {"model_format": "torch"|"sklearn", "out_deg_max", "tx_count_max"}
  fusion_gate.pt         -> torch state_dict (torch format)
  fusion_gate.pkl        -> pickled SklearnFusionGate (sklearn format)
"""

from __future__ import annotations
import json
import pickle
from pathlib import Path
import numpy as np
from loguru import logger

# ── Optional torch ────────────────────────────────────
_TORCH = False
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    _TORCH = True
except ImportError:
    pass

CHECKPOINT_DIR = Path(__file__).resolve().parent / "checkpoints"
META_FILE = "fusion_gate_meta.json"


# ── PyTorch gate ──────────────────────────────────────
if _TORCH:
    class FusionGate(nn.Module):
        """MLP gate: 5 features -> softmax weights over the 3 risk signals."""

        def __init__(self, in_features: int = 5, hidden: int = 16, num_signals: int = 3):
            super().__init__()
            self.fc1 = nn.Linear(in_features, hidden)
            self.fc2 = nn.Linear(hidden, num_signals)
            self.softmax = nn.Softmax(dim=1)

        def forward(self, x):
            """Return (weights, raw_logits). weights rows sum to 1."""
            h = F.relu(self.fc1(x))
            raw = self.fc2(h)
            weights = self.softmax(raw)
            return weights, raw

        def predict_weights(self, X) -> "object":
            """X: (n,5) array -> (n,3) weight array. Weights sum to 1 per row."""
            x = torch.tensor(X, dtype=torch.float32)
            with torch.no_grad():
                w, _ = self(x)
            return w.numpy()
else:
    FusionGate = None  # type: ignore


# ── Sklearn fallback gate ─────────────────────────────
class SklearnFusionGate:
    """Gradient-boosted gate that predicts fusion weights directly.

    Training target per account: softmax over how close each raw signal sits to the
    label (signal closest to y=1 gets the most weight for fraud, closest to y=0 for
    non-fraud), giving smooth, fractional weights that sum to 1. This mirrors the
    BCE-trained PyTorch gate without requiring torch.
    """

    def __init__(self, temperature: float = 0.25):
        from sklearn.ensemble import GradientBoostingRegressor
        from sklearn.multioutput import MultiOutputRegressor
        self.temperature = temperature
        self.model = MultiOutputRegressor(
            GradientBoostingRegressor(
                n_estimators=150, max_depth=3, learning_rate=0.1, random_state=42
            )
        )
        self._fitted = False

    def _soft_targets(self, y, signals) -> "object":
        # y: (n,), signals: (n,3) -> soft weight targets (n,3) summing to 1
        dist = np.abs(signals - y[:, None])
        exp = np.exp(-dist / max(float(self.temperature), 1e-3))
        return exp / exp.sum(axis=1, keepdims=True)

    def fit(self, X, y, signals):
        """X: (n,5), y: (n,) binary, signals: (n,3) raw signal scores."""
        targets = self._soft_targets(y, signals)
        self.model.fit(X, targets)
        self._fitted = True

    def predict_weights(self, X) -> "object":
        """X: (n,5) array -> (n,3) weight array. Weights sum to 1 per row."""
        if not self._fitted:
            return np.tile(np.array([0.5, 0.3, 0.2]), (len(X), 1))
        w = self.model.predict(X)
        s = w.sum(axis=1, keepdims=True)
        s[s <= 0] = 1.0
        return w / s


def build_input_matrix(signals: "object", out_deg: "object", tx_count: "object",
                       out_deg_max: float, tx_count_max: float) -> "object":
    """Stack [ml, pattern, anomaly, out_deg_norm, tx_count_norm] for the gate."""
    out_n = np.asarray(out_deg, dtype=np.float64) / max(float(out_deg_max), 1.0)
    tx_n = np.asarray(tx_count, dtype=np.float64) / max(float(tx_count_max), 1.0)
    return np.column_stack([signals, out_n, tx_n])


def save_fusion_gate(gate, meta: dict, dir_path=CHECKPOINT_DIR) -> Path:
    """Persist a trained gate (torch or sklearn) + normalization metadata."""
    dir_path = Path(dir_path)
    dir_path.mkdir(parents=True, exist_ok=True)

    fmt = meta.get("model_format", "sklearn")
    if fmt == "torch":
        if not _TORCH:
            raise RuntimeError("Cannot save torch gate: torch is not available")
        torch.save(gate.state_dict(), dir_path / "fusion_gate.pt")
    else:
        with open(dir_path / "fusion_gate.pkl", "wb") as f:
            pickle.dump(gate, f)

    meta.setdefault("version", 1)
    with open(dir_path / META_FILE, "w") as f:
        json.dump(meta, f, indent=2)
    return dir_path / "fusion_gate.pt" if fmt == "torch" else dir_path / "fusion_gate.pkl"


def load_fusion_gate(dir_path=CHECKPOINT_DIR):
    """Load a trained fusion gate. Returns (gate, meta) or (None, {})."""
    dir_path = Path(dir_path)
    meta_path = dir_path / META_FILE
    if not meta_path.exists():
        return None, {}

    with open(meta_path) as f:
        meta = json.load(f)

    fmt = meta.get("model_format", "sklearn")
    if fmt == "torch":
        if not _TORCH:
            logger.warning("Checkpoint is torch format but torch is unavailable")
            return None, meta
        gate = FusionGate()
        gate.load_state_dict(torch.load(dir_path / "fusion_gate.pt", map_location="cpu", weights_only=True))
        gate.eval()
        return gate, meta

    with open(dir_path / "fusion_gate.pkl", "rb") as f:
        gate = pickle.load(f)
    return gate, meta
