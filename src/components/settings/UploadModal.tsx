'use client';
import { useState, useEffect } from 'react';
import { X, UploadCloud, Calendar, FileText, Globe } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onConfirm: (data: { batchName: string; currency: string; date: string }) => void;
  isProcessing: boolean;
}

export const UploadModal = ({ isOpen, onClose, file, onConfirm, isProcessing }: UploadModalProps) => {
  const [formData, setFormData] = useState({
    batchName: '',
    currency: 'CLP',
    date: new Date().toISOString().split('T')[0]
  });

  // Pre-llenar nombre cuando llega el archivo
  useEffect(() => {
    if (file) {
      setFormData(prev => ({ ...prev, batchName: file.name }));
    }
  }, [file]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
               <UploadCloud size={20} />
            </div>
            <div>
               <h3 className="font-black text-slate-800 text-lg">Configurar Carga</h3>
               <p className="text-xs text-slate-400 font-medium">Define los parámetros de este lote</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>

        <div className="space-y-4">
          {/* Nombre del Lote (Alias) */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre del Archivo / Lote</label>
            <div className="flex items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
               <FileText size={16} className="text-slate-400 mr-2" />
               <input 
                 type="text" 
                 value={formData.batchName}
                 onChange={(e) => setFormData({...formData, batchName: e.target.value})}
                 className="bg-transparent text-sm font-bold text-slate-700 w-full outline-none"
               />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Moneda */}
             <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Moneda Original</label>
                <div className="flex items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                   <Globe size={16} className="text-slate-400 mr-2" />
                   <select 
                     value={formData.currency}
                     onChange={(e) => setFormData({...formData, currency: e.target.value})}
                     className="bg-transparent text-sm font-bold text-slate-700 w-full outline-none cursor-pointer"
                   >
                      {['CLP', 'USD', 'BRL', 'EUR', 'COP', 'MXN'].map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
             </div>

             {/* Fecha de Carga (Para contabilidad) */}
             <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha Contable</label>
                <div className="flex items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                   <Calendar size={16} className="text-slate-400 mr-2" />
                   <input 
                     type="date"
                     value={formData.date}
                     onChange={(e) => setFormData({...formData, date: e.target.value})}
                     className="bg-transparent text-sm font-bold text-slate-700 w-full outline-none"
                   />
                </div>
             </div>
          </div>
        </div>

        <button 
          onClick={() => onConfirm(formData)}
          disabled={isProcessing}
          className="w-full mt-8 bg-slate-900 text-white py-4 rounded-xl font-black text-sm hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
        >
          {isProcessing ? 'Procesando con IA...' : 'Confirmar e Importar'}
        </button>
      </div>
    </div>
  );
};