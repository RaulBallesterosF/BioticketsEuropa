import React, { useState, useEffect, useRef } from 'react';
import {
  Usuario,
  Promotor,
  Evento,
  MapaRecinto,
  AsientoItem,
  Ticket,
  ReporteLiquidacion,
  ReportePyG,
  ValidacionResultado,
} from './types';
import {
  login,
  logout,
  obtenerUsuarioActual,
  obtenerEmpresarios,
  crearEmpresario,
  obtenerEventos,
  crearEvento,
  eliminarEvento,
  obtenerMapaAsientos,
  guardarConfiguracionMapa,
  bloquearAsientos,
  liberarAsientos,
  comprarTickets,
  obtenerMisTickets,
  validarTicketEnPuerta,
  obtenerReporteLiquidacion,
  obtenerReportePyG,
} from './services/ticketService';
import { Navbar } from './components/Navbar';
import { SeatMapCanvas } from './components/SeatMapCanvas';
import { SeatMapStudio } from './components/SeatMapStudio';
import { CheckoutModal } from './components/CheckoutModal';
import { GateScanner } from './components/GateScanner';
import { FinancialSettlement } from './components/FinancialSettlement';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PromotersManager } from './components/PromotersManager';
import { EventManager } from './components/EventManager';
import { TicketPassModal } from './components/TicketPassModal';
import { VirtualQueueModal } from './components/VirtualQueueModal';
import { GoDaddyDeployment } from './components/GoDaddyDeployment';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { SmartSeatSuggester } from './components/SmartSeatSuggester';
import { SuperAdminLoginModal } from './components/SuperAdminLoginModal';
import {
  inicializarServiceWorker,
  suscribirNotificaciones,
  obtenerNotificaciones,
  notificarAsientoReservado,
  notificarAsientoExpirando,
  notificarAsientoLiberado,
  notificarCompraConfirmada,
  solicitarPermisoPush,
} from './services/notificationService';
import {
  Sparkles,
  Clock,
  ShoppingCart,
  ShieldAlert,
  ArrowRight,
  Ticket as TicketIcon,
  CheckCircle2,
  AlertCircle,
  Users,
  Compass,
  Bell,
} from 'lucide-react';

