/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        brand: ['Sora', 'sans-serif'],
        gaming: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#06070A',
          900: '#0A0C12',
          850: '#0F121A',
          800: '#141824',
          750: '#1A2030',
          700: '#22293D',
        },
        cyber: {
          blue: '#0099FF',
          cyan: '#00D8FF',
          glow: '#38BDF8',
        },
        crimson: {
          DEFAULT: '#FF2E51',
          dark: '#E0163A',
          light: '#FF4D6D',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        }
      }
    },
  },
  plugins: [],
}
