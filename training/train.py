"""
Standalone training script.
Usage: python -m training.train --model graphsage --epochs 50
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from graph_db.manager import GraphManager
from ml.inference import InferenceEngine
from api.config import settings
from loguru import logger


def main():
    parser = argparse.ArgumentParser(description="Train AML detection model")
    parser.add_argument("--model", type=str, default=settings.GNN_MODEL_TYPE, help="Model type: graphsage | line_mvgnn")
    parser.add_argument("--epochs", type=int, default=settings.NUM_EPOCHS)
    parser.add_argument("--csv_path", type=str, default=str(settings.TRANSACTION_CSV))
    parser.add_argument("--output", type=str, default=str(settings.SAVED_MODELS_DIR / "aml_model.pt"))
    args = parser.parse_args()

    # Load data
    gm = GraphManager()
    csv_path = Path(args.csv_path)
    if not csv_path.exists():
        logger.error(f"CSV not found: {csv_path}")
        sys.exit(1)

    gm.load_from_csv(str(csv_path))
    logger.info(f"Loaded graph: {gm.G.number_of_nodes()} nodes, {gm.G.number_of_edges()} edges")

    # Train
    engine = InferenceEngine(gm, model_type=args.model)
    engine.initialize()

    # Save
    out_path = Path(args.output)
    engine.save_model(out_path)
    logger.info(f"Model saved to {out_path}")

    # Quick evaluation
    all_accounts = gm.get_all_accounts()
    predictions = engine.predict_batch(all_accounts)
    suspicious = sum(1 for p in predictions if p["fraud_probability"] > 0.5)
    logger.info(f"Evaluation: {suspicious}/{len(all_accounts)} accounts flagged as suspicious")


if __name__ == "__main__":
    main()
