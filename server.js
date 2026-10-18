import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 1. Servir los archivos estáticos compilados por Vite
app.use(express.static(path.join(__dirname, 'dist')));

// 2. Endpoint de salud de la API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'BioticketsEuropa Engine' });
});

// 3. Redirigir cualquier otra ruta a la aplicación web de React (Single Page App)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // Si la carpeta dist aún no fue compilada en local
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>BioticketsEuropa Engine</title></head>
          <body style="background:#000;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
            <div style="text-align:center;">
              <h2>BioticketsEuropa Engine</h2>
              <p>Iniciando compilación web...</p>
            </div>
          </body>
        </html>
      `);
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
