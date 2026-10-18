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
    subdominio: 'livenation.bioticketseuropa.com',
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
    subdominio: 'paramo.bioticketseuropa.com',
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
    descripcion: 'Gran concierto inaugural de la gira europea Biotickets 2026. Alta fidelidad acústica y mapas de butacas interactivos.',
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
  {
    id: 2,
    nombre: 'Estéreo Picnic VIP Gala 2026',
    pais: 'Colombia',
    ciudad: 'Bogotá',
    lugar: 'Movistar Arena',
    direccion: 'Diagonal 61C # 26-36, Bogotá',
    fecha: '2026-09-20T20:00',
    horaApertura: '17:00',
    descripcion: 'Edición especial VIP con distribución de palcos y zonas generales.',
    imagenBanner: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    imagenTicket: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80',
    responsable: 'Alejandro Gómez',
    promotorId: 2,
    codigoPulep: 'COL-PULEP-2026-9931',
    ivaPct: 19.0,
    pulepPct: 10.0,
    moneda: 'COP',
    estado: 'ACTIVO',
    aforoMaximo: 180,
  },
];

export const MAPAS_INICIALES: Record<number, MapaRecinto> = {
  1: {
    imagenFondo: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    imagenFondoOpacidad: 0.3,
    aforoGeneral: { total: 100, vendidas: 24, precioBase: 35.0, nombre: 'Pista General de Pie' },
    zonasDePie: [
      {
        id: 'z-pista-1',
        nombre: 'Zona Front Stage (De Pie)',
        color: '#06b6d4',
        precioBase: 45.0,
        aforoMaximo: 200,
        vendidas: 42,
        x: 170,
        y: 65,
        ancho: 560,
        alto: 50,
      },
    ],
    filas: [
      { id: 'f-A', nombre: 'Fila A (VIP Gold)', precioBase: 95.0, asientos: 10, color: '#eab308' },
      { id: 'f-B', nombre: 'Fila B (Platea Central)', precioBase: 75.0, asientos: 10, color: '#6366f1' },
      { id: 'f-C', nombre: 'Fila C (Preferente)', precioBase: 55.0, asientos: 12, color: '#38bdf8' },
    ],
    mesas: [
      { id: 'M1', nombre: 'Mesa Hexagonal #1', forma: 'HEXAGONAL', sillas: 6, disposicionSillas: 'ALREDEDOR', precioSillaBase: 65.0, x: 230, y: 340 },
      { id: 'M2', nombre: 'Mesa Redonda VIP #2', forma: 'REDONDA', sillas: 4, disposicionSillas: 'ALREDEDOR', precioSillaBase: 50.0, x: 450, y: 340 },
    ],
    palcos: [
      {
        id: 'P1',
        nombre: 'Palco Real Royal #1',
        capacidad: 8,
        precioPalcoBase: 600.0,
        modoVenta: 'INDIVIDUAL',
        precioSillaIndividual: 75.0,
        sillasAdicionales: 2,
        x: 100,
        y: 430,
        ancho: 280,
        alto: 130,
      },
      {
        id: 'P2',
        nombre: 'Palco Platinum #2',
        capacidad: 6,
        precioPalcoBase: 480.0,
        modoVenta: 'PAREJAS',
        precioSillaIndividual: 80.0,
        sillasAdicionales: 0,
        x: 520,
        y: 430,
        ancho: 280,
        alto: 130,
      },
    ],
  },
  2: {
    imagenFondo: '',
    imagenFondoOpacidad: 0.2,
    aforoGeneral: { total: 80, vendidas: 12, precioBase: 120000, nombre: 'General Campo' },
    zonasDePie: [],
    filas: [
      { id: 'f-VIP1', nombre: 'Platea VIP A', precioBase: 350000, asientos: 8, color: '#eab308' },
    ],
    mesas: [],
    palcos: [],
  },
};

export function generarHMAC(asientoId: string, timestamp: number, eventoId: number): string {
  const payload = `BT-PRO:${eventoId}:${asientoId}:${timestamp}:SECRET_KEY_BIOTICKETS_2026`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `SIG_${Math.abs(hash).toString(16).toUpperCase()}_${asientoId}`;
}

export class BioticketsEngine {
  private promotores: Promotor[] = [...PROMOTORES_INICIALES];
  private eventos: Evento[] = [...EVENTOS_INICIALES];
  private mapas: Record<number, MapaRecinto> = { ...MAPAS_INICIALES };
  private tickets: Ticket[] = [];
  private bloqueosTemporales: Record<string, { expiraEn: number; userId: string }> = {};

