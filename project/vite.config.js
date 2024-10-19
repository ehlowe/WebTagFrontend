import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.mp3'],
  // base: '/WebTagFrontend/',
  server: {
    host: true, // This is the important part
    port: 5173
  },
  build: {
    outDir: '../'
  },
})
