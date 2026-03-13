import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0A0B0F',
        'bg-surface': '#111318',
        'bg-elevated': '#181C25',
        'bg-overlay': '#1E2333',
        'accent-red': '#FF3D57',
        'accent-amber': '#FFB547',
        'accent-blue': '#4D8EFF',
        'accent-green': '#22C55E',
        'accent-purple': '#A78BFA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'ring-pulse': 'ring-pulse 2s ease-in-out infinite',
        'dot-blink': 'dot-blink 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}

export default config
