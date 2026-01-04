// components/dashboard/ScenarioSelector.tsx
import { LineChart } from 'lucide-react';

interface ScenarioProps {
  current: 'base' | 'worst' | 'best';
  onChange: (s: 'base' | 'worst' | 'best') => void;
}

export const ScenarioSelector = ({ current, onChange }: ScenarioProps) => {
  return (
    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
      <div className="px-2 text-slate-400">
        <LineChart size={16} />
      </div>
      {(['base', 'worst', 'best'] as const).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
            current === s 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {s === 'base' ? 'Base' : s === 'worst' ? 'Crisis' : 'Ideal'}
        </button>
      ))}
    </div>
  );
};