/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fcf0',
          100: '#8fd4a4',
          200: '#baf8e9',
          300: '#7df0ab',
          400: '#49dc8e',
          500: '#13c377',
          600: '#09a176',
          700: '#0e7f87',
          800: '#0e8443',
          900: '#096138',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        righteous: ['Righteous', 'cursive'],
      },
    },
  },
  plugins: [],
}
