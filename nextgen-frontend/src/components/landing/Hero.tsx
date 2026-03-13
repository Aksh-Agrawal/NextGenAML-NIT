'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// Animated hero graph canvas
const NODE_COUNT = 14
const FLAGGED_INDICES = [1, 4, 9, 12]
const RED_EDGES = [[1, 4], [4, 9], [9, 12], [12, 1]]

interface NodePos { x: number; y: number; r: number; label: string }

function generateNodes(w: number, h: number): NodePos[] {
  // Use deterministic positions for SSR compatibility
  const positions = [
    { x: 0.12, y: 0.18 }, { x: 0.35, y: 0.12 }, { x: 0.62, y: 0.08 }, { x: 0.85, y: 0.22 },
    { x: 0.75, y: 0.45 }, { x: 0.55, y: 0.55 }, { x: 0.30, y: 0.48 }, { x: 0.08, y: 0.55 },
    { x: 0.18, y: 0.78 }, { x: 0.42, y: 0.82 }, { x: 0.68, y: 0.75 }, { x: 0.88, y: 0.65 },
    { x: 0.50, y: 0.32 }, { x: 0.22, y: 0.32 },
  ]
  const ids = ['8921', '4512', '7703', '2247', '9981', '3345', '1138', '6620', '5512', '8834', '7201', '4409', '9001', '1337']
  return positions.map((p, i) => ({
    x: p.x * w,
    y: p.y * h,
    r: FLAGGED_INDICES.includes(i) ? 9 : 6 + Math.floor(i % 3) * 2,
    label: `ACCT-${ids[i]}`,
  }))
}

const GREY_EDGES = [[0, 6], [0, 13], [2, 3], [2, 5], [3, 4], [5, 6], [6, 13], [7, 8], [8, 9], [10, 11], [10, 5], [11, 3]]

function HeroGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const pulseRef = useRef(0)
  const travelRef = useRef(0)
  const amberRef = useRef({ edge: -1, opacity: 0 })
  const amberTimerRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const nodes = generateNodes(W, H)

    const amberEdges = [[2, 12], [5, 10], [7, 13], [0, 8]]

    function drawDotGrid() {
      ctx!.fillStyle = 'rgba(255,255,255,0.025)'
      for (let x = 15; x < W; x += 30) {
        for (let y = 15; y < H; y += 30) {
          ctx!.beginPath()
          ctx!.arc(x, y, 1, 0, Math.PI * 2)
          ctx!.fill()
        }
      }
    }

    function drawEdge(a: number, b: number, color: string, opacity: number, width: number) {
      const na = nodes[a], nb = nodes[b]
      ctx!.beginPath()
      ctx!.moveTo(na.x, na.y)
      ctx!.lineTo(nb.x, nb.y)
      ctx!.strokeStyle = color
      ctx!.globalAlpha = opacity
      ctx!.lineWidth = width
      ctx!.stroke()
      ctx!.globalAlpha = 1
    }

    function drawTravelDot(edgeIdx: number, progress: number) {
      const [a, b] = RED_EDGES[edgeIdx]
      const na = nodes[a], nb = nodes[b]
      const x = na.x + (nb.x - na.x) * progress
      const y = na.y + (nb.y - na.y) * progress
      ctx!.beginPath()
      ctx!.arc(x, y, 3.5, 0, Math.PI * 2)
      ctx!.fillStyle = '#FF3D57'
      ctx!.shadowColor = '#FF3D57'
      ctx!.shadowBlur = 12
      ctx!.fill()
      ctx!.shadowBlur = 0
    }

    let last = 0
    function frame(ts: number) {
      const dt = Math.min(ts - last, 50)
      last = ts
      pulseRef.current = (pulseRef.current + dt * 0.0015) % (Math.PI * 2)
      travelRef.current = (travelRef.current + dt * 0.0004) % 1
      amberTimerRef.current += dt

      if (amberTimerRef.current > 4000) {
        amberTimerRef.current = 0
        amberRef.current = {
          edge: Math.floor(Math.random() * amberEdges.length),
          opacity: 1,
        }
      }
      if (amberRef.current.opacity > 0) {
        amberRef.current.opacity = Math.max(0, amberRef.current.opacity - dt * 0.0006)
      }

      ctx!.clearRect(0, 0, W, H)
      drawDotGrid()

      // Grey edges
      for (const [a, b] of GREY_EDGES) drawEdge(a, b, '#9299AD', 0.18, 1)

      // Red edges
      for (const [a, b] of RED_EDGES) {
        drawEdge(a, b, '#FF3D57', 0.8, 1.5)
        // Glow pass
        ctx!.beginPath()
        ctx!.moveTo(nodes[a].x, nodes[a].y)
        ctx!.lineTo(nodes[b].x, nodes[b].y)
        ctx!.strokeStyle = '#FF3D57'
        ctx!.globalAlpha = 0.15
        ctx!.lineWidth = 6
        ctx!.stroke()
        ctx!.globalAlpha = 1
        ctx!.lineWidth = 1
      }

      // Amber flash edge
      if (amberRef.current.edge >= 0 && amberRef.current.opacity > 0) {
        const [a, b] = amberEdges[amberRef.current.edge]
        drawEdge(a, b, '#FFB547', amberRef.current.opacity * 0.9, 1.5)
      }

      // Travelling dot
      const travelEdge = Math.floor(travelRef.current * RED_EDGES.length)
      const travelProg = (travelRef.current * RED_EDGES.length) % 1
      drawTravelDot(travelEdge, travelProg)

      // Nodes
      nodes.forEach((n, i) => {
        const isFlagged = FLAGGED_INDICES.includes(i)
        const pulse = Math.sin(pulseRef.current + i * 0.8) * 0.5 + 0.5

        // Pulse ring for flagged
        if (isFlagged) {
          const ringR = n.r + 4 + pulse * 8
          ctx!.beginPath()
          ctx!.arc(n.x, n.y, ringR, 0, Math.PI * 2)
          ctx!.strokeStyle = '#FF3D57'
          ctx!.globalAlpha = (1 - pulse) * 0.6
          ctx!.lineWidth = 1.5
          ctx!.stroke()
          ctx!.globalAlpha = 1
        }

        // Node fill
        ctx!.beginPath()
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        if (isFlagged) {
          const grad = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
          grad.addColorStop(0, 'rgba(255,61,87,0.9)')
          grad.addColorStop(1, 'rgba(255,61,87,0.4)')
          ctx!.fillStyle = grad
          ctx!.shadowColor = '#FF3D57'
          ctx!.shadowBlur = 12
        } else {
          ctx!.fillStyle = '#161922'
          ctx!.shadowBlur = 0
        }
        ctx!.fill()
        ctx!.shadowBlur = 0

        // Node border
        ctx!.beginPath()
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx!.strokeStyle = isFlagged ? 'rgba(255,61,87,0.8)' : 'rgba(167,139,250,0.3)'
        ctx!.lineWidth = isFlagged ? 1.5 : 1
        ctx!.stroke()
      })

      animRef.current = requestAnimationFrame(frame)
    }

    animRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={420}
      title="AML Transaction Network Graph"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
}

