/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./layouts/**/*.html",
    "./content/**/*.md",
    "./assets/js/**/*.js",
    "./static/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        'gold': {
          400: '#FFD700', // Primary Access (Text, Hovers)
          500: '#B8860B', // Secondary Accent (Borders)
        },
        'neutral': {
          900: '#171717', // Primary Background
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
