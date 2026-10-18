export type UserRole = 'SUPER_ADMIN' | 'PROMOTOR' | 'VALIDADOR' | 'FAN';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
  promotorId?: number;
  permisos?: string[];
}

export interface PermisosPromotor {
  verReportes: boolean;
  emitirVentas: boolean;
  generarCortesias: boolean;
  editarMapas: boolean;
  accesoScanner: boolean;
}

export interface Promotor {
  id: number;
  nombreEmpresa: string;
  nitNif: string;
  direccionLegal: string;
  representanteLegal: string;
  correo: string;
  iban: string;
  comisionPactadaPct: number;
  retencionGarantiaPct: number;
  contratoFirmado: boolean;
  colorPrimario?: string;
  subdominio?: string;
  logoUrl?: string;
  permisos?: PermisosPromotor;
}

export type TipoEvento = 'CONCIERTO_UNICO' | 'FERIA_MULTIDIA';

export interface Evento {
  id: number;
  nombre: string;
  pais: 'España' | 'Colombia' | 'México' | 'Estados Unidos' | string;
  ciudad: string;
  lugar: string;
  direccion: string;
  fecha: string;
  horaApertura?: string;
  tipoEvento?: TipoEvento;
  diasFeria?: number;
  fechasFeria?: string[];
  descripcion: string;
  imagenBanner: string;
  imagenTicket: string;
  responsable: string;
  promotorId: number;
  codigoPulep: string;
  ivaPct: number;
  pulepPct: number;
  moneda: 'EUR' | 'COP' | 'USD';
  estado: 'ACTIVO' | 'SOLD_OUT' | 'FINALIZADO' | 'CANCELADO';
  aforoMaximo?: number;
  mapaAsociadoId?: string;
}

export interface FilaAsientos {
  id: string;
  nombre: string;
  precioBase: number;
  asientos: number;
  color?: string;
  yOffset?: number;
}

export type FormaMesa = 'REDONDA' | 'CUADRADA' | 'HEXAGONAL' | 'OCTOGONAL' | 'TRIANGULAR' | 'RECTANGULAR';

export interface MesaEspecial {
  id: string;
  nombre: string;
  forma: FormaMesa;
  sillas: number;
  disposicionSillas?: 'ALREDEDOR' | 'FRONTAL' | 'LATERALES' | 'HERRADURA';
  precioSillaBase: number;
  x?: number;
  y?: number;
  tamano?: number;
  rotacion?: number;
}

export type ModoVentaPalco = 'COMPLETO' | 'INDIVIDUAL' | 'PAREJAS';

export interface PalcoVIP {
  id: string;
  nombre: string;
  capacidad: number;
  precioPalcoBase: number;
  modoVenta?: ModoVentaPalco;
  precioSillaIndividual?: number;
  sillasAdicionales?: number;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
}

