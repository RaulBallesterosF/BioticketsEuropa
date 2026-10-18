import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const distPath = path.join(__dirname, 'dist');

// Servir la carpeta estática del build de Vite
app.use(express.static(distPath));

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'BioticketsEuropa Engine' });
});

// SPA Fallback para React
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor BioticketsEuropa activo en el puerto ${PORT}`);
});