export default function App() {
  // Estado de Autenticación
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [emailLogin, setEmailLogin] = useState('admin@eurotickets.com');
  const [passwordLogin, setPasswordLogin] = useState('123456');

  // Estado de Navegación
  const [activeTab, setActiveTab] = useState<string>('b2c');

  // Estado de Datos Globales
  const [promotores, setPromotores] = useState<Promotor[]>([]);
  const [promotorActivo, setPromotorActivo] = useState<Promotor | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [mapaActual, setMapaActual] = useState<MapaRecinto | null>(null);
  const [idsVendidos, setIdsVendidos] = useState<string[]>([]);
  const [idsBloqueados, setIdsBloqueados] = useState<string[]>([]);
  const [diaFeriaActivo, setDiaFeriaActivo] = useState<number>(1);

  // Carrito de Selección Multi-Asiento & SeatLock 10 Minutos
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<AsientoItem[]>([]);
  const [tiempoRestante, setTiempoRestante] = useState<number>(0);
  const [cantidadAutoSelect, setCantidadAutoSelect] = useState<number>(2);
  const timerRef = useRef<any>(null);

  // Modales
  const [checkoutAbierto, setCheckoutAbierto] = useState(false);
  const [ticketModal, setTicketModal] = useState<Ticket | null>(null);
  const [ticketsComprados, setTicketsComprados] = useState<Ticket[]>([]);
  const [reporteLiquidacion, setReporteLiquidacion] = useState<ReporteLiquidacion | null>(null);
  const [reportePyG, setReportePyG] = useState<ReportePyG | null>(null);
  const [mostrarFilaVirtual, setMostrarFilaVirtual] = useState(false);
  const [modalNotificacionesAbierto, setModalNotificacionesAbierto] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [permisoNotif, setPermisoNotif] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const avisoExpiracionEmitido = useRef<boolean>(false);

  // Notificaciones flotantes
  const [notificacion, setNotificacion] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(
    null
  );

  const mostrarMensaje = (texto: string, tipo: 'exito' | 'error' = 'exito') => {
    setNotificacion({ texto, tipo });
    setTimeout(() => setNotificacion(null), 4000);
  };

  // Carga Inicial
  useEffect(() => {
    const userGuardado = obtenerUsuarioActual();
    if (userGuardado) {
      setUsuario(userGuardado);
    }
    inicializarDatos();

    // Inicializar Service Worker y sincronizar notificaciones
    inicializarServiceWorker();
    const items = obtenerNotificaciones();
    setUnreadNotifCount(items.filter((n) => !n.leida).length);

    const unsubscribe = suscribirNotificaciones((actualizadas) => {
      setUnreadNotifCount(actualizadas.filter((n) => !n.leida).length);
    });

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermisoNotif(Notification.permission);
    }

    return () => unsubscribe();
  }, []);

  const inicializarDatos = async () => {
    try {
      const [proms, evs, tks] = await Promise.all([
        obtenerEmpresarios(),
        obtenerEventos(),
        obtenerMisTickets(),
      ]);

      setPromotores(proms);
      if (proms.length > 0 && !promotorActivo) {
        setPromotorActivo(proms[0]);
      }

      setEventos(evs);
      if (evs.length > 0 && !eventoSeleccionado) {
        setEventoSeleccionado(evs[0]);
        cargarMapa(evs[0].id);
        cargarReporte(evs[0].id);
      }

      setTicketsComprados(tks);
    } catch (err) {
      console.error('Error inicializando datos:', err);
    }
  };

  const cargarMapa = async (eventoId: number) => {
    try {
      const data = await obtenerMapaAsientos(eventoId);
      setMapaActual(data.mapa);
      setIdsVendidos(data.idsVendidos);
      setIdsBloqueados(data.idsBloqueados);
    } catch (err) {
      console.error('Error cargando mapa:', err);
    }
  };

  const cargarReporte = async (eventoId: number) => {
    try {
      const [rep, pyg] = await Promise.all([
        obtenerReporteLiquidacion(eventoId),
        obtenerReportePyG(eventoId),
      ]);
      setReporteLiquidacion(rep);
      setReportePyG(pyg);
    } catch (err) {
      console.error('Error cargando liquidación y PyG:', err);
    }
  };

  // Temporizador de Bloqueo Temporal de 10 minutos (SeatLock)
  useEffect(() => {
    if (tiempoRestante > 0) {
      // Alerta Push cuando restan 2 minutos (120 segundos)
      if (
        tiempoRestante === 120 &&
        !avisoExpiracionEmitido.current &&
        eventoSeleccionado &&
        asientosSeleccionados.length > 0
      ) {
        avisoExpiracionEmitido.current = true;
        notificarAsientoExpirando(
          eventoSeleccionado.nombre,
          asientosSeleccionados.map((a) => a.numero),
          120
        );
      }

      timerRef.current = setInterval(() => {
        setTiempoRestante((prev) => prev - 1);
      }, 1000);
    } else if (tiempoRestante === 0 && asientosSeleccionados.length > 0) {
      // Liberar asientos por expiración en el backend y emitir Push API
      liberarAsientos(asientosSeleccionados.map((a) => a.id));
      notificarAsientoLiberado(
        eventoSeleccionado?.nombre || 'Evento',
        asientosSeleccionados.map((a) => a.numero)
      );
      setAsientosSeleccionados([]);
      avisoExpiracionEmitido.current = false;
      mostrarMensaje('⏱️ El tiempo de reserva de 10 minutos ha expirado. Asientos liberados.', 'error');
      if (eventoSeleccionado) {
        cargarMapa(eventoSeleccionado.id);
      }
    }
    return () => clearInterval(timerRef.current);
  }, [tiempoRestante, asientosSeleccionados, eventoSeleccionado]);

  // Selección y deselección de asientos en tiempo real
  const handleToggleAsiento = async (asiento: AsientoItem) => {
    const yaSeleccionado = asientosSeleccionados.some((a) => a.id === asiento.id);

    if (yaSeleccionado) {
      const nuevos = asientosSeleccionados.filter((a) => a.id !== asiento.id);
      await liberarAsientos([asiento.id]);
      setAsientosSeleccionados(nuevos);
      if (nuevos.length === 0) setTiempoRestante(0);
      if (eventoSeleccionado) cargarMapa(eventoSeleccionado.id);
    } else {
      if (asientosSeleccionados.length >= 8) {
        mostrarMensaje('Máximo 8 asientos permitidos por compra para evitar reventa.', 'error');
        return;
      }
      try {
        await bloquearAsientos([asiento.id], usuario ? `user-${usuario.id}` : 'guest-b2c');
        const nuevos = [...asientosSeleccionados, asiento];
        setAsientosSeleccionados(nuevos);
        if (tiempoRestante === 0) {
          setTiempoRestante(600); // 10 minutos
          avisoExpiracionEmitido.current = false;
          if (eventoSeleccionado) {
            notificarAsientoReservado(eventoSeleccionado.nombre, [asiento.numero], 600);
          }
        }
        if (eventoSeleccionado) cargarMapa(eventoSeleccionado.id);
      } catch (err: any) {
        mostrarMensaje(err?.message || 'El asiento no está disponible', 'error');
      }
    }
  };

  // Asistente de Selección Automática ("Buscar las mejores N entradas juntas")
  const handleAutoSeleccionar = async () => {
    if (!mapaActual || !mapaActual.filas || !eventoSeleccionado) return;
    const candidatos: AsientoItem[] = [];

    for (const fila of mapaActual.filas) {
      for (let i = 0; i < fila.asientos; i++) {
        const id = `${fila.id}-${i + 1}`;
        if (!idsVendidos.includes(id) && !idsBloqueados.includes(id)) {
          candidatos.push({
            id,
            numero: `${fila.nombre} - Butaca ${i + 1}`,
            tipo: 'FILA',
            precioBase: fila.precioBase,
            filaNombre: fila.nombre,
          });
          if (candidatos.length === Number(cantidadAutoSelect)) break;
        }
      }
      if (candidatos.length === Number(cantidadAutoSelect)) break;
    }

    if (candidatos.length > 0) {
      try {
        await bloquearAsientos(
          candidatos.map((c) => c.id),
          usuario ? `user-${usuario.id}` : 'guest-b2c'
        );
        setAsientosSeleccionados(candidatos);
        setTiempoRestante(600);
        avisoExpiracionEmitido.current = false;
        notificarAsientoReservado(
          eventoSeleccionado.nombre,
          candidatos.map((c) => c.numero),
          600
        );
        mostrarMensaje(
          `¡${candidatos.length} mejores entradas seleccionadas y reservadas por 10 minutos!`
        );
        cargarMapa(eventoSeleccionado.id);
      } catch (err: any) {
        mostrarMensaje('No se pudieron reservar los asientos automáticos', 'error');
      }
    } else {
      mostrarMensaje('No hay suficientes asientos contiguos disponibles', 'error');
    }
  };

  // Procesamiento de Compra Stripe
  const handleProcesarCompraStripe = async (datos: {
    email: string;
    telefono: string;
    stripePaymentToken: string;
  }) => {
    if (!eventoSeleccionado) return;

    const res = await comprarTickets({
      eventoId: eventoSeleccionado.id,
      asientos: asientosSeleccionados.map((a) => ({
        id: a.id,
        numero: a.numero,
        precioBase: a.precioBase,
      })),
      compradorEmail: datos.email,
      telefono: datos.telefono,
      stripePaymentToken: datos.stripePaymentToken,
    });

    if (res.ok) {
      setAsientosSeleccionados([]);
      setTiempoRestante(0);
      setCheckoutAbierto(false);
      cargarMapa(eventoSeleccionado.id);
      cargarReporte(eventoSeleccionado.id);

      const tks = await obtenerMisTickets();
      setTicketsComprados(tks);

      if (res.tickets.length > 0) {
        setTicketModal(res.tickets[0]);
      }

      notificarCompraConfirmada(
        eventoSeleccionado.nombre,
        res.tickets.map((t) => t.asientoNumero),
        res.tickets.reduce((acc, t) => acc + (t.desgloseFinanciero?.precioTotal || 0), 0),
        eventoSeleccionado.moneda
      );
      avisoExpiracionEmitido.current = false;

      mostrarMensaje('¡Pago procesado con éxito por Stripe! Boletos digitales generados.');
      setActiveTab('tickets');
    }
  };

  // Manejo de Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ email: emailLogin });
      setUsuario(res.usuario);
      mostrarMensaje(`Bienvenido, ${res.usuario.nombre}`);
    } catch {
      mostrarMensaje('Credenciales inválidas', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    setUsuario(null);
    mostrarMensaje('Sesión cerrada');
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Subtotal del carrito
  const subtotalBase = asientosSeleccionados.reduce((acc, a) => acc + (a.precioBase || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(2,6,23,0))] text-slate-100 flex flex-col items-center p-3 sm:p-6 md:p-8 font-sans pb-28">
      {/* Notificación Flotante */}
      {notificacion && (
        <div
          className={`fixed top-4 z-50 px-5 py-3 rounded-2xl text-xs font-bold border backdrop-blur-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-200 ${
            notificacion.tipo === 'exito'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-300'
          }`}
        >
          {notificacion.tipo === 'exito' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{notificacion.texto}</span>
        </div>
      )}

      {/* Navbar Superior */}
      {promotorActivo && (
        <div className="w-full max-w-6xl">
          <Navbar
            usuario={usuario}
            onLogout={handleLogout}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            promotores={promotores}
            promotorActivo={promotorActivo}
            setPromotorActivo={(p) => {
              setPromotorActivo(p);
              // Filtrar o seleccionar evento del promotor
              const evPromotor = eventos.find((e) => e.promotorId === p.id);
              if (evPromotor) {
                setEventoSeleccionado(evPromotor);
                cargarMapa(evPromotor.id);
                cargarReporte(evPromotor.id);
              }
            }}
            ticketsCount={ticketsComprados.length}
            onCambiarRol={(nuevoRol) => {
              if (usuario) {
                const act: Usuario = { ...usuario, rol: nuevoRol };
                setUsuario(act);
                localStorage.setItem('eurotickets_user', JSON.stringify(act));
                mostrarMensaje(`Rol cambiado a: ${nuevoRol}`);
              }
            }}
            unreadNotifCount={unreadNotifCount}
            onAbrirNotificaciones={() => setModalNotificacionesAbierto(true)}
          />

          {/* Banner de Activación de Notificaciones Push API */}
          {permisoNotif === 'default' && (
            <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    Activar Notificaciones Web Push del Sistema
                    <span className="px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px]">Nuevo</span>
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Recibe avisos inmediatos cuando tus asientos reservados estén por expirar y cuando se abran las puertas de tus eventos.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={async () => {
                    const res = await solicitarPermisoPush();
                    setPermisoNotif(res);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Permitir Notificaciones</span>
                </button>
                <button
                  onClick={() => setPermisoNotif('denied')}
                  className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Más tarde
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Login Screen si no ha iniciado sesión */}
      {!usuario ? (
        <div className="w-full max-w-md my-auto glass-panel rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-3xl bg-indigo-600/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 mx-auto">
              <TicketIcon className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-white">EuroTickets Pro</h2>
            <p className="text-xs text-slate-400">
              Plataforma SaaS Marca Blanca de Boletería Enterprise
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={passwordLogin}
                onChange={(e) => setPasswordLogin(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition cursor-pointer"
            >
              Iniciar Sesión en la Plataforma
            </button>
          </form>

          {/* Accesos Rápidos Demo */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block text-center">
              Perfiles de Prueba Rápidos:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setEmailLogin('admin@eurotickets.com')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold border border-white/5 text-left"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => setEmailLogin('promotor@livenation.es')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-300 font-bold border border-white/5 text-left"
              >
                Promotor España
              </button>
              <button
                type="button"
                onClick={() => setEmailLogin('validador@puerta.com')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-300 font-bold border border-white/5 text-left"
              >
                Staff de Puerta
              </button>
              <button
                type="button"
                onClick={() => setEmailLogin('fan@eurotickets.com')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 font-bold border border-white/5 text-left"
              >
                Fan Comprador
              </button>
            </div>
          </div>
        </div>
      ) : (
        <main className="w-full max-w-6xl space-y-6">
          {/* TAB 1: PORTAL FAN B2C */}
          {activeTab === 'b2c' && eventoSeleccionado && mapaActual && promotorActivo && (
            <div className="space-y-6">
              {/* Banner Hero del Evento con Liquid Glass VisionOS */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl h-72 md:h-84 flex items-end p-6 md:p-8">
                <img
                  src={eventoSeleccionado.imagenBanner}
                  alt={eventoSeleccionado.nombre}
                  className="absolute inset-0 w-full h-full object-cover scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>

                <div className="relative z-10 space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full backdrop-blur-md">
                      PULEP / Licencia: {eventoSeleccionado.codigoPulep}
                    </span>
                    <span className="text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full backdrop-blur-md">
                      Moneda: {eventoSeleccionado.moneda}
                    </span>
                    <button
                      onClick={() => setMostrarFilaVirtual(true)}
                      className="text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full border border-white/20 backdrop-blur-md transition flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" /> Simular Fila Virtual Sold-Out
                    </button>
                  </div>

                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                    {eventoSeleccionado.nombre}
                  </h2>
                  <p className="text-xs md:text-sm text-slate-300">
                    📍 {eventoSeleccionado.lugar} — {eventoSeleccionado.ciudad}, {eventoSeleccionado.pais} ({eventoSeleccionado.direccion})
                  </p>
                  <p className="text-xs text-indigo-300 font-bold">
                    📅 {new Date(eventoSeleccionado.fecha).toLocaleString('es-ES', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>

              {/* Catálogo Rápido de Eventos Disponibles para el Fan */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 block">
                  🎪 Catálogo de Conciertos y Ferias Disponibles (Selecciona uno para ver su mapa):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {eventos.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => {
                        setEventoSeleccionado(ev);
                        cargarMapa(ev.id);
                        cargarReporte(ev.id);
                        mostrarMensaje(`Mostrando mapa interactivo de: ${ev.nombre}`);
                      }}
                      className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                        eventoSeleccionado.id === ev.id
                          ? 'bg-indigo-600/25 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <img
                        src={ev.imagenBanner}
                        alt={ev.nombre}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div className="overflow-hidden">
                        <span className="font-bold text-xs text-white block truncate">{ev.nombre}</span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {ev.ciudad} • {ev.tipoEvento === 'FERIA_MULTIDIA' ? 'Feria Multidía' : 'Concierto'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Asistente Inteligente de Compra (Smart Seat Suggester) */}
              <SmartSeatSuggester
                evento={eventoSeleccionado}
                mapa={mapaActual}
                idsVendidos={idsVendidos}
                idsBloqueados={idsBloqueados}
                diaFeria={diaFeriaActivo}
                onAplicarSugerencia={async (asientos) => {
                  try {
                    await bloquearAsientos(
                      asientos.map((a) => a.id),
                      usuario ? `user-${usuario.id}` : 'guest-b2c'
                    );
                    setAsientosSeleccionados(asientos);
                    setTiempoRestante(600);
                    avisoExpiracionEmitido.current = false;
                    notificarAsientoReservado(
                      eventoSeleccionado.nombre,
                      asientos.map((c) => c.numero),
                      600
                    );
                    cargarMapa(eventoSeleccionado.id);
                    mostrarMensaje(
                      `¡${asientos.length} mejores entradas seleccionadas y reservadas por 10 minutos!`
                    );
                  } catch (err: any) {
                    mostrarMensaje(
                      err?.message || 'No se pudieron reservar los asientos sugeridos',
                      'error'
                    );
                  }
                }}
              />

                <div className="glass-panel p-5 rounded-3xl flex items-center justify-between border-amber-500/20">
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Temporizador Anti-Doble Venta (SeatLock)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Reserva atómica exclusiva en servidor por 10 minutos
                    </p>
                  </div>
                  <span
                    className={`text-2xl font-black font-mono ${
                      tiempoRestante > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-600'
                    }`}
                  >
                    {formatTimer(tiempoRestante)}
                  </span>
                </div>

              {/* Mapa de Asientos Interactivo en Canvas */}
              <div className="glass-panel rounded-3xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-indigo-400" />
                    Plano del Recinto y Mapa de Asientos
                  </h3>
                  <span className="text-xs text-slate-400">
                    Haz clic en una butaca para agregarla al carrito
                  </span>
                </div>

                <SeatMapCanvas
                  mapa={mapaActual}
                  evento={eventoSeleccionado}
                  asientosSeleccionados={asientosSeleccionados}
                  idsVendidos={idsVendidos}
                  idsBloqueados={idsBloqueados}
                  onToggleAsiento={handleToggleAsiento}
                  diaFeriaSeleccionado={diaFeriaActivo}
                  onCambiarDiaFeria={(dia) => setDiaFeriaActivo(dia)}
                />
              </div>

              {/* Barra Flotante de Carrito & Checkout */}
              {asientosSeleccionados.length > 0 && (
                <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:w-[680px] md:left-1/2 md:-translate-x-1/2 z-40 p-4 rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.7)] flex flex-col sm:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        {asientosSeleccionados.length} entradas reservadas
                      </span>
                      <span className="text-xs text-amber-400 font-mono font-bold">
                        ⏱️ {formatTimer(tiempoRestante)}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-white block mt-0.5">
                      Subtotal: {subtotalBase.toFixed(2)} {eventoSeleccionado.moneda}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={async () => {
                        await liberarAsientos(asientosSeleccionados.map((a) => a.id));
                        setAsientosSeleccionados([]);
                        setTiempoRestante(0);
                        cargarMapa(eventoSeleccionado.id);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
                    >
                      Vaciar
                    </button>
                    <button
                      onClick={() => setCheckoutAbierto(true)}
                      className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Proceder al Pago con Stripe</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONTROL DE ACCESO SUPERADMIN (ESCENARIO 1) */}
          {['events', 'studio', 'settlement', 'analytics', 'promoters'].includes(activeTab) &&
            usuario?.rol !== 'SUPER_ADMIN' && (
              <SuperAdminLoginModal
                onLoginExitoso={(adminUser) => {
                  setUsuario(adminUser);
                  localStorage.setItem('eurotickets_user', JSON.stringify(adminUser));
                  mostrarMensaje('¡Autenticado con éxito en el Backend como Super Administrador!');
                }}
                onCancelar={() => setActiveTab('b2c')}
              />
            )}

          {/* TAB 2: SEATMAP STUDIO */}
          {activeTab === 'studio' && eventoSeleccionado && mapaActual && (
            <SeatMapStudio
              evento={eventoSeleccionado}
              mapaActual={mapaActual}
              onGuardar={async (nuevoMapa) => {
                await guardarConfiguracionMapa(eventoSeleccionado.id, nuevoMapa);
                cargarMapa(eventoSeleccionado.id);
                mostrarMensaje('¡Plano del recinto actualizado en el backend con éxito!');
              }}
              onActualizarEvento={async (cambios) => {
                const actualizado = { ...eventoSeleccionado, ...cambios };
                setEventoSeleccionado(actualizado);
                setEventos(eventos.map((e) => (e.id === actualizado.id ? actualizado : e)));
                mostrarMensaje('¡Configuración de tipo de evento y jornadas actualizada!');
              }}
              onCambiarTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* TAB 3: ESCÁNER EN PUERTA CON CÁMARA (5S COOLDOWN) */}
          {activeTab === 'scanner' && eventoSeleccionado && (
            <GateScanner
              evento={eventoSeleccionado}
              tickets={ticketsComprados}
              onValidarTicket={async (codigo) => {
                const res = await validarTicketEnPuerta(codigo);
                const tks = await obtenerMisTickets();
                setTicketsComprados(tks);
                return res;
              }}
            />
          )}

          {/* TAB 4: LIQUIDACIÓN FINANCIERA D+3 */}
          {activeTab === 'settlement' && eventoSeleccionado && promotorActivo && (
            <FinancialSettlement
              reporte={reporteLiquidacion}
              evento={eventoSeleccionado}
              promotor={promotorActivo}
            />
          )}

          {/* TAB 5: MIS ENTRADAS Y WALLETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="glass-panel rounded-3xl p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white">
                    Billetera Digital de Entradas
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Boletos con código dinámico SafeTix y soporte para Apple Wallet / Google Wallet.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  {ticketsComprados.length} Entradas Registradas
                </span>
              </div>

              {ticketsComprados.length === 0 ? (
                <div className="glass-panel rounded-3xl p-12 text-center space-y-3">
                  <TicketIcon className="w-12 h-12 text-slate-600 mx-auto" />
                  <h4 className="text-base font-bold text-slate-300">No tienes entradas aún</h4>
                  <p className="text-xs text-slate-500">
                    Selecciona tus asientos en el Portal Fan B2C y completa la compra.
                  </p>
                  <button
                    onClick={() => setActiveTab('b2c')}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                  >
                    Ir a Cartelera y Comprar
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ticketsComprados.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="glass-panel rounded-3xl p-5 space-y-3 flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-xs font-extrabold text-indigo-400">
                            {ticket.id}
                          </span>
                          <h4 className="text-base font-bold text-white mt-1">{ticket.evento}</h4>
                          <p className="text-xs text-slate-400">📍 {ticket.lugar}</p>
                          <p className="text-xs text-slate-400">📅 {ticket.fechaEvento}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            ticket.validado
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {ticket.validado ? 'Ingresada en Puerta' : 'Activa / Válida'}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/5 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[10px] uppercase text-slate-400 font-bold block">
                            Asiento
                          </span>
                          <span className="font-bold text-white">{ticket.asientoNumero}</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-black">
                          {ticket.desgloseFinanciero.precioTotal}{' '}
                          {ticket.desgloseFinanciero.moneda}
                        </span>
                      </div>

                      <button
                        onClick={() => setTicketModal(ticket)}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                      >
                        <TicketIcon className="w-4 h-4" />
                        <span>Ver Pase SafeTix / Descargar</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PROMOTORES (MÓDULO 1) */}
          {activeTab === 'promoters' && (
            <PromotersManager
              promotores={promotores}
              onCrearPromotor={async (datos) => {
                const nuevo = await crearEmpresario(datos);
                setPromotores([...promotores, nuevo]);
                mostrarMensaje('¡Promotor guardado correctamente!');
              }}
            />
          )}

          {/* TAB 7: EVENTOS Y PULEP (MÓDULO 2) */}
          {activeTab === 'events' && (
            <EventManager
              eventos={eventos}
              promotores={promotores}
              onCrearEvento={async (datos) => {
                const nuevo = await crearEvento(datos);
                setEventos([nuevo, ...eventos]);
                setEventoSeleccionado(nuevo);
                cargarMapa(nuevo.id);
                cargarReporte(nuevo.id);
                mostrarMensaje('¡Evento publicado con ficha PULEP!');
              }}
              onEliminarEvento={async (id) => {
                await eliminarEvento(id);
                setEventos(eventos.filter((e) => e.id !== id));
                mostrarMensaje('Evento eliminado');
              }}
              onSeleccionarEvento={(ev) => {
                setEventoSeleccionado(ev);
                cargarMapa(ev.id);
                cargarReporte(ev.id);
                setActiveTab('b2c');
                mostrarMensaje(`Evento activo: ${ev.nombre}`);
              }}
              eventoSeleccionadoId={eventoSeleccionado?.id}
            />
          )}

          {/* TAB 8: ANALÍTICAS RECHARTS & ESTADO PYG (PROFIT & LOSS) */}
          {activeTab === 'analytics' && eventoSeleccionado && (
            <AnalyticsDashboard
              evento={eventoSeleccionado}
              eventos={eventos}
              promotores={promotores}
              tickets={ticketsComprados}
              mapa={mapaActual}
              reportePyG={reportePyG}
              onCambiarEvento={(id) => {
                const ev = eventos.find((e) => e.id === id);
                if (ev) {
                  setEventoSeleccionado(ev);
                  cargarMapa(ev.id);
                  cargarReporte(ev.id);
                  mostrarMensaje(`Analizando evento: ${ev.nombre}`);
                }
              }}
            />
          )}

          {/* TAB 8: DESCARGA Y GUÍA GODADDY */}
          {activeTab === 'godaddy' && <GoDaddyDeployment />}
        </main>
      )}

      {/* Modal de Checkout Stripe */}
      {checkoutAbierto && eventoSeleccionado && promotorActivo && (
        <CheckoutModal
          evento={eventoSeleccionado}
          promotor={promotorActivo}
          asientos={asientosSeleccionados}
          tiempoRestante={tiempoRestante}
          onCerrar={() => setCheckoutAbierto(false)}
          onProcesarPago={handleProcesarCompraStripe}
        />
      )}

      {/* Modal de Ticket Pass SafeTix / QR */}
      {ticketModal && (
        <TicketPassModal ticket={ticketModal} onCerrar={() => setTicketModal(null)} />
      )}

      {/* Modal de Fila Virtual de Espera */}
      {mostrarFilaVirtual && eventoSeleccionado && (
        <VirtualQueueModal
          eventoNombre={eventoSeleccionado.nombre}
          onTurnoLlegado={() => {
            setMostrarFilaVirtual(false);
            mostrarMensaje('¡Turno alcanzado! Ya puedes seleccionar tus entradas.');
          }}
          onCancelar={() => setMostrarFilaVirtual(false)}
        />
      )}

      {/* Modal del Centro de Notificaciones Push API */}
      {modalNotificacionesAbierto && (
        <NotificationCenterModal
          onCerrar={() => setModalNotificacionesAbierto(false)}
          eventos={eventos}
          eventoSeleccionado={eventoSeleccionado}
          rolUsuario={usuario?.rol}
          onVerEntradas={() => {
            setModalNotificacionesAbierto(false);
            setActiveTab('tickets');
          }}
        />
      )}
    </div>
  );
}
