'use client'

import { motion } from 'framer-motion'

const ShieldLogo = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="attrLogoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#003F7A" />
        <stop offset="100%" stopColor="#00579C" />
      </linearGradient>
    </defs>
    <path
      d="M24 4L8 11V24C8 33.4 15.2 41.6 24 44C32.8 41.6 40 33.4 40 24V11L24 4Z"
      fill="url(#attrLogoGrad)"
      fillOpacity="0.15"
      stroke="url(#attrLogoGrad)"
      strokeWidth="1.5"
    />
    <circle cx="24" cy="14" r="2.5" fill="url(#attrLogoGrad)" />
    <circle cx="16" cy="22" r="2" fill="url(#attrLogoGrad)" />
    <circle cx="32" cy="22" r="2" fill="url(#attrLogoGrad)" />
    <circle cx="20" cy="30" r="2" fill="url(#attrLogoGrad)" />
    <circle cx="28" cy="30" r="2" fill="url(#attrLogoGrad)" />
    <line x1="24" y1="14" x2="16" y2="22" stroke="url(#attrLogoGrad)" strokeWidth="1" strokeOpacity="0.7" />
    <line x1="24" y1="14" x2="32" y2="22" stroke="url(#attrLogoGrad)" strokeWidth="1" strokeOpacity="0.7" />
    <line x1="16" y1="22" x2="20" y2="30" stroke="url(#attrLogoGrad)" strokeWidth="1" strokeOpacity="0.7" />
    <line x1="32" y1="22" x2="28" y2="30" stroke="url(#attrLogoGrad)" strokeWidth="1" strokeOpacity="0.7" />
    <line x1="16" y1="22" x2="32" y2="22" stroke="url(#attrLogoGrad)" strokeWidth="0.75" strokeOpacity="0.4" />
    <line x1="20" y1="30" x2="28" y2="30" stroke="url(#attrLogoGrad)" strokeWidth="0.75" strokeOpacity="0.4" />
  </svg>
)

const BADGES = [
  { icon: '🔥', label: 'Built with PyTorch GNN', color: '#DA251C' },
  { icon: '✨', label: 'Powered by Gemini 2.0 Flash', color: '#00579C' },
  { icon: '📋', label: 'FIU-IND Compliant', color: '#1A7A3C' },
]

export function Attribution() {
  return (
    <section
      style={{
        padding: '80px 32px',
        textAlign: 'center',
        borderTop: '1px solid #CCCCCC',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
      >
        <ShieldLogo />
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 500,
            color: '#333333',
            letterSpacing: '-0.5px',
            margin: 0,
          }}
        >
          NextGenAML
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: '#4A5068',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.2px',
          }}
        >
          Union Bank of India · Problem Statement 3 · Hackathon 2026
        </p>

        {/* Badges */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center',
            marginTop: '8px',
          }}
        >
          {BADGES.map((b) => (
            <div
              key={b.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#F8FAFC',
                border: '1px solid #CCCCCC',
                borderRadius: '999px',
                padding: '7px 18px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#9299AD',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${b.color}40`
                e.currentTarget.style.color = b.color
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#CCCCCC'
                e.currentTarget.style.color = '#9299AD'
              }}
            >
              <span style={{ fontSize: '14px' }}>{b.icon}</span>
              {b.label}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
