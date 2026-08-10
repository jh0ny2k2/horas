/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        gold: '#4f46e5',
        'gold-light': '#8b5cf6',
        cream: '#eef0f9',
        ivory: '#f5f6fb',
        champagne: '#e4e6f9',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(79, 70, 229, 0.12)',
        'premium-lg': '0 2px 4px rgba(15, 23, 42, 0.05), 0 20px 48px -12px rgba(79, 70, 229, 0.18)',
        'inner-glow': 'inset 0 2px 4px rgba(79, 70, 229, 0.06)',
        'glow': '0 0 0 1px rgba(79, 70, 229, 0.08), 0 8px 32px -8px rgba(99, 102, 241, 0.4)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
