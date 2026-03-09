"""
Standalone ingestion script.
Usage: python -m ingestion.ingest --csv_path data/transactions.csv
"""

import argparse
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from graph_db.manager import GraphManager
from api.config import settings
from loguru import logger


def main():
    parser = argparse.ArgumentParser(description="Ingest transaction CSV into graph")
    parser.add_argument(
        "--csv_path",
        type=str,
        default=str(settings.TRANSACTION_CSV),
        help="Path to transaction CSV file",
    )
    parser.add_argument("--sync-memgraph", action="store_true", help="Sync to Memgraph after loading")
    args = parser.parse_args()

    gm = GraphManager()

    csv_path = Path(args.csv_path)
    if not csv_path.exists():
        logger.error(f"CSV file not found: {csv_path}")
        sys.exit(1)

    count = gm.load_from_csv(str(csv_path))
    logger.info(f"Ingested {count} transactions")
    logger.info(f"Graph: {gm.G.number_of_nodes()} nodes, {gm.G.number_of_edges()} edges")

    stats = gm.get_stats()
    logger.info(f"Total volume: ₹{stats['total_volume']:,.2f}")
    logger.info(f"Flagged accounts: {stats['flagged_accounts']}")

    # Pattern detection
    cycles = gm.detect_circular_patterns()
    structuring = gm.detect_structuring()
    dormant = gm.detect_dormant_activations()
    logger.info(f"Circular patterns: {len(cycles)}")
    logger.info(f"Structuring patterns: {len(structuring)}")
    logger.info(f"Dormant activations: {len(dormant)}")

    if args.sync_memgraph:
        gm.connect_memgraph(settings.MEMGRAPH_HOST, settings.MEMGRAPH_PORT)
        gm.sync_to_memgraph()
        logger.info("Synced to Memgraph")


if __name__ == "__main__":
    main()