export function Hero() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glows */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: '10%',
            top: '20%',
            width: '600px',
            height: '500px',
            background: 'radial-gradient(ellipse at center, rgba(167,139,250,0.06) 0%, transparent 65%)',
            animation: 'floatGlow 8s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '5%',
            top: '35%',
            width: '500px',
            height: '400px',
            background: 'radial-gradient(ellipse at center, rgba(77,142,255,0.05) 0%, transparent 55%)',
            animation: 'floatGlow 10s ease-in-out infinite reverse',
          }}
        />
      </div>

      <div
        style={{
          maxWidth: '1280px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '64px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
        className="hero-grid"
      >
        {/* Left: Copy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Eyebrow badge */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.2}
            variants={fadeUp}
            style={{ display: 'inline-flex', width: 'fit-content' }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,61,87,0.12)',
                border: '1px solid rgba(255,61,87,0.3)',
                borderRadius: '999px',
                padding: '5px 14px',
                fontSize: '11px',
                color: '#FF3D57',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.3px',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#FF3D57',
                  animation: 'ringPulse 2s ease-in-out infinite',
                  flexShrink: 0,
                }}
              />
              LIVE &nbsp;·&nbsp; Problem Statement 3 · Union Bank of India
            </div>
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0.4}
            variants={fadeUp}
            style={{
              fontSize: 'clamp(40px, 5vw, 68px)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-1.5px',
              background: 'linear-gradient(135deg, #EDF0F7 0%, #A78BFA 55%, #4D8EFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
            }}
          >
            Next-Generation
            <br />
            AML Intelligence
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.6}
            variants={fadeUp}
            style={{
              fontSize: '18px',
              color: '#9299AD',
              maxWidth: '480px',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            Graph Neural Networks that trace every rupee through the financial system — detecting laundering before it lands.
          </motion.p>

          {/* Stat pills */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.8}
            variants={fadeUp}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}
          >
            {[
              { value: '93%', label: 'Precision', color: '#FF3D57' },
              { value: '12ms', label: 'Inference', color: '#4D8EFF' },
              { value: '5', label: 'AML Typologies', color: '#A78BFA' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: '#161922',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '999px',
                  padding: '5px 14px',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#EDF0F7',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: s.color,
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${s.color}`,
                  }}
                />
                <span style={{ color: s.color, fontWeight: 600 }}>{s.value}</span>
                <span style={{ color: '#9299AD' }}>{s.label}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={1.0}
            variants={fadeUp}
            style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}
          >
            <a
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#4D8EFF',
                color: 'white',
                borderRadius: '10px',
                padding: '13px 26px',
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 0 24px rgba(77,142,255,0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.12)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Explore System
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href="#architecture"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                color: '#9299AD',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                padding: '13px 26px',
                fontSize: '15px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#161922'
                e.currentTarget.style.color = '#EDF0F7'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#9299AD'
              }}
            >
              View Architecture
            </a>
          </motion.div>
        </div>

        {/* Right: Graph visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
          style={{ position: 'relative' }}
        >
          <div
            style={{
              position: 'relative',
              background: '#0F1117',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 60px rgba(167,139,250,0.04), 0 0 80px rgba(77,142,255,0.06)',
              aspectRatio: '480/420',
            }}
          >
            {mounted && <HeroGraph />}

            {/* Overlay badges */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(167,139,250,0.12)',
                border: '1px solid rgba(167,139,250,0.25)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '10px',
                color: '#A78BFA',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              LineMVGNN v2.0
            </div>
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,61,87,0.12)',
                border: '1px solid rgba(255,61,87,0.25)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '10px',
                color: '#FF3D57',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#FF3D57',
                  animation: 'dotBlink 1.5s ease-in-out infinite',
                }}
              />
              Processing
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '9px',
                color: '#4A5068',
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: 'nowrap',
              }}
            >
              Memgraph · 5,000 accounts · 500K transactions
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes ringPulse {
          0% { box-shadow: 0 0 0 0 rgba(255,61,87,0.5); }
          70% { box-shadow: 0 0 0 8px rgba(255,61,87,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,61,87,0); }
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes floatGlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
