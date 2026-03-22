'use client'

import { motion } from 'framer-motion'
import { HOW_IT_WORKS_STEPS } from '@/lib/landing-data'

export function HowItWorks() {
  return (
    <section
      style={{ padding: '100px 32px', maxWidth: '960px', margin: '0 auto' }}
    >
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: '72px' }}
      >
        <p
          style={{
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#FFB547',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          Pipeline
        </p>
        <h2
          style={{
            fontSize: 'clamp(28px, 3.5vw, 42px)',
            fontWeight: 700,
            color: '#333333',
            letterSpacing: '-0.5px',
          }}
        >
          The intelligence pipeline
        </h2>
      </motion.div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {HOW_IT_WORKS_STEPS.map((step, i) => {
          const isLeft = i % 2 === 0
          return (
            <div key={step.number} style={{ position: 'relative' }}>
              {/* Connecting line */}
              {i < HOW_IT_WORKS_STEPS.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: '-32px',
                    width: '1px',
                    height: '32px',
                    background: '#CCCCCC',
                    transform: 'translateX(-50%)',
                    zIndex: 0,
                  }}
                />
              )}

              <motion.div
                initial={{ opacity: 0, x: isLeft ? -32 : 32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: 'flex',
                  flexDirection: isLeft ? 'row' : 'row-reverse',
                  gap: '48px',
                  alignItems: 'flex-start',
                  marginBottom: '48px',
                  position: 'relative',
                  zIndex: 1,
                }}
                className="how-step"
              >
                {/* Content side */}
                <div style={{ flex: 1, paddingTop: '8px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: `${step.accent}20`,
                        border: `1px solid ${step.accent}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: step.accent,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {step.number}
                    </div>
                    <h3
                      style={{
                        fontSize: '19px',
                        fontWeight: 600,
                        color: '#333333',
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      {step.title}
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#9299AD',
                      lineHeight: 1.7,
                      marginBottom: '16px',
                      maxWidth: '380px',
                    }}
                  >
                    {step.body}
                  </p>

                  {/* Code block */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CCCCCC',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '12px',
                      color: '#c8ccd8',
                      overflowX: 'auto',
                      borderLeft: `3px solid ${step.accent}50`,
                    }}
                  >
                    <span style={{ color: step.accent, opacity: 0.7 }}>$ </span>
                    {step.code}
                  </div>
                </div>

                {/* Number side */}
                <div
                  style={{
                    flexShrink: 0,
                    width: '80px',
                    display: 'flex',
                    justifyContent: 'center',
                    paddingTop: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '72px',
                      fontWeight: 100,
                      color: step.accent,
                      opacity: 0.15,
                      lineHeight: 1,
                      fontFamily: "'JetBrains Mono', monospace",
                      userSelect: 'none',
                    }}
                  >
                    {step.number}
                  </span>
                </div>
              </motion.div>
            </div>
          )
        })}
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .how-step {
            flex-direction: column !important;
            gap: 16px !important;
          }
          .how-step > div:last-child {
            display: none !important;
          }
        }
      `}</style>
    </section>
  )
}