  constructor() {
    this.sembrarTicketsIniciales();
  }

  private sembrarTicketsIniciales() {
    const ev1 = this.eventos[0];
    const prom1 = this.promotores[0];
    const muestras: Array<{
      id: string;
      asientoId: string;
      asientoNumero: string;
      zona: string;
      precio: number;
      tipo: Ticket['tipo'];
      comprador: string;
      nombre: string;
      ciudad: string;
      pv: PuntoDeVenta;
      mp: MetodoPago;
      fechaHora: string;
      validado: boolean;
    }> = [
      {
        id: 'BT-100201',
        asientoId: 'f-A-1',
        asientoNumero: 'Fila A (VIP Gold) - Butaca 1',
        zona: 'Fila A (VIP Gold)',
        precio: 95.0,
        tipo: 'PAGADO',
        comprador: 'laura.garcia@gmail.com',
        nombre: 'Laura García Moreno',
        ciudad: 'Madrid',
        pv: 'WEB_OFICIAL',
        mp: 'TARJETA_STRIPE',
        fechaHora: '2026-05-10T14:22:00',
        validado: false,
      },
      {
        id: 'BT-100202',
        asientoId: 'f-A-2',
        asientoNumero: 'Fila A (VIP Gold) - Butaca 2',
        zona: 'Fila A (VIP Gold)',
        precio: 95.0,
        tipo: 'PAGADO',
        comprador: 'carlos.validador@test.com',
        nombre: 'Carlos Ruiz Sanz',
        ciudad: 'Madrid',
        pv: 'APP_MOVIL',
        mp: 'APPLE_PAY',
        fechaHora: '2026-05-10T15:10:00',
        validado: true,
      },
    ];

    for (const m of muestras) {
      const desglose = this.calcularDesglose(m.precio, ev1);
      const hmac = generarHMAC(m.asientoId, new Date(m.fechaHora).getTime(), ev1.id);
      const fechaObj = new Date(m.fechaHora);
      this.tickets.push({
        id: m.id,
        eventoId: ev1.id,
        evento: ev1.nombre,
        lugar: ev1.lugar,
        codigoPulep: ev1.codigoPulep,
        fechaEvento: '15 de Mayo, 2026 - 21:00h',
        asientoId: m.asientoId,
        asientoNumero: m.asientoNumero,
        zonaNombre: m.zona,
        desgloseFinanciero: desglose,
        tipo: m.tipo,
        comprador: m.comprador,
        nombreComprador: m.nombre,
        telefono: '+34 600 123 456',
        qrData: `BT-VERIFY-${m.id}|${hmac}`,
        hmacSignature: hmac,
        validado: m.validado,
        fechaValidacion: m.validado ? new Date(fechaObj.getTime() + 7200000).toISOString() : null,
        fechaEmision: fechaObj.toISOString(),
        horaEmision: `${fechaObj.getHours().toString().padStart(2, '0')}:${fechaObj
          .getMinutes()
          .toString()
          .padStart(2, '0')}`,
        ciudadComprador: m.ciudad,
        puntoDeVenta: m.pv,
        metodoPago: m.mp,
        promotorId: prom1.id,
        promotorNombre: prom1.nombreEmpresa,
        stripePaymentId: `pi_live_${m.id.toLowerCase()}`,
      });
    }
  }

  public limpiarBloqueosExpirados() {
    const ahora = Date.now();
    for (const [id, bloqueo] of Object.entries(this.bloqueosTemporales)) {
      if (bloqueo.expiraEn < ahora) {
        delete this.bloqueosTemporales[id];
      }
    }
  }

