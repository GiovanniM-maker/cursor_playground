import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
  base: '/cursor_playground/' // IMPORTANTISSIMO per GitHub Pages (usa il nome del repo)
})


