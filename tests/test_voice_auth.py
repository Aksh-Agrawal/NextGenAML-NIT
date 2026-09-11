from api.config import settings
from api.voice_auth_service import VoiceAuthService


def test_voice_confirmation_holds_then_settles(service, monkeypatch):
    monkeypatch.setattr(settings, "VOICE_AUTH_ENABLED", True)
    monkeypatch.setattr(settings, "VOICE_AUTH_MOCK_MODE", True)
    monkeypatch.setattr(settings, "VOICE_AUTH_THRESHOLD", 60)
    monkeypatch.setattr(settings, "VOICE_AUTH_MANUAL_REVIEW_THRESHOLD", 80)

    service.voice_auth_service = VoiceAuthService(settings, service)

    def fake_risk(tx, scores):
        return {
            "score": 65.0,
            "level": "high",
            "flags": ["large_transaction"],
            "reason": "High risk transaction",
        }

    monkeypatch.setattr(service, "_evaluate_transaction_risk", fake_risk)

    rahul = service.wallet.get_balance("RAHUL")
    priya = service.wallet.get_balance("PRIYA")
    env = service.process_transaction(
        {"sender": "RAHUL", "receiver": "PRIYA", "amount": 1500}
    )

    assert env["transaction"]["status"] == "pending_voice_confirmation"
    assert env["transaction"]["confirmation_id"]
    assert env["graph_delta"]["new_edges"] == []
    assert service.wallet.get_balance("RAHUL") == rahul
    assert service.wallet.get_balance("PRIYA") == priya

    result = service.voice_auth_service.resolve(
        env["transaction"]["confirmation_id"],
        decision="confirmed",
        transcript="Yes, continue this transaction.",
    )

    assert result["type"] == "VOICE_CONFIRMATION_RESULT"
    assert result["transaction"]["status"] == "success"
    assert result["tx_risk"]["score"] < 60
    assert service.wallet.get_balance("RAHUL") == rahul - 1500
    assert service.wallet.get_balance("PRIYA") == priya + 1500


def test_manual_review_does_not_settle(service, monkeypatch):
    monkeypatch.setattr(settings, "VOICE_AUTH_ENABLED", True)
    monkeypatch.setattr(settings, "VOICE_AUTH_MANUAL_REVIEW_THRESHOLD", 80)

    def fake_risk(tx, scores):
        return {
            "score": 85.0,
            "level": "critical",
            "flags": ["large_transaction"],
            "reason": "Critical risk transaction",
        }

    monkeypatch.setattr(service, "_evaluate_transaction_risk", fake_risk)

    rahul = service.wallet.get_balance("RAHUL")
    priya = service.wallet.get_balance("PRIYA")
    env = service.process_transaction(
        {"sender": "RAHUL", "receiver": "PRIYA", "amount": 1500}
    )

    assert env["transaction"]["status"] == "manual_review"
    assert env["alert"]["reason"] == "Manual review required before settlement"
    assert env["graph_delta"]["new_edges"] == []
    assert service.wallet.get_balance("RAHUL") == rahul
    assert service.wallet.get_balance("PRIYA") == priya
