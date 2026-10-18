import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Evento,
  MapaRecinto,
  FilaAsientos,
  MesaEspecial,
  PalcoVIP,
  ZonaDePie,
  FormaMesa,
  ModoVentaPalco,
} from '../types';
import {
  Compass,
  Plus,
  Trash2,
  Copy,
  Save,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Crown,
  Coffee,
  CheckCircle2,
  Upload,
  Calendar,
  Move,
  MousePointer,
  Eye,
  Sliders,
  Settings2,
  Maximize2,
  RotateCcw,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  DollarSign,
  Users,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Hand,
  Grid,
  Palette,
  MapPin,
  RefreshCw,
} from 'lucide-react';

interface SeatMapStudioProps {
  evento: Evento;
  mapaActual: MapaRecinto;
  onGuardar: (mapa: Partial<MapaRecinto>) => Promise<void>;
  onActualizarEvento?: (cambios: Partial<Evento>) => Promise<void>;
  onCambiarTab?: (tab: string) => void;
}

type TipoElemento = 'fila' | 'mesa' | 'palco' | 'zona';

interface ElementoSeleccionado {
  tipo: TipoElemento;
  id: string;
}

// Extensión local compatible para filas con soporte de arcos y rotación
interface FilaExtendida extends FilaAsientos {
  xOffset?: number;
  curvatura?: number; // 0 = recta, >0 = radio de curvatura en abanico
  anguloInicio?: number;
  rotacion?: number;
  categoria?: string;
}

const CATEGORIAS_PRECIO = [
  { nombre: 'VIP Platinum', color: '#eab308', precio: 120.0 },
  { nombre: 'Platea Gold', color: '#6366f1', precio: 85.0 },
  { nombre: 'Preferente Silver', color: '#38bdf8', precio: 65.0 },
  { nombre: 'General Grada', color: '#10b981', precio: 45.0 },
  { nombre: 'Visibilidad Reducida', color: '#94a3b8', precio: 30.0 },
];

