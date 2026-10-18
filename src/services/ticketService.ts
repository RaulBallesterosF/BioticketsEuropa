import {
  Usuario,
  Promotor,
  Evento,
  MapaRecinto,
  Ticket,
  ReporteLiquidacion,
  ReportePyG,
  ValidacionResultado,
} from '../types';
import { globalStore } from '../server/store';

// Helper de sesión en LocalStorage
export const login = async (credentials: { email: string; password?: string }): Promise<{
  ok: boolean;
  usuario: Usuario;
  token: string;
}> => {
  const { email } = credentials;
  // Rol dinámico según el correo
  let rol: Usuario['rol'] = 'SUPER_ADMIN';
  let nombre = 'Super Administrador (EuroTickets)';
  let promotorId = 1;

  if (email.includes('promotor') || email.includes('livenation')) {
    rol = 'PROMOTOR';
    nombre = 'Carlos Mendoza (Live Nation)';
    promotorId = 1;
  } else if (email.includes('validador') || email.includes('puerta') || email.includes('staff')) {
    rol = 'VALIDADOR';
    nombre = 'Operador de Puerta / Staff';
  } else if (email.includes('fan') || email.includes('cliente')) {
    rol = 'FAN';
    nombre = 'Comprador Fan';
  }

  const usuario: Usuario = {
    id: 1,
    nombre,
    email,
    rol,
    promotorId,
  };

  const token = `jwt-eurotickets-pro-${Date.now()}`;
  localStorage.setItem('eurotickets_token', token);
  localStorage.setItem('eurotickets_user', JSON.stringify(usuario));

  return { ok: true, usuario, token };
};

export const logout = () => {
  localStorage.removeItem('eurotickets_token');
  localStorage.removeItem('eurotickets_user');
};

export const obtenerUsuarioActual = (): Usuario | null => {
  try {
    const raw = localStorage.getItem('eurotickets_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// --- Promotores ---
export const obtenerEmpresarios = async (): Promise<Promotor[]> => {
  return globalStore.getPromotores();
};

export const crearEmpresario = async (datos: Omit<Promotor, 'id'>): Promise<Promotor> => {
  return globalStore.addPromotor(datos);
};

// --- Eventos ---
export const obtenerEventos = async (): Promise<Evento[]> => {
  return globalStore.getEventos();
};

export const crearEvento = async (datos: Omit<Evento, 'id'>): Promise<Evento> => {
  return globalStore.addEvento(datos);
};

export const eliminarEvento = async (id: number): Promise<boolean> => {
  return globalStore.deleteEvento(id);
};

// --- Mapas y Asientos ---
export const obtenerMapaAsientos = async (eventoId: number) => {
  return globalStore.getMapa(eventoId);
};

export const guardarConfiguracionMapa = async (
  eventoId: number,
  configuracion: Partial<MapaRecinto>
): Promise<MapaRecinto> => {
  return globalStore.saveMapa(eventoId, configuracion);
};

// --- Bloqueo Anti-Doble Venta (10 min) ---
export const bloquearAsientos = async (asientoIds: string[], userId?: string) => {
  const res = globalStore.bloquearAsientos(asientoIds, userId || 'session_user');
  if (!res.ok) {
    throw new Error(res.mensaje || 'Asientos no disponibles');
  }
  return res;
};

export const liberarAsientos = async (asientoIds: string[]) => {
  return globalStore.liberarAsientos(asientoIds);
};

// --- Compra Multi-Asiento Stripe ---
export const comprarTickets = async (datos: {
  eventoId: number;
  asientos: { id: string; numero: string; precioBase: number }[];
  compradorEmail: string;
  telefono?: string;
  stripePaymentToken?: string;
}) => {
  const res = globalStore.procesarCompra(datos);
  return res;
};

// --- Mis Tickets ---
export const obtenerMisTickets = async (): Promise<Ticket[]> => {
  return globalStore.getTickets();
};

// --- Validación en Puerta con Lector QR ---
export const validarTicketEnPuerta = async (codigoQR: string): Promise<ValidacionResultado> => {
  return globalStore.validarTicket(codigoQR);
};

// --- Reporte Liquidación D+3 ---
export const obtenerReporteLiquidacion = async (eventoId: number): Promise<ReporteLiquidacion> => {
  return globalStore.getLiquidacionD3(eventoId);
};

// --- Reporte PyG (Profit & Loss / Pérdidas y Ganancias) ---
export const obtenerReportePyG = async (eventoId: number): Promise<ReportePyG> => {
  return globalStore.getReportePyG(eventoId);
};
