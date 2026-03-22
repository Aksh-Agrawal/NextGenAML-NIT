'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ARCH_LAYERS, ARCH_STATS } from '@/lib/landing-data'

const ArrowRight = () => (
  <svg width="32" height="16" viewBox="0 0 32 16" fill="none" style={{ flexShrink: 0 }}>
    <defs>
      <linearGradient id="arrowGrad" x1="0" y1="0" x2="32" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00579C" />
        <stop offset="100%" stopColor="#003F7A" />
      </linearGradient>
    </defs>
    <line x1="0" y1="8" x2="26" y2="8" stroke="url(#arrowGrad)" strokeWidth="1.5" strokeDasharray="4 2" />
    <polygon points="26,4 32,8 26,12" fill="#003F7A" />
  </svg>
)

function ArchLayer({ layer, index, isInView }: { layer: (typeof ARCH_LAYERS)[0]; index: number; isInView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: '#F8FAFC',
        border: '1px solid #CCCCCC',
        borderRadius: '16px',
        padding: '20px',
        flex: 1,
        minWidth: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${layer.color}80, ${layer.color}20)`,
        }}
      />

      {/* Layer label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: layer.color,
            boxShadow: `0 0 6px ${layer.color}`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: '10px',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#4A5068',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}
        >
          {layer.name}
        </span>
      </div>

      {/* Tech name */}
      <p
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#333333',
          marginBottom: '12px',
          lineHeight: 1.3,
        }}
      >
        {layer.tech}
      </p>

      {/* Specs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {layer.specs.map((spec) => (
          <div
            key={spec}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#4A5068',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span style={{ color: layer.color, opacity: 0.6 }}>›</span>
            {spec}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export function Architecture() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section
      id="architecture"
      style={{
        padding: '100px 32px',
        background: '#FFFFFF',
        borderTop: '1px solid #CCCCCC',
        borderBottom: '1px solid #CCCCCC',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
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
              color: '#00579C',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            System Design
          </p>
          <h2
            style={{
              fontSize: 'clamp(28px, 3.5vw, 42px)',
              fontWeight: 700,
              color: '#333333',
              letterSpacing: '-0.5px',
              marginBottom: '14px',
            }}
          >
            System architecture
          </h2>
          <p style={{ fontSize: '16px', color: '#9299AD', lineHeight: 1.65 }}>
            Four layers of intelligence, end to end
          </p>
        </motion.div>

        {/* Pipeline */}
        <div
          ref={ref}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '48px',
            overflowX: 'auto',
            paddingBottom: '8px',
          }}
          className="arch-pipeline"
        >
          {ARCH_LAYERS.map((layer, i) => (
            <>
              <ArchLayer key={layer.id} layer={layer} index={i} isInView={isInView} />
              {i < ARCH_LAYERS.length - 1 && <ArrowRight key={`arrow-${i}`} />}
            </>
          ))}
        </div>

        {/* Stat boxes */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}
          className="arch-stats-grid"
        >
          {ARCH_STATS.map((s) => (
            <motion.div
              key={s.label}
              variants={{
                hidden: { opacity: 0, scale: 0.96 },
                visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
              }}
              style={{
                background: '#F8FAFC',
                border: '1px solid #CCCCCC',
                borderRadius: '16px',
                padding: '24px 28px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              <div
                style={{
                  width: '4px',
                  height: '40px',
                  borderRadius: '2px',
                  background: s.accent,
                  flexShrink: 0,
                  boxShadow: `0 0 12px ${s.accent}60`,
                }}
              />
              <div>
                <p
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#333333',
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1,
                    marginBottom: '4px',
                  }}
                >
                  {s.value}
                </p>
                <p style={{ fontSize: '12px', color: '#4A5068', fontFamily: "'JetBrains Mono', monospace" }}>
                  {s.label}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .arch-pipeline { flex-direction: column !important; }
          .arch-pipeline > svg { transform: rotate(90deg); }
          .arch-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
