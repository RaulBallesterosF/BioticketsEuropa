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
} from '../types';

export const login = async (credentials: { email: string }): Promise<{ ok: boolean; usuario: Usuario; token: string }> => {
  const { email } = credentials;
  const usuario: Usuario = {
    id: 1,
    nombre: 'Administrador Biotickets',
    email,
    rol: 'SUPER_ADMIN',
    promotorId: 1,
  };
  const token = `jwt-biotickets-${Date.now()}`;
  localStorage.setItem('biotickets_user', JSON.stringify(usuario));
  return { ok: true, usuario, token };
};

export const logout = () => {
  localStorage.removeItem('biotickets_user');
};

export const obtenerUsuarioActual = (): Usuario | null => {
  try {
    const raw = localStorage.getItem('biotickets_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const obtenerEmpresarios = async (): Promise<Promotor[]> => globalStore.getPromotores();
export const obtenerEventos = async (): Promise<Evento[]> => globalStore.getEventos();
export const obtenerMapaAsientos = async (eventoId: number) => globalStore.getMapa(eventoId);
export const guardarConfiguracionMapa = async (eventoId: number, config: Partial<MapaRecinto>) => globalStore.saveMapa(eventoId, config);
export const bloquearAsientos = async (asientoIds: string[], userId?: string) => globalStore.bloquearAsientos(asientoIds, userId);
export const liberarAsientos = async (asientoIds: string[]) => globalStore.liberarAsientos(asientoIds);
export const obtenerMisTickets = async (): Promise<Ticket[]> => globalStore.getTickets();
export const validarTicketEnPuerta = async (codigoQR: string): Promise<ValidacionResultado> => globalStore.validarTicket(codigoQR);
export const obtenerReporteLiquidacion = async (eventoId: number): Promise<ReporteLiquidacion> => globalStore.getLiquidacionD3(eventoId);
export const obtenerReportePyG = async (eventoId: number): Promise<ReportePyG> => globalStore.getReportePyG(eventoId);
