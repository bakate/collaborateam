import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
    fs: {
      // Allow serving files from one level up (the monorepo root)
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      '@workspace/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@workspace/domain': path.resolve(__dirname, '../../packages/domain/src'),
      '@workspace/application': path.resolve(__dirname, '../../packages/application/src'),
    },
  },
});
