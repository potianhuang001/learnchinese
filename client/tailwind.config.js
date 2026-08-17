/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm education palette
        primary: {
          50: '#fff8eb',
          100: '#feefc7',
          200: '#fddc8a',
          300: '#fbc44d',
          400: '#f9ab24',
          500: '#f28d0c', // main orange
          600: '#d66d07',
          700: '#b24c0a',
          800: '#903b0f',
          900: '#763210',
        },
        cream: {
          50: '#fdfcf9',
          100: '#faf7f0',
          200: '#f3edde',
        },
        ink: {
          DEFAULT: '#2d2a26',
          light: '#6b655c',
          lighter: '#9b948a',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 2px 8px rgba(45, 42, 38, 0.06), 0 8px 24px rgba(45, 42, 38, 0.08)',
        lift: '0 4px 12px rgba(242, 141, 12, 0.25), 0 8px 28px rgba(242, 141, 12, 0.2)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
