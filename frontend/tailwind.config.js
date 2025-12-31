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
        // Notion-style black & white with subtle grays
        'primary': '#000000',
        'secondary': '#37352F',
        'border': '#E8E7E5',
        'bg': '#FFFFFF',
        'bg-hover': '#F7F6F5',
        'text-primary': '#37352F',
        'text-secondary': '#787774',
        // Dark mode colors
        'dark': {
          'bg-main': '#1E1E1E',
          'bg-sidebar': '#202123',
          'bg-card': '#2D2D2D',
          'text-primary': '#ECECEC',
          'text-secondary': '#C5C7CA',
          'text-hint': '#A1A1A1',
          'text-link': '#82A7FF',
          'border': '#3A3A3C',
          'border-light': '#2F2F2F',
          'input-bg': '#2A2A2C',
          'input-border': '#3A3A3C',
          'btn-primary': '#10A37F',
          'btn-primary-hover': '#0E926F',
          'btn-secondary': '#3A3A3C',
          'btn-secondary-hover': '#4A4A4C',
        },
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
