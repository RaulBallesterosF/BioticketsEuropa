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
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.status(200).send('<h1>BioticketsEuropa Engine Server Running</h1>');
  });
}

app.listen(port, () => {
  console.log(`🚀 BioticketsEuropa Server listo en el puerto ${port}`);
});