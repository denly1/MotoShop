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
          50: '#e6f1f5',
          100: '#cce3eb',
          200: '#99c7d7',
          300: '#66abc3',
          400: '#338faf',
          500: '#00739b',
          600: '#005c7c',
          700: '#00455d',
          800: '#002e3e',
          900: '#00171f',
        },
        secondary: {
          50: '#fce4e4',
          100: '#f9c9c9',
          200: '#f39393',
          300: '#ed5d5d',
          400: '#e72727',
          500: '#c71212',
          600: '#9f0e0e',
          700: '#770b0b',
          800: '#500707',
          900: '#280404',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
