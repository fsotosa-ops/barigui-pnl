'use client';
import { useState } from 'react';
import { AlertOctagon, CheckCircle2, Circle, ChevronRight, Plus, X } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  blocked: boolean;
  blockerDescription?: string;
}

interface ActionCenterProps {
  tasks: Task[];
  // Si tuvieras persistencia real, aquí irían los handlers onUpdate, onDelete, etc.
}

export const ActionCenter = ({ tasks: initialTasks }: ActionCenterProps) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
        id: Date.now(),
        title: newTaskTitle,
        completed: false,
        blocked: false
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setIsAdding(false);
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center px-2">
         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ruta Crítica</h3>
         <button onClick={() => setIsAdding(true)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            <Plus size={14}/> Agregar
         </button>
      </div>

      {isAdding && (
        <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2">
            <input 
              autoFocus
              type="text" 
              placeholder="Nueva restricción..." 
              className="w-full text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300 mb-3"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
            <div className="flex justify-end gap-2">
                <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-lg">Cancelar</button>
                <button onClick={addTask} className="px-3 py-1.5 text-xs font-bold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">Guardar</button>
            </div>
        </div>
      )}

      {tasks.map((task) => (
        <div 
          key={task.id} 
          className={`p-4 rounded-2xl border transition-all group ${
            task.blocked ? 'bg-rose-50 border-rose-100' : 
            task.completed ? 'bg-slate-50 border-transparent opacity-60' : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          <div className="flex gap-4">
            <button 
                onClick={() => toggleTask(task.id)}
                className={`mt-1 transition-colors ${task.blocked ? 'text-rose-500 cursor-not-allowed' : task.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-400'}`}
            >
              {task.blocked ? <AlertOctagon size={18} /> : task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            </button>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <p className={`text-sm font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {task.title}
                </p>
                {/* Botón para eliminar (solo visible en hover) */}
                <button onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))} className="text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={14} />
                </button>
              </div>
              
              {task.blocked && task.blockerDescription && (
                <div className="mt-2 p-2 bg-white/60 rounded-lg border border-rose-100/50">
                   <p className="text-[10px] font-bold text-rose-600 uppercase tracking-tight mb-0.5">Bloqueo:</p>
                   <p className="text-xs text-rose-700 leading-snug">{task.blockerDescription}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
};