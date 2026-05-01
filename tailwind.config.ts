import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a4d2e',
          50: '#f0f7f2',
          100: '#dcebe0',
          200: '#bbd8c4',
          300: '#8fbc9e',
          400: '#5f9a76',
          500: '#3d7245',
          600: '#2d5f3a',
          700: '#1a4d2e',
          800: '#1a3d28',
          900: '#163322',
        },
        secondary: {
          DEFAULT: '#2d5f3a',
        },
        accent: {
          DEFAULT: '#3d7245',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
