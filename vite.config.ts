import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-server-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/api/tickets/wallet/apple/')) {
            const ticketId = req.url.split('/').pop() || 'ticket';
            res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
            res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticketId}.pkpass"`);
            res.end(
              JSON.stringify(
                {
                  passTypeIdentifier: 'pass.com.biotickets.europa',
                  serialNumber: ticketId,
                  description: 'BioticketsEuropa Apple Wallet Digital Pass',
                  organizationName: 'BioticketsEuropa SaaS Enterprise',
                  backgroundColor: 'rgb(15, 23, 42)',
                  foregroundColor: 'rgb(255, 255, 255)',
                  labelColor: 'rgb(99, 102, 241)',
                },
                null,
                2
              )
            );
            return;
          }
          if (req.url === '/api/health') {
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                ok: true,
                version: '5.0.0-enterprise',
                status: 'BioticketsEuropa Engine Running',
              })
            );
            return;
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
