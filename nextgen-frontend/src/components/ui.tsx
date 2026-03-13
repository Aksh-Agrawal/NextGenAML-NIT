'use client'

import { cn, getRiskColor } from '@/lib/utils'
import type { RiskLevel } from '@/lib/api'

interface RiskBadgeProps {
  level: RiskLevel | string
  size?: 'sm' | 'md'
  className?: string
}

const LEVEL_LABELS: Record<string, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
}

export function RiskBadge({ level, size = 'md', className }: RiskBadgeProps) {
  const normalized = level?.toLowerCase() as RiskLevel
  return (
    <span
      className={cn(
        'risk-badge',
        `risk-badge-${normalized}`,
        size === 'sm' && 'text-[9px] py-0.5 px-1.5',
        className,
      )}
    >
      {LEVEL_LABELS[normalized] ?? level?.toUpperCase()}
    </span>
  )
}

interface ProbabilityBarProps {
  value: number // 0-1
  className?: string
  showLabel?: boolean
  height?: number
}

export function ProbabilityBar({ value, className, showLabel = false, height = 6 }: ProbabilityBarProps) {
  const pct = Math.min(100, Math.max(0, value * 100))
  const color =
    pct >= 75 ? 'var(--accent-red)' :
    pct >= 50 ? 'var(--accent-amber)' :
    pct >= 25 ? 'var(--accent-blue)' : 'var(--accent-green)'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="prob-bar-track flex-1" style={{ height }}>
        <div
          className="prob-bar-fill"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: pct >= 75 ? `0 0 8px ${color}40` : 'none',
          }}
        />
      </div>
      {showLabel && (
        <span style={{
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace',
          color,
          minWidth: 36,
          textAlign: 'right',
        }}>
          {pct.toFixed(0)}%
        </span>
      )}
    </div>
  )
}

interface LoadingStateProps {
  variant?: 'skeleton' | 'spinner' | 'pulse'
  lines?: number
  className?: string
  message?: string
}

export function LoadingState({ variant = 'skeleton', lines = 3, className, message }: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
        <div className="spinner spinner-lg" />
        {message && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{message}</span>}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent-purple)',
                animation: `dot-blink 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  // skeleton
  return (
    <div className={cn('space-y-3 p-4', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height: 16,
            width: i === lines - 1 ? '60%' : '100%',
            opacity: 1 - i * 0.15,
          }}
        />
      ))}
    </div>
  )
}

interface ErrorCardProps {
  message?: string
  onRetry?: () => void
}

export function ErrorCard({ message = 'Failed to load data', onRetry }: ErrorCardProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255,61,87,0.1)',
          border: '1px solid rgba(255,61,87,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-red)',
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        !
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{message}</p>
      {onRetry && (
        <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

interface StatPillProps {
  label: string
  value: string | number
  color?: string
}

export function StatPill({ label, value, color }: StatPillProps) {
  return (
    <div className="stat-pill">
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
      <span style={{
        fontSize: 16,
        fontWeight: 700,
        fontFamily: 'JetBrains Mono, monospace',
        color: color ?? 'var(--text-primary)',
      }}>
        {value}
      </span>
    </div>
  )
}
