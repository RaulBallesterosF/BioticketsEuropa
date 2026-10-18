import React, { useState } from 'react';
import { 
  Ticket, ShieldCheck, QrCode, BarChart3, ChevronRight, 
  Sparkles, Layers, MapPin, LogOut, Lock, UserCheck
} from 'lucide-react';

// Importación de componentes del sistema
import SeatMapCanvas from './components/SeatMapCanvas';
import GateScanner from './components/GateScanner';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import EventManager from './components/EventManager';
import FinancialSettlement from './components/FinancialSettlement';
import CheckoutModal from './components/CheckoutModal';
import TicketPassModal from './components/TicketPassModal';
import SuperAdminLoginModal from './components/SuperAdminLoginModal';

type UserRole = 'guest' | 'admin' | 'scanner';

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'b2c' | 'admin' | 'scanner'>('landing');
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [pendingModule, setPendingModule] = useState<'admin' | 'scanner' | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPassOpen, setIsPassOpen] = useState(false);

  // Manejador de clics en los módulos con interceptor de Auth
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

  // Cierre de sesión y retorno a la Landing Page
  const handleLogout = () => {
    setUserRole('guest');
    setActiveTab('landing');
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Dynamic Glass Header estilo Apple */}
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

        {/* Navegación y Acciones del Header */}
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

          {/* Botón de Cerrar Sesión si hay usuario autenticado */}
          {userRole !== 'guest' && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-xs font-medium flex items-center gap-1.5 px-3"
              title="Cerrar Sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          )}
        </div>
      </header>

      {/* ÁREA PRINCIPAL DINÁMICA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center">

        {/* 1. LANDING PAGE INICIAL (PORTADA) */}
        {activeTab === 'landing' && (
          <div className="flex flex-col items-center text-center py-12 animate-fadeIn">
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

            {/* Grid de Tarjetas Interactivas con Solicitud de Login */}
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
                  Acceso Público <ChevronRight className="w-3 h-3" />
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

        {/* 2. MÓDULO VENTA B2C (MAPA DE ASIENTOS CANVAS) */}
        {activeTab === 'b2c' && (
          <div className="space-y-8 animate-fadeIn">
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
              <button 
                onClick={() => setIsCheckoutOpen(true)}
                className="apple-button-primary px-6 py-3 text-sm flex items-center gap-2"
              >
                Comprar Entradas Directas <ChevronRight className="w-4 h-4" />
              </button>
            </div>

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

        {/* 3. MÓDULO ADMIN (PANEL PYG Y GESTIÓN DE EVENTOS) */}
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

        {/* 4. MÓDULO SCANNER (CONTROL DE ACCESOS EN PUERTA) */}
        {activeTab === 'scanner' && (
          <div className="max-w-2xl mx-auto glass-panel p-8 rounded-3xl animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-emerald-500" /> Control de Accesos en Puerta
            </h2>
            <p className="text-sm text-slate-400 mb-6">Validación de códigos QR mediante firmas criptográficas HMAC.</p>
            <GateScanner />
          </div>
        )}
      </main>

      {/* MODAL DE AUTENTICACIÓN / LOGIN POR CREDENCIALES */}
      {isLoginOpen && (
        <SuperAdminLoginModal 
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={(role: UserRole) => {
            setUserRole(role);
            setIsLoginOpen(false);
            if (pendingModule) {
              setActiveTab(pendingModule);
              setPendingModule(null);
            }
          }}
        />
      )}

      {/* MODALES DE COMPRA Y PASS */}
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
        <TicketPassModal onClose={() => setIsPassOpen(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} BioticketsEuropa Engine. Sistema SaaS Marca Blanca Enterprise.
      </footer>
    </div>
  );
}
