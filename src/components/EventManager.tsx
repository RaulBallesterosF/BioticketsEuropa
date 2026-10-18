import React, { useState, useEffect } from 'react';
import { Evento, Promotor, MapaRecinto } from '../types';
import {
  Calendar,
  Plus,
  Trash2,
  MapPin,
  Clock,
  CheckCircle2,
  Bookmark,
  Eye,
  Layers,
  Crown,
  Coffee,
  Upload,
  Sparkles,
  X,
  Check,
  FileText,
  Image as ImageIcon,
  HelpCircle,
} from 'lucide-react';

interface EventManagerProps {
  eventos: Evento[];
  promotores: Promotor[];
  onCrearEvento: (e: Omit<Evento, 'id'>) => Promise<void>;
  onEliminarEvento: (id: number) => Promise<void>;
  onSeleccionarEvento: (e: Evento) => void;
  eventoSeleccionadoId?: number;
}

export interface PlantillaRecintoMaestro {
  id: string;
  nombre: string;
  recinto: string;
  ciudad: string;
  comentarios: string;
  aforoTotal: number;
  totalPalcos: number;
  totalMesas: number;
  totalZonas: number;
  fechaCreacion: string;
  mapa: MapaRecinto;
}

const PLANTILLAS_INICIALES: PlantillaRecintoMaestro[] = [
  {
    id: 'PLANTILLA-ARENA-360',
    nombre: 'Arena Multieventos 360° - Formato Concierto',
    recinto: 'Estadio Metropolitano / Movistar Arena',
    ciudad: 'Madrid / Bogotá',
    comentarios: 'Diseño arquitectónico con 2 zonas de pie en pista central, 20 palcos VIP perimetrales numerados y platea en herradura.',
    aforoTotal: 5500,
    totalPalcos: 20,
    totalMesas: 10,
    totalZonas: 2,
    fechaCreacion: '2026-01-15',
    mapa: {
      imagenFondo: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80',
      imagenFondoOpacidad: 0.65,
      aforoGeneral: { total: 1000, vendidas: 0, precioBase: 45.0, nombre: 'Pista General' },
      zonasDePie: [
        { id: 'z-front', nombre: 'Front Stage Diamante', color: '#06b6d4', precioBase: 55.0, aforoMaximo: 600, vendidas: 0, x: 250, y: 120, ancho: 1100, alto: 160 },
        { id: 'z-general', nombre: 'Pista General de Pie', color: '#38bdf8', precioBase: 40.0, aforoMaximo: 1800, vendidas: 0, x: 250, y: 310, ancho: 1100, alto: 180 },
      ],
      filas: [],
      mesas: [],
      palcos: [
        { id: 'P-1', nombre: 'Palco Real', capacidad: 10, precioPalcoBase: 1200.0, modoVenta: 'COMPLETO', x: 260, y: 530, ancho: 140, alto: 90 },
        { id: 'P-2', nombre: 'Palco Real', capacidad: 10, precioPalcoBase: 1200.0, modoVenta: 'COMPLETO', x: 430, y: 530, ancho: 140, alto: 90 },
        { id: 'P-3', nombre: 'Palco Real', capacidad: 10, precioPalcoBase: 1200.0, modoVenta: 'COMPLETO', x: 600, y: 530, ancho: 140, alto: 90 },
        { id: 'P-4', nombre: 'Palco Real', capacidad: 10, precioPalcoBase: 1200.0, modoVenta: 'COMPLETO', x: 770, y: 530, ancho: 140, alto: 90 },
      ],
    },
  },
  {
    id: 'PLANTILLA-CLUB-VIP',
    nombre: 'Club Nocturno & Discoteca Lounge - 45 Palcos',
    recinto: 'Teatro Central / Club Discoteca',
    ciudad: 'Medellín / Barcelona',
    comentarios: 'Distribución íntima con 45 palcos numerados sobre plataforma elevada y mesas redondas VIP frente a cabina de sonido.',
    aforoTotal: 850,
    totalPalcos: 45,
    totalMesas: 15,
    totalZonas: 1,
    fechaCreacion: '2026-02-01',
    mapa: {
      imagenFondo: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=1600&q=80',
      imagenFondoOpacidad: 0.7,
      aforoGeneral: { total: 200, vendidas: 0, precioBase: 30.0, nombre: 'Acceso General' },
      zonasDePie: [
        { id: 'z-lounge', nombre: 'Pista Central Baile', color: '#a855f7', precioBase: 35.0, aforoMaximo: 250, vendidas: 0, x: 300, y: 150, ancho: 1000, alto: 180 },
      ],
      filas: [],
      mesas: [],
      palcos: [
        { id: 'P-1', nombre: 'Palco Oro', capacidad: 8, precioPalcoBase: 800.0, modoVenta: 'COMPLETO', x: 300, y: 370, ancho: 130, alto: 80 },
        { id: 'P-2', nombre: 'Palco Oro', capacidad: 8, precioPalcoBase: 800.0, modoVenta: 'COMPLETO', x: 450, y: 370, ancho: 130, alto: 80 },
      ],
    },
  },
];

