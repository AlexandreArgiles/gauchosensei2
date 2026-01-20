/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",      // <--- IMPORTANTE: Olha arquivos na raiz (App.tsx, index.tsx)
    "./components/**/*.{js,ts,jsx,tsx}" // <--- Olha na pasta components
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        jp: ['"Noto Sans JP"', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        brand: {
          900: '#2a0a0a', 
          800: '#450a0a',
          500: '#dc2626',
          100: '#fee2e2',
        }
      },
    },
  },
  plugins: [],
}