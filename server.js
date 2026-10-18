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

// Servir la carpeta estática del build
app.use(express.static(distFolder, { index: false }));

// Healthcheck con validación de versión y estado del build
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    engine: 'BioticketsEuropa-v4-Deployed',
    distExists: fs.existsSync(distFolder), 
    indexExists: fs.existsSync(indexFile) 
  });
});

// Fallback universal para la Single Page Application
app.use('*', (req, res) => {
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>BioticketsEuropa Engine</title>
          <style>
            body { background: #000; color: #fff; font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 1rem; text-align: center; max-width: 420px; }
            h2 { color: #0071e3; margin-top: 0; }
            p { color: #86868b; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>BioticketsEuropa Engine</h2>
            <p>Generando assets estáticos en el servidor... Por favor, actualiza en unos segundos.</p>
          </div>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
