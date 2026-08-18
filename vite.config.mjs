import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { renameSync } from 'node:fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'github-pages-index',
      closeBundle() { renameSync('dist/app.html', 'dist/index.html'); },
    },
  ],
  base: '/Monitorin-BCC/',
  build: {
    rollupOptions: {
      input: 'app.html',
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/chunk-[name].js',
        assetFileNames: asset => asset.name?.endsWith('.css') ? 'assets/app.css' : 'assets/[name][extname]',
      },
    },
  },
  server: { proxy: { '/api': { target: 'http://127.0.0.1:5080', changeOrigin: true } } },
});
