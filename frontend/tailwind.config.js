export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        },
        accent: {
          500: '#f59e0b',
          600: '#d97706'
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          900: '#0f172a',
          950: '#020617'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        'card': '0 4px 12px -2px rgb(0 0 0 / 0.06), 0 2px 4px -1px rgb(0 0 0 / 0.04)'
      }
    }
  },
  plugins: []
}
