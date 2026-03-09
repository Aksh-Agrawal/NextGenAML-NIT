"""Quick test of the backend pipeline."""
import sys
sys.path.insert(0, ".")

from graph_db.manager import GraphManager
from ml.inference import InferenceEngine
from ml.risk_engine import RiskEngine

gm = GraphManager()
gm.load_from_csv("transaction.csv")

ie = InferenceEngine(gm)
ie.initialize()

print("Predict SUS001:", ie.predict("SUS001"))
print("Predict USR101:", ie.predict("USR101"))

re = RiskEngine(gm, ie)
re.compute_patterns()

print("\nRisk SUS001:", re.score_account("SUS001"))
print("Risk USR101:", re.score_account("USR101"))

print("\nCircular:", gm.detect_circular_patterns())
print("Structuring:", gm.detect_structuring())

print("\n--- ALL SCORES ---")
for s in re.score_all():
    if s["risk_score"] > 30:
        print(f"  {s['account_id']}: {s['risk_score']} ({s['status']}) - {s['pattern_detected']}")

print("\nTest passed!")
