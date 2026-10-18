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
  DollarSign,
  ShieldCheck,
  Building2,
  Ticket,
  ChevronRight,
  ChevronLeft,
  FolderOpen,
  Bookmark,
  Percent,
} from 'lucide-react';

interface SeatMapStudioProps {
  evento: Evento;
  mapaActual: MapaRecinto;
  onGuardar: (mapa: Partial<MapaRecinto>) => Promise<void>;
  onActualizarEvento?: (cambios: Partial<Evento>) => Promise<void>;
  onCambiarTab?: (tab: string) => void;
}

// Estructura de Precios por Etapas y Descuentos
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
  categoria?: string;
  tarifas?: EsquemaTarifario;
}

export interface MesaStudio extends MesaEspecial {
  numero?: string;
  color?: string;
  categoria?: string;
  tarifas?: EsquemaTarifario;
}

export interface ZonaStudio extends ZonaDePie {
  tarifas?: EsquemaTarifario;
}

// Plantilla guardable en la biblioteca
export interface PlantillaMapa {
  id: string;
  nombre: string;
  fechaCreacion: string;
  mapa: MapaRecinto;
}

export const SeatMapStudio: React.FC<SeatMapStudioProps> = ({
  evento,
  mapaActual,
  onGuardar,
  onActualizarEvento,
  onCambiarTab,
}) => {
  // PASO ACTIVO DEL WIZARD (1: Configuración & Fondo, 2: Dibujo & Distribución, 3: Tarifario & Fases, 4: Biblioteca & Asignación)
  const [pasoActivo, setPasoActivo] = useState<1 | 2 | 3 | 4>(1);

  // Nombre y metadatos del mapa
  const [nombreMapa, setNombreMapa] = useState<string>(`Plano Oficial - ${evento.lugar}`);
  const [imagenFondo, setImagenFondo] = useState(mapaActual.imagenFondo || '');
  const [imagenFondoOpacidad, setImagenFondoOpacidad] = useState(
    mapaActual.imagenFondoOpacidad !== undefined ? mapaActual.imagenFondoOpacidad : 0.65
  );

  // Elementos del recinto
  const [palcos, setPalcos] = useState<PalcoStudio[]>((mapaActual.palcos || []) as PalcoStudio[]);
  const [mesas, setMesas] = useState<MesaStudio[]>((mapaActual.mesas || []) as MesaStudio[]);
  const [zonasDePie, setZonasDePie] = useState<ZonaStudio[]>((mapaActual.zonasDePie || []) as ZonaStudio[]);
  const [filas, setFilas] = useState<FilaAsientos[]>(mapaActual.filas || []);

  // Biblioteca de mapas guardados en LocalStorage
  const [biblioteca, setBiblioteca] = useState<PlantillaMapa[]>(() => {
    try {
      const guardadas = localStorage.getItem('biotickets_map_library');
      return guardadas ? JSON.parse(guardadas) : [];
    } catch {
      return [];
    }
  });

  // Navegación Canvas: Zoom y Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [herramienta, setHerramienta] = useState<'seleccionar' | 'pan' | 'dibujar_palco' | 'dibujar_zona'>('seleccionar');

  // Selección activa en el editor
  const [elementoSel, setElementoSel] = useState<{ tipo: 'palco' | 'mesa' | 'zona' | 'fila'; id: string } | null>(null);

  // Feedback y loaders
  const [guardando, setGuardando] = useState(false);
  const [guardadoExito, setGuardadoExito] = useState(false);
  const [mensajeNotif, setMensajeNotif] = useState<string | null>(null);

  // Canvas y referencias de arrastre
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgFondoRef = useRef<HTMLImageElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const drawingBoxRef = useRef<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  const notificar = (msg: string) => {
    setMensajeNotif(msg);
    setTimeout(() => setMensajeNotif(null), 4000);
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

  const toVirtualCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  // Renderizado Vectorial sobre el Canvas 2D
  const renderizar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Fondo oscuro
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, w, h);

    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Imagen del plano arquitectónico
    if (imgFondoRef.current) {
      ctx.save();
      ctx.globalAlpha = imagenFondoOpacidad;
      ctx.drawImage(imgFondoRef.current, 0, 0, 1600, 1000);
      ctx.restore();
    } else {
      // Cuadrícula arquitectónica por defecto
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1 / zoom;
      for (let x = 0; x < 1600; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1000);
        ctx.stroke();
      }
      for (let y = 0; y < 1000; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1600, y);
        ctx.stroke();
      }
    }

    // 2. Zonas de Pie
    zonasDePie.forEach((z) => {
      const esSel = elementoSel?.tipo === 'zona' && elementoSel.id === z.id;
      ctx.save();
      ctx.fillStyle = `${z.color || '#38bdf8'}30`;
      ctx.strokeStyle = esSel ? '#ffffff' : z.color || '#38bdf8';
      ctx.lineWidth = esSel ? 3 : 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.roundRect(z.x, z.y, z.ancho, z.alto, 8);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = z.color || '#38bdf8';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const precioBase = z.tarifas?.etapa3Full || z.precioBase;
      ctx.fillText(
        `${z.nombre} [Aforo: ${z.aforoMaximo}] - ${precioBase} ${evento.moneda}`,
        z.x + z.ancho / 2,
        z.y + z.alto / 2 + 4
      );
      ctx.restore();
    });

    // 3. Palcos VIP
    palcos.forEach((p) => {
      const px = p.x || 100;
      const py = p.y || 100;
      const pw = p.ancho || 150;
      const ph = p.alto || 85;
      const colorPalco = p.color || '#eab308';
      const esSel = elementoSel?.tipo === 'palco' && elementoSel.id === p.id;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 8);
      ctx.fillStyle = esSel ? `${colorPalco}66` : `${colorPalco}26`;
      ctx.strokeStyle = esSel ? '#ffffff' : colorPalco;
      ctx.lineWidth = esSel ? 3 : 1.8;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colorPalco;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const rotulo = p.numero ? `${p.nombre} #${p.numero}` : p.nombre;
      ctx.fillText(rotulo, px + pw / 2, py + 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      const precioMostrar = p.tarifas?.etapa3Full || p.precioPalcoBase;
      ctx.fillText(`${p.capacidad}p | ${precioMostrar} ${evento.moneda}`, px + pw / 2, py + ph - 14);
      ctx.restore();
    });

    // 4. Mesas
    mesas.forEach((m) => {
      const mx = m.x || 300;
      const my = m.y || 300;
      const rad = m.tamano || 22;
      const colorMesa = m.color || '#6366f1';
      const esSel = elementoSel?.tipo === 'mesa' && elementoSel.id === m.id;

      ctx.save();
      ctx.fillStyle = esSel ? `${colorMesa}77` : `${colorMesa}33`;
      ctx.strokeStyle = esSel ? '#ffffff' : colorMesa;
      ctx.lineWidth = esSel ? 3 : 1.8;

      ctx.beginPath();
      if (m.forma === 'CUADRADA') {
        ctx.roundRect(mx - rad, my - rad, rad * 2, rad * 2, 6);
      } else {
        ctx.arc(mx, my, rad, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(m.numero ? `${m.nombre} #${m.numero}` : m.nombre, mx, my + 3);
      ctx.restore();
    });

    // 5. Caja en dibujo activo
    if (drawingBoxRef.current) {
      const db = drawingBoxRef.current;
      const bx = Math.min(db.startX, db.currentX);
      const by = Math.min(db.startY, db.currentY);
      const bw = Math.abs(db.currentX - db.startX);
      const bh = Math.abs(db.currentY - db.startY);

      ctx.save();
      ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillRect(bx, by, bw, bh);
      ctx.restore();
    }

    ctx.restore();
  }, [imagenFondoOpacidad, palcos, mesas, zonasDePie, filas, elementoSel, zoom, pan, evento.moneda]);

  useEffect(() => {
    renderizar();
  }, [renderizar]);

  // Cargar imagen local desde PC
  const handleUploadImagenLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImagenFondo(event.target.result);
        notificar('Plano de fondo cargado correctamente.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Importador Masivo CSV con inicialización de Tarifas
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
      notificar(`Importados ${nuevosPalcos.length} palcos con tarifas por etapa configuradas.`);
    };
    reader.readAsText(file);
  };

  // Interacción en Canvas con ratón
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toVirtualCoords(e.clientX, e.clientY);

    if (herramienta === 'pan' || e.button === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    if (herramienta === 'dibujar_palco' || herramienta === 'dibujar_zona') {
      drawingBoxRef.current = { startX: x, startY: y, currentX: x, currentY: y };
      renderizar();
      return;
    }

    // Detección de Palcos
    for (const p of [...palcos].reverse()) {
      const px = p.x || 0;
      const py = p.y || 0;
      const pw = p.ancho || 150;
      const ph = p.alto || 85;
      if (x >= px && x <= px + pw && y >= py && y <= py + ph) {
        setElementoSel({ tipo: 'palco', id: p.id });
        isDraggingRef.current = true;
        dragOffsetRef.current = { x: x - px, y: y - py };
        return;
      }
    }

    // Detección de Zonas
    for (const z of [...zonasDePie].reverse()) {
      if (x >= z.x && x <= z.x + z.ancho && y >= z.y && y <= z.y + z.alto) {
        setElementoSel({ tipo: 'zona', id: z.id });
        isDraggingRef.current = true;
        dragOffsetRef.current = { x: x - z.x, y: y - z.y };
        return;
      }
    }

    setElementoSel(null);
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

    if (drawingBoxRef.current) {
      drawingBoxRef.current.currentX = x;
      drawingBoxRef.current.currentY = y;
      renderizar();
      return;
    }

    if (isDraggingRef.current && elementoSel) {
      if (elementoSel.tipo === 'palco') {
        setPalcos((prev) =>
          prev.map((p) =>
            p.id === elementoSel.id
              ? { ...p, x: Math.round(x - dragOffsetRef.current.x), y: Math.round(y - dragOffsetRef.current.y) }
              : p
          )
        );
      } else if (elementoSel.tipo === 'zona') {
        setZonasDePie((prev) =>
          prev.map((z) =>
            z.id === elementoSel.id
              ? { ...z, x: Math.round(x - dragOffsetRef.current.x), y: Math.round(y - dragOffsetRef.current.y) }
              : z
          )
        );
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
            nombre: 'Palco VIP',
            capacidad: 8,
            sillasAdicionales: 0,
            precioPalcoBase: 600.0,
            modoVenta: 'COMPLETO',
            color: '#eab308',
            x: rx,
            y: ry,
            ancho: rw,
            alto: rh,
            tarifas: {
              preventa: 420.0,
              lanzamiento: 480.0,
              etapa1: 540.0,
              etapa2: 600.0,
              etapa3Full: 690.0,
              esCorporativo: false,
              precioCorporativo: 520.0,
              codigoPromoVIP: 'VIP2026',
              descuentoPromoPct: 10,
            },
          };
          setPalcos((prev) => [...prev, nuevoPalco]);
          setElementoSel({ tipo: 'palco', id: nuevoPalco.id });
        } else if (herramienta === 'dibujar_zona') {
          const nuevaZona: ZonaStudio = {
            id: `Z-${Date.now().toString().slice(-4)}`,
            nombre: `Zona Admisión #${zonasDePie.length + 1}`,
            color: '#38bdf8',
            precioBase: 40.0,
            aforoMaximo: Math.max(50, Math.round((rw * rh) / 25)),
            vendidas: 0,
            x: rx,
            y: ry,
            ancho: rw,
            alto: rh,
            tarifas: {
              preventa: 28.0,
              lanzamiento: 32.0,
              etapa1: 36.0,
              etapa2: 40.0,
              etapa3Full: 46.0,
              esCorporativo: false,
            },
          };
          setZonasDePie((prev) => [...prev, nuevaZona]);
          setElementoSel({ tipo: 'zona', id: nuevaZona.id });
        }
      }
      drawingBoxRef.current = null;
      setHerramienta('seleccionar');
    }
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(3.0, Math.max(0.3, Number((prev * factor).toFixed(2)))));
  };

  // Guardar en la biblioteca reutilizable
  const handleGuardarEnBiblioteca = () => {
    const mapaActualizado: MapaRecinto = {
      imagenFondo,
      imagenFondoOpacidad,
      aforoGeneral: mapaActual.aforoGeneral,
      filas,
      mesas,
      palcos,
      zonasDePie,
    };
    const nuevaPlantilla: PlantillaMapa = {
      id: `MAP-${Date.now()}`,
      nombre: nombreMapa,
      fechaCreacion: new Date().toLocaleDateString('es-ES'),
      mapa: mapaActualizado,
    };
    const nuevaLista = [nuevaPlantilla, ...biblioteca.filter((b) => b.nombre !== nombreMapa)];
    setBiblioteca(nuevaLista);
    localStorage.setItem('biotickets_map_library', JSON.stringify(nuevaLista));
    notificar(`¡Plantilla "${nombreMapa}" guardada en la biblioteca para reutilizar!`);
  };

  // Cargar una plantilla de la biblioteca
  const handleCargarPlantilla = (p: PlantillaMapa) => {
    setNombreMapa(p.nombre);
    setImagenFondo(p.mapa.imagenFondo || '');
    setImagenFondoOpacidad(p.mapa.imagenFondoOpacidad ?? 0.65);
    setPalcos((p.mapa.palcos || []) as PalcoStudio[]);
    setMesas((p.mapa.mesas || []) as MesaStudio[]);
    setZonasDePie((p.mapa.zonasDePie || []) as ZonaStudio[]);
    setFilas(p.mapa.filas || []);
    notificar(`Plantilla "${p.nombre}" cargada en el editor.`);
  };

  // Guardar progreso final y asignar al evento
  const handleAsignarEvento = async () => {
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
      notificar('¡Progreso guardado y plano asignado con éxito al evento!');
      setTimeout(() => setGuardadoExito(false), 3000);
    } finally {
      setGuardando(false);
    }
  };

  const palcoActivo = palcos.find((p) => p.id === elementoSel?.id);
  const zonaActiva = zonasDePie.find((z) => z.id === elementoSel?.id);

  return (
    <div className="space-y-6">
      {/* Barra de Progreso por Pasos (Wizard) */}
      <div className="glass-panel p-4 rounded-3xl border border-white/10 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          {[
            { num: 1, label: '1. Lienzo & Fondo' },
            { num: 2, label: '2. Grilla & Dibujo' },
            { num: 3, label: '3. Fases & Precios' },
            { num: 4, label: '4. Biblioteca & Asignar' },
          ].map((paso) => (
            <button
              key={paso.num}
              onClick={() => setPasoActivo(paso.num as any)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                pasoActivo === paso.num
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{paso.label}</span>
            </button>
          ))}
        </div>

        {/* Acciones Rápidas de Guardado */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGuardarEnBiblioteca}
            className="px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
            title="Guardar como plantilla reutilizable"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Guardar en Biblioteca</span>
          </button>
          <button
            onClick={handleAsignarEvento}
            disabled={guardando}
            className="px-5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {guardadoExito ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>¡Asignado al Evento!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Asignar al Evento</span>
              </>
            )}
          </button>
        </div>
      </div>

      {mensajeNotif && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{mensajeNotif}</span>
        </div>
      )}

      {/* Grid Principal: Formulario por Pasos (Izquierda) + Lienzo Canvas (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PANEL IZQUIERDO: WIZARD DE CONFIGURACIÓN */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-4">
            {/* ===================== PASO 1: LIENZO EN BLANCO & FONDO ===================== */}
            {pasoActivo === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-indigo-400">
                  <ImageIcon className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white">Paso 1: Configurar Lienzo y Plano</h3>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Nombre del Plano (Para Biblioteca):
                  </label>
                  <input
                    type="text"
                    value={nombreMapa}
                    onChange={(e) => setNombreMapa(e.target.value)}
                    placeholder="Ej. Coliseo Mayor - Configuración 360"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold focus:border-indigo-500"
                  />
                </div>

                {/* Subida de Imagen */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">
                    Imagen del Plano (Desde Equipo o Drive):
                  </label>
                  <label className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/20">
                    <Upload className="w-4 h-4" />
                    <span>Subir Imagen desde mi PC</span>
                    <input type="file" accept="image/*" onChange={handleUploadImagenLocal} className="hidden" />
                  </label>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    O pegar URL / Enlace Público de Google Drive:
                  </label>
                  <input
                    type="url"
                    value={imagenFondo}
                    onChange={(e) => setImagenFondo(e.target.value)}
                    placeholder="https://ejemplo.com/plano-recinto.png"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-indigo-500"
                  />
                </div>

                {/* Control de Opacidad del Plano */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Opacidad del Plano Original:</span>
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

                <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-slate-300 space-y-1">
                  <span className="font-bold text-indigo-300 block">Medidas sugeridas para el plano:</span>
                  <p className="text-slate-400">
                    Resolución recomendada: <strong>1600 × 1000 px</strong> o <strong>1400 × 900 px</strong>. Permite zoom fluido sin deformarse en smartphones y portátiles.
                  </p>
                </div>

                <button
                  onClick={() => setPasoActivo(2)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Continuar a Grilla de Zonas y Dibujo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ===================== PASO 2: GRILLA DE ZONAS & DIBUJO ===================== */}
            {pasoActivo === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Grid className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white">Paso 2: Grilla de Zonas & Calco</h3>
                </div>

                {/* Acciones de Carga Masiva y Generación */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Carga Masiva (100 a 1.500+ Palcos/Mesas):
                  </label>
                  <label className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-white/10 hover:border-indigo-500/50 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Cargar Archivo CSV / TXT</span>
                    <input type="file" accept=".csv,.txt" onChange={handleImportarCSV} className="hidden" />
                  </label>
                </div>

                {/* Botones de Dibujo Directo */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Dibujar o Añadir Elementos:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setHerramienta('dibujar_palco')}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                        herramienta === 'dibujar_palco'
                          ? 'bg-amber-500/20 border-amber-400 text-white'
                          : 'bg-slate-900 border-white/10 text-slate-300 hover:border-amber-400/50'
                      }`}
                    >
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold">Dibujar Palco</span>
                      <span className="text-[10px] text-slate-400">Arrastra en lienzo</span>
                    </button>
                    <button
                      onClick={() => setHerramienta('dibujar_zona')}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                        herramienta === 'dibujar_zona'
                          ? 'bg-sky-500/20 border-sky-400 text-white'
                          : 'bg-slate-900 border-white/10 text-slate-300 hover:border-sky-400/50'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold">Dibujar Zona</span>
                      <span className="text-[10px] text-slate-400">Aforo de pie</span>
                    </button>
                  </div>
                </div>

                {/* Resumen de Conteo de Elementos */}
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 flex justify-between text-xs">
                  <span>Palcos: <strong className="text-amber-400">{palcos.length}</strong></span>
                  <span>Mesas: <strong className="text-indigo-400">{mesas.length}</strong></span>
                  <span>Zonas: <strong className="text-sky-400">{zonasDePie.length}</strong></span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPasoActivo(1)}
                    className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>
                  <button
                    onClick={() => setPasoActivo(3)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Configurar Tarifas y Fases</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ===================== PASO 3: TARIFARIO & FASES (PREVENTA, FULL, CORP, VIP) ===================== */}
            {pasoActivo === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Tag className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white">Paso 3: Tarifario & Fases de Venta</h3>
                </div>

                {elementoSel && palcoActivo ? (
                  <div className="space-y-3.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold flex justify-between items-center">
                      <span>Editando: {palcoActivo.nombre} #{palcoActivo.numero}</span>
                      <span className="text-[10px] text-slate-400">{palcoActivo.capacidad} Plazas</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          1. Preventa ({evento.moneda}):
                        </label>
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
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          2. Lanzamiento ({evento.moneda}):
                        </label>
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
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Etapa 1:
                        </label>
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
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Etapa 2:
                        </label>
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
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Full Precio:
                        </label>
                        <input
                          type="number"
                          value={palcoActivo.tarifas?.etapa3Full || palcoActivo.precioPalcoBase}
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
                      {palcoActivo.tarifas?.esCorporativo && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Precio Empresa Especial:</label>
                          <input
                            type="number"
                            value={palcoActivo.tarifas?.precioCorporativo || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setPalcos(
                                palcos.map((p) =>
                                  p.id === palcoActivo.id
                                    ? { ...p, tarifas: { ...p.tarifas!, precioCorporativo: val } }
                                    : p
                                )
                              );
                            }}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                          />
                        </div>
                      )}
                    </div>

                    {/* Código Descuento VIP */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Cupón / Código VIP:
                        </label>
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
                          placeholder="VIP2026"
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Descuento (%):
                        </label>
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
                  <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 text-center text-xs text-slate-400 space-y-2">
                    <MousePointer className="w-6 h-6 text-slate-600 mx-auto" />
                    <p>Haz clic en cualquier palco o zona en el lienzo de la derecha para ajustar sus 5 etapas de precio, ventas corporativas y códigos VIP.</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setPasoActivo(2)}
                    className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>
                  <button
                    onClick={() => setPasoActivo(4)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Guardar y Biblioteca</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ===================== PASO 4: BIBLIOTECA & ASIGNACIÓN ===================== */}
            {pasoActivo === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-indigo-400">
                  <FolderOpen className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white">Paso 4: Biblioteca de Plantillas</h3>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleGuardarEnBiblioteca}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>Guardar este Plano en la Biblioteca</span>
                  </button>
                </div>

                {/* Listado de Mapas Reutilizables */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Plantillas Guardadas ({biblioteca.length}):
                  </span>
                  {biblioteca.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No hay plantillas guardadas aún.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {biblioteca.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">{item.nombre}</span>
                            <span className="text-[10px] text-slate-400">{item.fechaCreacion}</span>
                          </div>
                          <button
                            onClick={() => handleCargarPlantilla(item)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition cursor-pointer"
                          >
                            Cargar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Asignación Definitiva */}
                <button
                  onClick={handleAsignarEvento}
                  disabled={guardando}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Publicar y Asignar a {evento.nombre}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PANEL DERECHO: LIENZO CANVAS VECTORIAL */}
        <div className="lg:col-span-8">
          <div className="glass-panel p-3 rounded-3xl border border-white/10 bg-slate-950 flex flex-col items-center overflow-hidden">
            {/* Barra de Controles de Lienzo */}
            <div className="w-full flex justify-between items-center px-2 pb-2 border-b border-white/5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-white font-bold">{nombreMapa}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHerramienta('seleccionar')}
                  className={`p-1.5 rounded-lg ${herramienta === 'seleccionar' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5'}`}
                  title="Cursor"
                >
                  <MousePointer className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setHerramienta('pan')}
                  className={`p-1.5 rounded-lg ${herramienta === 'pan' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5'}`}
                  title="Mover Plano"
                >
                  <Hand className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(0.3, Number((z - 0.15).toFixed(2))))}
                  className="p-1.5 hover:bg-white/5 rounded-lg"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] text-white">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.15).toFixed(2))))}
                  className="p-1.5 hover:bg-white/5 rounded-lg"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="p-1.5 hover:bg-white/5 rounded-lg"
                  title="Centrar"
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
              <span>Resolución Nativa: 1600×1000 px | Rueda del ratón: Zoom | Arrastra elementos para posicionar</span>
              <span className="font-mono text-slate-400">Total Palcos: {palcos.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
