import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  MapaRecinto,
  AsientoItem,
  Evento,
  PalcoVIP,
  MesaEspecial,
  ZonaDePie,
} from '../types';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Hand,
  MousePointer,
  CheckCircle2,
  Crown,
  Sparkles,
  Layers,
  Users,
  Ticket,
  ArrowRight,
  Clock,
  ShieldCheck,
  Calendar,
  MapPin,
  Check,
} from 'lucide-react';

interface SeatMapCanvasProps {
  mapa: MapaRecinto;
  evento: Evento;
  asientosSeleccionados: AsientoItem[];
  idsVendidos: string[];
  idsBloqueados: string[];
  onToggleAsiento: (asiento: AsientoItem) => void;
  diaFeriaSeleccionado?: number;
  onCambiarDiaFeria?: (dia: number) => void;
}

interface ClickTarget {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  categoria: string;
  tipo: 'PALCO' | 'MESA' | 'ZONA';
  asiento: AsientoItem;
  esVendido: boolean;
}

export const SeatMapCanvas: React.FC<SeatMapCanvasProps> = ({
  mapa,
  evento,
  asientosSeleccionados,
  idsVendidos,
  idsBloqueados,
  onToggleAsiento,
  diaFeriaSeleccionado = 1,
  onCambiarDiaFeria,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgFondoRef = useRef<HTMLImageElement | null>(null);
  const targetsRef = useRef<ClickTarget[]>([]);

  // Navegación: Zoom y Desplazamiento (Pan)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [herramienta, setHerramienta] = useState<'seleccionar' | 'pan'>('seleccionar');

  // Filtro activo por categoría estilo White Festival
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS');

  // Estado del Tooltip Flotante al pasar el ratón
  const [hoveredData, setHoveredData] = useState<{
    nombre: string;
    numero: string;
    capacidad: number;
    precio: number;
    categoria: string;
    disponible: boolean;
    x: number;
    y: number;
  } | null>(null);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Precargar imagen del recinto
  useEffect(() => {
    if (!mapa.imagenFondo) {
      imgFondoRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = mapa.imagenFondo;
    img.onload = () => {
      imgFondoRef.current = img;
      renderizarMapa();
    };
  }, [mapa.imagenFondo]);

  // Precisión milimétrica 1:1 de puntero considerando escala del canvas
  const toVirtualCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const internalX = (clientX - rect.left) * scaleX;
    const internalY = (clientY - rect.top) * scaleY;
    return {
      x: (internalX - pan.x) / zoom,
      y: (internalY - pan.y) / zoom,
    };
  };

  // Extraer categorías únicas para la barra de filtros
  const categoriasDisponibles = Array.from(
    new Set([
      'TODOS',
      ...(mapa.palcos || []).map((p) => p.nombre.trim()),
      ...(mapa.mesas || []).map((m) => m.nombre.trim()),
      ...(mapa.zonasDePie || []).map((z) => z.nombre.trim()),
    ])
  );

  // RENDERIZADOR VECTORIAL ESTILO WHITE FESTIVAL (BIOTICKETS)
  const renderizarMapa = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    targetsRef.current = [];

    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Fondo del visor
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, w, h);

    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Imagen del recinto
    if (imgFondoRef.current) {
      ctx.save();
      ctx.globalAlpha = mapa.imagenFondoOpacidad !== undefined ? mapa.imagenFondoOpacidad : 0.75;
      ctx.drawImage(imgFondoRef.current, 0, 0, 1600, 1000);
      ctx.restore();
    } else {
      // Cuadrícula estética de festival
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1 / zoom;
      for (let x = -600; x < 2200; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, -600);
        ctx.lineTo(x, 1600);
        ctx.stroke();
      }
      for (let y = -600; y < 1600; y += 40) {
        ctx.beginPath();
        ctx.moveTo(-600, y);
        ctx.lineTo(2200, y);
        ctx.stroke();
      }
    }

    // 2. Tarima Principal / Stage (Escenario White Festival)
    const stageWidth = 720;
    const stageX = (1600 - stageWidth) / 2;
    const gradStage = ctx.createLinearGradient(stageX, 20, stageX + stageWidth, 75);
    gradStage.addColorStop(0, '#1e1b4b');
    gradStage.addColorStop(0.5, '#4338ca');
    gradStage.addColorStop(1, '#312e81');

    ctx.save();
    ctx.fillStyle = gradStage;
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#6366f1';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(stageX, 20, stageWidth, 50, 12);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '3px';
    ctx.fillText('★ ESCENARIO PRINCIPAL / STAGE ★', 800, 45);
    ctx.restore();

    // 3. Renderizar Zonas de Pie (General / Front Stage)
    if (mapa.zonasDePie && mapa.zonasDePie.length > 0) {
      mapa.zonasDePie.forEach((z) => {
        const ticketId = `ZP-${z.id}`;
        const esSeleccionado = asientosSeleccionados.some((a) => a.id.startsWith(ticketId));
        const atenuaPorFiltro = filtroCategoria !== 'TODOS' && z.nombre.trim() !== filtroCategoria;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(z.x, z.y, z.ancho, z.alto, 10);

        if (esSeleccionado) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.75)';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
        } else {
          ctx.fillStyle = atenuaPorFiltro ? 'rgba(255, 255, 255, 0.02)' : `${z.color || '#38bdf8'}26`;
          ctx.strokeStyle = atenuaPorFiltro ? 'rgba(255, 255, 255, 0.15)' : z.color || '#38bdf8';
          ctx.lineWidth = 1.8;
        }

        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = atenuaPorFiltro ? '#64748b' : '#ffffff';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(z.nombre, z.x + z.ancho / 2, z.y + z.alto / 2);
        ctx.restore();

        targetsRef.current.push({
          x: z.x,
          y: z.y,
          ancho: z.ancho,
          alto: z.alto,
          categoria: z.nombre.trim(),
          tipo: 'ZONA',
          esVendido: false,
          asiento: {
            id: `${ticketId}-${Date.now().toString().slice(-4)}`,
            numero: z.nombre,
            tipo: 'ZONA_PIE',
            precioBase: z.precioBase,
            zonaId: z.id,
            diaFeria: diaFeriaSeleccionado,
          },
        });
      });
    }

    // 4. Renderizar Palcos VIP (Solo Números con Identificación de Categoría)
    if (mapa.palcos && mapa.palcos.length > 0) {
      mapa.palcos.forEach((p) => {
        const px = p.x || 100;
        const py = p.y || 100;
        const isSilla = (p as any).isSillaSuelta;
        const pw = p.ancho || (isSilla ? 34 : 150);
        const ph = p.alto || (isSilla ? 34 : 85);
        const palcoFullId = `${p.id}-FULL`;

        const esVendido = idsVendidos.includes(palcoFullId);
        const esBloqueado = idsBloqueados.includes(palcoFullId);
        const noDisponible = esVendido || esBloqueado;
        const esSeleccionado = asientosSeleccionados.some((a) => a.id === palcoFullId);

        const colorPalco = (p as any).color || (isSilla ? '#38bdf8' : '#eab308');
        const atenuaPorFiltro = filtroCategoria !== 'TODOS' && p.nombre.trim() !== filtroCategoria;

        ctx.save();
        ctx.beginPath();
        if (isSilla) {
          ctx.arc(px + pw / 2, py + ph / 2, pw / 2, 0, Math.PI * 2);
        } else {
          ctx.roundRect(px, py, pw, ph, 8);
        }

        if (noDisponible) {
          // GRIS: Agotado / No disponible
          ctx.fillStyle = 'rgba(51, 65, 85, 0.88)';
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
        } else if (esSeleccionado) {
          // VERDE BRILLANTE: Tu Selección
          ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 12;
        } else {
          // DISPONIBLE: Translúcido con borde de categoría
          ctx.fillStyle = atenuaPorFiltro ? 'rgba(0, 0, 0, 0.4)' : `${colorPalco}22`;
          ctx.strokeStyle = atenuaPorFiltro ? 'rgba(255, 255, 255, 0.15)' : colorPalco;
          ctx.lineWidth = 2;
        }

        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // EN EL MAPA SALE ÚNICAMENTE EL NÚMERO
        ctx.fillStyle = noDisponible ? '#94a3b8' : esSeleccionado ? '#ffffff' : atenuaPorFiltro ? '#64748b' : colorPalco;
        ctx.font = isSilla ? 'bold 12px system-ui, sans-serif' : 'bold 24px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const numMostrar = (p as any).numero || p.id.replace(/\D/g, '') || '1';
        ctx.fillText(numMostrar, px + pw / 2, py + ph / 2);

        ctx.restore();

        targetsRef.current.push({
          x: px,
          y: py,
          ancho: pw,
          alto: ph,
          categoria: p.nombre.trim(),
          tipo: 'PALCO',
          esVendido: noDisponible,
          asiento: {
            id: palcoFullId,
            numero: `${p.nombre} #${numMostrar}`,
            tipo: 'PALCO',
            precioBase: p.precioPalcoBase,
            palcoId: p.id,
            diaFeria: diaFeriaSeleccionado,
            modoVenta: 'COMPLETO',
          },
        });
      });
    }

    // 5. Renderizar Mesas con Sillas (Solo Número en Mesa)
    if (mapa.mesas && mapa.mesas.length > 0) {
      mapa.mesas.forEach((m) => {
        const mx = m.x || 300;
        const my = m.y || 300;
        const mw = (m as any).ancho || 90;
        const mh = (m as any).alto || 90;
        const mesaId = `${m.id}-FULL`;

        const esVendido = idsVendidos.includes(mesaId);
        const esSeleccionado = asientosSeleccionados.some((a) => a.id === mesaId);
        const colorMesa = (m as any).color || '#6366f1';
        const atenuaPorFiltro = filtroCategoria !== 'TODOS' && m.nombre.trim() !== filtroCategoria;

        ctx.save();
        ctx.beginPath();
        if (m.forma === 'CUADRADA' || (m.forma as string) === 'RECTANGULAR') {
          ctx.roundRect(mx, my, mw, mh, 8);
        } else {
          ctx.ellipse(mx + mw / 2, my + mh / 2, mw / 2, mh / 2, 0, 0, Math.PI * 2);
        }

        if (esVendido) {
          ctx.fillStyle = 'rgba(51, 65, 85, 0.88)';
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
        } else if (esSeleccionado) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3.5;
        } else {
          ctx.fillStyle = atenuaPorFiltro ? 'rgba(0, 0, 0, 0.4)' : `${colorMesa}22`;
          ctx.strokeStyle = atenuaPorFiltro ? 'rgba(255, 255, 255, 0.15)' : colorMesa;
          ctx.lineWidth = 2;
        }

        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = esVendido ? '#94a3b8' : '#ffffff';
        ctx.font = 'bold 18px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const numMesa = (m as any).numero || m.id.replace(/\D/g, '') || '1';
        ctx.fillText(numMesa, mx + mw / 2, my + mh / 2);
        ctx.restore();

        targetsRef.current.push({
          x: mx,
          y: my,
          ancho: mw,
          alto: mh,
          categoria: m.nombre.trim(),
          tipo: 'MESA',
          esVendido,
          asiento: {
            id: mesaId,
            numero: `${m.nombre} #${numMesa}`,
            tipo: 'MESA',
            precioBase: m.precioSillaBase * (m.sillas || 4),
            mesaId: m.id,
            diaFeria: diaFeriaSeleccionado,
          },
        });
      });
    }

    ctx.restore();
  }, [
    mapa,
    asientosSeleccionados,
    idsVendidos,
    idsBloqueados,
    filtroCategoria,
    zoom,
    pan,
    diaFeriaSeleccionado,
  ]);

  useEffect(() => {
    renderizarMapa();
  }, [renderizarMapa]);

  // Manejo de Interacción del Ratón y Selección
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (herramienta === 'pan' || e.button === 1) {
      isDraggingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    const { x, y } = toVirtualCoords(e.clientX, e.clientY);

    // Detección de clic en palcos/mesas
    for (const t of targetsRef.current) {
      if (x >= t.x && x <= t.x + t.ancho && y >= t.y && y <= t.y + t.alto) {
        if (!t.esVendido) {
          onToggleAsiento(t.asiento);
        }
        return;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (herramienta === 'pan' && isDraggingRef.current) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
      return;
    }

    const { x, y } = toVirtualCoords(e.clientX, e.clientY);
    let encontrado = false;

    for (const t of targetsRef.current) {
      if (x >= t.x && x <= t.x + t.ancho && y >= t.y && y <= t.y + t.alto) {
        const rect = canvasRef.current?.getBoundingClientRect();
        const clientX = e.clientX - (rect?.left || 0);
        const clientY = e.clientY - (rect?.top || 0);

        setHoveredData({
          nombre: t.asiento.numero.split('#')[0] || t.asiento.numero,
          numero: t.asiento.numero.includes('#') ? t.asiento.numero.split('#')[1] : '',
          capacidad: t.tipo === 'PALCO' ? 10 : t.tipo === 'MESA' ? 6 : 1,
          precio: t.asiento.precioBase,
          categoria: t.categoria,
          disponible: !t.esVendido,
          x: clientX,
          y: clientY,
        });

        encontrado = true;
        if (canvasRef.current) canvasRef.current.style.cursor = t.esVendido ? 'not-allowed' : 'pointer';
        break;
      }
    }

    if (!encontrado) {
      setHoveredData(null);
      if (canvasRef.current) canvasRef.current.style.cursor = herramienta === 'pan' ? 'grab' : 'default';
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(2.5, Math.max(0.4, Number((prev * factor).toFixed(2)))));
  };

  // Subtotal en vivo
  const totalPagar = asientosSeleccionados.reduce((acc, a) => acc + (a.precioBase || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. BARRA DE FILTROS POR LOCALIDAD ESTILO WHITE FESTIVAL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 block mb-1">
            DISTRIBUCIÓN DEL RECINTO Y LOCALIDADES
          </span>
          <h3 className="text-xl font-black text-white">Mapa Interactivo de Palcos y Aforo</h3>
        </div>

        {/* Pestañas de Filtro Rápido */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-white/10">
          {categoriasDisponibles.map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filtroCategoria === cat
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'TODOS' ? '★ Todas las Zonas' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2. LEYENDA CROMÁTICA OFICIAL DE BIOTICKETS & CONTROLES */}
      <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md border-2 border-amber-400 bg-amber-400/10"></span>
            <span className="text-slate-200">Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            <span className="text-emerald-400">Tu Selección</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-700 border border-slate-600"></span>
            <span className="text-slate-400">Agotado / No Disponible</span>
          </div>
        </div>

        {/* Controles de Navegación del Canvas */}
        <div className="flex items-center bg-slate-900 border border-white/10 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setHerramienta('seleccionar')}
            className={`p-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              herramienta === 'seleccionar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Seleccionar Localidad"
          >
            <MousePointer className="w-4 h-4" />
          </button>
          <button
            onClick={() => setHerramienta('pan')}
            className={`p-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              herramienta === 'pan' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Mover Plano (Pan)"
          >
            <Hand className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
            className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-white px-1">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
            className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
            title="Restablecer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. VISOR CANVAS INTERACTIVO 1600x1000 */}
      <div className="relative glass-panel p-2 rounded-3xl border border-white/10 bg-slate-950 flex flex-col items-center overflow-hidden">
        {/* Tooltip Flotante de Biotickets al pasar el cursor */}
        {hoveredData && (
          <div
            className="absolute z-30 pointer-events-none p-3 rounded-2xl bg-slate-950/95 border border-indigo-400/50 shadow-2xl backdrop-blur-xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${hoveredData.x}px`,
              top: `${hoveredData.y}px`,
            }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  hoveredData.disponible ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              ></span>
              <span className="font-bold text-white">
                {hoveredData.nombre} {hoveredData.numero && `#${hoveredData.numero}`}
              </span>
            </div>
            <div className="text-[11px] text-slate-300">
              Capacidad: <strong className="text-amber-300">{hoveredData.capacidad} personas</strong>
            </div>
            <div className="font-mono font-black text-sm text-emerald-400">
              {hoveredData.precio.toLocaleString('es-ES')} {evento.moneda}
            </div>
            <div className="text-[9px] uppercase font-bold text-slate-400">
              {hoveredData.disponible ? '✓ Haz clic para seleccionar' : '✕ Localidad Agotada'}
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={1600}
          height={1000}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          style={{ touchAction: 'none' }}
          className="rounded-2xl max-w-full h-auto border border-white/5 select-none"
        />

        <div className="w-full flex justify-between items-center text-[10px] text-slate-500 pt-2 px-3">
          <span>Haz clic directamente en el número de tu palco o mesa para reservarlo.</span>
          <span className="font-mono text-slate-400">Resolución Oficial: 1600×1000 px</span>
        </div>
      </div>

      {/* 4. TARJETAS DE CARACTERÍSTICAS Y PRECIOS POR LOCALIDAD (ESTILO WHITE FESTIVAL) */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
          <Crown className="w-4 h-4 text-amber-400" />
          Localidades y Fases de Preventa Disponibles:
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tarjeta Palcos Diamante */}
          <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-amber-400 block">Zona Premium</span>
                <h5 className="text-base font-black text-white mt-0.5">Palcos Diamante</h5>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                10 Personas
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Ubicación privilegiada frente al escenario principal. Incluye atención personalizada de meseros y accesos preferenciales.
            </p>
            <div className="pt-2 border-t border-white/10 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Precio Palco:</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {(800).toLocaleString('es-ES')} {evento.moneda}
                </span>
              </div>
              <button
                onClick={() => setFiltroCategoria('Palco Diamante')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Ver en Mapa
              </button>
            </div>
          </div>

          {/* Tarjeta Palcos Oro */}
          <div className="glass-panel p-5 rounded-3xl border border-indigo-500/30 space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 block">Zona VIP</span>
                <h5 className="text-base font-black text-white mt-0.5">Palcos Oro & Plata</h5>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                8-10 Personas
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Vista panorámica central elevada con servicio de barra y comodidad exclusiva para grupos de amigos o corporativos.
            </p>
            <div className="pt-2 border-t border-white/10 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Precio Palco:</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {(500).toLocaleString('es-ES')} {evento.moneda}
                </span>
              </div>
              <button
                onClick={() => setFiltroCategoria('Palco Oro')}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Ver en Mapa
              </button>
            </div>
          </div>

          {/* Tarjeta General / Front Stage */}
          <div className="glass-panel p-5 rounded-3xl border border-sky-500/30 space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-sky-400 block">Admisión General</span>
                <h5 className="text-base font-black text-white mt-0.5">Pista & Front Stage</h5>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                De Pie
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Acceso a la pista de baile más cercana al escenario con excelente acústica y ambiente del festival.
            </p>
            <div className="pt-2 border-t border-white/10 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Desde:</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {(45).toLocaleString('es-ES')} {evento.moneda}
                </span>
              </div>
              <button
                onClick={() => setFiltroCategoria('Front Stage')}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Ver en Mapa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
