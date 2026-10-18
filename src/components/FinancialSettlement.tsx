import React, { useState } from 'react';
import { ReporteLiquidacion, Evento, Promotor } from '../types';
import {
  BarChart3,
  Building2,
  DollarSign,
  Download,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  FileDown,
  Sparkles,
  Printer,
} from 'lucide-react';
import {
  descargarReporteLiquidacionPDF,
} from '../services/pdfSettlementService';

interface FinancialSettlementProps {
  reporte: ReporteLiquidacion | null;
  evento: Evento;
  promotor: Promotor;
}

export const FinancialSettlement: React.FC<FinancialSettlementProps> = ({
  reporte,
  evento,
  promotor,
}) => {
  const [descargadoJSON, setDescargadoJSON] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [descargadoPDF, setDescargadoPDF] = useState(false);

  if (!reporte) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center text-slate-400">
        Cargando liquidación pos-evento D+3...
      </div>
    );
  }

  const handleDescargarPDF = () => {
    setGenerandoPDF(true);
    try {
      descargarReporteLiquidacionPDF(reporte, evento, promotor);
      setDescargadoPDF(true);
      setTimeout(() => setDescargadoPDF(false), 3500);
    } catch (err) {
      console.error('Error generando reporte PDF:', err);
    } finally {
      setGenerandoPDF(false);
    }
  };

  const exportarJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(reporte, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `Liquidacion-D3-${evento.id}-${reporte.promotor.replace(/\s+/g, '_')}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setDescargadoJSON(true);
    setTimeout(() => setDescargadoJSON(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Liquidación con Botón de Descarga PDF Destacado */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Protocolo Financiero D+3
            </span>
            <span className="text-xs text-slate-400">
              Split Payments & Dispersión Bancaria
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">
            Liquidación y Cierre Financiero Pos-Evento
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Evento: <strong className="text-white">{reporte.evento}</strong> | Promotor Beneficiario:{' '}
            <strong className="text-indigo-300">{reporte.promotor}</strong>
          </p>
        </div>

        {/* Botones de Exportación */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Botón Principal: Descargar Reporte PDF (jsPDF) */}
          <button
            onClick={handleDescargarPDF}
            disabled={generandoPDF}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            title="Descargar informe oficial de liquidación y ventas en formato PDF (jsPDF)"
          >
            {descargadoPDF ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-200 animate-bounce" />
            ) : (
              <FileDown className="w-4 h-4 text-emerald-200" />
            )}
            <span>
              {generandoPDF
                ? 'Generando PDF...'
                : descargadoPDF
                ? '¡Reporte PDF Descargado!'
                : 'Descargar Reporte PDF Oficial (jsPDF)'}
            </span>
          </button>

          {/* Botón Secundario: JSON Contable */}
          <button
            onClick={exportarJSON}
            className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
            title="Descargar datos en formato JSON"
          >
            {descargadoJSON ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Download className="w-4 h-4 text-slate-400" />
            )}
            <span>{descargadoJSON ? 'JSON Listo' : 'JSON Contable'}</span>
          </button>
        </div>
      </div>

      {/* Banner Informativo del Informe PDF */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/40 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-white font-bold block">
              Comprobante Oficial de Liquidación & Desglose de Ventas (PDF Generado con jsPDF)
            </span>
            <span className="text-slate-400 text-[11px]">
              Incluye balance consolidado, retención de garantía D+3, desglose por zonas de recinto, IVA, PULEP y orden de dispersión bancaria.
            </span>
          </div>
        </div>
        <button
          onClick={handleDescargarPDF}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <span>Descargar ahora</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tarjetas Principales de Consolidado */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass-panel">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Recaudo Bruto Total
          </span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">
            {reporte.recaudadoTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
            {reporte.moneda}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            {reporte.totalEntradasVendidas} entradas emitidas
          </span>
        </div>

        <div className="p-5 rounded-3xl glass-panel border-amber-500/30">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
            Fondo de Garantía (10% D+3)
          </span>
          <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
            {reporte.desglose.retencionGarantiaD3.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
            {reporte.moneda}
          </span>
          <span className="text-xs text-amber-400/70 mt-1 block">
            Retención de contracargos por 3 días
          </span>
        </div>

        <div className="p-5 rounded-3xl glass-panel border-indigo-500/30">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">
            Fee Plataforma EuroTickets (8%)
          </span>
          <span className="text-2xl font-black text-indigo-300 font-mono mt-1 block">
            {reporte.desglose.totalFeeEuroTickets.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
            {reporte.moneda}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            Software White-Label & Gatekeeper
          </span>
        </div>

        <div className="p-5 rounded-3xl glass-panel border-emerald-500/30 bg-emerald-950/20">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
            Neto a Transferir al Promotor
          </span>
          <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
            {reporte.netoAPagarPromotor.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
            {reporte.moneda}
          </span>
          <span className="text-xs text-emerald-400/80 mt-1 block">
            Orden de Dispersión Lista
          </span>
        </div>
      </div>

      {/* Desglose Tributario y Cuenta Bancaria del Promotor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            Desglose Fiscal y Tributario de las Entradas
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex justify-between">
              <span className="text-slate-400">Base Imponible de Boletería:</span>
              <span className="font-mono text-white font-bold">
                {reporte.desglose.totalBase.toFixed(2)} {reporte.moneda}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex justify-between">
              <span className="text-slate-400">
                IVA Cultural / General ({evento.ivaPct}%):
              </span>
              <span className="font-mono text-white font-bold">
                +{reporte.desglose.totalIva.toFixed(2)} {reporte.moneda}
              </span>
            </div>

            {reporte.desglose.totalPulep > 0 && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/20 flex justify-between">
                <span className="text-amber-300">
                  Retención Impuesto Espectáculos Públicos PULEP ({evento.pulepPct}%):
                </span>
                <span className="font-mono text-amber-300 font-bold">
                  +{reporte.desglose.totalPulep.toFixed(2)} {reporte.moneda}
                </span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex justify-between">
              <span className="text-slate-400">Fee de Administración EuroTickets:</span>
              <span className="font-mono text-indigo-400 font-bold">
                -{reporte.desglose.totalFeeEuroTickets.toFixed(2)} {reporte.moneda}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/20 flex justify-between">
              <span className="text-amber-400">
                Fondo de Reserva y Garantía D+3 ({promotor.retencionGarantiaPct || 10}%):
              </span>
              <span className="font-mono text-amber-400 font-bold">
                -{reporte.desglose.retencionGarantiaD3.toFixed(2)} {reporte.moneda}
              </span>
            </div>
          </div>
        </div>

        {/* Ficha de Dispersión Bancaria */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            Orden de Transferencia Bancaria (SEPA / ACH)
          </h3>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Titular de la Cuenta
              </span>
              <span className="text-sm font-bold text-white">{reporte.promotor}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Cuenta Bancaria / IBAN
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {reporte.iban}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Fecha de Liquidación D+3
                </span>
                <span className="text-[11px] text-white font-medium">
                  {reporte.fechaLiquidacionD3}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Estado
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mt-0.5">
                  ✓ LISTO PARA DISPERSIÓN
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              La liquidación D+3 protege a promotores y consumidores cumpliendo los estándares de la
              Unión Europea y la normativa PULEP en Colombia. El reporte descargable en PDF certifica ante bancos y autoridades tributarias este balance.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
