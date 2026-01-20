/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        jp: ['"Noto Sans JP"', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        brand: {
          900: '#2a0a0a', // Deep meat red/brown
          800: '#450a0a',
          500: '#dc2626', // Fire red
          100: '#fee2e2',
        }
      },
    },
  },
  plugins: [],
}