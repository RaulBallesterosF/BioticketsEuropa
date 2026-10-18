import {
  Promotor,
  Evento,
  MapaRecinto,
  Ticket,
  DesgloseFinanciero,
  ReporteLiquidacion,
  ReportePyG,
  ValidacionResultado,
  PuntoDeVenta,
  MetodoPago,
  PermisosPromotor,
} from '../types';

export const PROMOTORES_INICIALES: Promotor[] = [
  {
    id: 1,
    nombreEmpresa: 'Live Nation España / EuroEvents S.L.',
    nitNif: 'B-87654321',
    direccionLegal: 'Paseo de la Castellana 100, Madrid, España',
    representanteLegal: 'Carlos Mendoza',
    correo: 'contacto@euroevents.es',
    iban: 'ES9121000418450200051321',
    comisionPactadaPct: 5.0,
    retencionGarantiaPct: 10.0,
    contratoFirmado: true,
    colorPrimario: '#6366f1',
    subdominio: 'livenation.biotickets.eu',
    logoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=120&q=80',
    permisos: {
      verReportes: true,
      emitirVentas: true,
      generarCortesias: true,
      editarMapas: true,
      accesoScanner: true,
    },
  },
  {
    id: 2,
    nombreEmpresa: 'Páramo & Ocesa Colombia S.A.S.',
    nitNif: '900.123.456-7',
    direccionLegal: 'Calle 93 # 11-19, Bogotá, Colombia',
    representanteLegal: 'Alejandro Gómez',
    correo: 'finanzas@paramocolombia.co',
    iban: 'COL-BANCOLOMBIA-031000982',
    comisionPactadaPct: 4.5,
    retencionGarantiaPct: 8.0,
    contratoFirmado: true,
    colorPrimario: '#10b981',
    subdominio: 'paramo.biotickets.eu',
    logoUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=120&q=80',
    permisos: {
      verReportes: true,
      emitirVentas: true,
      generarCortesias: false,
      editarMapas: false,
      accesoScanner: true,
    },
  },
];

export const EVENTOS_INICIALES: Evento[] = [
  {
    id: 1,
    nombre: 'Biotickets Tour 2026 — Live Nation',
    pais: 'España',
    ciudad: 'Madrid',
    lugar: 'Estadio Metropolitano',
    direccion: 'Av. de Luis Aragonés 4, 28022 Madrid',
    fecha: '2026-05-15T21:00',
    horaApertura: '18:30',
    descripcion: 'Gran concierto inaugural de la gira europea Biotickets 2026.',
    imagenBanner: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80',
    imagenTicket: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
    responsable: 'Carlos Mendoza',
    promotorId: 1,
    codigoPulep: 'ESP-MAD-2026-88',
    ivaPct: 10.0,
    pulepPct: 0.0,
    moneda: 'EUR',
    estado: 'ACTIVO',
    aforoMaximo: 250,
  },
];

export const MAPAS_INICIALES: Record<number, MapaRecinto> = {
  1: {
    imagenFondo: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    imagenFondoOpacidad: 0.3,
    aforoGeneral: { total: 100, vendidas: 24, precioBase: 35.0, nombre: 'Pista General de Pie' },
    filas: [
      { id: 'f-A', nombre: 'Fila A (VIP Gold)', precioBase: 95.0, asientos: 10, color: '#eab308' },
      { id: 'f-B', nombre: 'Fila B (Platea Central)', precioBase: 75.0, asientos: 10, color: '#6366f1' },
    ],
    mesas: [],
    palcos: [],
  },
};

export class BioticketsEngine {
  private promotores: Promotor[] = [...PROMOTORES_INICIALES];
  private eventos: Evento[] = [...EVENTOS_INICIALES];
  private mapas: Record<number, MapaRecinto> = { ...MAPAS_INICIALES };
  private tickets: Ticket[] = [];
  private bloqueosTemporales: Record<string, { expiraEn: number; userId: string }> = {};

  public getPromotores(): Promotor[] {
    return this.promotores;
  }

  public getEventos(): Evento[] {
    return this.eventos;
  }

  public getEventoById(id: number): Evento | undefined {
    return this.eventos.find((e) => e.id === id);
  }

