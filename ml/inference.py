"""
Inference engine – wraps the ML model and graph to produce risk predictions.
Works with either PyG GNN or sklearn fallback.
"""

from __future__ import annotations
import numpy as np
import pickle
from pathlib import Path
from loguru import logger
from graph_db.manager import GraphManager
from ml.model import (
    torch_available,
    pyg_available,
    FallbackClassifier,
    get_model_class,
)

# Optional torch imports
_TORCH = False
try:
    import torch
    from torch_geometric.data import Data
    _TORCH = True
except ImportError:
    pass

FEATURE_KEYS = [
    "log_amount",
    "total_sent",
    "total_received",
    "avg_velocity_sec",
    "sin_time",
    "cos_time",
    "in_degree",
    "out_degree",
]


class InferenceEngine:
    """Produces fraud predictions for accounts using the loaded model."""

    def __init__(self, graph_manager: GraphManager, model_type: str = "graphsage"):
        self.gm = graph_manager
        self.model_type = model_type
        self._model = None
        self._pyg_data = None
        self._account_index: dict[str, int] = {}
        self._model_loaded = False

    def build_features(self) -> np.ndarray:
        """Build feature matrix from graph manager's account features."""
        accounts = self.gm.get_all_accounts()
        self._account_index = {acc: i for i, acc in enumerate(accounts)}
        X = np.zeros((len(accounts), len(FEATURE_KEYS)))
        for acc in accounts:
            feat = self.gm.get_account_features(acc)
            if feat:
                idx = self._account_index[acc]
                for j, key in enumerate(FEATURE_KEYS):
                    X[idx, j] = feat.get(key, 0.0)
        # Normalize
        means = X.mean(axis=0)
        stds = X.std(axis=0)
        stds[stds == 0] = 1
        X = (X - means) / stds
        return X

    def build_labels(self) -> np.ndarray:
        """Build label array from graph features."""
        accounts = self.gm.get_all_accounts()
        y = np.zeros(len(accounts), dtype=np.int64)
        for acc in accounts:
            feat = self.gm.get_account_features(acc)
            if feat and feat.get("label_ratio", 0) > 0.5:
                y[self._account_index[acc]] = 1
        return y

    def initialize(self):
        """Initialize the model – train on available data."""
        X = self.build_features()
        y = self.build_labels()

        if _TORCH and pyg_available():
            self._init_pyg(X, y)
        else:
            self._init_fallback(X, y)

        self._model_loaded = True
        logger.info(f"Inference engine initialized (model={self.model_type}, torch={_TORCH})")

    def _init_pyg(self, X: np.ndarray, y: np.ndarray):
        """Initialize PyTorch Geometric model and train briefly."""
        import torch
        import torch.nn.functional as F
        from torch_geometric.data import Data

        accounts = self.gm.get_all_accounts()
        edges = []
        for u, v in self.gm.G.edges():
            if u in self._account_index and v in self._account_index:
                edges.append([self._account_index[u], self._account_index[v]])
        if not edges:
            self._init_fallback(X, y)
            return

        edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous()
        x_tensor = torch.tensor(X, dtype=torch.float32)
        y_tensor = torch.tensor(y, dtype=torch.long)

        self._pyg_data = Data(x=x_tensor, edge_index=edge_index, y=y_tensor)

        ModelClass = get_model_class(self.model_type)
        self._model = ModelClass(in_channels=X.shape[1])

        # Quick training loop
        optimizer = torch.optim.Adam(self._model.parameters(), lr=0.01, weight_decay=5e-4)
        self._model.train()
        for epoch in range(50):
            optimizer.zero_grad()
            out = self._model(self._pyg_data)
            if out.shape[0] == len(y):
                loss = F.nll_loss(out, y_tensor)
            else:
                # Edge-level model
                edge_labels = []
                for u, v in self.gm.G.edges():
                    ui = self._account_index.get(u)
                    vi = self._account_index.get(v)
                    if ui is not None and vi is not None:
                        label = 1 if y[ui] == 1 or y[vi] == 1 else 0
                        edge_labels.append(label)
                edge_y = torch.tensor(edge_labels, dtype=torch.long)
                loss = F.nll_loss(out[: len(edge_y)], edge_y)
            loss.backward()
            optimizer.step()

        self._model.eval()
        logger.info(f"PyG model trained for 50 epochs, final loss: {loss.item():.4f}")

    def _init_fallback(self, X: np.ndarray, y: np.ndarray):
        """Initialize sklearn fallback model."""
        self._model = FallbackClassifier()
        if y.sum() > 0:
            self._model.fit(X, y)
            logger.info("Fallback sklearn model trained")
        else:
            logger.warning("No positive labels found – model untrained, using heuristic scoring")

    def predict(self, account_id: str) -> dict:
        """Predict fraud probability for a single account."""
        if account_id not in self._account_index:
            return {
                "account_id": account_id,
                "fraud_probability": 0.0,
                "risk_level": "low",
                "confidence": 0.0,
                "attention_weights": [],
            }

        idx = self._account_index[account_id]
        prob = self._get_ml_probability(idx)

        # Combine with heuristic
        feat = self.gm.get_account_features(account_id) or {}
        heuristic = feat.get("label_ratio", 0.0)
        combined = 0.6 * prob + 0.4 * heuristic

        risk_level = "low"
        if combined > 0.75:
            risk_level = "critical"
        elif combined > 0.5:
            risk_level = "high"
        elif combined > 0.3:
            risk_level = "medium"

        return {
            "account_id": account_id,
            "fraud_probability": round(float(combined), 4),
            "risk_level": risk_level,
            "confidence": round(min(0.95, 0.5 + abs(combined - 0.5)), 4),
            "attention_weights": [round(float(combined), 2)] * 3,
        }

    def predict_batch(self, account_ids: list[str]) -> list[dict]:
        return [self.predict(acc) for acc in account_ids]

    def _get_ml_probability(self, idx: int) -> float:
        """Get raw ML probability for a node index."""
        if isinstance(self._model, FallbackClassifier):
            X = self.build_features()
            probs = self._model.predict_proba(X[idx : idx + 1])
            return float(probs[0, 1])
        elif _TORCH and self._pyg_data is not None:
            with torch.no_grad():
                out = self._model(self._pyg_data)
                if out.shape[0] == self._pyg_data.x.shape[0]:
                    probs = torch.exp(out)
                    return float(probs[idx, 1].item())
                else:
                    # Edge-level model – average edges involving this node
                    edge_index = self._pyg_data.edge_index
                    mask = (edge_index[0] == idx) | (edge_index[1] == idx)
                    if mask.any():
                        probs = torch.exp(out[mask])
                        return float(probs[:, 1].mean().item())
        return 0.0

    def save_model(self, path: Path):
        """Save model weights."""
        path.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(self._model, FallbackClassifier):
            with open(path, "wb") as f:
                pickle.dump(self._model, f)
        elif _TORCH:
            torch.save(self._model.state_dict(), path)
        logger.info(f"Model saved to {path}")

    def load_model(self, path: Path) -> bool:
        """Load model weights if file exists."""
        if not path.exists():
            return False
        try:
            if path.suffix == ".pkl":
                with open(path, "rb") as f:
                    self._model = pickle.load(f)
                self._model_loaded = True
                return True
            elif _TORCH:
                X = self.build_features()
                ModelClass = get_model_class(self.model_type)
                self._model = ModelClass(in_channels=X.shape[1])
                self._model.load_state_dict(torch.load(path, weights_only=True))
                self._model.eval()
                self._model_loaded = True
                return True
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
        return False

    @property
    def is_loaded(self) -> bool:
        return self._model_loaded
