import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, Key, CheckCircle2 } from 'lucide-react';
import { Usuario } from '../types';

interface SuperAdminLoginModalProps {
  onLoginExitoso: (user: Usuario) => void;
  onCancelar?: () => void;
}

export const SuperAdminLoginModal: React.FC<SuperAdminLoginModalProps> = ({
  onLoginExitoso,
  onCancelar,
}) => {
  const [email, setEmail] = useState('superadmin@eurotickets.pro');
  const [password, setPassword] = useState('admin2026');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    setTimeout(() => {
      if (email.toLowerCase().includes('admin') || password.length >= 4) {
        const superAdminUser: Usuario = {
          id: 1,
          nombre: 'Super Administrador Global',
          email,
          rol: 'SUPER_ADMIN',
          permisos: [
            'CREAR_EVENTO',
            'EDITAR_EVENTO',
            'DISEÑAR_MAPA',
            'FIJAR_PRECIOS',
            'LIQUIDAR_PROMOTORES',
            'VER_ANALITICAS',
            'CONTROL_ACCESO',
          ],
        };
        onLoginExitoso(superAdminUser);
      } else {
        setError('Credenciales inválidas. Usa el botón de acceso rápido.');
        setCargando(false);
      }
    }, 600);
  };

  const handleAccesoRapido = () => {
    setEmail('superadmin@eurotickets.pro');
    setPassword('admin2026');
    const superAdminUser: Usuario = {
      id: 1,
      nombre: 'Super Administrador Global',
      email: 'superadmin@eurotickets.pro',
      rol: 'SUPER_ADMIN',
      permisos: [
        'CREAR_EVENTO',
        'EDITAR_EVENTO',
        'DISEÑAR_MAPA',
        'FIJAR_PRECIOS',
        'LIQUIDAR_PROMOTORES',
        'VER_ANALITICAS',
        'CONTROL_ACCESO',
      ],
    };
    onLoginExitoso(superAdminUser);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-purple-500/30 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-slate-900 border-b border-white/10 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-3 shadow-lg shadow-purple-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/40 inline-block mb-1">
            ESCENARIO 1: BACKEND SUPERADMIN
          </span>
          <h3 className="text-xl font-black text-white">Acceso al Panel de Control</h3>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de eventos, diseño de mapas de asientos, fijación de precios y configuración de aforo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Usuario / Correo SuperAdmin
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 pl-9 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Contraseña Maestra
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 pl-9 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer"
          >
            {cargando ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <span>Iniciar Sesión como SuperAdmin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleAccesoRapido}
              className="w-full py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>⚡ Ingreso Rápido con 1 Clic (Demo SuperAdmin)</span>
            </button>
          </div>

          {onCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              className="w-full text-center text-xs text-slate-400 hover:text-white pt-1"
            >
              Volver a la Web de Clientes (B2C)
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
