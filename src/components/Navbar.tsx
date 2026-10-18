import React from 'react';
import { Usuario, Promotor } from '../types';
import {
  Ticket,
  Building2,
  Calendar,
  Compass,
  QrCode,
  BarChart3,
  LogOut,
  Sparkles,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Download,
  Bell,
  Crown,
  Server,
} from 'lucide-react';

interface NavbarProps {
  usuario: Usuario | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  promotores: Promotor[];
  promotorActivo: Promotor;
  setPromotorActivo: (p: Promotor) => void;
  ticketsCount: number;
  onCambiarRol: (rol: Usuario['rol']) => void;
  unreadNotifCount?: number;
  onAbrirNotificaciones?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  usuario,
  onLogout,
  activeTab,
  setActiveTab,
  promotores,
  promotorActivo,
  setPromotorActivo,
  ticketsCount,
  onCambiarRol,
  unreadNotifCount = 0,
  onAbrirNotificaciones,
}) => {
  return (
    <header className="w-full glass-panel rounded-3xl p-4 md:p-6 mb-6 flex flex-col gap-4">
      {/* Barra superior de Marca Blanca y Tenant */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                SaaS White-Label Enterprise
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Split Payments D+3
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              EuroTickets <span className="text-indigo-400 font-normal">Pro</span>
            </h1>
          </div>
        </div>

        {/* Tenant Switcher & User Profile */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Selector de Promotor / Subdominio Marca Blanca */}
          <div className="flex items-center gap-2 bg-slate-950/70 border border-white/10 px-3 py-1.5 rounded-2xl">
            <Building2 className="w-4 h-4 text-slate-400" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                Promotor Activo:
              </span>
              <select
                value={promotorActivo.id}
                onChange={(e) => {
                  const p = promotores.find((x) => x.id === parseInt(e.target.value));
                  if (p) setPromotorActivo(p);
                }}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                {promotores.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.nombreEmpresa.split('/')[0]} ({p.nitNif})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Role Tester Switcher */}
          {usuario && (
            <div className="flex items-center gap-1 bg-slate-950/70 border border-white/10 px-2 py-1.5 rounded-2xl">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 ml-1" />
              <span className="text-[9px] font-bold text-slate-400 hidden sm:inline">Rol:</span>
              <select
                value={usuario.rol}
                onChange={(e) => onCambiarRol(e.target.value as Usuario['rol'])}
                className="bg-transparent text-xs font-bold text-indigo-300 focus:outline-none cursor-pointer px-1"
                title="Cambiar rol para probar permisos"
              >
                <option value="SUPER_ADMIN" className="bg-slate-900 text-white">Super Admin</option>
                <option value="PROMOTOR" className="bg-slate-900 text-white">Promotor</option>
                <option value="VALIDADOR" className="bg-slate-900 text-white">Validador Puerta</option>
                <option value="FAN" className="bg-slate-900 text-white">Fan Comprador</option>
              </select>
            </div>
          )}

          {/* Botón de Notificaciones con Badge */}
          <button
            onClick={onAbrirNotificaciones}
            className="p-2.5 rounded-2xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 transition flex items-center gap-1.5 text-xs font-bold relative cursor-pointer"
            title="Centro de Notificaciones Push"
          >
            <Bell className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Avisos</span>
            {unreadNotifCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-[10px] text-white font-black flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/50">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {usuario && (
            <button
              onClick={onLogout}
              className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Selección de Escenarios Principales */}
      <div className="flex flex-wrap gap-2 items-center p-2 rounded-2xl bg-slate-950/80 border border-white/10 w-full">
        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-2 hidden md:inline">
          Escenarios:
        </span>

        {/* 1. Backend SuperAdmin */}
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            ['events', 'studio', 'settlement', 'analytics', 'promoters'].includes(activeTab)
              ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-purple-400" />
          <span>1. SuperAdmin Backend</span>
        </button>

        {/* 2. Web Cliente Fan B2C */}
        <button
          onClick={() => setActiveTab('b2c')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            ['b2c', 'tickets'].includes(activeTab)
              ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>2. Web Cliente Fan B2C</span>
        </button>

        {/* 3. App Control de Acceso Puerta */}
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'scanner'
              ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/50 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
          <span>3. App Puerta & Aforo</span>
        </button>

        {/* 4. Servidor AWS & GoDaddy */}
        <button
          onClick={() => setActiveTab('godaddy')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ml-auto cursor-pointer ${
            activeTab === 'godaddy'
              ? 'bg-teal-600/30 text-teal-200 border border-teal-500/50 shadow-md'
              : 'text-teal-400 hover:text-white hover:bg-teal-500/10 border border-transparent'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-teal-400" />
          <span>📦 Servidor AWS / GoDaddy</span>
        </button>
      </div>

      {/* Sub-navegación por Módulos según el Escenario Activo */}
      <nav className="flex flex-wrap gap-2 items-center w-full">
        {/* Submódulos de Escenario 1: Backend SuperAdmin */}
        {['events', 'studio', 'settlement', 'analytics', 'promoters'].includes(activeTab) && (
          <>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 border border-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Eventos & PULEP</span>
            </button>

            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 border border-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Compass className="w-4 h-4 text-purple-400" />
              <span>SeatMap Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('settlement')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'settlement'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 border border-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Liquidación D+3</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 border border-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Analíticas & PyG</span>
            </button>

            <button
              onClick={() => setActiveTab('promoters')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'promoters'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 border border-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Promotores & Tenants</span>
            </button>
          </>
        )}

        {/* Submódulos de Escenario 2: Web Cliente Fan B2C */}
        {['b2c', 'tickets'].includes(activeTab) && (
          <>
            <button
              onClick={() => setActiveTab('b2c')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'b2c'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 border border-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Taquilla & Plano Interactivo</span>
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition relative cursor-pointer ${
                activeTab === 'tickets'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 border border-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Ticket className="w-4 h-4 text-sky-400" />
              <span>Mis Entradas (WhatsApp/Email/PDF)</span>
              {ticketsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-[10px] text-white font-extrabold">
                  {ticketsCount}
                </span>
              )}
            </button>
          </>
        )}

        {/* Submódulos de Escenario 3: Control de Acceso Puerta */}
        {activeTab === 'scanner' && (
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <QrCode className="w-3.5 h-3.5" /> Modo Validación en Puerta Activo
            </span>
            <span className="text-slate-400 text-[11px]">
              Escaneo con cámara WebRTC, cooldown anti-duplicado de 5s y tacómetro de aforo en tiempo real.
            </span>
          </div>
        )}

        {/* Submódulo de Despliegue AWS & GoDaddy */}
        {activeTab === 'godaddy' && (
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-bold text-teal-300 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              <Server className="w-3.5 h-3.5" /> Servidor Backend y Paquetes de Producción
            </span>
            <span className="text-slate-400 text-[11px]">
              Descarga en 1 clic paquetes listos para subir a GoDaddy (cPanel) o AWS (EC2/Docker/Beanstalk).
            </span>
          </div>
        )}
      </nav>
    </header>
  );
};
