import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#f7f7f8',
        panel: '#ffffff',
        border: '#e7e7ea',
        text: '#0b0b0c',
        dim: '#6b7280',
        accent: '#0a84ff',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)'
      },
      borderRadius: {
        xl: '14px'
      },
      fontFamily: {
        ui: [
          '-apple-system','BlinkMacSystemFont','SF Pro Text','SF Pro Display',
          'Segoe UI','Roboto','Helvetica','Arial','sans-serif'
        ]
      }
    },
  },
  plugins: [],
} satisfies Config


