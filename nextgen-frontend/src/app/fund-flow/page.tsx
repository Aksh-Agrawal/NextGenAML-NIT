'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, GitFork } from 'lucide-react'
import { FundFlowGraph } from '@/components/FundFlowGraph'

const EXAMPLE_ACCOUNTS = [
  'SUS4007', 'SUS4008', 'SUS4002', 'USR1012', 'SUS4017',
]

export default function FundFlowPage() {
  const [accountId, setAccountId] = useState('SUS4007')
  const [inputVal, setInputVal] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    const val = inputVal.trim()
    if (val) setAccountId(val)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top search bar */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 400 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              className="input-dark"
              style={{ width: '100%', paddingLeft: 32 }}
              placeholder="Enter account ID..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={handleSearch}>
            <GitFork size={13} />
            Analyze
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Quick:</span>
          {EXAMPLE_ACCOUNTS.map((id) => (
            <button
              key={id}
              className="btn-ghost"
              style={{
                padding: '4px 8px',
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                background: accountId === id ? 'rgba(77,142,255,0.15)' : undefined,
                borderColor: accountId === id ? 'rgba(77,142,255,0.3)' : undefined,
                color: accountId === id ? 'var(--accent-blue)' : undefined,
              }}
              onClick={() => setAccountId(id)}
            >
              {id}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Viewing:</span>
          <span style={{
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--accent-purple)',
            fontWeight: 600,
          }}>
            {accountId}
          </span>
        </div>
      </div>

      {/* Graph fills remaining height */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--bg-base)', minHeight: 'calc(100vh - 112px)' }}>
        <FundFlowGraph accountId={accountId} />
      </div>
    </div>
  )
}
