import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    assetsDir: 'assets',
    rollupOptions: {
      external: (id) => id.startsWith('https://'),
      input: {
        app: 'index.html'
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/chart.js')) return 'vendor-chart';
          if (id.includes('node_modules/lucide')) return 'vendor-icons';
          if (id.includes('installFirebaseServices') || id.includes('/src/services/firebase') || id.includes('/src/services/auth') || id.includes('/src/services/dataSdk') || id.includes('/src/services/userAdmin')) {
            return 'services-firebase';
          }
          return undefined;
        }
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  preview: {
    host: '127.0.0.1',
    port: 4173
  }
});
