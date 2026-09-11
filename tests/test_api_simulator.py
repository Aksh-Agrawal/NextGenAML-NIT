import pytest
from fastapi.testclient import TestClient

from api.main import app


@pytest.fixture()
def client():
    # Without the context manager the lifespan (data load + model training)
    # is skipped, keeping the API tests fast against the empty graph.
    return TestClient(app)


def test_list_accounts(client):
    r = client.get("/simulator/accounts")
    assert r.status_code == 200
    accounts = r.json()
    assert len(accounts) == 11
    assert {"account_id", "name", "balance", "upi_id"} <= set(accounts[0])


def test_stats_endpoint(client):
    r = client.get("/simulator/stats")
    assert r.status_code == 200
    body = r.json()
    assert "high_risk_accounts" in body
    assert "active_accounts" in body
    assert body["stream"]["state"] in ("idle", "running", "paused", "completed")


def test_pay_endpoint_success(client):
    r = client.post(
        "/simulator/pay",
        json={"sender": "RAHUL", "receiver": "PRIYA", "amount": 1200},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["type"] == "NEW_TRANSACTION"
    assert body["transaction"]["status"] == "success"
    assert body["graph_delta"]["new_edges"][0]["risk"] == float(
        body["graph_delta"]["new_edges"][0]["risk"]
    )


def test_pay_endpoint_unknown_account(client):
    r = client.post(
        "/simulator/pay",
        json={"sender": "NOPE", "receiver": "PRIYA", "amount": 100},
    )
    assert r.status_code == 400


def test_simulate_preset(client):
    r = client.post("/simulator/simulate", json={"preset": "normal_user"})
    assert r.status_code == 200
    assert r.json()["transaction"]["status"] == "success"


def test_presets_list(client):
    r = client.get("/simulator/presets")
    assert r.status_code == 200
    body = r.json()
    assert len(body["presets"]) == 9
    assert 5 in body["tps_options"]


def test_stream_control_cycle(client):
    r = client.post("/simulator/stream/start", json={"tps": 5})
    assert r.status_code == 200
    assert r.json()["state"] == "running"

    r = client.post("/simulator/stream/stop", json={})
    assert r.status_code == 200
    assert r.json()["state"] == "stopped"


def test_stream_control_invalid_tps(client):
    r = client.post("/simulator/stream/start", json={"tps": 7})
    assert r.status_code == 200
    assert r.json()["status"] == "error"


def test_history_and_alerts_endpoints(client):
    r = client.get("/simulator/history?limit=10")
    assert r.status_code == 200
    assert r.json()["total"] >= 0

    r = client.get("/simulator/alerts?limit=10")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_websocket_ping_pong_and_push(client):
    with client.websocket_connect("/ws/live") as ws:
        ws.send_text("ping")
        assert ws.receive_json() == {"type": "PONG"}

        r = client.post(
            "/simulator/pay",
            json={"sender": "RAHUL", "receiver": "NEHA", "amount": 900},
        )
        assert r.status_code == 200
        expected_id = r.json()["transaction"]["transaction_id"]

        msg = ws.receive_json()
        assert msg["type"] == "NEW_TRANSACTION"
        assert msg["transaction"]["transaction_id"] == expected_id
        assert "stats" in msg
        assert "graph_delta" in msg
