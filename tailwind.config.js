/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A1628',
          900: '#0E1F38',
          800: '#132A4A',
          700: '#1B3A63',
          600: '#25497C',
        },
        paper: {
          50: '#FAFBFC',
          100: '#F4F6F9',
          200: '#E9ECF2',
          300: '#DCE1EA',
        },
        accent: {
          DEFAULT: '#1B4F9C',
          light: '#3B6FC2',
          dark: '#123566',
        },
        gain: {
          DEFAULT: '#0E8A4B',
          bg: '#E7F6ED',
        },
        loss: {
          DEFAULT: '#C22A2A',
          bg: '#FCEAEA',
        },
        gold: '#B8860B',
      },
      fontFamily: {
        display: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.95rem' }],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(14,31,56,0.06), 0 1px 0 rgba(14,31,56,0.04)',
      },
    },
  },
  plugins: [],
}
