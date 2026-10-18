import React, { useState } from 'react';
import { Ticket, ShieldCheck, QrCode, BarChart3, ChevronRight, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'b2c' | 'admin' | 'access'>('b2c');

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Dynamic Glass Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            Biotickets<span className="text-blue-500">Europa</span>
          </span>
        </div>

        {/* Module Selector */}
        <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
          <button
            onClick={() => setActiveTab('b2c')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'b2c' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Venta B2C
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'admin' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Panel Admin
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'access' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Control Accesos
          </button>
        </nav>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Plataforma White-Label Enterprise Operativa
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
          Boletería de Nueva Generación
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mb-10">
          Infraestructura de alto rendimiento desplegada con éxito en GoDaddy. Selección de asientos en Canvas, firmas de seguridad HMAC y pasarela directa.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="glass-panel p-6 glass-card-hover">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 border border-blue-500/30">
              <Ticket className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Venta Web B2C</h3>
            <p className="text-sm text-slate-400 mb-4">Experiencia de compra fluida con soporte para Apple Wallet y pagos con Stripe.</p>
            <span className="text-xs text-blue-400 font-medium inline-flex items-center gap-1">
              Módulo Activo <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div className="glass-panel p-6 glass-card-hover">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Panel de Control Admin</h3>
            <p className="text-sm text-slate-400 mb-4">Métricas en tiempo real, liquidación de promotores D+3 y reportes PyG.</p>
            <span className="text-xs text-indigo-400 font-medium inline-flex items-center gap-1">
              Módulo Activo <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div className="glass-panel p-6 glass-card-hover">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">App Control de Accesos</h3>
            <p className="text-sm text-slate-400 mb-4">Escaneo de entradas offline/online con validación anti-duplicados.</p>
            <span className="text-xs text-emerald-400 font-medium inline-flex items-center gap-1">
              Módulo Activo <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} BioticketsEuropa Engine. Todos los derechos reservados.
      </footer>
    </div>
  );
}
