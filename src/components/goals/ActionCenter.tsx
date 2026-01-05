'use client';
import { useState } from 'react';
import { AlertOctagon, CheckCircle2, Circle, Plus, X } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  blocked: boolean;
  blockerDescription?: string;
}

interface ActionCenterProps {
  tasks: Task[];
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
    const newTask: Task = { id: Date.now(), title: newTaskTitle, completed: false, blocked: false };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setIsAdding(false);
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center px-2">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roadmap de Crecimiento</h3>
         <button onClick={() => setIsAdding(true)} className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
            <Plus size={14}/> Nuevo Hito
         </button>
      </div>

      {isAdding && (
        <div className="p-6 bg-white border border-violet-100 rounded-[2rem] shadow-sm animate-in fade-in slide-in-from-top-2">
            <input 
              autoFocus type="text" placeholder="¿Qué hito quieres alcanzar?" 
              className="w-full text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300 mb-4"
              value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
            <div className="flex justify-end gap-2">
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-xl">Cancelar</button>
                <button onClick={addTask} className="px-4 py-2 text-xs font-bold bg-violet-500 text-white rounded-xl hover:bg-violet-600">Fijar Hito</button>
            </div>
        </div>
      )}

      {tasks.map((task) => (
        <div 
          key={task.id} 
          className={`p-5 rounded-[1.8rem] border transition-all group ${
            task.blocked ? 'bg-rose-50 border-rose-100' : 
            task.completed ? 'bg-slate-50 border-transparent opacity-60' : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          <div className="flex gap-4">
            <button 
                onClick={() => toggleTask(task.id)}
                className={`mt-1 transition-colors ${task.blocked ? 'text-rose-500 cursor-not-allowed' : task.completed ? 'text-emerald-500' : 'text-slate-200 hover:text-emerald-400'}`}
            >
              {task.blocked ? <AlertOctagon size={20} /> : task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            </button>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <p className={`text-sm font-bold tracking-tight ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {task.title}
                </p>
                <button onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))} className="text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={14} />
                </button>
              </div>
              
              {task.blocked && task.blockerDescription && (
                <div className="mt-3 p-3 bg-white/60 rounded-xl border border-rose-100/50">
                   <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Restricción detectada:</p>
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