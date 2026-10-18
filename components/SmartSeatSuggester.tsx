import React, { useState } from 'react';
import { Evento, MapaRecinto, AsientoItem } from '../types';
import { Sparkles, Users, Crown, Zap, DollarSign, Coffee, Check, ArrowRight } from 'lucide-react';

interface SmartSeatSuggesterProps {
  evento: Evento;
  mapa: MapaRecinto;
  idsVendidos: string[];
  idsBloqueados: string[];
  diaFeria?: number;
  onAplicarSugerencia: (asientos: AsientoItem[]) => void;
}

export const SmartSeatSuggester: React.FC<SmartSeatSuggesterProps> = ({
  evento,
  mapa,
  idsVendidos,
  idsBloqueados,
  diaFeria = 1,
  onAplicarSugerencia,
}) => {
  const [cantidad, setCantidad] = useState(2);
  const [preferencia, setPreferencia] = useState<'VIP' | 'CENTRAL' | 'MESAS' | 'ECONOMICO' | 'FRONT_STAGE'>('CENTRAL');
  const [sugerenciaEncontrada, setSugerenciaEncontrada] = useState<AsientoItem[] | null>(null);
  const [mensajeResultado, setMensajeResultado] = useState('');

  const getSeatId = (baseId: string) => {
    return evento.tipoEvento === 'FERIA_MULTIDIA' ? `${baseId}-D${diaFeria}` : baseId;
  };

  const buscarSugerenciaInteligente = () => {
    let seleccion: AsientoItem[] = [];

    // 1. Preferencia FRONT STAGE / ZONA DE PIE
    if (preferencia === 'FRONT_STAGE' && mapa.zonasDePie && mapa.zonasDePie.length > 0) {
      const zona = mapa.zonasDePie[0];
      for (let i = 0; i < cantidad; i++) {
        const idGen = `ZP-${zona.id}-${Date.now().toString().slice(-4)}-${i + 1}`;
        seleccion.push({
          id: idGen,
          numero: `${zona.nombre} (Entrada #${i + 1})`,
          tipo: 'ZONA_PIE',
          precioBase: zona.precioBase,
          zonaId: zona.id,
          diaFeria,
        });
      }
      setSugerenciaEncontrada(seleccion);
      setMensajeResultado(
        `¡Encontramos ${cantidad} entradas de pie en ${zona.nombre} por ${zona.precioBase} ${evento.moneda} c/u!`
      );
      return;
    }

    // 2. Preferencia VIP / PALCOS
    if (preferencia === 'VIP' && mapa.palcos && mapa.palcos.length > 0) {
      for (const palco of mapa.palcos) {
        const totalSillas = palco.capacidad + (palco.sillasAdicionales || 0);
        const disponibles: number[] = [];

        for (let s = 1; s <= totalSillas; s++) {
          const sId = getSeatId(`${palco.id}-S${s}`);
          if (!idsVendidos.includes(sId) && !idsBloqueados.includes(sId)) {
            disponibles.push(s);
          }
        }

        if (disponibles.length >= cantidad) {
          const precioSilla =
            palco.precioSillaIndividual || palco.precioPalcoBase / totalSillas;

          seleccion = disponibles.slice(0, cantidad).map((sIdx) => ({
            id: getSeatId(`${palco.id}-S${sIdx}`),
            numero: `${palco.nombre} - Silla ${sIdx}`,
            tipo: 'PALCO',
            precioBase: Number(precioSilla.toFixed(2)),
            palcoId: palco.id,
            sillaIndex: sIdx,
            diaFeria,
            modoVenta: palco.modoVenta || 'INDIVIDUAL',
          }));
          break;
        }
      }

      if (seleccion.length > 0) {
        setSugerenciaEncontrada(seleccion);
        setMensajeResultado(
          `¡Encontramos ${cantidad} sillas exclusivas contiguas en ${seleccion[0].numero.split(' - ')[0]}!`
        );
        return;
      }
    }

    // 3. Preferencia MESAS LOUNGE
    if (preferencia === 'MESAS' && mapa.mesas && mapa.mesas.length > 0) {
      for (const mesa of mapa.mesas) {
        const disponibles: number[] = [];
        for (let s = 1; s <= mesa.sillas; s++) {
          const sId = getSeatId(`${mesa.id}-S${s}`);
          if (!idsVendidos.includes(sId) && !idsBloqueados.includes(sId)) {
            disponibles.push(s);
          }
        }

        if (disponibles.length >= cantidad) {
          seleccion = disponibles.slice(0, cantidad).map((sIdx) => ({
            id: getSeatId(`${mesa.id}-S${sIdx}`),
            numero: `${mesa.nombre} - Silla ${sIdx}`,
            tipo: 'MESA',
            precioBase: mesa.precioSillaBase,
            mesaId: mesa.id,
            sillaIndex: sIdx,
            diaFeria,
          }));
          break;
        }
      }

      if (seleccion.length > 0) {
        setSugerenciaEncontrada(seleccion);
        setMensajeResultado(
          `¡Encontramos ${cantidad} sillas juntas en ${seleccion[0].numero.split(' - ')[0]}!`
        );
        return;
      }
    }

    // 4. Búsqueda en Filas de Platea (Central o Económico)
    if (mapa.filas && mapa.filas.length > 0) {
      // Ordenar filas: si es económico por precio ascendente; si es central/vip por precio descendente
      const filasOrdenadas = [...mapa.filas].sort((a, b) =>
        preferencia === 'ECONOMICO' ? a.precioBase - b.precioBase : b.precioBase - a.precioBase
      );

      for (const fila of filasOrdenadas) {
        const disponibles: number[] = [];
        for (let i = 1; i <= fila.asientos; i++) {
          const sId = getSeatId(`${fila.id}-${i}`);
          if (!idsVendidos.includes(sId) && !idsBloqueados.includes(sId)) {
            disponibles.push(i);
          }
        }

        // Buscar N asientos contiguos exactos
        for (let i = 0; i <= disponibles.length - cantidad; i++) {
          let contiguos = true;
          for (let k = 0; k < cantidad - 1; k++) {
            if (disponibles[i + k + 1] !== disponibles[i + k] + 1) {
              contiguos = false;
              break;
            }
          }
          if (contiguos) {
            const grupo = disponibles.slice(i, i + cantidad);
            seleccion = grupo.map((seatNum) => ({
              id: getSeatId(`${fila.id}-${seatNum}`),
              numero: `${fila.nombre} - Butaca ${seatNum}`,
              tipo: 'FILA',
              precioBase: fila.precioBase,
              filaNombre: fila.nombre,
              diaFeria,
            }));
            break;
          }
        }

        if (seleccion.length > 0) break;
      }
    }

    if (seleccion.length > 0) {
      setSugerenciaEncontrada(seleccion);
      setMensajeResultado(
        `¡Encontramos ${cantidad} mejores butacas contiguas en ${seleccion[0].numero.split(' - ')[0]}!`
      );
    } else {
      setSugerenciaEncontrada(null);
      setMensajeResultado('No se encontraron suficientes asientos contiguos con ese criterio.');
    }
  };

  const aplicarYBloquear = () => {
    if (sugerenciaEncontrada && sugerenciaEncontrada.length > 0) {
      onAplicarSugerencia(sugerenciaEncontrada);
      setSugerenciaEncontrada(null);
      setMensajeResultado('');
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-5 border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              Asistente Inteligente de Compra
              <span className="text-[10px] uppercase font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                IA Smart Seats
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              ¿No sabes qué elegir? Deja que el algoritmo busque los mejores asientos contiguos disponibles.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
        {/* Selector de personas */}
        <div className="sm:col-span-4 space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-400" /> Cantidad de Personas:
          </label>
          <div className="grid grid-cols-5 gap-1 bg-slate-950/60 p-1 rounded-2xl border border-white/10">
            {[1, 2, 3, 4, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setCantidad(num)}
                className={`py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  cantidad === num
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Preferencia de ubicación */}
        <div className="sm:col-span-8 space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Preferencia de Ubicación:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => setPreferencia('CENTRAL')}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border cursor-pointer ${
                preferencia === 'CENTRAL'
                  ? 'bg-indigo-600/30 border-indigo-400 text-white'
                  : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-indigo-300" />
              <span>Platea Central</span>
            </button>

            <button
              type="button"
              onClick={() => setPreferencia('VIP')}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border cursor-pointer ${
                preferencia === 'VIP'
                  ? 'bg-purple-600/30 border-purple-400 text-white'
                  : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Crown className="w-3 h-3 text-amber-400" />
              <span>Palco VIP</span>
            </button>

            <button
              type="button"
              onClick={() => setPreferencia('MESAS')}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border cursor-pointer ${
                preferencia === 'MESAS'
                  ? 'bg-emerald-600/30 border-emerald-400 text-white'
                  : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Coffee className="w-3 h-3 text-emerald-400" />
              <span>Mesa Lounge</span>
            </button>

            <button
              type="button"
              onClick={() => setPreferencia('ECONOMICO')}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border cursor-pointer ${
                preferencia === 'ECONOMICO'
                  ? 'bg-sky-600/30 border-sky-400 text-white'
                  : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3 h-3 text-sky-400" />
              <span>Económico</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <button
          onClick={buscarSugerenciaInteligente}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>Analizar y Sugerir Mejores {cantidad} Entradas</span>
        </button>

        {sugerenciaEncontrada && (
          <div className="flex items-center gap-3 w-full sm:w-auto animate-in slide-in-from-left-4">
            <span className="text-xs text-emerald-400 font-bold">
              {mensajeResultado}
            </span>
            <button
              onClick={aplicarYBloquear}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Aceptar y Reservar (10m)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
