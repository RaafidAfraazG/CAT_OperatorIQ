/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand - CAT-inspired amber/gold
        brand: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Industrial dark palette
        surface: {
          950: '#0a0c0f',
          900: '#0f1217',
          850: '#141720',
          800: '#181c27',
          750: '#1e2330',
          700: '#232938',
          600: '#2d3548',
          500: '#3a4259',
          400: '#4a536b',
          300: '#5e697e',
          200: '#8691a0',
          100: '#b0b8c4',
          50:  '#d4dae2',
        },
        // Semantic states
        status: {
          safe:     '#22c55e',
          safeD:    '#15803d',
          warn:     '#f59e0b',
          warnD:    '#b45309',
          critical: '#ef4444',
          criticalD:'#b91c1c',
          info:     '#3b82f6',
          infoD:    '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card':   '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.5)',
        'brand':  '0 0 16px rgba(245,158,11,0.15)',
        'status': '0 0 8px rgba(34,197,94,0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
