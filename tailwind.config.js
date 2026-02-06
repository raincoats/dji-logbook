/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // DJI-inspired color scheme
        dji: {
          primary: 'rgb(var(--dji-primary) / <alpha-value>)',
          secondary: 'rgb(var(--dji-secondary) / <alpha-value>)',
          accent: 'rgb(var(--dji-accent) / <alpha-value>)',
          dark: 'rgb(var(--dji-dark) / <alpha-value>)',
          surface: 'rgb(var(--dji-surface) / <alpha-value>)',
          muted: 'rgb(var(--dji-muted) / <alpha-value>)',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
