import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/kaitai-debugger/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          editor: ['@monaco-editor/react'],
          kaitai: ['@k67/kaitai-struct-ts'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['@k67/kaitai-struct-ts'],
  },
  server: {
    port: 3000,
    open: true,
  },
})
