import { NotificacionItem, PreferenciasNotificacion, TipoNotificacion } from '../types';

// Clave para guardar en LocalStorage
const STORAGE_KEY_NOTIFICACIONES = 'eurotickets_notificaciones';
const STORAGE_KEY_PREFS = 'eurotickets_notif_prefs';

// Preferencias iniciales por defecto
export const PREFERENCIAS_DEFAULT: PreferenciasNotificacion = {
  pushHabilitado: true,
  alertasAsientos: true,
  alertasInicioEvento: true,
  alertasPuertasAbiertas: true,
  sonidoHabilitado: true,
};

// Generador de sonido elegante mediante Web Audio API sintético (cero dependencias de archivos externos)
export const reproducirSonidoNotificacion = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Acorde agradable D5 (587.33 Hz) a A5 (880 Hz)
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch {
    // Si el usuario no ha interactuado aún con el audio, no bloquear
  }
};

// Gestión de Listeners para actualizar componentes React en tiempo real
type NotificationListener = (notificaciones: NotificacionItem[]) => void;
const listeners: Set<NotificationListener> = new Set();

export const suscribirNotificaciones = (listener: NotificationListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = (items: NotificacionItem[]) => {
  listeners.forEach((fn) => {
    try {
      fn(items);
    } catch (err) {
      console.error('Error notifying notification listener', err);
    }
  });
};

// Cargar notificaciones de LocalStorage con datos de prueba iniciales
export const obtenerNotificaciones = (): NotificacionItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICACIONES);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  // Notificaciones iniciales de bienvenida y simulación
  const iniciales: NotificacionItem[] = [
    {
      id: 'notif-init-1',
      tipo: 'INICIO_EVENTO',
      titulo: '¡Cuenta regresiva para EuroTickets Tour 2026!',
      mensaje: 'El evento comenzará en 48 horas en el WiZink Center. Las puertas abrirán a las 18:30.',
      fecha: new Date(Date.now() - 3600000 * 2).toISOString(),
      leida: false,
      eventoId: 1,
      eventoNombre: 'EuroTickets Tour 2026 - Concierto Apertura',
    },
    {
      id: 'notif-init-2',
      tipo: 'ASIENTO_RESERVADO',
      titulo: 'Control Anti-Doble Venta Activo',
      mensaje: 'Tus asientos seleccionados quedan protegidos con candado atómico durante 10 minutos.',
      fecha: new Date(Date.now() - 3600000 * 12).toISOString(),
      leida: true,
      asientos: ['VIP-A1'],
    },
  ];
  guardarNotificaciones(iniciales);
  return iniciales;
};

export const guardarNotificaciones = (items: NotificacionItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICACIONES, JSON.stringify(items));
    notifyListeners(items);
  } catch (err) {
    console.error('Error saving notifications', err);
  }
};

// Obtener y guardar preferencias
export const obtenerPreferencias = (): PreferenciasNotificacion => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (raw) return { ...PREFERENCIAS_DEFAULT, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return PREFERENCIAS_DEFAULT;
};

export const guardarPreferencias = (prefs: PreferenciasNotificacion) => {
  try {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
  } catch (err) {
    console.error('Error saving notification prefs', err);
  }
};

// Registro del Service Worker para Push API
let swRegistration: ServiceWorkerRegistration | null = null;

export const inicializarServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
};

// Solicitar permiso de Push al Navegador
export const solicitarPermisoPush = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permiso = await Notification.requestPermission();
    if (permiso === 'granted') {
      const reg = swRegistration || (await inicializarServiceWorker());
      if (reg && 'pushManager' in reg) {
        try {
          // Registro de PushManager estándar
          await reg.pushManager.getSubscription();
        } catch {
          // Push manager fallback
        }
      }
    }
    return permiso;
  } catch (err) {
    console.error('Error solicitando permiso de notificaciones:', err);
    return 'denied';
  }
};

// Emitir Notificación (con soporte de Push API nativo + Bandeja In-App + Sonido)
export const emitirNotificacion = async (
  datos: Omit<NotificacionItem, 'id' | 'fecha' | 'leida'>
): Promise<NotificacionItem> => {
  const prefs = obtenerPreferencias();

  // Crear objeto de notificación
  const nuevaNotificacion: NotificacionItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    fecha: new Date().toISOString(),
    leida: false,
    ...datos,
  };

  // Guardar en la bandeja in-app
  const actuales = obtenerNotificaciones();
  const actualizadas = [nuevaNotificacion, ...actuales.slice(0, 49)]; // mantener últimas 50
  guardarNotificaciones(actualizadas);

  // Reproducir sonido si está habilitado
  if (prefs.sonidoHabilitado) {
    reproducirSonidoNotificacion();
  }

  // Notificación del Sistema Operativo vía Push API / Notification API
  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted' &&
    prefs.pushHabilitado
  ) {
    try {
      if (swRegistration && 'showNotification' in swRegistration) {
        await swRegistration.showNotification(nuevaNotificacion.titulo, {
          body: nuevaNotificacion.mensaje,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: { url: nuevaNotificacion.accionUrl || '/' },
          tag: `notif-${nuevaNotificacion.tipo}`,
          renotify: true,
        } as unknown as NotificationOptions);
      } else {
        new Notification(nuevaNotificacion.titulo, {
          body: nuevaNotificacion.mensaje,
          icon: '/icon-192.png',
        });
      }
    } catch {
      // Ignorar fallos de renderizado del OS
    }
  }

  return nuevaNotificacion;
};

