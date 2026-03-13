'use client'

import { motion } from 'framer-motion'
import { TYPOLOGIES } from '@/lib/landing-data'

// SVG icons for each typology
const LayeringIcon = ({ color }: { color: string }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    {[0, 1, 2].map((row) => (
      <g key={row}>
        <line x1={2 + row * 2} y1={6 + row * 8} x2={22 - row * 2} y2={6 + row * 8} stroke={color} strokeWidth="2" strokeLinecap="round" />
        <polygon points={`${22 - row * 2},${3 + row * 8} ${26 - row * 2},${6 + row * 8} ${22 - row * 2},${9 + row * 8}`} fill={color} />
      </g>
    ))}
  </svg>
)

const CircularIcon = ({ color }: { color: string }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="5" r="3" fill={color} />
    <circle cx="24" cy="21" r="3" fill={color} />
    <circle cx="4" cy="21" r="3" fill={color} />
    <path d="M14 8 C20 8 24 14 24 18" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" markerEnd={`url(#arr-${color})`} />
    <path d="M24 18 C24 26 8 26 4 18" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M4 18 C4 10 10 8 14 8" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <polygon points="12,5 16,5 14,9" fill={color} transform="rotate(60, 14, 7) translate(0,-2)" />
  </svg>
)

const StructuringIcon = ({ color }: { color: string }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    {[{ h: 20, x: 2 }, { h: 16, x: 8 }, { h: 22, x: 14 }, { h: 18, x: 20 }].map((b, i) => (
      <rect key={i} x={b.x} y={26 - b.h} width="4" height={b.h} rx="1" fill={color} fillOpacity="0.7" />
    ))}
    <line x1="0" y1="8" x2="28" y2="8" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
    <text x="1" y="6.5" fontSize="5" fill={color} fontFamily="monospace">₹10L</text>
  </svg>
)

const DormantIcon = ({ color }: { color: string }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="16" r="8" stroke={color} strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
    <circle cx="14" cy="16" r="4" fill={color} fillOpacity="0.3" />
    {/* Spark lines */}
    <line x1="14" y1="4" x2="14" y2="1" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="22" y1="8" x2="24" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="6" y1="8" x2="4" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="22" y1="16" x2="25" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    {/* Arrow indicating activation */}
    <path d="M11 13 L14 16 L17 13" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const KYCIcon = ({ color }: { color: string }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="2" y="6" width="24" height="16" rx="2" stroke={color} strokeWidth="1.5" fill="none" strokeOpacity="0.6" />
    <circle cx="9" cy="14" r="3" stroke={color} strokeWidth="1.2" fill="none" />
    <line x1="15" y1="11" x2="24" y2="11" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5" />
    <line x1="15" y1="14" x2="22" y2="14" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5" />
    {/* Warning triangle */}
    <polygon points="19,18 25,18 22,13.5" fill="#FFB547" />
    <line x1="22" y1="14.5" x2="22" y2="16.5" stroke="#0A0B0F" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="22" cy="17.5" r="0.6" fill="#0A0B0F" />
  </svg>
)

const ICONS = [LayeringIcon, CircularIcon, StructuringIcon, DormantIcon, KYCIcon]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
}

export function Typologies() {
  return (
    <section
      id="typologies"
      style={{ padding: '100px 32px', maxWidth: '1280px', margin: '0 auto' }}
    >
      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: '56px' }}
      >
        <p
          style={{
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#A78BFA',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          GNN Pattern Detection
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
          What we detect
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: '#9299AD',
            maxWidth: '540px',
            margin: '0 auto',
            lineHeight: 1.65,
          }}
        >
          Five money-laundering patterns identified by GNN graph traversal and pattern-aware encoding
        </p>
      </motion.div>

      {/* Cards grid */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={stagger}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
        }}
        className="typologies-grid"
      >
        {TYPOLOGIES.map((t, i) => {
          const Icon = ICONS[i]
          return (
            <motion.div
              key={t.id}
              variants={fadeUp}
              style={{
                background: '#0F1117',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default',
              }}
              whileHover={{
                y: -4,
                borderColor: `${t.accent}40`,
                boxShadow: `0 8px 32px ${t.accent}15`,
              }}
            >
              {/* Icon container */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: t.accentDim,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon color={t.accent} />
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#EDF0F7',
                    marginBottom: '8px',
                    lineHeight: 1.3,
                  }}
                >
                  {t.title}
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#9299AD',
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {t.body}
                </p>
              </div>

              {/* Tag pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#161922',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '999px',
                  padding: '3px 10px',
                  fontSize: '9.5px',
                  color: '#4A5068',
                  fontFamily: "'JetBrains Mono', monospace",
                  width: 'fit-content',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {t.tag}
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      <style jsx>{`
        @media (max-width: 1200px) {
          .typologies-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .typologies-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
