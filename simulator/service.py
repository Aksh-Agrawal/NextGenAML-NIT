"""
SimulatorService – core orchestration for the real-time UPI simulator.

Every transaction (manual pay, random simulate, stream, preset) flows through
the same pipeline:

    wallet settle → incremental graph insert → incremental risk rescore
    → transaction-level risk + alert → ledger append → stats → broadcast
"""

from __future__ import annotations
import asyncio
import json
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Optional
from loguru import logger
import numpy as np

from api.config import settings
from graph_db.manager import GraphManager
from ml.inference import InferenceEngine
from ml.risk_engine import RiskEngine
from simulator.alert_registry import AlertRegistry
from simulator.ledger import JsonlLedger
from simulator.loggers import alert_log, perf_log, txn_log
from simulator.seed_accounts import WalletStore, build_seed_accounts
from simulator.stream_engine import StreamEngine


class LiveStats:
    """Rolling live statistics for the simulator dashboard."""

    def __init__(self):
        self._lock = threading.Lock()
        self._day: str | None = None
        self._today_count = 0
        self._today_volume = 0.0
        self._window: list[float] = []
        self._total_count = 0
        self._total_volume = 0.0
        self._risk_alerts = 0
        self._risk_sum = 0.0
        self._start = time.time()

    def record(self, amount: float, risk_score: float, alert: Optional[dict]) -> None:
        now = time.time()
        with self._lock:
            day = datetime.fromtimestamp(now).date().isoformat()
            if day != self._day:
                self._day = day
                self._today_count = 0
                self._today_volume = 0.0
            self._today_count += 1
            self._today_volume += amount
            self._total_count += 1
            self._total_volume += amount
            self._risk_sum += risk_score
            if alert:
                self._risk_alerts += 1
            self._window.append(now)
            cutoff = now - 60
            self._window = [t for t in self._window if t >= cutoff]

    def snapshot(self, active_accounts: int, high_risk_accounts: int) -> dict:
        now = time.time()
        with self._lock:
            recent = [t for t in self._window if t >= now - 5]
            tps = round(len(recent) / 5.0, 2)
            avg = self._risk_sum / max(self._total_count, 1)
            return {
                "today_transactions": self._today_count,
                "total_volume": round(self._today_volume, 2),
                "avg_amount": round(self._today_volume / max(self._today_count, 1), 2),
                "risk_alerts": self._risk_alerts,
                "high_risk_accounts": high_risk_accounts,
                "active_accounts": active_accounts,
                "tps": tps,
                "avg_risk_score": round(avg, 2),
                "total_transactions": self._total_count,
                "total_traffic_volume": round(self._total_volume, 2),
            }


