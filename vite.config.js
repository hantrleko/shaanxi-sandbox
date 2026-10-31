import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'three-core'
          }
          if (id.includes('node_modules/gsap')) {
            return 'gsap-vendor'
          }
          if (id.includes('node_modules/lucide-vue-next')) {
            return 'lucide-icons'
          }
        }
      }
    }
  }
})
