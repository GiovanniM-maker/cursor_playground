import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0b0b0c',
        panel: '#1a1a1c',
        'panel-2': '#222224',
        border: '#2a2a2e',
        text: '#eaeaea',
        dim: '#9ca3af',
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