class SimulatorService:
    """Coordinates wallets, graph, risk engine, alerts, ledger and broadcast."""

    def __init__(self, graph_manager: GraphManager, inference: InferenceEngine,
                 risk_engine: RiskEngine):
        self.gm = graph_manager
        self.inference = inference
        self.risk_engine = risk_engine
        self.wallet = WalletStore(build_seed_accounts())
        self.ledger = JsonlLedger(settings.SIMULATOR_LEDGER_PATH)
        self.alert_registry = AlertRegistry(JsonlLedger(settings.SIMULATOR_ALERTS_PATH))
        self.stats = LiveStats()
        self.voice_auth_service = None

        self._history: list[dict] = []      # newest first
        self._history_lock = threading.Lock()
        self._tx_counter = 0
        self._executor = ThreadPoolExecutor(max_workers=1)
        self._sockets: set = set()
        self.stream = StreamEngine(self, self._executor)

        self._high_risk: dict[str, bool] = {}
        self._high_risk_count = 0
        self._high_risk_initialized = False
        self._high_risk_lock = threading.Lock()

    # ── WebSocket connection registry ──────────────────
    def register_socket(self, websocket) -> None:
        self._sockets.add(websocket)

    def unregister_socket(self, websocket) -> None:
        self._sockets.discard(websocket)

    async def broadcast(self, envelope: dict) -> None:
        """Push a JSON envelope to every connected websocket (best-effort)."""
        if not self._sockets:
            return
        data = json.dumps(self._json_safe(envelope), default=str)
        dead: list = []

        async def send(ws) -> None:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)

        await asyncio.gather(*[send(ws) for ws in list(self._sockets)],
                             return_exceptions=True)
        for ws in dead:
            self._sockets.discard(ws)

    # ── Public API ─────────────────────────────────────
    def accounts(self) -> list[dict]:
        return self.wallet.list_accounts()

    def history(self, **filters) -> dict:
        """Filtered + paginated transaction history."""
        items = list(self._history)
        date_from = filters.get("date_from")
        date_to = filters.get("date_to")
        risk_level = filters.get("risk_level")
        sender = filters.get("sender")
        receiver = filters.get("receiver")
        min_amount = filters.get("min_amount")
        max_amount = filters.get("max_amount")
        page = int(filters.get("page", 1))
        limit = int(filters.get("limit", 50))

        if date_from:
            items = [i for i in items if i["timestamp"] >= date_from]
        if date_to:
            items = [i for i in items if i["timestamp"] <= date_to]
        if risk_level:
            items = [i for i in items if i.get("risk_level") == risk_level]
        if sender:
            items = [i for i in items if sender.lower() in i["sender"].lower()]
        if receiver:
            items = [i for i in items if receiver.lower() in i["receiver"].lower()]
        if min_amount is not None:
            items = [i for i in items if i["amount"] >= float(min_amount)]
        if max_amount is not None:
            items = [i for i in items if i["amount"] <= float(max_amount)]

        total = len(items)
        start = (page - 1) * limit
        return {
            "items": items[start:start + limit],
            "total": total,
            "page": page,
            "limit": limit,
        }

    def alerts(self, limit: int | None = None) -> list[dict]:
        return self.alert_registry.list(limit=limit)

    def stats_snapshot(self) -> dict:
        self._ensure_high_risk()
        active = self.gm.G.number_of_nodes()
        snapshot = self.stats.snapshot(active_accounts=active,
                                       high_risk_accounts=self._high_risk_count)
        snapshot["stream"] = self.stream.status()
        return snapshot

    def prepare_payment(self, req) -> dict:
        """Resolve request fields into a normalized transaction dict."""
        sender = self.wallet.resolve(account_id=req.sender,
                                     mobile=req.mobile, upi_id=req.upi_id)
        receiver = self.wallet.resolve(account_id=req.receiver,
                                       mobile=req.to_mobile, upi_id=req.to_upi_id)
        if not sender or not receiver:
            raise ValueError("Unknown sender or receiver account")
        if sender == receiver:
            raise ValueError("Sender and receiver cannot be the same account")
        if req.amount <= 0:
            raise ValueError("Amount must be positive")
        return {
            "sender": sender,
            "receiver": receiver,
            "amount": float(req.amount),
            "currency": req.currency or "INR",
            "remark": req.remark or "",
            "device_id": req.device_id or "",
            "ip": req.ip or "",
            "location": req.location or "",
            "channel": req.channel or "UPI",
            "transaction_type": req.transaction_type or "transfer",
        }

    async def publish(self, tx: dict) -> dict:
        """Process a transaction in the worker thread, then broadcast."""
        loop = asyncio.get_running_loop()
        envelope = await loop.run_in_executor(
            self._executor, self.process_transaction, tx)
        await self.broadcast(envelope)
        return envelope

    def replay_ledger(self) -> int:
        """Replay the persisted ledger into the graph (startup, opt-in).

        Runs synchronously on startup. Skips failed transactions and rescores
        affected accounts after replay. Returns the number of rows replayed.
        """
        records = self.ledger.read_all()
        replayed = 0
        affected: set[str] = set()
        for record in records:
            if record.get("status") == "failed":
                continue
            tx = {
                "sender": record["sender"],
                "receiver": record["receiver"],
                "amount": record["amount"],
                "currency": record.get("currency", "INR"),
                "remark": record.get("remark", ""),
                "device_id": record.get("device_id", ""),
                "ip": record.get("ip", ""),
                "location": record.get("location", ""),
                "channel": record.get("channel", "UPI"),
                "timestamp": record.get("timestamp"),
                "transaction_id": record.get("transaction_id"),
                "transaction_type": "transfer",
                "label": 0,
            }
            try:
                self.gm.add_transaction(tx)
                affected.update(self._affected_with_neighbors(record["sender"]))
                affected.update(self._affected_with_neighbors(record["receiver"]))
                replayed += 1
            except Exception as e:
                logger.warning(f"Ledger replay skipped row: {e}")
        if replayed:
            self.risk_engine.rescore(list(affected))
        logger.info(f"Replayed {replayed} simulator transactions from ledger")
        return replayed

    def _affected_with_neighbors(self, account_id: str) -> set[str]:
        affected = {account_id}
        for nbr in self._neighbors(account_id):
            affected.add(nbr)
        return affected

    # ── Incremental high-risk account tracking ─────────
    def _ensure_high_risk(self) -> None:
        """Populate the high-risk account set once from a full scoring pass."""
        if self._high_risk_initialized:
            return
        with self._high_risk_lock:
            if self._high_risk_initialized:
                return
            try:
                for s in self.risk_engine.score_all():
                    self._high_risk[s["account_id"]] = s["risk_score"] > 50
                self._high_risk_count = sum(1 for v in self._high_risk.values() if v)
                self._high_risk_initialized = True
            except Exception as e:
                logger.warning(f"High-risk init failed: {e}")

    def _update_high_risk(self, scores: dict[str, dict]) -> None:
        """Refresh the high-risk set for the accounts just rescored."""
        if not scores:
            return
        with self._high_risk_lock:
            for account_id, s in scores.items():
                is_high = s.get("risk_score", 0) > 50
                if account_id in self._high_risk:
                    if self._high_risk[account_id] == is_high:
                        continue
                    self._high_risk[account_id] = is_high
                    self._high_risk_count += 1 if is_high else -1
                else:
                    self._high_risk[account_id] = is_high
                    if is_high:
                        self._high_risk_count += 1

    @staticmethod
    def _json_safe(value):
        """Recursively coerce numpy scalars/arrays to native JSON types."""
        if isinstance(value, dict):
            return {k: SimulatorService._json_safe(v) for k, v in value.items()}
        if isinstance(value, (list, tuple)):
            return [SimulatorService._json_safe(v) for v in value]
        if isinstance(value, np.generic):
            return value.item()
        if isinstance(value, np.ndarray):
            return value.tolist()
        return value

    def shutdown(self) -> None:
        """Stop the stream and release the worker pool."""
        self.stream.stop()
        self._executor.shutdown(wait=False)

    # ── Transaction pipeline (runs in the single worker) ─
    def process_transaction(self, tx: dict) -> dict:
        """Execute one UPI payment through the full pipeline. Returns envelope."""
        start = time.perf_counter()
        tx = dict(tx)
        tx.setdefault("transaction_id", self._new_tx_id())
        tx.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
        tx.setdefault("currency", "INR")
        tx.setdefault("remark", "")
        tx.setdefault("device_id", "")
        tx.setdefault("ip", "")
        tx.setdefault("location", "")
        tx.setdefault("channel", "UPI")
        tx.setdefault("status", "success")
        tx.setdefault("transaction_type", "transfer")
        tx.setdefault("label", 0)

        sender = str(tx["sender"]).upper()
        receiver = str(tx["receiver"]).upper()
        amount = float(tx["amount"])
        tx["sender"], tx["receiver"] = sender, receiver

        # 1. Reject impossible payments before risk routing.
        if self.wallet.get_balance(sender) < amount:
            tx["status"] = "failed"
            tx["failure_reason"] = "Insufficient balance"

        # 2. Risk rescore before settlement so risky payments can be held.
        scores = self._rescore([sender, receiver])
        self._ensure_high_risk()
        self._update_high_risk(scores)
        alert = None
        tx_risk = self._evaluate_transaction_risk(tx, scores)

        # 3. Route by transaction risk.
        graph_delta = {"new_nodes": [], "new_edges": [], "updated_node_ids": []}
        if tx["status"] == "failed":
            pass
        elif (
            settings.VOICE_AUTH_ENABLED
            and tx_risk["score"] >= settings.VOICE_AUTH_MANUAL_REVIEW_THRESHOLD
        ):
            tx["status"] = "manual_review"
            tx["failure_reason"] = "Fraud probability above manual review threshold"
            tx["voice_status"] = "manual_review_required"
            tx["voice_notes"] = "Risk score exceeded 80%; routed to analyst dashboard."
            alert = self._create_transaction_alert(
                tx, tx_risk, reason="Manual review required before settlement"
            )
        elif settings.VOICE_AUTH_ENABLED and tx_risk["score"] >= settings.VOICE_AUTH_THRESHOLD:
            tx["status"] = "pending_voice_confirmation"
            tx["voice_status"] = "calling"
            tx["voice_notes"] = "Transaction held pending Sarvam/Twilio voice confirmation."
            alert = self._create_transaction_alert(
                tx, tx_risk, reason="Voice confirmation required before settlement"
            )
            if self.voice_auth_service is not None:
                confirmation = self.voice_auth_service.hold_transaction(tx, tx_risk)
                tx["confirmation_id"] = confirmation.confirmation_id
                tx["voice_call_sid"] = confirmation.call_sid
                tx["voice_prompt"] = confirmation.prompt
        else:
            if not self.wallet.debit(sender, amount):
                tx["status"] = "failed"
                tx["failure_reason"] = "Insufficient balance"
            else:
                self.wallet.credit(receiver, amount)
                tx["status"] = "success"

        # 4. Incremental graph insert (only successful payments mutate the graph)
        if tx["status"] == "success":
            inserted = self.gm.add_transaction(tx)
            graph_delta = self._build_graph_delta(tx, inserted)
            self.wallet.record(tx)

        # 5. History + ledger + stats
        record = self._build_history_record(tx, tx_risk, scores)
        with self._history_lock:
            self._history.insert(0, record)
            if len(self._history) > 2000:
                self._history = self._history[:2000]
        self.ledger.append(record)
        self.stats.record(amount, tx_risk["score"], alert)

        txn_log(f"{tx['transaction_id']} {sender} -> {receiver} ₹{amount:,.0f} "
                f"status={tx['status']} risk={tx_risk['score']}")

        # 6. Performance logging (sampled)
        elapsed_ms = (time.perf_counter() - start) * 1000
        if self._tx_counter % 10 == 0:
            perf_log(f"pipeline {tx['transaction_id']} latency_ms={elapsed_ms:.2f}")
        self._tx_counter += 1

        return self._build_envelope(tx, scores, tx_risk, alert, graph_delta)

    def finalize_voice_confirmation(self, confirmation: dict, *, approved: bool) -> dict:
        """Settle or withdraw a held transaction after customer voice response."""
        tx = dict(confirmation["transaction"])
        tx["confirmation_id"] = confirmation["confirmation_id"]
        tx["voice_status"] = confirmation["status"]
        tx["voice_outcome"] = confirmation["outcome"]
        tx["voice_notes"] = confirmation["notes"]
        tx["voice_transcript"] = confirmation["transcript"]

        sender = str(tx["sender"]).upper()
        receiver = str(tx["receiver"]).upper()
        amount = float(tx["amount"])
        tx["sender"], tx["receiver"] = sender, receiver

        graph_delta = {"new_nodes": [], "new_edges": [], "updated_node_ids": []}
        scores = self._rescore([sender, receiver])
        alert = None

        if approved:
            if not self.wallet.debit(sender, amount):
                tx["status"] = "failed"
                tx["failure_reason"] = "Insufficient balance after voice confirmation"
                adjusted_risk = dict(confirmation["tx_risk"])
            else:
                self.wallet.credit(receiver, amount)
                tx["status"] = "success"
                tx["failure_reason"] = None
                inserted = self.gm.add_transaction(tx)
                graph_delta = self._build_graph_delta(tx, inserted)
                self.wallet.record(tx)
                scores = self._rescore([sender, receiver])
                self._update_high_risk(scores)
                adjusted_risk = self._voice_adjusted_risk(confirmation["tx_risk"])
        else:
            tx["status"] = "withdrawn"
            tx["failure_reason"] = "Customer denied transaction during voice confirmation"
            adjusted_risk = dict(confirmation["tx_risk"])
            adjusted_risk["flags"] = list(dict.fromkeys(adjusted_risk.get("flags", []) + ["voice_denied"]))
            adjusted_risk["reason"] = "Customer denied transaction; funds were not moved"

        record = self._build_history_record(tx, adjusted_risk, scores)
        self._upsert_history(record)
        self.ledger.append(record)

        envelope = self._build_envelope(tx, scores, adjusted_risk, alert, graph_delta)
        envelope["type"] = "VOICE_CONFIRMATION_RESULT"
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.broadcast(envelope))
        except RuntimeError:
            pass
        return envelope

    def _create_transaction_alert(self, tx: dict, tx_risk: dict, reason: str | None = None) -> dict:
        alert = self.alert_registry.create(
            transaction_id=tx["transaction_id"],
            sender=tx["sender"],
            receiver=tx["receiver"],
            amount=tx["amount"],
            severity=tx_risk["level"],
            reason=reason or tx_risk["reason"] or "; ".join(tx_risk["flags"]),
        )
        alert_log(f"{alert['id']} {tx_risk['level'].upper()} "
                  f"{tx['sender']} -> {tx['receiver']} ₹{float(tx['amount']):,.0f} "
                  f"({alert['reason']})")
        return alert

    def _upsert_history(self, record: dict) -> None:
        with self._history_lock:
            for idx, item in enumerate(self._history):
                if item["transaction_id"] == record["transaction_id"]:
                    self._history[idx] = record
                    break
            else:
                self._history.insert(0, record)
            self._history.sort(key=lambda item: item["timestamp"], reverse=True)
            if len(self._history) > 2000:
                self._history = self._history[:2000]

    @staticmethod
    def _voice_adjusted_risk(tx_risk: dict) -> dict:
        score = min(float(tx_risk.get("score", 0)) * 0.45, 35.0)
        level = "medium" if score >= 30 else "low"
        adjusted = dict(tx_risk)
        adjusted["score"] = round(score, 1)
        adjusted["level"] = level
        adjusted["flags"] = list(dict.fromkeys(adjusted.get("flags", []) + ["voice_confirmed"]))
        adjusted["reason"] = "Customer confirmed transaction by voice; risk reduced"
        return adjusted

    # ── Envelope helpers ───────────────────────────────
    def _new_tx_id(self) -> str:
        return f"UPI-{uuid.uuid4().hex[:10].upper()}"

    def _rescore(self, accounts: list[str]) -> dict[str, dict]:
        """Rescore accounts + 1-hop neighbors; returns {account_id: score}."""
        unique: list[str] = []
        seen: set[str] = set()
        for acc in accounts:
            if acc not in seen:
                seen.add(acc)
                unique.append(acc)
            for nbr in self._neighbors(acc):
                if nbr not in seen:
                    seen.add(nbr)
                    unique.append(nbr)
        return self.risk_engine.rescore(unique)

    def _neighbors(self, account_id: str) -> list[str]:
        g = self.gm.G
        if account_id not in g:
            return []
        return list(g.predecessors(account_id)) + list(g.successors(account_id))

    def _build_graph_delta(self, tx: dict, inserted: dict) -> dict:
        new_nodes = []
        for acc in inserted.get("new_nodes", []):
            seed = self.wallet.get(acc)
            new_nodes.append({
                "id": acc,
                "label": seed.name if seed else acc,
                "risk": round(seed.base_risk * 100, 1) if seed else 0.0,
            })
        edge = inserted["edge"]
        edge_risk = 0.0
        sender_score = self.risk_engine.score_account(tx["sender"])
        receiver_score = self.risk_engine.score_account(tx["receiver"])
        edge_risk = round(float(max(sender_score["risk_score"],
                                    receiver_score["risk_score"])), 1)
        return {
            "new_nodes": new_nodes,
            "new_edges": [{
                "source": edge["source"],
                "target": edge["target"],
                "amount": edge["total_amount"],
                "tx_count": edge["tx_count"],
                "is_new": edge["is_new"],
                "is_suspicious": edge["is_suspicious"],
                "risk": edge_risk,
            }],
            "updated_node_ids": [tx["sender"], tx["receiver"]],
        }

    def _build_history_record(self, tx: dict, tx_risk: dict,
                              scores: dict) -> dict:
        return {
            "transaction_id": tx["transaction_id"],
            "sender": tx["sender"],
            "receiver": tx["receiver"],
            "amount": round(float(tx["amount"]), 2),
            "currency": tx["currency"],
            "remark": tx["remark"],
            "timestamp": tx["timestamp"],
            "device_id": tx["device_id"],
            "ip": tx["ip"],
            "location": tx["location"],
            "channel": tx["channel"],
            "status": tx["status"],
            "failure_reason": tx.get("failure_reason"),
            "confirmation_id": tx.get("confirmation_id"),
            "voice_status": tx.get("voice_status"),
            "voice_outcome": tx.get("voice_outcome"),
            "voice_notes": tx.get("voice_notes"),
            "voice_call_sid": tx.get("voice_call_sid"),
            "voice_prompt": tx.get("voice_prompt"),
            "voice_transcript": tx.get("voice_transcript", []),
            "risk_score": tx_risk["score"],
            "risk_level": tx_risk["level"],
            "flags": tx_risk["flags"],
            "reason": tx_risk["reason"],
            "sender_risk": scores.get(tx["sender"], {}).get("risk_score", 0),
            "receiver_risk": scores.get(tx["receiver"], {}).get("risk_score", 0),
        }

    def _build_envelope(self, tx: dict, scores: dict, tx_risk: dict,
                        alert: Optional[dict], graph_delta: dict) -> dict:
        return {
            "type": "NEW_TRANSACTION",
            "transaction": {
                "transaction_id": tx["transaction_id"],
                "sender": tx["sender"],
                "receiver": tx["receiver"],
                "amount": round(float(tx["amount"]), 2),
                "currency": tx["currency"],
                "remark": tx["remark"],
                "timestamp": tx["timestamp"],
                "device_id": tx["device_id"],
                "ip": tx["ip"],
                "location": tx["location"],
                "channel": tx["channel"],
                "status": tx["status"],
                "failure_reason": tx.get("failure_reason"),
                "confirmation_id": tx.get("confirmation_id"),
                "voice_status": tx.get("voice_status"),
                "voice_outcome": tx.get("voice_outcome"),
                "voice_notes": tx.get("voice_notes"),
                "voice_call_sid": tx.get("voice_call_sid"),
                "voice_prompt": tx.get("voice_prompt"),
                "voice_transcript": tx.get("voice_transcript", []),
            },
            "risk": {
                "sender": scores.get(tx["sender"]),
                "receiver": scores.get(tx["receiver"]),
            },
            "tx_risk": tx_risk,
            "alert": alert,
            "graph_delta": graph_delta,
            "stats": self.stats.snapshot(
                active_accounts=self.gm.G.number_of_nodes(),
                high_risk_accounts=self._high_risk_count,
            ),
        }

    # ── Transaction-level risk signals ─────────────────
    def _evaluate_transaction_risk(self, tx: dict, scores: dict) -> dict:
        sender = tx["sender"]
        receiver = tx["receiver"]
        amount = float(tx["amount"])
        flags: list[str] = []
        signal = 0.0

        # Account-derived base risk
        sender_risk = scores.get(sender, {}).get("risk_score", 0)
        receiver_risk = scores.get(receiver, {}).get("risk_score", 0)

        # Large transaction
        if amount >= 1_000_000:
            signal += 80
            flags.append("large_transaction")
        elif amount >= 500_000:
            signal += 60
            flags.append("large_transaction")
        elif amount >= 100_000:
            signal += 35
            flags.append("large_transaction")

        # Round amount at scale
        if amount >= 50_000 and amount % 1000 == 0:
            signal += 8
            flags.append("round_amount")

        # Structuring (sub-threshold cluster)
        if self.gm._sender_structuring(sender):
            signal += 40
            flags.append("structuring")

        # Circular transfer
        if self.gm._in_small_cycle(sender) or self.gm._in_small_cycle(receiver):
            signal += 35
            flags.append("circular_transfer")

        # Repeated receiver
        repeated = self.wallet.count_between(sender, receiver, window_seconds=3600)
        if repeated >= 3:
            signal += 15
            flags.append("repeated_receiver")
        elif repeated >= 2:
            signal += 8

        # New receiver
        if self.wallet.count_between(sender, receiver, window_seconds=None) == 0:
            signal += 5
            flags.append("new_receiver")

        # Rapid movement / velocity
        feat = self.gm.get_account_features(sender) or {}
        if feat.get("min_velocity_sec", 999_999) < 60:
            signal += 30
            flags.append("rapid_movement")

        # Burst
        burst = len(self.wallet.recent_txns(sender, 300))
        if burst >= 8:
            signal += 25
            flags.append("burst")
        elif burst >= 5:
            signal += 12

        # Fan-out / fan-in
        if feat.get("out_degree", 0) >= 8:
            signal += 20
            flags.append("fan_out")
        receiver_feat = self.gm.get_account_features(receiver) or {}
        if receiver_feat.get("in_degree", 0) >= 8:
            signal += 20
            flags.append("fan_in")

        # Layering (pass-through)
        if self._is_layering(sender):
            signal += 30
            flags.append("layering")

        # Smurfing (small repeated)
        if amount < 10_000 and repeated >= 2:
            signal += 15
            flags.append("smurfing")

        # Dormant receiver activated
        if self.gm._is_dormant_activation(receiver):
            signal += 20
            flags.append("dormant_activation")

        # Shared device / IP
        if self.wallet.distinct_accounts_for("device_id", tx.get("device_id", "")) >= 3:
            signal += 15
            flags.append("shared_device")
        if self.wallet.distinct_accounts_for("ip", tx.get("ip", "")) >= 3:
            signal += 15
            flags.append("shared_ip")

        # Geo anomaly
        if self._geo_anomaly(tx):
            signal += 10
            flags.append("geo_anomaly")

        signal_score = min(100.0, signal)
        base = max(sender_risk, receiver_risk)
        final = min(100.0, 0.5 * base + 0.5 * signal_score)

        if final >= 75:
            level = "critical"
        elif final >= 50:
            level = "high"
        elif final >= 30:
            level = "medium"
        else:
            level = "low"

        flags = list(dict.fromkeys(flags))
        reason = "High risk transaction" if level in ("high", "critical") else (
            "Elevated risk transaction" if level == "medium" else "Normal transaction")

        return {
            "score": round(final, 1),
            "level": level,
            "flags": flags,
            "reason": reason,
        }

    def _is_layering(self, account_id: str) -> bool:
        recent = self.wallet.recent_txns(account_id, 3600)
        in_peers = {e["peer"] for e in recent if e["direction"] == "in"}
        out_peers = {e["peer"] for e in recent if e["direction"] == "out"}
        return bool(in_peers and out_peers and not (in_peers & out_peers))

    def _geo_anomaly(self, tx: dict) -> bool:
        loc = tx.get("location")
        if not loc:
            return False
        typical = self.wallet.typical_locations(tx["sender"])
        return bool(typical and loc not in typical)