export const SeatMapStudio: React.FC<SeatMapStudioProps> = ({
  evento,
  mapaActual,
  onGuardar,
  onActualizarEvento,
  onCambiarTab,
}) => {
  // Estado de componentes del mapa
  const [imagenFondo, setImagenFondo] = useState(mapaActual.imagenFondo || '');
  const [imagenFondoOpacidad, setImagenFondoOpacidad] = useState(
    mapaActual.imagenFondoOpacidad !== undefined ? mapaActual.imagenFondoOpacidad : 0.35
  );
  const [aforoGeneral, setAforoGeneral] = useState(
    mapaActual.aforoGeneral || { total: 100, vendidas: 0, precioBase: 35, nombre: 'Pista General' }
  );
  const [filas, setFilas] = useState<FilaExtendida[]>(
    (mapaActual.filas || []).map((f) => ({
      ...f,
      curvatura: (f as any).curvatura || 0,
      xOffset: (f as any).xOffset || 0,
      rotacion: (f as any).rotacion || 0,
    }))
  );
  const [mesas, setMesas] = useState<MesaEspecial[]>(mapaActual.mesas || []);
  const [palcos, setPalcos] = useState<PalcoVIP[]>(mapaActual.palcos || []);
  const [zonasDePie, setZonasDePie] = useState<ZonaDePie[]>(mapaActual.zonasDePie || []);

  // Control de eventos tipo feria o fecha única
  const [tipoEvento, setTipoEvento] = useState<'CONCIERTO_UNICO' | 'FERIA_MULTIDIA'>(
    evento.tipoEvento || 'CONCIERTO_UNICO'
  );
  const [diasFeria, setDiasFeria] = useState(evento.diasFeria || 3);

  // Navegación del lienzo y transformaciones
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [herramienta, setHerramienta] = useState<'seleccionar' | 'pan' | 'dibujar_zona'>('seleccionar');
  const [tabActiva, setTabActiva] = useState<'filas' | 'mesas' | 'palcos' | 'zonas' | 'fondo' | 'tarifas'>('filas');
  const [elementoSeleccionado, setElementoSeleccionado] = useState<ElementoSeleccionado | null>(null);

  // Estados de persistencia
  const [guardando, setGuardando] = useState(false);
  const [guardadoExito, setGuardadoExito] = useState(false);

  // Referencias para Canvas y Arrastre
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgFondoRef = useRef<HTMLImageElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const elementoOffsetRef = useRef({ x: 0, y: 0 });
  const dibujoZonaRef = useRef<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  // Precargar imagen de fondo
  useEffect(() => {
    if (!imagenFondo) {
      imgFondoRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imagenFondo;
    img.onload = () => {
      imgFondoRef.current = img;
    };
    img.onerror = () => {
      imgFondoRef.current = null;
    };
  }, [imagenFondo]);

  // Dibujar polígonos regulares para mesas
  const dibujarPoligono = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radio: number,
    lados: number,
    rotacionOffset = 0
  ) => {
    ctx.beginPath();
    for (let i = 0; i < lados; i++) {
      const angulo = (i * 2 * Math.PI) / lados + rotacionOffset;
      const px = cx + radio * Math.cos(angulo);
      const py = cy + radio * Math.sin(angulo);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  // Renderizador principal del lienzo Canvas 2D
  const renderizar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Fondo del estudio
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, w, h);

    // Aplicar transformaciones de Zoom y Desplazamiento (Pan)
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Cuadrícula arquitectónica milimétrica
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1 / zoom;
    const gridSize = 25;
    const minX = -pan.x / zoom;
    const maxX = (w - pan.x) / zoom;
    const minY = -pan.y / zoom;
    const maxY = (h - pan.y) / zoom;

    ctx.beginPath();
    for (let x = Math.floor(minX / gridSize) * gridSize; x < maxX; x += gridSize) {
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
    }
    for (let y = Math.floor(minY / gridSize) * gridSize; y < maxY; y += gridSize) {
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
    }
    ctx.stroke();

    // 2. Imagen de fondo calibrada
    if (imgFondoRef.current) {
      ctx.save();
      ctx.globalAlpha = imagenFondoOpacidad;
      ctx.drawImage(imgFondoRef.current, 0, 0, 1000, 700);
      ctx.restore();
    }

    // 3. Escenario / Stage Principal
    const stageWidth = 640;
    const stageX = (1000 - stageWidth) / 2;
    const grad = ctx.createLinearGradient(stageX, 20, stageX + stageWidth, 60);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#4338ca');
    grad.addColorStop(1, '#312e81');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(stageX, 20, stageWidth, 42, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESCENARIO PRINCIPAL / STAGE', 500, 46);

    // 4. Zonas de Pie / General Admission
    zonasDePie.forEach((z) => {
      const esSel = elementoSeleccionado?.tipo === 'zona' && elementoSeleccionado.id === z.id;
      ctx.save();
      ctx.fillStyle = `${z.color || '#38bdf8'}24`;
      ctx.strokeStyle = esSel ? '#ffffff' : z.color || '#38bdf8';
      ctx.lineWidth = esSel ? 3 : 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.roundRect(z.x, z.y, z.ancho, z.alto, 12);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = z.color || '#38bdf8';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${z.nombre} — [Aforo: ${z.aforoMaximo} pax] — ${z.precioBase} ${evento.moneda}`,
        z.x + z.ancho / 2,
        z.y + z.alto / 2 + 4
      );
      ctx.restore();
    });

    // 5. Filas de Asientos (Rectas y Curvas en Abanico / Herradura)
    filas.forEach((fila, fIndex) => {
      const esSel = elementoSeleccionado?.tipo === 'fila' && elementoSeleccionado.id === fila.id;
      const startY = fila.yOffset !== undefined ? fila.yOffset : 130 + fIndex * 42;
      const curvatura = fila.curvatura || 0;
      const xBase = (fila.xOffset || 0) + 500;

      ctx.fillStyle = esSel ? '#38bdf8' : fila.color || '#a5b4fc';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(fila.nombre, xBase - (fila.asientos * 30) / 2 - 20, startY + 12);

      for (let i = 0; i < fila.asientos; i++) {
        let seatX = 0;
        let seatY = 0;

        if (curvatura > 0) {
          // Disposición en abanico / curva (Radial)
          const angleSpan = (fila.asientos * 3.5 * Math.PI) / 180;
          const startAngle = -Math.PI / 2 - angleSpan / 2;
          const currentAngle = startAngle + (i / (fila.asientos - 1 || 1)) * angleSpan;
          seatX = xBase + Math.cos(currentAngle) * curvatura;
          seatY = startY + Math.sin(currentAngle) * curvatura + curvatura;
        } else {
          // Disposición recta tradicional
          const spacing = 32;
          const totalWidth = fila.asientos * spacing;
          seatX = xBase - totalWidth / 2 + i * spacing + 16;
          seatY = startY;
        }

        ctx.beginPath();
        ctx.arc(seatX, seatY, 11, 0, Math.PI * 2);
        ctx.fillStyle = esSel ? '#0284c7' : '#1e293b';
        ctx.strokeStyle = esSel ? '#ffffff' : fila.color || '#64748b';
        ctx.lineWidth = esSel ? 2.5 : 1.5;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, seatX, seatY + 3.5);
      }
    });

    // 6. Mesas Geométricas Lounge
    mesas.forEach((mesa) => {
      const mx = mesa.x || 500;
      const my = mesa.y || 360;
      const radio = mesa.tamano || 24;
      const esSel = elementoSeleccionado?.tipo === 'mesa' && elementoSeleccionado.id === mesa.id;

      ctx.save();
      ctx.fillStyle = esSel ? 'rgba(99, 102, 241, 0.45)' : '#1e1b4b';
      ctx.strokeStyle = esSel ? '#38bdf8' : '#818cf8';
      ctx.lineWidth = esSel ? 3 : 2;

      switch (mesa.forma) {
        case 'REDONDA':
          ctx.beginPath();
          ctx.arc(mx, my, radio, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
        case 'CUADRADA':
          ctx.beginPath();
          ctx.roundRect(mx - radio, my - radio, radio * 2, radio * 2, 8);
          ctx.fill();
          ctx.stroke();
          break;
        case 'HEXAGONAL':
          dibujarPoligono(ctx, mx, my, radio, 6, Math.PI / 6);
          ctx.fill();
          ctx.stroke();
          break;
        case 'OCTOGONAL':
          dibujarPoligono(ctx, mx, my, radio, 8, Math.PI / 8);
          ctx.fill();
          ctx.stroke();
          break;
        case 'TRIANGULAR':
          dibujarPoligono(ctx, mx, my, radio, 3, -Math.PI / 2);
          ctx.fill();
          ctx.stroke();
          break;
      }

      ctx.fillStyle = '#e0e7ff';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mesa.id, mx, my + 3.5);
      ctx.restore();

      // Sillas satélite
      const sillas = mesa.sillas || 4;
      for (let s = 0; s < sillas; s++) {
        const angulo = (s * 2 * Math.PI) / sillas - Math.PI / 2;
        const sx = mx + Math.cos(angulo) * (radio + 16);
        const sy = my + Math.sin(angulo) * (radio + 16);

        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 1.2;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${s + 1}`, sx, sy + 2.5);
      }
    });

    // 7. Palcos VIP / Suites
    palcos.forEach((p) => {
      const px = p.x || 100;
      const py = p.y || 460;
      const pw = p.ancho || 260;
      const ph = p.alto || 120;
      const esSel = elementoSeleccionado?.tipo === 'palco' && elementoSeleccionado.id === p.id;
      const totalSillas = p.capacidad + (p.sillasAdicionales || 0);

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 12);
      ctx.fillStyle = esSel ? 'rgba(168, 85, 247, 0.25)' : 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = esSel ? '#38bdf8' : p.modoVenta === 'COMPLETO' ? '#eab308' : '#a855f7';
      ctx.lineWidth = esSel ? 3 : 2;
      ctx.fill();
      ctx.stroke();

      // Encabezado del Palco
      ctx.fillStyle = p.modoVenta === 'COMPLETO' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(168, 85, 247, 0.2)';
      ctx.beginPath();
      ctx.roundRect(px, py, pw, 24, [12, 12, 0, 0]);
      ctx.fill();

      ctx.fillStyle = p.modoVenta === 'COMPLETO' ? '#fde047' : '#d8b4fe';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`★ ${p.nombre}`, px + 10, py + 16);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${p.modoVenta || 'INDIVIDUAL'} (${totalSillas}p)`, px + pw - 10, py + 16);
      ctx.restore();
    });

    // 8. Trazo de dibujo de zona en tiempo real
    if (dibujoZonaRef.current) {
      const dz = dibujoZonaRef.current;
      const rx = Math.min(dz.startX, dz.currentX);
      const ry = Math.min(dz.startY, dz.currentY);
      const rw = Math.abs(dz.currentX - dz.startX);
      const rh = Math.abs(dz.currentY - dz.startY);

      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [filas, mesas, palcos, zonasDePie, elementoSeleccionado, zoom, pan, imagenFondoOpacidad, evento.moneda]);

  useEffect(() => {
    renderizar();
  }, [renderizar]);

  // Transformar coordenadas de pantalla a espacio virtual del lienzo
  const transformarCoordenadas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    return {
      x: (clientX - pan.x) / zoom,
      y: (clientY - pan.y) / zoom,
    };
  };

  // Gestión de Eventos del Ratón
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = transformarCoordenadas(e);

    if (herramienta === 'pan' || e.button === 1 || e.spaceKey) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    if (herramienta === 'dibujar_zona') {
      dibujoZonaRef.current = { startX: x, startY: y, currentX: x, currentY: y };
      renderizar();
      return;
    }

    // Comprobar colisión con Palcos
    for (const p of [...palcos].reverse()) {
      const px = p.x || 100;
      const py = p.y || 460;
      const pw = p.ancho || 260;
      const ph = p.alto || 120;
      if (x >= px && x <= px + pw && y >= py && y <= py + ph) {
        setElementoSeleccionado({ tipo: 'palco', id: p.id });
        isDraggingRef.current = true;
        elementoOffsetRef.current = { x: x - px, y: y - py };
        return;
      }
    }

    // Comprobar colisión con Mesas
    for (const m of [...mesas].reverse()) {
      const mx = m.x || 500;
      const my = m.y || 360;
      const rad = (m.tamano || 24) + 20;
      const dx = x - mx;
      const dy = y - my;
      if (dx * dx + dy * dy <= rad * rad) {
        setElementoSeleccionado({ tipo: 'mesa', id: m.id });
        isDraggingRef.current = true;
        elementoOffsetRef.current = { x: dx, y: dy };
        return;
      }
    }

    // Comprobar colisión con Zonas de Pie
    for (const z of [...zonasDePie].reverse()) {
      if (x >= z.x && x <= z.x + z.ancho && y >= z.y && y <= z.y + z.alto) {
        setElementoSeleccionado({ tipo: 'zona', id: z.id });
        isDraggingRef.current = true;
        elementoOffsetRef.current = { x: x - z.x, y: y - z.y };
        return;
      }
    }

    // Comprobar selección de Filas
    for (const f of filas) {
      const fy = f.yOffset !== undefined ? f.yOffset : 130;
      if (Math.abs(y - fy) < 25) {
        setElementoSeleccionado({ tipo: 'fila', id: f.id });
        isDraggingRef.current = true;
        elementoOffsetRef.current = { x: x - (f.xOffset || 0), y: y - fy };
        return;
      }
    }

    setElementoSeleccionado(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (herramienta === 'pan' && isDraggingRef.current) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
      return;
    }

    const { x, y } = transformarCoordenadas(e);

    if (herramienta === 'dibujar_zona' && dibujoZonaRef.current) {
      dibujoZonaRef.current.currentX = x;
      dibujoZonaRef.current.currentY = y;
      renderizar();
      return;
    }

    if (isDraggingRef.current && elementoSeleccionado) {
      if (elementoSeleccionado.tipo === 'palco') {
        setPalcos((prev) =>
          prev.map((p) =>
            p.id === elementoSeleccionado.id
              ? { ...p, x: Math.round(x - elementoOffsetRef.current.x), y: Math.round(y - elementoOffsetRef.current.y) }
              : p
          )
        );
      } else if (elementoSeleccionado.tipo === 'mesa') {
        setMesas((prev) =>
          prev.map((m) =>
            m.id === elementoSeleccionado.id
              ? { ...m, x: Math.round(x - elementoOffsetRef.current.x), y: Math.round(y - elementoOffsetRef.current.y) }
              : m
          )
        );
      } else if (elementoSeleccionado.tipo === 'zona') {
        setZonasDePie((prev) =>
          prev.map((z) =>
            z.id === elementoSeleccionado.id
              ? { ...z, x: Math.round(x - elementoOffsetRef.current.x), y: Math.round(y - elementoOffsetRef.current.y) }
              : z
          )
        );
      } else if (elementoSeleccionado.tipo === 'fila') {
        setFilas((prev) =>
          prev.map((f) =>
            f.id === elementoSeleccionado.id
              ? { ...f, yOffset: Math.round(y - elementoOffsetRef.current.y), xOffset: Math.round(x - elementoOffsetRef.current.x) }
              : f
          )
        );
      }
    }
  };

  const handleMouseUp = () => {
    if (herramienta === 'dibujar_zona' && dibujoZonaRef.current) {
      const dz = dibujoZonaRef.current;
      const rx = Math.round(Math.min(dz.startX, dz.currentX));
      const ry = Math.round(Math.min(dz.startY, dz.currentY));
      const rw = Math.round(Math.abs(dz.currentX - dz.startX));
      const rh = Math.round(Math.abs(dz.currentY - dz.startY));

      if (rw > 40 && rh > 30) {
        const id = `zp-${Date.now().toString().slice(-4)}`;
        const nuevaZona: ZonaDePie = {
          id,
          nombre: `Zona Admisión #${zonasDePie.length + 1}`,
          color: '#38bdf8',
          precioBase: 40.0,
          aforoMaximo: Math.max(50, Math.round((rw * rh) / 30)),
          vendidas: 0,
          x: rx,
          y: ry,
          ancho: rw,
          alto: rh,
        };
        setZonasDePie([...zonasDePie, nuevaZona]);
        setElementoSeleccionado({ tipo: 'zona', id });
      }
      dibujoZonaRef.current = null;
      setHerramienta('seleccionar');
    }
    isDraggingRef.current = false;
  };

  // Zoom interactivo con rueda del ratón
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(2.5, Math.max(0.4, Number((prev * factor).toFixed(2)))));
  };

  // Generador de Bloque de Gradas Curvas / Rectas
  const agregarBloqueGradas = (tipo: 'recta' | 'curva') => {
    const idNum = filas.length + 1;
    const nuevaFila: FilaExtendida = {
      id: `f-${String.fromCharCode(64 + idNum)}`,
      nombre: `Fila ${String.fromCharCode(64 + idNum)}`,
      precioBase: 65.0,
      asientos: 12,
      color: '#6366f1',
      yOffset: 120 + filas.length * 40,
      xOffset: 0,
      curvatura: tipo === 'curva' ? 380 : 0,
    };
    setFilas([...filas, nuevaFila]);
    setElementoSeleccionado({ tipo: 'fila', id: nuevaFila.id });
  };

  // Guardar en producción
  const handleGuardarTodo = async () => {
    setGuardando(true);
    setGuardadoExito(false);
    try {
      await onGuardar({
        imagenFondo,
        imagenFondoOpacidad,
        aforoGeneral,
        filas,
        mesas,
        palcos,
        zonasDePie,
      });
      if (onActualizarEvento) {
        await onActualizarEvento({
          tipoEvento,
          diasFeria,
        });
      }
      setGuardadoExito(true);
      setTimeout(() => setGuardadoExito(false), 3000);
    } finally {
      setGuardando(false);
    }
  };

  // Elementos activos para el Inspector
  const filaActiva = filas.find((f) => f.id === elementoSeleccionado?.id);
  const mesaActiva = mesas.find((m) => m.id === elementoSeleccionado?.id);
  const palcoActivo = palcos.find((p) => p.id === elementoSeleccionado?.id);
  const zonaActiva = zonasDePie.find((z) => z.id === elementoSeleccionado?.id);

  return (
    <div className="space-y-6">
      {/* Barra de Control Superior */}
      <div className="glass-panel p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Studio SeatMap Engine Pro
            </span>
            <span className="text-xs text-slate-400">Recinto: {evento.lugar}</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Diseñador Vectorial de Aforo y Asientos</h2>
        </div>

        {/* Controles de Zoom, Modo y Guardado */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-slate-900 border border-white/10 rounded-2xl p-1">
            <button
              onClick={() => setHerramienta('seleccionar')}
              className={`p-2 rounded-xl text-xs font-bold transition ${
                herramienta === 'seleccionar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Herramienta Selección"
            >
              <MousePointer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setHerramienta('pan')}
              className={`p-2 rounded-xl text-xs font-bold transition ${
                herramienta === 'pan' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Mover Lienzo (Pan)"
            >
              <Hand className="w-4 h-4" />
            </button>
            <button
              onClick={() => setHerramienta('dibujar_zona')}
              className={`p-2 rounded-xl text-xs font-bold transition ${
                herramienta === 'dibujar_zona' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Dibujar Zona de Pie"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center bg-slate-900 border border-white/10 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
              className="p-2 text-slate-400 hover:text-white rounded-xl"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-white px-1.5">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
              className="p-2 text-slate-400 hover:text-white rounded-xl"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-2 text-slate-400 hover:text-white rounded-xl"
              title="Restablecer Vista"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleGuardarTodo}
            disabled={guardando}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {guardadoExito ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardado Exitoso!</span>
              </>
            ) : guardando ? (
              <span>Guardando...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Plano</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid Principal: Paleta de Elementos + Lienzo + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Toolbox */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel rounded-3xl p-4 border border-white/10 space-y-4">
            <div className="flex flex-wrap gap-1 pb-3 border-b border-white/10">
              <button
                onClick={() => setTabActiva('filas')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  tabActiva === 'filas' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Graderío</span>
              </button>
              <button
                onClick={() => setTabActiva('mesas')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  tabActiva === 'mesas' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Mesas</span>
              </button>
              <button
                onClick={() => setTabActiva('palcos')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  tabActiva === 'palcos' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Palcos</span>
              </button>
              <button
                onClick={() => setTabActiva('fondo')}
                className={`p-2 rounded-xl text-xs font-bold transition ${
                  tabActiva === 'fondo' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Plano de Fondo"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-herramientas según pestaña */}
            {tabActiva === 'filas' && (
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Generadores de Asientos:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => agregarBloqueGradas('recta')}
                    className="p-3 rounded-2xl bg-slate-900 border border-white/10 hover:border-indigo-500/50 text-left transition flex flex-col gap-1 cursor-pointer"
                  >
                    <Grid className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Fila Recta</span>
                    <span className="text-[10px] text-slate-400">Alineación ortogonal</span>
                  </button>
                  <button
                    onClick={() => agregarBloqueGradas('curva')}
                    className="p-3 rounded-2xl bg-slate-900 border border-white/10 hover:border-indigo-500/50 text-left transition flex flex-col gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Grada Curva</span>
                    <span className="text-[10px] text-slate-400">Arco radial en abanico</span>
                  </button>
                </div>
              </div>
            )}

            {tabActiva === 'mesas' && (
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Mesas y Banquetes:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const id = `M${mesas.length + 1}`;
                      setMesas([
                        ...mesas,
                        {
                          id,
                          nombre: `Mesa Redonda #${mesas.length + 1}`,
                          forma: 'REDONDA',
                          sillas: 6,
                          precioSillaBase: 60.0,
                          tamano: 26,
                          x: 500,
                          y: 350,
                        },
                      ]);
                      setElementoSeleccionado({ tipo: 'mesa', id });
                    }}
                    className="p-3 rounded-2xl bg-slate-900 border border-white/10 hover:border-indigo-500/50 text-left transition flex items-center gap-2 cursor-pointer"
                  >
                    <Circle className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Mesa Redonda (6p)</span>
                  </button>
                  <button
                    onClick={() => {
                      const id = `M${mesas.length + 1}`;
                      setMesas([
                        ...mesas,
                        {
                          id,
                          nombre: `Mesa Cuadrada #${mesas.length + 1}`,
                          forma: 'CUADRADA',
                          sillas: 4,
                          precioSillaBase: 50.0,
                          tamano: 22,
                          x: 500,
                          y: 350,
                        },
                      ]);
                      setElementoSeleccionado({ tipo: 'mesa', id });
                    }}
                    className="p-3 rounded-2xl bg-slate-900 border border-white/10 hover:border-indigo-500/50 text-left transition flex items-center gap-2 cursor-pointer"
                  >
                    <Square className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Mesa Cuadrada (4p)</span>
                  </button>
                </div>
              </div>
            )}

            {tabActiva === 'palcos' && (
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Palcos VIP & Suites Privadas:
                </span>
                <button
                  onClick={() => {
                    const id = `P${palcos.length + 1}`;
                    setPalcos([
                      ...palcos,
                      {
                        id,
                        nombre: `Palco VIP #${palcos.length + 1}`,
                        capacidad: 8,
                        sillasAdicionales: 0,
                        precioPalcoBase: 480.0,
                        modoVenta: 'INDIVIDUAL',
                        precioSillaIndividual: 60.0,
                        x: 200,
                        y: 450,
                        ancho: 260,
                        alto: 120,
                      },
                    ]);
                    setElementoSeleccionado({ tipo: 'palco', id });
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Crown className="w-4 h-4 text-amber-300" />
                  <span>Añadir Palco VIP (8 Plazas)</span>
                </button>
              </div>
            )}

            {tabActiva === 'fondo' && (
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Plano Arquitectónico de Fondo:
                </span>
                <input
                  type="url"
                  placeholder="URL de la imagen del plano (JPG, PNG, SVG)..."
                  value={imagenFondo}
                  onChange={(e) => setImagenFondo(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Opacidad del Plano:</span>
                  <span className="font-mono text-white">{Math.round(imagenFondoOpacidad * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={imagenFondoOpacidad}
                  onChange={(e) => setImagenFondoOpacidad(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Inspector de Propiedades */}
          {elementoSeleccionado && (
            <div className="glass-panel rounded-3xl p-4 border border-indigo-500/30 space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-indigo-400" /> Inspector: {elementoSeleccionado.tipo}
                </span>
                <button
                  onClick={() => {
                    if (elementoSeleccionado.tipo === 'fila') {
                      setFilas(filas.filter((f) => f.id !== elementoSeleccionado.id));
                    } else if (elementoSeleccionado.tipo === 'mesa') {
                      setMesas(mesas.filter((m) => m.id !== elementoSeleccionado.id));
                    } else if (elementoSeleccionado.tipo === 'palco') {
                      setPalcos(palcos.filter((p) => p.id !== elementoSeleccionado.id));
                    } else if (elementoSeleccionado.tipo === 'zona') {
                      setZonasDePie(zonasDePie.filter((z) => z.id !== elementoSeleccionado.id));
                    }
                    setElementoSeleccionado(null);
                  }}
                  className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                  title="Eliminar elemento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector de Filas */}
              {filaActiva && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nombre Fila:</label>
                    <input
                      type="text"
                      value={filaActiva.nombre}
                      onChange={(e) =>
                        setFilas(filas.map((f) => (f.id === filaActiva.id ? { ...f, nombre: e.target.value } : f)))
                      }
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Butacas:</label>
                      <input
                        type="number"
                        min="2"
                        max="40"
                        value={filaActiva.asientos}
                        onChange={(e) =>
                          setFilas(
                            filas.map((f) =>
                              f.id === filaActiva.id ? { ...f, asientos: parseInt(e.target.value) || 2 } : f
                            )
                          )
                        }
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Precio ({evento.moneda}):
                      </label>
                      <input
                        type="number"
                        value={filaActiva.precioBase}
                        onChange={(e) =>
                          setFilas(
                            filas.map((f) =>
                              f.id === filaActiva.id ? { ...f, precioBase: parseFloat(e.target.value) || 0 } : f
                            )
                          )
                        }
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Radio de Curvatura (Arco):
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="800"
                      step="20"
                      value={filaActiva.curvatura || 0}
                      onChange={(e) =>
                        setFilas(
                          filas.map((f) =>
                            f.id === filaActiva.id ? { ...f, curvatura: parseInt(e.target.value) || 0 } : f
                          )
                        )
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>0 (Recta)</span>
                      <span>{filaActiva.curvatura || 0}px (Curvatura)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Inspector de Palcos */}
              {palcoActivo && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nombre Palco:</label>
                    <input
                      type="text"
                      value={palcoActivo.nombre}
                      onChange={(e) =>
                        setPalcos(palcos.map((p) => (p.id === palcoActivo.id ? { ...p, nombre: e.target.value } : p)))
                      }
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Modalidad:</label>
                      <select
                        value={palcoActivo.modoVenta || 'INDIVIDUAL'}
                        onChange={(e) =>
                          setPalcos(
                            palcos.map((p) =>
                              p.id === palcoActivo.id
                                ? { ...p, modoVenta: e.target.value as ModoVentaPalco }
                                : p
                            )
                          )
                        }
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-bold"
                      >
                        <option value="INDIVIDUAL">Por Butaca</option>
                        <option value="COMPLETO">Palco Entero</option>
                        <option value="PAREJAS">En Parejas</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Precio ({evento.moneda}):
                      </label>
                      <input
                        type="number"
                        value={palcoActivo.precioPalcoBase}
                        onChange={(e) =>
                          setPalcos(
                            palcos.map((p) =>
                              p.id === palcoActivo.id
                                ? { ...p, precioPalcoBase: parseFloat(e.target.value) || 0 }
                                : p
                            )
                          )
                        }
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna Derecha: Lienzo 2D Interactivo */}
        <div className="lg:col-span-8">
          <div className="glass-panel p-3 rounded-3xl border border-white/10 bg-slate-950 flex flex-col items-center overflow-hidden">
            <canvas
              ref={canvasRef}
              width={1000}
              height={700}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              className={`rounded-2xl max-w-full h-auto border border-white/5 select-none ${
                herramienta === 'pan'
                  ? 'cursor-grab active:cursor-grabbing'
                  : herramienta === 'dibujar_zona'
                  ? 'cursor-crosshair'
                  : 'cursor-default'
              }`}
            />
            <div className="w-full flex justify-between items-center text-[11px] text-slate-500 pt-3 px-2">
              <span>Rueda del ratón: Zoom in/out | Botón central / Herramienta mano: Desplazar</span>
              <span className="font-mono text-slate-400">Resolución: 1000x700px</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
