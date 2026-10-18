import React, { useState } from 'react';
import { Evento, AsientoItem, DesgloseFinanciero, Promotor } from '../types';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  evento: Evento;
  promotor: Promotor;
  asientos: AsientoItem[];
  tiempoRestante: number;
  onCerrar: () => void;
  onProcesarPago: (datos: {
    email: string;
    telefono: string;
    stripePaymentToken: string;
  }) => Promise<void>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  evento,
  promotor,
  asientos,
  tiempoRestante,
  onCerrar,
  onProcesarPago,
}) => {
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [nombreTarjeta, setNombreTarjeta] = useState('');
  const [numeroTarjeta, setNumeroTarjeta] = useState('4242 •••• •••• 4242');
  const [expiracion, setExpiracion] = useState('12/28');
  const [cvc, setCvc] = useState('321');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  // Cálculos financieros exactos
  const subtotalBase = asientos.reduce((acc, a) => acc + (a.precioBase || 0), 0);
  const iva = subtotalBase * ((evento.ivaPct || 0) / 100);
  const pulep = subtotalBase * ((evento.pulepPct || 0) / 100);
  const comisionBancaria = (subtotalBase + iva + pulep) * 0.029; // 2.9% Stripe
  const feeEuroTickets = subtotalBase * 0.08; // 8% Fee EuroTickets
  const totalPagar = subtotalBase + iva + pulep + comisionBancaria + feeEuroTickets;

  // Split payments calculations
  const retencionGarantiaD3 = totalPagar * ((promotor.retencionGarantiaPct || 10) / 100);
  const netoTransferirPromotor = Math.max(0, totalPagar - feeEuroTickets - retencionGarantiaD3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor ingresa tu correo electrónico para recibir los tickets.');
      return;
    }

    setProcesando(true);
    setError('');

    try {
      // Simulación de tokenización con Stripe.js
      await new Promise((r) => setTimeout(r, 1500));
      const simulatedToken = `tok_stripe_${Math.random().toString(36).substring(2, 10)}`;

      await onProcesarPago({
        email,
        telefono,
        stripePaymentToken: simulatedToken,
      });

      // Disparar confeti de celebración
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#38bdf8', '#f59e0b'],
      });
    } catch (err: any) {
      setError(err?.message || 'Error al procesar el pago con Stripe.');
      setProcesando(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header con Stripe Branding & Temporizador */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  Pasarela Stripe Elements
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Cifrado 256-bit
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">Finalizar Compra Segura</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 border border-amber-500/30 px-3 py-1.5 rounded-2xl">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            <div className="text-right font-mono">
              <span className="text-[9px] uppercase text-slate-400 block leading-none">Reserva:</span>
              <span className="text-sm font-black text-amber-400">{formatTimer(tiempoRestante)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Resumen de Asientos Seleccionados */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Entradas en Carrito ({asientos.length}):
            </span>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {asientos.map((a) => (
                <span
                  key={a.id}
                  className="px-2.5 py-1 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-xs font-semibold"
                >
                  {a.numero} ({a.precioBase} {evento.moneda})
                </span>
              ))}
            </div>
          </div>

          {/* Desglose Matemático Financiero y Tributario (PRD) */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal Entradas (Base):</span>
              <span className="font-mono">{subtotalBase.toFixed(2)} {evento.moneda}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>IVA Espectáculos ({evento.ivaPct}%):</span>
              <span className="font-mono">+{iva.toFixed(2)} {evento.moneda}</span>
            </div>
            {evento.pulepPct > 0 && (
              <div className="flex justify-between text-amber-400/90">
                <span>Impuesto Espectáculos Públicos PULEP ({evento.pulepPct}%):</span>
                <span className="font-mono">+{pulep.toFixed(2)} {evento.moneda}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Comisión Bancaria Pasarela Stripe (2.9%):</span>
              <span className="font-mono">+{comisionBancaria.toFixed(2)} {evento.moneda}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Fee de Servicio y Gestión EuroTickets (8%):</span>
              <span className="font-mono">+{feeEuroTickets.toFixed(2)} {evento.moneda}</span>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center text-sm font-black text-white">
              <span>TOTAL A COBRAR EN STRIPE:</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {totalPagar.toFixed(2)} {evento.moneda}
              </span>
            </div>
          </div>

          {/* Ficha de Transparencia Split Payments (Módulo 1.1 PRD) */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
              <Building2 className="w-3.5 h-3.5" />
              <span>Liquidación Directa Split Payments a: {promotor.nombreEmpresa}</span>
            </div>
            <p className="text-slate-400 text-[10px]">
              Fondo de Garantía retenido (10% D+3): {retencionGarantiaD3.toFixed(2)} {evento.moneda} | Transferencia neta: {netoTransferirPromotor.toFixed(2)} {evento.moneda} a {promotor.iban}
            </p>
          </div>

          {/* Formulario de Pago con Tarjeta de Crédito / Débito (Stripe Elements) */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Correo Electrónico (Para recibir tickets)
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Teléfono / WhatsApp Móvil
                </label>
                <input
                  type="tel"
                  placeholder="+34 600 000 000"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-300 font-bold border-b border-white/10 pb-2">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-400" /> Tarjeta de Crédito / Débito
                </span>
                <span className="text-[10px] text-slate-400">VISA / Mastercard / Amex</span>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Nombre en la Tarjeta
                </label>
                <input
                  type="text"
                  placeholder="Carlos Mendoza"
                  value={nombreTarjeta}
                  onChange={(e) => setNombreTarjeta(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Número de Tarjeta (Stripe Test Safe)
                </label>
                <input
                  type="text"
                  value={numeroTarjeta}
                  onChange={(e) => setNumeroTarjeta(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Vencimiento (MM/AA)
                  </label>
                  <input
                    type="text"
                    value={expiracion}
                    onChange={(e) => setExpiracion(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    CVC / CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              disabled={procesando}
              className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={procesando}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {procesando ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Procesando pago con Stripe 3D-Secure...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pagar {totalPagar.toFixed(2)} {evento.moneda} y Recibir Entradas</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