  public getMapa(eventoId: number) {
    const evento = this.getEventoById(eventoId) || this.eventos[0];
    const mapa = this.mapas[eventoId] || {
      imagenFondo: '',
      aforoGeneral: { total: 50, vendidas: 0, precioBase: 25 },
      filas: [],
      mesas: [],
      palcos: [],
    };
    const idsVendidos = this.tickets.filter((t) => t.eventoId === eventoId).map((t) => t.asientoId);
    const ahora = Date.now();
    const idsBloqueados = Object.keys(this.bloqueosTemporales).filter(
      (id) => this.bloqueosTemporales[id].expiraEn > ahora
    );
    return { mapa, idsVendidos, idsBloqueados, evento };
  }

  public saveMapa(eventoId: number, config: Partial<MapaRecinto>): MapaRecinto {
    const mapaActual = this.mapas[eventoId] || {
      imagenFondo: '',
      aforoGeneral: { total: 100, vendidas: 0, precioBase: 30 },
      filas: [],
      mesas: [],
      palcos: [],
    };
    const actualizado: MapaRecinto = {
      imagenFondo: config.imagenFondo ?? mapaActual.imagenFondo,
      imagenFondoOpacidad: config.imagenFondoOpacidad ?? mapaActual.imagenFondoOpacidad ?? 0.3,
      aforoGeneral: config.aforoGeneral ?? mapaActual.aforoGeneral,
      zonasDePie: config.zonasDePie ?? mapaActual.zonasDePie ?? [],
      filas: config.filas ?? mapaActual.filas,
      mesas: config.mesas ?? mapaActual.mesas,
      palcos: config.palcos ?? mapaActual.palcos,
    };
    this.mapas[eventoId] = actualizado;
    return actualizado;
  }

  public bloquearAsientos(asientoIds: string[], userId = 'guest-session') {
    const ahora = Date.now();
    const expiraEn = ahora + 10 * 60 * 1000;
    for (const id of asientoIds) {
      this.bloqueosTemporales[id] = { expiraEn, userId };
    }
    return { ok: true, expiraEn };
  }

  public liberarAsientos(asientoIds: string[]) {
    asientoIds.forEach((id) => delete this.bloqueosTemporales[id]);
    return true;
  }

  public getTickets(): Ticket[] {
    return this.tickets;
  }

  public validarTicket(codigo: string): ValidacionResultado {
    const ticket = this.tickets.find((t) => t.id.toUpperCase() === codigo.trim().toUpperCase());
    if (!ticket) {
      return { ok: false, estado: 'INVALIDO', mensaje: 'Entrada desconocida' };
    }
    if (ticket.validado) {
      return { ok: false, estado: 'USADO', mensaje: 'Entrada ya utilizada', ticket };
    }
    ticket.validado = true;
    ticket.fechaValidacion = new Date().toISOString();
    return { ok: true, estado: 'VALIDO', mensaje: 'Acceso Autorizado', ticket };
  }

  public getLiquidacionD3(eventoId: number): ReporteLiquidacion {
    const evento = this.getEventoById(eventoId) || this.eventos[0];
    const promotor = this.promotores.find((p) => p.id === evento.promotorId) || this.promotores[0];
    return {
      evento: evento.nombre,
      promotor: promotor.nombreEmpresa,
      iban: promotor.iban,
      totalEntradasVendidas: 0,
      recaudadoTotal: 0,
      desglose: {
        totalBase: 0,
        totalIva: 0,
        totalPulep: 0,
        totalFeeEuroTickets: 0,
        retencionGarantiaD3: 0,
      },
      netoAPagarPromotor: 0,
      moneda: evento.moneda,
      fechaLiquidacionD3: new Date().toLocaleDateString('es-ES'),
      estadoTransferencia: 'PROCESADA',
    };
  }

  public getReportePyG(eventoId: number): ReportePyG {
    const evento = this.getEventoById(eventoId) || this.eventos[0];
    const promotor = this.promotores.find((p) => p.id === evento.promotorId) || this.promotores[0];
    return {
      evento: evento.nombre,
      promotor: promotor.nombreEmpresa,
      moneda: evento.moneda,
      ingresosBrutos: 0,
      baseImponible: 0,
      impuestosTotal: 0,
      ivaMonto: 0,
      pulepMonto: 0,
      comisionesStripe: 0,
      feeEuroTickets: 0,
      fondoGarantiaD3: 0,
      utilidadOperativaBruta: 0,
      utilidadNetaPromotor: 0,
      margenNetoPct: 0,
      items: [],
    };
  }
}

export const globalStore = new BioticketsEngine();
