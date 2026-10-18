import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Ruta absoluta garantizada a la carpeta dist
const distFolder = path.resolve(__dirname, 'dist');
const indexFile = path.resolve(distFolder, 'index.html');

// 1. Servir archivos estáticos del build de Vite desde dist/
app.use(express.static(distFolder, { index: false }));

// 2. Health check de diagnóstico
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    distExists: fs.existsSync(distFolder), 
    indexExists: fs.existsSync(indexFile) 
  });
});

// 3. SPA Fallback: Servir SIEMPRE dist/index.html para cualquier ruta del cliente
app.use('*', (req, res) => {
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>BioticketsEuropa - Estado</title>
          <style>
            body { background: #000; color: #fff; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 1rem; text-align: center; max-width: 400px; }
            h2 { color: #0071e3; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Error de Build</h2>
            <p>La carpeta <code>dist/index.html</code> no fue encontrada en el servidor.</p>
          </div>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor BioticketsEuropa corriendo en puerto ${PORT}`);
});
