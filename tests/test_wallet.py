from simulator.seed_accounts import WalletStore, build_seed_accounts


def _wallet():
    return WalletStore(build_seed_accounts())


def test_seed_accounts_present():
    w = _wallet()
    ids = w.ids()
    assert len(ids) == 8
    assert "RAHUL" in ids and "SONIA" in ids


def test_resolve_by_id_mobile_upi():
    w = _wallet()
    assert w.resolve(account_id="rahul") == "RAHUL"
    assert w.resolve(mobile="9876543211") == "PRIYA"
    assert w.resolve(upi_id="akash@demo") == "AKASH"
    assert w.resolve(account_id="NOPE") is None


def test_debit_credit_balance():
    w = _wallet()
    bal = w.get_balance("RAHUL")
    assert w.debit("RAHUL", 1000) is True
    assert w.get_balance("RAHUL") == bal - 1000
    w.credit("RAHUL", 500)
    assert w.get_balance("RAHUL") == bal - 500


def test_overdraft_rejected():
    w = _wallet()
    bal = w.get_balance("NEHA")
    assert w.debit("NEHA", bal + 1) is False
    assert w.get_balance("NEHA") == bal


def test_count_between_and_recent():
    w = _wallet()
    assert w.count_between("RAHUL", "PRIYA") == 0
    w.record({"sender": "RAHUL", "receiver": "PRIYA", "amount": 100,
              "device_id": "D1", "ip": "1.1.1.1", "location": "Mumbai"})
    w.record({"sender": "RAHUL", "receiver": "PRIYA", "amount": 200,
              "device_id": "D2", "ip": "1.1.1.1", "location": "Mumbai"})
    assert w.count_between("RAHUL", "PRIYA") == 2
    assert len(w.recent_txns("RAHUL", 300)) == 2
    assert len(w.recent_txns("PRIYA", 300)) == 2


def test_shared_device_ip_detection():
    w = _wallet()
    # record() logs both the sender and the receiver of every transfer
    w.record({"sender": "RAHUL", "receiver": "PRIYA", "amount": 100,
              "device_id": "D9", "ip": "1.1.1.1", "location": ""})
    w.record({"sender": "AKASH", "receiver": "NEHA", "amount": 100,
              "device_id": "D9", "ip": "1.1.1.1", "location": ""})
    w.record({"sender": "AMAN", "receiver": "RIYA", "amount": 100,
              "device_id": "D8", "ip": "1.1.1.2", "location": ""})
    assert w.distinct_accounts_for("device_id", "D9") == 4
    assert w.distinct_accounts_for("ip", "1.1.1.1") == 4
    assert w.distinct_accounts_for("device_id", "D8") == 2


def test_typical_locations():
    w = _wallet()
    assert w.typical_locations("RAHUL") == set()
    w.record({"sender": "RAHUL", "receiver": "PRIYA", "amount": 100,
              "device_id": "", "ip": "", "location": "Pune"})
    w.record({"sender": "RAHUL", "receiver": "NEHA", "amount": 100,
              "device_id": "", "ip": "", "location": "Pune"})
    assert w.typical_locations("RAHUL") == {"Pune"}
