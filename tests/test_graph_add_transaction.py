from datetime import datetime, timedelta

from graph_db.manager import GraphManager


def _add(gm, sender, receiver, amount, ts=None):
    tx = {
        "sender": sender,
        "receiver": receiver,
        "amount": amount,
        "timestamp": ts or datetime.now().isoformat(),
        "transaction_type": "transfer",
        "label": 0,
    }
    return gm.add_transaction(tx)


def test_add_transaction_empty_graph():
    gm = GraphManager()
    result = _add(gm, "RAHUL", "PRIYA", 2500)
    assert gm._df is not None
    assert gm._df["timestamp"].dtype.kind == "M"  # datetime64
    assert gm._df["amount"].dtype.kind in ("f", "i")
    assert "RAHUL" in gm.G and "PRIYA" in gm.G
    assert result["new_nodes"] == ["RAHUL", "PRIYA"]
    assert result["edge"]["is_new"] is True
    assert result["edge"]["total_amount"] == 2500
    # features recomputed for affected accounts
    assert gm.get_account_features("RAHUL")["tx_count"] == 1
    assert gm.get_account_features("RAHUL")["total_sent"] == 2500


def test_add_transaction_aggregates():
    gm = GraphManager()
    _add(gm, "A", "B", 100)
    _add(gm, "A", "B", 200)
    edge = gm.G["A"]["B"]
    assert edge["total_amount"] == 300
    assert edge["tx_count"] == 2
    assert gm.get_account_features("A")["total_sent"] == 300


def test_add_transaction_tz_normalized():
    gm = GraphManager()
    _add(gm, "A", "B", 100, datetime.now().astimezone().isoformat())
    assert gm._df["timestamp"].iloc[0].tzinfo is None


def test_affected_accounts_covers_neighbors():
    gm = GraphManager()
    _add(gm, "A", "B", 100)
    _add(gm, "B", "C", 100)
    affected = gm._affected_accounts("A", "B")
    assert affected == {"A", "B", "C"}


def test_small_cycle_detection():
    gm = GraphManager()
    for u, v in [("A", "B"), ("B", "C"), ("C", "A")]:
        _add(gm, u, v, 100)
    assert gm._in_small_cycle("A") is True
    assert gm._in_small_cycle("B") is True


def test_sender_structuring_detection():
    gm = GraphManager()
    base = datetime.now()
    _add(gm, "A", "B", 9500, (base - timedelta(minutes=1)).isoformat())
    _add(gm, "A", "B", 9700, base.isoformat())
    assert gm._sender_structuring("A") is True


def test_dormant_activation_detection():
    gm = GraphManager()
    base = datetime.now()
    _add(gm, "A", "B", 100, (base - timedelta(days=45)).isoformat())
    _add(gm, "A", "C", 100, base.isoformat())
    assert gm._is_dormant_activation("A") is True


def test_small_csv_load():
    gm = GraphManager()
    gm.load_from_csv("transaction.csv")
    assert gm.G.number_of_nodes() > 0
    assert gm.G.number_of_edges() > 0
    assert len(gm.get_all_accounts()) == gm.G.number_of_nodes()
