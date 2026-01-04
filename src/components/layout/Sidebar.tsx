'use client';
import { 
  LayoutDashboard, 
  ListOrdered, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  Wallet
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  activeView: string;
  setView: (view: 'dash' | 'transactions' | 'settings') => void;
}

export const Sidebar = ({ isOpen, toggle, activeView, setView }: SidebarProps) => {
  const menuItems = [
    { id: 'dash', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'transactions', label: 'Movimientos', icon: <ListOrdered size={20} /> },
    { id: 'settings', label: 'Configuración', icon: <Settings size={20} /> },
  ];

  return (
    <aside 
      className={`h-screen bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col fixed left-0 top-0 z-50 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Header del Sidebar */}
      <div className="h-20 flex items-center justify-center border-b border-slate-800 relative">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="bg-emerald-500 p-1.5 rounded-lg">
             <Wallet size={24} className="text-white" />
          </div>
          <span className={`font-black text-lg tracking-tight transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
            CFO<span className="text-emerald-400">Personal</span>
          </span>
        </div>
        
        {/* Botón Colapsar */}
        <button 
          onClick={toggle}
          className="absolute -right-3 top-8 bg-emerald-500 text-white p-1 rounded-full shadow-lg hover:bg-emerald-400 transition-colors"
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as any)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${
              activeView === item.id 
                ? 'bg-slate-800 text-emerald-400 shadow-md border-l-4 border-emerald-500' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="shrink-0">{item.icon}</div>
            <span className={`text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
              {item.label}
            </span>
            
            {/* Tooltip cuando está colapsado */}
            {!isOpen && (
              <div className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center gap-4 p-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
          <LogOut size={20} />
          <span className={`text-sm font-bold overflow-hidden transition-all ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
            Salir
          </span>
        </button>
      </div>
    </aside>
  );
};