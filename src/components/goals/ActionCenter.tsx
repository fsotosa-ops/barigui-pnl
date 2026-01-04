import { AlertOctagon, CheckCircle2, Circle, ChevronRight } from 'lucide-react';

// Definimos qué es una "Tarea"
interface Task {
  id: number;
  title: string;
  completed: boolean;
  blocked: boolean;
  blockerDescription?: string; // El signo ? significa que es opcional
}

interface ActionCenterProps {
  tasks: Task[];
}

export const ActionCenter = ({ tasks }: ActionCenterProps) => {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Ruta Crítica</h3>

      {tasks.map((task: Task) => ( // Aquí le decimos que cada elemento es tipo Task
        <div 
          key={task.id} 
          className={`p-4 rounded-2xl border transition-all ${
            task.blocked ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          <div className="flex gap-4">
            <div className={`mt-1 ${task.blocked ? 'text-rose-500' : task.completed ? 'text-emerald-500' : 'text-slate-300'}`}>
              {task.blocked ? <AlertOctagon size={18} /> : task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <p className={`text-sm font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {task.title}
                </p>
                <ChevronRight size={14} className="text-slate-300" />
              </div>
              {task.blocked && task.blockerDescription && (
                <div className="mt-2 p-2 bg-white/50 rounded-lg">
                   <p className="text-[10px] font-bold text-rose-600 uppercase tracking-tight">Bloqueo:</p>
                   <p className="text-xs text-rose-700 leading-tight">{task.blockerDescription}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
};