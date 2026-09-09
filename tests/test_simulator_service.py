import numpy as np

from simulator.service import SimulatorService


def test_prepare_payment_resolves(service):
    from api.schemas import SimulatorPayRequest

    tx = service.prepare_payment(
        SimulatorPayRequest(sender="RAHUL", receiver="PRIYA", amount=500)
    )
    assert tx["sender"] == "RAHUL"
    assert tx["receiver"] == "PRIYA"
    assert tx["amount"] == 500.0


def test_prepare_payment_unknown_account(service):
    from api.schemas import SimulatorPayRequest
    from api.config import settings

    import pytest

    with pytest.raises(ValueError):
        service.prepare_payment(SimulatorPayRequest(sender="NOPE", receiver="PRIYA", amount=10))


def test_pay_success_updates_state(service):
    rahul = service.wallet.get_balance("RAHUL")
    priya = service.wallet.get_balance("PRIYA")
    env = service.process_transaction(
        {"sender": "RAHUL", "receiver": "PRIYA", "amount": 1500}
    )
    assert env["transaction"]["status"] == "success"
    assert service.wallet.get_balance("RAHUL") == rahul - 1500
    assert service.wallet.get_balance("PRIYA") == priya + 1500
    assert service.history()["total"] == 1
    assert len(service.ledger.read_all()) == 1


def test_pay_overdraft_fails(service):
    env = service.process_transaction(
        {"sender": "NEHA", "receiver": "PRIYA", "amount": 10_000_000}
    )
    assert env["transaction"]["status"] == "failed"
    assert env["transaction"]["failure_reason"] == "Insufficient balance"
    assert env["graph_delta"]["new_edges"] == []
    assert env["alert"] is None


def test_low_risk_payment_no_alert(service):
    env = service.process_transaction(
        {"sender": "RAHUL", "receiver": "PRIYA", "amount": 500}
    )
    assert env["alert"] is None
    assert env["tx_risk"]["score"] < 50


def test_alert_created_on_high_risk(service, monkeypatch):
    def fake_risk(tx, scores):
        return {
            "score": 88.0,
            "level": "critical",
            "flags": ["large_transaction"],
            "reason": "High risk transaction",
        }

    monkeypatch.setattr(service, "_evaluate_transaction_risk", fake_risk)
    env = service.process_transaction(
        {"sender": "RAHUL", "receiver": "PRIYA", "amount": 5000}
    )
    assert env["alert"] is not None
    assert env["alert"]["severity"] == "critical"
    assert env["alert"]["sender"] == "RAHUL"
    assert service.alert_registry.count() >= 1


def test_tx_risk_signal_math(service):
    risk = service._evaluate_transaction_risk(
        {"sender": "RAHUL", "receiver": "PRIYA", "amount": 1_000_000},
        {"RAHUL": {"risk_score": 0}, "PRIYA": {"risk_score": 0}},
    )
    assert risk["score"] >= 40
    assert "large_transaction" in risk["flags"]

    # High base risk pushes the blended score over the high threshold
    risk2 = service._evaluate_transaction_risk(
        {"sender": "RAHUL", "receiver": "PRIYA", "amount": 1_000_000},
        {"RAHUL": {"risk_score": 80}, "PRIYA": {"risk_score": 60}},
    )
    assert risk2["score"] >= 60
    assert risk2["level"] in ("high", "critical")


def test_high_risk_counter_mechanics(service):
    service._ensure_high_risk()
    assert service._high_risk_initialized is True

    before = service._high_risk_count
    service._update_high_risk({"RAHUL": {"risk_score": 80.0}})
    assert service._high_risk.get("RAHUL") is True
    assert service._high_risk_count == before + 1

    service._update_high_risk({"RAHUL": {"risk_score": 10.0}})
    assert service._high_risk.get("RAHUL") is False
    assert service._high_risk_count == before


def test_stats_snapshot_uses_counter(service):
    service._ensure_high_risk()
    service._high_risk_count = 7
    snap = service.stats_snapshot()
    assert snap["high_risk_accounts"] == 7
    assert snap["active_accounts"] == service.gm.G.number_of_nodes()
    assert "stream" in snap


def test_envelope_uses_native_float_types(service):
    env = service.process_transaction(
        {"sender": "RAHUL", "receiver": "PRIYA", "amount": 1500}
    )
    assert env["graph_delta"]["new_edges"][0]["risk"] == float(
        env["graph_delta"]["new_edges"][0]["risk"]
    )
    assert env["stats"]["high_risk_accounts"] == int(
        env["stats"]["high_risk_accounts"]
    )


def test_json_safe_numpy():
    payload = {"a": np.float64(3.5), "b": np.array([1, 2]), "c": {"d": np.int64(4)}}
    safe = SimulatorService._json_safe(payload)
    assert safe == {"a": 3.5, "b": [1, 2], "c": {"d": 4}}
    assert type(safe["a"]) is float
