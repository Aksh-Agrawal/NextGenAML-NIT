'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { AlertItem } from '@/lib/api'
import { getRiskColor, getRiskFromScore } from '@/lib/utils'
import * as d3 from 'd3'

interface MiniGraphProps {
  alerts: AlertItem[]
}

export function MiniGraph({ alerts }: MiniGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!svgRef.current || alerts.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const W = svgRef.current.clientWidth || 400
    const H = svgRef.current.clientHeight || 320

    // Build nodes and synthetic links
    const nodes = alerts.slice(0, 20).map((a) => ({
      id: a.account_id,
      risk: a.risk_score,
      r: 6 + (a.risk_score / 100) * 10,
    }))

    const links: { source: string; target: string; weight: number }[] = []
    for (let i = 0; i < Math.min(nodes.length - 1, 18); i++) {
      links.push({
        source: nodes[i].id,
        target: nodes[(i + 1) % nodes.length].id,
        weight: Math.random(),
      })
      if (i % 3 === 0 && i + 2 < nodes.length) {
        links.push({
          source: nodes[i].id,
          target: nodes[i + 2].id,
          weight: Math.random(),
        })
      }
    }

    const sim = d3
      .forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(60).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide((d: any) => d.r + 4))

    const g = svg.append('g')

    // Edges
    const edgeEl = g
      .selectAll('.edge')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'edge-path')
      .attr('stroke', (d) => (d.weight > 0.6 ? 'var(--accent-red)' : d.weight > 0.35 ? 'var(--accent-amber)' : 'var(--text-muted)'))
      .attr('stroke-width', (d) => (d.weight > 0.6 ? 1.5 : 1))
      .attr('stroke-opacity', (d) => (d.weight > 0.6 ? 0.8 : 0.35))

    // Nodes
    const nodeGroup = g
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (e, d) => router.push(`/fund-flow/${encodeURIComponent(d.id)}`)
      )

    nodeGroup
      .append('circle')
      .attr('r', 0)
      .attr('fill', (d) => {
        const level = getRiskFromScore(d.risk)
        return getRiskColor(level)
      })
      .attr('fill-opacity', 0.9)
      .attr('stroke', (d) => {
        const level = getRiskFromScore(d.risk)
        return getRiskColor(level)
      })
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.5)
      .transition()
      .duration(500)
      .delay((_, i) => i * 40)
      .attr('r', (d) => d.r)

    // Hover effect
    nodeGroup
      .on('mouseover', function(e, d) {
        d3.select(this).select('circle')
          .transition().duration(100)
          .attr('r', d.r * 1.3)
          .attr('stroke-width', 3)
      })
      .on('mouseout', function(e, d) {
        d3.select(this).select('circle')
          .transition().duration(100)
          .attr('r', d.r)
          .attr('stroke-width', 1.5)
      })

    sim.on('tick', () => {
      edgeEl
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    return () => {
      sim.stop()
    }
  }, [alerts, router])

  return (
    <div style={{ flex: 1, position: 'relative', minHeight: 200 }}>
      <svg
        ref={svgRef}
        className="graph-canvas"
        width="100%"
        height="100%"
        style={{ display: 'block', background: 'transparent' }}
      />
      {alerts.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          No flagged accounts to display
        </div>
      )}
    </div>
  )
}
