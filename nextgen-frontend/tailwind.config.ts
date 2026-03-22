import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-base": "#FFFFFF",
        "bg-surface": "#E8F2FB",
        "bg-elevated": "#FFFFFF",
        "bg-overlay": "#F8FAFC",
        "accent-red": "#DA251C",
        "accent-amber": "#F59E0B",
        "accent-blue": "#00579C",
        "accent-green": "#16A34A",
        "accent-purple": "#9333EA",
        "dark-blue": "#003F7A",
        charcoal: "#333333",
        "mid-grey": "#666666",
        "border-grey": "#CCCCCC",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      animation: {
        "ring-pulse": "ring-pulse 2s ease-in-out infinite",
        "dot-blink": "dot-blink 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
// touch
