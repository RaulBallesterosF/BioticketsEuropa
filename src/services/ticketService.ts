import { globalStore } from './store';
import {
  Usuario,
  Promotor,
  Evento,
  MapaRecinto,
  Ticket,
  ReporteLiquidacion,
  ReportePyG,
  ValidacionResultado,
  DesgloseFinanciero,
  PlantillaRecintoMaestro,
} from '../types';

export const login = async (credentials: { email: string; password?: string }): Promise<{
  ok: boolean;
  usuario: Usuario;
  token: string;
}> => {
  const { email } = credentials;
  let rol: Usuario['rol'] = 'SUPER_ADMIN';
  let nombre = 'Super Administrador (Biotickets)';
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
  const token = `jwt-biotickets-pro-${Date.now()}`;
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

// --- Bloqueo Anti-Doble Venta (SeatLock) ---
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
}): Promise<{ ok: boolean; tickets: Ticket[]; desgloseTotal: DesgloseFinanciero; stripePaymentId: string }> => {
  return globalStore.procesarCompra(datos);
};

// --- Mis Tickets y Validaciones ---
export const obtenerMisTickets = async (): Promise<Ticket[]> => {
  return globalStore.getTickets();
};

export const validarTicketEnPuerta = async (codigoQR: string): Promise<ValidacionResultado> => {
  return globalStore.validarTicket(codigoQR);
};

// --- Reportes Financieros ---
export const obtenerReporteLiquidacion = async (eventoId: number): Promise<ReporteLiquidacion> => {
  return globalStore.getLiquidacionD3(eventoId);
};

export const obtenerReportePyG = async (eventoId: number): Promise<ReportePyG> => {
  return globalStore.getReportePyG(eventoId);
};

// ========================================================
// --- GESTIÓN DE PLANTILLAS Y BIBLIOTECA DE RECINTOS ---
// ========================================================
const PLANTILLAS_PREDETERMINADAS: PlantillaRecintoMaestro[] = [
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
        { id: 'P-5', nombre: 'Palco Real', capacidad: 10, precioPalcoBase: 1200.0, modoVenta: 'COMPLETO', x: 940, y: 530, ancho: 140, alto: 90 },
        { id: 'P-6', nombre: 'Palco Real', capacidad: 10, precioPalcoBase: 1200.0, modoVenta: 'COMPLETO', x: 1110, y: 530, ancho: 140, alto: 90 },
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
        { id: 'P-3', nombre: 'Palco Oro', capacidad: 8, precioPalcoBase: 800.0, modoVenta: 'COMPLETO', x: 600, y: 370, ancho: 130, alto: 80 },
        { id: 'P-4', nombre: 'Palco Oro', capacidad: 8, precioPalcoBase: 800.0, modoVenta: 'COMPLETO', x: 750, y: 370, ancho: 130, alto: 80 },
      ],
    },
  },
];

export const obtenerPlantillasMapas = (): PlantillaRecintoMaestro[] => {
  try {
    const raw = localStorage.getItem('biotickets_master_map_library');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem('biotickets_master_map_library', JSON.stringify(PLANTILLAS_PREDETERMINADAS));
  return PLANTILLAS_PREDETERMINADAS;
};

export const guardarPlantillaMapa = (plantilla: PlantillaRecintoMaestro): PlantillaRecintoMaestro[] => {
  const actuales = obtenerPlantillasMapas();
  const filtradas = actuales.filter((p) => p.id !== plantilla.id);
  const nuevaLista = [plantilla, ...filtradas];
  localStorage.setItem('biotickets_master_map_library', JSON.stringify(nuevaLista));
  return nuevaLista;
};

export const eliminarPlantillaMapa = (id: string): PlantillaRecintoMaestro[] => {
  const actuales = obtenerPlantillasMapas();
  const nuevaLista = actuales.filter((p) => p.id !== id);
  localStorage.setItem('biotickets_master_map_library', JSON.stringify(nuevaLista));
  return nuevaLista;
};
