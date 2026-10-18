import jsPDF from 'jspdf';
import { Ticket } from '../types';

export const generarBoletoPDF = (ticket: Ticket): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Colores corporativos EuroTickets
  const navyDark = [15, 23, 42]; // #0f172a
  const indigoPrimary = [79, 70, 229]; // #4f46e5
  const emeraldSuccess = [16, 185, 129]; // #10b981
  const slateMuted = [148, 163, 184]; // #94a3b8

  // Fondo de cabecera
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(0, 0, 210, 55, 'F');

  // Acento de color superior
  doc.setFillColor(indigoPrimary[0], indigoPrimary[1], indigoPrimary[2]);
  doc.rect(0, 0, 210, 4, 'F');

  // Marca y subtítulo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('EUROTICKETS PRO', 14, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254);
  doc.text('SISTEMA DE BOLETERÍA DIGITAL & CONTROL DE ACCESO ENTERPRISE', 14, 28);

  // Badge Oficial
  doc.setFillColor(indigoPrimary[0], indigoPrimary[1], indigoPrimary[2]);
  doc.roundedRect(140, 15, 56, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('ENTRADA OFICIAL AUTORIZADA', 143, 21.5);

  // Línea separadora decorativa
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.line(14, 34, 196, 34);

  // Metadata de emisión
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`ID Entrada: ${ticket.id}`, 14, 42);
  const fechaStr = ticket.fechaEmision || new Date().toISOString();
  doc.text(`Fecha Emisión: ${new Date(fechaStr).toLocaleString('es-ES')}`, 14, 47);
  doc.text(`Código PULEP: ${ticket.codigoPulep || 'NO-APLICA'}`, 120, 42);
  doc.text(`Punto de Venta: ${ticket.puntoDeVenta || 'WEB_OFICIAL'}`, 120, 47);

  // Contenedor principal del boleto
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 65, 182, 140, 4, 4, 'FD');

  // Nombre del evento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text(ticket.evento, 22, 78);

  // Lugar y fecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(indigoPrimary[0], indigoPrimary[1], indigoPrimary[2]);
  doc.text(`Lugar: ${ticket.lugar}`, 22, 87);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Fecha del Evento: ${ticket.fechaEvento}`, 22, 94);

  // Recuadro de Butaca / Ubicación
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(22, 102, 166, 26, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text('UBICACIÓN ASIGNADA / TIPO DE LOCALIDAD', 28, 110);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(ticket.asientoNumero, 28, 120);

  // Datos del Comprador y Precio
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Titular de la Entrada:', 22, 138);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(ticket.comprador, 22, 144);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Importe Pagado:', 120, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(emeraldSuccess[0], emeraldSuccess[1], emeraldSuccess[2]);
  doc.text(
    `${ticket.desgloseFinanciero.precioTotal.toFixed(2)} ${ticket.desgloseFinanciero.moneda}`,
    120,
    145
  );

  // Línea de corte / picado estilizada
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([3, 2], 0);
  doc.line(22, 154, 188, 154);
  doc.setLineDashPattern([], 0);

  // Token SafeTix y Hash de Seguridad
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('CÓDIGO DE VALIDACIÓN EN PUERTA (SAFETIX DINÁMICO)', 22, 164);

  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229);
  doc.text(`TOKEN: ${ticket.id}`, 22, 172);

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`HMAC-SHA256: ${ticket.hmacSignature || 'ET-PRO-VERIFIED-INTEGRITY'}`, 22, 178);

  // Aviso de acceso
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Presenta este documento impreso o en la pantalla de tu móvil junto a tu documento de identidad.',
    22,
    192
  );

  // Términos y Condiciones resumidos
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 215, 182, 60, 3, 3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('CONDICIONES GENERALES DE ACCESO Y SEGURIDAD', 22, 224);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const terminos = [
    '1. Esta entrada es personal e intransferible. El código QR SafeTix se invalida al primer escaneo en puerta.',
    '2. La organización se reserva el derecho de admisión de acuerdo con la legislación vigente.',
    '3. Queda prohibida la reventa ilegal de este boleto. Las entradas duplicadas o falsificadas serán rechazadas.',
    '4. Se recomienda llegar con 45 minutos de antelación para agilizar el control de aforo y seguridad.',
    '5. En eventos tipo feria multidía, esta entrada es válida exclusivamente para la jornada o fecha seleccionada.',
  ];

  terminos.forEach((t, i) => {
    doc.text(t, 22, 232 + i * 5.5);
  });

  // Pie de página
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'EuroTickets Pro SaaS • Powered by High-Performance Event Engine • https://eurotickets.pro',
    105,
    286,
    { align: 'center' }
  );

  return doc;
};

export const descargarBoletoPDF = (ticket: Ticket): void => {
  const doc = generarBoletoPDF(ticket);
  doc.save(`EuroTickets-${ticket.evento.replace(/\s+/g, '_')}-${ticket.id}.pdf`);
};
