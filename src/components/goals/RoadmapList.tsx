'use client';
import { useState } from 'react';
import { 
  CheckCircle2, Circle, Plus, Trash2, Calendar, 
  ArrowUp, Minus, ArrowDown 
} from 'lucide-react';
import { Task } from '@/types/finance';

interface RoadmapListProps {
  tasks: Task[];
  onAdd: (task: { title: string; impact: 'high' | 'medium' | 'low'; dueDate: string }) => void;
  onToggle: (id: number, currentStatus: boolean) => void;
  onDelete: (id: number) => void;
  compact?: boolean;
}

export const RoadmapList = ({ tasks, onAdd, onToggle, onDelete, compact = false }: RoadmapListProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [impact, setImpact] = useState<'high' | 'medium' | 'low'>('high');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({ title, impact, dueDate });
    setTitle('');
    setImpact('high');
    setDueDate('');
    setIsAdding(false);
  };

  // Ordenamiento Agile: Prioridad > Fecha > Completado
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    
    const scores: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const scoreA = scores[a.impact || 'medium'];
    const scoreB = scores[b.impact || 'medium'];
    
    if (scoreA !== scoreB) return scoreB - scoreA;
    
    // Si tienen misma prioridad, la fecha más próxima va primero
    if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });

  const getPriorityBadge = (impact: string = 'medium') => {
    const configs = {
      high: { label: 'Alta', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: <ArrowUp size={10} strokeWidth={3} /> },
      medium: { label: 'Media', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: <Minus size={10} strokeWidth={3} /> },
      low: { label: 'Baja', color: 'text-slate-500 bg-slate-100 border-slate-200', icon: <ArrowDown size={10} strokeWidth={3} /> }
    };
    const key = impact as keyof typeof configs;
    const config = configs[key];
    
    return (
      <span className={`text-[9px] px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider flex items-center gap-1.5 ${config.color}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Limpio */}
      <div className="flex justify-between items-center mb-4 px-1 shrink-0">
         <div className="flex flex-col">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                {compact ? 'Accionables' : 'Backlog Operativo'}
            </h3>
            {!compact && <p className="text-[10px] text-slate-400 font-medium">Sprint actual</p>}
         </div>
         <button 
           onClick={() => setIsAdding(true)} 
           className="text-xs font-bold bg-slate-900 text-white hover:bg-black px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 shadow-sm"
         >
            <Plus size={14}/> Crear Tarea
         </button>
      </div>

      {/* Input Rápido estilo "Linear" */}
      {isAdding && (
        <div className="mb-4 p-1 bg-white border border-slate-200 rounded-xl shadow-sm animate-in fade-in zoom-in-95 duration-200 shrink-0 ring-4 ring-slate-50">
            <input 
              autoFocus type="text" placeholder="Escribe el accionable..." 
              className="w-full text-sm font-bold text-slate-800 px-4 py-3 outline-none placeholder:text-slate-300"
              value={title} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            
            <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-slate-50">
               <div className="flex gap-2">
                   <select 
                     value={impact} onChange={(e) => setImpact(e.target.value as any)}
                     className="text-[10px] font-bold bg-slate-50 text-slate-600 rounded-lg px-2 py-1 outline-none border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors uppercase tracking-wide"
                   >
                     <option value="high">Prioridad Alta</option>
                     <option value="medium">Prioridad Media</option>
                     <option value="low">Prioridad Baja</option>
                   </select>
                   <input 
                     type="date" 
                     value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                     className="text-[10px] font-bold bg-slate-50 text-slate-600 rounded-lg px-2 py-1 outline-none border border-slate-100 cursor-pointer hover:bg-slate-100"
                   />
               </div>
               <div className="flex gap-2">
                   <button onClick={() => setIsAdding(false)} className="px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-600">Cancelar</button>
                   <button onClick={handleSubmit} className="px-3 py-1 text-[10px] font-bold bg-emerald-500 text-white rounded-md hover:bg-emerald-600 shadow-sm">Guardar</button>
               </div>
            </div>
        </div>
      )}

      {/* Lista Agile */}
      <div className="space-y-1 overflow-y-auto flex-1 pr-1 custom-scrollbar">
        {tasks.length === 0 && !isAdding && (
            <div className="h-32 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-xs font-medium">No hay tareas pendientes</p>
            </div>
        )}

        {sortedTasks.map((task) => (
          <div 
            key={task.id} 
            className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
              task.completed 
                ? 'bg-slate-50 border-transparent opacity-50' 
                : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
            }`}
          >
            {/* Checkbox */}
            <button 
                onClick={() => onToggle(task.id, task.completed)}
                className={`shrink-0 transition-colors ${
                  task.completed ? 'text-slate-400' : 'text-slate-300 hover:text-emerald-500'
                }`}
            >
              {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            </button>
            
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {task.title}
                    </span>
                    
                    {/* Botón Eliminar (Solo visible en hover) */}
                    <button 
                        onClick={() => onDelete(task.id)} 
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>

                {/* Metadata Row */}
                <div className="flex items-center gap-2 mt-1">
                    {!compact && getPriorityBadge(task.impact)}
                    
                    {task.dueDate && (
                        <span className={`text-[9px] flex items-center gap-1 font-semibold ${
                            new Date(task.dueDate) < new Date() && !task.completed ? 'text-rose-500' : 'text-slate-400'
                        }`}>
                           <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                    )}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};