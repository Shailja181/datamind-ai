/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        sidebar: 'var(--color-sidebar)',
        card: {
          DEFAULT: 'var(--color-card)',
          hover: 'var(--color-card-hover)',
        },
        border: 'var(--color-border)',
        foreground: 'var(--color-text)',
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-text)',
        },
        brand: {
          50: '#EEF0FF',
          100: '#E0E3FF',
          200: '#C7CCFE',
          300: '#A4ACFD',
          400: '#8082FB',
          500: '#635BFF', // Primary Stripe/Linear blurple
          600: '#5245EB',
          700: '#4134D0',
          800: '#3429A7',
          900: '#2E2784',
        },
        accent: {
          500: '#8B5CF6',
        },
        success: '#16A34A',
        warning: '#F59E0B',
        destructive: '#DC2626',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        card: '0 0 0 1px var(--color-border), 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
        'card-hover': '0 0 0 1px var(--color-border-hover), 0 8px 16px -4px rgba(0, 0, 0, 0.08)',
        modal: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        fade: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulseSlow 2.5s infinite ease-in-out',
      },
    },
  },
  plugins: [],
};
