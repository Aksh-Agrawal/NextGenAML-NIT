"""
Train the Adaptive Fusion Gate.

Usage:
    python -m ml.train_fusion_gate --csv_path data/uploaded_transactions.csv
    python -m ml.train_fusion_gate --epochs 200 --test-size 0.2 --threshold 0.5

Trains a small gate on [ml, pattern, anomaly, out_degree, tx_count] -> 3 fusion
weights (softmax, sum to 1), using binary cross-entropy between the gated score
and the binary fraud label (label_ratio > 0.5, matching the GraphSAGE convention).

Prints a held-out before/after ablation:
    static fusion (0.5/0.3/0.2) vs adaptive fusion (learned weights).

Checkpoint is written to ml/checkpoints/:
    fusion_gate.pt            (PyTorch state_dict, when torch is available)
    fusion_gate.pkl           (sklearn fallback, otherwise)
    fusion_gate_meta.json     (model format + normalization stats)
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
from loguru import logger
from sklearn.model_selection import train_test_split

from api.config import settings
from graph_db.manager import GraphManager
from ml.inference import InferenceEngine
from ml.risk_engine import RiskEngine
from ml.fusion_gate import (
    FusionGate,
    SklearnFusionGate,
    build_input_matrix,
    save_fusion_gate,
    _TORCH,
)


def compute_dataset(gm, inference, risk_engine):
    """Compute per-account signals, side features, and binary labels."""
    accounts = gm.get_all_accounts()
    signals = np.zeros((len(accounts), 3))
    out_deg = np.zeros(len(accounts))
    tx_count = np.zeros(len(accounts))
    y = np.zeros(len(accounts), dtype=np.float64)

    for i, acc in enumerate(accounts):
        score = risk_engine.score_account(acc)  # exposes raw signal components
        feat = gm.get_account_features(acc) or {}
        signals[i] = [score["ml_score"], score["pattern_score"], score["anomaly_score"]]
        out_deg[i] = feat.get("out_degree", 0)
        tx_count[i] = feat.get("tx_count", 0)
        y[i] = 1.0 if feat.get("label_ratio", 0.0) > 0.5 else 0.0
    return accounts, signals, out_deg, tx_count, y


def metrics(y_true, scores, threshold=0.5):
    """Precision / Recall / F1 at a given threshold."""
    preds = (scores >= threshold).astype(int)
    tp = int(((preds == 1) & (y_true == 1)).sum())
    fp = int(((preds == 1) & (y_true == 0)).sum())
    fn = int(((preds == 0) & (y_true == 1)).sum())
    prec = tp / max(tp + fp, 1)
    rec = tp / max(tp + fn, 1)
    f1 = 2 * prec * rec / max(prec + rec, 1e-9)
    return round(prec, 4), round(rec, 4), round(f1, 4)


def main():
    parser = argparse.ArgumentParser(description="Train the adaptive fusion gate")
    parser.add_argument("--csv_path", type=str, default=str(settings.TRANSACTION_CSV))
    parser.add_argument("--epochs", type=int, default=200)
    parser.add_argument("--lr", type=float, default=0.01)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--threshold", type=float, default=0.5)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output-dir", type=str, default=str(Path(__file__).resolve().parent / "checkpoints"))
    args = parser.parse_args()

    # ── Load graph + engines ──────────────────────────
    csv_path = Path(args.csv_path)
    if not csv_path.exists():
        logger.error(f"CSV not found: {csv_path}")
        sys.exit(1)

    gm = GraphManager()
    gm.load_from_csv(str(csv_path))
    inference = InferenceEngine(gm, model_type=settings.GNN_MODEL_TYPE)
    inference.initialize()

    # Force static fusion for dataset collection so signals are checkpoint-agnostic
    risk_engine = RiskEngine(gm, inference)
    risk_engine.USE_ADAPTIVE_FUSION = False
    risk_engine.fusion_gate = None

    logger.info("Computing per-account signals ...")
    accounts, signals, out_deg, tx_count, y = compute_dataset(gm, inference, risk_engine)

    out_deg_max = float(out_deg.max()) if out_deg.max() > 0 else 1.0
    tx_count_max = float(tx_count.max()) if tx_count.max() > 0 else 1.0
    X = build_input_matrix(signals, out_deg, tx_count, out_deg_max, tx_count_max)

    logger.info(
        f"Dataset: {len(accounts)} accounts, {int(y.sum())} positive, "
        f"out_deg_max={out_deg_max:.0f}, tx_count_max={tx_count_max:.0f}"
    )

    # ── Train / test split (stratified, held-out) ─────
    X_tr, X_te, sig_tr, sig_te, y_tr, y_te = train_test_split(
        X, signals, y, test_size=args.test_size, random_state=args.seed, stratify=y
    )

    # ── Train gate ────────────────────────────────────
    if _TORCH:
        import torch
        import torch.nn.functional as F

        gate = FusionGate(in_features=X.shape[1])
        xt = torch.tensor(X_tr, dtype=torch.float32)
        sig_t = torch.tensor(sig_tr, dtype=torch.float32)
        yt = torch.tensor(y_tr, dtype=torch.float32)
        optimizer = torch.optim.Adam(gate.parameters(), lr=args.lr, weight_decay=1e-4)
        gate.train()
        for epoch in range(args.epochs):
            optimizer.zero_grad()
            w, _ = gate(xt)
            score = (w * sig_t).sum(dim=1)
            loss = F.binary_cross_entropy(score, yt)
            loss.backward()
            optimizer.step()
        gate.eval()
        fmt = "torch"
        logger.info(f"Trained PyTorch FusionGate, {args.epochs} epochs, final loss: {loss.item():.4f}")
    else:
        gate = SklearnFusionGate()
        gate.fit(X_tr, y_tr, sig_tr)
        fmt = "sklearn"
        logger.info("Trained sklearn FusionGate fallback (PyTorch not available)")

    # ── Ablation: static vs adaptive on held-out test ─
    static_scores = 0.5 * sig_te[:, 0] + 0.3 * sig_te[:, 1] + 0.2 * sig_te[:, 2]
    weights = gate.predict_weights(X_te)
    adaptive_scores = (weights * sig_te).sum(axis=1)

    p_s, r_s, f_s = metrics(y_te, static_scores, args.threshold)
    p_a, r_a, f_a = metrics(y_te, adaptive_scores, args.threshold)

    logger.info("=" * 58)
    logger.info("FUSION ABLATION (held-out test, threshold=%.2f)" % args.threshold)
    logger.info("=" * 58)
    logger.info(f"  {'':<22}{'Precision':>10}{'Recall':>10}{'F1':>10}")
    logger.info(f"  {'Static  (0.5/0.3/0.2)':<22}{p_s:>10}{r_s:>10}{f_s:>10}")
    logger.info(f"  {'Adaptive (learned gate)':<22}{p_a:>10}{r_a:>10}{f_a:>10}")
    logger.info(f"  {'F1 delta':<22}{'':>10}{'':>10}{f_a - f_s:>+10.4f}")
    logger.info("=" * 58)

    # Per-account weight stats for explainability
    mean_w = weights.mean(axis=0)
    logger.info(
        "Mean learned weights -> ml: %.3f, pattern: %.3f, anomaly: %.3f"
        % (mean_w[0], mean_w[1], mean_w[2])
    )

    # ── Save checkpoint ───────────────────────────────
    meta = {
        "model_format": fmt,
        "out_deg_max": out_deg_max,
        "tx_count_max": tx_count_max,
        "threshold": args.threshold,
        "static_weights": {"ml": 0.5, "pattern": 0.3, "anomaly": 0.2},
        "ablation": {
            "static": {"precision": p_s, "recall": r_s, "f1": f_s},
            "adaptive": {"precision": p_a, "recall": r_a, "f1": f_a},
        },
    }
    out_path = save_fusion_gate(gate, meta, args.output_dir)
    logger.info(f"Fusion gate checkpoint saved to {out_path}")


if __name__ == "__main__":
    main()
