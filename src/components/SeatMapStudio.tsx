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
  Crown,
  Coffee,
  CheckCircle2,
  Upload,
  Calendar,
  MousePointer,
  Hand,
  Settings2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Palette,
  Eye,
  Sliders,
  Maximize2,
  Grid,
  Tag,
  Building2,
  Bookmark,
  FilePlus,
  Move,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

interface SeatMapStudioProps {
  evento: Evento;
  mapaActual: MapaRecinto;
  onGuardar: (mapa: Partial<MapaRecinto>) => Promise<void>;
  onActualizarEvento?: (cambios: Partial<Evento>) => Promise<void>;
  onCambiarTab?: (tab: string) => void;
}

export interface EsquemaTarifario {
  preventa: number;
  lanzamiento: number;
  etapa1: number;
  etapa2: number;
  etapa3Full: number;
  esCorporativo: boolean;
  precioCorporativo?: number;
  codigoPromoVIP?: string;
  descuentoPromoPct?: number;
}

export interface PalcoStudio extends PalcoVIP {
  numero?: string;
  color?: string;
  tarifas?: EsquemaTarifario;
}

export interface MesaStudio extends MesaEspecial {
  numero?: string;
  color?: string;
  ancho?: number;
  alto?: number;
  tarifas?: EsquemaTarifario;
}

export interface ZonaStudio extends ZonaDePie {
  tarifas?: EsquemaTarifario;
}

type PuntoControl = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w';

