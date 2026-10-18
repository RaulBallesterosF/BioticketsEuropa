import React, { useRef, useEffect, useState } from 'react';
import {
  MapaRecinto,
  AsientoItem,
  Evento,
  PalcoVIP,
  MesaEspecial,
  ZonaDePie,
} from '../types';
import {
  Users,
  Crown,
  Sparkles,
  Calendar,
  Check,
  ZoomIn,
  ZoomOut,
  Hand,
  MousePointer,
  RefreshCw,
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
  tipo: 'PALCO' | 'MESA' | 'ZONA' | 'FILA';
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

  // Navegación Pan y Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [herramienta, setHerramienta] = useState<'seleccionar' | 'pan'>('seleccionar');
  const [hoveredItem, setHoveredItem] = useState<{ nombre: string; precio: number; disponible: boolean } | null>(null);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Precarga de la imagen original del recinto
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
      renderizarTaquilla();
    };
  }, [mapa.imagenFondo]);

  const toVirtualCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  // Renderizado de Taquilla con Overlay Transparente
  const renderizarTaquilla = () => {
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

    // 1. Imagen Original del Recinto (Siempre visible en alta resolución)
    if (imgFondoRef.current) {
      ctx.drawImage(imgFondoRef.current, 0, 0, 1400, 950);
    }

    // 2. Palcos VIP con Estados Cromáticos Solicitados
    if (mapa.palcos && mapa.palcos.length > 0) {
      mapa.palcos.forEach((p) => {
        const px = p.x || 100;
        const py = p.y || 100;
        const pw = p.ancho || 150;
        const ph = p.alto || 85;
        const palcoId = `${p.id}-FULL`;

        const esVendido = idsVendidos.includes(palcoId);
        const esBloqueado = idsBloqueados.includes(palcoId);
        const noDisponible = esVendido || esBloqueado;
        const esSeleccionado = asientosSeleccionados.some((a) => a.id === palcoId);

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 8);

        if (noDisponible) {
          // GRIS: No Disponible / Vendido
          ctx.fillStyle = 'rgba(71, 85, 105, 0.85)';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.5;
        } else if (esSeleccionado) {
          // VERDE BRILLANTE: Tu Selección Actual / Posible Compra
          ctx.fillStyle = 'rgba(16, 185, 129, 0.75)';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
        } else {
          // TRANSPARENTE: Disponible (Permite ver el mapa original debajo)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.strokeStyle = (p as any).color || 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 1.5;
        }

        ctx.fill();
        ctx.stroke();

        // Texto informativo del palco
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        const titulo = (p as any).numero ? `${p.nombre} #${(p as any).numero}` : p.nombre;
        ctx.fillText(titulo, px + pw / 2, py + 20);

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = noDisponible ? '#94a3b8' : esSeleccionado ? '#ffffff' : '#e2e8f0';
        ctx.fillText(
          noDisponible ? 'NO DISPONIBLE' : `${p.capacidad}p - ${p.precioPalcoBase} ${evento.moneda}`,
          px + pw / 2,
          py + ph - 14
        );

        ctx.restore();

        // Registro de área de clic
        targetsRef.current.push({
          x: px,
          y: py,
          ancho: pw,
          alto: ph,
          tipo: 'PALCO',
          esVendido: noDisponible,
          asiento: {
            id: palcoId,
            numero: titulo,
            tipo: 'PALCO',
            precioBase: p.precioPalcoBase,
            palcoId: p.id,
            diaFeria: diaFeriaSeleccionado,
            modoVenta: 'COMPLETO',
          },
        });
      });
    }

    // 3. Zonas de Pie
    if (mapa.zonasDePie && mapa.zonasDePie.length > 0) {
      mapa.zonasDePie.forEach((z) => {
        const zonaTicketId = `ZP-${z.id}`;
        const esSeleccionado = asientosSeleccionados.some((a) => a.id.startsWith(zonaTicketId));

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(z.x, z.y, z.ancho, z.alto, 8);

        if (esSeleccionado) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.65)';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
        } else {
          ctx.fillStyle = `${z.color || '#38bdf8'}22`;
          ctx.strokeStyle = z.color || '#38bdf8';
          ctx.lineWidth = 1.5;
        }

        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${z.nombre} - ${z.precioBase} ${evento.moneda}`, z.x + z.ancho / 2, z.y + z.alto / 2 + 4);
        ctx.restore();

        targetsRef.current.push({
          x: z.x,
          y: z.y,
          ancho: z.ancho,
          alto: z.alto,
          tipo: 'ZONA',
          esVendido: false,
          asiento: {
            id: `${zonaTicketId}-${Date.now().toString().slice(-4)}`,
            numero: `${z.nombre} (Entrada de Pie)`,
            tipo: 'ZONA_PIE',
            precioBase: z.precioBase,
            zonaId: z.id,
            diaFeria: diaFeriaSeleccionado,
          },
        });
      });
    }

    ctx.restore();
  };

  useEffect(() => {
    renderizarTaquilla();
  }, [mapa, asientosSeleccionados, idsVendidos, idsBloqueados, zoom, pan]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (herramienta === 'pan' || e.button === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    const { x, y } = toVirtualCoords(e.clientX, e.clientY);

    // Búsqueda de clic en objetivos registrados
    for (const t of targetsRef.current) {
      if (x >= t.x && x <= t.x + t.ancho && y >= t.y && y <= t.y + t.alto) {
        if (!t.esVendido) {
          onToggleAsiento(t.asiento);
        }
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
        setHoveredItem({
          nombre: t.asiento.numero,
          precio: t.asiento.precioBase,
          disponible: !t.esVendido,
        });
        encontrado = true;
        if (canvasRef.current) canvasRef.current.style.cursor = t.esVendido ? 'not-allowed' : 'pointer';
        break;
      }
    }

    if (!encontrado) {
      setHoveredItem(null);
      if (canvasRef.current) canvasRef.current.style.cursor = herramienta === 'pan' ? 'grab' : 'default';
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(2.5, Math.max(0.4, Number((prev * factor).toFixed(2)))));
  };

  return (
    <div className="space-y-4">
      {/* Barra de Herramientas de Navegación Fan */}
      <div className="glass-panel p-3.5 rounded-3xl border border-white/10 flex flex-wrap justify-between items-center gap-3">
        {/* Leyenda de Estados Solicitada */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md border border-white/40 bg-white/5"></span>
            <span className="text-slate-300">Transparente: Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            <span className="text-emerald-400">Verde: Tu Selección</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-600"></span>
            <span className="text-slate-400">Gris: No Disponible</span>
          </div>
        </div>

        {/* Controles de Zoom y Movimiento */}
        <div className="flex items-center bg-slate-900 border border-white/10 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setHerramienta('seleccionar')}
            className={`p-1.5 rounded-xl text-xs font-bold transition ${
              herramienta === 'seleccionar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Seleccionar Asiento"
          >
            <MousePointer className="w-4 h-4" />
          </button>
          <button
            onClick={() => setHerramienta('pan')}
            className={`p-1.5 rounded-xl text-xs font-bold transition ${
              herramienta === 'pan' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Mover Plano"
          >
            <Hand className="w-4 h-4" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))} className="p-1.5 text-slate-400 hover:text-white">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-white px-1">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))} className="p-1.5 text-slate-400 hover:text-white">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visor Canvas del Plano */}
      <div className="relative glass-panel p-2 rounded-3xl border border-white/10 bg-slate-950 flex flex-col items-center overflow-hidden">
        {hoveredItem && (
          <div className="absolute top-4 right-4 z-20 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-white/20 shadow-2xl backdrop-blur-md text-xs pointer-events-none animate-fadeIn">
            <span className="font-bold text-white block">{hoveredItem.nombre}</span>
            <span className={`font-mono font-bold ${hoveredItem.disponible ? 'text-emerald-400' : 'text-slate-400'}`}>
              {hoveredItem.disponible ? `${hoveredItem.precio} ${evento.moneda}` : 'NO DISPONIBLE'}
            </span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={1400}
          height={950}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="rounded-2xl max-w-full h-auto border border-white/5 select-none"
        />
      </div>
    </div>
  );
};