  public calcularDesglose(precioBase: number, evento: Evento): DesgloseFinanciero {
    const base = Number(precioBase) || 0;
    const iva = base * ((evento.ivaPct || 0) / 100);
    const pulep = base * ((evento.pulepPct || 0) / 100);
    const comisionBancaria = (base + iva + pulep) * 0.029;
    const feeEuroTickets = base * 0.08;
    const total = base + iva + pulep + comisionBancaria + feeEuroTickets;
    return {
      precioBase: Number(base.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      pulep: Number(pulep.toFixed(2)),
      comisionBancaria: Number(comisionBancaria.toFixed(2)),
      feeEuroTickets: Number(feeEuroTickets.toFixed(2)),
      precioTotal: Number(total.toFixed(2)),
      moneda: evento.moneda,
    };
  }

  public getPromotores(): Promotor[] {
    return this.promotores;
  }

  public addPromotor(data: Omit<Promotor, 'id'>): Promotor {
    const nuevo: Promotor = {
      ...data,
      id: this.promotores.length ? Math.max(...this.promotores.map((p) => p.id)) + 1 : 1,
      permisos: data.permisos || {
        verReportes: true,
        emitirVentas: true,
        generarCortesias: false,
        editarMapas: false,
        accesoScanner: true,
      },
    };
    this.promotores.push(nuevo);
    return nuevo;
  }

  public getEventos(): Evento[] {
    return this.eventos;
  }

  public getEventoById(id: number): Evento | undefined {
    return this.eventos.find((e) => e.id === id);
  }

  public addEvento(data: Omit<Evento, 'id'>): Evento {
    const nuevo: Evento = {
      ...data,
      id: this.eventos.length ? Math.max(...this.eventos.map((e) => e.id)) + 1 : 1,
    };
    this.eventos.unshift(nuevo);
    this.mapas[nuevo.id] = {
      imagenFondo: '',
      aforoGeneral: { total: 100, vendidas: 0, precioBase: 30.0, nombre: 'Admisión General' },
      filas: [
        { id: `f-A-${nuevo.id}`, nombre: 'Fila A (VIP)', precioBase: 80.0, asientos: 8, color: '#eab308' },
        { id: `f-B-${nuevo.id}`, nombre: 'Fila B (Preferente)', precioBase: 50.0, asientos: 10, color: '#6366f1' },
      ],
      mesas: [],
      palcos: [],
    };
    return nuevo;
  }

  public deleteEvento(id: number): boolean {
    const index = this.eventos.findIndex((e) => e.id === id);
    if (index !== -1) {
      this.eventos.splice(index, 1);
      delete this.mapas[id];
      return true;
    }
    return false;
  }

  public getMapa(eventoId: number) {
    this.limpiarBloqueosExpirados();
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

  public bloquearAsientos(
    asientoIds: string[],
    userId = 'guest-session'
  ): { ok: boolean; mensaje?: string; expiraEn?: number } {
    this.limpiarBloqueosExpirados();
    const ahora = Date.now();
    if (!Array.isArray(asientoIds) || asientoIds.length === 0) {
      return { ok: false, mensaje: 'Lista de asientos vacía.' };
    }
    for (const id of asientoIds) {
      if (this.tickets.some((t) => t.asientoId === id)) {
        return { ok: false, mensaje: `El asiento ${id} ya ha sido vendido a otro asistente.` };
      }
      const bloqueoExistente = this.bloqueosTemporales[id];
      if (bloqueoExistente && bloqueoExistente.userId !== userId && bloqueoExistente.expiraEn > ahora) {
        return { ok: false, mensaje: `El asiento ${id} está reservado en el carrito de otro comprador.` };
      }
    }
    const expiraEn = ahora + 10 * 60 * 1000;
    for (const id of asientoIds) {
      this.bloqueosTemporales[id] = { expiraEn, userId };
    }
    return { ok: true, expiraEn };
  }

  public liberarAsientos(asientoIds: string[]): boolean {
    if (Array.isArray(asientoIds)) {
      asientoIds.forEach((id) => delete this.bloqueosTemporales[id]);
    }
    return true;
  }

  public procesarCompra(params: {
    eventoId: number;
    asientos: { id: string; numero: string; precioBase: number }[];
    compradorEmail: string;
    nombreComprador?: string;
    telefono?: string;
    stripePaymentToken?: string;
    puntoDeVenta?: PuntoDeVenta;
    metodoPago?: MetodoPago;
    ciudadComprador?: string;
  }): { ok: boolean; tickets: Ticket[]; desgloseTotal: DesgloseFinanciero; stripePaymentId: string } {
    const {
      eventoId,
      asientos,
      compradorEmail,
      nombreComprador,
      telefono,
      stripePaymentToken,
      puntoDeVenta = 'WEB_OFICIAL',
      metodoPago = 'TARJETA_STRIPE',
      ciudadComprador = 'Madrid',
    } = params;
    const evento = this.getEventoById(eventoId) || this.eventos[0];
    const promotor = this.promotores.find((p) => p.id === evento.promotorId) || this.promotores[0];
    const stripePaymentId = stripePaymentToken || `pi_live_${Math.random().toString(36).substring(2, 14)}`;
    const ticketsGenerados: Ticket[] = [];
    let acumuladoTotal: DesgloseFinanciero = {
      precioBase: 0,
      iva: 0,
      pulep: 0,
      comisionBancaria: 0,
      feeEuroTickets: 0,
      precioTotal: 0,
      moneda: evento.moneda,
    };
    const ahora = new Date();
    const horaEmision = `${ahora.getHours().toString().padStart(2, '0')}:${ahora
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    for (const seat of asientos) {
      const desglose = this.calcularDesglose(seat.precioBase, evento);
      acumuladoTotal.precioBase += desglose.precioBase;
      acumuladoTotal.iva += desglose.iva;
      acumuladoTotal.pulep += desglose.pulep;
      acumuladoTotal.comisionBancaria += desglose.comisionBancaria;
      acumuladoTotal.feeEuroTickets += desglose.feeEuroTickets;
      acumuladoTotal.precioTotal += desglose.precioTotal;

      const randomCode = Math.floor(100000 + Math.random() * 900000);
      const codigoTicket = `BT-${randomCode}`;
      const hmac = generarHMAC(seat.id, Date.now(), evento.id);
      const qrData = `BT-VERIFY-${codigoTicket}|${hmac}`;
      const zonaNombre = seat.numero.split('-')[0].trim() || 'General';

      const nuevoTicket: Ticket = {
        id: codigoTicket,
        eventoId: evento.id,
        evento: evento.nombre,
        lugar: evento.lugar,
        codigoPulep: evento.codigoPulep,
        fechaEvento: new Date(evento.fecha).toLocaleString('es-ES', {
          dateStyle: 'long',
          timeStyle: 'short',
        }),
        asientoId: seat.id,
        asientoNumero: seat.numero,
        zonaNombre,
        desgloseFinanciero: desglose,
        tipo: 'PAGADO',
        comprador: compradorEmail,
        nombreComprador: nombreComprador || compradorEmail.split('@')[0],
        telefono: telefono || '+34 600 000 000',
        qrData,
        hmacSignature: hmac,
        validado: false,
        fechaValidacion: null,
        fechaEmision: ahora.toISOString(),
        horaEmision,
        ciudadComprador,
        puntoDeVenta,
        metodoPago,
        promotorId: promotor.id,
        promotorNombre: promotor.nombreEmpresa,
        stripePaymentId,
      };

      this.tickets.unshift(nuevoTicket);
      delete this.bloqueosTemporales[seat.id];
      ticketsGenerados.push(nuevoTicket);
    }

    return {
      ok: true,
      tickets: ticketsGenerados,
      desgloseTotal: acumuladoTotal,
      stripePaymentId,
    };
  }

  public getTickets(): Ticket[] {
    return this.tickets;
  }

  public validarTicket(codigo: string, validadorNombre = 'Puerta Principal'): ValidacionResultado {
    const raw = (codigo || '').trim();
    if (!raw) {
      return { ok: false, estado: 'INVALIDO', mensaje: 'Código QR no proporcionado.' };
    }
    const ticket = this.tickets.find(
      (t) =>
        t.id.toUpperCase() === raw.toUpperCase() ||
        t.qrData.toUpperCase() === raw.toUpperCase() ||
        (raw.includes(t.id) && raw.startsWith('BT-'))
    );
    if (!ticket) {
      return {
        ok: false,
        estado: 'INVALIDO',
        mensaje: 'ENTRADA NO ENCONTRADA O FALSIFICADA',
      };
    }
    if (ticket.validado) {
      return {
        ok: false,
        estado: 'USADO',
        mensaje: 'ENTRADA YA UTILIZADA PREVIAMENTE',
        ticket,
        fechaValidacion: ticket.fechaValidacion || undefined,
      };
    }
    ticket.validado = true;
    ticket.fechaValidacion = new Date().toISOString();
    ticket.validadorNombre = validadorNombre;
    return {
      ok: true,
      estado: 'VALIDO',
      mensaje: 'ACCESO AUTORIZADO — Entrada Legítima',
      ticket,
      fechaValidacion: ticket.fechaValidacion,
    };
  }

  public getLiquidacionD3(eventoId: number): ReporteLiquidacion {
    const evento = this.getEventoById(eventoId) || this.eventos[0];
    const promotor = this.promotores.find((p) => p.id === evento.promotorId) || this.promotores[0];
    const ticketsEvento = this.tickets.filter((t) => t.eventoId === evento.id);
    let recaudadoTotal = 0;
    let totalBase = 0;
    let totalIva = 0;
    let totalPulep = 0;
    let totalFeeEuroTickets = 0;

    for (const t of ticketsEvento) {
      recaudadoTotal += t.desgloseFinanciero.precioTotal;
      totalBase += t.desgloseFinanciero.precioBase;
      totalIva += t.desgloseFinanciero.iva;
      totalPulep += t.desgloseFinanciero.pulep;
      totalFeeEuroTickets += t.desgloseFinanciero.feeEuroTickets;
    }

    const retencionGarantia = recaudadoTotal * ((promotor.retencionGarantiaPct || 10) / 100);
    const netoAPagarPromotor = Math.max(0, recaudadoTotal - totalFeeEuroTickets - retencionGarantia);
    const fechaEv = new Date(evento.fecha);
    const fechaLiquidacion = new Date(fechaEv.getTime() + 3 * 24 * 60 * 60 * 1000);

    return {
      evento: evento.nombre,
      promotor: promotor.nombreEmpresa,
      iban: promotor.iban,
      totalEntradasVendidas: ticketsEvento.length,
      recaudadoTotal: Number(recaudadoTotal.toFixed(2)),
      desglose: {
        totalBase: Number(totalBase.toFixed(2)),
        totalIva: Number(totalIva.toFixed(2)),
        totalPulep: Number(totalPulep.toFixed(2)),
        totalFeeEuroTickets: Number(totalFeeEuroTickets.toFixed(2)),
        retencionGarantiaD3: Number(retencionGarantia.toFixed(2)),
      },
      netoAPagarPromotor: Number(netoAPagarPromotor.toFixed(2)),
      moneda: evento.moneda,
      fechaLiquidacionD3: fechaLiquidacion.toLocaleDateString('es-ES', { dateStyle: 'full' }),
      estadoTransferencia: 'PROCESADA',
    };
  }

  public getReportePyG(eventoId: number): ReportePyG {
    const evento = this.getEventoById(eventoId) || this.eventos[0];
    const promotor = this.promotores.find((p) => p.id === evento.promotorId) || this.promotores[0];
    const ticketsEvento = this.tickets.filter((t) => t.eventoId === evento.id);
    let ingresosBrutos = 0;
    let baseImponible = 0;
    let ivaMonto = 0;
    let pulepMonto = 0;
    let comisionesStripe = 0;
    let feeEuroTickets = 0;

    for (const t of ticketsEvento) {
      ingresosBrutos += t.desgloseFinanciero.precioTotal;
      baseImponible += t.desgloseFinanciero.precioBase;
      ivaMonto += t.desgloseFinanciero.iva;
      pulepMonto += t.desgloseFinanciero.pulep;
      comisionesStripe += t.desgloseFinanciero.comisionBancaria;
      feeEuroTickets += t.desgloseFinanciero.feeEuroTickets;
    }

    const impuestosTotal = ivaMonto + pulepMonto;
    const fondoGarantiaD3 = ingresosBrutos * ((promotor.retencionGarantiaPct || 10) / 100);
    const utilidadOperativaBruta = baseImponible;
    const utilidadNetaPromotor = Math.max(0, ingresosBrutos - feeEuroTickets - fondoGarantiaD3);
    const margenNetoPct = ingresosBrutos > 0 ? (utilidadNetaPromotor / ingresosBrutos) * 100 : 0;

    return {
      evento: evento.nombre,
      promotor: promotor.nombreEmpresa,
      moneda: evento.moneda,
      ingresosBrutos: Number(ingresosBrutos.toFixed(2)),
      baseImponible: Number(baseImponible.toFixed(2)),
      impuestosTotal: Number(impuestosTotal.toFixed(2)),
      ivaMonto: Number(ivaMonto.toFixed(2)),
      pulepMonto: Number(pulepMonto.toFixed(2)),
      comisionesStripe: Number(comisionesStripe.toFixed(2)),
      feeEuroTickets: Number(feeEuroTickets.toFixed(2)),
      fondoGarantiaD3: Number(fondoGarantiaD3.toFixed(2)),
      utilidadOperativaBruta: Number(utilidadOperativaBruta.toFixed(2)),
      utilidadNetaPromotor: Number(utilidadNetaPromotor.toFixed(2)),
      margenNetoPct: Number(margenNetoPct.toFixed(1)),
      items: [
        {
          concepto: '(+) Ingresos Brutos Totales de Taquilla y Web',
          categoria: 'INGRESOS',
          monto: Number(ingresosBrutos.toFixed(2)),
          porcentaje: 100.0,
          tipo: 'POSITIVO',
        },
        {
          concepto: '(=) Utilidad Neta Líquida a Transferir al Promotor',
          categoria: 'UTILIDAD_NETA',
          monto: Number(utilidadNetaPromotor.toFixed(2)),
          porcentaje: Number(margenNetoPct.toFixed(1)),
          tipo: 'TOTAL',
        },
      ],
    };
  }
}

export const globalStore = new BioticketsEngine();
