import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const distPath = path.join(__dirname, 'dist');

// Servir la carpeta estática generada por Vite
app.use(express.static(distPath));

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'BioticketsEuropa Engine' });
});

// Cualquier ruta que no sea estática sirve index.html para React SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de BioticketsEuropa activo en el puerto ${PORT}`);
});
