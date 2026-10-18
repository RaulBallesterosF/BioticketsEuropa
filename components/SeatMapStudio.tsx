import React, { useState, useRef, useEffect } from 'react';
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
  Info,
} from 'lucide-react';

interface SeatMapStudioProps {
  evento: Evento;
  mapaActual: MapaRecinto;
  onGuardar: (mapa: Partial<MapaRecinto>) => Promise<void>;
  onActualizarEvento?: (cambios: Partial<Evento>) => Promise<void>;
  onCambiarTab?: (tab: string) => void;
}

type TipoElementoSeleccionado = 'palco' | 'mesa' | 'zona' | 'fila';

interface ElementoSeleccionado {
  tipo: TipoElementoSeleccionado;
  id: string;
}

const FONDOS_PREDEFINIDOS = [
  {
    nombre: 'Arena Deportiva 360°',
    url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    descripcion: 'Vista aérea de coliseo/estadio con iluminación perimetral',
  },
  {
    nombre: 'Teatro & Auditorio Sinfónico',
    url: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80',
    descripcion: 'Distribución en abanico con plateas y palcos laterales',
  },
  {
    nombre: 'Pabellón de Ferias y Convenciones',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    descripcion: 'Pabellón diáfano para stands, zonas de pie y áreas VIP',
  },
  {
    nombre: 'Club VIP Lounge Nocturno',
    url: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=1200&q=80',
    descripcion: 'Pista central con mesas lounge y palcos privados reservados',
  },
];

