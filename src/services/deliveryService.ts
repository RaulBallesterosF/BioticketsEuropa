import { Ticket } from '../types';

export const generarEnlaceWhatsApp = (ticket: Ticket, telefono?: string): string => {
  const texto = encodeURIComponent(
    `🎟️ *¡Tu entrada para ${ticket.evento} está lista!*\n\n` +
      `📍 *Lugar:* ${ticket.lugar}\n` +
      `📅 *Fecha:* ${ticket.fechaEvento}\n` +
      `💺 *Ubicación:* ${ticket.asientoNumero}\n` +
      `👤 *Titular:* ${ticket.comprador}\n` +
      `💰 *Total Pagado:* ${ticket.desgloseFinanciero.precioTotal.toFixed(2)} ${ticket.desgloseFinanciero.moneda}\n` +
      `🔑 *ID Entrada:* ${ticket.id}\n` +
      `🛡️ *SafeTix Token:* ${ticket.qrData}\n\n` +
      `📲 Presenta este mensaje o descarga tu boleto oficial en: ${window.location.origin}/ticket/${ticket.id}`
  );

  const cleanPhone = (telefono || ticket.telefono || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length >= 7) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${texto}`;
  }
  return `https://api.whatsapp.com/send?text=${texto}`;
};

export const enviarEntradaWhatsApp = (ticket: Ticket, telefono?: string): string => {
  const url = generarEnlaceWhatsApp(ticket, telefono);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    // Fallback silencioso
  }
  return url;
};
