'use client';
import { Trash2, FileText, Calendar, AlertCircle } from 'lucide-react';
import { ImportBatch } from '@/types/finance';

interface ImportHistoryProps {
  batches: ImportBatch[];
  onDeleteBatch: (id: string) => void;
}

export const ImportHistory = ({ batches, onDeleteBatch }: ImportHistoryProps) => {
  if (batches.length === 0) {
    return (
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center text-slate-400">
        <p className="text-sm font-medium">No hay historial de importaciones.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><FileText size={24} /></div>
        <div>
          <h3 className="text-lg font-black text-slate-900">Historial de Cargas</h3>
          <p className="text-xs text-slate-500 font-medium">Gestiona los archivos que has procesado</p>
        </div>
      </div>

      <div className="space-y-3">
        {batches.map((batch) => (
          <div key={batch.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-white rounded-lg text-slate-400 shadow-sm">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{batch.filename}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black uppercase bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                    {batch.currency}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(batch.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] text-slate-400">• {batch.record_count} registros</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => confirm('¿Eliminar este lote y TODAS sus transacciones asociadas?') && onDeleteBatch(batch.id)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-rose-100 text-rose-500 rounded-xl text-xs font-bold hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              <Trash2 size={14} /> Deshacer Carga
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex items-start gap-2 bg-amber-50 p-4 rounded-xl text-amber-700 text-xs">
         <AlertCircle size={16} className="shrink-0 mt-0.5" />
         <p>Al eliminar un lote, se borrarán permanentemente todas las transacciones que contenía. Usa esto si cargaste un archivo con la moneda incorrecta.</p>
      </div>
    </div>
  );
};