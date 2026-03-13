import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { RiskLevel } from './api'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAmount(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)}Cr`
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)}L`
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`
  return `₹${amount.toFixed(0)}`
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n)
}

export function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

export function getRiskColor(level: RiskLevel | string): string {
  switch (level?.toLowerCase()) {
    case 'critical': return '#FF3D57'
    case 'high': return '#FFB547'
    case 'medium': return '#4D8EFF'
    case 'low': return '#22C55E'
    default: return '#8B90A0'
  }
}

export function getRiskFromScore(score: number): RiskLevel {
  if (score >= 75) return 'critical'
  if (score >= 50) return 'high'
  if (score >= 25) return 'medium'
  return 'low'
}

export function getRiskFromProb(prob: number): RiskLevel {
  if (prob >= 0.75) return 'critical'
  if (prob >= 0.5) return 'high'
  if (prob >= 0.25) return 'medium'
  return 'low'
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export function formatTimestamp(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return dateStr
  }
}
