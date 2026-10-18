import React, { useState } from 'react';
import { Promotor } from '../types';
import {
  Building2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  DollarSign,
  Palette,
} from 'lucide-react';

interface PromotersManagerProps {
  promotores: Promotor[];
  onCrearPromotor: (p: Omit<Promotor, 'id'>) => Promise<void>;
}

export const PromotersManager: React.FC<PromotersManagerProps> = ({
  promotores,
  onCrearPromotor,
}) => {
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [nitNif, setNitNif] = useState('');
  const [direccionLegal, setDireccionLegal] = useState('');
  const [representanteLegal, setRepresentanteLegal] = useState('');
  const [correo, setCorreo] = useState('');
  const [iban, setIban] = useState('');
  const [comisionPactadaPct, setComisionPactadaPct] = useState(5.0);
  const [retencionGarantiaPct, setRetencionGarantiaPct] = useState(10.0);
  const [subdominio, setSubdominio] = useState('');
  const [colorPrimario, setColorPrimario] = useState('#6366f1');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');
    try {
      await onCrearPromotor({
        nombreEmpresa,
        nitNif,
        direccionLegal,
        representanteLegal,
        correo,
        iban,
        comisionPactadaPct: Number(comisionPactadaPct),
        retencionGarantiaPct: Number(retencionGarantiaPct),
        contratoFirmado: true,
        subdominio: subdominio || `${nombreEmpresa.toLowerCase().replace(/[^a-z0-9]/g, '')}.eurotickets.pro`,
        colorPrimario,
      });

      setMensaje('¡Promotor / Empresario legal registrado con éxito!');
      setNombreEmpresa('');
      setNitNif('');
      setDireccionLegal('');
      setRepresentanteLegal('');
      setCorreo('');
      setIban('');
      setTimeout(() => setMensaje(''), 4000);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            Módulo 1: Multi-Tenancy & Cumplimiento Legal
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">
            Gestión Legal de Promotores y Marca Blanca
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registro de Razón Social, NIF/NIT (Europa/Colombia), cuentas IBAN de dispersión y parámetros de split payments.
          </p>
        </div>
      </div>

      {mensaje && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{mensaje}</span>
        </div>
      )}

      {/* Formulario de Alta de Promotor */}
      <div className="glass-panel rounded-3xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-400" />
          Alta de Nuevo Promotor / Organización de Eventos
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Razón Social de la Empresa
              </label>
              <input
                type="text"
                required
                placeholder="Ej. EuroEvents S.L."
                value={nombreEmpresa}
                onChange={(e) => setNombreEmpresa(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                NIF (Europa) / NIT (Colombia)
              </label>
              <input
                type="text"
                required
                placeholder="B-87654321 o 900.123.456-7"
                value={nitNif}
                onChange={(e) => setNitNif(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Representante Legal
              </label>
              <input
                type="text"
                required
                placeholder="Nombre del apoderado"
                value={representanteLegal}
                onChange={(e) => setRepresentanteLegal(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Dirección Fiscal Completa
              </label>
              <input
                type="text"
                required
                placeholder="Paseo de la Castellana 100, Madrid"
                value={direccionLegal}
                onChange={(e) => setDireccionLegal(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Correo Electrónico Notificaciones
              </label>
              <input
                type="email"
                required
                placeholder="finanzas@promotor.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Cuenta Bancaria / IBAN (Para Dispersión)
              </label>
              <input
                type="text"
                required
                placeholder="ES9121000418450200051321"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Comisión Pactada Plataforma (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={comisionPactadaPct}
                onChange={(e) => setComisionPactadaPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Fondo Reserva Contracargos D+3 (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={retencionGarantiaPct}
                onChange={(e) => setRetencionGarantiaPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Subdominio Marca Blanca
              </label>
              <input
                type="text"
                placeholder="festival.eurotickets.pro"
                value={subdominio}
                onChange={(e) => setSubdominio(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar y Habilitar Promotor</span>
            </button>
          </div>
        </form>
      </div>

      {/* Directorio de Promotores Registrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promotores.map((p) => (
          <div
            key={p.id}
            className="glass-panel rounded-3xl p-5 space-y-3 relative overflow-hidden"
          >
            <div
              className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
              style={{ backgroundColor: p.colorPrimario || '#6366f1' }}
            ></div>

            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 block">
                  NIF/NIT: {p.nitNif}
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">{p.nombreEmpresa}</h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <FileCheck className="w-3 h-3" /> Contrato Vigente
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-400">
              <p>Representante: <strong className="text-slate-200">{p.representanteLegal}</strong></p>
              <p>Dirección: <strong className="text-slate-200">{p.direccionLegal}</strong></p>
              <p>Contacto: <strong className="text-slate-200">{p.correo}</strong></p>
              <p className="font-mono text-emerald-400">IBAN: {p.iban}</p>
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[11px] text-slate-400">
              <span>Comisión EuroTickets: <strong className="text-white">{p.comisionPactadaPct}%</strong></span>
              <span>Retención D+3: <strong className="text-amber-400">{p.retencionGarantiaPct}%</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
