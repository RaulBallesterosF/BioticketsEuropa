import React, { useState } from 'react';
import { 
  Ticket, ShieldCheck, QrCode, BarChart3, ChevronRight, 
  Sparkles, Calendar, Layers, DollarSign, Settings, Lock, MapPin
} from 'lucide-react';

// Importación de tus componentes reales
import SeatMapCanvas from './components/SeatMapCanvas';
import GateScanner from './components/GateScanner';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import EventManager from './components/EventManager';
import FinancialSettlement from './components/FinancialSettlement';
import CheckoutModal from './components/CheckoutModal';
import TicketPassModal from './components/TicketPassModal';
import NotificationCenterModal from './components/NotificationCenterModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'b2c' | 'admin' | 'scanner'>('b2c');
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPassOpen, setIsPassOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header Glass estilo Apple */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/50 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('b2c')}>
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

        {/* Selector Navegación de Módulos Operativos */}
        <nav className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-full border border-white/10 backdrop-blur-lg">
          <button
            onClick={() => setActiveTab('b2c')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'b2c' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            Venta Boletos (SeatMap)
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Panel Control PyG
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'scanner' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Escáner Accesos
          </button>
        </nav>
      </header>

      {/* Contenido Dinámico según la Pestaña Activa */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        
        {/* MÓDULO 1: VENTA B2C CON MAPA DE ASIENTOS EN CANVAS */}
        {activeTab === 'b2c' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-6 rounded-3xl border border-white/10">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
                  <Sparkles className="w-3 h-3" /> Evento en Vivo
                </span>
                <h2 className="text-3xl font-bold text-white tracking-tight">Gran Gala EuroTickets Europa</h2>
                <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-blue-500" /> Palacio de Congresos — Madrid, España
                </p>
              </div>
              
              <button 
                onClick={() => setIsCheckoutOpen(true)}
                className="apple-button-primary px-6 py-3 text-sm flex items-center gap-2"
              >
                Comprar Entradas Directas <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Componente del Mapa de Asientos Interactivo */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" /> Selecciona tu Asiento en el Recinto
              </h3>
              <SeatMapCanvas onSeatSelect={(seat) => {
                setSelectedSeat(seat);
                setIsCheckoutOpen(true);
              }} />
            </div>
          </div>
        )}

        {/* MÓDULO 2: PANEL DE CONTROL Y ANALÍTICAS PYG */}
        {activeTab === 'admin' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="glass-panel p-6 rounded-3xl">
              <AnalyticsDashboard />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-panel p-6 rounded-3xl">
                <EventManager />
              </div>
              <div className="glass-panel p-6 rounded-3xl">
                <FinancialSettlement />
              </div>
            </div>
          </div>
        )}

        {/* MÓDULO 3: ESCÁNER DE CONTROL DE ACCESOS QR */}
        {activeTab === 'scanner' && (
          <div className="max-w-2xl mx-auto glass-panel p-8 rounded-3xl animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-emerald-500" /> Control de Accesos en Puerta
            </h2>
            <p className="text-sm text-slate-400 mb-6">Escaneo e ingesta de entradas con verificación anti-duplicados HMAC offline/online.</p>
            <GateScanner />
          </div>
        )}
      </main>

      {/* Modales Interactivos del Sistema */}
      {isCheckoutOpen && (
        <CheckoutModal 
          seat={selectedSeat} 
          onClose={() => setIsCheckoutOpen(false)} 
          onSuccess={() => {
            setIsCheckoutOpen(false);
            setIsPassOpen(true);
          }}
        />
      )}

      {isPassOpen && (
        <TicketPassModal 
          onClose={() => setIsPassOpen(false)} 
        />
      )}

      {/* Pie de Página */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} BioticketsEuropa Engine. Sistema SaaS Marca Blanca Enterprise.
      </footer>
    </div>
  );
}
