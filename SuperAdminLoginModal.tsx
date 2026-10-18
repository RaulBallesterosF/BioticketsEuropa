import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, X, Sparkles, AlertCircle } from 'lucide-react';

interface SuperAdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: 'admin' | 'scanner') => void;
}

export default function SuperAdminLoginModal({ isOpen, onClose, onLoginSuccess }: SuperAdminLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar credenciales de prueba
    if (email === 'admin@biotickets.eu' && password === 'admin123') {
      onLoginSuccess('admin');
    } else if (email === 'scanner@biotickets.eu' && password === 'gate123') {
      onLoginSuccess('scanner');
    } else {
      setError('Credenciales incorrectas. Utiliza las claves de prueba indicadas abajo.');
    }
  };

  const handleQuickLogin = (role: 'admin' | 'scanner') => {
    if (role === 'admin') {
      setEmail('admin@biotickets.eu');
      setPassword('admin123');
      onLoginSuccess('admin');
    } else {
      setEmail('scanner@biotickets.eu');
      setPassword('gate123');
      onLoginSuccess('scanner');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md glass-panel p-6 rounded-3xl border border-white/20 shadow-2xl bg-black/90">
        
        {/* Botón Cerrar */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">Acceso Restringido</h2>
            <p className="text-xs text-slate-400">Introduce tus credenciales de módulo</p>
          </div>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@biotickets.eu"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full apple-button-primary py-3 text-sm font-semibold mt-2 shadow-lg shadow-blue-600/30"
          >
            Iniciar Sesión
          </button>
        </form>

        {/* Acceso Rápido de Prueba */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-slate-400 font-medium mb-3 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" /> Credenciales Rápidas de Prueba:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('admin')}
              className="py-2 px-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs hover:bg-indigo-500/20 transition-all font-medium"
            >
              Acceso Admin
            </button>
            <button
              onClick={() => handleQuickLogin('scanner')}
              className="py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/20 transition-all font-medium"
            >
              Acceso Escáner
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
