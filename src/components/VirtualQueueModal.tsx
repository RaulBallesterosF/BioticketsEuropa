import React, { useState, useEffect } from 'react';
import { Users, Clock, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface VirtualQueueModalProps {
  eventoNombre: string;
  onTurnoLlegado: () => void;
  onCancelar: () => void;
}

export const VirtualQueueModal: React.FC<VirtualQueueModalProps> = ({
  eventoNombre,
  onTurnoLlegado,
  onCancelar,
}) => {
  const [posicion, setPosicion] = useState(142);
  const [progreso, setProgreso] = useState(25);
  const [tiempoEstimadoMin, setTiempoEstimadoMin] = useState(2);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosicion((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(onTurnoLlegado, 600);
          return 0;
        }
        const delta = Math.floor(15 + Math.random() * 25);
        const nuevo = Math.max(0, prev - delta);
        setProgreso(Math.min(100, Math.round(((142 - nuevo) / 142) * 100)));
        return nuevo;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [onTurnoLlegado]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-md rounded-3xl p-6 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 mx-auto">
          <Users className="w-8 h-8 animate-pulse" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            Virtual Queue Engine
          </span>
          <h3 className="text-xl font-black text-white mt-2">Sala de Espera Virtual</h3>
          <p className="text-xs text-slate-400 mt-1">
            Estás en la fila ordenada para <strong>{eventoNombre}</strong>.
            Mantenemos tu turno de forma justa y protegemos el sistema contra sobrecargas.
          </p>
        </div>

        {/* Turno y Posición */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Tu Turno en Fila:</span>
            <span className="font-mono text-2xl font-black text-emerald-400">
              #{posicion > 0 ? posicion : '¡ES TU TURNO!'}
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full transition-all duration-700 ease-out"
              style={{ width: `${progreso}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>Progreso de entrada: {progreso}%</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              Tiempo est.: {posicion > 0 ? '< 1 min' : 'Accediendo...'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Protegido contra bots y acaparadores. No refresques la pantalla.</span>
        </div>

        <button
          onClick={onCancelar}
          className="text-xs text-slate-500 hover:text-slate-300 transition"
        >
          Salir de la Fila
        </button>
      </div>
    </div>
  );
};
