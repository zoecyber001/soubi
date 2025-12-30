/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SOUBI Void & Neon Palette
        'void': '#050505',
        'armor': '#0A0A0A',
        'surface': '#121212',
        'dim': '#262626',
        'bright': '#404040',
        'cyan-neon': '#00F0FF',
        'red-glitch': '#FF003C',
        'amber-warn': '#FFB800',
        'purple-link': '#BD00FF',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 10px #00F0FF',
        'neon-red': '0 0 10px #FF003C',
        'neon-amber': '0 0 10px #FFB800',
      },
    },
  },
  plugins: [],
}