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
} from 'lucide-react';

interface SeatMapStudioProps {
  evento: Evento;
  mapaActual: MapaRecinto;
  onGuardar: (mapa: Partial<MapaRecinto>) => Promise<void>;
  onActualizarEvento?: (cambios: Partial<Evento>) => Promise<void>;
  onCambiarTab?: (tab: string) => void;
}

// Extensión para Palco con número y color personalizado
export interface PalcoStudio extends PalcoVIP {
  numero?: string;
  color?: string;
}

export interface MesaStudio extends MesaEspecial {
  numero?: string;
  color?: string;
}

export const SeatMapStudio: React.FC<SeatMapStudioProps> = ({
  evento,
  mapaActual,
  onGuardar,
  onActualizarEvento,
  onCambiarTab,
}) => {
  // Estados del recinto
  const [imagenFondo, setImagenFondo] = useState(mapaActual.imagenFondo || '');
  const [imagenFondoOpacidad, setImagenFondoOpacidad] = useState(
    mapaActual.imagenFondoOpacidad !== undefined ? mapaActual.imagenFondoOpacidad : 0.65
  );
  const [filas, setFilas] = useState<FilaAsientos[]>(mapaActual.filas || []);
  const [mesas, setMesas] = useState<MesaStudio[]>((mapaActual.mesas || []) as MesaStudio[]);
  const [palcos, setPalcos] = useState<PalcoStudio[]>((mapaActual.palcos || []) as PalcoStudio[]);
  const [zonasDePie, setZonasDePie] = useState<ZonaDePie[]>(mapaActual.zonasDePie || []);

  // Navegación Canvas: Zoom y Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [herramienta, setHerramienta] = useState<'seleccionar' | 'pan' | 'dibujar_palco' | 'dibujar_zona'>('seleccionar');

  // Selección activa e interfaz
  const [tabSidebar, setTabSidebar] = useState<'csv' | 'palcos' | 'mesas' | 'zonas' | 'fondo'>('csv');
  const [elementoSel, setElementoSel] = useState<{ tipo: 'palco' | 'mesa' | 'zona' | 'fila'; id: string } | null>(null);

  // Estados de carga y feedback
  const [guardando, setGuardando] = useState(false);
  const [guardadoExito, setGuardadoExito] = useState(false);
  const [mensajeCsv, setMensajeCsv] = useState<string | null>(null);

  // Referencias para dibujo
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgFondoRef = useRef<HTMLImageElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const drawingBoxRef = useRef<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  // Precarga de imagen del plano
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

  // Transformar coordenadas de pantalla al espacio de dibujo virtual
  const toVirtualCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  // Renderizador principal del Canvas
  const renderizar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Fondo oscuro de trabajo
    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, w, h);

    // Aplicar Pan y Zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Dibujar Imagen del Plano de Fondo (si existe)
    if (imgFondoRef.current) {
      ctx.save();
      ctx.globalAlpha = imagenFondoOpacidad;
      ctx.drawImage(imgFondoRef.current, 0, 0, 1400, 950);
      ctx.restore();
    } else {
      // Cuadrícula arquitectónica si no hay imagen
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1 / zoom;
      for (let x = 0; x < 1400; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 950);
        ctx.stroke();
      }
      for (let y = 0; y < 950; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1400, y);
        ctx.stroke();
      }
    }

    // 2. Dibujar Zonas de Pie
    zonasDePie.forEach((z) => {
      const esSel = elementoSel?.tipo === 'zona' && elementoSel.id === z.id;
      ctx.save();
      ctx.fillStyle = `${z.color || '#38bdf8'}33`;
      ctx.strokeStyle = esSel ? '#ffffff' : z.color || '#38bdf8';
      ctx.lineWidth = esSel ? 3 : 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.roundRect(z.x, z.y, z.ancho, z.alto, 8);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = z.color || '#38bdf8';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${z.nombre} (${z.aforoMaximo} pax) - ${z.precioBase} ${evento.moneda}`, z.x + z.ancho / 2, z.y + z.alto / 2 + 4);
      ctx.restore();
    });

    // 3. Dibujar Palcos VIP (Semitransparentes con color distintivo de categoría)
    palcos.forEach((p) => {
      const px = p.x || 100;
      const py = p.y || 100;
      const pw = p.ancho || 160;
      const ph = p.alto || 90;
      const colorPalco = p.color || '#eab308';
      const esSel = elementoSel?.tipo === 'palco' && elementoSel.id === p.id;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 8);
      // Fondo transparente que deja ver el plano original debajo
      ctx.fillStyle = esSel ? `${colorPalco}66` : `${colorPalco}26`;
      ctx.strokeStyle = esSel ? '#ffffff' : colorPalco;
      ctx.lineWidth = esSel ? 3 : 1.8;
      ctx.fill();
      ctx.stroke();

      // Cabecera del Palco con Identificador
      ctx.fillStyle = colorPalco;
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const rotulo = p.numero ? `${p.nombre} #${p.numero}` : p.nombre;
      ctx.fillText(rotulo, px + pw / 2, py + 18);

      // Información de capacidad y precio
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      const precioTxt = p.modoVenta === 'COMPLETO' ? `${p.precioPalcoBase} ${evento.moneda}` : `${p.precioSillaIndividual || p.precioPalcoBase / p.capacidad} ${evento.moneda}/s`;
      ctx.fillText(`${p.capacidad} Plazas | ${precioTxt}`, px + pw / 2, py + ph - 12);
      ctx.restore();
    });

    // 4. Dibujar Mesas
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

  // Subida de imagen local desde el ordenador
  const handleUploadImagenLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Parser Masivo de Archivos CSV / TXT para Palcos, Mesas y Zonas
  const handleImportarCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const texto = event.target?.result as string;
      if (!texto) return;

      const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      let importadosPalcos: PalcoStudio[] = [];
      let importadosMesas: MesaStudio[] = [];
      let importadasZonas: ZonaDePie[] = [];

      // Omitir cabecera si existe
      const inicio = lineas[0].toLowerCase().includes('tipo') ? 1 : 0;

      // Variables para auto-distribución en matriz rectangular (cuadrícula ordenada sobre el plano)
      const startX = 60;
      const startY = 120;
      const itemWidth = 140;
      const itemHeight = 80;
      const gap = 16;
      const columnas = 8;

      let idx = 0;
      for (let i = inicio; i < lineas.length; i++) {
        const cols = lineas[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length < 3) continue;

        // Formato: Tipo, Numero, Nombre, Capacidad, PrecioBase, Color, Modalidad, X, Y
        const tipo = cols[0].toUpperCase();
        const numero = cols[1] || `${idx + 1}`;
        const nombre = cols[2] || `Palco #${numero}`;
        const capacidad = parseInt(cols[3]) || 8;
        const precioBase = parseFloat(cols[4]) || 500.0;
        const color = cols[5] || '#eab308';
        const modalidad = (cols[6] || 'COMPLETO') as ModoVentaPalco;

        // Si el archivo no provee X o Y, se calculan automáticamente en cuadrícula
        const xPos = cols[7] ? parseInt(cols[7]) : startX + (idx % columnas) * (itemWidth + gap);
        const yPos = cols[8] ? parseInt(cols[8]) : startY + Math.floor(idx / columnas) * (itemHeight + gap);

        if (tipo === 'PALCO') {
          importadosPalcos.push({
            id: `P-${numero}-${Date.now().toString().slice(-4)}`,
            numero,
            nombre,
            capacidad,
            sillasAdicionales: 0,
            precioPalcoBase: precioBase,
            modoVenta: modalidad,
            precioSillaIndividual: Number((precioBase / capacidad).toFixed(2)),
            color,
            x: xPos,
            y: yPos,
            ancho: itemWidth,
            alto: itemHeight,
          });
          idx++;
        } else if (tipo === 'MESA') {
          importadosMesas.push({
            id: `M-${numero}-${Date.now().toString().slice(-4)}`,
            numero,
            nombre,
            forma: 'REDONDA',
            sillas: capacidad,
            precioSillaBase: precioBase,
            color,
            x: xPos,
            y: yPos,
            tamano: 22,
          });
          idx++;
        } else if (tipo === 'ZONA') {
          importadasZonas.push({
            id: `Z-${numero}-${Date.now().toString().slice(-4)}`,
            nombre,
            color,
            precioBase,
            aforoMaximo: capacidad,
            vendidas: 0,
            x: xPos,
            y: yPos,
            ancho: 300,
            alto: 100,
          });
          idx++;
        }
      }

      setPalcos((prev) => [...prev, ...importadosPalcos]);
      setMesas((prev) => [...prev, ...importadosMesas]);
      setZonasDePie((prev) => [...prev, ...importadasZonas]);
      setMensajeCsv(`¡Importados con éxito: ${importadosPalcos.length} palcos, ${importadosMesas.length} mesas y ${importadasZonas.length} zonas!`);
      setTimeout(() => setMensajeCsv(null), 5000);
    };
    reader.readAsText(file);
  };

  // Descarga de Plantilla CSV
  const handleDescargarPlantillaCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Tipo,Numero,Nombre,Capacidad,PrecioBase,Color,Modalidad\n' +
      'PALCO,1,Palco Diamante,8,800.00,#eab308,COMPLETO\n' +
      'PALCO,2,Palco Diamante,8,800.00,#eab308,COMPLETO\n' +
      'PALCO,3,Palco Oro,6,500.00,#6366f1,INDIVIDUAL\n' +
      'PALCO,4,Palco Oro,6,500.00,#6366f1,INDIVIDUAL\n' +
      'MESA,1,Mesa VIP,4,60.00,#10b981,REDONDA\n' +
      'ZONA,1,Pista Front Stage,350,45.00,#38bdf8,GENERAL\n';
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'plantilla_recinto_biotickets.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Eventos de ratón en Canvas
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

    // Comprobar colisión con Palcos
    for (const p of [...palcos].reverse()) {
      const px = p.x || 0;
      const py = p.y || 0;
      const pw = p.ancho || 160;
      const ph = p.alto || 90;
      if (x >= px && x <= px + pw && y >= py && y <= py + ph) {
        setElementoSel({ tipo: 'palco', id: p.id });
        isDraggingRef.current = true;
        dragOffsetRef.current = { x: x - px, y: y - py };
        return;
      }
    }

    // Comprobar colisión con Mesas
    for (const m of [...mesas].reverse()) {
      const mx = m.x || 0;
      const my = m.y || 0;
      const rad = m.tamano || 22;
      const dx = x - mx;
      const dy = y - my;
      if (dx * dx + dy * dy <= rad * rad) {
        setElementoSel({ tipo: 'mesa', id: m.id });
        isDraggingRef.current = true;
        dragOffsetRef.current = { x: dx, y: dy };
        return;
      }
    }

    // Comprobar colisión con Zonas de Pie
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
      } else if (elementoSel.tipo === 'mesa') {
        setMesas((prev) =>
          prev.map((m) =>
            m.id === elementoSel.id
              ? { ...m, x: Math.round(x - dragOffsetRef.current.x), y: Math.round(y - dragOffsetRef.current.y) }
              : m
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
          };
          setPalcos((prev) => [...prev, nuevoPalco]);
          setElementoSel({ tipo: 'palco', id: nuevoPalco.id });
        } else if (herramienta === 'dibujar_zona') {
          const nuevaZona: ZonaDePie = {
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

  const handleGuardarTodo = async () => {
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
      setTimeout(() => setGuardadoExito(false), 3000);
    } finally {
      setGuardando(false);
    }
  };

  const palcoActivo = palcos.find((p) => p.id === elementoSel?.id);
  const mesaActiva = mesas.find((m) => m.id === elementoSel?.id);
  const zonaActiva = zonasDePie.find((z) => z.id === elementoSel?.id);

  return (
    <div className="space-y-6">
      {/* Barra de Control Superior */}
      <div className="glass-panel p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              SeatMap Architecture Studio
            </span>
            <span className="text-xs text-slate-400">Recinto: {evento.lugar}</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Calco de Plano, Palcos y Carga Masiva</h2>
        </div>

        {/* Controles de Zoom, Modo y Guardado */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-slate-900 border border-white/10 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setHerramienta('seleccionar')}
              className={`p-2 rounded-xl text-xs font-bold transition ${
                herramienta === 'seleccionar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Seleccionar y Mover"
            >
              <MousePointer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setHerramienta('pan')}
              className={`p-2 rounded-xl text-xs font-bold transition ${
                herramienta === 'pan' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Mover Plano (Pan)"
            >
              <Hand className="w-4 h-4" />
            </button>
            <button
              onClick={() => setHerramienta('dibujar_palco')}
              className={`p-2 rounded-xl text-xs font-bold transition ${
                herramienta === 'dibujar_palco' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Dibujar Palco con Cursor"
            >
              <Crown className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center bg-slate-900 border border-white/10 rounded-2xl p-1 gap-1">
            <button onClick={() => setZoom((z) => Math.max(0.3, Number((z - 0.15).toFixed(2))))} className="p-2 text-slate-400 hover:text-white">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-white px-1">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.15).toFixed(2))))} className="p-2 text-slate-400 hover:text-white">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-2 text-slate-400 hover:text-white"
              title="Reset Vista"
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
                <span>¡Mapa Guardado!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Plano</span>
              </>
            )}
          </button>
        </div>
      </div>

      {mensajeCsv && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{mensajeCsv}</span>
        </div>
      )}

      {/* Grid Principal: Dashboard Lateral + Lienzo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel Lateral: Importador y Ajustes */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel rounded-3xl p-4 border border-white/10 space-y-4">
            {/* Navegación por Pestañas */}
            <div className="flex flex-wrap gap-1 pb-3 border-b border-white/10">
              <button
                onClick={() => setTabSidebar('csv')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                  tabSidebar === 'csv' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Carga CSV</span>
              </button>
              <button
                onClick={() => setTabSidebar('palcos')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                  tabSidebar === 'palcos' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Palcos</span>
              </button>
              <button
                onClick={() => setTabSidebar('fondo')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                  tabSidebar === 'fondo' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Imagen de Fondo"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* TAB 1: CARGA MASIVA CSV / TXT */}
            {tabSidebar === 'csv' && (
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-slate-300">
                  Importa de 100 a 1.500+ palcos, mesas o zonas de forma instantánea. Se auto-ubicarán en cuadrícula sobre el plano.
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Subir Archivo (.csv o .txt):
                  </label>
                  <label className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/25">
                    <Upload className="w-4 h-4" />
                    <span>Seleccionar Archivo CSV</span>
                    <input type="file" accept=".csv,.txt" onChange={handleImportarCSV} className="hidden" />
                  </label>
                </div>

                <button
                  onClick={handleDescargarPlantillaCSV}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Descargar Plantilla CSV Ejemplo</span>
                </button>
              </div>
            )}

            {/* TAB 2: GESTIÓN DE PALCOS */}
            {tabSidebar === 'palcos' && (
              <div className="space-y-4">
                <button
                  onClick={() => {
                    const num = `${palcos.length + 1}`;
                    const nuevo: PalcoStudio = {
                      id: `P-${num}-${Date.now().toString().slice(-4)}`,
                      numero: num,
                      nombre: 'Palco Diamante',
                      capacidad: 8,
                      sillasAdicionales: 0,
                      precioPalcoBase: 800.0,
                      modoVenta: 'COMPLETO',
                      color: '#eab308',
                      x: 100 + (palcos.length % 5) * 160,
                      y: 120 + Math.floor(palcos.length / 5) * 100,
                      ancho: 140,
                      alto: 80,
                    };
                    setPalcos((prev) => [...prev, nuevo]);
                    setElementoSel({ tipo: 'palco', id: nuevo.id });
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Palco Individual</span>
                </button>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {palcos.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setElementoSel({ tipo: 'palco', id: p.id })}
                      className={`p-2.5 rounded-xl border flex justify-between items-center text-xs cursor-pointer transition ${
                        elementoSel?.id === p.id ? 'bg-amber-950/60 border-amber-400 text-white' : 'bg-slate-900/60 border-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color || '#eab308' }}></span>
                        <span className="font-bold">{p.nombre} #{p.numero}</span>
                      </div>
                      <span className="font-mono text-emerald-400">{p.precioPalcoBase} {evento.moneda}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: IMAGEN DEL PLANO */}
            {tabSidebar === 'fondo' && (
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Imagen del Recinto Arquitectónico:
                </span>
                <label className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Cargar Imagen desde PC</span>
                  <input type="file" accept="image/*" onChange={handleUploadImagenLocal} className="hidden" />
                </label>

                <input
                  type="url"
                  placeholder="O escribe la URL del plano..."
                  value={imagenFondo}
                  onChange={(e) => setImagenFondo(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />

                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Opacidad del Plano:</span>
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
            )}
          </div>

          {/* INSPECTOR DINÁMICO */}
          {elementoSel && palcoActivo && (
            <div className="glass-panel rounded-3xl p-4 border border-amber-500/30 space-y-3 bg-slate-950/80 animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4" /> Editar Palco #{palcoActivo.numero}
                </span>
                <button
                  onClick={() => {
                    setPalcos(palcos.filter((p) => p.id !== palcoActivo.id));
                    setElementoSel(null);
                  }}
                  className="text-rose-400 hover:bg-rose-500/10 p-1 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Categoría / Nombre:</label>
                  <input
                    type="text"
                    value={palcoActivo.nombre}
                    onChange={(e) =>
                      setPalcos(palcos.map((p) => (p.id === palcoActivo.id ? { ...p, nombre: e.target.value } : p)))
                    }
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Número de Palco:</label>
                  <input
                    type="text"
                    value={palcoActivo.numero || ''}
                    onChange={(e) =>
                      setPalcos(palcos.map((p) => (p.id === palcoActivo.id ? { ...p, numero: e.target.value } : p)))
                    }
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Capacidad (Plazas):</label>
                  <input
                    type="number"
                    value={palcoActivo.capacidad}
                    onChange={(e) =>
                      setPalcos(palcos.map((p) => (p.id === palcoActivo.id ? { ...p, capacidad: parseInt(e.target.value) || 1 } : p)))
                    }
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Precio ({evento.moneda}):</label>
                  <input
                    type="number"
                    value={palcoActivo.precioPalcoBase}
                    onChange={(e) =>
                      setPalcos(palcos.map((p) => (p.id === palcoActivo.id ? { ...p, precioPalcoBase: parseFloat(e.target.value) || 0 } : p)))
                    }
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Color Identificador en el Plano:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={palcoActivo.color || '#eab308'}
                    onChange={(e) =>
                      setPalcos(palcos.map((p) => (p.id === palcoActivo.id ? { ...p, color: e.target.value } : p)))
                    }
                    className="w-10 h-8 rounded-xl bg-slate-900 border border-white/10 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{palcoActivo.color || '#eab308'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Lienzo Canvas */}
        <div className="lg:col-span-8">
          <div className="glass-panel p-3 rounded-3xl border border-white/10 bg-slate-950 flex flex-col items-center overflow-hidden">
            <canvas
              ref={canvasRef}
              width={1400}
              height={950}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              className={`rounded-2xl max-w-full h-auto border border-white/5 select-none ${
                herramienta === 'pan' ? 'cursor-grab active:cursor-grabbing' : herramienta === 'dibujar_palco' ? 'cursor-crosshair' : 'cursor-default'
              }`}
            />
            <div className="w-full flex justify-between items-center text-[11px] text-slate-500 pt-3 px-2">
              <span>Rueda: Zoom | Herramienta Mano: Desplazar plano | Haz clic en un palco para editarlo</span>
              <span className="font-mono text-slate-400">Total Palcos: {palcos.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
