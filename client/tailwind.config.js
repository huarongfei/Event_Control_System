/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          cyan: '#00F5FF',
          green: '#00FF9F',
          pink: '#FF2A6D',
          yellow: '#FFE74C',
        },
        dark: {
          900: '#0A0E27',
          800: '#121A3A',
          700: '#1A2454',
          600: '#232D56',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#B8BFD6',
          tertiary: '#8B93B0',
          accent: '#00F5FF',
        },
      },
      fontFamily: {
        sans: ['DIN Next', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
