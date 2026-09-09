"use client";

import { useEffect, useRef, useState } from "react";
import {
  api,
  API_BASE,
  type LiveEnvelope,
  type SimulatorAlert,
  type SimulatorGraphDelta,
  type SimulatorHistoryItem,
  type SimulatorStats,
} from "./api";

/**
 * Derive the WebSocket push URL from the configured HTTP API base so the
 * simulator page works against any backend (localhost or the hosted API).
 */
export function wsUrl(): string {
  return API_BASE.replace(/^http/, "ws") + "/ws/live";
}

const MAX_TXNS = 200;
const MAX_ALERTS = 50;

function toLiveTxn(env: LiveEnvelope): SimulatorHistoryItem {
  const t = env.transaction;
  const r = env.tx_risk;
  return {
    ...t,
    risk_score: r?.score ?? 0,
    risk_level: r?.level ?? "low",
    flags: r?.flags ?? [],
    reason: r?.reason ?? "",
    sender_risk: env.risk?.sender?.risk_score ?? 0,
    receiver_risk: env.risk?.receiver?.risk_score ?? 0,
  };
}

/**
 * Subscribe to the live simulator stream over WebSocket, with exponential
 * backoff reconnects and a lightweight HTTP polling fallback so the page
 * still updates when the socket is unavailable.
 */
export function useLiveTransactions() {
  const [txns, setTxns] = useState<SimulatorHistoryItem[]>([]);
  const [stats, setStats] = useState<SimulatorStats | null>(null);
  const [alerts, setAlerts] = useState<SimulatorAlert[]>([]);
  const [connected, setConnected] = useState(false);
  const [latestAlert, setLatestAlert] = useState<SimulatorAlert | null>(null);
  const [delta, setDelta] = useState<SimulatorGraphDelta | null>(null);

  const txnsRef = useRef<SimulatorHistoryItem[]>([]);
  const statsRef = useRef<SimulatorStats | null>(null);
  const alertsRef = useRef<SimulatorAlert[]>([]);
  const connectedRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const aliveRef = useRef(true);

  const pushEnvelope = (env: LiveEnvelope) => {
    const item = toLiveTxn(env);
    txnsRef.current = [
      item,
      ...txnsRef.current.filter((t) => t.transaction_id !== item.transaction_id),
    ].slice(0, MAX_TXNS);
    setTxns(txnsRef.current);

    if (env.stats) {
      statsRef.current = env.stats;
      setStats(env.stats);
    }
    if (env.graph_delta && env.graph_delta.new_edges?.length > 0) {
      setDelta(env.graph_delta);
    }
    if (env.alert) {
      alertsRef.current = [
        env.alert,
        ...alertsRef.current.filter((a) => a.id !== env.alert!.id),
      ].slice(0, MAX_ALERTS);
      setAlerts(alertsRef.current);
      setLatestAlert(env.alert);
    }
  };

  const refreshStats = async () => {
    try {
      const s = await api.simulatorStats();
      statsRef.current = s;
      setStats(s);
    } catch {
      /* backend unreachable – ignore */
    }
  };

  useEffect(() => {
    aliveRef.current = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (!aliveRef.current) return;
      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl());
      } catch {
        schedule();
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        retriesRef.current = 0;
        connectedRef.current = true;
        setConnected(true);
      };
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data as string) as LiveEnvelope;
          if (data.type === "NEW_TRANSACTION") pushEnvelope(data);
        } catch {
          /* non-JSON heartbeat – ignore */
        }
      };
      ws.onclose = () => {
        connectedRef.current = false;
        setConnected(false);
        if (aliveRef.current) schedule();
      };
      ws.onerror = () => {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
      };
    };

    const schedule = () => {
      const delay = Math.min(15_000, 1000 * 2 ** retriesRef.current);
      retriesRef.current += 1;
      timer = setTimeout(connect, delay);
    };

    connect();

    // Catch-up / fallback polling
    const poll = setInterval(async () => {
      await refreshStats();
      if (!connectedRef.current && txnsRef.current.length === 0) {
        try {
          const res = await api.simulatorHistory({ limit: 50 });
          txnsRef.current = res.items;
          setTxns(res.items);
        } catch {
          /* ignore */
        }
      }
    }, 4_000);

    return () => {
      aliveRef.current = false;
      if (timer) clearTimeout(timer);
      clearInterval(poll);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consumeLatestAlert = () => setLatestAlert(null);

  return {
    txns,
    stats,
    alerts,
    connected,
    latestAlert,
    delta,
    consumeLatestAlert,
    refreshStats,
  };
}
