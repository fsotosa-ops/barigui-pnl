'use client';
import { 
  LayoutDashboard, 
  ListOrdered, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  activeView: string;
  setView: (view: 'dash' | 'transactions' | 'settings') => void;
  onLogout?: () => void;
}

export const Sidebar = ({ isOpen, toggle, activeView, setView, onLogout }: SidebarProps) => {
  const menuItems = [
    { id: 'dash', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'transactions', label: 'Flujos de Caja', icon: <ListOrdered size={20} /> },
    { id: 'settings', label: 'Variables', icon: <Settings size={20} /> },
  ];

  return (
    <aside 
      className={`h-screen bg-slate-950 text-white transition-all duration-300 ease-in-out flex flex-col fixed left-0 top-0 z-50 ${
        isOpen ? 'w-64' : 'w-24'
      }`}
    >
      {/* Header Fluxo Branding */}
      <div className="h-24 flex items-center justify-center border-b border-slate-900 relative">
        <div className="flex items-center gap-3 overflow-hidden px-4">
          <div className="bg-gradient-to-tr from-emerald-400 to-cyan-400 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/10 shrink-0">
             <TrendingUp size={24} className="text-slate-900" />
          </div>
          <span className={`font-black text-2xl tracking-tighter transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
            FLUXO<span className="text-emerald-400">.</span>
          </span>
        </div>
        
        <button 
          onClick={toggle}
          className="absolute -right-3 top-10 bg-emerald-500 text-white p-1 rounded-full shadow-lg hover:bg-emerald-400 transition-colors z-10"
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-1 py-10 px-4 space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as any)}
            className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all group relative ${
              activeView === item.id 
                ? 'bg-slate-900 text-emerald-400 shadow-xl border border-slate-800' 
                : 'text-slate-500 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <div className={`shrink-0 transition-colors ${activeView === item.id ? 'text-emerald-400' : 'group-hover:text-emerald-400'}`}>
                {item.icon}
            </div>
            <span className={`text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
              {item.label}
            </span>
            
            {/* Tooltip para modo colapsado */}
            {!isOpen && (
              <div className="absolute left-20 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-slate-800 shadow-2xl z-50 whitespace-nowrap">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-6 border-t border-slate-900">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 p-4 text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/5 rounded-2xl transition-all group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className={`text-sm font-bold overflow-hidden transition-all ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
            Cerrar Sesión
          </span>
        </button>
      </div>
    </aside>
  );
};