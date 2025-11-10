/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // The Never Ending War color scheme
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        tank: '#3b82f6',
        healer: '#10b981',
        dps: '#ef4444',
        rarity: {
          common: '#9ca3af',
          uncommon: '#10b981',
          rare: '#3b82f6',
          epic: '#a855f7',
          legendary: '#f59e0b'
        }
      }
    },
  },
  plugins: [],
}