// Acciones específicas del dominio requeridas por el usuario:

// 1. Notificación: Asiento bloqueado / temporizador en marcha
export const notificarAsientoReservado = (
  eventoNombre: string,
  asientos: string[],
  segundosRestantes: number = 600
) => {
  const minutos = Math.ceil(segundosRestantes / 60);
  return emitirNotificacion({
    tipo: 'ASIENTO_RESERVADO',
    titulo: '🔒 Asientos Bloqueados Exclusivamente',
    mensaje: `Tienes ${minutos} minutos para completar tu compra de: ${asientos.join(', ')}. Ningún otro usuario puede comprarlos mientras tu temporizador esté activo.`,
    asientos,
    eventoNombre,
    tiempoRestanteSegundos: segundosRestantes,
  });
};

// 2. Notificación: El temporizador está por expirar (aviso de urgencia)
export const notificarAsientoExpirando = (
  eventoNombre: string,
  asientos: string[],
  segundosRestantes: number
) => {
  return emitirNotificacion({
    tipo: 'ASIENTO_EXPIRANDO',
    titulo: '⚠️ ¡Tu reserva de asientos expira pronto!',
    mensaje: `Quedan menos de ${Math.ceil(segundosRestantes / 60)} minutos para confirmar los asientos ${asientos.join(', ')} en "${eventoNombre}". Finaliza tu pago antes de que se liberen.`,
    asientos,
    eventoNombre,
    tiempoRestanteSegundos: segundosRestantes,
    accionUrl: '/',
  });
};

// 3. Notificación: Asientos liberados por expiración del temporizador
export const notificarAsientoLiberado = (
  eventoNombre: string,
  asientos: string[]
) => {
  return emitirNotificacion({
    tipo: 'ASIENTO_LIBERADO',
    titulo: '⏳ Tiempo de reserva agotado',
    mensaje: `El candado temporal sobre los asientos ${asientos.join(', ')} para "${eventoNombre}" ha expirado y han vuelto a estar disponibles al público.`,
    asientos,
    eventoNombre,
  });
};

// 4. Notificación: Compra confirmada
export const notificarCompraConfirmada = (
  eventoNombre: string,
  asientos: string[],
  total: number,
  moneda: string
) => {
  return emitirNotificacion({
    tipo: 'COMPRA_CONFIRMADA',
    titulo: '🎉 ¡Entradas Confirmadas y Emitidas!',
    mensaje: `Pago de ${total.toLocaleString('es-ES')} ${moneda} recibido. Se han emitido ${asientos.length} entrada(s) para "${eventoNombre}" con QR dinámico SafeTix.`,
    asientos,
    eventoNombre,
    accionUrl: '/',
  });
};

// 5. Notificación: Inicio de Evento (aviso preventivo o inmediato)
export const notificarInicioEvento = (
  eventoNombre: string,
  fechaHora: string,
  lugar: string,
  minutosRestantes?: number
) => {
  const tiempoTexto =
    minutosRestantes !== undefined && minutosRestantes > 0
      ? `comienza en ${minutosRestantes} minutos`
      : 'ha comenzado o está por iniciar';

  return emitirNotificacion({
    tipo: 'INICIO_EVENTO',
    titulo: `🔔 Inicio de Evento: ${eventoNombre}`,
    mensaje: `¡Prepárate! El evento en ${lugar} ${tiempoTexto} (${new Date(fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). Ten listo tu código QR de acceso.`,
    eventoNombre,
  });
};

// 6. Notificación: Puertas Abiertas
export const notificarPuertasAbiertas = (
  eventoNombre: string,
  lugar: string
) => {
  return emitirNotificacion({
    tipo: 'PUERTAS_ABIERTAS',
    titulo: '🚪 ¡Puertas Abiertas al Recinto!',
    mensaje: `Ya se encuentra habilitado el acceso en ${lugar} para "${eventoNombre}". Pasa por los molinetes de escaneo rápido con tu móvil.`,
    eventoNombre,
  });
};

// 7. Difusión general de Promotores a todos los asistentes
export const difundirAlertaPromotor = (
  eventoId: number,
  eventoNombre: string,
  titulo: string,
  mensaje: string,
  tipo: TipoNotificacion = 'CAMBIO_EVENTO'
) => {
  return emitirNotificacion({
    tipo,
    titulo,
    mensaje,
    eventoId,
    eventoNombre,
  });
};

// Marcar como leída
export const marcarNotificacionComoLeida = (id: string) => {
  const items = obtenerNotificaciones();
  const updated = items.map((n) => (n.id === id ? { ...n, leida: true } : n));
  guardarNotificaciones(updated);
};

// Marcar todas como leídas
export const marcarTodasComoLeidas = () => {
  const items = obtenerNotificaciones();
  const updated = items.map((n) => ({ ...n, leida: true }));
  guardarNotificaciones(updated);
};

// Limpiar todas
export const borrarTodasLasNotificaciones = () => {
  guardarNotificaciones([]);
};
