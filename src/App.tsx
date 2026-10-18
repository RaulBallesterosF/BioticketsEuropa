import React, { useState } from 'react';
import { 
  Ticket, ShieldCheck, QrCode, BarChart3, ChevronRight, 
  Sparkles, Layers, MapPin, LogOut, Lock, X, Mail, AlertCircle, CheckCircle2
} from 'lucide-react';

type UserRole = 'guest' | 'admin' | 'scanner';

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'b2c' | 'admin' | 'scanner'>('landing');
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [pendingModule, setPendingModule] = useState<'admin' | 'scanner' | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Interceptor de Navegación por Roles
  const handleModuleClick = (targetModule: 'b2c' | 'admin' | 'scanner') => {
    if (targetModule === 'b2c') {
      setActiveTab('b2c');
    } else {
      if (userRole === targetModule || userRole === 'admin') {
        setActiveTab(targetModule);
      } else {
        setPendingModule(targetModule);
        setIsLoginOpen(true);
      }
    }
  };

  // Manejo de Formulario de Inicio de Sesión
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (email === 'admin@biotickets.eu' && password === 'admin123') {
      setUserRole('admin');
      setIsLoginOpen(false);
      if (pendingModule) setActiveTab(pendingModule);
    } else if (email === 'scanner@biotickets.eu' && password === 'gate123') {
      setUserRole('scanner');
      setIsLoginOpen(false);
      if (pendingModule) setActiveTab(pendingModule);
    } else {
      setLoginError('Credenciales incorrectas. Usa los accesos rápidos de prueba.');
    }
  };

  const handleQuickLogin = (role: 'admin' | 'scanner') => {
    setUserRole(role);
    setIsLoginOpen(false);
    if (pendingModule) setActiveTab(pendingModule);
  };

  const handleLogout = () => {
    setUserRole('guest');
    setActiveTab('landing');
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Header Glass estilo Apple */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/50 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white block leading-none">
              Biotickets<span className="text-blue-500">Europa</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">White-Label Enterprise</span>
          </div>
        </div>

        {/* Módulos de Navegación */}
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-full border border-white/10 backdrop-blur-lg">
            <button
              onClick={() => handleModuleClick('b2c')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'b2c' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Venta B2C
            </button>
            <button
              onClick={() => handleModuleClick('admin')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Panel Admin
            </button>
            <button
              onClick={() => handleModuleClick('scanner')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'scanner' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Control Accesos
            </button>
          </nav>

          {userRole !== 'guest' && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-xs font-medium flex items-center gap-1.5 px-3"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          )}
        </div>
      </header>

      {/* ÁREA PRINCIPAL DINÁMICA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center">

        {/* 1. LANDING PAGE PRINCIPAL */}
        {activeTab === 'landing' && (
          <div className="flex flex-col items-center text-center py-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Plataforma White-Label Enterprise Operativa
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
              Boletería de Nueva Generación
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mb-10">
              Infraestructura de alto rendimiento desplegada en GoDaddy. Selección de asientos en Canvas, firmas de seguridad HMAC y pasarela directa.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
              <div 
                onClick={() => handleModuleClick('b2c')}
                className="glass-panel p-6 glass-card-hover cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 border border-blue-500/30 group-hover:scale-110 transition-transform">
                  <Ticket className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Venta Web B2C</h3>
                <p className="text-sm text-slate-400 mb-4">Experiencia de compra interactiva en Canvas con soporte para Apple Wallet y Stripe.</p>
                <span className="text-xs text-blue-400 font-medium inline-flex items-center gap-1">
                  Acceso Público Libre <ChevronRight className="w-3 h-3" />
                </span>
              </div>

              <div 
                onClick={() => handleModuleClick('admin')}
                className="glass-panel p-6 glass-card-hover cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Panel de Control Admin</h3>
                <p className="text-sm text-slate-400 mb-4">Métricas en tiempo real, liquidación de promotores D+3 y reportes PyG.</p>
                <span className="text-xs text-indigo-400 font-medium inline-flex items-center gap-1">
                  Requiere Login Promotor <Lock className="w-3 h-3" />
                </span>
              </div>

              <div 
                onClick={() => handleModuleClick('scanner')}
                className="glass-panel p-6 glass-card-hover cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">App Control de Accesos</h3>
                <p className="text-sm text-slate-400 mb-4">Escaneo de entradas offline/online en puertas con validación HMAC anti-duplicados.</p>
                <span className="text-xs text-emerald-400 font-medium inline-flex items-center gap-1">
                  Requiere Login Validador <Lock className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. MÓDULO B2C */}
        {activeTab === 'b2c' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-6 rounded-3xl border border-white/10">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
                  <Sparkles className="w-3 h-3" /> Evento en Vivo
                </span>
                <h2 className="text-3xl font-bold text-white tracking-tight">Gala Internacional Biotickets Europa</h2>
                <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-blue-500" /> Palacio de Congresos — Madrid, España
                </p>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center py-16">
              <Ticket className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Mapa de Asientos Canvas Interactivo</h3>
              <p className="text-slate-400 max-w-md mx-auto text-sm">
                Módulo de Venta Directa Activo. Preparado para selección de asientos y cobro mediante pasarela Stripe.
              </p>
            </div>
          </div>
        )}

        {/* 3. MÓDULO ADMIN */}
        {activeTab === 'admin' && (
          <div className="space-y-8">
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-indigo-400" /> Panel de Control PyG & Métricas
                </h2>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sesión Admin Activa
                </span>
              </div>
              <p className="text-slate-400 text-sm">Módulo de Administración y Liquidación D+3 autenticado con éxito.</p>
            </div>
          </div>
        )}

        {/* 4. MÓDULO SCANNER */}
        {activeTab === 'scanner' && (
          <div className="max-w-2xl mx-auto glass-panel p-8 rounded-3xl border border-white/10 text-center">
            <QrCode className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Control de Accesos en Puerta</h2>
            <p className="text-slate-400 text-sm mb-6">Escáner de validación con firmas criptográficas HMAC activado.</p>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sesión Validador Activa
            </span>
          </div>
        )}
      </main>

      {/* MODAL INTEGRADO DE LOGIN */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md glass-panel p-6 rounded-3xl border border-white/20 shadow-2xl bg-black/90">
            <button 
              onClick={() => setIsLoginOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">Acceso Restringido</h2>
                <p className="text-xs text-slate-400">Introduce tus credenciales de módulo</p>
              </div>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
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
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} BioticketsEuropa Engine. Sistema SaaS Marca Blanca Enterprise.
      </footer>
    </div>
  );
}
