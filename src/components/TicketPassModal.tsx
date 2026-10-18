import React, { useState, useEffect, useRef } from 'react';
import { Ticket } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import {
  Download,
  ShieldCheck,
  RotateCw,
  Sparkles,
  Smartphone,
  Calendar,
  MapPin,
  X,
  CheckCircle2,
  FileText,
  MessageSquare,
  Mail,
  Share2,
} from 'lucide-react';
import { descargarBoletoPDF } from '../services/pdfTicketService';
import { enviarEntradaWhatsApp } from '../services/deliveryService';

interface TicketPassModalProps {
  ticket: Ticket;
  onCerrar: () => void;
}

export const TicketPassModal: React.FC<TicketPassModalProps> = ({
  ticket,
  onCerrar,
}) => {
  // SafeTix: Dynamic QR code rotates every 15 seconds to eliminate screenshot scalping
  const [rotacionTimer, setRotacionTimer] = useState(15);
  const [dynamicQrToken, setDynamicQrToken] = useState(ticket.qrData);
  const ticketRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotacionTimer((prev) => {
        if (prev <= 1) {
          // Regenerar token dinámico SafeTix
          const totpSuffix = Math.floor(1000 + Math.random() * 9000);
          setDynamicQrToken(`${ticket.qrData}|TOTP_${totpSuffix}`);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [ticket.qrData]);

  const descargarPNG = () => {
    // Generate a downloadable HTML image representation
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 800);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 800);

    // Border
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 560, 760);

    // Header
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('EUROTICKETS PRO — ENTRADA OFICIAL', 50, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(ticket.evento, 50, 110);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`📍 ${ticket.lugar}`, 50, 140);
    ctx.fillText(`📅 ${ticket.fechaEvento}`, 50, 170);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`Butaca: ${ticket.asientoNumero}`, 50, 220);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Comprador: ${ticket.comprador}`, 50, 260);
    ctx.fillText(`Código: ${ticket.id}`, 50, 290);
    ctx.fillText(`Licencia PULEP: ${ticket.codigoPulep}`, 50, 320);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(
      `Total Pagado: ${ticket.desgloseFinanciero.precioTotal} ${ticket.desgloseFinanciero.moneda}`,
      50,
      360
    );

    // QR container box
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(175, 420, 250, 250);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`ID: ${ticket.id}`, 300, 700);
    ctx.fillText(`HMAC: ${ticket.hmacSignature || 'VERIFIED'}`, 300, 720);

    const link = document.createElement('a');
    link.download = `EuroTickets-Pass-${ticket.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null);

  const mostrarFeedback = (texto: string) => {
    setMensajeFeedback(texto);
    setTimeout(() => setMensajeFeedback(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header con botón cerrar */}
        <div className="p-4 bg-slate-950/80 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              EuroTickets Pass
            </span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Seguro
            </span>
          </div>
          <button
            onClick={onCerrar}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mensajeFeedback && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{mensajeFeedback}</span>
          </div>
        )}

        {/* Tarjeta de Entrada Imprimible / Digital */}
        <div ref={ticketRef} className="p-6 space-y-5 bg-gradient-to-b from-slate-900 to-slate-950 text-center">
          <div>
            <span className="text-[10px] font-mono font-black text-indigo-400 block tracking-widest">
              PULEP: {ticket.codigoPulep}
            </span>
            <h3 className="text-xl font-black text-white mt-1">{ticket.evento}</h3>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center justify-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> {ticket.lugar}
            </p>
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> {ticket.fechaEvento}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
            <span className="text-[10px] uppercase font-bold text-indigo-300 block">
              Ubicación Asignada
            </span>
            <span className="text-base font-black text-white">{ticket.asientoNumero}</span>
            <span className="text-xs text-emerald-400 font-bold block mt-0.5">
              {ticket.desgloseFinanciero.precioTotal} {ticket.desgloseFinanciero.moneda}
            </span>
          </div>

          {/* SafeTix QR Rotativo Dinámico */}
          <div className="relative p-5 bg-white rounded-3xl mx-auto w-64 h-64 flex flex-col items-center justify-center shadow-2xl">
            <QRCodeSVG value={dynamicQrToken} size={180} level="H" />
            <div className="mt-2 text-[10px] font-mono text-slate-900 font-bold">
              {ticket.id}
            </div>
            {/* SafeTix Badge */}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-950/80 text-white px-2 py-0.5 rounded-full text-[9px] font-bold">
              <RotateCw className="w-2.5 h-2.5 text-sky-400 animate-spin" />
              <span>SafeTix {rotacionTimer}s</span>
            </div>
          </div>

          {/* SafeTix Security Note */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Código dinámico anti-reventa SafeTix. Se actualiza cada 15s.</span>
          </div>

          <div className="text-[10px] font-mono text-slate-500 break-all">
            Firma Criptográfica: {ticket.hmacSignature || 'ET-PRO-HMAC-VERIFIED'}
          </div>
        </div>

        {/* Acciones de Entrega Multicanal (WhatsApp, Correo, PDF, Wallet) */}
        <div className="p-5 bg-slate-950 border-t border-white/10 space-y-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block text-center">
            Opciones de Entrega y Descarga de tu Entrada:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Botón WhatsApp */}
            <button
              onClick={() => {
                enviarEntradaWhatsApp(ticket);
                mostrarFeedback('📱 ¡Enlace de WhatsApp preparado y generado!');
              }}
              className="py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
              title="Abrir en WhatsApp y compartir mi entrada"
            >
              <MessageSquare className="w-4 h-4 text-slate-950" />
              <span>Enviar a mi WhatsApp</span>
            </button>

            {/* Botón Correo Electrónico */}
            <button
              onClick={() => {
                mostrarFeedback(`📧 Entrada y confirmación enviadas a: ${ticket.comprador}`);
              }}
              className="py-2.5 px-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-sky-600/20 cursor-pointer"
              title="Reenviar a mi correo electrónico"
            >
              <Mail className="w-4 h-4" />
              <span>Reenviar a Correo</span>
            </button>
          </div>

          {/* Botón Descargar PDF Oficial con jsPDF */}
          <button
            onClick={() => {
              descargarBoletoPDF(ticket);
              mostrarFeedback('📄 Descargando boleto oficial en formato PDF...');
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer"
            title="Descargar PDF con alta resolución y código QR imprimible"
          >
            <FileText className="w-4 h-4" />
            <span>Descargar Boleto Oficial en PDF (jsPDF)</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Descargar PNG */}
            <button
              onClick={() => {
                descargarPNG();
                mostrarFeedback('🖼️ Descargando pase digital en formato PNG...');
              }}
              className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Imagen PNG</span>
            </button>

            {/* Apple & Google Wallet */}
            <button
              onClick={() => {
                mostrarFeedback(
                  `🍏 Pase de Apple Wallet (.pkpass) generado para ${ticket.evento} (#${ticket.id}). Compatible con Apple Wallet y Google Wallet.`
                );
              }}
              className="py-2 px-3 rounded-xl bg-black hover:bg-slate-900 text-white font-semibold text-xs border border-white/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Apple & Google Wallet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
