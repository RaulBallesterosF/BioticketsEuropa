import React, { useState, useEffect, useRef } from 'react';
import { Evento, ValidacionResultado, Ticket } from '../types';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Scan,
  Users,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  Keyboard,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface GateScannerProps {
  evento: Evento;
  tickets: Ticket[];
  onValidarTicket: (codigo: string) => Promise<ValidacionResultado>;
}

export const GateScanner: React.FC<GateScannerProps> = ({
  evento,
  tickets,
  onValidarTicket,
}) => {
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);
  const [codigoManual, setCodigoManual] = useState('');
  const [resultado, setResultado] = useState<ValidacionResultado | null>(null);
  const [cooldown, setCooldown] = useState(0); // 5 segundos entre lecturas
  const [sonidoHabilitado, setSonidoHabilitado] = useState(true);
  const [historialEscaneos, setHistorialEscaneos] = useState<
    { id: string; estado: 'VALIDO' | 'USADO' | 'INVALIDO'; timestamp: string; mensaje: string }[]
  >([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cooldownIntervalRef = useRef<any>(null);

  // Métricas de aforo en tiempo real
  const ticketsEvento = tickets.filter((t) => t.eventoId === evento.id);
  const totalVendidas = ticketsEvento.length;
  const totalIngresadas = ticketsEvento.filter((t) => t.validado).length;
  const pendientesIngreso = Math.max(0, totalVendidas - totalIngresadas);
  const porcentajeAforo = totalVendidas > 0 ? Math.round((totalIngresadas / totalVendidas) * 100) : 0;

  // Manejo del temporizador de 5 segundos de espera entre lecturas
  useEffect(() => {
    if (cooldown > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
      clearInterval(cooldownIntervalRef.current);
    }
    return () => clearInterval(cooldownIntervalRef.current);
  }, [cooldown]);

  // Sintetizador de audio con Web Audio API (Ding de éxito / Buzz de error)
  const reproducirSonido = (tipo: 'EXITO' | 'ERROR') => {
    if (!sonidoHabilitado) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (tipo === 'EXITO') {
        // Ding armónico alegre
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        // Buzz grave de alerta
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        osc.frequency.setValueAtTime(140, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch {
      // AudioContext fallback silencioso
    }
  };

  // Encendido y apagado de la cámara WebRTC
  const toggleCamara = async () => {
    setErrorCamara(null);
    if (camaraActiva) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCamaraActiva(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCamaraActiva(true);
      } catch (err) {
        setErrorCamara('No se pudo acceder al dispositivo de cámara (permiso denegado o no disponible en este entorno). Utiliza el lector de teclado o pistola PDA abajo.');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const procesarValidacion = async (codigo: string) => {
    if (!codigo.trim() || cooldown > 0) return;

    try {
      const res = await onValidarTicket(codigo.trim());
      setResultado(res);

      if (res.estado === 'VALIDO') {
        reproducirSonido('EXITO');
      } else {
        reproducirSonido('ERROR');
      }

      // Iniciar cooldown de 5 segundos obligatorio
      setCooldown(5);

      // Agregar al historial de torniquete
      setHistorialEscaneos((prev) => [
        {
          id: codigo.trim(),
          estado: res.estado,
          timestamp: new Date().toLocaleTimeString('es-ES'),
          mensaje: res.mensaje,
        },
        ...prev.slice(0, 9),
      ]);

      setCodigoManual('');
    } catch (err: any) {
      const errorRes: ValidacionResultado = {
        ok: false,
        estado: 'INVALIDO',
        mensaje: '❌ Error de comunicación con el servidor',
      };
      setResultado(errorRes);
      reproducirSonido('ERROR');
      setCooldown(5);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Superior de Aforo en Tiempo Real */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl glass-panel flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Aforo Vendido</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{totalVendidas}</span>
            <span className="text-xs text-slate-400 block">entradas emitidas</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl glass-panel flex flex-col justify-between border-emerald-500/20">
          <div className="flex justify-between items-center text-emerald-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Ingresados</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-400">{totalIngresadas}</span>
            <span className="text-xs text-emerald-400/70 block">{porcentajeAforo}% de asistencia</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl glass-panel flex flex-col justify-between border-amber-500/20">
          <div className="flex justify-between items-center text-amber-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Por Ingresar</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-400">{pendientesIngreso}</span>
            <span className="text-xs text-slate-400 block">asistentes en camino</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl glass-panel flex flex-col justify-between">
          <div className="flex justify-between items-center text-indigo-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Lector & Audio</span>
            <button
              onClick={() => setSonidoHabilitado(!sonidoHabilitado)}
              className="text-slate-300 hover:text-white"
            >
              {sonidoHabilitado ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
          <div className="mt-2">
            <span className="text-xs font-bold text-white block">Torniquete Activo</span>
            <span className="text-[11px] text-slate-400">Cooldown: 5 segundos</span>
          </div>
        </div>
      </div>

      {/* Visor Principal de Escaneo con Cámara WebRTC */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-sm text-white">Escáner Óptico de Cámara (WebRTC)</h3>
            </div>
            <button
              onClick={toggleCamara}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                camaraActiva
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {camaraActiva ? (
                <>
                  <CameraOff className="w-4 h-4" />
                  <span>Detener Cámara</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Activar Cámara</span>
                </>
              )}
            </button>
          </div>

          {errorCamara && (
            <div className="p-3.5 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3">
              <span>{errorCamara}</span>
              <button
                type="button"
                onClick={() => setErrorCamara(null)}
                className="text-amber-400 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Marco de Visión de la Cámara con Laser Scan */}
          <div className="relative w-full aspect-video bg-slate-950 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">
            {camaraActiva ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Láser de barrido animado */}
                <div className="absolute inset-x-8 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-scan-laser pointer-events-none"></div>

                {/* Marco de encuadre QR */}
                <div className="absolute w-48 h-48 border-2 border-emerald-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-44 h-44 border border-dashed border-emerald-300/40 rounded-xl"></div>
                </div>
              </>
            ) : (
              <div className="text-center p-6 space-y-2">
                <Camera className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                <p className="text-xs text-slate-400 font-bold">
                  Cámara en pausa. Haz clic en "Activar Cámara" para iniciar el lector continuo.
                </p>
                <p className="text-[10px] text-slate-500">
                  Compatible con cámaras de iPhone, Android y PDA industriales.
                </p>
              </div>
            )}

            {/* Overlay de Cooldown de 5 segundos */}
            {cooldown > 0 && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-400 flex items-center justify-center text-2xl font-black text-indigo-300 font-mono animate-spin">
                  {cooldown}
                </div>
                <h4 className="text-sm font-bold text-white mt-3">Pausa entre lecturas</h4>
                <p className="text-xs text-slate-400">
                  Tiempo de espera de seguridad: {cooldown}s para siguiente ticket
                </p>
                <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${((5 - cooldown) / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Entrada Manual / Lector Láser PDA */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              procesarValidacion(codigoManual);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Código QR o lector PDA (Ej: ET-100201)"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                disabled={cooldown > 0}
                className="w-full bg-slate-950/80 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={cooldown > 0 || !codigoManual.trim()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs transition disabled:opacity-40 cursor-pointer"
            >
              Validar
            </button>
          </form>

          {/* Botones de Prueba Rápida de Tickets Existentes */}
          <div className="pt-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
              Pruebas Rápidas con Tickets del Sistema:
            </span>
            <div className="flex flex-wrap gap-2">
              {tickets.slice(0, 4).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => procesarValidacion(t.id)}
                  disabled={cooldown > 0}
                  className={`text-[11px] px-3 py-1.5 rounded-xl font-mono font-bold border transition ${
                    t.validado
                      ? 'bg-amber-950/40 text-amber-300 border-amber-600/40 hover:bg-amber-900/40'
                      : 'bg-indigo-950/60 text-indigo-200 border-indigo-500/40 hover:bg-indigo-900/60'
                  }`}
                >
                  Probar {t.id} ({t.validado ? 'Ya usado' : 'Sin usar'})
                </button>
              ))}
              <button
                type="button"
                onClick={() => procesarValidacion('ET-FAKE-999999')}
                disabled={cooldown > 0}
                className="text-[11px] px-3 py-1.5 rounded-xl font-mono font-bold bg-rose-950/40 text-rose-300 border border-rose-500/40 hover:bg-rose-900/40 transition"
              >
                Probar Falso (ET-FAKE-999999)
              </button>
            </div>
          </div>
        </div>

        {/* Panel Lateral: Gran Resultado de Validación & Historial */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tarjeta de Gran Impacto Visual según el Estado */}
          <div
            className={`p-6 rounded-3xl border transition-all duration-300 text-center space-y-4 ${
              !resultado
                ? 'bg-slate-900/40 border-white/10'
                : resultado.estado === 'VALIDO'
                ? 'bg-emerald-950/80 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                : resultado.estado === 'USADO'
                ? 'bg-amber-950/80 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                : 'bg-rose-950/80 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
            }`}
          >
            {!resultado ? (
              <div className="py-8 space-y-2">
                <Scan className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                <h4 className="text-base font-bold text-slate-300">Esperando Código</h4>
                <p className="text-xs text-slate-500">
                  Apunta la cámara al código QR de la entrada o ingrésalo arriba.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  {resultado.estado === 'VALIDO' && (
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                  )}
                  {resultado.estado === 'USADO' && (
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400">
                      <AlertTriangle className="w-10 h-10" />
                    </div>
                  )}
                  {resultado.estado === 'INVALIDO' && (
                    <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-rose-400">
                      <XCircle className="w-10 h-10" />
                    </div>
                  )}
                </div>

                <div>
                  <h3
                    className={`text-xl font-black ${
                      resultado.estado === 'VALIDO'
                        ? 'text-emerald-300'
                        : resultado.estado === 'USADO'
                        ? 'text-amber-300'
                        : 'text-rose-300'
                    }`}
                  >
                    {resultado.mensaje}
                  </h3>
                  {resultado.fechaValidacion && resultado.estado === 'USADO' && (
                    <p className="text-xs text-amber-200/80 mt-1">
                      Primer ingreso registrado:{' '}
                      {new Date(resultado.fechaValidacion).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </p>
                  )}
                </div>

                {resultado.ticket && (
                  <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/10 text-left space-y-1.5 text-xs">
                    <div className="flex justify-between font-mono font-bold text-indigo-300">
                      <span>{resultado.ticket.id}</span>
                      <span>{resultado.ticket.tipo}</span>
                    </div>
                    <div className="text-sm font-bold text-white">
                      {resultado.ticket.asientoNumero}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Comprador: {resultado.ticket.comprador}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Evento: {resultado.ticket.evento}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Historial de Torniquete en Vivo */}
          <div className="glass-panel rounded-3xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" /> Historial de Torniquete Reciente
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {historialEscaneos.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  Aún no se han registrado lecturas en esta sesión.
                </p>
              ) : (
                historialEscaneos.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex justify-between items-center text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.estado === 'VALIDO'
                            ? 'bg-emerald-400'
                            : item.estado === 'USADO'
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                      ></span>
                      <span className="font-mono font-bold text-white">{item.id}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reporte de Aforo en Vivo por Zonas y Localidades (Escenario 3) */}
      <div className="glass-panel rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Reporte en Vivo: Distribución de Aforo y Ocupación por Zona
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitoreo en tiempo real de puertas y aforos para prevención de aglomeraciones y control de accesos.
            </p>
          </div>
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Torniquetes Sincronizados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {(() => {
            const mapZonas: Record<string, { total: number; ingresadas: number }> = {};
            ticketsEvento.forEach((t) => {
              const key =
                t.zonaNombre ||
                (t.asientoNumero.includes('Palco')
                  ? 'Palcos VIP'
                  : t.asientoNumero.includes('Mesa')
                  ? 'Mesas Especiales'
                  : t.asientoNumero.includes('Pie') || t.asientoNumero.includes('Zona')
                  ? 'Zonas de Pie'
                  : 'Filas / Butacas');
              if (!mapZonas[key]) mapZonas[key] = { total: 0, ingresadas: 0 };
              mapZonas[key].total += 1;
              if (t.validado) mapZonas[key].ingresadas += 1;
            });

            const keys = Object.keys(mapZonas);
            if (keys.length === 0) {
              return (
                <div className="col-span-full py-4 text-center text-xs text-slate-500">
                  No hay tickets emitidos para este evento actualmente.
                </div>
              );
            }

            return keys.map((zonaKey) => {
              const data = mapZonas[zonaKey];
              const pct = data.total > 0 ? Math.round((data.ingresadas / data.total) * 100) : 0;
              return (
                <div
                  key={zonaKey}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white truncate">{zonaKey}</span>
                    <span className="font-mono text-emerald-400 font-bold">{pct}%</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>
                      Ingresaron: <strong className="text-white">{data.ingresadas}</strong>
                    </span>
                    <span>
                      Emitidas: <strong className="text-slate-300">{data.total}</strong>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};
