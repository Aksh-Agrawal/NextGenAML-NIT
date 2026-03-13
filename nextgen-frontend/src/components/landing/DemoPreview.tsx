'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DEMO_ALERTS } from '@/lib/landing-data'

const TABS = ['Fund Flow Graph', 'Alert Triage', 'SAR Report']

const RISK_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  CRITICAL: { bg: 'rgba(255,61,87,0.12)', border: 'rgba(255,61,87,0.3)', color: '#FF3D57' },
  HIGH: { bg: 'rgba(255,181,71,0.12)', border: 'rgba(255,181,71,0.3)', color: '#FFB547' },
  MEDIUM: { bg: 'rgba(77,142,255,0.12)', border: 'rgba(77,142,255,0.3)', color: '#4D8EFF' },
  LOW: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', color: '#22C55E' },
}

// Simplified SVG graph for fund flow panel
function MiniNetworkGraph() {
  const nodes = [
    { id: 0, x: 80, y: 80, flagged: false },
    { id: 1, x: 200, y: 60, flagged: true },
    { id: 2, x: 310, y: 100, flagged: false },
    { id: 3, x: 270, y: 200, flagged: true },
    { id: 4, x: 150, y: 190, flagged: false },
    { id: 5, x: 60, y: 200, flagged: false },
    { id: 6, x: 380, y: 180, flagged: true },
    { id: 7, x: 220, y: 280, flagged: false },
  ]
  const edges = [
    { a: 0, b: 1, red: false }, { a: 1, b: 2, red: true }, { a: 2, b: 3, red: true },
    { a: 3, b: 1, red: true }, { a: 4, b: 5, red: false }, { a: 3, b: 6, red: false },
    { a: 4, b: 1, red: false }, { a: 7, b: 3, red: false }, { a: 5, b: 0, red: false },
  ]
  return (
    <svg viewBox="0 0 440 310" style={{ width: '100%', height: '100%' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {edges.map((e, i) => (
        <line
          key={i}
          x1={nodes[e.a].x} y1={nodes[e.a].y}
          x2={nodes[e.b].x} y2={nodes[e.b].y}
          stroke={e.red ? '#FF3D57' : '#9299AD'}
          strokeOpacity={e.red ? 0.8 : 0.2}
          strokeWidth={e.red ? 1.5 : 1}
          filter={e.red ? 'url(#glow)' : undefined}
        />
      ))}
      {nodes.map((n) => (
        <g key={n.id}>
          {n.flagged && (
            <circle cx={n.x} cy={n.y} r="14" fill="rgba(255,61,87,0.08)" stroke="rgba(255,61,87,0.3)" strokeWidth="1" />
          )}
          <circle
            cx={n.x} cy={n.y} r={n.flagged ? 8 : 6}
            fill={n.flagged ? 'rgba(255,61,87,0.6)' : '#161922'}
            stroke={n.flagged ? '#FF3D57' : 'rgba(167,139,250,0.4)'}
            strokeWidth="1.5"
            filter={n.flagged ? 'url(#glow)' : undefined}
          />
        </g>
      ))}
    </svg>
  )
}

const SAR_XML = `<?xml version="1.0" encoding="UTF-8"?>
<FIU-IND_ARF_Report xmlns="http://fiu.gov.in/schema">
  <ReportHeader>
    <ReportType>ARF</ReportType>
    <ReportDate>2026-03-13</ReportDate>
    <ReportingEntity>Union Bank of India</ReportingEntity>
  </ReportHeader>
  <SuspiciousTransaction>
    <AccountID>ACCT-8921</AccountID>
    <RiskScore>0.93</RiskScore>
    <Typologies>
      <Typology>Circular Round-Trip (3-hop)</Typology>
      <Typology>Rapid Layering</Typology>
    </Typologies>
    <TransactionAmount currency="INR">37400</TransactionAmount>
    <NarrativeReport>
      The account ACCT-8921 exhibits patterns consistent
      with circular money flow through 3-hop cycle involving
      accounts ACCT-4512 and ACCT-9981. LineMVGNN model
      confidence: 93%. Recommended action: Freeze and
      report to FIU-IND within 7 days.
    </NarrativeReport>
  </SuspiciousTransaction>
</FIU-IND_ARF_Report>`

function FundFlowPanel() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 220px', height: '100%', gap: 0 }}>
      {/* Account list */}
      <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: '12px 0', overflowY: 'auto' }}>
        <div style={{ padding: '6px 12px', fontSize: '9px', color: '#4A5068', fontFamily: 'monospace', letterSpacing: '1.5px', marginBottom: '4px' }}>
          ACCOUNTS
        </div>
        {DEMO_ALERTS.map((a) => {
          const rc = RISK_COLORS[a.risk]
          return (
            <div
              key={a.id}
              style={{
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#EDF0F7' }}>{a.id}</span>
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: rc.bg,
                  border: `1px solid ${rc.border}`,
                  color: rc.color,
                }}
              >
                {a.risk}
              </span>
            </div>
          )
        })}
      </div>

      {/* Graph */}
      <div style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#06070B' }}>
        <MiniNetworkGraph />
      </div>

      {/* Detail panel */}
      <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '9px', color: '#4A5068', fontFamily: 'monospace', letterSpacing: '1px' }}>ACCOUNT DETAIL</div>
        <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#EDF0F7', fontWeight: 600 }}>ACCT-8921</div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,61,87,0.12)',
            border: '1px solid rgba(255,61,87,0.3)',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            color: '#FF3D57',
            fontFamily: 'monospace',
            fontWeight: 600,
            width: 'fit-content',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF3D57', animation: 'demoPulse 2s infinite' }} />
          CRITICAL
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { label: 'Fraud Prob', value: '93%', color: '#FF3D57' },
            { label: 'Circular', value: '0.91', color: '#A78BFA' },
            { label: 'Layering', value: '0.87', color: '#FFB547' },
          ].map((s) => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#4A5068', fontFamily: 'monospace' }}>{s.label}</span>
              <span style={{ fontSize: '11px', color: s.color, fontFamily: 'monospace', fontWeight: 600 }}>{s.value}</span>
            </div>
          ))}
        </div>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        <button
          style={{
            background: 'rgba(255,61,87,0.12)',
            border: '1px solid rgba(255,61,87,0.3)',
            color: '#FF3D57',
            borderRadius: '8px',
            padding: '7px 12px',
            fontSize: '11px',
            fontFamily: 'monospace',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Investigate →
        </button>
      </div>
    </div>
  )
}

