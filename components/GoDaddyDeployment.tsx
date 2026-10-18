import React, { useState } from 'react';
import {
  Download,
  Server,
  FileArchive,
  Check,
  Copy,
  ExternalLink,
  Github,
  HardDrive,
  Globe,
  ShieldCheck,
  HelpCircle,
  FolderOpen,
  ArrowRight,
  Terminal,
} from 'lucide-react';

export const GoDaddyDeployment: React.FC = () => {
  const [copiado, setCopiado] = useState<string | null>(null);
  const [tabGuia, setTabGuia] = useState<'cpanel' | 'github' | 'vps' | 'aws'>('aws');

  const copiarTexto = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2500);
  };

  const comandosGit = `cd tu-carpeta-del-proyecto
git init
git add .
git commit -m "feat: Sistema completo EuroTickets Pro con Analytics y SeatMap"
git branch -M main
git remote add origin https://github.com/RaulBallesterosF/EUROTICKETS.git
git push -u origin main --force`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 relative overflow-hidden bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-purple-950/40">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Listo para Producción en GoDaddy
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
            Descarga de Archivos & Despliegue en GoDaddy
          </h2>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Hemos compilado y empaquetado todos los módulos desarrollados (Analytics, SeatMap Studio para ferias y conciertos, Escáner QR de puerta, Pasarela Stripe, Liquidaciones D+3 y PyG). Descarga directamente el paquete listo para GoDaddy o el código fuente completo.
          </p>
        </div>
      </div>

      {/* Tarjetas de Descarga Directa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paquete 1: GoDaddy cPanel Dist */}
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-500/50 transition flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Server className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Recomendado GoDaddy
              </span>
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Paquete Compilado para GoDaddy (dist)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Listo para descomprimir directamente en la carpeta <code className="text-emerald-400 font-mono">public_html</code> de tu cPanel.
              </p>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-white/5">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Incluye <strong className="text-white">index.html</strong> y bundle minificado en <strong className="text-white">assets/</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Incluye <strong className="text-emerald-300">.htaccess</strong> preconfigurado para evitar errores 404 al recargar</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>No requiere Node.js en el hosting; funciona con Apache estándar</span>
              </li>
            </ul>
          </div>

          <a
            href="/eurotickets-dist-godaddy.zip"
            download="eurotickets-dist-godaddy.zip"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Paquete GoDaddy cPanel (.zip ~312 KB)</span>
          </a>
        </div>

        {/* Paquete 2: Código Fuente Completo */}
        <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-indigo-950/10 hover:border-indigo-500/50 transition flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileArchive className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Código Completo
              </span>
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Código Fuente del Proyecto (Vite + React)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Todo el código original en TypeScript, componentes, mapa canvas, backend en memoria y configuraciones.
              </p>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-white/5">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Estructura organizada en <strong className="text-white">src/components</strong>, <strong className="text-white">src/server</strong> y <strong className="text-white">src/services</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Compatible con VSCode, <strong className="text-white">npm install</strong> y <strong className="text-white">npm run dev</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Listo para sincronizar con tu repositorio de GitHub</span>
              </li>
            </ul>
          </div>

          <a
            href="/eurotickets-source-code.zip"
            download="eurotickets-source-code.zip"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Código Fuente Completo (.zip ~67 KB)</span>
          </a>
        </div>
      </div>

      {/* Pestañas de Instrucciones Paso a Paso */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-black text-white">Guía Paso a Paso de Instalación</h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1 rounded-2xl border border-white/10 text-xs">
            <button
              onClick={() => setTabGuia('aws')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                tabGuia === 'aws'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-amber-300" />
              <span>AWS Cloud (EC2 / Docker)</span>
            </button>
            <button
              onClick={() => setTabGuia('cpanel')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                tabGuia === 'cpanel'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>GoDaddy cPanel (Fácil)</span>
            </button>
            <button
              onClick={() => setTabGuia('github')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                tabGuia === 'github'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              <span>Subir / Descargar en GitHub</span>
            </button>
            <button
              onClick={() => setTabGuia('vps')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                tabGuia === 'vps'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>VPS / Servidor Node.js</span>
            </button>
          </div>
        </div>

        {/* CONTENIDO TAB 1: GoDaddy cPanel */}
        {tabGuia === 'cpanel' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <h4 className="text-sm font-bold text-white">Descarga el paquete cPanel</h4>
                <p className="text-xs text-slate-400">
                  Haz clic en el botón verde de arriba para descargar <code className="text-emerald-300">eurotickets-dist-godaddy.zip</code> a tu ordenador.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <h4 className="text-sm font-bold text-white">Abre el Administrador de Archivos</h4>
                <p className="text-xs text-slate-400">
                  Inicia sesión en GoDaddy &gt; cPanel &gt; Administrador de Archivos (File Manager) &gt; entra a la carpeta <code className="text-emerald-300">public_html</code>.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <h4 className="text-sm font-bold text-white">Sube y Extrae</h4>
                <p className="text-xs text-slate-400">
                  Haz clic en <strong>Cargar (Upload)</strong>, sube el zip, y luego clic derecho &gt; <strong>Extract</strong>. ¡Listo! Abre tu dominio.
                </p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200 space-y-1">
                <strong className="text-amber-300 block">¿Por qué este paquete funciona directo en GoDaddy?</strong>
                <p>
                  Porque incluye el archivo <code className="bg-black/30 px-1 py-0.5 rounded text-white">.htaccess</code> configurado específicamente para servidores Apache de GoDaddy. Esto asegura que cuando recargues la página o navegues por las rutas, el servidor web dirija siempre al <code className="bg-black/30 px-1 py-0.5 rounded text-white">index.html</code> sin dar ningún error 404.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO TAB 2: GitHub */}
        {tabGuia === 'github' && (
          <div className="space-y-4">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                  <Github className="w-4 h-4" />
                  <span>Tu Repositorio: https://github.com/RaulBallesterosF/EUROTICKETS</span>
                </div>
                <a
                  href="https://github.com/RaulBallesterosF/EUROTICKETS"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                >
                  Abrir Repositorio <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-xs text-slate-300">
                Para subir todos los archivos nuevos a tu repositorio desde tu computadora:
              </p>

              <div className="relative">
                <pre className="p-3 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                  {comandosGit}
                </pre>
                <button
                  onClick={() => copiarTexto(comandosGit, 'git')}
                  className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-bold flex items-center gap-1 shadow"
                >
                  {copiado === 'git' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-300" /> ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copiar Comandos
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-2 text-xs text-slate-300">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-indigo-400" />
                ¿Cómo descargarlo desde GitHub cuando lo subas?
              </h4>
              <p>
                1. Entra a tu enlace de GitHub: <a href="https://github.com/RaulBallesterosF/EUROTICKETS" target="_blank" rel="noreferrer" className="text-indigo-400 underline">https://github.com/RaulBallesterosF/EUROTICKETS</a>
              </p>
              <p>
                2. Haz clic en el botón verde <strong>&lt;&gt; Code</strong> en la esquina superior derecha.
              </p>
              <p>
                3. Haz clic en <strong>Download ZIP</strong>. GitHub te descargará automáticamente el paquete completo con un solo clic.
              </p>
            </div>
          </div>
        )}

        {/* CONTENIDO TAB 3: VPS */}
        {tabGuia === 'vps' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Si en GoDaddy compraste un servidor VPS Linux (Ubuntu / CentOS) con Node.js en vez de cPanel compartido:
            </p>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" /> Comandos de Instalación en VPS:
                </span>
                <button
                  onClick={() =>
                    copiarTexto(
                      `npm install\nnpm run build\nnpx serve -s dist -l 3000`,
                      'vps'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1"
                >
                  {copiado === 'vps' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copiar
                </button>
              </div>
              <pre className="p-3 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-purple-300 overflow-x-auto">
                {`# 1. Instalar dependencias
npm install

# 2. Compilar producción
npm run build

# 3. Servir en el puerto que desees
npx serve -s dist -l 3000`}
              </pre>
            </div>
          </div>
        )}

        {/* CONTENIDO TAB 4: AWS Cloud (EC2, Docker, S3 + CloudFront) */}
        {tabGuia === 'aws' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-amber-500/20 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs">
                  A
                </div>
                <h4 className="text-sm font-bold text-white">Opción 1: Docker Compose</h4>
                <p className="text-xs text-slate-400">
                  Despliegue integral en 1 solo comando con PostgreSQL y Redis incluidos para alta concurrencia.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-amber-500/20 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs">
                  B
                </div>
                <h4 className="text-sm font-bold text-white">Opción 2: AWS EC2 + PM2</h4>
                <p className="text-xs text-slate-400">
                  Instancia t3.small/medium con Ubuntu, Node.js 20, Nginx como proxy inverso y SSL Let's Encrypt gratis.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-amber-500/20 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs">
                  C
                </div>
                <h4 className="text-sm font-bold text-white">Opción 3: S3 + CloudFront</h4>
                <p className="text-xs text-slate-400">
                  Alojamiento estático global con caché perimetral en CDN para millones de peticiones simultáneas.
                </p>
              </div>
            </div>

            {/* Docker Compose Box */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-amber-400" /> 1. Despliegue con Docker en AWS EC2 o VPS:
                </span>
                <button
                  onClick={() =>
                    copiarTexto(
                      `git clone https://github.com/RaulBallesterosF/EUROTICKETS.git\ncd EUROTICKETS\ncp .env.example .env\ndocker compose up -d --build\ndocker compose logs -f app`,
                      'aws-docker'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-1 border border-amber-500/30"
                >
                  {copiado === 'aws-docker' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copiar Comandos Docker
                </button>
              </div>
              <pre className="p-3 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-amber-200 overflow-x-auto">
{`# 1. Clonar repositorio en tu servidor AWS
git clone https://github.com/RaulBallesterosF/EUROTICKETS.git
cd EUROTICKETS

# 2. Configurar variables de producción
cp .env.example .env

# 3. Levantar los 3 contenedores (App Node.js + PostgreSQL + Redis)
docker compose up -d --build

# 4. Monitorear logs en vivo
docker compose logs -f app`}
              </pre>
            </div>

            {/* PM2 & Nginx Box */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-indigo-400" /> 2. Despliegue Nativo con Node.js + PM2 + Nginx (AWS EC2 / Ubuntu):
                </span>
                <button
                  onClick={() =>
                    copiarTexto(
                      `# Instalar Node 20 y PM2\ncurl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -\nsudo apt-get install -y nodejs nginx certbot python3-certbot-nginx\nsudo npm install -g pm2 tsx\n\n# Compilar y arrancar\nnpm install\nnpm run build\npm2 start server.ts --name "eurotickets" --time\npm2 save\npm2 startup`,
                      'aws-pm2'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[10px] font-bold flex items-center gap-1 border border-indigo-500/30"
                >
                  {copiado === 'aws-pm2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copiar Comandos PM2
                </button>
              </div>
              <pre className="p-3 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-indigo-200 overflow-x-auto">
{`# 1. Instalar Node.js 20 LTS, Nginx y PM2 en Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx
sudo npm install -g pm2 tsx

# 2. Instalar y compilar el proyecto
npm install
npm run build

# 3. Iniciar el servicio persistente con PM2 (cluster con reinicio automático)
pm2 start server.ts --name "eurotickets" -i max
pm2 save
pm2 startup

# 4. Obtener certificado SSL gratis con Let's Encrypt
sudo certbot --nginx -d tudominio.com -d www.tudominio.com`}
              </pre>
            </div>

            {/* Configuración Nginx Reversa */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-slate-300 block">
                📄 Configuración de Nginx (/etc/nginx/sites-available/eurotickets):
              </span>
              <pre className="p-3 bg-slate-950 border border-white/5 rounded-xl text-[11px] font-mono text-slate-400 overflow-x-auto">
{`server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`}
              </pre>
            </div>
          </div>
        )}
        </div>
      </div>
    );
};
