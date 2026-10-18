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

// 1. Servir la carpeta estática dist
app.use(express.static(distFolder, { index: false }));

// 2. Endpoint para FORZAR la matanza del proceso bloqueado en GoDaddy
app.get('/api/kill-server', (req, res) => {
  res.json({ status: 'killing process...' });
  setTimeout(() => { process.exit(1); }, 100);
});

// 3. Healthcheck de verificación
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: 'FORCE-RELOAD-V6',
    distExists: fs.existsSync(distFolder), 
    indexExists: fs.existsSync(indexFile) 
  });
});

// 4. SPA Fallback directo
app.use('*', (req, res) => {
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(500).send('Servidor activo. La carpeta dist/ no existe todavia.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
