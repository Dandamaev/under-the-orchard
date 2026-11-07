import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './', // dist/ works from any folder or static host
  server: {
    host: '0.0.0.0', // reachable from Windows through the port mapping
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // Windows bind mount: no inotify events reach the container
      interval: 300,
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
