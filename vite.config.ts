import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  build: { 
    outDir: 'dist'
  },
  base: '/cursor_playground/', // IMPORTANTISSIMO per GitHub Pages (usa il nome del repo)
  // Explicitly exclude server directory from processing
  server: {
    fs: {
      deny: [resolve(__dirname, 'server')]
    }
  }
})


