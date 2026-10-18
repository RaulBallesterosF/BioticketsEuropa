import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// Servir archivos estáticos del build de Vite
app.use(express.static(distPath));

// Healthcheck de la API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'BioticketsEuropa Engine' });
});

// Fallback para Single Page Application (SPA)
app.get('*', (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>BioticketsEuropa Engine</title>
          <style>
            body { background: #000; color: #fff; font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 1.5rem; text-align: center; max-width: 420px; }
            h2 { color: #0071e3; margin-top: 0; }
            p { color: #86868b; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>BioticketsEuropa Engine</h2>
            <p>Generando compilación en el servidor... Por favor, recarga en un par de segundos.</p>
          </div>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
