import { FundFlowGraph } from '@/components/FundFlowGraph'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function generateStaticParams() {
  return [{ accountId: 'demo-account' }]
}

export default async function FundFlowAccountPage({ params }: { params: Promise<{ accountId: string }> }) {
  const resolvedParams = await params;
  const decodedId = decodeURIComponent(resolvedParams.accountId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '10px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--bg-surface)',
        flexShrink: 0,
      }}>
        <Link href="/fund-flow" className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }}>
          <ArrowLeft size={13} />
          Back
        </Link>
        <div style={{ height: 16, width: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Analyzing account:</span>
        <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-purple)' }}>
          {decodedId}
        </span>
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <FundFlowGraph accountId={decodedId} />
      </div>
    </div>
  )
}
