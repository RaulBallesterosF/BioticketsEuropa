import React, { useState } from 'react';
import { Evento, Promotor } from '../types';
import {
  Calendar,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  FileBadge,
  Bell,
  Radio,
} from 'lucide-react';
import {
  notificarInicioEvento,
  notificarPuertasAbiertas,
} from '../services/notificationService';

interface EventManagerProps {
  eventos: Evento[];
  promotores: Promotor[];
  onCrearEvento: (e: Omit<Evento, 'id'>) => Promise<void>;
  onEliminarEvento: (id: number) => Promise<void>;
  onSeleccionarEvento: (e: Evento) => void;
  eventoSeleccionadoId?: number;
}

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
  const [lugar, setLugar] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fecha, setFecha] = useState('2026-06-20T21:00');
  const [horaApertura, setHoraApertura] = useState('19:00');
  const [descripcion, setDescripcion] = useState('');
  const [imagenBanner, setImagenBanner] = useState(
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80'
  );
  const [imagenTicket, setImagenTicket] = useState(
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80'
  );
  const [responsable, setResponsable] = useState('Director de Producción');
  const [promotorId, setPromotorId] = useState<number>(promotores[0]?.id || 1);
  const [codigoPulep, setCodigoPulep] = useState('ESP-MAD-2026-102');
  const [ivaPct, setIvaPct] = useState(10.0);
  const [pulepPct, setPulepPct] = useState(0.0);
  const [moneda, setMoneda] = useState<'EUR' | 'COP' | 'USD'>('EUR');
  const [tipoEvento, setTipoEvento] = useState<'CONCIERTO_UNICO' | 'FERIA_MULTIDIA'>('CONCIERTO_UNICO');
  const [diasFeria, setDiasFeria] = useState(3);
  const [fechasFeria, setFechasFeria] = useState<string[]>(['2026-06-20', '2026-06-21', '2026-06-22']);
  const [aforoMaximo, setAforoMaximo] = useState(5000);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Auto-ajustar impuestos y moneda al cambiar de país
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
      setIvaPct(10.0); // IVA Cultural España
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
        fechasFeria:
          tipoEvento === 'FERIA_MULTIDIA'
            ? fechasFeria
            : [fecha ? fecha.split('T')[0] : '2026-06-20'],
        aforoMaximo: Number(aforoMaximo),
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

      setMensaje('¡Evento registrado exitosamente con ficha legal PULEP!');
      setNombre('');
      setLugar('');
      setDireccion('');
      setTimeout(() => setMensaje(''), 4000);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            Módulo 2: Eventos & Cumplimiento Normativo
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">
            Gestión de Eventos, Licencias y Código PULEP
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configuración de eventos con normativa tributaria (IVA cultural en Europa y Ley 1493 Espectáculos Públicos en Colombia).
          </p>
        </div>
      </div>

      {mensaje && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{mensaje}</span>
        </div>
      )}

      {/* Formulario de Registro de Evento */}
      <div className="glass-panel rounded-3xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-rose-400" />
          Publicar Nuevo Evento o Espectáculo
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Nombre del Evento
              </label>
              <input
                type="text"
                required
                placeholder="Festival o Gira 2026"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                País y Régimen Fiscal
              </label>
              <select
                value={pais}
                onChange={(e) => handlePaisChange(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="España">España (IVA Cultural 10% — UE)</option>
                <option value="Colombia">Colombia (Ley 1493 PULEP 10% + IVA 19%)</option>
                <option value="México">México (IVA 16%)</option>
                <option value="Estados Unidos">Estados Unidos (Sales Tax)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Ciudad
              </label>
              <input
                type="text"
                required
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Recinto / Estadio / Arena
              </label>
              <input
                type="text"
                required
                placeholder="Estadio Metropolitano / Movistar Arena"
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Dirección Exacta
              </label>
              <input
                type="text"
                required
                placeholder="Av. de Luis Aragonés 4"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Fecha y Hora de Inicio
              </label>
              <input
                type="datetime-local"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Código PULEP / Licencia Oficial
              </label>
              <input
                type="text"
                placeholder="COL-PULEP-2026-9931"
                value={codigoPulep}
                onChange={(e) => setCodigoPulep(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs font-mono text-amber-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Promotor / Organización
              </label>
              <select
                value={promotorId}
                onChange={(e) => setPromotorId(Number(e.target.value))}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {promotores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombreEmpresa}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Divisa Base
              </label>
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value as any)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="EUR">Euros (EUR €)</option>
                <option value="COP">Pesos Colombianos (COP $)</option>
                <option value="USD">Dólares (USD $)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-purple-400 block mb-1 flex items-center gap-1">
                <span>Tipo de Formato</span>
              </label>
              <select
                value={tipoEvento}
                onChange={(e) => setTipoEvento(e.target.value as any)}
                className="w-full bg-slate-950/80 border border-purple-500/40 rounded-xl p-3 text-xs text-purple-200 focus:outline-none focus:border-purple-400 font-bold"
              >
                <option value="CONCIERTO_UNICO">🎤 Concierto Único (1 Solo Día)</option>
                <option value="FERIA_MULTIDIA">🎡 Feria Multidía (Varios Días con Aforo)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Aforo Máximo Total
              </label>
              <input
                type="number"
                min="10"
                max="200000"
                value={aforoMaximo}
                onChange={(e) => setAforoMaximo(Number(e.target.value))}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {tipoEvento === 'FERIA_MULTIDIA' && (
              <div className="md:col-span-3 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300">
                    🎡 Configuración de Días para Feria Multidía:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Total Días:</span>
                    <input
                      type="number"
                      min="2"
                      max="14"
                      value={diasFeria}
                      onChange={(e) => {
                        const cant = Math.max(2, Math.min(14, Number(e.target.value)));
                        setDiasFeria(cant);
                        setFechasFeria((prev) => {
                          const base = fecha ? fecha.split('T')[0] : '2026-06-20';
                          return Array.from({ length: cant }, (_, i) => {
                            if (prev[i]) return prev[i];
                            const d = new Date(base);
                            d.setDate(d.getDate() + i);
                            return d.toISOString().split('T')[0];
                          });
                        });
                      }}
                      className="w-16 bg-slate-900 border border-purple-500/40 rounded-lg p-1 text-xs text-center text-white font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {Array.from({ length: diasFeria }).map((_, idx) => (
                    <div key={idx} className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
                        Día {idx + 1}
                      </label>
                      <input
                        type="date"
                        value={fechasFeria[idx] || ''}
                        onChange={(e) => {
                          const nueva = [...fechasFeria];
                          nueva[idx] = e.target.value;
                          setFechasFeria(nueva);
                        }}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-1 text-[11px] text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="md:col-span-3">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                URL Banner Web HD
              </label>
              <input
                type="url"
                value={imagenBanner}
                onChange={(e) => setImagenBanner(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Crear y Publicar Evento</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Eventos Publicados */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Eventos Activos en Cartelera ({eventos.length}):
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventos.map((ev) => {
            const esActivo = ev.id === eventoSeleccionadoId;
            return (
              <div
                key={ev.id}
                className={`glass-panel rounded-3xl overflow-hidden border transition-all ${
                  esActivo ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-white/10'
                }`}
              >
                <div className="h-44 relative overflow-hidden">
                  <img
                    src={ev.imagenBanner}
                    alt={ev.nombre}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-slate-950/80 text-[10px] font-mono text-amber-300 font-bold border border-amber-500/30 backdrop-blur-md">
                      PULEP: {ev.codigoPulep}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/80 text-[10px] text-white font-bold backdrop-blur-md">
                      {ev.moneda}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md ${
                        ev.tipoEvento === 'FERIA_MULTIDIA'
                          ? 'bg-purple-600/90 text-purple-100 border border-purple-400/40'
                          : 'bg-emerald-600/90 text-emerald-100 border border-emerald-400/40'
                      }`}
                    >
                      {ev.tipoEvento === 'FERIA_MULTIDIA'
                        ? `🎡 Feria (${ev.diasFeria || 3} Días)`
                        : '🎤 Concierto Único'}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h4 className="text-lg font-black text-white">{ev.nombre}</h4>
                    <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {ev.lugar} — {ev.ciudad}, {ev.pais}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {new Date(ev.fecha).toLocaleString('es-ES', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>

                  {/* Botones de Alerta Push para Inicio de Evento */}
                  <div className="pt-2 border-t border-white/5 flex flex-wrap gap-2">
                    <button
                      onClick={() => notificarInicioEvento(ev.nombre, ev.fecha, ev.lugar, 30)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold flex items-center gap-1 transition"
                      title="Enviar Push a los asistentes: El evento inicia en 30 minutos"
                    >
                      <Radio className="w-3 h-3 text-indigo-400" />
                      <span>Push: Inicia en 30m</span>
                    </button>
                    <button
                      onClick={() => notificarPuertasAbiertas(ev.nombre, ev.lugar)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 transition"
                      title="Enviar Push: Puertas abiertas al recinto"
                    >
                      <Bell className="w-3 h-3 text-emerald-400" />
                      <span>Push: Puertas Abiertas</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <button
                      onClick={() => onSeleccionarEvento(ev)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                        esActivo
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {esActivo ? '✓ Evento Seleccionado' : 'Seleccionar para Venta / Mapa'}
                    </button>

                    <button
                      onClick={() => onEliminarEvento(ev.id)}
                      className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                      title="Eliminar evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
