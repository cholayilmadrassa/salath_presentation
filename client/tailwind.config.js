/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        theme: {
          primary: '#6E9B37',
          white: '#FFFFFF',
          cream: '#F7F5EC',
          dark: '#1A1A1A',
          gray: '#8C8C8C',
          gold: '#FFC107',
          lightGreen: '#E8EDE2',
        },
        primary: {
          50: '#f4f8ee',
          100: '#e5eed7',
          200: '#cedfb3',
          300: '#b0cb89',
          400: '#90b45f',
          500: '#6E9B37',
          600: '#5a822b',
          700: '#476723',
          800: '#3a531f',
          900: '#31461c',
          950: '#18260b',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#FFC107',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }
      },
      fontFamily: {
        sans: ['"Sora"', '"Plus Jakarta Sans"', 'sans-serif'],
        sora: ['"Sora"', 'sans-serif'],
        ml: ['"Noto Serif Malayalam"', '"Noto Sans Malayalam"', 'serif'],
        arabic: ['"Noto Kufi Arabic"', '"Noto Naskh Arabic"', 'serif'],
        cinzel: ['"Cinzel Decorative"', 'serif'],
      },
      boxShadow: {
        'touch': '0 4px 20px -2px rgba(110, 155, 55, 0.12)',
        'sheet': '0 -10px 40px -5px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 25px -5px rgba(255, 193, 7, 0.3)',
      }
    }
  },
  plugins: []
};
