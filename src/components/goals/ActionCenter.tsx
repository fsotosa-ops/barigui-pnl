'use client';
import { useState } from 'react';
import { AlertOctagon, CheckCircle2, Circle, Plus, Trash2, Calendar, Zap } from 'lucide-react';
import { Task } from '@/types/finance';

interface ActionCenterProps {
  tasks: Task[];
  // Definición estricta de lo que se enviará al padre
  onAdd: (task: { title: string; impact: 'high' | 'medium' | 'low'; dueDate: string }) => void;
  onToggle: (id: number, currentStatus: boolean) => void;
  onDelete: (id: number) => void;
}

export const ActionCenter = ({ tasks, onAdd, onToggle, onDelete }: ActionCenterProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [impact, setImpact] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({ title, impact, dueDate });
    setTitle('');
    setImpact('medium');
    setDueDate('');
    setIsAdding(false);
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.blocked !== b.blocked) return a.blocked ? -1 : 1;
    
    // Mapeo seguro de impacto
    const scores: Record<string, number> = { high: 3, medium: 2, low: 1 };
    // Fallback a 0 si impact es undefined
    const scoreA = scores[a.impact || 'medium'];
    const scoreB = scores[b.impact || 'medium'];
    
    if (scoreA !== scoreB) return scoreB - scoreA;
    return 0;
  });

  const getImpactColor = (impact: string = 'medium') => {
    switch(impact) {
      case 'high': return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'medium': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  // ... (Resto del renderizado igual que antes)
  return (
    <section className="space-y-5">
      <div className="flex justify-between items-center px-1">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roadmap Estratégico</h3>
         <button onClick={() => setIsAdding(true)} className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
            <Plus size={14}/> Nuevo Objetivo
         </button>
      </div>

      {isAdding && (
        <div className="p-5 bg-white border border-violet-100 rounded-[1.5rem] shadow-lg animate-in fade-in slide-in-from-top-2">
            <input 
              autoFocus type="text" placeholder="¿Qué hito mueve la aguja?" 
              className="w-full text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300 mb-4"
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-3 mb-4">
               <select 
                 value={impact} onChange={(e) => setImpact(e.target.value as any)}
                 className="text-xs font-bold bg-slate-50 text-slate-600 rounded-lg p-2 outline-none border border-slate-200 cursor-pointer"
               >
                 <option value="high">🔥 Alto Impacto</option>
                 <option value="medium">🔹 Impacto Medio</option>
                 <option value="low">🔸 Mantenimiento</option>
               </select>
               <input 
                 type="date" 
                 value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                 className="text-xs font-bold bg-slate-50 text-slate-600 rounded-lg p-2 outline-none border border-slate-200 cursor-pointer"
               />
            </div>
            <div className="flex justify-end gap-2">
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSubmit} className="px-4 py-2 text-xs font-bold bg-violet-600 text-white rounded-xl hover:bg-violet-700 shadow-md transition-all">Guardar Hito</button>
            </div>
        </div>
      )}

      <div className="space-y-3">
        {sortedTasks.map((task) => (
          <div key={task.id} className={`p-4 rounded-[1.5rem] border transition-all group hover:shadow-md ${task.blocked ? 'bg-rose-50 border-rose-100' : task.completed ? 'bg-slate-50 border-transparent opacity-60' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex gap-4 items-start">
              <button onClick={() => onToggle(task.id, task.completed)} className={`mt-1 shrink-0 transition-colors ${task.blocked ? 'text-rose-500 cursor-not-allowed' : task.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-400'}`}>
                {task.blocked ? <AlertOctagon size={20} /> : task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className={`text-sm font-bold truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</p>
                  <button onClick={() => onDelete(task.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"><Trash2 size={14} /></button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide flex items-center gap-1 ${getImpactColor(task.impact)}`}>
                        <Zap size={10} /> {task.impact === 'high' ? 'Crítico' : task.impact === 'medium' ? 'Normal' : 'Bajo'}
                    </span>
                    {task.dueDate && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                           <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                    )}
                </div>
                {task.blocked && task.blockerDescription && (
                  <div className="mt-2 flex items-center gap-2 text-rose-600 bg-rose-100/50 px-2 py-1 rounded-lg w-fit">
                     <AlertOctagon size={12} />
                     <p className="text-[10px] font-bold leading-snug">{task.blockerDescription}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};