export const SeatMapStudio: React.FC<SeatMapStudioProps> = ({
  evento,
  mapaActual,
  onGuardar,
  onActualizarEvento,
  onCambiarTab,
}) => {
  // Estado local del mapa
  const [imagenFondo, setImagenFondo] = useState(mapaActual.imagenFondo || '');
  const [imagenFondoOpacidad, setImagenFondoOpacidad] = useState(
    mapaActual.imagenFondoOpacidad !== undefined ? mapaActual.imagenFondoOpacidad : 0.35
  );
  const [aforoGeneral, setAforoGeneral] = useState(
    mapaActual.aforoGeneral || { total: 100, vendidas: 0, precioBase: 30, nombre: 'Pista General' }
  );
  const [filas, setFilas] = useState<FilaAsientos[]>(mapaActual.filas || []);
  const [mesas, setMesas] = useState<MesaEspecial[]>(mapaActual.mesas || []);
  const [palcos, setPalcos] = useState<PalcoVIP[]>(mapaActual.palcos || []);
  const [zonasDePie, setZonasDePie] = useState<ZonaDePie[]>(mapaActual.zonasDePie || []);

  // Configuración del tipo de evento (Concierto Único vs Feria Multidía)
  const [tipoEvento, setTipoEvento] = useState<'CONCIERTO_UNICO' | 'FERIA_MULTIDIA'>(
    evento.tipoEvento || 'CONCIERTO_UNICO'
  );
  const [diasFeria, setDiasFeria] = useState(evento.diasFeria || 3);
  const [fechasFeria, setFechasFeria] = useState<string[]>(
    evento.fechasFeria || ['2026-11-10', '2026-11-11', '2026-11-12']
  );
  const [diaPreviewActivo, setDiaPreviewActivo] = useState(1);

  // Estados de interfaz y edición
  const [guardando, setGuardando] = useState(false);
  const [guardadoExito, setGuardadoExito] = useState(false);
  const [activeTabToolbox, setActiveTabToolbox] = useState<'palcos' | 'mesas' | 'zonas' | 'filas' | 'fondo'>('palcos');
  const [modoHerramienta, setModoHerramienta] = useState<'seleccionar' | 'dibujar_zona'>('seleccionar');
  const [elementoSeleccionado, setElementoSeleccionado] = useState<ElementoSeleccionado | null>(null);

  // Canvas ref y dibujo
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgFondoRef = useRef<HTMLImageElement | null>(null);
  const [imagenCargada, setImagenCargada] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Estado de arrastre y dibujo en canvas
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dibujoZonaActual, setDibujoZonaActual] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Precargar imagen de fondo cuando cambie
  useEffect(() => {
    if (!imagenFondo) {
      imgFondoRef.current = null;
      setImagenCargada(false);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imagenFondo;
    img.onload = () => {
      imgFondoRef.current = img;
      setImagenCargada(true);
    };
    img.onerror = () => {
      imgFondoRef.current = null;
      setImagenCargada(false);
    };
  }, [imagenFondo]);

  // Cargar imagen local desde archivo (FileReader)
  const handleCargarArchivoLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImagenFondo(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Función para dibujar polígonos regulares en Canvas
  const dibujarPoligono = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radio: number,
    lados: number,
    rotacionOffset: number = 0
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

  // Renderizado del lienzo en tiempo real
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Fondo del canvas
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Cuadrícula arquitectónica sutil de guía (20px)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Dibujar imagen de fondo si está presente
    if (imgFondoRef.current && imagenCargada) {
      ctx.save();
      ctx.globalAlpha = Math.max(0.05, Math.min(1, imagenFondoOpacidad));
      ctx.drawImage(imgFondoRef.current, 0, 0, w, h);
      ctx.restore();
    }

    // Escenario principal en la parte superior
    const stageWidth = Math.min(w - 80, 720);
    const stageX = (w - stageWidth) / 2;
    const grad = ctx.createLinearGradient(stageX, 12, stageX + stageWidth, 44);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#4f46e5');
    grad.addColorStop(1, '#6d28d9');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(stageX, 12, stageWidth, 34, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ ESCENARIO PRINCIPAL / MAIN STAGE ⚡', w / 2, 33);

    // 1. ZONAS DE PIE (Admisión General / Standing)
    zonasDePie.forEach((zona) => {
      const zx = zona.x;
      const zy = zona.y;
      const zw = zona.ancho;
      const zh = zona.alto;
      const esSel = elementoSeleccionado?.tipo === 'zona' && elementoSeleccionado.id === zona.id;

      ctx.save();
      ctx.fillStyle = `${zona.color || '#38bdf8'}22`;
      ctx.strokeStyle = esSel ? '#38bdf8' : zona.color || '#38bdf8';
      ctx.lineWidth = esSel ? 3 : 1.5;
      ctx.setLineDash([8, 5]);

      ctx.beginPath();
      ctx.roundRect(zx, zy, zw, zh, 10);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      // Si está seleccionada, halo y manijas
      if (esSel) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(zx - 4, zy - 4, 8, 8);
        ctx.fillRect(zx + zw - 4, zy - 4, 8, 8);
        ctx.fillRect(zx - 4, zy + zh - 4, 8, 8);
        ctx.fillRect(zx + zw - 4, zy + zh - 4, 8, 8);
      }

      // Etiqueta de la zona
      ctx.fillStyle = zona.color || '#38bdf8';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `📐 ${zona.nombre} — Aforo: ${zona.aforoMaximo} pax — ${zona.precioBase} ${evento.moneda}`,
        zx + zw / 2,
        zy + zh / 2 + 4
      );
      ctx.restore();
    });

    // 2. FILAS DE BUTACAS TRADICIONALES
    if (filas && filas.length > 0) {
      const startY = 125;
      filas.forEach((fila, fIndex) => {
        const y = fila.yOffset !== undefined ? fila.yOffset : startY + fIndex * 42;
        const esSel = elementoSeleccionado?.tipo === 'fila' && elementoSeleccionado.id === fila.id;

        ctx.fillStyle = fila.color || '#a5b4fc';
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${fila.nombre}`, 20, y + 14);

        const seatSpacing = 32;
        const totalRowWidth = fila.asientos * seatSpacing;
        const startX = Math.max(160, (w - totalRowWidth) / 2 + 50);

        for (let i = 0; i < fila.asientos; i++) {
          const cx = startX + i * seatSpacing + 12;
          const cy = y + 12;

          ctx.beginPath();
          ctx.arc(cx, cy, 11, 0, Math.PI * 2);
          ctx.fillStyle = esSel ? '#38bdf8' : '#1e293b';
          ctx.strokeStyle = esSel ? '#ffffff' : fila.color || '#64748b';
          ctx.lineWidth = esSel ? 2.5 : 1.5;
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${i + 1}`, cx, cy + 3.5);
        }
      });
    }

    // 3. MESAS GEOMÉTRICAS (Redondas, Cuadradas, Hexagonales, Octogonales, Triangulares)
    mesas.forEach((mesa) => {
      const mx = mesa.x || w / 2;
      const my = mesa.y || 340;
      const radioMesa = mesa.tamano || 24;
      const esSel = elementoSeleccionado?.tipo === 'mesa' && elementoSeleccionado.id === mesa.id;

      ctx.save();
      ctx.fillStyle = esSel ? 'rgba(99, 102, 241, 0.4)' : '#1e1b4b';
      ctx.strokeStyle = esSel ? '#a5b4fc' : '#818cf8';
      ctx.lineWidth = esSel ? 3 : 2;

      // Dibujar la geometría específica de la mesa
      switch (mesa.forma) {
        case 'REDONDA':
          ctx.beginPath();
          ctx.arc(mx, my, radioMesa, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
        case 'CUADRADA':
          ctx.beginPath();
          ctx.roundRect(mx - radioMesa, my - radioMesa, radioMesa * 2, radioMesa * 2, 8);
          ctx.fill();
          ctx.stroke();
          break;
        case 'HEXAGONAL':
          dibujarPoligono(ctx, mx, my, radioMesa, 6, Math.PI / 6);
          ctx.fill();
          ctx.stroke();
          break;
        case 'OCTOGONAL':
          dibujarPoligono(ctx, mx, my, radioMesa, 8, Math.PI / 8);
          ctx.fill();
          ctx.stroke();
          break;
        case 'TRIANGULAR':
          dibujarPoligono(ctx, mx, my, radioMesa, 3, -Math.PI / 2);
          ctx.fill();
          ctx.stroke();
          break;
        default:
          ctx.beginPath();
          ctx.arc(mx, my, radioMesa, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
      }

      // Identificador de la mesa en el centro
      ctx.fillStyle = '#e0e7ff';
      ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mesa.id, mx, my + 3.5);
      ctx.restore();

      // Dibujar Sillas asociadas
      const sillasCount = mesa.sillas || 4;
      const disposicion = mesa.disposicionSillas || 'ALREDEDOR';

      for (let s = 0; s < sillasCount; s++) {
        let sx = 0;
        let sy = 0;

        if (disposicion === 'FRONTAL') {
          const espaciado = 26;
          const startX = mx - ((sillasCount - 1) * espaciado) / 2;
          sx = startX + s * espaciado;
          sy = my + radioMesa + 18;
        } else {
          const angulo = (s * 2 * Math.PI) / sillasCount - Math.PI / 2;
          sx = mx + Math.cos(angulo) * (radioMesa + 18);
          sy = my + Math.sin(angulo) * (radioMesa + 18);
        }

        ctx.beginPath();
        ctx.arc(sx, sy, 9, 0, Math.PI * 2);
        ctx.fillStyle = esSel ? '#4f46e5' : '#0f172a';
        ctx.strokeStyle = esSel ? '#c7d2fe' : '#818cf8';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${s + 1}`, sx, sy + 2.5);
      }

      // Nombre y precio debajo de la mesa
      ctx.fillStyle = esSel ? '#a5b4fc' : '#cbd5e1';
      ctx.font = 'bold 9.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      const rotuloY = my + radioMesa + (disposicion === 'FRONTAL' ? 34 : 30);
      ctx.fillText(`${mesa.nombre} (${mesa.precioSillaBase} ${evento.moneda}/silla)`, mx, rotuloY);
    });

    // 4. PALCOS VIP (Mesas Numeradas y Sillas Adicionales)
    palcos.forEach((palco) => {
      const px = palco.x || 100;
      const py = palco.y || 440;
      const pw = palco.ancho || 270;
      const ph = palco.alto || 125;
      const esSel = elementoSeleccionado?.tipo === 'palco' && elementoSeleccionado.id === palco.id;
      const totalSillas = palco.capacidad + (palco.sillasAdicionales || 0);
      const modo = palco.modoVenta || 'INDIVIDUAL';

      ctx.save();
      // Recuadro del Palco
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 12);
      ctx.fillStyle = esSel ? 'rgba(236, 72, 153, 0.2)' : 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = esSel ? '#f43f5e' : modo === 'COMPLETO' ? '#eab308' : '#a855f7';
      ctx.lineWidth = esSel ? 3 : 2;
      ctx.fill();
      ctx.stroke();

      // Cinta de Cabecera
      ctx.fillStyle =
        modo === 'COMPLETO' ? 'rgba(234, 179, 8, 0.25)' : 'rgba(168, 85, 247, 0.25)';
      ctx.beginPath();
      ctx.roundRect(px, py, pw, 26, [12, 12, 0, 0]);
      ctx.fill();

      // Nombre del palco
      ctx.fillStyle = modo === 'COMPLETO' ? '#fde047' : '#d8b4fe';
      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`👑 ${palco.nombre}`, px + 10, py + 17);

      // Modalidad de venta
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'right';
      const badgeModo =
        modo === 'COMPLETO'
          ? 'VENTA COMPLETA'
          : modo === 'PAREJAS'
          ? 'VENTA EN PAREJAS'
          : 'VENTA INDIVIDUAL';
      ctx.fillText(badgeModo, px + pw - 10, py + 17);

      // Mesa central del Palco
      const tcx = px + pw / 2;
      const tcy = py + ph / 2 + 6;
      ctx.beginPath();
      ctx.roundRect(tcx - 34, tcy - 12, 68, 24, 6);
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e9d5ff';
      ctx.font = 'bold 8.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Mesa (${totalSillas}p)`, tcx, tcy + 3.5);

      // Sillas arriba y abajo de la mesa del palco
      const sillasSup = Math.ceil(totalSillas / 2);
      const sillasInf = Math.floor(totalSillas / 2);

      const espaciadoSup = Math.min(28, (pw - 40) / (sillasSup || 1));
      const startXSup = tcx - ((sillasSup - 1) * espaciadoSup) / 2;

      for (let i = 0; i < sillasSup; i++) {
        const sx = startXSup + i * espaciadoSup;
        const sy = tcy - 24;
        const esAdicional = i + 1 > palco.capacidad;

        ctx.beginPath();
        ctx.arc(sx, sy, 9, 0, Math.PI * 2);
        ctx.fillStyle = esAdicional ? '#701a75' : '#312e81';
        ctx.strokeStyle = esAdicional ? '#f472b6' : '#c084fc';
        ctx.lineWidth = 1.2;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, sx, sy + 2.5);
      }

      const espaciadoInf = Math.min(28, (pw - 40) / (sillasInf || 1));
      const startXInf = tcx - ((sillasInf - 1) * espaciadoInf) / 2;

      for (let i = 0; i < sillasInf; i++) {
        const sIdx = sillasSup + i + 1;
        const sx = startXInf + i * espaciadoInf;
        const sy = tcy + 24;
        const esAdicional = sIdx > palco.capacidad;

        ctx.beginPath();
        ctx.arc(sx, sy, 9, 0, Math.PI * 2);
        ctx.fillStyle = esAdicional ? '#701a75' : '#312e81';
        ctx.strokeStyle = esAdicional ? '#f472b6' : '#c084fc';
        ctx.lineWidth = 1.2;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${sIdx}`, sx, sy + 2.5);
      }

      // Precio en el pie del palco
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'normal 8.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      const precioTexto =
        modo === 'COMPLETO'
          ? `Total Palco: ${palco.precioPalcoBase} ${evento.moneda}`
          : `${palco.precioSillaIndividual || palco.precioPalcoBase / totalSillas} ${evento.moneda}/silla`;
      ctx.fillText(precioTexto, tcx, py + ph - 8);

      ctx.restore();
    });

    // 5. PREVIEW EN VIVO DE DIBUJO DE ZONA (DURANTE MOUSE ARRASTRE)
    if (dibujoZonaActual) {
      const rx = Math.min(dibujoZonaActual.startX, dibujoZonaActual.currentX);
      const ry = Math.min(dibujoZonaActual.startY, dibujoZonaActual.currentY);
      const rw = Math.abs(dibujoZonaActual.currentX - dibujoZonaActual.startX);
      const rh = Math.abs(dibujoZonaActual.currentY - dibujoZonaActual.startY);

      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`📐 Zona Nueva (${rw}x${rh}px)`, rx + rw / 2, ry + rh / 2);
      ctx.restore();
    }
  }, [
    imagenFondo,
    imagenFondoOpacidad,
    imagenCargada,
    filas,
    mesas,
    palcos,
    zonasDePie,
    elementoSeleccionado,
    dibujoZonaActual,
    evento.moneda,
  ]);

  // Manejo de Interacción de Ratón en el Canvas (Arrastrar, Seleccionar, Dibujar)
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    // Si estamos en modo de dibujar zona
    if (modoHerramienta === 'dibujar_zona') {
      setDibujoZonaActual({ startX: x, startY: y, currentX: x, currentY: y });
      return;
    }

    // 1. Verificar si hizo clic en un Palco
    for (const palco of [...palcos].reverse()) {
      const px = palco.x || 100;
      const py = palco.y || 440;
      const pw = palco.ancho || 270;
      const ph = palco.alto || 125;

      if (x >= px && x <= px + pw && y >= py && y <= py + ph) {
        setElementoSeleccionado({ tipo: 'palco', id: palco.id });
        setIsDragging(true);
        setDragOffset({ x: x - px, y: y - py });
        return;
      }
    }

    // 2. Verificar si hizo clic en una Mesa
    for (const mesa of [...mesas].reverse()) {
      const mx = mesa.x || 450;
      const my = mesa.y || 340;
      const radio = (mesa.tamano || 24) + 20;

      const dx = x - mx;
      const dy = y - my;
      if (dx * dx + dy * dy <= radio * radio) {
        setElementoSeleccionado({ tipo: 'mesa', id: mesa.id });
        setIsDragging(true);
        setDragOffset({ x: dx, y: dy });
        return;
      }
    }

    // 3. Verificar si hizo clic en una Zona de Pie
    for (const zona of [...zonasDePie].reverse()) {
      if (x >= zona.x && x <= zona.x + zona.ancho && y >= zona.y && y <= zona.y + zona.alto) {
        setElementoSeleccionado({ tipo: 'zona', id: zona.id });
        setIsDragging(true);
        setDragOffset({ x: x - zona.x, y: y - zona.y });
        return;
      }
    }

    // 4. Clic en espacio vacío: deseleccionar
    setElementoSeleccionado(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    // Si estamos dibujando una zona
    if (modoHerramienta === 'dibujar_zona' && dibujoZonaActual) {
      setDibujoZonaActual({
        ...dibujoZonaActual,
        currentX: x,
        currentY: y,
      });
      return;
    }

    // Si estamos arrastrando un elemento seleccionado
    if (isDragging && elementoSeleccionado) {
      if (elementoSeleccionado.tipo === 'palco') {
        setPalcos((prev) =>
          prev.map((p) =>
            p.id === elementoSeleccionado.id
              ? {
                  ...p,
                  x: Math.max(10, Math.min(canvasRef.current?.width! - (p.ancho || 270) - 10, x - dragOffset.x)),
                  y: Math.max(60, Math.min(canvasRef.current?.height! - (p.alto || 125) - 10, y - dragOffset.y)),
                }
              : p
          )
        );
      } else if (elementoSeleccionado.tipo === 'mesa') {
        setMesas((prev) =>
          prev.map((m) =>
            m.id === elementoSeleccionado.id
              ? {
                  ...m,
                  x: Math.max(40, Math.min(canvasRef.current?.width! - 40, x - dragOffset.x)),
                  y: Math.max(70, Math.min(canvasRef.current?.height! - 40, y - dragOffset.y)),
                }
              : m
          )
        );
      } else if (elementoSeleccionado.tipo === 'zona') {
        setZonasDePie((prev) =>
          prev.map((z) =>
            z.id === elementoSeleccionado.id
              ? {
                  ...z,
                  x: Math.max(10, Math.min(canvasRef.current?.width! - z.ancho - 10, x - dragOffset.x)),
                  y: Math.max(60, Math.min(canvasRef.current?.height! - z.alto - 10, y - dragOffset.y)),
                }
              : z
          )
        );
      }
    }
  };

  const handleMouseUp = () => {
    // Si terminamos de dibujar una zona
    if (modoHerramienta === 'dibujar_zona' && dibujoZonaActual) {
      const rx = Math.round(Math.min(dibujoZonaActual.startX, dibujoZonaActual.currentX));
      const ry = Math.round(Math.min(dibujoZonaActual.startY, dibujoZonaActual.currentY));
      const rw = Math.round(Math.abs(dibujoZonaActual.currentX - dibujoZonaActual.startX));
      const rh = Math.round(Math.abs(dibujoZonaActual.currentY - dibujoZonaActual.startY));

      if (rw > 30 && rh > 20) {
        const nuevaZonaId = `z-custom-${Date.now().toString().slice(-4)}`;
        const nuevaZona: ZonaDePie = {
          id: nuevaZonaId,
          nombre: `Zona Admisión #${zonasDePie.length + 1}`,
          color: '#38bdf8',
          precioBase: 35.0,
          aforoMaximo: Math.max(50, Math.round((rw * rh) / 25)),
          vendidas: 0,
          x: rx,
          y: ry,
          ancho: rw,
          alto: rh,
        };
        setZonasDePie([...zonasDePie, nuevaZona]);
        setElementoSeleccionado({ tipo: 'zona', id: nuevaZonaId });
      }
      setDibujoZonaActual(null);
      setModoHerramienta('seleccionar');
      return;
    }

    setIsDragging(false);
  };

  // ACCIONES DE AGREGAR ELEMENTOS CON PRESETS VISUALES
  const agregarPalcoConCapacidad = (capacidadBase: number) => {
    const id = `P${palcos.length + 1}`;
    const nuevo: PalcoVIP = {
      id,
      nombre: `Palco VIP #${palcos.length + 1}`,
      capacidad: capacidadBase,
      sillasAdicionales: 0,
      precioPalcoBase: capacidadBase * 60,
      modoVenta: 'INDIVIDUAL',
      precioSillaIndividual: 60,
      x: 80 + (palcos.length % 3) * 280,
      y: 430 + Math.floor(palcos.length / 3) * 140,
      ancho: 270,
      alto: 125,
    };
    setPalcos([...palcos, nuevo]);
    setElementoSeleccionado({ tipo: 'palco', id });
  };

  const agregarMesaGeometrica = (forma: FormaMesa, sillasDefault: number) => {
    const id = `M${mesas.length + 1}`;
    const nueva: MesaEspecial = {
      id,
      nombre: `Mesa ${forma.toLowerCase()} #${mesas.length + 1}`,
      forma,
      sillas: sillasDefault,
      disposicionSillas: 'ALREDEDOR',
      precioSillaBase: 50.0,
      tamano: forma === 'OCTOGONAL' ? 28 : forma === 'HEXAGONAL' ? 25 : 22,
      x: 200 + (mesas.length % 4) * 180,
      y: 280 + Math.floor(mesas.length / 4) * 100,
    };
    setMesas([...mesas, nueva]);
    setElementoSeleccionado({ tipo: 'mesa', id });
  };

  // Modificación interactiva de Palco seleccionado
  const palcoActivo = palcos.find((p) => p.id === elementoSeleccionado?.id);
  const mesaActiva = mesas.find((m) => m.id === elementoSeleccionado?.id);
  const zonaActiva = zonasDePie.find((z) => z.id === elementoSeleccionado?.id);

  // Adicionar Silla a un Palco (Directamente incrementa las sillas)
  const adicionarSillaPalco = (palcoId: string, delta: number) => {
    setPalcos((prev) =>
      prev.map((p) => {
        if (p.id !== palcoId) return p;
        const actuales = p.sillasAdicionales || 0;
        const nuevas = Math.max(0, actuales + delta);
        return {
          ...p,
          sillasAdicionales: nuevas,
        };
      })
    );
  };

  // Eliminar elemento seleccionado
  const eliminarElementoSeleccionado = () => {
    if (!elementoSeleccionado) return;
    if (elementoSeleccionado.tipo === 'palco') {
      setPalcos(palcos.filter((p) => p.id !== elementoSeleccionado.id));
    } else if (elementoSeleccionado.tipo === 'mesa') {
      setMesas(mesas.filter((m) => m.id !== elementoSeleccionado.id));
    } else if (elementoSeleccionado.tipo === 'zona') {
      setZonasDePie(zonasDePie.filter((z) => z.id !== elementoSeleccionado.id));
    } else if (elementoSeleccionado.tipo === 'fila') {
      setFilas(filas.filter((f) => f.id !== elementoSeleccionado.id));
    }
    setElementoSeleccionado(null);
  };

  // Duplicar elemento seleccionado
  const duplicarElementoSeleccionado = () => {
    if (!elementoSeleccionado) return;
    if (elementoSeleccionado.tipo === 'palco' && palcoActivo) {
      const nuevoId = `P${palcos.length + 1}`;
      const duplicado: PalcoVIP = {
        ...palcoActivo,
        id: nuevoId,
        nombre: `${palcoActivo.nombre} (Copia)`,
        x: (palcoActivo.x || 100) + 30,
        y: (palcoActivo.y || 440) + 30,
      };
      setPalcos([...palcos, duplicado]);
      setElementoSeleccionado({ tipo: 'palco', id: nuevoId });
    } else if (elementoSeleccionado.tipo === 'mesa' && mesaActiva) {
      const nuevoId = `M${mesas.length + 1}`;
      const duplicada: MesaEspecial = {
        ...mesaActiva,
        id: nuevoId,
        nombre: `${mesaActiva.nombre} (Copia)`,
        x: (mesaActiva.x || 200) + 30,
        y: (mesaActiva.y || 280) + 30,
      };
      setMesas([...mesas, duplicada]);
      setElementoSeleccionado({ tipo: 'mesa', id: nuevoId });
    } else if (elementoSeleccionado.tipo === 'zona' && zonaActiva) {
      const nuevoId = `z-${Date.now().toString().slice(-4)}`;
      const duplicada: ZonaDePie = {
        ...zonaActiva,
        id: nuevoId,
        nombre: `${zonaActiva.nombre} (Copia)`,
        x: zonaActiva.x + 30,
        y: zonaActiva.y + 30,
      };
      setZonasDePie([...zonasDePie, duplicada]);
      setElementoSeleccionado({ tipo: 'zona', id: nuevoId });
    }
  };

  // Guardar todo en Backend
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
          fechasFeria,
        });
      }

      setGuardadoExito(true);
      setTimeout(() => setGuardadoExito(false), 3000);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header del Super Administrador */}
      <div className="glass-panel rounded-3xl p-6 border border-purple-500/30 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 shadow-2xl">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-black tracking-widest text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/40 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              SUPER ADMINISTRADOR — ARQUITECTO DE RECINTOS
            </span>
            <span className="text-xs text-slate-400 font-semibold">{evento.lugar} ({evento.ciudad})</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            Diseñador Visual de Aforo y Asientos: {evento.nombre}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Carga el plano arquitectónico de fondo y sitúa de forma interactiva palcos con venta completa/individual, mesas geométricas y zonas de pie.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onCambiarTab && (
            <button
              onClick={() => onCambiarTab('b2c')}
              className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer border border-white/10"
              title="Ver cómo lo ve el comprador fan en taquilla"
            >
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Vista Fan Taquilla</span>
            </button>
          )}

          <button
            onClick={handleGuardarTodo}
            disabled={guardando}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {guardadoExito ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>¡Mapa Guardado en el Servidor!</span>
              </>
            ) : guardando ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Guardando Plano...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-950" />
                <span>Guardar Mapa del Recinto</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selector de Modalidad del Evento: Concierto Único vs Feria Multidía */}
      <div className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <div>
            <span className="text-xs font-bold text-white block">
              Tipo de Evento y Gestión de Jornadas
            </span>
            <span className="text-[11px] text-slate-400">
              Define si el aforo y la venta operan en un solo día o en múltiples fechas tipo feria
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setTipoEvento('CONCIERTO_UNICO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                tipoEvento === 'CONCIERTO_UNICO'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎤 Concierto Único (1 Día)
            </button>
            <button
              onClick={() => setTipoEvento('FERIA_MULTIDIA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                tipoEvento === 'FERIA_MULTIDIA'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎪 Feria Multidía (Varios Días)
            </button>
          </div>

          {tipoEvento === 'FERIA_MULTIDIA' && (
            <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-500/30 px-3 py-1 rounded-2xl">
              <span className="text-[10px] text-purple-300 font-bold uppercase">Días Feria:</span>
              <select
                value={diasFeria}
                onChange={(e) => {
                  const num = parseInt(e.target.value) || 3;
                  setDiasFeria(num);
                  setFechasFeria(
                    Array.from({ length: num }).map((_, i) => `2026-11-${10 + i}`)
                  );
                }}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value={2} className="bg-slate-900">2 Días</option>
                <option value={3} className="bg-slate-900">3 Días</option>
                <option value={4} className="bg-slate-900">4 Días</option>
                <option value={5} className="bg-slate-900">5 Días</option>
                <option value={7} className="bg-slate-900">7 Días (Semana)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ÁREA PRINCIPAL DEL ESTUDIO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: PALETA VISUAL LATERAL (4 COLUMNAS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-4 bg-slate-950/70">
            {/* Navegación de la paleta */}
            <div className="flex flex-wrap items-center gap-1 pb-3 border-b border-white/10">
              <button
                onClick={() => setActiveTabToolbox('palcos')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTabToolbox === 'palcos'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Palcos</span>
              </button>

              <button
                onClick={() => setActiveTabToolbox('mesas')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTabToolbox === 'mesas'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Mesas</span>
              </button>

              <button
                onClick={() => setActiveTabToolbox('zonas')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTabToolbox === 'zonas'
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Zonas</span>
              </button>

              <button
                onClick={() => setActiveTabToolbox('fondo')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTabToolbox === 'fondo'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="Cargar y calibrar plano de fondo"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* SECCIÓN 1: PALCOS VIP CON CANTIDAD DE SILLAS Y MODO VENTA */}
            {activeTabToolbox === 'palcos' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200">
                  <span className="font-bold flex items-center gap-1.5 mb-1 text-purple-300">
                    <Crown className="w-4 h-4 text-amber-400" /> Palcos VIP con Mesas Numeradas
                  </span>
                  Sitúa palcos privados con capacidad de 4, 6 o 10 sillas. Podrás añadir más sillas a demanda y configurar si se venden completos, individuales o en parejas.
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Añadir Palco con Presets Rápidos:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => agregarPalcoConCapacidad(4)}
                      className="p-3 rounded-2xl bg-slate-900 border border-purple-500/30 hover:border-purple-400 text-white font-bold text-xs flex flex-col items-center gap-1 transition cursor-pointer hover:bg-purple-950/40"
                    >
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>4 Sillas</span>
                      <span className="text-[9px] text-slate-400 font-mono">Básico</span>
                    </button>

                    <button
                      onClick={() => agregarPalcoConCapacidad(6)}
                      className="p-3 rounded-2xl bg-slate-900 border border-purple-500/30 hover:border-purple-400 text-white font-bold text-xs flex flex-col items-center gap-1 transition cursor-pointer hover:bg-purple-950/40"
                    >
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>6 Sillas</span>
                      <span className="text-[9px] text-amber-300 font-mono">Premium</span>
                    </button>

                    <button
                      onClick={() => agregarPalcoConCapacidad(10)}
                      className="p-3 rounded-2xl bg-slate-900 border border-purple-500/30 hover:border-purple-400 text-white font-bold text-xs flex flex-col items-center gap-1 transition cursor-pointer hover:bg-purple-950/40"
                    >
                      <Sparkles className="w-4 h-4 text-fuchsia-400" />
                      <span>10 Sillas</span>
                      <span className="text-[9px] text-fuchsia-300 font-mono">Presidencial</span>
                    </button>
                  </div>
                </div>

                {/* Lista rápida de palcos existentes */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Palcos en el Plano ({palcos.length}):
                  </span>
                  {palcos.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No hay palcos situados aún.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {palcos.map((p) => {
                        const tot = p.capacidad + (p.sillasAdicionales || 0);
                        const sel = elementoSeleccionado?.tipo === 'palco' && elementoSeleccionado.id === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setElementoSeleccionado({ tipo: 'palco', id: p.id })}
                            className={`p-2.5 rounded-xl border flex justify-between items-center text-xs cursor-pointer transition ${
                              sel
                                ? 'bg-purple-950/60 border-purple-400 text-white'
                                : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-purple-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                              <span className="font-bold">{p.nombre}</span>
                              <span className="text-[10px] text-purple-300">({tot} sillas)</span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400">
                              {p.modoVenta === 'COMPLETO' ? `${p.precioPalcoBase}€` : `${p.precioSillaIndividual || p.precioPalcoBase / tot}€/s`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECCIÓN 2: MESAS GEOMÉTRICAS (REDONDAS, CUADRADAS, HEXÁGONOS, ETC.) */}
            {activeTabToolbox === 'mesas' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200">
                  <span className="font-bold flex items-center gap-1.5 mb-1 text-indigo-300">
                    <Coffee className="w-4 h-4 text-indigo-400" /> Mesas Geométricas con Sillas
                  </span>
                  Sitúa mesas según diferentes formas geométricas. Las sillas pueden ubicarse alrededor (360°) o alineadas debajo según la arquitectura.
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Selecciona una Geometría de Mesa:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => agregarMesaGeometrica('REDONDA', 4)}
                      className="p-3 rounded-2xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-400 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer hover:bg-indigo-950/40"
                    >
                      <Circle className="w-4 h-4 text-indigo-400" />
                      <div className="text-left">
                        <span className="block">Redonda</span>
                        <span className="text-[9px] text-slate-400">4 Sillas</span>
                      </div>
                    </button>

                    <button
                      onClick={() => agregarMesaGeometrica('CUADRADA', 4)}
                      className="p-3 rounded-2xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-400 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer hover:bg-indigo-950/40"
                    >
                      <Square className="w-4 h-4 text-sky-400" />
                      <div className="text-left">
                        <span className="block">Cuadrada</span>
                        <span className="text-[9px] text-slate-400">4 Sillas</span>
                      </div>
                    </button>

                    <button
                      onClick={() => agregarMesaGeometrica('HEXAGONAL', 6)}
                      className="p-3 rounded-2xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-400 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer hover:bg-indigo-950/40"
                    >
                      <Hexagon className="w-4 h-4 text-purple-400" />
                      <div className="text-left">
                        <span className="block">Hexagonal</span>
                        <span className="text-[9px] text-slate-400">6 Sillas</span>
                      </div>
                    </button>

                    <button
                      onClick={() => agregarMesaGeometrica('OCTOGONAL', 8)}
                      className="p-3 rounded-2xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-400 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer hover:bg-indigo-950/40"
                    >
                      <Octagon className="w-4 h-4 text-amber-400" />
                      <div className="text-left">
                        <span className="block">Octogonal</span>
                        <span className="text-[9px] text-slate-400">8 Sillas</span>
                      </div>
                    </button>

                    <button
                      onClick={() => agregarMesaGeometrica('TRIANGULAR', 3)}
                      className="p-3 rounded-2xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-400 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer hover:bg-indigo-950/40 col-span-2"
                    >
                      <Triangle className="w-4 h-4 text-teal-400" />
                      <div className="text-left">
                        <span className="block">Triangular</span>
                        <span className="text-[9px] text-slate-400">3 Sillas</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Mesas situadas */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Mesas Situadas ({mesas.length}):
                  </span>
                  {mesas.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No hay mesas situadas.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {mesas.map((m) => {
                        const sel = elementoSeleccionado?.tipo === 'mesa' && elementoSeleccionado.id === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setElementoSeleccionado({ tipo: 'mesa', id: m.id })}
                            className={`p-2.5 rounded-xl border flex justify-between items-center text-xs cursor-pointer transition ${
                              sel
                                ? 'bg-indigo-950/60 border-indigo-400 text-white'
                                : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-indigo-500/30'
                            }`}
                          >
                            <span className="font-bold">🍽️ {m.nombre} ({m.forma})</span>
                            <span className="text-[10px] font-mono text-emerald-400">
                              {m.precioSillaBase} {evento.moneda}/s
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECCIÓN 3: DIBUJAR ZONAS DE PIE O AFORO SIN NUMERACIÓN */}
            {activeTabToolbox === 'zonas' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/20 text-xs text-sky-200">
                  <span className="font-bold flex items-center gap-1.5 mb-1 text-sky-300">
                    <Layers className="w-4 h-4 text-sky-400" /> Zonas de Pie / Sin Numeración
                  </span>
                  Dibuja directamente sobre el plano arrastrando con el ratón zonas amplias para admisión general, campo o pista.
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setModoHerramienta(
                        modoHerramienta === 'dibujar_zona' ? 'seleccionar' : 'dibujar_zona'
                      );
                    }}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
                      modoHerramienta === 'dibujar_zona'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 animate-pulse'
                        : 'bg-sky-600 hover:bg-sky-500 text-white'
                    }`}
                  >
                    <MousePointer className="w-4 h-4" />
                    <span>
                      {modoHerramienta === 'dibujar_zona'
                        ? '✏️ Arrastra en el lienzo para crear la zona...'
                        : '📐 Dibujar Zona con el Ratón en el Plano'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      const id = `z-${Date.now().toString().slice(-4)}`;
                      const z: ZonaDePie = {
                        id,
                        nombre: `Pista General #${zonasDePie.length + 1}`,
                        color: '#06b6d4',
                        precioBase: 40.0,
                        aforoMaximo: 250,
                        vendidas: 0,
                        x: 180,
                        y: 70,
                        ancho: 520,
                        alto: 50,
                      };
                      setZonasDePie([...zonasDePie, z]);
                      setElementoSeleccionado({ tipo: 'zona', id });
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-white/5 border border-white/10 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-sky-400" />
                    <span>Añadir Zona Predeterminada Front Stage</span>
                  </button>
                </div>

                {/* Zonas configuradas */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Zonas de Pie Definidas ({zonasDePie.length}):
                  </span>
                  {zonasDePie.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No hay zonas de pie dibujadas.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {zonasDePie.map((z) => {
                        const sel = elementoSeleccionado?.tipo === 'zona' && elementoSeleccionado.id === z.id;
                        return (
                          <div
                            key={z.id}
                            onClick={() => setElementoSeleccionado({ tipo: 'zona', id: z.id })}
                            className={`p-2.5 rounded-xl border flex justify-between items-center text-xs cursor-pointer transition ${
                              sel
                                ? 'bg-sky-950/60 border-sky-400 text-white'
                                : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-sky-500/30'
                            }`}
                          >
                            <span className="font-bold">{z.nombre}</span>
                            <span className="text-[10px] font-mono text-emerald-400">
                              {z.aforoMaximo} pax • {z.precioBase} {evento.moneda}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECCIÓN 4: GESTIÓN DEL PLANO DE FONDO ARQUITECTÓNICO */}
            {activeTabToolbox === 'fondo' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200">
                  <span className="font-bold flex items-center gap-1.5 mb-1 text-emerald-300">
                    <ImageIcon className="w-4 h-4 text-emerald-400" /> Carga del Plano de Fondo
                  </span>
                  Carga una imagen real del plano del recinto desde tu ordenador o mediante URL. Servirá como background sobre el cual se sitúan todos los elementos.
                </div>

                {/* Input archivo local */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCargarArchivoLocal}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Cargar Imagen desde mi Ordenador</span>
                  </button>
                </div>

                {/* Input URL */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    O escribe la URL del plano:
                  </label>
                  <input
                    type="url"
                    value={imagenFondo}
                    onChange={(e) => setImagenFondo(e.target.value)}
                    placeholder="https://ejemplo.com/plano-estadio.jpg"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Control de Opacidad del fondo */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Opacidad del Fondo:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {Math.round(imagenFondoOpacidad * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={imagenFondoOpacidad}
                    onChange={(e) => setImagenFondoOpacidad(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Plantillas predefinidas para pruebas */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    O elige un Plano Predefinido:
                  </span>
                  <div className="space-y-1.5">
                    {FONDOS_PREDEFINIDOS.map((fp, idx) => (
                      <button
                        key={idx}
                        onClick={() => setImagenFondo(fp.url)}
                        className="w-full p-2 rounded-xl bg-slate-900/60 hover:bg-white/5 border border-white/5 text-left text-xs transition cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-bold text-white">{fp.nombre}</span>
                        <span className="text-[10px] text-emerald-400">Usar</span>
                      </button>
                    ))}
                  </div>
                </div>

                {imagenFondo && (
                  <button
                    onClick={() => setImagenFondo('')}
                    className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition cursor-pointer"
                  >
                    Quitar Imagen de Fondo
                  </button>
                )}
              </div>
            )}
          </div>

          {/* INSPECTOR DE PROPIEDADES DEL ELEMENTO SELECCIONADO */}
          {elementoSeleccionado ? (
            <div className="glass-panel rounded-3xl p-5 border border-amber-500/30 space-y-4 bg-slate-950/80 animate-in slide-in-from-top-4 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Inspector: {elementoSeleccionado.tipo.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={duplicarElementoSeleccionado}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition"
                    title="Duplicar elemento"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={eliminarElementoSeleccionado}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                    title="Eliminar elemento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* INSPECTOR DE PALCO VIP */}
              {elementoSeleccionado.tipo === 'palco' && palcoActivo && (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Nombre del Palco:
                    </label>
                    <input
                      type="text"
                      value={palcoActivo.nombre}
                      onChange={(e) =>
                        setPalcos(
                          palcos.map((p) => (p.id === palcoActivo.id ? { ...p, nombre: e.target.value } : p))
                        )
                      }
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-bold"
                    />
                  </div>

                  {/* ADICIÓN DIRECTA DE SILLAS (CLAVE REQUERIDA) */}
                  <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-purple-200">Total Sillas del Palco:</span>
                      <span className="font-mono text-amber-300 font-black text-sm">
                        {palcoActivo.capacidad + (palcoActivo.sillasAdicionales || 0)} sillas
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => adicionarSillaPalco(palcoActivo.id, 1)}
                        className="flex-1 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-[11px] text-white flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> +1 Adicionar Silla
                      </button>
                      <button
                        onClick={() => adicionarSillaPalco(palcoActivo.id, -1)}
                        disabled={(palcoActivo.sillasAdicionales || 0) <= 0}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-[11px] text-slate-300 transition cursor-pointer disabled:opacity-40"
                      >
                        - Quitar Silla
                      </button>
                    </div>
                  </div>

                  {/* MODALIDAD DE VENTA (COMPLETO / INDIVIDUAL / PAREJAS) */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Modalidad de Venta del Palco:
                    </label>
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
                      className="w-full bg-slate-900 border border-purple-500/30 rounded-xl p-2 text-white font-bold"
                    >
                      <option value="COMPLETO">Venta Completa (Palco Entero 1 solo Ticket)</option>
                      <option value="INDIVIDUAL">Venta Individual (Por Silla Clic Directo)</option>
                      <option value="PAREJAS">Venta en Parejas (De 2 en 2 Sillas)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Precio Total ({evento.moneda}):
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

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Precio/Silla ({evento.moneda}):
                      </label>
                      <input
                        type="number"
                        value={palcoActivo.precioSillaIndividual || ''}
                        placeholder="Calculado"
                        onChange={(e) =>
                          setPalcos(
                            palcos.map((p) =>
                              p.id === palcoActivo.id
                                ? { ...p, precioSillaIndividual: parseFloat(e.target.value) || 0 }
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

              {/* INSPECTOR DE MESA GEOMÉTRICA */}
              {elementoSeleccionado.tipo === 'mesa' && mesaActiva && (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Nombre de la Mesa:
                    </label>
                    <input
                      type="text"
                      value={mesaActiva.nombre}
                      onChange={(e) =>
                        setMesas(
                          mesas.map((m) => (m.id === mesaActiva.id ? { ...m, nombre: e.target.value } : m))
                        )
                      }
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Forma Geométrica:
                      </label>
                      <select
                        value={mesaActiva.forma}
                        onChange={(e) =>
                          setMesas(
                            mesas.map((m) =>
                              m.id === mesaActiva.id
                                ? { ...m, forma: e.target.value as FormaMesa }
                                : m
                            )
                          )
                        }
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-bold"
                      >
                        <option value="REDONDA">Redonda</option>
                        <option value="CUADRADA">Cuadrada</option>
                        <option value="HEXAGONAL">Hexagonal</option>
                        <option value="OCTOGONAL">Octogonal</option>
                        <option value="TRIANGULAR">Triangular</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Disposición Sillas:
                      </label>
                      <select
                        value={mesaActiva.disposicionSillas || 'ALREDEDOR'}
                        onChange={(e) =>
                          setMesas(
                            mesas.map((m) =>
                              m.id === mesaActiva.id
                                ? {
                                    ...m,
                                    disposicionSillas: e.target.value as 'ALREDEDOR' | 'FRONTAL',
                                  }
                                : m
                            )
                          )
                        }
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-bold"
                      >
                        <option value="ALREDEDOR">Alrededor (360°)</option>
                        <option value="FRONTAL">Debajo / Frontal</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Cantidad de Sillas:
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="16"
                        value={mesaActiva.sillas}
                        onChange={(e) =>
                          setMesas(
                            mesas.map((m) =>
                              m.id === mesaActiva.id
                                ? { ...m, sillas: parseInt(e.target.value) || 2 }
                                : m
                            )
                          )
                        }
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Precio/Silla ({evento.moneda}):
                      </label>
                      <input
                        type="number"
                        value={mesaActiva.precioSillaBase}
                        onChange={(e) =>
                          setMesas(
                            mesas.map((m) =>
                              m.id === mesaActiva.id
                                ? { ...m, precioSillaBase: parseFloat(e.target.value) || 0 }
                                : m
                            )
                          )
                        }
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* INSPECTOR DE ZONA DE PIE */}
              {elementoSeleccionado.tipo === 'zona' && zonaActiva && (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Nombre de la Zona:
                    </label>
                    <input
                      type="text"
                      value={zonaActiva.nombre}
                      onChange={(e) =>
                        setZonasDePie(
                          zonasDePie.map((z) => (z.id === zonaActiva.id ? { ...z, nombre: e.target.value } : z))
                        )
                      }
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Aforo Máximo (Pax):
                      </label>
                      <input
                        type="number"
                        value={zonaActiva.aforoMaximo}
                        onChange={(e) =>
                          setZonasDePie(
                            zonasDePie.map((z) =>
                              z.id === zonaActiva.id
                                ? { ...z, aforoMaximo: parseInt(e.target.value) || 0 }
                                : z
                            )
                          )
                        }
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Precio Ticket ({evento.moneda}):
                      </label>
                      <input
                        type="number"
                        value={zonaActiva.precioBase}
                        onChange={(e) =>
                          setZonasDePie(
                            zonasDePie.map((z) =>
                              z.id === zonaActiva.id
                                ? { ...z, precioBase: parseFloat(e.target.value) || 0 }
                                : z
                            )
                          )
                        }
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Color Identificador:
                    </label>
                    <input
                      type="color"
                      value={zonaActiva.color}
                      onChange={(e) =>
                        setZonasDePie(
                          zonasDePie.map((z) => (z.id === zonaActiva.id ? { ...z, color: e.target.value } : z))
                        )
                      }
                      className="w-full h-8 bg-slate-900 border border-white/10 rounded-xl p-1 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-3xl border border-white/5 bg-slate-950/40 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <Move className="w-5 h-5 text-slate-600" />
              <span>Haz clic en cualquier palco, mesa o zona en el lienzo para inspeccionar y editar sus cotas.</span>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: LIENZO CANVAS 2D DE DISEÑO Y DISPOSICIÓN VISUAL (8 COLUMNAS) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="glass-panel rounded-3xl p-4 border border-white/10 bg-slate-950/80 shadow-2xl relative flex flex-col items-center">
            {/* Barra de estado del Lienzo */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="font-bold text-white">Lienzo Arquitectónico 2D</span>
                <span className="text-[10px] text-slate-400">
                  {modoHerramienta === 'dibujar_zona'
                    ? 'Modo: Dibujar Zona con Clic y Arrastre'
                    : 'Modo: Seleccionar y Arrastrar con Cursor'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModoHerramienta('seleccionar')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                    modoHerramienta === 'seleccionar'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white bg-white/5'
                  }`}
                  title="Cursor para mover y situar"
                >
                  <Move className="w-3.5 h-3.5" /> Mover
                </button>

                <button
                  onClick={() => setModoHerramienta('dibujar_zona')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                    modoHerramienta === 'dibujar_zona'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white bg-white/5'
                  }`}
                  title="Herramienta de dibujo de zonas de pie"
                >
                  <MousePointer className="w-3.5 h-3.5" /> Dibujar Zona
                </button>
              </div>
            </div>

            {/* Visual Canvas Element */}
            <div className="w-full overflow-x-auto flex justify-center py-2">
              <canvas
                ref={canvasRef}
                width={920}
                height={620}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className={`rounded-2xl border border-white/10 shadow-2xl transition max-w-full h-auto select-none ${
                  modoHerramienta === 'dibujar_zona' ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
              />
            </div>

            {/* Leyenda y atajos de teclado */}
            <div className="w-full pt-3 border-t border-white/5 flex flex-wrap justify-between items-center text-[11px] text-slate-400 gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span> Palcos VIP (+ Sillas)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Mesas Geométricas
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-500"></span> Zonas de Pie
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                Arrastra libremente cualquier elemento para reubicarlo sobre el plano de fondo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