export const EventManager: React.FC<EventManagerProps> = ({
  eventos,
  promotores,
  onCrearEvento,
  onEliminarEvento,
  onSeleccionarEvento,
  eventoSeleccionadoId,
}) => {
  const [nombre, setNombre] = useState('');
  const [pais, setPais] = useState<'España' | 'Colombia' | 'México' | 'Estados Unidos'>('España');
  const [ciudad, setCiudad] = useState('Madrid');
  const [lugar, setLugar] = useState('Estadio Metropolitano');
  const [direccion, setDireccion] = useState('Av. Luis Aragonés 4');
  const [fecha, setFecha] = useState('2026-07-18T21:00');
  const [horaApertura, setHoraApertura] = useState('19:00');
  const [descripcion, setDescripcion] = useState('');
  const [imagenBanner, setImagenBanner] = useState(
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80'
  );
  const [imagenTicket, setImagenTicket] = useState(
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80'
  );
  const [responsable, setResponsable] = useState('Carlos Mendoza');
  const [promotorId, setPromotorId] = useState<number>(promotores[0]?.id || 1);
  const [codigoPulep, setCodigoPulep] = useState('ESP-MAD-2026-105');
  const [ivaPct, setIvaPct] = useState(10.0);
  const [pulepPct, setPulepPct] = useState(0.0);
  const [moneda, setMoneda] = useState<'EUR' | 'COP' | 'USD'>('EUR');
  const [tipoEvento, setTipoEvento] = useState<'CONCIERTO_UNICO' | 'FERIA_MULTIDIA'>('CONCIERTO_UNICO');
  const [diasFeria, setDiasFeria] = useState(3);
  const [aforoMaximo, setAforoMaximo] = useState(5000);

  // BIBLIOTECA DE MAPAS MAESTROS
  const [plantillas, setPlantillas] = useState<PlantillaRecintoMaestro[]>(() => {
    try {
      const guardadas = localStorage.getItem('biotickets_master_map_library');
      if (guardadas) return JSON.parse(guardadas);
    } catch {}
    return PLANTILLAS_INICIALES;
  });

  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaRecintoMaestro | null>(
    PLANTILLAS_INICIALES[0]
  );
  const [nuevaImagenFondoEvento, setNuevaImagenFondoEvento] = useState<string>('');
  const [multiplicadorPrecios, setMultiplicadorPrecios] = useState<number>(1.0);

  // Modal de Previsualización
  const [modalPreviewAbierto, setModalPreviewAbierto] = useState(false);
  const [plantillaEnPreview, setPlantillaEnPreview] = useState<PlantillaRecintoMaestro | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const handlePaisChange = (nuevoPais: any) => {
    setPais(nuevoPais);
    if (nuevoPais === 'Colombia') {
      setCiudad('Bogotá');
      setMoneda('COP');
      setIvaPct(19.0);
      setPulepPct(10.0);
      setCodigoPulep('COL-PULEP-2026-');
    } else if (nuevoPais === 'España') {
      setCiudad('Madrid');
      setMoneda('EUR');
      setIvaPct(10.0);
      setPulepPct(0.0);
      setCodigoPulep('ESP-MAD-2026-');
    } else {
      setCiudad('Ciudad');
      setMoneda('USD');
      setIvaPct(8.0);
      setPulepPct(0.0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');

    try {
      await onCrearEvento({
        nombre,
        pais,
        ciudad,
        lugar,
        direccion,
        fecha,
        horaApertura,
        tipoEvento,
        diasFeria: tipoEvento === 'FERIA_MULTIDIA' ? Number(diasFeria) : 1,
        aforoMaximo: plantillaSeleccionada?.aforoTotal || Number(aforoMaximo),
        descripcion: descripcion || `${nombre} en ${lugar}, ${ciudad}. Producción autorizada.`,
        imagenBanner,
        imagenTicket,
        responsable,
        promotorId: Number(promotorId),
        codigoPulep: codigoPulep || 'N/A',
        ivaPct: Number(ivaPct),
        pulepPct: Number(pulepPct),
        moneda,
        estado: 'ACTIVO',
      });

      // Clonar y persistir mapa vinculado para este evento
      if (plantillaSeleccionada) {
        const factor = Number(multiplicadorPrecios) || 1.0;
        const mapaClonado: MapaRecinto = {
          imagenFondo: nuevaImagenFondoEvento || plantillaSeleccionada.mapa.imagenFondo,
          imagenFondoOpacidad: plantillaSeleccionada.mapa.imagenFondoOpacidad ?? 0.65,
          aforoGeneral: {
            ...plantillaSeleccionada.mapa.aforoGeneral,
            precioBase: Number((plantillaSeleccionada.mapa.aforoGeneral.precioBase * factor).toFixed(2)),
          },
          zonasDePie: (plantillaSeleccionada.mapa.zonasDePie || []).map((z) => ({
            ...z,
            precioBase: Number((z.precioBase * factor).toFixed(2)),
          })),
          mesas: (plantillaSeleccionada.mapa.mesas || []).map((m) => ({
            ...m,
            precioSillaBase: Number((m.precioSillaBase * factor).toFixed(2)),
          })),
          palcos: (plantillaSeleccionada.mapa.palcos || []).map((p) => ({
            ...p,
            precioPalcoBase: Number((p.precioPalcoBase * factor).toFixed(2)),
            precioSillaIndividual: p.precioSillaIndividual
              ? Number((p.precioSillaIndividual * factor).toFixed(2))
              : undefined,
          })),
          filas: (plantillaSeleccionada.mapa.filas || []).map((f) => ({
            ...f,
            precioBase: Number((f.precioBase * factor).toFixed(2)),
          })),
        };
        const nuevoIdEstimado = eventos.length ? Math.max(...eventos.map((ev) => ev.id)) + 1 : 1;
        localStorage.setItem(`biotickets_map_${nuevoIdEstimado}`, JSON.stringify(mapaClonado));
      }

      setMensaje('¡Evento publicado y mapa de recinto vinculado exitosamente!');
      setNombre('');
      setTimeout(() => setMensaje(''), 4000);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            Módulo 2: Eventos & Fichas de Recinto
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">
            Gestión de Eventos y Vinculación de Mapas de Asientos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configuración de eventos y vinculación directa de mapas creados para reutilizar entre diferentes fechas.
          </p>
        </div>
      </div>

      {mensaje && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{mensaje}</span>
        </div>
      )}

      {/* FORMULARIO DE EVENTO */}
      <div className="glass-panel rounded-3xl p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nombre del Evento</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Festival o Gira 2026"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">País y Régimen Fiscal</label>
              <select
                value={pais}
                onChange={(e) => handlePaisChange(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="España">España (IVA Cultural 10% — UE)</option>
                <option value="Colombia">Colombia (Ley PULEP 10% + IVA 19%)</option>
                <option value="México">México</option>
                <option value="Estados Unidos">Estados Unidos</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Ciudad</label>
              <input
                type="text"
                required
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Recinto / Estadio / Arena</label>
              <input
                type="text"
                required
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Fecha y Hora de Inicio</label>
              <input
                type="datetime-local"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Promotor / Organización</label>
              <select
                value={promotorId}
                onChange={(e) => setPromotorId(parseInt(e.target.value))}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {promotores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombreEmpresa} ({p.nitNif})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CASILLA VISIBLE: MAPAS DISPONIBLES EN LA BIBLIOTECA      */}
          {/* ======================================================== */}
          <div className="p-5 rounded-3xl bg-slate-950/90 border border-indigo-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Casilla de Mapas Disponibles en la Biblioteca
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Selecciona un mapa para enlazar a este evento. Puedes cambiar la imagen de fondo manteniendo los palcos y zonas, y ajustar los precios.
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                {plantillas.length} Mapas Listos
              </span>
            </div>

            {/* Listado de Mapas Disponibles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plantillas.map((plan) => {
                const esActivo = plantillaSeleccionada?.id === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setPlantillaSeleccionada(plan)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 relative overflow-hidden ${
                      esActivo
                        ? 'bg-indigo-950/50 border-indigo-400 shadow-xl shadow-indigo-500/20'
                        : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold block">
                          {plan.recinto} — {plan.ciudad}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{plan.nombre}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlantillaEnPreview(plan);
                          setModalPreviewAbierto(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Ver previsualización gráfica"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>Vista Previa</span>
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 text-[11px] text-slate-300 italic">
                      "{plan.comentarios}"
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-center text-xs pt-1">
                      <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                        <span className="text-[9px] uppercase text-slate-400 font-bold block">Aforo</span>
                        <span className="font-bold text-white font-mono">{plan.aforoTotal}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                        <span className="text-[9px] uppercase text-amber-400 font-bold block">Palcos</span>
                        <span className="font-bold text-amber-300 font-mono">{plan.totalPalcos}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                        <span className="text-[9px] uppercase text-indigo-400 font-bold block">Mesas</span>
                        <span className="font-bold text-indigo-300 font-mono">{plan.totalMesas}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                        <span className="text-[9px] uppercase text-sky-400 font-bold block">Zonas</span>
                        <span className="font-bold text-sky-300 font-mono">{plan.totalZonas}</span>
                      </div>
                    </div>

                    {esActivo && (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold pt-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mapa Seleccionado y Vinculado a este Evento</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Ajustes Específicos para este Evento */}
            {plantillaSeleccionada && (
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-3 pt-3">
                <span className="text-xs font-bold text-indigo-300 block">
                  Ajustes para este Evento (Manteniendo las zonas y palcos):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Cambiar Imagen de Fondo (Conserva todos los palcos en su lugar):
                    </label>
                    <input
                      type="url"
                      value={nuevaImagenFondoEvento}
                      onChange={(e) => setNuevaImagenFondoEvento(e.target.value)}
                      placeholder="https://ejemplo.com/nuevo-plano-patrocinado.jpg"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Ajuste Rápido de Precios en Todas las Localidades:
                    </label>
                    <select
                      value={multiplicadorPrecios}
                      onChange={(e) => setMultiplicadorPrecios(parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-bold text-xs"
                    >
                      <option value={1.0}>Mantener Precios Originales del Mapa</option>
                      <option value={1.1}>Aumentar un +10% en todas las localidades</option>
                      <option value={1.2}>Aumentar un +20% en todas las localidades</option>
                      <option value={0.85}>Reducir un -15% (Evento Promocional)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={guardando}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Crear y Publicar Evento</span>
            </button>
          </div>
        </form>
      </div>

      {/* MODAL DE PREVISUALIZACIÓN DE PLANO */}
      {modalPreviewAbierto && plantillaEnPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-3xl w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{plantillaEnPreview.nombre}</h3>
                <span className="text-xs text-slate-400">
                  {plantillaEnPreview.recinto} — {plantillaEnPreview.ciudad} (Aforo: {plantillaEnPreview.aforoTotal} pax)
                </span>
              </div>
              <button
                onClick={() => setModalPreviewAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center">
                <img
                  src={plantillaEnPreview.mapa.imagenFondo}
                  alt={plantillaEnPreview.nombre}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">
                    Plano Arquitectónico Digitalizado
                  </span>
                  <p className="text-xs text-slate-200 max-w-md">
                    {plantillaEnPreview.comentarios}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Palcos VIP</span>
                  <span className="text-lg font-black text-amber-400">{plantillaEnPreview.totalPalcos}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Mesas</span>
                  <span className="text-lg font-black text-indigo-400">{plantillaEnPreview.totalMesas}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Zonas de Admisión</span>
                  <span className="text-lg font-black text-sky-400">{plantillaEnPreview.totalZonas}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setModalPreviewAbierto(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setPlantillaSeleccionada(plantillaEnPreview);
                  setModalPreviewAbierto(false);
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Usar este Mapa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVENTOS ACTIVOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {eventos.map((ev) => (
          <div
            key={ev.id}
            onClick={() => onSeleccionarEvento(ev)}
            className={`p-5 rounded-3xl border transition cursor-pointer flex justify-between items-center ${
              eventoSeleccionadoId === ev.id
                ? 'bg-indigo-950/40 border-indigo-400 shadow-xl shadow-indigo-500/20'
                : 'glass-panel border-white/5 hover:border-white/20'
            }`}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                PULEP: {ev.codigoPulep}
              </span>
              <h4 className="text-base font-bold text-white mt-1">{ev.nombre}</h4>
              <p className="text-xs text-slate-400">
                {ev.lugar} — {ev.ciudad}, {ev.pais}
              </p>
              <p className="text-xs text-indigo-300 font-mono font-bold">
                {new Date(ev.fecha).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('¿Seguro que deseas eliminar este evento?')) {
                  onEliminarEvento(ev.id);
                }
              }}
              className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition cursor-pointer"
              title="Eliminar evento"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
