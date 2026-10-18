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

// 1. Servir archivos estáticos del build de Vite desde dist/
app.use(express.static(distFolder, { index: false }));

// 2. Health check con diagnóstico explícito de la carpeta dist
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'BioticketsEuropa Engine',
    distExists: fs.existsSync(distFolder), 
    indexExists: fs.existsSync(indexFile) 
  });
});

// 3. SPA Fallback: Servir siempre dist/index.html para cualquier ruta de la app
app.use('*', (req, res) => {
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>BioticketsEuropa Engine — Estado</title>
          <style>
            body { background: #000; color: #fff; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 1rem; text-align: center; max-width: 420px; }
            h2 { color: #0071e3; margin-top: 0; }
            p { color: #86868b; font-size: 0.9rem; }
            code { background: rgba(255,255,255,0.1); padding: 0.2rem 0.4rem; border-radius: 0.25rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>BioticketsEuropa Engine</h2>
            <p>La carpeta <code>dist/index.html</code> no fue encontrada. El comando <code>npm run build</code> no ha generado los archivos estáticos en el servidor.</p>
          </div>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor BioticketsEuropa activo en puerto ${PORT}`);
});