export const SeatMapStudio: React.FC<SeatMapStudioProps> = ({
  evento,
  mapaActual,
  onGuardar,
  onActualizarEvento,
  onCambiarTab,
}) => {
  // Modo de visualización: 'editor' (herramientas) o 'preview' (vista previa del comprador)
  const [modoVista, setModoVista] = useState<'editor' | 'preview'>('editor');

  // Metadatos y dimensiones de la imagen de fondo
  const [nombreMapa, setNombreMapa] = useState<string>(`Plano Oficial - ${evento.lugar}`);
  const [imagenFondo, setImagenFondo] = useState(mapaActual.imagenFondo || '');
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
  const [bgSize, setBgSize] = useState({ w: 1600, h: 1000 });
  const [imagenFondoOpacidad, setImagenFondoOpacidad] = useState(
    mapaActual.imagenFondoOpacidad !== undefined ? mapaActual.imagenFondoOpacidad : 0.75
  );

  // Elementos del mapa
  const [palcos, setPalcos] = useState<PalcoStudio[]>((mapaActual.palcos || []) as PalcoStudio[]);
  const [mesas, setMesas] = useState<MesaStudio[]>((mapaActual.mesas || []) as MesaStudio[]);
  const [zonasDePie, setZonasDePie] = useState<ZonaStudio[]>((mapaActual.zonasDePie || []) as ZonaStudio[]);
  const [filas, setFilas] = useState<FilaAsientos[]>(mapaActual.filas || []);

  // Elemento seleccionado en el lienzo
  const [elementoSel, setElementoSel] = useState<{ tipo: 'palco' | 'mesa' | 'zona'; id: string } | null>(null);

  // Selección en la previsualización fan
  const [previewSeleccionados, setPreviewSeleccionados] = useState<string[]>([]);

  // Navegación Canvas: Zoom y Panning
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [herramienta, setHerramienta] = useState<'seleccionar' | 'pan' | 'dibujar_palco' | 'dibujar_zona' | 'dibujar_mesa'>('seleccionar');

  // Pestañas del panel izquierdo
  const [tabSidebar, setTabSidebar] = useState<'elementos' | 'fondo' | 'tarifas'>('elementos');

  // Estados de retroalimentación
  const [guardando, setGuardando] = useState(false);
  const [guardadoExito, setGuardadoExito] = useState(false);
  const [mensajeNotif, setMensajeNotif] = useState<string | null>(null);

  // Modal para carga de archivo plano CSV/TXT
  const [modalCsvAbierto, setModalCsvAbierto] = useState(false);

  // Referencias para Canvas y sincronización 1:1 de puntero
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgFondoRef = useRef<HTMLImageElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'move' | 'resize' | null>(null);
  const activeHandleRef = useRef<PuntoControl | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const elementInitialBoundsRef = useRef<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 0, h: 0 });
  const drawingBoxRef = useRef<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  const notificar = (msg: string) => {
    setMensajeNotif(msg);
    setTimeout(() => setMensajeNotif(null), 4000);
  };

  // 1. INICIAR LIENZO EN BLANCO TOTAL (SOLO CUADRÍCULA)
  const handleNuevoMapaEnBlanco = () => {
    if (window.confirm('¿Deseas iniciar un lienzo completamente en blanco? Se limpiarán todos los elementos actuales.')) {
      setPalcos([]);
      setMesas([]);
      setZonasDePie([]);
      setFilas([]);
      setImagenFondo('');
      imgFondoRef.current = null;
      setElementoSel(null);
      setPreviewSeleccionados([]);
      setPan({ x: 0, y: 0 });
      setZoom(1);
      notificar('Lienzo en blanco inicializado. Solo cuadrícula visible.');
    }
  };

  // Carga de imagen de fondo
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
      renderizar();
    };
  }, [imagenFondo]);

  // CORRECCIÓN MATEMÁTICA DE SINCRONIZACIÓN DE RATÓN 1:1
  const getCanvasMousePos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const toVirtualCoords = (clientX: number, clientY: number) => {
    const { x, y } = getCanvasMousePos(clientX, clientY);
    return {
      x: (x - pan.x) / zoom,
      y: (y - pan.y) / zoom,
    };
  };

  // Obtener puntos de ancla de redimensionamiento (8 puntos de control estilo Elementor)
  const getHandles = (x: number, y: number, w: number, h: number): Record<PuntoControl, { x: number; y: number }> => {
    return {
      nw: { x, y },
      n: { x: x + w / 2, y },
      ne: { x: x + w, y },
      e: { x: x + w, y: y + h / 2 },
      se: { x: x + w, y: y + h },
      s: { x: x + w / 2, y: y + h },
      sw: { x, y: y + h },
      w: { x, y: y + h / 2 },
    };
  };

  // Renderizado del Canvas
  const renderizar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasW = canvas.width;
    const canvasH = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Fondo del espacio de trabajo
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Cuadrícula arquitectónica base
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1 / zoom;
    for (let x = -1000; x < 2600; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, -1000);
      ctx.lineTo(x, 2000);
      ctx.stroke();
    }
    for (let y = -1000; y < 2000; y += 40) {
      ctx.beginPath();
      ctx.moveTo(-1000, y);
      ctx.lineTo(2600, y);
      ctx.stroke();
    }

    // 2. Imagen del plano arquitectónico calibrable
    if (imgFondoRef.current) {
      ctx.save();
      ctx.globalAlpha = imagenFondoOpacidad;
      ctx.drawImage(imgFondoRef.current, bgPos.x, bgPos.y, bgSize.w, bgSize.h);
      ctx.restore();

      if (modoVista === 'editor' && tabSidebar === 'fondo') {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(bgPos.x, bgPos.y, bgSize.w, bgSize.h);
        ctx.setLineDash([]);
      }
    }

    // 3. Renderizar Zonas de Pie
    zonasDePie.forEach((z) => {
      const esSel = elementoSel?.tipo === 'zona' && elementoSel.id === z.id;
      const esPreviewSel = previewSeleccionados.includes(z.id);

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(z.x, z.y, z.ancho, z.alto, 8);

      if (modoVista === 'preview') {
        if (esPreviewSel) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.75)'; // Verde selección fan
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'; // Transparente disponible
          ctx.strokeStyle = z.color || '#38bdf8';
          ctx.lineWidth = 1.5;
        }
      } else {
        ctx.fillStyle = esSel ? `${z.color || '#38bdf8'}55` : `${z.color || '#38bdf8'}26`;
        ctx.strokeStyle = esSel ? '#ffffff' : z.color || '#38bdf8';
        ctx.lineWidth = esSel ? 3 : 1.5;
      }

      ctx.fill();
      ctx.stroke();

      // En el mapa: solo el número identificador
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(z.nombre.replace(/\D/g, '') || 'Z', z.x + z.ancho / 2, z.y + z.alto / 2 + 6);
      ctx.restore();

      if (modoVista === 'editor' && esSel) {
        dibujarHandles(ctx, z.x, z.y, z.ancho, z.alto);
      }
    });

    // 4. Renderizar Palcos VIP (SOLO EL NÚMERO CENTRADO)
    palcos.forEach((p) => {
      const px = p.x || 100;
      const py = p.y || 100;
      const pw = p.ancho || 150;
      const ph = p.alto || 85;
      const colorPalco = p.color || '#eab308';
      const esSel = elementoSel?.tipo === 'palco' && elementoSel.id === p.id;
      const esPreviewSel = previewSeleccionados.includes(p.id);

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 8);

      if (modoVista === 'preview') {
        if (esPreviewSel) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.75)'; // Verde brillante: Selección
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'; // Transparente: Disponible
          ctx.strokeStyle = colorPalco;
          ctx.lineWidth = 1.8;
        }
      } else {
        ctx.fillStyle = esSel ? `${colorPalco}66` : `${colorPalco}26`;
        ctx.strokeStyle = esSel ? '#ffffff' : colorPalco;
        ctx.lineWidth = esSel ? 3 : 1.8;
      }

      ctx.fill();
      ctx.stroke();

      // EN EL MAPA SALE ÚNICAMENTE EL NÚMERO
      ctx.fillStyle = modoVista === 'preview' && esPreviewSel ? '#ffffff' : colorPalco;
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const numeroMostrar = p.numero || p.id.replace(/\D/g, '') || '1';
      ctx.fillText(numeroMostrar, px + pw / 2, py + ph / 2);
      ctx.restore();

      if (modoVista === 'editor' && esSel) {
        dibujarHandles(ctx, px, py, pw, ph);
      }
    });

    // 5. Renderizar Mesas (SOLO EL NÚMERO CENTRADO)
    mesas.forEach((m) => {
      const mx = m.x || 300;
      const my = m.y || 300;
      const mw = m.ancho || 90;
      const mh = m.alto || 90;
      const colorMesa = m.color || '#6366f1';
      const esSel = elementoSel?.tipo === 'mesa' && elementoSel.id === m.id;
      const esPreviewSel = previewSeleccionados.includes(m.id);

      ctx.save();
      ctx.beginPath();
      if (m.forma === 'CUADRADA') {
        ctx.roundRect(mx, my, mw, mh, 8);
      } else {
        ctx.ellipse(mx + mw / 2, my + mh / 2, mw / 2, mh / 2, 0, 0, Math.PI * 2);
      }

      if (modoVista === 'preview') {
        if (esPreviewSel) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.75)';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.strokeStyle = colorMesa;
          ctx.lineWidth = 1.8;
        }
      } else {
        ctx.fillStyle = esSel ? `${colorMesa}66` : `${colorMesa}26`;
        ctx.strokeStyle = esSel ? '#ffffff' : colorMesa;
        ctx.lineWidth = esSel ? 3 : 1.8;
      }

      ctx.fill();
      ctx.stroke();

      // EN EL MAPA SALE ÚNICAMENTE EL NÚMERO
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const numeroMesa = m.numero || m.id.replace(/\D/g, '') || '1';
      ctx.fillText(numeroMesa, mx + mw / 2, my + mh / 2);
      ctx.restore();

      if (modoVista === 'editor' && esSel) {
        dibujarHandles(ctx, mx, my, mw, mh);
      }
    });

    // 6. Trazo dinámico de dibujo en progreso
    if (drawingBoxRef.current && modoVista === 'editor') {
      const db = drawingBoxRef.current;
      const bx = Math.min(db.startX, db.currentX);
      const by = Math.min(db.startY, db.currentY);
      const bw = Math.abs(db.currentX - db.startX);
      const bh = Math.abs(db.currentY - db.startY);

      ctx.save();
      ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillRect(bx, by, bw, bh);
      ctx.restore();
    }

    ctx.restore();
  }, [
    modoVista,
    imagenFondoOpacidad,
    bgPos,
    bgSize,
    palcos,
    mesas,
    zonasDePie,
    elementoSel,
    previewSeleccionados,
    zoom,
    pan,
    tabSidebar,
    evento.moneda,
  ]);

  // Dibujar puntos de ancla de redimensionamiento estilo Elementor
  const dibujarHandles = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const handles = getHandles(x, y, w, h);
    const size = 9 / zoom;

    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5 / zoom;

    Object.values(handles).forEach((pos) => {
      ctx.beginPath();
      ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
      ctx.strokeRect(pos.x - size / 2, pos.y - size / 2, size, size);
    });
    ctx.restore();
  };

  useEffect(() => {
    renderizar();
  }, [renderizar]);

  // Detección de colisión con los 8 puntos de control
  const detectarPuntoControl = (
    mx: number,
    my: number,
    x: number,
    y: number,
    w: number,
    h: number
  ): PuntoControl | null => {
    const handles = getHandles(x, y, w, h);
    const tolerance = 12 / zoom;

    for (const [key, pos] of Object.entries(handles) as [PuntoControl, { x: number; y: number }][]) {
      if (Math.abs(mx - pos.x) <= tolerance && Math.abs(my - pos.y) <= tolerance) {
        return key;
      }
    }
    return null;
  };

  // Eventos de Ratón sincronizados
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toVirtualCoords(e.clientX, e.clientY);

    // Modo Previsualizador Fan (prueba de selección 1:1)
    if (modoVista === 'preview') {
      for (const p of [...palcos].reverse()) {
        const px = p.x || 0;
        const py = p.y || 0;
        const pw = p.ancho || 150;
        const ph = p.alto || 85;
        if (x >= px && x <= px + pw && y >= py && y <= py + ph) {
          setPreviewSeleccionados((prev) =>
            prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
          );
          return;
        }
      }
      for (const z of [...zonasDePie].reverse()) {
        if (x >= z.x && x <= z.x + z.ancho && y >= z.y && y <= z.y + z.alto) {
          setPreviewSeleccionados((prev) =>
            prev.includes(z.id) ? prev.filter((id) => id !== z.id) : [...prev, z.id]
          );
          return;
        }
      }
      return;
    }

    // Modo Pan (Desplazamiento del lienzo)
    if (herramienta === 'pan' || e.button === 1) {
      isDraggingRef.current = true;
      dragModeRef.current = null;
      const { x: cx, y: cy } = getCanvasMousePos(e.clientX, e.clientY);
      dragStartRef.current = { x: cx - pan.x, y: cy - pan.y };
      return;
    }

    // Modo Dibujo Directo
    if (['dibujar_palco', 'dibujar_zona', 'dibujar_mesa'].includes(herramienta)) {
      drawingBoxRef.current = { startX: x, startY: y, currentX: x, currentY: y };
      renderizar();
      return;
    }

    // Comprobar si se hace clic en un punto de ancla del elemento seleccionado
    if (elementoSel) {
      let b = { x: 0, y: 0, w: 0, h: 0 };
      if (elementoSel.tipo === 'palco') {
        const p = palcos.find((it) => it.id === elementoSel.id);
        if (p) b = { x: p.x || 0, y: p.y || 0, w: p.ancho || 150, h: p.alto || 85 };
      } else if (elementoSel.tipo === 'zona') {
        const z = zonasDePie.find((it) => it.id === elementoSel.id);
        if (z) b = { x: z.x, y: z.y, w: z.ancho, h: z.alto };
      } else if (elementoSel.tipo === 'mesa') {
        const m = mesas.find((it) => it.id === elementoSel.id);
        if (m) b = { x: m.x || 0, y: m.y || 0, w: m.ancho || 90, h: m.alto || 90 };
      }

      const clickedHandle = detectarPuntoControl(x, y, b.x, b.y, b.w, b.h);
      if (clickedHandle) {
        isDraggingRef.current = true;
        dragModeRef.current = 'resize';
        activeHandleRef.current = clickedHandle;
        dragStartRef.current = { x, y };
        elementInitialBoundsRef.current = b;
        return;
      }
    }

    // Detección de selección de elementos
    for (const p of [...palcos].reverse()) {
      const px = p.x || 0;
      const py = p.y || 0;
      const pw = p.ancho || 150;
      const ph = p.alto || 85;
      if (x >= px && x <= px + pw && y >= py && y <= py + ph) {
        setElementoSel({ tipo: 'palco', id: p.id });
        isDraggingRef.current = true;
        dragModeRef.current = 'move';
        dragStartRef.current = { x: x - px, y: y - py };
        return;
      }
    }

    for (const z of [...zonasDePie].reverse()) {
      if (x >= z.x && x <= z.x + z.ancho && y >= z.y && y <= z.y + z.alto) {
        setElementoSel({ tipo: 'zona', id: z.id });
        isDraggingRef.current = true;
        dragModeRef.current = 'move';
        dragStartRef.current = { x: x - z.x, y: y - z.y };
        return;
      }
    }

    for (const m of [...mesas].reverse()) {
      const mx = m.x || 0;
      const my = m.y || 0;
      const mw = m.ancho || 90;
      const mh = m.alto || 90;
      if (x >= mx && x <= mx + mw && y >= my && y <= my + mh) {
        setElementoSel({ tipo: 'mesa', id: m.id });
        isDraggingRef.current = true;
        dragModeRef.current = 'move';
        dragStartRef.current = { x: x - mx, y: y - my };
        return;
      }
    }

    setElementoSel(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (herramienta === 'pan' && isDraggingRef.current) {
      const { x: cx, y: cy } = getCanvasMousePos(e.clientX, e.clientY);
      setPan({
        x: cx - dragStartRef.current.x,
        y: cy - dragStartRef.current.y,
      });
      return;
    }

    const { x, y } = toVirtualCoords(e.clientX, e.clientY);

    if (drawingBoxRef.current) {
      drawingBoxRef.current.currentX = x;
      drawingBoxRef.current.currentY = y;
      renderizar();
      return;
    }

    if (isDraggingRef.current && elementoSel) {
      // 1. Redimensionamiento por puntos de ancla
      if (dragModeRef.current === 'resize' && activeHandleRef.current) {
        const handle = activeHandleRef.current;
        const b = elementInitialBoundsRef.current;
        const dx = x - dragStartRef.current.x;
        const dy = y - dragStartRef.current.y;

        let newX = b.x;
        let newY = b.y;
        let newW = b.w;
        let newH = b.h;

        if (handle.includes('e')) newW = Math.max(30, b.w + dx);
        if (handle.includes('s')) newH = Math.max(20, b.h + dy);
        if (handle.includes('w')) {
          const wCalc = Math.max(30, b.w - dx);
          newX = b.x + (b.w - wCalc);
          newW = wCalc;
        }
        if (handle.includes('n')) {
          const hCalc = Math.max(20, b.h - dy);
          newY = b.y + (b.h - hCalc);
          newH = hCalc;
        }

        if (elementoSel.tipo === 'palco') {
          setPalcos((prev) =>
            prev.map((p) => (p.id === elementoSel.id ? { ...p, x: newX, y: newY, ancho: newW, alto: newH } : p))
          );
        } else if (elementoSel.tipo === 'zona') {
          setZonasDePie((prev) =>
            prev.map((z) => (z.id === elementoSel.id ? { ...z, x: newX, y: newY, ancho: newW, alto: newH } : z))
          );
        } else if (elementoSel.tipo === 'mesa') {
          setMesas((prev) =>
            prev.map((m) => (m.id === elementoSel.id ? { ...m, x: newX, y: newY, ancho: newW, alto: newH } : m))
          );
        }
        return;
      }

      // 2. Desplazamiento completo del elemento
      if (dragModeRef.current === 'move') {
        const nx = Math.round(x - dragStartRef.current.x);
        const ny = Math.round(y - dragStartRef.current.y);

        if (elementoSel.tipo === 'palco') {
          setPalcos((prev) => prev.map((p) => (p.id === elementoSel.id ? { ...p, x: nx, y: ny } : p)));
        } else if (elementoSel.tipo === 'zona') {
          setZonasDePie((prev) => prev.map((z) => (z.id === elementoSel.id ? { ...z, x: nx, y: ny } : z)));
        } else if (elementoSel.tipo === 'mesa') {
          setMesas((prev) => prev.map((m) => (m.id === elementoSel.id ? { ...m, x: nx, y: ny } : m)));
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (drawingBoxRef.current) {
      const db = drawingBoxRef.current;
      const rx = Math.round(Math.min(db.startX, db.currentX));
      const ry = Math.round(Math.min(db.startY, db.currentY));
      const rw = Math.round(Math.abs(db.currentX - db.startX));
      const rh = Math.round(Math.abs(db.currentY - db.startY));

      if (rw > 30 && rh > 20) {
        if (herramienta === 'dibujar_palco') {
          const num = `${palcos.length + 1}`;
          const nuevoPalco: PalcoStudio = {
            id: `P-${num}-${Date.now().toString().slice(-4)}`,
            numero: num,
            nombre: 'Palco Diamante',
            capacidad: 8,
            sillasAdicionales: 0,
            precioPalcoBase: 800.0,
            modoVenta: 'COMPLETO',
            color: '#eab308',
            x: rx,
            y: ry,
            ancho: rw,
            alto: rh,
            tarifas: {
              preventa: 560.0,
              lanzamiento: 640.0,
              etapa1: 720.0,
              etapa2: 800.0,
              etapa3Full: 920.0,
              esCorporativo: false,
              precioCorporativo: 700.0,
              codigoPromoVIP: 'VIP2026',
              descuentoPromoPct: 10,
            },
          };
          setPalcos((prev) => [...prev, nuevoPalco]);
          setElementoSel({ tipo: 'palco', id: nuevoPalco.id });
        } else if (herramienta === 'dibujar_zona') {
          const nuevaZona: ZonaStudio = {
            id: `Z-${Date.now().toString().slice(-4)}`,
            nombre: `Pista General #${zonasDePie.length + 1}`,
            color: '#38bdf8',
            precioBase: 45.0,
            aforoMaximo: Math.max(50, Math.round((rw * rh) / 25)),
            vendidas: 0,
            x: rx,
            y: ry,
            ancho: rw,
            alto: rh,
          };
          setZonasDePie((prev) => [...prev, nuevaZona]);
          setElementoSel({ tipo: 'zona', id: nuevaZona.id });
        } else if (herramienta === 'dibujar_mesa') {
          const num = `${mesas.length + 1}`;
          const nuevaMesa: MesaStudio = {
            id: `M-${num}-${Date.now().toString().slice(-4)}`,
            numero: num,
            nombre: 'Mesa VIP',
            forma: 'REDONDA',
            sillas: 4,
            precioSillaBase: 60.0,
            color: '#6366f1',
            x: rx,
            y: ry,
            ancho: rw,
            alto: rh,
          };
          setMesas((prev) => [...prev, nuevaMesa]);
          setElementoSel({ tipo: 'mesa', id: nuevaMesa.id });
        }
      }
      drawingBoxRef.current = null;
      setHerramienta('seleccionar');
    }
    isDraggingRef.current = false;
    dragModeRef.current = null;
    activeHandleRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(3.0, Math.max(0.3, Number((prev * factor).toFixed(2)))));
  };

  // Carga masiva de CSV / TXT
  const handleImportarCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const texto = event.target?.result as string;
      if (!texto) return;

      const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      const inicio = lineas[0].toLowerCase().includes('tipo') ? 1 : 0;
      const nuevosPalcos: PalcoStudio[] = [];

      const startX = 60;
      const startY = 100;
      const itemW = 150;
      const itemH = 85;
      const gap = 15;
      const cols = 9;

      let count = 0;
      for (let i = inicio; i < lineas.length; i++) {
        const c = lineas[i].split(',').map((val) => val.trim().replace(/^["']|["']$/g, ''));
        if (c.length < 3) continue;

        const tipo = c[0].toUpperCase();
        const numero = c[1] || `${count + 1}`;
        const nombre = c[2] || `Palco Diamante`;
        const capacidad = parseInt(c[3]) || 8;
        const precioBase = parseFloat(c[4]) || 500.0;
        const color = c[5] || '#eab308';

        const xPos = c[7] ? parseInt(c[7]) : startX + (count % cols) * (itemW + gap);
        const yPos = c[8] ? parseInt(c[8]) : startY + Math.floor(count / cols) * (itemH + gap);

        if (tipo === 'PALCO') {
          nuevosPalcos.push({
            id: `P-${numero}-${Date.now().toString().slice(-4)}`,
            numero,
            nombre,
            capacidad,
            sillasAdicionales: 0,
            precioPalcoBase: precioBase,
            modoVenta: 'COMPLETO',
            precioSillaIndividual: Number((precioBase / capacidad).toFixed(2)),
            color,
            x: xPos,
            y: yPos,
            ancho: itemW,
            alto: itemH,
            tarifas: {
              preventa: Number((precioBase * 0.7).toFixed(2)),
              lanzamiento: Number((precioBase * 0.8).toFixed(2)),
              etapa1: Number((precioBase * 0.9).toFixed(2)),
              etapa2: precioBase,
              etapa3Full: Number((precioBase * 1.15).toFixed(2)),
              esCorporativo: false,
              precioCorporativo: Number((precioBase * 0.85).toFixed(2)),
              codigoPromoVIP: 'VIP2026',
              descuentoPromoPct: 10,
            },
          });
          count++;
        }
      }

      setPalcos((prev) => [...prev, ...nuevosPalcos]);
      setModalCsvAbierto(false);
      notificar(`¡Importación completada! ${nuevosPalcos.length} palcos generados en cuadrícula.`);
    };
    reader.readAsText(file);
  };

  const handleDescargarPlantilla = () => {
    const csv =
      'Tipo,Numero,Nombre,Capacidad,PrecioBase,Color,Modalidad\n' +
      'PALCO,1,Palco Diamante,8,800.00,#eab308,COMPLETO\n' +
      'PALCO,2,Palco Diamante,8,800.00,#eab308,COMPLETO\n' +
      'PALCO,3,Palco Oro,6,500.00,#6366f1,INDIVIDUAL\n' +
      'MESA,1,Mesa VIP,4,60.00,#10b981,REDONDA\n' +
      'ZONA,1,Front Stage,300,45.00,#38bdf8,GENERAL\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_recinto_biotickets.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGuardarDefinitivo = async () => {
    setGuardando(true);
    setGuardadoExito(false);
    try {
      await onGuardar({
        imagenFondo,
        imagenFondoOpacidad,
        filas,
        mesas,
        palcos,
        zonasDePie,
      });
      setGuardadoExito(true);
      notificar('¡Mapa guardado y publicado con éxito!');
      setTimeout(() => setGuardadoExito(false), 3000);
    } finally {
      setGuardando(false);
    }
  };

  const palcoActivo = palcos.find((p) => p.id === elementoSel?.id);
  const zonaActiva = zonasDePie.find((z) => z.id === elementoSel?.id);
  const mesaActiva = mesas.find((m) => m.id === elementoSel?.id);

  return (
    <div className="space-y-4">
      {/* Barra de Herramientas Superior: Acciones Globales + Switcher Editor/Preview */}
      <div className="glass-panel p-4 rounded-3xl border border-white/10 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Botón para iniciar mapa en blanco */}
          <button
            onClick={handleNuevoMapaEnBlanco}
            className="px-4 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Borra todos los elementos e inicia un lienzo limpio con solo la cuadrícula"
          >
            <FilePlus className="w-4 h-4 text-rose-400" />
            <span>Nuevo Mapa en Blanco</span>
          </button>

          {/* Botón Cargar Archivo CSV / TXT */}
          <button
            onClick={() => setModalCsvAbierto(true)}
            className="px-4 py-2 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Importar archivo CSV o TXT con palcos masivos"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <span>Cargar Archivo CSV/TXT</span>
          </button>
        </div>

        {/* Switcher Estilo Elementor: [ ✏️ Modo Edición ] vs [ 👁️ Previsualizador Taquilla ] */}
        <div className="flex items-center bg-slate-900 border border-white/10 rounded-2xl p-1">
          <button
            onClick={() => {
              setModoVista('editor');
              setPreviewSeleccionados([]);
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              modoVista === 'editor'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Modo Edición</span>
          </button>
          <button
            onClick={() => setModoVista('preview')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              modoVista === 'preview'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>👁️ Previsualizador Taquilla</span>
          </button>
        </div>

        {/* Guardar y Publicar */}
        <button
          onClick={handleGuardarDefinitivo}
          disabled={guardando}
          className="px-6 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {guardadoExito ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Guardado Exitoso!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar y Publicar</span>
            </>
          )}
        </button>
      </div>

      {mensajeNotif && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{mensajeNotif}</span>
        </div>
      )}

      {/* Grid Principal: Panel de Control (Izquierda) + Lienzo 2D con Handles (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PANEL IZQUIERDO: FORMULARIO Y HERRAMIENTAS */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-4">
            {/* Pestañas de Ajustes */}
            <div className="flex flex-wrap gap-1 pb-3 border-b border-white/10">
              <button
                onClick={() => setTabSidebar('elementos')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  tabSidebar === 'elementos' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Elementos</span>
              </button>
              <button
                onClick={() => setTabSidebar('fondo')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  tabSidebar === 'fondo' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Plano Fondo</span>
              </button>
              <button
                onClick={() => setTabSidebar('tarifas')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  tabSidebar === 'tarifas' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Tarifas</span>
              </button>
            </div>

            {/* TAB 1: ELEMENTOS Y DIBUJO CON PUNTOS */}
            {tabSidebar === 'elementos' && (
              <div className="space-y-4 animate-fadeIn">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Herramientas de Dibujo (Arrastra en el Lienzo):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setHerramienta('dibujar_palco')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      herramienta === 'dibujar_palco'
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                        : 'bg-slate-900 border-white/10 text-slate-300 hover:border-amber-400/50'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold">Palco</span>
                  </button>
                  <button
                    onClick={() => setHerramienta('dibujar_mesa')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      herramienta === 'dibujar_mesa'
                        ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-md'
                        : 'bg-slate-900 border-white/10 text-slate-300 hover:border-indigo-400/50'
                    }`}
                  >
                    <Coffee className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold">Mesa</span>
                  </button>
                  <button
                    onClick={() => setHerramienta('dibujar_zona')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      herramienta === 'dibujar_zona'
                        ? 'bg-sky-500/20 border-sky-400 text-white shadow-md'
                        : 'bg-slate-900 border-white/10 text-slate-300 hover:border-sky-400/50'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold">Zona</span>
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-slate-300">
                  <span className="font-bold text-indigo-300 block mb-0.5">Modificación con Puntos de Control:</span>
                  Selecciona cualquier palco o mesa en el mapa y arrastra los <strong>puntos en sus esquinas y lados</strong> para redimensionar su tamaño al vuelo.
                </div>

                {/* Listado de Palcos Actuales */}
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 border-t border-white/5 pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Palcos Creados ({palcos.length}):
                  </span>
                  {palcos.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setElementoSel({ tipo: 'palco', id: p.id })}
                      className={`p-2.5 rounded-xl border flex justify-between items-center text-xs cursor-pointer transition ${
                        elementoSel?.id === p.id
                          ? 'bg-amber-950/60 border-amber-400 text-white'
                          : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color || '#eab308' }}></span>
                        <span className="font-bold">Palco #{p.numero || p.id}</span>
                      </div>
                      <span className="font-mono text-emerald-400">{p.precioPalcoBase} {evento.moneda}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: CALIBRACIÓN DEL PLANO DE FONDO (TAMAÑO, ESCALA Y POSICIÓN) */}
            {tabSidebar === 'fondo' && (
              <div className="space-y-4 animate-fadeIn">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Cargar Imagen de Plano (PC, Drive o Web):
                </span>
                <label className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Subir Imagen desde mi Equipo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (typeof ev.target?.result === 'string') {
                          setImagenFondo(ev.target.result);
                          notificar('Imagen de plano cargada.');
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>

                <input
                  type="url"
                  placeholder="O ingresa URL pública / Enlace Drive..."
                  value={imagenFondo}
                  onChange={(e) => setImagenFondo(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-xs text-white"
                />

                {/* Ajustes de Posición y Tamaño de la Imagen */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 block tracking-wider">
                    Calibración de Tamaño y Disposición:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Ancho Imagen (px):</label>
                      <input
                        type="number"
                        value={bgSize.w}
                        onChange={(e) => setBgSize({ ...bgSize, w: parseInt(e.target.value) || 100 })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Alto Imagen (px):</label>
                      <input
                        type="number"
                        value={bgSize.h}
                        onChange={(e) => setBgSize({ ...bgSize, h: parseInt(e.target.value) || 100 })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Desplazamiento X:</label>
                      <input
                        type="number"
                        value={bgPos.x}
                        onChange={(e) => setBgPos({ ...bgPos, x: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Desplazamiento Y:</label>
                      <input
                        type="number"
                        value={bgPos.y}
                        onChange={(e) => setBgPos({ ...bgPos, y: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setBgPos({ x: 0, y: 0 });
                        setBgSize({ w: 1600, h: 1000 });
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                    >
                      Ajustar a 1600×1000
                    </button>
                    <button
                      onClick={() => setImagenFondo('')}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 text-xs font-bold hover:bg-rose-500/20 transition cursor-pointer"
                    >
                      Quitar Imagen
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Opacidad de la Imagen:</span>
                      <span className="font-mono text-white">{Math.round(imagenFondoOpacidad * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={imagenFondoOpacidad}
                      onChange={(e) => setImagenFondoOpacidad(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TARIFARIO, FASES Y DESCUENTOS */}
            {tabSidebar === 'tarifas' && (
              <div className="space-y-4 animate-fadeIn">
                {elementoSel && palcoActivo ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold flex justify-between items-center">
                      <span>{palcoActivo.nombre} #{palcoActivo.numero}</span>
                      <span>{palcoActivo.capacidad} Plazas</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Preventa ({evento.moneda}):</label>
                        <input
                          type="number"
                          value={palcoActivo.tarifas?.preventa || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPalcos(
                              palcos.map((p) =>
                                p.id === palcoActivo.id
                                  ? { ...p, tarifas: { ...p.tarifas!, preventa: val } }
                                  : p
                              )
                            );
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Lanzamiento ({evento.moneda}):</label>
                        <input
                          type="number"
                          value={palcoActivo.tarifas?.lanzamiento || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPalcos(
                              palcos.map((p) =>
                                p.id === palcoActivo.id
                                  ? { ...p, tarifas: { ...p.tarifas!, lanzamiento: val } }
                                  : p
                              )
                            );
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Etapa 1:</label>
                        <input
                          type="number"
                          value={palcoActivo.tarifas?.etapa1 || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPalcos(
                              palcos.map((p) =>
                                p.id === palcoActivo.id
                                  ? { ...p, tarifas: { ...p.tarifas!, etapa1: val } }
                                  : p
                              )
                            );
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Etapa 2:</label>
                        <input
                          type="number"
                          value={palcoActivo.tarifas?.etapa2 || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPalcos(
                              palcos.map((p) =>
                                p.id === palcoActivo.id
                                  ? { ...p, tarifas: { ...p.tarifas!, etapa2: val } }
                                  : p
                              )
                            );
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Full Precio:</label>
                        <input
                          type="number"
                          value={palcoActivo.precioPalcoBase}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPalcos(
                              palcos.map((p) =>
                                p.id === palcoActivo.id
                                  ? { ...p, precioPalcoBase: val, tarifas: { ...p.tarifas!, etapa3Full: val } }
                                  : p
                              )
                            );
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-emerald-400 font-bold font-mono"
                        />
                      </div>
                    </div>

                    {/* Venta Corporativa */}
                    <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Venta Corporativa (B2B)
                        </span>
                        <input
                          type="checkbox"
                          checked={palcoActivo.tarifas?.esCorporativo || false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setPalcos(
                              palcos.map((p) =>
                                p.id === palcoActivo.id
                                  ? { ...p, tarifas: { ...p.tarifas!, esCorporativo: val } }
                                  : p
                              )
                            );
                          }}
                          className="w-4 h-4 accent-indigo-600 rounded"
                        />
                      </div>
                    </div>

                    {/* Código Descuento VIP */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Cupón VIP:</label>
                        <input
                          type="text"
                          value={palcoActivo.tarifas?.codigoPromoVIP || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPalcos(
                              palcos.map((p) =>
                                p.id === palcoActivo.id
                                  ? { ...p, tarifas: { ...p.tarifas!, codigoPromoVIP: val } }
                                  : p
                              )
                            );
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Descuento (%):</label>
                        <input
                          type="number"
                          value={palcoActivo.tarifas?.descuentoPromoPct || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPalcos(
                              palcos.map((p) =>
                                p.id === palcoActivo.id
                                  ? { ...p, tarifas: { ...p.tarifas!, descuentoPromoPct: val } }
                                  : p
                              )
                            );
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Selecciona un palco o zona en el lienzo para configurar sus 5 etapas de precios y venta corporativa.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* INSPECTOR DE PROPIEDADES DIRECTAS (CONTROL Y BOLETA) */}
          {elementoSel && palcoActivo && (
            <div className="glass-panel rounded-3xl p-4 border border-amber-500/30 space-y-3 bg-slate-950/80">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4" /> Control & Boleta: Palco #{palcoActivo.numero}
                </span>
                <button
                  onClick={() => {
                    setPalcos(palcos.filter((p) => p.id !== palcoActivo.id));
                    setElementoSel(null);
                  }}
                  className="text-rose-400 hover:bg-rose-500/10 p-1 rounded-lg cursor-pointer"
                  title="Eliminar Palco"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Nombre de control interno (Sale en la boleta) */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Nombre Categoría (Para Boleta y Control):</label>
                <input
                  type="text"
                  value={palcoActivo.nombre}
                  onChange={(e) =>
                    setPalcos(palcos.map((p) => (p.id === palcoActivo.id ? { ...p, nombre: e.target.value } : p)))
                  }
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-bold"
                  placeholder="Ej. Palco Diamante VIP"
                />
              </div>

              {/* Número que sale en el mapa */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Número de Palco (Sale en el Mapa):</label>
                <input
                  type="text"
                  value={palcoActivo.numero || ''}
                  onChange={(e) =>
                    setPalcos(palcos.map((p) => (p.id === palcoActivo.id ? { ...p, numero: e.target.value } : p)))
                  }
                  className="w-full bg-slate-900 border border-amber-500/40 rounded-xl p-2 text-amber-300 font-bold font-mono text-sm"
                  placeholder="Ej. 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Ancho (px):</label>
                  <input
                    type="number"
                    value={palcoActivo.ancho || 150}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 50;
                      setPalcos(palcos.map((p) => (p.id === palcoActivo.id ? { ...p, ancho: val } : p)));
                    }}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Alto (px):</label>
                  <input
                    type="number"
                    value={palcoActivo.alto || 85}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 30;
                      setPalcos(palcos.map((p) => (p.id === palcoActivo.id ? { ...p, alto: val } : p)));
                    }}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Color Identificador:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={palcoActivo.color || '#eab308'}
                    onChange={(e) =>
                      setPalcos(palcos.map((p) => (p.id === palcoActivo.id ? { ...p, color: e.target.value } : p)))
                    }
                    className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 cursor-pointer"
                  />
                  <span className="font-mono text-white text-[11px]">{palcoActivo.color || '#eab308'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PANEL DERECHO: LIENZO CANVAS DE ALTA RESOLUCIÓN */}
        <div className="lg:col-span-8">
          <div className="glass-panel p-3 rounded-3xl border border-white/10 bg-slate-950 flex flex-col items-center overflow-hidden">
            {/* Barra de Controles de Lienzo */}
            <div className="w-full flex justify-between items-center px-2 pb-2 border-b border-white/5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${modoVista === 'preview' ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`}></span>
                <span className="text-white font-bold">
                  {modoVista === 'preview' ? 'Previsualizador Fan en Vivo (Prueba de Selección)' : 'Lienzo de Diseño Arquitectónico'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHerramienta('seleccionar')}
                  className={`p-1.5 rounded-lg cursor-pointer ${herramienta === 'seleccionar' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5'}`}
                  title="Cursor Selección"
                >
                  <MousePointer className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setHerramienta('pan')}
                  className={`p-1.5 rounded-lg cursor-pointer ${herramienta === 'pan' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5'}`}
                  title="Mano para Desplazar"
                >
                  <Hand className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(0.3, Number((z - 0.15).toFixed(2))))}
                  className="p-1.5 hover:bg-white/5 rounded-lg cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] text-white">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.15).toFixed(2))))}
                  className="p-1.5 hover:bg-white/5 rounded-lg cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="p-1.5 hover:bg-white/5 rounded-lg cursor-pointer"
                  title="Restablecer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={1600}
              height={1000}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              className={`rounded-2xl max-w-full h-auto select-none mt-2 ${
                herramienta === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
              }`}
            />

            <div className="w-full flex justify-between items-center text-[10px] text-slate-500 pt-2 px-2">
              <span>Resolución Nativa: 1600×1000 px | Arrastra las esquinas de cualquier palco para cambiar su tamaño</span>
              <span className="font-mono text-slate-400">Total Palcos: {palcos.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CARGA MASIVA CSV / TXT */}
      {modalCsvAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Importador Masivo de Archivos Planos</h3>
              </div>
              <button onClick={() => setModalCsvAbierto(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Carga tu archivo <strong>.CSV</strong> o <strong>.TXT</strong> con la lista de palcos, capacidades y precios. La plataforma generará automáticamente la cuadrícula y las etapas tarifarias en milisegundos.
            </p>

            <div className="p-4 rounded-2xl border-2 border-dashed border-indigo-500/40 hover:border-indigo-500 bg-indigo-950/20 text-center cursor-pointer">
              <label className="cursor-pointer block">
                <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-white block">Haz clic para buscar tu archivo CSV o TXT</span>
                <span className="text-[10px] text-slate-400">Admite archivos con más de 1.500 palcos</span>
                <input type="file" accept=".csv,.txt" onChange={handleImportarCSV} className="hidden" />
              </label>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleDescargarPlantilla}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar archivo de ejemplo (.csv)</span>
              </button>
              <button
                onClick={() => setModalCsvAbierto(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
