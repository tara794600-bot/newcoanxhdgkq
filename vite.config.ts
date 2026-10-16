import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Keep a machine-readable record of eager and on-demand assets for checks.
    manifest: true,
    cssCodeSplit: true,
  },
})
