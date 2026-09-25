import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['tone', 'plantasia-sound-engine', 'ascii-visual-engine', 'bootstrap'],
  },
  css: {
    preprocessorOptions: {
      scss: { quietDeps: true },
    },
  },
  build: {
    target: 'es2022',
  },
});