function AlertTriagePanel() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['Account ID', 'Risk', 'Probability', 'Patterns', 'Amount', 'Action'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  color: '#4A5068',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DEMO_ALERTS.map((a, i) => {
            const rc = RISK_COLORS[a.risk]
            return (
              <tr
                key={a.id}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: i === 0 ? 'rgba(255,61,87,0.04)' : 'transparent',
                  borderLeft: i === 0 ? '2px solid #FF3D57' : '2px solid transparent',
                }}
              >
                <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: '#EDF0F7', fontWeight: 500 }}>
                  {a.id}
                </td>
                <td style={{ padding: '11px 14px' }}>
                  <span
                    style={{
                      fontSize: '9px',
                      fontFamily: 'monospace',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: rc.bg,
                      border: `1px solid ${rc.border}`,
                      color: rc.color,
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {a.risk}
                  </span>
                </td>
                <td style={{ padding: '11px 14px', minWidth: '110px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        flex: 1,
                        height: '4px',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${a.prob}%`,
                          height: '100%',
                          background: a.probColor,
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: 'monospace', color: a.probColor, fontSize: '11px', fontWeight: 600 }}>
                      {a.prob}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {a.patterns.map((p) => (
                      <span
                        key={p}
                        style={{
                          fontSize: '9px',
                          fontFamily: 'monospace',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#161922',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: '#9299AD',
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: '#EDF0F7' }}>{a.amount}</td>
                <td style={{ padding: '11px 14px' }}>
                  <button
                    style={{
                      background: a.risk === 'CRITICAL' || a.risk === 'HIGH' ? rc.bg : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${a.risk === 'CRITICAL' || a.risk === 'HIGH' ? rc.border : 'rgba(255,255,255,0.06)'}`,
                      color: a.risk === 'CRITICAL' || a.risk === 'HIGH' ? rc.color : '#9299AD',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {a.risk === 'CRITICAL' || a.risk === 'HIGH' ? 'Investigate' : 'Review'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SARReportPanel() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: '100%', gap: 0 }}>
      {/* Form */}
      <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '9px', color: '#4A5068', fontFamily: 'monospace', letterSpacing: '1.5px' }}>
          SAR REPORT GENERATOR
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '10px', color: '#9299AD', fontFamily: 'monospace' }}>Account ID</label>
          <div
            style={{
              background: '#0A0B0F',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              padding: '7px 10px',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#EDF0F7',
            }}
          >
            ACCT-8921
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10px', color: '#9299AD', fontFamily: 'monospace' }}>Typologies</label>
          {['Circular Round-Trip', 'Rapid Layering'].map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', color: '#EDF0F7', fontFamily: 'monospace' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(167,139,250,0.3)', border: '1px solid rgba(167,139,250,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '8px', color: '#A78BFA' }}>✓</span>
              </div>
              {t}
            </div>
          ))}
        </div>
        <button
          style={{
            background: 'linear-gradient(135deg, #4D8EFF, #A78BFA)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 14px',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          ⚡ Generate Report
        </button>
      </div>

      {/* XML Preview */}
      <div
        style={{
          padding: '16px',
          overflowY: 'auto',
          background: '#06070B',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          lineHeight: 1.7,
        }}
      >
        <div style={{ marginBottom: '8px', fontSize: '9px', color: '#4A5068', letterSpacing: '1.5px' }}>
          FIU-IND ARF XML PREVIEW
        </div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {SAR_XML.split('\n').map((line, i) => {
            const tagMatch = line.match(/(<\/?[\w:-]+>?)/g)
            if (!tagMatch) return <span key={i} style={{ color: '#9299AD' }}>{line}{'\n'}</span>
            return (
              <span key={i}>
                {line.split(/(<\/?[\w:.-]+[^>]*>)/g).map((part, j) =>
                  part.startsWith('<') ? (
                    <span key={j} style={{ color: '#4D8EFF' }}>{part}</span>
                  ) : (
                    <span key={j} style={{ color: '#9299AD' }}>{part}</span>
                  )
                )}
                {'\n'}
              </span>
            )
          })}
        </pre>
      </div>
    </div>
  )
}

