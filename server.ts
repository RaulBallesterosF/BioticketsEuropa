import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.5.0-enterprise',
    service: 'BioticketsEuropa Engine',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: port,
  });
});

app.get('/api/tickets/wallet/apple/:ticketId', (req, res) => {
  const { ticketId } = req.params;
  res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
  res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticketId}.pkpass"`);
  res.json({
    passTypeIdentifier: 'pass.com.bioticketseuropa.pro',
    serialNumber: ticketId,
    description: 'BioticketsEuropa Apple Wallet Pass',
    organizationName: 'BioticketsEuropa SaaS',
    backgroundColor: 'rgb(0, 0, 0)',
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(0, 113, 227)',
  });
});

const distPath = path.resolve(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  app.use(
    express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    })
  );

  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>BioticketsEuropa Server</title></head>
        <body style="background:#000000;color:#f5f5f7;font-family:-apple-system,sans-serif;padding:40px;text-align:center;">
          <h1>BioticketsEuropa Engine</h1>
          <p>Servidor en ejecución.</p>
        </body>
      </html>
    `);
  });
}

app.listen(port, () => {
  console.log(`🚀 BioticketsEuropa Server listo en el puerto ${port}`);
});