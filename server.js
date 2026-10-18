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

// Endpoint especial para FORZAR EL REINICIO del proceso colgado
app.get('/api/kill-server', (req, res) => {
  res.json({ message: 'Matando proceso antiguo para forzar reinicio...' });
  setTimeout(() => {
    process.exit(1); // Esto obliga al orquestador de GoDaddy a levantar la versión nueva
  }, 500);
});

// Healthcheck con validación de versión v5
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    engine: 'BioticketsEuropa-v5-Active',
    distExists: fs.existsSync(distFolder), 
    indexExists: fs.existsSync(indexFile) 
  });
});

// Fallback universal para React
app.use('*', (req, res) => {
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(200).send('Servidor activo pero la carpeta dist/ aún no se ha compilado.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
