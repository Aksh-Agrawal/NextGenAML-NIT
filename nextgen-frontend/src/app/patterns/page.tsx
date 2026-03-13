'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, ChevronUp, RefreshCw,
  RotateCw, Filter, TrendingUp, Moon, Clock,
} from 'lucide-react'
import {
  BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  Cell,
} from 'recharts'
import * as d3 from 'd3'
import { useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { formatAmount, formatNumber, getRiskColor, getRiskFromScore } from '@/lib/utils'
import { RiskBadge, LoadingState, ErrorCard } from '@/components/ui'

function AccordionSection({
  title, icon, count, color, children, defaultOpen = false,
}: {
  title: string; icon: React.ReactNode; count?: number; color: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card overflow-hidden">
      <div className="accordion-header" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <div style={{ color }}>{icon}</div>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>{title}</h3>
          {count !== undefined && (
            <span style={{
              padding: '2px 8px', borderRadius: 4,
              background: `${color}20`, color,
              fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
            }}>
              {count} detected
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CircularGraph({ cycles }: { cycles: Array<{ account_chain: string[]; total_flow: number; cycle_length: number }> }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || cycles.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const W = 560, H = 280
    const g = svg.append('g')

    const cols = Math.min(3, cycles.length)
    const cellW = W / cols
    const cellH = H

    cycles.slice(0, 6).forEach((cycle, ci) => {
      const cx = (ci % cols) * cellW + cellW / 2
      const cy = Math.floor(ci / cols) * (H / 2) + (H / 4)
      const r = Math.min(cellW, cellH * 0.8) * 0.35
      const n = cycle.account_chain.length

      // Draw cycle ring
      cycle.account_chain.forEach((acc, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2
        const nextAngle = (2 * Math.PI * (i + 1)) / n - Math.PI / 2
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        const nx = cx + r * Math.cos(nextAngle)
        const ny = cy + r * Math.sin(nextAngle)

        // arc edge
        g.append('line')
          .attr('x1', x).attr('y1', y)
          .attr('x2', nx).attr('y2', ny)
          .attr('stroke', 'var(--accent-amber)')
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.7)
          .attr('stroke-dasharray', '4,3')

        // node
        g.append('circle')
          .attr('cx', x).attr('cy', y)
          .attr('r', 5)
          .attr('fill', 'var(--accent-amber)')
          .attr('fill-opacity', 0.85)
          .attr('stroke', 'rgba(255,181,71,0.4)')
          .attr('stroke-width', 2)
      })

      // Label
      g.append('text')
        .attr('x', cx).attr('y', cy)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('fill', 'var(--text-muted)')
        .style('font-size', '9px')
        .style('font-family', 'JetBrains Mono, monospace')
        .text(`${cycle.cycle_length}n · ${formatAmount(cycle.total_flow)}`)
    })
  }, [cycles])

  return (
    <svg ref={svgRef} width="100%" height="280" viewBox="0 0 560 280"
      style={{ background: 'var(--bg-base)', borderRadius: 8 }} />
  )
}

export default function PatternsPage() {
  const { data: circular = [], isLoading: cLoading, error: cError, refetch: rCircular } = useQuery({
    queryKey: ['patterns-circular'],
    queryFn: api.patternsCircular,
    staleTime: 60_000,
  })

  const { data: structuring = [], isLoading: sLoading, error: sError, refetch: rStructuring } = useQuery({
    queryKey: ['patterns-structuring'],
    queryFn: api.patternsStructuring,
    staleTime: 60_000,
  })

  const { data: dormant = [], isLoading: dLoading, error: dError, refetch: rDormant } = useQuery({
    queryKey: ['patterns-dormant'],
    queryFn: api.patternsDormant,
    staleTime: 60_000,
  })

  const structuringData = structuring.map((s) => ({
    id: s.sender.slice(-6),
    sender: s.sender,
    count: s.transactions,
    amount: s.total_amount,
    avg: s.avg_amount,
  }))

  const dormantData = dormant.map((d) => ({
    x: d.dormant_days,
    y: d.activation_amount,
    id: d.account_id,
    date: d.activation_date,
  }))

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Pattern Detector</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            ML-driven detection of circular flows, structuring, and dormant account activation
          </p>
        </div>
        <button
          className="btn-ghost"
          style={{ fontSize: 12 }}
          onClick={() => { rCircular(); rStructuring(); rDormant() }}
        >
          <RefreshCw size={13} />
          Refresh All
        </button>
      </div>

      {/* Summary Pills */}
      <div className="flex gap-3">
        {[
          { label: 'Circular Cycles', value: circular.length, color: 'var(--accent-amber)' },
          { label: 'Structuring Accounts', value: structuring.length, color: 'var(--accent-red)' },
          { label: 'Dormant Activations', value: dormant.length, color: 'var(--accent-purple)' },
        ].map((s) => (
          <div key={s.label} className="stat-pill" style={{ minWidth: 140 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</span>
            <span style={{ fontSize: 24, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: s.color }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Circular Transactions */}
      <AccordionSection
        title="Circular Transaction Cycles"
        icon={<RotateCw size={18} />}
        count={circular.length}
        color="var(--accent-amber)"
        defaultOpen
      >
        {cLoading ? (
          <LoadingState variant="pulse" message="Detecting circular patterns..." />
        ) : cError ? (
          <ErrorCard message="Failed to detect circular patterns" onRetry={() => rCircular()} />
        ) : circular.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            No circular transaction cycles detected at current threshold.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-6 mb-4">
              {[
                { label: 'Total Cycles', value: circular.length },
                { label: 'Avg Cycle Length', value: `${(circular.reduce((s, c) => s + c.cycle_length, 0) / circular.length).toFixed(1)} hops` },
                { label: 'Total Flow', value: formatAmount(circular.reduce((s, c) => s + c.total_flow, 0)) },
                { label: 'Largest Cycle', value: `${Math.max(...circular.map((c) => c.cycle_length))} hops` },
              ].map((stat) => (
                <div key={stat.label}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{stat.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-amber)' }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
            <CircularGraph cycles={circular} />
            <div style={{ overflowX: 'auto' }}>
              <table className="table-dark" style={{ marginTop: 12 }}>
                <thead><tr><th>Cycle Length</th><th>Account Chain</th><th>Total Flow</th></tr></thead>
                <tbody>
                  {circular.slice(0, 10).map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-amber)' }}>{c.cycle_length}</td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-secondary)' }}>
                        {c.account_chain.join(' → ')}
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-amber)' }}>
                        {formatAmount(c.total_flow)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AccordionSection>

      {/* Structuring */}
      <AccordionSection
        title="Structuring Patterns"
        icon={<Filter size={18} />}
        count={structuring.length}
        color="var(--accent-red)"
        defaultOpen
      >
        {sLoading ? (
          <LoadingState variant="pulse" message="Analyzing structuring patterns..." />
        ) : sError ? (
          <ErrorCard message="Failed to detect structuring" onRetry={() => rStructuring()} />
        ) : structuring.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            No structuring patterns detected.
          </div>
        ) : (
          <div className="space-y-4">
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={structuringData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis type="category" dataKey="id" width={60} tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-hover)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--text-muted)', fontSize: 11 }}
                    formatter={(v: any, n) => [n === 'count' ? `${v} txns` : formatAmount(v as number), n === 'count' ? 'Transactions' : 'Avg Amount']}
                  />
                  <ReferenceLine x={3} stroke="var(--accent-red)" strokeDasharray="4 3" label={{ value: 'Threshold', position: 'top', fill: 'var(--accent-red)', fontSize: 10 }} />
                  <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                    {structuringData.map((e, i) => (
                      <Cell key={i} fill={e.count >= 5 ? 'var(--accent-red)' : e.count >= 3 ? 'var(--accent-amber)' : 'var(--accent-blue)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table className="table-dark">
              <thead><tr><th>Account</th><th>Txn Count</th><th>Avg Amount</th><th>Total Amount</th><th>Window</th></tr></thead>
              <tbody>
                {structuring.slice(0, 10).map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{s.sender}</td>
                    <td>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        color: s.transactions >= 5 ? 'var(--accent-red)' : 'var(--accent-amber)',
                        fontWeight: 700,
                      }}>
                        {s.transactions}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-amber)' }}>{formatAmount(s.avg_amount)}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>{formatAmount(s.total_amount)}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                      {s.time_window_minutes.toFixed(0)}m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AccordionSection>

      {/* Dormant Accounts */}
      <AccordionSection
        title="Dormant Account Activations"
        icon={<Moon size={18} />}
        count={dormant.length}
        color="var(--accent-purple)"
        defaultOpen
      >
        {dLoading ? (
          <LoadingState variant="pulse" message="Scanning dormant accounts..." />
        ) : dError ? (
          <ErrorCard message="Failed to detect dormant accounts" onRetry={() => rDormant()} />
        ) : dormant.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            No dormant account activations detected.
          </div>
        ) : (
          <div className="space-y-4">
            {dormant.length > 0 && (
              <div className="flex gap-6 mb-2">
                {[
                  { label: 'Total Activated', value: dormant.length },
                  { label: 'Avg Dormancy', value: `${Math.round(dormant.reduce((s, d) => s + d.dormant_days, 0) / dormant.length)}d` },
                  { label: 'Total Exposure', value: formatAmount(dormant.reduce((s, d) => s + d.activation_amount, 0)) },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{stat.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-purple)' }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="x"
                    name="Dormant Days"
                    label={{ value: 'Dormant Days', position: 'bottom', fill: 'var(--text-muted)', fontSize: 11 }}
                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                  />
                  <YAxis
                    dataKey="y"
                    name="Activation Amount"
                    tickFormatter={(v) => formatAmount(v)}
                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-hover)', borderRadius: 8 }}
                    formatter={(v: any, n) => [n === 'Dormant Days' ? `${v} days` : formatAmount(v as number), n]}
                  />
                  <Scatter data={dormantData} fill="var(--accent-purple)" opacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </AccordionSection>
    </div>
  )
}
