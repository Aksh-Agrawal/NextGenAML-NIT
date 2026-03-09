"""
GNN model definitions.
- AMLGraphSAGE: lightweight model using PyTorch Geometric (when available)
- FallbackClassifier: sklearn-based fallback that works on any machine
"""

from __future__ import annotations
import numpy as np
from loguru import logger

# ── Try importing PyTorch + PyG ────────────────────────
_TORCH_AVAILABLE = False
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    _TORCH_AVAILABLE = True
except ImportError:
    pass

_PYG_AVAILABLE = False
try:
    from torch_geometric.nn import SAGEConv
    from torch_geometric.data import Data
    _PYG_AVAILABLE = True
except ImportError:
    pass


# ── PyTorch Geometric model ───────────────────────────
if _TORCH_AVAILABLE and _PYG_AVAILABLE:
    class AMLGraphSAGE(nn.Module):
        """3-layer GraphSAGE for node-level fraud classification."""

        def __init__(self, in_channels: int = 8, hidden: int = 32, out_channels: int = 2):
            super().__init__()
            self.conv1 = SAGEConv(in_channels, hidden)
            self.conv2 = SAGEConv(hidden, hidden)
            self.conv3 = SAGEConv(hidden, out_channels)
            self.dropout = nn.Dropout(0.3)

        def forward(self, data: Data):
            x, edge_index = data.x, data.edge_index
            x = self.conv1(x, edge_index)
            x = F.relu(x)
            x = self.dropout(x)
            x = self.conv2(x, edge_index)
            x = F.relu(x)
            x = self.dropout(x)
            x = self.conv3(x, edge_index)
            return F.log_softmax(x, dim=1)

    class LineMVGNN(nn.Module):
        """Simplified Line-graph Multi-View GNN for edge-level classification."""

        def __init__(self, in_channels: int = 8, hidden: int = 32, out_channels: int = 2):
            super().__init__()
            self.conv1 = SAGEConv(in_channels, hidden)
            self.conv2 = SAGEConv(hidden, hidden)
            self.bn1 = nn.BatchNorm1d(hidden)
            self.bn2 = nn.BatchNorm1d(hidden)
            self.lin1 = nn.Linear(hidden * 2, hidden)
            self.lin2 = nn.Linear(hidden, out_channels)
            self.dropout = nn.Dropout(0.3)

        def forward(self, data: Data):
            x, edge_index = data.x, data.edge_index
            x = self.conv1(x, edge_index)
            x = self.bn1(x)
            x = F.relu(x)
            x = self.dropout(x)
            x = self.conv2(x, edge_index)
            x = self.bn2(x)
            x = F.relu(x)
            # Edge-level: concat source + target node embeddings
            src_emb = x[edge_index[0]]
            tgt_emb = x[edge_index[1]]
            edge_emb = torch.cat([src_emb, tgt_emb], dim=1)
            edge_emb = F.relu(self.lin1(edge_emb))
            edge_emb = self.dropout(edge_emb)
            return F.log_softmax(self.lin2(edge_emb), dim=1)


# ── Sklearn Fallback ──────────────────────────────────
class FallbackClassifier:
    """Gradient-boosted tree classifier as fallback when PyTorch is unavailable."""

    def __init__(self):
        from sklearn.ensemble import GradientBoostingClassifier
        self.model = GradientBoostingClassifier(
            n_estimators=100, max_depth=4, random_state=42
        )
        self._fitted = False

    def fit(self, X: np.ndarray, y: np.ndarray):
        self.model.fit(X, y)
        self._fitted = True

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if not self._fitted:
            # Return random-ish probabilities if not trained
            rng = np.random.default_rng(42)
            probs = rng.uniform(0, 0.3, size=(X.shape[0], 2))
            probs[:, 0] = 1 - probs[:, 1]
            return probs
        return self.model.predict_proba(X)

    @property
    def is_fitted(self):
        return self._fitted


def get_model_class(model_type: str = "graphsage"):
    """Return the appropriate model class based on availability."""
    if _TORCH_AVAILABLE and _PYG_AVAILABLE:
        if model_type == "line_mvgnn":
            return LineMVGNN
        return AMLGraphSAGE
    logger.warning("PyTorch/PyG not available – using FallbackClassifier")
    return FallbackClassifier


def torch_available() -> bool:
    return _TORCH_AVAILABLE


def pyg_available() -> bool:
    return _PYG_AVAILABLE
