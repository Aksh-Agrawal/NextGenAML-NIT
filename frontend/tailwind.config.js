/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'royal-navy': '#0A0F1F',
                'royal-gold': {
                    DEFAULT: '#D4AF37',
                    light: '#F4CF67',
                    dark: '#B48F17',
                },
                'soft-blue': '#4FA3FF',
                'fraud-red': '#FF4C4C',
                'glass-white': 'rgba(255, 255, 255, 0.05)',
                'glass-gold': 'rgba(212, 175, 55, 0.1)',
            },
            fontFamily: {
                playfair: ['"Playfair Display"', 'serif'],
                inter: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                'gold-glow': '0 0 20px rgba(212, 175, 55, 0.3)',
                'red-glow': '0 0 20px rgba(255, 76, 76, 0.3)',
            },
            backgroundImage: {
                'royal-gradient': 'linear-gradient(135deg, #0A0F1F 0%, #161B2E 100%)',
                'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #F4CF67 100%)',
            }
        },
    },
    plugins: [],
}
