import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest

from graph_db.manager import GraphManager
from ml.inference import InferenceEngine
from ml.risk_engine import RiskEngine
from simulator.alert_registry import AlertRegistry
from simulator.ledger import JsonlLedger
from simulator.service import SimulatorService


@pytest.fixture(scope="session")
def graph_manager():
    gm = GraphManager()
    gm.load_from_csv(str(Path(__file__).resolve().parent.parent / "transaction.csv"))
    return gm


@pytest.fixture(scope="session")
def inference(graph_manager):
    ie = InferenceEngine(graph_manager)
    ie.initialize()
    return ie


@pytest.fixture(scope="session")
def risk_engine(graph_manager, inference):
    re = RiskEngine(graph_manager, inference)
    re.compute_patterns()
    return re


@pytest.fixture()
def service(graph_manager, inference, risk_engine, tmp_path):
    svc = SimulatorService(graph_manager, inference, risk_engine)
    # Isolate ledger + alert persistence from the repo's real data files.
    svc.ledger = JsonlLedger(tmp_path / "ledger.jsonl")
    svc.alert_registry = AlertRegistry(JsonlLedger(tmp_path / "alerts.jsonl"))
    return svc
