/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wtl: {
          navy: '#20223E',
          green: '#91BD32',
          orange: '#E98A32',
          blue: '#2878B9',
          bg: '#F5F7FA',
          white: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Tamil', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        tamil: ['Noto Sans Tamil', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