export interface ZonaDePie {
  id: string;
  nombre: string;
  color: string;
  precioBase: number;
  aforoMaximo: number;
  vendidas: number;
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface AforoGeneral {
  total: number;
  vendidas: number;
  precioBase: number;
  nombre?: string;
}

export interface MapaRecinto {
  imagenFondo: string;
  imagenFondoOpacidad?: number;
  aforoGeneral: AforoGeneral;
  zonasDePie?: ZonaDePie[];
  filas: FilaAsientos[];
  mesas: MesaEspecial[];
  palcos: PalcoVIP[];
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

export interface AsientoItem {
  id: string;
  numero: string;
  tipo: 'FILA' | 'MESA' | 'PALCO' | 'GENERAL' | 'ZONA_PIE';
  precioBase: number;
  filaNombre?: string;
  mesaId?: string;
  palcoId?: string;
  zonaId?: string;
  sillaIndex?: number;
  diaFeria?: number;
  modoVenta?: ModoVentaPalco;
}

export interface DesgloseFinanciero {
  precioBase: number;
  iva: number;
  pulep: number;
  comisionBancaria: number;
  feeEuroTickets: number;
  precioTotal: number;
  moneda: 'EUR' | 'COP' | 'USD';
}

export type PuntoDeVenta = 'WEB_OFICIAL' | 'TAQUILLA_POS' | 'APP_MOVIL' | 'AFILIADO_PROMOTOR';
export type MetodoPago = 'TARJETA_STRIPE' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'TRANSFERENCIA_SEPA' | 'EFECTIVO_POS';

export interface Ticket {
  id: string;
  eventoId: number;
  evento: string;
  lugar: string;
  codigoPulep: string;
  fechaEvento: string;
  asientoId: string;
  asientoNumero: string;
  zonaNombre: string;
  desgloseFinanciero: DesgloseFinanciero;
  tipo: 'PAGADO' | 'RESERVADO' | 'CORTESIA' | 'PRENSA';
  comprador: string;
  nombreComprador?: string;
  telefono: string;
  qrData: string;
  hmacSignature?: string;
  validado: boolean;
  fechaValidacion: string | null;
  validadorNombre?: string;
  fechaEmision: string;
  fechaCompra?: string;
  horaEmision?: string;
  ciudadComprador: string;
  puntoDeVenta: PuntoDeVenta;
  metodoPago: MetodoPago;
  promotorId: number;
  promotorNombre: string;
  stripePaymentId?: string;
}

export interface ReporteLiquidacion {
  evento: string;
  promotor: string;
  iban: string;
  totalEntradasVendidas: number;
  recaudadoTotal: number;
  desglose: {
    totalBase: number;
    totalIva: number;
    totalPulep: number;
    totalFeeEuroTickets: number;
    retencionGarantiaD3: number;
  };
  netoAPagarPromotor: number;
  moneda: 'EUR' | 'COP' | 'USD';
  fechaLiquidacionD3: string;
  estadoTransferencia: 'PENDIENTE' | 'PROCESADA' | 'EN_REVISION';
}

export interface ItemPyG {
  concepto: string;
  categoria: 'INGRESOS' | 'IMPUESTOS' | 'COSTOS_PASARELA' | 'COMISIONES_PLATAFORMA' | 'UTILIDAD_NETA';
  monto: number;
  porcentaje: number;
  tipo: 'POSITIVO' | 'NEGATIVO' | 'TOTAL';
}

export interface ReportePyG {
  evento: string;
  promotor: string;
  moneda: 'EUR' | 'COP' | 'USD';
  ingresosBrutos: number;
  baseImponible: number;
  impuestosTotal: number;
  ivaMonto: number;
  pulepMonto: number;
  comisionesStripe: number;
  feeEuroTickets: number;
  fondoGarantiaD3: number;
  utilidadOperativaBruta: number;
  utilidadNetaPromotor: number;
  margenNetoPct: number;
  items: ItemPyG[];
}

export interface ValidacionResultado {
  ok: boolean;
  estado: 'VALIDO' | 'USADO' | 'INVALIDO';
  mensaje: string;
  ticket?: Ticket;
  fechaValidacion?: string;
}

export type TipoNotificacion =
  | 'ASIENTO_RESERVADO'
  | 'ASIENTO_EXPIRANDO'
  | 'ASIENTO_LIBERADO'
  | 'COMPRA_CONFIRMADA'
  | 'INICIO_EVENTO'
  | 'PUERTAS_ABIERTAS'
  | 'CAMBIO_EVENTO'
  | 'SISTEMA';

export interface NotificacionItem {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  eventoId?: number;
  eventoNombre?: string;
  asientos?: string[];
  tiempoRestanteSegundos?: number;
  accionUrl?: string;
}

export interface PreferenciasNotificacion {
  pushHabilitado: boolean;
  alertasAsientos: boolean;
  alertasInicioEvento: boolean;
  alertasPuertasAbiertas: boolean;
  sonidoHabilitado: boolean;
}
