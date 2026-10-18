import React, { useRef, useEffect, useState } from 'react';
import {
  MapaRecinto,
  AsientoItem,
  Evento,
  MesaEspecial,
  PalcoVIP,
  ZonaDePie,
  FormaMesa,
} from '../types';
import { Users, Crown, Sparkles, Layers, Shield, Calendar, Check, Compass } from 'lucide-react';

interface SeatMapCanvasProps {
  mapa: MapaRecinto;
  evento: Evento;
  asientosSeleccionados: AsientoItem[];
  idsVendidos: string[];
  idsBloqueados: string[];
  onToggleAsiento: (asiento: AsientoItem) => void;
  diaFeriaSeleccionado?: number;
  onCambiarDiaFeria?: (dia: number) => void;
}

interface CanvasClickTarget {
  x: number;
  y: number;
  radio: number;
  asiento: AsientoItem;
}

export const SeatMapCanvas: React.FC<SeatMapCanvasProps> = ({
  mapa,
  evento,
  asientosSeleccionados,
  idsVendidos,
  idsBloqueados,
  onToggleAsiento,
  diaFeriaSeleccionado = 1,
  onCambiarDiaFeria,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const clickTargetsRef = useRef<CanvasClickTarget[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<AsientoItem | null>(null);

  const getSeatId = (baseId: string) => {
    return evento.tipoEvento === 'FERIA_MULTIDIA' ? `${baseId}-D${diaFeriaSeleccionado}` : baseId;
  };

  // Función auxiliar para dibujar polígonos regulares en Canvas
  const dibujarPoligono = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radio: number,
    lados: number,
    rotacionOffset: number = 0
  ) => {
    ctx.beginPath();
    for (let i = 0; i < lados; i++) {
      const angulo = (i * 2 * Math.PI) / lados + rotacionOffset;
      const px = cx + radio * Math.cos(angulo);
      const py = cy + radio * Math.sin(angulo);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  // Renderizado del Mapa en Canvas 2D
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar objetivos de clic
    clickTargetsRef.current = [];

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // 1. Imagen de fondo del mapa/plano si existe
    if (mapa.imagenFondo) {
      const img = new Image();
      img.src = mapa.imagenFondo;
      img.onload = () => {
        ctx.save();
        ctx.globalAlpha = mapa.imagenFondoOpacidad !== undefined ? mapa.imagenFondoOpacidad : 0.3;
        ctx.drawImage(img, 0, 0, width, height);
        ctx.restore();
        renderizarContenidoCanvas(ctx, width, height);
      };
      img.onerror = () => {
        renderizarContenidoCanvas(ctx, width, height);
      };
    } else {
      renderizarContenidoCanvas(ctx, width, height);
    }
  }, [mapa, asientosSeleccionados, idsVendidos, idsBloqueados, diaFeriaSeleccionado]);

  const renderizarContenidoCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Escenario Principal
    const stageWidth = Math.min(width - 80, 700);
    const stageX = (width - stageWidth) / 2;

    const grad = ctx.createLinearGradient(stageX, 10, stageX + stageWidth, 42);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#4f46e5');
    grad.addColorStop(1, '#6d28d9');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(stageX, 10, stageWidth, 34, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '2px';
    ctx.fillText('⚡ ESCENARIO PRINCIPAL / MAIN STAGE ⚡', width / 2, 32);

    // 2. Zonas de Pie (Admisión General / Standing)
    if (mapa.zonasDePie && mapa.zonasDePie.length > 0) {
      mapa.zonasDePie.forEach((zona) => {
        const zx = zona.x || 160;
        const zy = zona.y || 56;
        const zw = zona.ancho || 580;
        const zh = zona.alto || 50;

        ctx.save();
        ctx.fillStyle = `${zona.color || '#38bdf8'}26`; // 15% opacidad
        ctx.strokeStyle = zona.color || '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);

        ctx.beginPath();
        ctx.roundRect(zx, zy, zw, zh, 8);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = zona.color || '#38bdf8';
        ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        const disponibles = zona.aforoMaximo - zona.vendidas;
        ctx.fillText(
          `[ ${zona.nombre} — ${disponibles}/${zona.aforoMaximo} disponibles — ${zona.precioBase} ${evento.moneda} ]`,
          zx + zw / 2,
          zy + zh / 2 + 4
        );
        ctx.restore();
      });
    }

    // 3. Filas Tradicionales de Asientos
    if (mapa.filas && mapa.filas.length > 0) {
      const startY = 120;
      mapa.filas.forEach((fila, fIndex) => {
        const y = startY + fIndex * 44;

        ctx.fillStyle = fila.color || '#a5b4fc';
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${fila.nombre}`, 20, y + 15);

        const seatSpacing = 34;
        const totalRowWidth = fila.asientos * seatSpacing;
        const startX = Math.max(160, (width - totalRowWidth) / 2 + 60);

        for (let i = 0; i < fila.asientos; i++) {
          const seatId = getSeatId(`${fila.id}-${i + 1}`);
          const x = startX + i * seatSpacing;
          const cx = x + 12;
          const cy = y + 12;

          const esVendido = idsVendidos.includes(seatId);
          const esBloqueado = idsBloqueados.includes(seatId);
          const esSeleccionado = asientosSeleccionados.some((a) => a.id === seatId);

          ctx.beginPath();
          ctx.arc(cx, cy, 12, 0, Math.PI * 2);

          if (esVendido) {
            ctx.fillStyle = '#881337';
            ctx.strokeStyle = '#f43f5e';
          } else if (esSeleccionado) {
            ctx.fillStyle = '#0284c7';
            ctx.strokeStyle = '#38bdf8';
          } else if (esBloqueado) {
            ctx.fillStyle = '#78350f';
            ctx.strokeStyle = '#f59e0b';
          } else {
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = fila.color || '#64748b';
          }

          ctx.lineWidth = esSeleccionado ? 2.5 : 1.5;
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${i + 1}`, cx, cy + 3.5);

          // Registrar objetivo de clic
          if (!esVendido) {
            clickTargetsRef.current.push({
              x: cx,
              y: cy,
              radio: 12,
              asiento: {
                id: seatId,
                numero: `${fila.nombre} - Butaca ${i + 1}`,
                tipo: 'FILA',
                precioBase: fila.precioBase,
                filaNombre: fila.nombre,
                diaFeria: diaFeriaSeleccionado,
              },
            });
          }
        }
      });
    }

    // 4. Mesas Geométricas (Redondas, Cuadradas, Hexagonales, Octogonales, Triangulares)
    if (mapa.mesas && mapa.mesas.length > 0) {
      mapa.mesas.forEach((mesa) => {
        const mx = mesa.x || width / 2;
        const my = mesa.y || 340;
        const radioMesa = mesa.tamano || 22;

        // Dibujar cuerpo de la mesa según la geometría
        ctx.save();
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 2;

        switch (mesa.forma) {
          case 'REDONDA':
            ctx.beginPath();
            ctx.arc(mx, my, radioMesa, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
          case 'CUADRADA':
            ctx.beginPath();
            ctx.roundRect(mx - radioMesa, my - radioMesa, radioMesa * 2, radioMesa * 2, 6);
            ctx.fill();
            ctx.stroke();
            break;
          case 'HEXAGONAL':
            dibujarPoligono(ctx, mx, my, radioMesa, 6, Math.PI / 6);
            ctx.fill();
            ctx.stroke();
            break;
          case 'OCTOGONAL':
            dibujarPoligono(ctx, mx, my, radioMesa, 8, Math.PI / 8);
            ctx.fill();
            ctx.stroke();
            break;
          case 'TRIANGULAR':
            dibujarPoligono(ctx, mx, my, radioMesa, 3, -Math.PI / 2);
            ctx.fill();
            ctx.stroke();
            break;
          default:
            ctx.beginPath();
            ctx.arc(mx, my, radioMesa, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Etiqueta del código de la mesa en el centro
        ctx.fillStyle = '#c7d2fe';
        ctx.font = 'bold 8.5px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(mesa.id, mx, my + 3);
        ctx.restore();

        // Dibujar Sillas asociadas a la mesa
        const sillasCount = mesa.sillas || 4;
        const disposicion = mesa.disposicionSillas || 'ALREDEDOR';

        for (let s = 0; s < sillasCount; s++) {
          let sx = 0;
          let sy = 0;

          if (disposicion === 'FRONTAL') {
            // Sillas alineadas debajo de la mesa
            const espaciado = 26;
            const startX = mx - ((sillasCount - 1) * espaciado) / 2;
            sx = startX + s * espaciado;
            sy = my + radioMesa + 16;
          } else {
            // Sillas dispuestas alrededor (360°)
            const angulo = (s * 2 * Math.PI) / sillasCount - Math.PI / 2;
            sx = mx + Math.cos(angulo) * (radioMesa + 16);
            sy = my + Math.sin(angulo) * (radioMesa + 16);
          }

          const seatId = getSeatId(`${mesa.id}-S${s + 1}`);
          const esVendido = idsVendidos.includes(seatId);
          const esBloqueado = idsBloqueados.includes(seatId);
          const esSeleccionado = asientosSeleccionados.some((a) => a.id === seatId);

          ctx.beginPath();
          ctx.arc(sx, sy, 9, 0, Math.PI * 2);

          if (esVendido) {
            ctx.fillStyle = '#881337';
            ctx.strokeStyle = '#f43f5e';
          } else if (esSeleccionado) {
            ctx.fillStyle = '#0284c7';
            ctx.strokeStyle = '#38bdf8';
          } else if (esBloqueado) {
            ctx.fillStyle = '#78350f';
            ctx.strokeStyle = '#f59e0b';
          } else {
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#818cf8';
          }

          ctx.lineWidth = esSeleccionado ? 2 : 1.2;
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${s + 1}`, sx, sy + 2.5);

          if (!esVendido) {
            clickTargetsRef.current.push({
              x: sx,
              y: sy,
              radio: 10,
              asiento: {
                id: seatId,
                numero: `${mesa.nombre} - Silla ${s + 1}`,
                tipo: 'MESA',
                precioBase: mesa.precioSillaBase,
                mesaId: mesa.id,
                sillaIndex: s + 1,
                diaFeria: diaFeriaSeleccionado,
              },
            });
          }
        }

        // Título de la mesa debajo
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 9.5px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${mesa.nombre} (${mesa.precioSillaBase} ${evento.moneda}/silla)`,
          mx,
          my + radioMesa + (disposicion === 'FRONTAL' ? 32 : 28)
        );
      });
    }

    // 5. Palcos VIP con Mesas Numeradas y Sillas Adicionales
    if (mapa.palcos && mapa.palcos.length > 0) {
      mapa.palcos.forEach((palco) => {
        const px = palco.x || 100;
        const py = palco.y || 440;
        const pw = palco.ancho || 260;
        const ph = palco.alto || 120;
        const totalSillas = palco.capacidad + (palco.sillasAdicionales || 0);
        const modo = palco.modoVenta || 'INDIVIDUAL';

        // Recuadro del Palco VIP (borde dorado y fondo translúcido)
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 12);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.strokeStyle = modo === 'COMPLETO' ? '#eab308' : '#a855f7';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Cinta de Cabecera del Palco
        ctx.fillStyle = modo === 'COMPLETO' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(168, 85, 247, 0.2)';
        ctx.beginPath();
        ctx.roundRect(px, py, pw, 24, [12, 12, 0, 0]);
        ctx.fill();

        ctx.fillStyle = modo === 'COMPLETO' ? '#fde047' : '#d8b4fe';
        ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`👑 ${palco.nombre}`, px + 10, py + 16);

        // Badge de Modalidad de Venta
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'right';
        const badgeModo =
          modo === 'COMPLETO'
            ? 'VENTA COMPLETA'
            : modo === 'PAREJAS'
            ? 'VENTA EN PAREJAS'
            : 'VENTA POR SILLA';
        ctx.fillText(badgeModo, px + pw - 10, py + 16);

        // Mesa central decorativa del Palco
        const tcx = px + pw / 2;
        const tcy = py + ph / 2 + 6;
        ctx.beginPath();
        ctx.roundRect(tcx - 30, tcy - 12, 60, 24, 6);
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.2;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e9d5ff';
        ctx.font = 'bold 8.5px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Mesa (${totalSillas}p)`, tcx, tcy + 3.5);

        // Dibujar sillas dentro del palco (arriba y abajo de la mesa del palco)
        const sillasFilaSup = Math.ceil(totalSillas / 2);
        const sillasFilaInf = Math.floor(totalSillas / 2);

        // Fila superior de sillas
        const espaciadoSup = Math.min(28, (pw - 40) / (sillasFilaSup || 1));
        const startXSup = tcx - ((sillasFilaSup - 1) * espaciadoSup) / 2;

        for (let i = 0; i < sillasFilaSup; i++) {
          const sx = startXSup + i * espaciadoSup;
          const sy = tcy - 24;
          const seatId = getSeatId(`${palco.id}-S${i + 1}`);
          const seatNum = `${palco.nombre} - Silla ${i + 1}`;

          renderizarSillaPalco(ctx, sx, sy, seatId, seatNum, palco, i + 1);
        }

        // Fila inferior de sillas
        const espaciadoInf = Math.min(28, (pw - 40) / (sillasFilaInf || 1));
        const startXInf = tcx - ((sillasFilaInf - 1) * espaciadoInf) / 2;

        for (let i = 0; i < sillasFilaInf; i++) {
          const sIdx = sillasFilaSup + i + 1;
          const sx = startXInf + i * espaciadoInf;
          const sy = tcy + 24;
          const seatId = getSeatId(`${palco.id}-S${sIdx}`);
          const seatNum = `${palco.nombre} - Silla ${sIdx}`;

          renderizarSillaPalco(ctx, sx, sy, seatId, seatNum, palco, sIdx);
        }

        // Precio en el pie del palco
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'normal 8.5px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        const precioTexto =
          modo === 'COMPLETO'
            ? `Total Palco: ${palco.precioPalcoBase} ${evento.moneda}`
            : `${palco.precioSillaIndividual || palco.precioPalcoBase / totalSillas} ${evento.moneda}/silla`;
        ctx.fillText(precioTexto, tcx, py + ph - 8);

        ctx.restore();
      });
    }
  };

  const renderizarSillaPalco = (
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    seatId: string,
    seatNum: string,
    palco: PalcoVIP,
    indexSilla: number
  ) => {
    const esVendido = idsVendidos.includes(seatId);
    const esBloqueado = idsBloqueados.includes(seatId);
    const esSeleccionado = asientosSeleccionados.some((a) => a.id === seatId);

    ctx.beginPath();
    ctx.arc(sx, sy, 9, 0, Math.PI * 2);

    if (esVendido) {
      ctx.fillStyle = '#881337';
      ctx.strokeStyle = '#f43f5e';
    } else if (esSeleccionado) {
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#38bdf8';
    } else if (esBloqueado) {
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#f59e0b';
    } else {
      ctx.fillStyle = '#312e81';
      ctx.strokeStyle = '#c084fc';
    }

    ctx.lineWidth = esSeleccionado ? 2 : 1.2;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${indexSilla}`, sx, sy + 2.5);

    if (!esVendido) {
      const precioBase =
        palco.modoVenta === 'COMPLETO'
          ? palco.precioPalcoBase
          : palco.precioSillaIndividual ||
            palco.precioPalcoBase / (palco.capacidad + (palco.sillasAdicionales || 0));

      clickTargetsRef.current.push({
        x: sx,
        y: sy,
        radio: 10,
        asiento: {
          id: seatId,
          numero: seatNum,
          tipo: 'PALCO',
          precioBase: Number(precioBase.toFixed(2)),
          palcoId: palco.id,
          sillaIndex: indexSilla,
          diaFeria: diaFeriaSeleccionado,
          modoVenta: palco.modoVenta || 'INDIVIDUAL',
        },
      });
    }
  };

  // Manejador de Clic en Canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Buscar si golpeó alguna silla registrada
    for (const target of clickTargetsRef.current) {
      const dx = clickX - target.x;
      const dy = clickY - target.y;
      if (dx * dx + dy * dy <= target.radio * target.radio) {
        if (target.asiento.tipo === 'PALCO') {
          if (target.asiento.modoVenta === 'COMPLETO') {
            const palcoObj = mapa.palcos?.find((p) => p.id === target.asiento.palcoId);
            if (palcoObj) {
              const palcoFullId = getSeatId(`${palcoObj.id}-FULL`);
              onToggleAsiento({
                id: palcoFullId,
                numero: `${palcoObj.nombre} (Palco Completo)`,
                tipo: 'PALCO',
                precioBase: palcoObj.precioPalcoBase,
                palcoId: palcoObj.id,
                diaFeria: diaFeriaSeleccionado,
                modoVenta: 'COMPLETO',
              });
              return;
            }
          } else if (target.asiento.modoVenta === 'PAREJAS' && target.asiento.sillaIndex) {
            const sIdx = target.asiento.sillaIndex;
            const parejaIdx = sIdx % 2 === 1 ? sIdx + 1 : sIdx - 1;
            const parejaTarget = clickTargetsRef.current.find(
              (t) =>
                t.asiento.palcoId === target.asiento.palcoId &&
                t.asiento.sillaIndex === parejaIdx
            );
            onToggleAsiento(target.asiento);
            if (parejaTarget) {
              onToggleAsiento(parejaTarget.asiento);
            }
            return;
          }
        }
        onToggleAsiento(target.asiento);
        return;
      }
    }

    // Si hizo clic en un Palco configurado como 'COMPLETO', seleccionar todas sus sillas
    if (mapa.palcos) {
      for (const palco of mapa.palcos) {
        const px = palco.x || 100;
        const py = palco.y || 440;
        const pw = palco.ancho || 260;
        const ph = palco.alto || 120;

        if (clickX >= px && clickX <= px + pw && clickY >= py && clickY <= py + ph) {
          if (palco.modoVenta === 'COMPLETO') {
            const palcoFullId = getSeatId(`${palco.id}-FULL`);
            onToggleAsiento({
              id: palcoFullId,
              numero: `${palco.nombre} (Palco Completo)`,
              tipo: 'PALCO',
              precioBase: palco.precioPalcoBase,
              palcoId: palco.id,
              diaFeria: diaFeriaSeleccionado,
              modoVenta: 'COMPLETO',
            });
            return;
          }
        }
      }
    }

    // Si hizo clic dentro de una Zona de Pie
    if (mapa.zonasDePie) {
      for (const zona of mapa.zonasDePie) {
        const zx = zona.x || 160;
        const zy = zona.y || 56;
        const zw = zona.ancho || 580;
        const zh = zona.alto || 50;

        if (clickX >= zx && clickX <= zx + zw && clickY >= zy && clickY <= zy + zh) {
          const zonaTicketId = `ZP-${zona.id}-${Date.now().toString().slice(-4)}`;
          onToggleAsiento({
            id: zonaTicketId,
            numero: `${zona.nombre} (Entrada de Pie)`,
            tipo: 'ZONA_PIE',
            precioBase: zona.precioBase,
            zonaId: zona.id,
            diaFeria: diaFeriaSeleccionado,
          });
          return;
        }
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    for (const target of clickTargetsRef.current) {
      const dx = mouseX - target.x;
      const dy = mouseY - target.y;
      if (dx * dx + dy * dy <= target.radio * target.radio) {
        setHoveredSeat(target.asiento);
        canvas.style.cursor = 'pointer';
        return;
      }
    }

    setHoveredSeat(null);
    canvas.style.cursor = 'default';
  };

  return (
    <div className="space-y-4">
      {/* Selector de Días para Eventos Tipo Feria */}
      {evento.tipoEvento === 'FERIA_MULTIDIA' && (
        <div className="p-4 rounded-3xl glass-panel border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <div>
              <span className="text-xs font-bold text-white block">
                Evento Tipo Feria — Disponibilidad por Jornada
              </span>
              <span className="text-[11px] text-slate-400">
                Selecciona el día para ver y reservar asientos independientes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-white/10">
            {Array.from({ length: evento.diasFeria || 3 }).map((_, d) => {
              const diaNum = d + 1;
              const fechaDia =
                evento.fechasFeria && evento.fechasFeria[d]
                  ? evento.fechasFeria[d]
                  : `Día ${diaNum}`;

              return (
                <button
                  key={diaNum}
                  onClick={() => onCambiarDiaFeria && onCambiarDiaFeria(diaNum)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    diaFeriaSeleccionado === diaNum
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-indigo-300" />
                  <span>Día {diaNum} ({fechaDia})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Canvas del Recinto Interactivo */}
      <div className="relative overflow-x-auto glass-panel p-4 rounded-3xl border border-white/10 flex flex-col items-center">
        {/* Tooltip de Asiento al Pasar el Cursor */}
        {hoveredSeat && (
          <div className="absolute top-6 right-6 z-20 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-indigo-400/50 shadow-2xl backdrop-blur-md text-xs pointer-events-none animate-fadeIn">
            <span className="font-bold text-white block">{hoveredSeat.numero}</span>
            <span className="text-emerald-400 font-mono font-bold">
              {hoveredSeat.precioBase} {evento.moneda}
            </span>
            <span className="text-[10px] text-slate-400 block">
              Haz clic para seleccionar o retirar
            </span>
          </div>
        )}

        {/* Leyenda de Asientos */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5 text-[11px] font-medium text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-600"></span>
              <span>Libre</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-sky-600 border border-sky-400"></span>
              <span className="text-sky-300 font-bold">Seleccionado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-900 border border-amber-600"></span>
              <span className="text-amber-300">En Proceso (10m)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-950 border border-rose-600"></span>
              <span className="text-rose-400">Vendido</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md border-2 border-purple-500 bg-purple-950/40"></span>
              <span className="text-purple-300 font-bold">Palco VIP</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500">
            Haz clic directamente en cualquier silla para añadir al carrito
          </span>
        </div>

        <canvas
          ref={canvasRef}
          width={900}
          height={640}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          className="rounded-2xl shadow-2xl mt-3 max-w-full h-auto cursor-crosshair border border-white/5 bg-slate-950"
        />
      </div>

      {/* Selector Rápido por Zonas, Palcos y Mesas */}
      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-400" />
          Acceso Rápido por Zonas, Mesas y Palcos:
        </h4>

        {/* Zonas de Pie */}
        {mapa.zonasDePie && mapa.zonasDePie.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mapa.zonasDePie.map((zona) => {
              const disponibles = zona.aforoMaximo - zona.vendidas;
              return (
                <div
                  key={zona.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-sm text-white block">{zona.nombre}</span>
                    <p className="text-xs text-slate-400">
                      Entrada de pie sin numerar — {disponibles} disponibles
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-400 text-sm font-mono">
                      {zona.precioBase} {evento.moneda}
                    </span>
                    <button
                      onClick={() => {
                        const idGen = `ZP-${zona.id}-${asientosSeleccionados.length + 1}`;
                        onToggleAsiento({
                          id: idGen,
                          numero: `${zona.nombre} #${asientosSeleccionados.length + 1}`,
                          tipo: 'ZONA_PIE',
                          precioBase: zona.precioBase,
                          zonaId: zona.id,
                          diaFeria: diaFeriaSeleccionado,
                        });
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition cursor-pointer"
                    >
                      + Añadir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Palcos VIP */}
        {mapa.palcos && mapa.palcos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mapa.palcos.map((palco) => {
              const totalSillas = palco.capacidad + (palco.sillasAdicionales || 0);
              const modo = palco.modoVenta || 'INDIVIDUAL';
              const precioSilla =
                palco.precioSillaIndividual || palco.precioPalcoBase / totalSillas;

              return (
                <div
                  key={palco.id}
                  className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-bold text-purple-200 flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-amber-400" />
                        {palco.nombre}
                      </span>
                      <p className="text-xs text-slate-400">
                        {totalSillas} Sillas — Modalidad:{' '}
                        <strong className="text-purple-300">{modo}</strong>
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {modo === 'COMPLETO'
                        ? `${palco.precioPalcoBase} ${evento.moneda} (Palco)`
                        : `${precioSilla} ${evento.moneda} / silla`}
                    </span>
                  </div>

                  {/* Sillas individuales del Palco */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Array.from({ length: totalSillas }).map((_, s) => {
                      const seatId = getSeatId(`${palco.id}-S${s + 1}`);
                      const esVendido = idsVendidos.includes(seatId);
                      const esSeleccionado = asientosSeleccionados.some((a) => a.id === seatId);

                      return (
                        <button
                          key={seatId}
                          disabled={esVendido}
                          onClick={() => {
                            if (modo === 'COMPLETO') {
                              onToggleAsiento({
                                id: getSeatId(`${palco.id}-FULL`),
                                numero: `${palco.nombre} (Palco Completo)`,
                                tipo: 'PALCO',
                                precioBase: palco.precioPalcoBase,
                                palcoId: palco.id,
                                diaFeria: diaFeriaSeleccionado,
                                modoVenta: 'COMPLETO',
                              });
                            } else {
                              onToggleAsiento({
                                id: seatId,
                                numero: `${palco.nombre} - Silla ${s + 1}`,
                                tipo: 'PALCO',
                                precioBase: precioSilla,
                                palcoId: palco.id,
                                sillaIndex: s + 1,
                                diaFeria: diaFeriaSeleccionado,
                                modoVenta: modo,
                              });
                            }
                          }}
                          className={`h-8 px-2.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1 cursor-pointer ${
                            esVendido
                              ? 'bg-rose-950/40 text-rose-600 border border-rose-900/40 cursor-not-allowed'
                              : esSeleccionado
                              ? 'bg-sky-600 text-white ring-2 ring-sky-300'
                              : 'bg-purple-900/30 hover:bg-purple-800/40 border border-purple-500/30 text-purple-200'
                          }`}
                        >
                          <span>S{s + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mesas Geométricas */}
        {mapa.mesas && mapa.mesas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mapa.mesas.map((mesa) => (
              <div
                key={mesa.id}
                className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-300">
                    🥂 {mesa.nombre} ({mesa.forma}) — {mesa.sillas} Sillas
                  </span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {mesa.precioSillaBase} {evento.moneda}/silla
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: mesa.sillas }).map((_, s) => {
                    const seatId = getSeatId(`${mesa.id}-S${s + 1}`);
                    const esVendido = idsVendidos.includes(seatId);
                    const esSeleccionado = asientosSeleccionados.some((a) => a.id === seatId);

                    return (
                      <button
                        key={seatId}
                        disabled={esVendido}
                        onClick={() =>
                          onToggleAsiento({
                            id: seatId,
                            numero: `${mesa.nombre} - Silla ${s + 1}`,
                            tipo: 'MESA',
                            precioBase: mesa.precioSillaBase,
                            mesaId: mesa.id,
                            sillaIndex: s + 1,
                            diaFeria: diaFeriaSeleccionado,
                          })
                        }
                        className={`h-8 px-2.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                          esVendido
                            ? 'bg-rose-950/40 text-rose-600 border border-rose-900/40 cursor-not-allowed'
                            : esSeleccionado
                            ? 'bg-sky-600 text-white ring-2 ring-sky-300'
                            : 'bg-indigo-950/50 hover:bg-indigo-900/50 border border-indigo-700/50 text-indigo-200'
                        }`}
                      >
                        Silla {s + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
