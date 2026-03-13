'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import {
  Activity, ArrowDown, Zap, Clock, Send, Loader2, ChevronDown,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatAmount, getRiskFromScore, getRiskColor } from '@/lib/utils'
import { RiskBadge, ProbabilityBar, LoadingState } from '@/components/ui'

interface LiveEntry {
  id: string
  from: string
  to: string
  amount: number
  timestamp: Date
  risk: number
  flags: string[]
}

let entryCounter = 0
function makeId() { return `ENTRY-${++entryCounter}` }

export default function MonitorPage() {
  const [feed, setFeed] = useState<LiveEntry[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [throughputData, setThroughputData] = useState<{ t: number; v: number }[]>([])
  const [uptime, setUptime] = useState(0)
  const feedRef = useRef<HTMLDivElement>(null)
  const startTime = useRef(Date.now())

  // Manual scorer form
  const [form, setForm] = useState({ sender: '', receiver: '', amount: '', currency: 'INR' })
  const [scoring, setScoring] = useState(false)
  const [scoreResult, setScoreResult] = useState<{ risk_score: number; status: string; flags: string[]; transaction_id: string } | null>(null)

  const { data: stats } = useQuery({
    queryKey: ['monitorStats'],
    queryFn: api.monitorStats,
    refetchInterval: 2_000,
    staleTime: 0,
  })

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', 0.5],
    queryFn: () => api.alerts(0.5, 100),
    refetchInterval: 5_000,
    staleTime: 0,
  })

  // Simulate live feed from alert data
  useEffect(() => {
    if (alerts.length === 0) return
    const interval = setInterval(() => {
      const sample = alerts[Math.floor(Math.random() * alerts.length)]
      const randomPeer = alerts[Math.floor(Math.random() * alerts.length)]
      const amount = Math.random() * 2_000_000 + 10_000

      setFeed((prev) => {
        const entry: LiveEntry = {
          id: makeId(),
          from: sample.account_id,
          to: randomPeer?.account_id ?? 'ACCT999',
          amount,
          timestamp: new Date(),
          risk: sample.risk_score / 100,
          flags: [],
        }
        return [entry, ...prev.slice(0, 99)]
      })

      setThroughputData((prev) => {
        const newPt = { t: Date.now(), v: Math.random() * 5 + 1 }
        return [...prev.slice(-30), newPt]
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [alerts])

  // Uptime counter
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto scroll
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = 0
    }
  }, [feed, autoScroll])

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const handleScore = async () => {
    if (!form.sender || !form.receiver || !form.amount) return
    setScoring(true)
    setScoreResult(null)
    try {
      const result = await api.monitorTransaction({
        sender_account: form.sender,
        receiver_account: form.receiver,
        amount: parseFloat(form.amount),
        currency: form.currency,
      })
      setScoreResult(result)
    } catch {
      setScoreResult({ risk_score: 0, status: 'error', flags: ['API error'], transaction_id: 'ERROR' })
    } finally {
      setScoring(false)
    }
  }

  const alertRate = stats ? (stats.total_alerts_generated / Math.max(stats.total_transactions_processed, 1)) * 100 : 0

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Real-Time Monitor</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Live transaction stream · GNN scoring pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="live-dot" />
          <span style={{ fontSize: 11, color: 'var(--accent-green)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            INGESTING
          </span>
        </div>
      </div>

      {/* Stats Gauges Row */}
      <div className="grid grid-cols-4 gap-4">
        <motion.div className="card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Throughput</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-blue)', marginBottom: 6 }}>
            {(throughputData[throughputData.length - 1]?.v ?? 0).toFixed(1)}
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>tx/s</span>
          </div>
          <div style={{ height: 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputData} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4D8EFF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4D8EFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#4D8EFF" strokeWidth={1.5} fill="url(#blueGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} style={{ color: 'var(--accent-amber)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Alert Rate</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-amber)', marginBottom: 6 }}>
            {alertRate.toFixed(1)}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 2 }}>%</span>
          </div>
          <ProbabilityBar value={alertRate / 100} height={6} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            {stats?.total_alerts_generated ?? 0} / {stats?.total_transactions_processed ?? 0} flagged
          </div>
        </motion.div>

        <motion.div className="card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} style={{ color: 'var(--accent-red)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Active Alerts</span>
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--accent-red)',
            filter: 'drop-shadow(0 0 8px rgba(255,61,87,0.4))',
            animation: 'glow-pulse 2s ease-in-out infinite',
          }}>
            {alerts.filter((a) => a.risk_score >= 75).length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>CRITICAL · {alerts.filter((a) => a.risk_score >= 50 && a.risk_score < 75).length} HIGH</div>
        </motion.div>

        <motion.div className="card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} style={{ color: 'var(--accent-green)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Uptime</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-green)', letterSpacing: 2 }}>
            {formatUptime(uptime)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Latency: {stats?.model_inference_latency_ms?.toFixed(1) ?? '—'}ms
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Live Feed (2/3) */}
        <motion.div
          className="card col-span-2 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <div className="live-dot" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Transaction Stream</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-ghost"
                style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={() => setAutoScroll(!autoScroll)}
              >
                <ChevronDown size={12} />
                {autoScroll ? 'Auto-scroll ON' : 'Paused'}
              </button>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {feed.length} entries
              </span>
            </div>
          </div>

          <div
            ref={feedRef}
            style={{ flex: 1, overflowY: 'auto', maxHeight: 460, fontFamily: 'JetBrains Mono, monospace' }}
            onScroll={() => {
              if (feedRef.current && feedRef.current.scrollTop > 20) setAutoScroll(false)
            }}
          >
            {feed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <LoadingState variant="pulse" message="Waiting for transactions..." />
              </div>
            ) : (
              feed.map((entry) => {
                const level = getRiskFromScore(entry.risk * 100)
                const color = getRiskColor(level)
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      padding: '8px 16px',
                      borderBottom: '1px solid var(--border)',
                      borderLeft: `3px solid ${color}`,
                      background: level === 'critical' ? 'rgba(255,61,87,0.03)' : level === 'high' ? 'rgba(255,181,71,0.02)' : 'transparent',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', minWidth: 80, fontSize: 10 }}>
                      {entry.timestamp.toTimeString().slice(0, 8)}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{entry.from}</span>
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{entry.to}</span>
                    <span style={{ color: 'var(--accent-amber)', marginLeft: 'auto' }}>{formatAmount(entry.amount)}</span>
                    <RiskBadge level={level} size="sm" />
                    <span style={{ color, fontWeight: 700, minWidth: 32 }}>{(entry.risk * 100).toFixed(0)}</span>
                  </motion.div>
                )
              })
            )}
          </div>
        </motion.div>

        {/* Manual Scorer (1/3) */}
        <motion.div
          className="card p-5 flex flex-col gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600 }}>Manual Transaction Scorer</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Score any transaction in real-time</p>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Sender Account', key: 'sender', placeholder: 'ACCT001' },
              { label: 'Receiver Account', key: 'receiver', placeholder: 'ACCT002' },
              { label: 'Amount (₹)', key: 'amount', placeholder: '500000' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {label}
                </label>
                <input
                  className="input-dark"
                  style={{ width: '100%' }}
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}

            <div>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Currency
              </label>
              <select className="select-dark" style={{ width: '100%' }} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleScore}
            disabled={scoring}
          >
            {scoring ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                Scoring...
              </>
            ) : (
              <>
                <Send size={13} />
                Score Transaction
              </>
            )}
          </button>

          <AnimatePresence>
            {scoreResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  padding: 14,
                  background: 'var(--bg-overlay)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  borderLeft: `3px solid ${getRiskColor(getRiskFromScore(scoreResult.risk_score * 100))}`,
                }}
              >
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>
                  {scoreResult.transaction_id}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: getRiskColor(getRiskFromScore(scoreResult.risk_score * 100)) }}>
                      {(scoreResult.risk_score * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Fraud Probability</div>
                  </div>
                  <RiskBadge level={getRiskFromScore(scoreResult.risk_score * 100)} />
                </div>
                <ProbabilityBar value={scoreResult.risk_score} height={6} />
                {scoreResult.flags.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>FLAGS</div>
                    {scoreResult.flags.map((f, i) => (
                      <div key={i} style={{ fontSize: 11, color: 'var(--accent-amber)', fontFamily: 'JetBrains Mono, monospace' }}>
                        · {f}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
