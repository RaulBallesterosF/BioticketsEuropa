import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const distFolder = path.resolve(__dirname, 'dist');
const indexFile = path.resolve(distFolder, 'index.html');

// Servir la carpeta compilada dist
app.use(express.static(distFolder, { index: false }));

// Healthcheck
app.get(['/health', '/healthcheck', '/api/health'], (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    version: '4.2.0-production',
    distExists: fs.existsSync(distFolder)
  });
});

// Single Page Application Fallback
app.use('*', (req, res) => {
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(200).send('Servidor activo. Esperando compilación...');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BioticketsEuropa Server activo en puerto ${PORT}`);
});
