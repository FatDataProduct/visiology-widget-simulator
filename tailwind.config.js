/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'visio': {
          'bg': '#1a1d23',
          'panel': '#252830',
          'border': '#3a3f4b',
          'accent': '#00b4d8',
          'accent-hover': '#0096c7',
          'text': '#e8eaed',
          'text-muted': '#9aa0a6',
          'success': '#34a853',
          'warning': '#fbbc04',
          'error': '#ea4335',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'sans': ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
