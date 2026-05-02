/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        crimson: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        space: {
          950: '#030712',
          900: '#050B18',
          800: '#0A1628',
          700: '#0F2040',
          600: '#162850',
          500: '#1E3A66',
        },
        success: {
          400: '#4ADE80',
          500: '#22C55E',
        },
        warning: {
          400: '#FB923C',
          500: '#F97316',
        },
      },
      boxShadow: {
        glow: '0 0 24px rgba(239, 68, 68, 0.25)',
        'glow-lg': '0 0 40px rgba(239, 68, 68, 0.35)',
        soft: '0 10px 30px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(239,68,68,0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(239,68,68,0.7)' },
        },
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(16px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      maxWidth: {
        '8xl': '88rem',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};