export function DemoPreview() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section
      id="demo"
      style={{ padding: '100px 32px', maxWidth: '1280px', margin: '0 auto' }}
    >
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: '48px' }}
      >
        <p
          style={{
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#22C55E',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          Live Platform
        </p>
        <h2
          style={{
            fontSize: 'clamp(28px, 3.5vw, 42px)',
            fontWeight: 700,
            color: '#EDF0F7',
            letterSpacing: '-0.5px',
            marginBottom: '14px',
          }}
        >
          See it in action
        </h2>
        <p style={{ fontSize: '16px', color: '#9299AD', lineHeight: 1.65 }}>
          Fund flow visualization · Alert triage · SAR report generation
        </p>
      </motion.div>

      {/* Browser mockup */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#06070B',
          overflow: 'hidden',
          boxShadow: '0 0 80px rgba(77,142,255,0.08), 0 0 200px rgba(167,139,250,0.04)',
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            height: '38px',
            background: '#0F1117',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            gap: '10px',
          }}
        >
          {/* Traffic lights */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['#FF3D57', '#FFB547', '#22C55E'].map((c) => (
              <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.7 }} />
            ))}
          </div>
          {/* URL bar */}
          <div
            style={{
              flex: 1,
              background: '#161922',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '10px',
              gap: '6px',
              maxWidth: '380px',
              margin: '0 auto',
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', opacity: 0.8 }} />
            <span style={{ fontSize: '10px', color: '#4A5068', fontFamily: 'monospace' }}>
              localhost:3000 — NextGenAML Dashboard
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: '#0A0B0F',
          }}
        >
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '10px 20px',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: activeTab === i ? '#EDF0F7' : '#4A5068',
                background: activeTab === i ? '#0F1117' : 'transparent',
                border: 'none',
                borderBottom: activeTab === i ? '2px solid #4D8EFF' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div style={{ height: '360px', overflow: 'hidden' }}>
          {activeTab === 0 && <FundFlowPanel />}
          {activeTab === 1 && <AlertTriagePanel />}
          {activeTab === 2 && <SARReportPanel />}
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes demoPulse {
          0% { box-shadow: 0 0 0 0 rgba(255,61,87,0.5); }
          70% { box-shadow: 0 0 0 6px rgba(255,61,87,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,61,87,0); }
        }
      `}</style>
    </section>
  )
}
