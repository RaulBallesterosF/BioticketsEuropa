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

// 1. Servir la carpeta de distribución estática
app.use(express.static(distFolder, { index: false }));

// 2. Healthcheck universal para la plataforma PaaS
app.get(['/health', '/healthcheck', '/api/health'], (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    version: '4.0.0-production',
    distExists: fs.existsSync(distFolder)
  });
});

// 3. Fallback de React SPA
app.use('*', (req, res) => {
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>BioticketsEuropa Platform</title>
          <style>
            body { background: #000; color: #fff; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 1rem; text-align: center; }
            h2 { color: #0071e3; margin: 0 0 0.5rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>BioticketsEuropa Engine</h2>
            <p>Compilando activos de producción...</p>
          </div>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BioticketsEuropa Server activo en puerto ${PORT}`);
});
