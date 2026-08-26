import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Monitorin-BCC/',
  build: {
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/chunk-[name].js',
        assetFileNames: asset => asset.name?.endsWith('.css') ? 'assets/app.css' : 'assets/[name][extname]',
      },
    },
  },
  server: {
    watch: {
      ignored: ['**/backend/**/bin/**', '**/backend/**/obj/**'],
    },
    proxy: {
      '/api': { target: 'http://127.0.0.1:5202', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:5202', changeOrigin: true },
    },
  },
});
