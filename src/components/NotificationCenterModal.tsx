import React, { useState, useEffect } from 'react';
import {
  NotificacionItem,
  PreferenciasNotificacion,
  TipoNotificacion,
  Evento,
} from '../types';
import {
  obtenerNotificaciones,
  suscribirNotificaciones,
  obtenerPreferencias,
  guardarPreferencias,
  solicitarPermisoPush,
  marcarNotificacionComoLeida,
  marcarTodasComoLeidas,
  borrarTodasLasNotificaciones,
  notificarAsientoExpirando,
  notificarAsientoLiberado,
  notificarInicioEvento,
  notificarPuertasAbiertas,
  difundirAlertaPromotor,
  reproducirSonidoNotificacion,
} from '../services/notificationService';
import {
  Bell,
  BellRing,
  X,
  CheckCheck,
  Trash2,
  Clock,
  ShieldAlert,
  Sparkles,
  Volume2,
  VolumeX,
  Send,
  Calendar,
  Ticket,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

interface NotificationCenterModalProps {
  onCerrar: () => void;
  eventos: Evento[];
  eventoSeleccionado?: Evento | null;
  rolUsuario?: string;
  onVerEntradas?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  onCerrar,
  eventos,
  eventoSeleccionado,
  rolUsuario = 'FAN',
  onVerEntradas,
}) => {
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [filtro, setFiltro] = useState<'TODAS' | 'ASIENTOS' | 'EVENTOS'>('TODAS');
  const [preferencias, setPreferencias] = useState<PreferenciasNotificacion>(obtenerPreferencias());
  const [permisoNavegador, setPermisoNavegador] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );
  const [solicitandoPermiso, setSolicitandoPermiso] = useState(false);
  const [mostrarAjustes, setMostrarAjustes] = useState(false);

  // Formulario de Difusión para Promotores / Admin
  const [mensajeDifusion, setMensajeDifusion] = useState('');
  const [tituloDifusion, setTituloDifusion] = useState('Aviso Importante a Asistentes');
  const [eventoDifusionId, setEventoDifusionId] = useState<number>(
    eventoSeleccionado?.id || eventos[0]?.id || 1
  );
  const [tipoDifusion, setTipoDifusion] = useState<TipoNotificacion>('INICIO_EVENTO');
  const [difundiendo, setDifundiendo] = useState(false);
  const [mensajeExitoDifusion, setMensajeExitoDifusion] = useState('');

  useEffect(() => {
    setNotificaciones(obtenerNotificaciones());
    const unsubscribe = suscribirNotificaciones((items) => {
      setNotificaciones(items);
    });
    return () => unsubscribe();
  }, []);

  const handleActivarPush = async () => {
    setSolicitandoPermiso(true);
    try {
      const permiso = await solicitarPermisoPush();
      setPermisoNavegador(permiso);
      if (permiso === 'granted') {
        const updated = { ...preferencias, pushHabilitado: true };
        setPreferencias(updated);
        guardarPreferencias(updated);
        reproducirSonidoNotificacion();
      }
    } finally {
      setSolicitandoPermiso(false);
    }
  };

  const handleTogglePref = (clave: keyof PreferenciasNotificacion) => {
    const updated = { ...preferencias, [clave]: !preferencias[clave] };
    setPreferencias(updated);
    guardarPreferencias(updated);
  };

  const handleEnviarDifusion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensajeDifusion.trim()) return;
    setDifundiendo(true);

    const ev = eventos.find((x) => x.id === eventoDifusionId) || eventos[0];
    await difundirAlertaPromotor(
      ev.id,
      ev.nombre,
      tituloDifusion,
      mensajeDifusion,
      tipoDifusion
    );

    setDifundiendo(false);
    setMensajeDifusion('');
    setMensajeExitoDifusion('¡Notificación Push transmitida con éxito a los asistentes!');
    setTimeout(() => setMensajeExitoDifusion(''), 4000);
  };

  const notificacionesFiltradas = notificaciones.filter((n) => {
    if (filtro === 'ASIENTOS') {
      return (
        n.tipo === 'ASIENTO_RESERVADO' ||
        n.tipo === 'ASIENTO_EXPIRANDO' ||
        n.tipo === 'ASIENTO_LIBERADO' ||
        n.tipo === 'COMPRA_CONFIRMADA'
      );
    }
    if (filtro === 'EVENTOS') {
      return (
        n.tipo === 'INICIO_EVENTO' ||
        n.tipo === 'PUERTAS_ABIERTAS' ||
        n.tipo === 'CAMBIO_EVENTO'
      );
    }
    return true;
  });

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const renderIcono = (tipo: TipoNotificacion) => {
    switch (tipo) {
      case 'ASIENTO_RESERVADO':
        return <Ticket className="w-4 h-4 text-indigo-400" />;
      case 'ASIENTO_EXPIRANDO':
        return <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />;
      case 'ASIENTO_LIBERADO':
        return <Clock className="w-4 h-4 text-rose-400" />;
      case 'COMPRA_CONFIRMADA':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'INICIO_EVENTO':
        return <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />;
      case 'PUERTAS_ABIERTAS':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Cabecera del Centro de Notificaciones */}
        <div className="p-5 md:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Notificaciones Web Push</h3>
                {noLeidas > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-extrabold">
                    {noLeidas} nuevas
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Avisos en tiempo real sobre asientos reservados y tus eventos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarAjustes(!mostrarAjustes)}
              className={`p-2 rounded-xl border transition ${
                mostrarAjustes
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-white/5 text-slate-300 hover:text-white border-white/10'
              }`}
              title="Ajustes de Notificación"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={onCerrar}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Banner de Estado de Permiso Push del Navegador */}
        <div className="p-4 bg-slate-950/60 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                permisoNavegador === 'granted'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : permisoNavegador === 'denied'
                  ? 'bg-rose-500'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-slate-300">
              Estado Push Navegador:{' '}
              <strong className="text-white">
                {permisoNavegador === 'granted'
                  ? 'Activado (Notificaciones del Sistema Habilitadas)'
                  : permisoNavegador === 'denied'
                  ? 'Bloqueado en Navegador'
                  : 'Pendiente de Autorización'}
              </strong>
            </span>
          </div>

          {permisoNavegador !== 'granted' ? (
            <button
              onClick={handleActivarPush}
              disabled={solicitandoPermiso}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition flex items-center gap-1.5 shrink-0"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{solicitandoPermiso ? 'Solicitando...' : 'Activar Alertas Push'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Push Activo
              </span>
            </div>
          )}
        </div>

        {/* Panel Desplegable de Ajustes y Preferencias */}
        {mostrarAjustes && (
          <div className="p-4 bg-slate-950 border-b border-white/10 space-y-3 animate-fadeIn">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Canales y Preferencias de Alertas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                <span className="text-slate-300">Alertas de Asientos y Candado Temporal</span>
                <input
                  type="checkbox"
                  checked={preferencias.alertasAsientos}
                  onChange={() => handleTogglePref('alertasAsientos')}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                <span className="text-slate-300">Alertas de Inicio de Evento</span>
                <input
                  type="checkbox"
                  checked={preferencias.alertasInicioEvento}
                  onChange={() => handleTogglePref('alertasInicioEvento')}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                <span className="text-slate-300">Aviso de Puertas Abiertas</span>
                <input
                  type="checkbox"
                  checked={preferencias.alertasPuertasAbiertas}
                  onChange={() => handleTogglePref('alertasPuertasAbiertas')}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                <span className="text-slate-300 flex items-center gap-1.5">
                  {preferencias.sonidoHabilitado ? (
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  Sonido Web Audio Sintético
                </span>
                <input
                  type="checkbox"
                  checked={preferencias.sonidoHabilitado}
                  onChange={() => handleTogglePref('sonidoHabilitado')}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Sección de Simulación Interactiva en Vivo */}
        <div className="p-4 bg-indigo-950/20 border-b border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Probar Eventos Push en Vivo:
            </span>
            <span className="text-[10px] text-slate-400">Simulación inmediata</span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => {
                const evNombre = eventoSeleccionado?.nombre || 'EuroTickets Tour 2026';
                notificarAsientoExpirando(evNombre, ['VIP-A1', 'VIP-A2'], 120);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold transition flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Asiento Expirando (2m)</span>
            </button>

            <button
              onClick={() => {
                const evNombre = eventoSeleccionado?.nombre || 'EuroTickets Tour 2026';
                notificarAsientoLiberado(evNombre, ['VIP-A1']);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold transition flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Asiento Liberado</span>
            </button>

            <button
              onClick={() => {
                const evNombre = eventoSeleccionado?.nombre || 'EuroTickets Tour 2026';
                notificarInicioEvento(
                  evNombre,
                  new Date(Date.now() + 1800000).toISOString(),
                  'WiZink Center',
                  30
                );
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold transition flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Evento Inicia en 30m</span>
            </button>

            <button
              onClick={() => {
                const evNombre = eventoSeleccionado?.nombre || 'EuroTickets Tour 2026';
                notificarPuertasAbiertas(evNombre, 'Acceso Norte - Puerta 4');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Puertas Abiertas</span>
            </button>
          </div>
        </div>

        {/* Módulo de Difusión para Organizadores (Super Admin o Promotor) */}
        {(rolUsuario === 'SUPER_ADMIN' || rolUsuario === 'PROMOTOR') && (
          <div className="p-4 bg-slate-950/70 border-b border-white/5 space-y-2">
            <details className="group">
              <summary className="text-xs font-bold text-slate-300 hover:text-white cursor-pointer flex items-center justify-between list-none">
                <span className="flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-indigo-400" />
                  Emitir Notificación Push Masiva a Asistentes
                </span>
                <span className="text-[10px] text-indigo-400 group-open:rotate-180 transition">▼</span>
              </summary>

              <form onSubmit={handleEnviarDifusion} className="mt-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Evento Asociado
                    </label>
                    <select
                      value={eventoDifusionId}
                      onChange={(e) => setEventoDifusionId(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-xs text-white"
                    >
                      {eventos.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.nombre} ({ev.ciudad})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Categoría del Aviso
                    </label>
                    <select
                      value={tipoDifusion}
                      onChange={(e) => setTipoDifusion(e.target.value as TipoNotificacion)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-xs text-white"
                    >
                      <option value="INICIO_EVENTO">Inicio Inminente de Evento</option>
                      <option value="PUERTAS_ABIERTAS">Apertura de Puertas / Accesos</option>
                      <option value="CAMBIO_EVENTO">Actualización de Horario o Artista</option>
                      <option value="SISTEMA">Aviso General de Seguridad</option>
                    </select>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={tituloDifusion}
                    onChange={(e) => setTituloDifusion(e.target.value)}
                    placeholder="Título del anuncio Push"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-xs text-white mb-2"
                    required
                  />
                  <textarea
                    value={mensajeDifusion}
                    onChange={(e) => setMensajeDifusion(e.target.value)}
                    placeholder="Escribe el mensaje que recibirán los asistentes en su teléfono y pantalla..."
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white h-16 resize-none focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  {mensajeExitoDifusion && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {mensajeExitoDifusion}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={difundiendo}
                    className="ml-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{difundiendo ? 'Enviando Push...' : 'Difundir Alerta'}</span>
                  </button>
                </div>
              </form>
            </details>
          </div>
        )}

        {/* Barra de Filtros y Acciones de Limpieza */}
        <div className="p-3 bg-slate-950/40 border-b border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFiltro('TODAS')}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                filtro === 'TODAS'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas ({notificaciones.length})
            </button>
            <button
              onClick={() => setFiltro('ASIENTOS')}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                filtro === 'ASIENTOS'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Asientos Reservados
            </button>
            <button
              onClick={() => setFiltro('EVENTOS')}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                filtro === 'EVENTOS'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Inicio de Eventos
            </button>
          </div>

          <div className="flex items-center gap-2">
            {noLeidas > 0 && (
              <button
                onClick={marcarTodasComoLeidas}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Marcar leídas</span>
              </button>
            )}
            {notificaciones.length > 0 && (
              <button
                onClick={borrarTodasLasNotificaciones}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition p-1"
                title="Limpiar bandeja"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Listado de Notificaciones */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notificacionesFiltradas.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-400 font-medium">
                No hay notificaciones en este filtro
              </p>
              <p className="text-xs text-slate-500">
                Usa los botones de arriba para simular alertas de asientos o inicio de eventos.
              </p>
            </div>
          ) : (
            notificacionesFiltradas.map((n) => (
              <div
                key={n.id}
                onClick={() => marcarNotificacionComoLeida(n.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                  n.leida
                    ? 'bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/10'
                    : 'bg-indigo-950/20 border-indigo-500/30 text-white hover:border-indigo-500/50 shadow-md'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    n.leida ? 'bg-white/5' : 'bg-indigo-600/20 border border-indigo-400/30'
                  }`}
                >
                  {renderIcono(n.tipo)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-xs font-bold truncate ${
                        n.leida ? 'text-slate-300' : 'text-white font-extrabold'
                      }`}
                    >
                      {n.titulo}
                    </h4>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {new Date(n.fecha).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{n.mensaje}</p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                    {n.asientos && n.asientos.length > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                        Butacas: {n.asientos.join(', ')}
                      </span>
                    )}

                    {n.eventoNombre && (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {n.eventoNombre}
                      </span>
                    )}

                    {!n.leida && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
