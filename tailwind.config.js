/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#f4f6f0',
          100: '#e5ead9',
          200: '#ccd5b8',
          300: '#adb996',
          400: '#8f9d74',
          500: '#738259',
          600: '#5a6845',
          700: '#4d6339',
          800: '#3d4f2e',
          900: '#2d3a22',
          950: '#1e2516',
        },
        gold: {
          50: '#faf6ed',
          100: '#f3ead4',
          200: '#e6d4a8',
          300: '#d9bc7a',
          400: '#c9a962',
          500: '#b8924a',
          600: '#9a7539',
          700: '#7a5c2e',
          800: '#654c28',
          900: '#553f24',
        },
        cream: {
          DEFAULT: '#f5f2eb',
          muted: '#d4cfc4',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '72rem',
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
}
