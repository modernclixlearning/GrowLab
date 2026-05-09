import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#07120e',
          1: '#0c1b15',
          2: '#122821',
        },
        card: {
          DEFAULT: '#102019',
          2: '#16291f',
        },
        line: {
          DEFAULT: '#1f3a2e',
          2: '#284a3a',
        },
        fg: {
          DEFAULT: '#f1faf4',
          2: '#aebcb3',
          3: '#6f8479',
          4: '#4b5d54',
        },
        accent: {
          DEFAULT: '#22e26a',
          dark: '#0d8a3d',
          soft: '#103a23',
        },
        stage: {
          seedling: '#22e26a',
          veg: '#5ec9ff',
          flower: '#c577ff',
        },
        status: {
          water: '#3a9be8',
          thirsty: '#e09849',
          alert: '#d97c2e',
          warn: '#e74c4c',
          good: '#22e26a',
        },
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '18px',
        xl: '24px',
      },
      boxShadow: {
        'accent-glow': '0 0 24px rgba(34, 226, 106, 0.45)',
      },
      letterSpacing: {
        eyebrow: '0.14em',
      },
      keyframes: {
        'gl-bar-rise': {
          from: { transform: 'scaleY(0)' },
          to: { transform: 'scaleY(1)' },
        },
        'gl-pulse-dot': {
          '0%': { opacity: '0.4' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.4' },
        },
        'gl-modal-in': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'gl-toast-in': {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'gl-bar-rise': 'gl-bar-rise 600ms cubic-bezier(0.2,0.7,0.2,1) both',
        'gl-pulse-dot': 'gl-pulse-dot 1.6s ease-in-out infinite',
        'gl-modal-in': 'gl-modal-in 220ms ease-out both',
        'gl-toast-in': 'gl-toast-in 180ms ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config
