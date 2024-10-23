import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.mp3'],
  // base: '/WebTagFrontend/',
  // base: '192.168.1.70:8080/',
  server: {
    host: true, // This is the important part
    port: 5173
  },
  build: {
    outDir: '../'
  },
})
