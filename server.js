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

// 1. Servir os ficheiros estáticos xerados por Vite na carpeta dist
app.use(express.static(distPath));

// 2. Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'BioticketsEuropa Engine' });
});

// 3. Encamiñar calquera outra ruta ao index.html de React
app.get('*', (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('A carpeta dist non se atopou. Executa npm run build.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor activo no porto ${PORT}`);
});
