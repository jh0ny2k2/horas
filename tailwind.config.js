/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f0',
          100: '#f9edda',
          200: '#f2d7b0',
          300: '#e9bc7d',
          400: '#e0a34e',
          500: '#d48a2e',
          600: '#b86e23',
          700: '#96531f',
          800: '#7a4321',
          900: '#66391e',
        },
        cream: '#fdfaf5',
        ivory: '#f8f5f0',
        champagne: '#f7e8d0',
        gold: '#d4a843',
        'gold-light': '#e8c97a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)',
        'premium-lg': '0 8px 40px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        'inner-glow': 'inset 0 2px 4px rgba(212, 168, 67, 0.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
