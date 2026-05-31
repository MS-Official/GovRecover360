import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // OLD IMPLEMENTATION - kept for reference
    // Reason: frontend API calls now use VITE_API_BASE_URL instead of a hardcoded local proxy.
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8000',
    //     changeOrigin: true,
    //   },
    // },
  },
});
