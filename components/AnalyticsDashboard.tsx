import React, { useState, useMemo } from 'react';
import { Evento, Ticket, ReportePyG, Promotor, MapaRecinto } from '../types';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Ticket as TicketIcon,
  Download,
  Filter,
  Search,
  PieChart as PieIcon,
  CreditCard,
  MapPin,
  Clock,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  evento: Evento;
  eventos: Evento[];
  promotores: Promotor[];
  tickets: Ticket[];
  mapa: MapaRecinto | null;
  reportePyG: ReportePyG | null;
  onCambiarEvento: (eventoId: number) => void;
}

const COLORS = ['#6366f1', '#10b981', '#38bdf8', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  evento,
  eventos,
  promotores,
  tickets,
  mapa,
  reportePyG,
  onCambiarEvento,
}) => {
  // Filtros de tabla
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroPuntoVenta, setFiltroPuntoVenta] = useState<string>('TODOS');
  const [filtroMetodoPago, setFiltroMetodoPago] = useState<string>('TODOS');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroCiudad, setFiltroCiudad] = useState<string>('TODOS');
  const [filtroPromotor, setFiltroPromotor] = useState<string>('TODOS');
  const [vistaActiva, setVistaActiva] = useState<'GRAFICOS' | 'TABLA_TICKETS' | 'PYG_PROFIT'>('GRAFICOS');
  const [mensajeExportacion, setMensajeExportacion] = useState('');

  // Filtrado de tickets por evento seleccionado (o todos)
  const ticketsEvento = useMemo(() => {
    return tickets.filter((t) => t.eventoId === evento.id);
  }, [tickets, evento.id]);

  // Métricas generales rápidas
  const totalVendidas = ticketsEvento.filter((t) => t.tipo === 'PAGADO').length;
  const totalReservadas = ticketsEvento.filter((t) => t.tipo === 'RESERVADO').length;
  const totalCortesias = ticketsEvento.filter((t) => t.tipo === 'CORTESIA').length;
  const totalPrensa = ticketsEvento.filter((t) => t.tipo === 'PRENSA').length;
  const totalRecaudado = ticketsEvento.reduce((sum, t) => sum + (t.desgloseFinanciero.precioTotal || 0), 0);

  // 1. Datos para Gráfico: Volumen de Ventas en Tiempo Real por Hora
  const dataVentasPorHora = useMemo(() => {
    const horasMap: Record<string, { hora: string; ventas: number; recaudado: number }> = {
      '10:00': { hora: '10:00', ventas: 0, recaudado: 0 },
      '12:00': { hora: '12:00', ventas: 0, recaudado: 0 },
      '14:00': { hora: '14:00', ventas: 0, recaudado: 0 },
      '16:00': { hora: '16:00', ventas: 0, recaudado: 0 },
      '18:00': { hora: '18:00', ventas: 0, recaudado: 0 },
      '20:00': { hora: '20:00', ventas: 0, recaudado: 0 },
      '22:00': { hora: '22:00', ventas: 0, recaudado: 0 },
    };

    ticketsEvento.forEach((t) => {
      let bucket = '18:00';
      if (t.horaEmision) {
        const hour = parseInt(t.horaEmision.split(':')[0], 10);
        if (hour < 11) bucket = '10:00';
        else if (hour < 13) bucket = '12:00';
        else if (hour < 15) bucket = '14:00';
        else if (hour < 17) bucket = '16:00';
        else if (hour < 19) bucket = '18:00';
        else if (hour < 21) bucket = '20:00';
        else bucket = '22:00';
      }
      if (horasMap[bucket]) {
        horasMap[bucket].ventas += 1;
        horasMap[bucket].recaudado += t.desgloseFinanciero.precioTotal;
      }
    });

    return Object.values(horasMap);
  }, [ticketsEvento]);

  // 2. Datos para Gráfico: Tasas de Ocupación por Zona del Recinto
  const dataOcupacionPorZona = useMemo(() => {
    const zonasMap: Record<string, { zona: string; vendidas: number; totalCapacidad: number; ocupacionPct: number; recaudado: number }> = {};

    if (mapa) {
      if (mapa.aforoGeneral) {
        zonasMap['Pista General'] = {
          zona: 'Pista General',
          vendidas: mapa.aforoGeneral.vendidas || 0,
          totalCapacidad: mapa.aforoGeneral.total || 100,
          ocupacionPct: Math.round(((mapa.aforoGeneral.vendidas || 0) / (mapa.aforoGeneral.total || 100)) * 100),
          recaudado: (mapa.aforoGeneral.vendidas || 0) * mapa.aforoGeneral.precioBase,
        };
      }

      mapa.filas?.forEach((f) => {
        const ticketsZona = ticketsEvento.filter((t) => t.asientoId.startsWith(f.id));
        const vendidas = ticketsZona.length;
        const total = f.asientos || 10;
        zonasMap[f.nombre] = {
          zona: f.nombre.split('(')[0].trim(),
          vendidas,
          totalCapacidad: total,
          ocupacionPct: Math.round((vendidas / total) * 100),
          recaudado: ticketsZona.reduce((sum, t) => sum + t.desgloseFinanciero.precioTotal, 0),
        };
      });

      if (mapa.mesas && mapa.mesas.length > 0) {
        const ticketsMesas = ticketsEvento.filter((t) => t.asientoId.startsWith('M'));
        const totalSillas = mapa.mesas.reduce((sum, m) => sum + m.sillas, 0);
        zonasMap['Mesas VIP Lounge'] = {
          zona: 'Mesas Lounge',
          vendidas: ticketsMesas.length,
          totalCapacidad: totalSillas,
          ocupacionPct: Math.round((ticketsMesas.length / totalSillas) * 100),
          recaudado: ticketsMesas.reduce((sum, t) => sum + t.desgloseFinanciero.precioTotal, 0),
        };
      }

      if (mapa.palcos && mapa.palcos.length > 0) {
        const ticketsPalcos = ticketsEvento.filter((t) => t.asientoId.startsWith('P'));
        const totalPalcos = mapa.palcos.length;
        zonasMap['Palcos VIP'] = {
          zona: 'Palcos VIP',
          vendidas: ticketsPalcos.length,
          totalCapacidad: totalPalcos,
          ocupacionPct: Math.round((ticketsPalcos.length / totalPalcos) * 100),
          recaudado: ticketsPalcos.reduce((sum, t) => sum + t.desgloseFinanciero.precioTotal, 0),
        };
      }
    }

    return Object.values(zonasMap);
  }, [mapa, ticketsEvento]);

  // 3. Datos para Gráfico: Proyección de Ingresos por Evento Activo (Real vs Sold Out)
  const dataProyeccionIngresos = useMemo(() => {
    return eventos.map((ev) => {
      const ticketsEv = tickets.filter((t) => t.eventoId === ev.id);
      const recaudadoReal = ticketsEv.reduce((sum, t) => sum + t.desgloseFinanciero.precioTotal, 0);
      const aforoTotal = ev.aforoMaximo || 200;
      // Proyección basada en precio promedio actual
      const precioPromedio = ticketsEv.length > 0 ? recaudadoReal / ticketsEv.length : 85.0;
      const ingresosProyectadosSoldOut = Number((aforoTotal * precioPromedio).toFixed(2));

      return {
        evento: ev.nombre.split('—')[0].trim().substring(0, 18),
        recaudadoReal: Math.round(recaudadoReal),
        proyectadoSoldOut: Math.round(ingresosProyectadosSoldOut),
        moneda: ev.moneda,
      };
    });
  }, [eventos, tickets]);

  // 4. Datos para Gráfico: Desglose por Punto de Venta
  const dataPuntosVenta = useMemo(() => {
    const counts: Record<string, number> = {};
    ticketsEvento.forEach((t) => {
      const pv = t.puntoDeVenta || 'WEB_OFICIAL';
      counts[pv] = (counts[pv] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name:
        name === 'WEB_OFICIAL'
          ? 'Web Oficial'
          : name === 'TAQUILLA_POS'
          ? 'Taquilla POS'
          : name === 'APP_MOVIL'
          ? 'App Móvil'
          : 'Afiliado Promotor',
      value,
    }));
  }, [ticketsEvento]);

  // 5. Datos para Gráfico: Desglose por Método de Pago
  const dataMetodosPago = useMemo(() => {
    const counts: Record<string, number> = {};
    ticketsEvento.forEach((t) => {
      const mp = t.metodoPago || 'TARJETA_STRIPE';
      counts[mp] = (counts[mp] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name:
        name === 'TARJETA_STRIPE'
          ? 'Stripe Cards'
          : name === 'APPLE_PAY'
          ? 'Apple Pay'
          : name === 'GOOGLE_PAY'
          ? 'Google Pay'
          : name === 'TRANSFERENCIA_SEPA'
          ? 'Transferencia SEPA'
          : 'Efectivo Taquilla',
      value,
    }));
  }, [ticketsEvento]);

  // Filtrado multidimensional de la tabla de tickets
  const ticketsFiltrados = useMemo(() => {
    return tickets.filter((t) => {
      if (filtroTexto) {
        const query = filtroTexto.toLowerCase();
        const coincide =
          t.id.toLowerCase().includes(query) ||
          t.comprador.toLowerCase().includes(query) ||
          (t.nombreComprador && t.nombreComprador.toLowerCase().includes(query)) ||
          t.asientoNumero.toLowerCase().includes(query) ||
          t.evento.toLowerCase().includes(query);
        if (!coincide) return false;
      }

      if (filtroPuntoVenta !== 'TODOS' && t.puntoDeVenta !== filtroPuntoVenta) return false;
      if (filtroMetodoPago !== 'TODOS' && t.metodoPago !== filtroMetodoPago) return false;
      if (filtroTipo !== 'TODOS' && t.tipo !== filtroTipo) return false;
      if (filtroCiudad !== 'TODOS' && t.ciudadComprador !== filtroCiudad) return false;
      if (filtroPromotor !== 'TODOS' && t.promotorId.toString() !== filtroPromotor) return false;

      return true;
    });
  }, [tickets, filtroTexto, filtroPuntoVenta, filtroMetodoPago, filtroTipo, filtroCiudad, filtroPromotor]);

  // Lista de ciudades únicas para el filtro
  const ciudadesDisponibles = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.ciudadComprador) set.add(t.ciudadComprador);
    });
    return Array.from(set);
  }, [tickets]);

  // Exportar Tickets a CSV / Excel con codificación BOM UTF-8
  const exportarTicketsCSV = () => {
    const headers = [
      'ID Ticket',
      'Evento',
      'Zona / Butaca',
      'Tipo Entrada',
      'Nombre Comprador',
      'Email Comprador',
      'Ciudad Comprador',
      'Punto de Venta',
      'Metodo de Pago',
      'Fecha Emision',
      'Hora Emision',
      'Precio Base',
      'IVA',
      'PULEP',
      'Comision Pasarela',
      'Fee EuroTickets',
      'Total Pagado',
      'Moneda',
      'Validado Puerta',
      'Fecha Validacion',
      'Firma HMAC',
      'Stripe Payment ID',
    ];

    const rows = ticketsFiltrados.map((t) => [
      t.id,
      `"${t.evento.replace(/"/g, '""')}"`,
      `"${t.asientoNumero.replace(/"/g, '""')}"`,
      t.tipo,
      `"${(t.nombreComprador || '').replace(/"/g, '""')}"`,
      t.comprador,
      t.ciudadComprador || 'Madrid',
      t.puntoDeVenta || 'WEB_OFICIAL',
      t.metodoPago || 'TARJETA_STRIPE',
      new Date(t.fechaEmision).toLocaleDateString('es-ES'),
      t.horaEmision || '12:00',
      t.desgloseFinanciero.precioBase.toFixed(2),
      t.desgloseFinanciero.iva.toFixed(2),
      t.desgloseFinanciero.pulep.toFixed(2),
      t.desgloseFinanciero.comisionBancaria.toFixed(2),
      t.desgloseFinanciero.feeEuroTickets.toFixed(2),
      t.desgloseFinanciero.precioTotal.toFixed(2),
      t.desgloseFinanciero.moneda,
      t.validado ? 'SI' : 'NO',
      t.fechaValidacion ? new Date(t.fechaValidacion).toLocaleString('es-ES') : 'N/A',
      t.hmacSignature || 'N/A',
      t.stripePaymentId || 'N/A',
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Reporte-Entradas-EuroTickets-${evento.id}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMensajeExportacion('¡Reporte de Entradas exportado a CSV/Excel con éxito!');
    setTimeout(() => setMensajeExportacion(''), 4000);
  };

  // Exportar Estado PyG a CSV / Excel
  const exportarPyGCSV = () => {
    if (!reportePyG) return;

    const headers = ['Concepto Financiero', 'Categoria', 'Monto Contable', 'Porcentaje sobre Ingresos', 'Moneda'];
    const rows = reportePyG.items.map((item) => [
      `"${item.concepto.replace(/"/g, '""')}"`,
      item.categoria,
      item.monto.toFixed(2),
      `${item.porcentaje}%`,
      reportePyG.moneda,
    ]);

    const metadataRows = [
      `"REPORTE PYG - ESTADO DE RESULTADOS Y ANALISIS DE GANANCIAS"`,
      `"Evento: ${reportePyG.evento}"`,
      `"Promotor Beneficiario: ${reportePyG.promotor}"`,
      `"Fecha Emision: ${new Date().toLocaleString('es-ES')}"`,
      '',
    ];

    const csvContent =
      '\uFEFF' +
      metadataRows.join('\r\n') +
      '\r\n' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Estado-PyG-${evento.id}-${reportePyG.promotor.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMensajeExportacion('¡Estado de Resultados PyG exportado a CSV/Excel con éxito!');
    setTimeout(() => setMensajeExportacion(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Central de Analíticas y Selector de Evento */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Enterprise BI & Analytics
            </span>
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Tiempo Real Recharts Engine
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">
            Panel Central de Analíticas y Reportes de Ganancias (PyG)
          </h2>
        </div>

        {/* Selector de Evento y Acciones Rápidas de Exportación */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-white/10 px-3 py-2 rounded-2xl">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <select
              value={evento.id}
              onChange={(e) => onCambiarEvento(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {eventos.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-slate-900 text-white">
                  {ev.nombre} ({ev.moneda})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportarTicketsCSV}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              title="Descargar tabla en formato compatible con Microsoft Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Entradas CSV/Excel</span>
            </button>

            <button
              onClick={exportarPyGCSV}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 cursor-pointer"
              title="Descargar estado de PyG contable"
            >
              <Download className="w-4 h-4" />
              <span>Exportar PyG CSV</span>
            </button>
          </div>
        </div>
      </div>

      {mensajeExportacion && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{mensajeExportacion}</span>
        </div>
      )}

      {/* Sub-navegación de Vistas: Gráficos BI / Tabla Multidimensional / PyG Contable */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 w-fit">
        <button
          onClick={() => setVistaActiva('GRAFICOS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition ${
            vistaActiva === 'GRAFICOS'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Gráficos Recharts en Tiempo Real</span>
        </button>

        <button
          onClick={() => setVistaActiva('TABLA_TICKETS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition ${
            vistaActiva === 'TABLA_TICKETS'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Reporte Detallado ({ticketsFiltrados.length} Entradas)</span>
        </button>

        <button
          onClick={() => setVistaActiva('PYG_PROFIT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition ${
            vistaActiva === 'PYG_PROFIT'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Estado PyG (Ganancias, Impuestos & Split)</span>
        </button>
      </div>

      {/* KPI Cards Superiores */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="glass-panel p-4 rounded-3xl">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Recaudo Total</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-black text-emerald-400 font-mono">
              {totalRecaudado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {evento.moneda}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Ingresos brutos</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-3xl border-indigo-500/20">
          <div className="flex justify-between items-center text-indigo-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Vendidas</span>
            <TicketIcon className="w-4 h-4" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-black text-white font-mono">{totalVendidas}</span>
            <span className="text-[10px] text-indigo-300 block mt-0.5">tickets pagados</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-3xl border-amber-500/20">
          <div className="flex justify-between items-center text-amber-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Reservadas (SeatLock)</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-black text-amber-400 font-mono">{totalReservadas}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">en carrito activo</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-3xl border-sky-500/20">
          <div className="flex justify-between items-center text-sky-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Cortesías</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-black text-sky-300 font-mono">{totalCortesias}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">invitaciones VIP</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-3xl border-purple-500/20">
          <div className="flex justify-between items-center text-purple-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Prensa & Media</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-black text-purple-300 font-mono">{totalPrensa}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">acreditaciones</span>
          </div>
        </div>
      </div>

      {/* VISTA 1: GRÁFICOS INTERACTIVOS RECHARTS */}
      {vistaActiva === 'GRAFICOS' && (
        <div className="space-y-6">
          {/* Gráfico 1: Volumen de Ventas en Tiempo Real por Hora */}
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Volumen de Ventas en Tiempo Real (Evolución Horaria)
                </h3>
                <p className="text-xs text-slate-400">
                  Comportamiento del tráfico y recaudación a lo largo de las franjas horarias
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
                Pico Máximo: 18:00 - 22:00
              </span>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataVentasPorHora} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRecaudado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="hora" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#475569',
                      borderRadius: '16px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="recaudado"
                    name={`Recaudación (${evento.moneda})`}
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRecaudado)"
                  />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    name="Tickets Vendidos"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVentas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2 y 3 en dos columnas: Ocupación por Zona & Proyección Sold Out */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Tasas de Ocupación por Zona del Recinto */}
            <div className="lg:col-span-7 glass-panel rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Tasas de Ocupación por Zona del Recinto (%)
                </h3>
                <p className="text-xs text-slate-400">
                  Porcentaje de butacas vendidas sobre la capacidad total configurada
                </p>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataOcupacionPorZona} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis type="number" domain={[0, 100]} unit="%" stroke="#94a3b8" fontSize={11} />
                    <YAxis dataKey="zona" type="category" stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#475569',
                        borderRadius: '16px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any) => [
                        name === 'ocupacionPct' ? `${val}%` : val,
                        name === 'ocupacionPct' ? 'Ocupación' : name,
                      ]}
                    />
                    <Bar dataKey="ocupacionPct" name="Tasa de Ocupación (%)" radius={[0, 8, 8, 0]}>
                      {dataOcupacionPorZona.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Flujo de Ingresos Proyectados Sold Out */}
            <div className="lg:col-span-5 glass-panel rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  Flujo de Ingresos Proyectados
                </h3>
                <p className="text-xs text-slate-400">
                  Recaudo real actual vs. Meta proyectada si alcanza Sold Out
                </p>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dataProyeccionIngresos} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="evento" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#475569',
                        borderRadius: '16px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="recaudadoReal" name="Recaudo Real Actual" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Line type="monotone" dataKey="proyectadoSoldOut" name="Meta Proyectada Sold Out" stroke="#f59e0b" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Gráficos Circulares: Punto de Venta & Métodos de Pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Ventas por Punto de Venta (Canales de Venta)
              </h3>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataPuntosVenta}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {dataPuntosVenta.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#475569',
                        borderRadius: '16px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Distribución por Método de Pago
              </h3>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataMetodosPago}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {dataMetodosPago.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#475569',
                        borderRadius: '16px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: TABLA MULTIDIMENSIONAL DE ENTRADAS CON FILTROS */}
      {vistaActiva === 'TABLA_TICKETS' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="glass-panel rounded-3xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                Filtros Multidimensionales de Entradas
              </h3>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar por ID, comprador o asiento..."
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Punto de Venta
                </label>
                <select
                  value={filtroPuntoVenta}
                  onChange={(e) => setFiltroPuntoVenta(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  <option value="TODOS">Todos los Puntos</option>
                  <option value="WEB_OFICIAL">Web Oficial</option>
                  <option value="TAQUILLA_POS">Taquilla Física POS</option>
                  <option value="APP_MOVIL">App Móvil</option>
                  <option value="AFILIADO_PROMOTOR">Afiliados Promotor</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Método de Pago
                </label>
                <select
                  value={filtroMetodoPago}
                  onChange={(e) => setFiltroMetodoPago(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  <option value="TODOS">Todos los Métodos</option>
                  <option value="TARJETA_STRIPE">Stripe Elements</option>
                  <option value="APPLE_PAY">Apple Pay</option>
                  <option value="GOOGLE_PAY">Google Pay</option>
                  <option value="TRANSFERENCIA_SEPA">Transferencia SEPA</option>
                  <option value="EFECTIVO_POS">Efectivo Taquilla</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Tipo de Entrada
                </label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  <option value="TODOS">Todos los Tipos</option>
                  <option value="PAGADO">Pagadas</option>
                  <option value="RESERVADO">Reservadas</option>
                  <option value="CORTESIA">Cortesías</option>
                  <option value="PRENSA">Prensa</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Ciudad Comprador
                </label>
                <select
                  value={filtroCiudad}
                  onChange={(e) => setFiltroCiudad(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  <option value="TODOS">Todas las Ciudades</option>
                  {ciudadesDisponibles.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Promotor
                </label>
                <select
                  value={filtroPromotor}
                  onChange={(e) => setFiltroPromotor(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  <option value="TODOS">Todos los Promotores</option>
                  {promotores.map((p) => (
                    <option key={p.id} value={p.id.toString()}>
                      {p.nombreEmpresa.split('/')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de Entradas */}
          <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                  <tr>
                    <th className="p-3.5">Código / ID</th>
                    <th className="p-3.5">Evento</th>
                    <th className="p-3.5">Ubicación / Butaca</th>
                    <th className="p-3.5">Comprador</th>
                    <th className="p-3.5">Punto Venta</th>
                    <th className="p-3.5">Método Pago</th>
                    <th className="p-3.5">Fecha & Hora</th>
                    <th className="p-3.5">Total Pagado</th>
                    <th className="p-3.5">Estado Puerta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ticketsFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No se encontraron entradas con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    ticketsFiltrados.map((t) => (
                      <tr key={t.id} className="hover:bg-white/5 transition">
                        <td className="p-3.5 font-mono font-bold text-indigo-400">{t.id}</td>
                        <td className="p-3.5 font-bold text-white max-w-[160px] truncate">{t.evento}</td>
                        <td className="p-3.5 text-slate-300">{t.asientoNumero}</td>
                        <td className="p-3.5">
                          <span className="font-semibold text-white block">{t.nombreComprador || 'Comprador'}</span>
                          <span className="text-[11px] text-slate-400 block">{t.comprador}</span>
                          <span className="text-[10px] text-slate-500 block">📍 {t.ciudadComprador || 'Madrid'}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                            {t.puntoDeVenta || 'WEB_OFICIAL'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-[11px] text-slate-300 block font-medium">
                            {t.metodoPago === 'TARJETA_STRIPE'
                              ? '💳 Stripe'
                              : t.metodoPago === 'APPLE_PAY'
                              ? '🍏 Apple Pay'
                              : t.metodoPago === 'GOOGLE_PAY'
                              ? '🌐 Google Pay'
                              : t.metodoPago === 'TRANSFERENCIA_SEPA'
                              ? '🏦 SEPA'
                              : '💵 Efectivo'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px]">
                          <span className="block">{new Date(t.fechaEmision).toLocaleDateString('es-ES')}</span>
                          <span className="font-mono text-slate-500">{t.horaEmision || '12:00'}</span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-emerald-400">
                          {t.desgloseFinanciero.precioTotal.toFixed(2)} {t.desgloseFinanciero.moneda}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              t.validado
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {t.validado ? '✓ En Recinto' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 3: REPORTE FINANCIERO TIPO PyG (PROFIT & LOSS) */}
      {vistaActiva === 'PYG_PROFIT' && reportePyG && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Estado de Pérdidas y Ganancias (P&L Financial Statement)
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  Análisis de Rentabilidad, Impuestos y Split de Comisiones
                </h3>
                <p className="text-xs text-slate-400">
                  Evento: <strong className="text-white">{reportePyG.evento}</strong> | Promotor Beneficiario:{' '}
                  <strong className="text-indigo-300">{reportePyG.promotor}</strong>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Margen Neto Promotor</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {reportePyG.margenNetoPct}%
                </span>
              </div>
            </div>

            {/* Tabla Estructurada PyG */}
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                  <tr>
                    <th className="p-3.5">Concepto Contable</th>
                    <th className="p-3.5">Categoría</th>
                    <th className="p-3.5 text-right">Monto ({reportePyG.moneda})</th>
                    <th className="p-3.5 text-right">% sobre Bruto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-slate-950/60">
                  {reportePyG.items.map((it, idx) => (
                    <tr
                      key={idx}
                      className={`${
                        it.tipo === 'TOTAL'
                          ? 'bg-emerald-950/40 font-bold border-t-2 border-emerald-500/40 text-emerald-200'
                          : it.tipo === 'POSITIVO'
                          ? 'bg-indigo-950/20 font-bold text-white'
                          : 'text-slate-300'
                      }`}
                    >
                      <td className="p-3.5">{it.concepto}</td>
                      <td className="p-3.5">
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          {it.categoria}
                        </span>
                      </td>
                      <td
                        className={`p-3.5 text-right font-mono font-bold ${
                          it.tipo === 'TOTAL'
                            ? 'text-emerald-400 text-sm'
                            : it.tipo === 'POSITIVO'
                            ? 'text-indigo-300'
                            : 'text-rose-400'
                        }`}
                      >
                        {it.monto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
                        {reportePyG.moneda}
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-slate-400">
                        {it.porcentaje}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen Ejecutivo del PyG */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-indigo-300 block">
                  Total Impuestos Recaudados
                </span>
                <span className="text-lg font-black text-white font-mono">
                  {reportePyG.impuestosTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
                  {reportePyG.moneda}
                </span>
                <p className="text-[10px] text-slate-400">
                  IVA ({evento.ivaPct}%): {reportePyG.ivaMonto} | PULEP ({evento.pulepPct}%): {reportePyG.pulepMonto}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">
                  Fondo de Garantía Retenido (D+3)
                </span>
                <span className="text-lg font-black text-amber-400 font-mono">
                  {reportePyG.fondoGarantiaD3.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
                  {reportePyG.moneda}
                </span>
                <p className="text-[10px] text-slate-400">
                  Retención legal para contracargos liquidable a 3 días
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                  Neto a Liquidar al Promotor
                </span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {reportePyG.utilidadNetaPromotor.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
                  {reportePyG.moneda}
                </span>
                <p className="text-[10px] text-slate-400">
                  Transferencia bancaria directa a {evento.pais === 'España' ? 'SEPA IBAN' : 'ACH Colombia'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
